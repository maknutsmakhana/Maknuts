import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  StoreSettings, 
  Order, 
  Feedback, 
  ReviewItem, 
  GalleryPhoto, 
  OrderTrackingInfo, 
  PaymentStatus, 
  OrderPricingSnapshot,
  OrderAuditEntry,
  Coupon,
  getOrderTrackingKey 
} from '../types';
import { DEFAULT_PRODUCT, DEFAULT_SETTINGS } from '../constants';
import { optimizeProductForFirestore, optimizeSettingsForFirestore } from '../utils/imageCompressor';
import { calculateOrderPricing, generateUniqueOrderId, round2, validateAndApplyCoupon } from '../utils/pricing';
import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { validateReviewForm, checkReviewCooldown, recordReviewSubmission } from '../utils/reviews';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(sanitizeForFirestore) as any;
  }
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }
  return data;
}

interface StoreContextType {
  products: Product[];
  activeProduct: Product;
  setActiveProductId: (id: string) => void;
  storeSettings: StoreSettings;
  orders: Order[];
  feedbacks: Feedback[];
  reviews: ReviewItem[];
  isLoading: boolean;
  adminUser: User | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminRegister: (email: string, password: string) => Promise<void>;
  adminResetPassword: (email: string) => Promise<void>;
  adminLogout: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'paymentStatus'> & { paymentStatus?: PaymentStatus }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  updateOrderFinancials: (
    orderId: string, 
    financialUpdates: {
      quantity: number;
      unitPrice: number;
      discountAmount: number;
      deliveryCharge: number;
    },
    adminNote?: string
  ) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
  archiveAllOrders: () => Promise<number>;
  trackCustomerOrder: (orderNumber: string, phone: string) => Promise<OrderTrackingInfo | null>;
  verifyOrderForReview: (orderId?: string, phone?: string) => Promise<boolean>;
  submitCustomerReview: (data: {
    name: string;
    rating: number;
    comment: string;
    orderId?: string;
    phone?: string;
    location?: string;
    photo?: string;
  }) => Promise<{ success: boolean; reviewId: string; verifiedBuyer: boolean }>;
  approveReview: (reviewId: string) => Promise<void>;
  rejectReview: (reviewId: string) => Promise<void>;
  deleteReview: (reviewId: string, index?: number) => Promise<void>;
  updateReviewText: (reviewId: string, newComment: string) => Promise<void>;
  updateStoreReply: (reviewId: string, replyText: string | null) => Promise<void>;
  submitFeedback: (feedbackData: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  submitReviewAndFeedback: (reviewData: Omit<ReviewItem, 'id' | 'createdAt' | 'status'> & { status?: ReviewItem['status'] }) => Promise<void>;
  deleteReviewAndFeedback: (id: string, index?: number) => Promise<void>;
  addGalleryPhoto: (photo: GalleryPhoto) => Promise<void>;
  deleteGalleryPhoto: (photoId: string, index?: number) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([DEFAULT_PRODUCT]);
  const [activeProductId, setActiveProductId] = useState<string>(DEFAULT_PRODUCT.id);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Monitor Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Admin login using Firebase Authentication Email/Password
  const adminLogin = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  // Initial admin registration if needed
  const adminRegister = async (email: string, password: string): Promise<void> => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  };

  // Admin password reset email
  const adminResetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Admin logout
  const adminLogout = async (): Promise<void> => {
    await signOut(auth);
  };

  // 1. Realtime Firestore Sync for Products
  useEffect(() => {
    const productsPath = 'products';
    const unsubscribe = onSnapshot(
      collection(db, productsPath),
      async (snapshot) => {
        if (snapshot.empty) {
          // Initial online seeding with Maknuts Makhana product
          try {
            const safeDefault = await optimizeProductForFirestore(DEFAULT_PRODUCT);
            await setDoc(doc(db, productsPath, DEFAULT_PRODUCT.id), sanitizeForFirestore(safeDefault));
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `${productsPath}/${DEFAULT_PRODUCT.id}`);
          }
        } else {
          const prods: Product[] = [];
          snapshot.forEach((d) => {
            prods.push(d.data() as Product);
          });
          setProducts(prods);
          // Keep active product updated if exists
          if (!prods.some(p => p.id === activeProductId)) {
            setActiveProductId(prods[0]?.id || DEFAULT_PRODUCT.id);
          }
        }
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, productsPath);
      }
    );

    return () => unsubscribe();
  }, [activeProductId]);

  // 2. Realtime Firestore Sync for Store Settings
  useEffect(() => {
    const settingsPath = 'settings';
    const settingsDocPath = `${settingsPath}/store`;
    const unsubscribe = onSnapshot(
      doc(db, settingsPath, 'store'),
      async (snapshot) => {
        if (!snapshot.exists()) {
          // Initial online seeding with default settings
          try {
            await setDoc(doc(db, settingsPath, 'store'), DEFAULT_SETTINGS);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, settingsDocPath);
          }
        } else {
          const data = snapshot.data() as StoreSettings;
          delete (data as any).adminPassword;
          setStoreSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            trustBadges: data.trustBadges || DEFAULT_SETTINGS.trustBadges,
            buttons: { ...DEFAULT_SETTINGS.buttons, ...(data.buttons || {}) },
            benefitsSection: {
              ...DEFAULT_SETTINGS.benefitsSection,
              ...(data.benefitsSection || {}),
              items: data.benefitsSection?.items || DEFAULT_SETTINGS.benefitsSection.items
            },
            reviewsSection: {
              ...DEFAULT_SETTINGS.reviewsSection,
              ...(data.reviewsSection || {}),
              reviews: Array.isArray(data.reviewsSection?.reviews)
                ? data.reviewsSection.reviews
                : DEFAULT_SETTINGS.reviewsSection.reviews
            },
            gallerySection: {
              ...DEFAULT_SETTINGS.gallerySection,
              ...(data.gallerySection || {}),
              photos: Array.isArray(data.gallerySection?.photos)
                ? data.gallerySection.photos
                : DEFAULT_SETTINGS.gallerySection.photos
            },
            footerText: { 
              ...DEFAULT_SETTINGS.footerText, 
              ...(data.footerText || {}),
              craftedBy: (!data.footerText?.craftedBy || data.footerText.craftedBy === 'Crafted for pure health by Saroj 😊')
                ? DEFAULT_SETTINGS.footerText.craftedBy
                : data.footerText.craftedBy
            },
            policies: { ...DEFAULT_SETTINGS.policies, ...(data.policies || {}) },
            sectionVisibility: { ...DEFAULT_SETTINGS.sectionVisibility, ...(data.sectionVisibility || {}) },
            sectionOrder: Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0 ? data.sectionOrder : DEFAULT_SETTINGS.sectionOrder,
            heroSection: { ...DEFAULT_SETTINGS.heroSection, ...(data.heroSection || {}) },
            promoBanner: { ...DEFAULT_SETTINGS.promoBanner, ...(data.promoBanner || {}) },
            foodCompliance: {
              ...DEFAULT_SETTINGS.foodCompliance,
              ...(data.foodCompliance || {}),
              nutrition: { ...(DEFAULT_SETTINGS.foodCompliance?.nutrition || {}), ...(data.foodCompliance?.nutrition || {}) },
              claims: { ...(DEFAULT_SETTINGS.foodCompliance?.claims || {}), ...(data.foodCompliance?.claims || {}) }
            },
            coupons: Array.isArray(data.coupons) ? data.coupons : DEFAULT_SETTINGS.coupons,
            faqs: Array.isArray(data.faqs) ? data.faqs : DEFAULT_SETTINGS.faqs,
            faqShowContactCallout: data.faqShowContactCallout !== undefined ? Boolean(data.faqShowContactCallout) : DEFAULT_SETTINGS.faqShowContactCallout,
            faqContactCalloutText: data.faqContactCalloutText || DEFAULT_SETTINGS.faqContactCalloutText,
            faqContactButtonText: data.faqContactButtonText || DEFAULT_SETTINGS.faqContactButtonText,
            seo: { ...DEFAULT_SETTINGS.seo, ...(data.seo || {}) },
            whatsAppSettings: { ...DEFAULT_SETTINGS.whatsAppSettings, ...(data.whatsAppSettings || {}) },
            orderDisplaySettings: {
              ...DEFAULT_SETTINGS.orderDisplaySettings,
              ...(data.orderDisplaySettings || {}),
              ...(data.whatsAppSettings?.orderDisplaySettings || {})
            },
            socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(data.socialLinks || {}) },
            mediaLibrary: Array.isArray(data.mediaLibrary) ? data.mediaLibrary : DEFAULT_SETTINGS.mediaLibrary,
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, settingsDocPath);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Realtime Firestore Sync for Orders (Restricted to authenticated admin)
  useEffect(() => {
    if (!adminUser) {
      setOrders([]);
      return;
    }

    const ordersPath = 'orders';
    const unsubscribe = onSnapshot(
      collection(db, ordersPath),
      (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((d) => {
          orderList.push(d.data() as Order);
        });
        // Sort descending by creation date
        orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(orderList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, ordersPath);
      }
    );

    return () => unsubscribe();
  }, [adminUser]);

  // 4. Realtime Firestore Sync for Customer Reviews & Feedbacks
  useEffect(() => {
    const feedbacksPath = 'feedbacks';
    // Admin receives all reviews (pending, approved, rejected).
    // Public non-admin users only query approved reviews.
    const feedbacksQuery = adminUser
      ? collection(db, feedbacksPath)
      : query(collection(db, feedbacksPath), where('status', '==', 'approved'));

    const unsubscribe = onSnapshot(
      feedbacksQuery,
      (snapshot) => {
        const feedbackList: Feedback[] = [];
        const reviewList: ReviewItem[] = [];

        snapshot.forEach((d) => {
          const data = d.data();
          const itemStatus = (data.status as 'pending' | 'approved' | 'rejected') || 'pending';
          
          feedbackList.push(data as Feedback);

          // Find fallback from settings or default constants to prevent wiped comments
          const settingsMatch = (storeSettings.reviewsSection?.reviews || []).find(sr => sr.id === d.id) ||
            DEFAULT_SETTINGS.reviewsSection?.reviews?.find(sr => sr.id === d.id);

          const rawComment = (data.comment || data.message || '').trim();
          const fallbackComment = (settingsMatch?.comment || settingsMatch?.originalComment || '').trim();
          const effectiveComment = rawComment || fallbackComment;

          const rawName = (data.name || data.customerName || '').trim();
          const fallbackName = (settingsMatch?.name || 'Customer').trim();
          const effectiveName = rawName || fallbackName;

          const effectiveLocation = data.location || settingsMatch?.location || '';
          const effectiveRating = data.rating !== undefined && data.rating !== null && !isNaN(Number(data.rating))
            ? Math.min(5, Math.max(1, Math.round(Number(data.rating))))
            : (settingsMatch?.rating || 5);

          const effectiveStatus = (data.status as 'pending' | 'approved' | 'rejected') || settingsMatch?.status || itemStatus;
          const effectiveVerifiedBuyer = data.verifiedBuyer !== undefined 
            ? Boolean(data.verifiedBuyer) 
            : (settingsMatch?.verifiedBuyer ?? true);

          const effectiveOriginalComment = data.originalComment || settingsMatch?.originalComment || (fallbackComment && fallbackComment !== effectiveComment ? fallbackComment : undefined);

          const effectiveStoreReply = data.storeReply !== undefined && data.storeReply !== null && data.storeReply !== ''
            ? data.storeReply
            : settingsMatch?.storeReply;

          const effectiveStoreReplyAt = data.storeReplyAt !== undefined && data.storeReplyAt !== null && data.storeReplyAt !== ''
            ? data.storeReplyAt
            : settingsMatch?.storeReplyAt;

          // Self-heal: If document was saved without comment, update Firestore asynchronously with preserved comment
          if (!rawComment && fallbackComment && adminUser) {
            setDoc(d.ref, sanitizeForFirestore({
              comment: fallbackComment,
              message: fallbackComment,
              name: effectiveName,
              rating: effectiveRating,
              status: effectiveStatus,
            }), { merge: true }).catch(() => {});
          }

          reviewList.push({
            id: d.id,
            name: effectiveName,
            location: effectiveLocation,
            rating: effectiveRating,
            comment: effectiveComment,
            originalComment: effectiveOriginalComment,
            adminEditedAt: data.adminEditedAt || settingsMatch?.adminEditedAt,
            orderId: data.orderId || settingsMatch?.orderId,
            phone: data.phone || settingsMatch?.phone,
            email: data.email || settingsMatch?.email,
            photo: data.photo || settingsMatch?.photo,
            category: data.category || settingsMatch?.category,
            status: effectiveStatus,
            verifiedBuyer: effectiveVerifiedBuyer,
            verifiedOrderNumber: data.verifiedOrderNumber || settingsMatch?.verifiedOrderNumber,
            storeReply: effectiveStoreReply,
            storeReplyAt: effectiveStoreReplyAt,
            createdAt: data.createdAt || settingsMatch?.createdAt || new Date().toISOString(),
          });
        });

        feedbackList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFeedbacks(feedbackList);

        // Merge with any approved reviews stored in storeSettings (e.g. initial seed)
        const settingsReviews = storeSettings.reviewsSection?.reviews && storeSettings.reviewsSection.reviews.length > 0
          ? storeSettings.reviewsSection.reviews
          : (DEFAULT_SETTINGS.reviewsSection?.reviews || []);
        const existingIds = new Set(reviewList.map(r => r.id));
        const mergedReviews = [...reviewList];

        for (const sr of settingsReviews) {
          if (!existingIds.has(sr.id)) {
            const sStatus = (sr.status as 'pending' | 'approved' | 'rejected') || 'approved';
            // Only add if approved or if admin
            if (sStatus === 'approved' || adminUser) {
              mergedReviews.push({
                ...sr,
                status: sStatus,
                verifiedBuyer: sr.verifiedBuyer !== undefined ? sr.verifiedBuyer : true,
                createdAt: sr.createdAt || new Date().toISOString(),
              });
              existingIds.add(sr.id);
            }
          }
        }

        mergedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(mergedReviews);
      },
      (error) => {
        console.warn('Realtime sync feedbacks error:', error);
        // Fallback: load approved reviews from store settings
        const fallback = (storeSettings.reviewsSection?.reviews || [])
          .filter(r => (r.status || 'approved') === 'approved' || adminUser)
          .map(r => ({
            ...r,
            status: (r.status || 'approved') as 'pending' | 'approved' | 'rejected',
            createdAt: r.createdAt || new Date().toISOString(),
          }));
        setReviews(fallback);
      }
    );

    return () => unsubscribe();
  }, [adminUser, storeSettings.reviewsSection?.reviews]);

  const activeProduct = products.find(p => p.id === activeProductId) || products[0] || DEFAULT_PRODUCT;

  // Firebase Add Product
  const addProduct = async (newProdData: Omit<Product, 'id'>): Promise<Product> => {
    const newId = 'prod-' + Date.now();
    const newProduct: Product = {
      ...newProdData,
      id: newId,
    };
    try {
      const safeProduct = await optimizeProductForFirestore(newProduct);
      await setDoc(doc(db, 'products', newId), sanitizeForFirestore(safeProduct));
      return safeProduct;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `products/${newId}`);
    }
  };

  // Firebase Update Product
  const updateProduct = async (updated: Product): Promise<void> => {
    try {
      const safeUpdated = await optimizeProductForFirestore(updated);
      await setDoc(doc(db, 'products', updated.id), sanitizeForFirestore(safeUpdated));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `products/${updated.id}`);
    }
  };

  // Firebase Delete Product
  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  // Firebase Update Settings
  const updateSettings = async (updated: Partial<StoreSettings>): Promise<void> => {
    // Validate and sanitize numeric business settings
    const cleanDelivery = updated.deliveryCharge !== undefined
      ? Math.max(0, round2(Number(updated.deliveryCharge) || 0))
      : storeSettings.deliveryCharge;
    const cleanFreeThreshold = updated.freeDeliveryThreshold !== undefined
      ? Math.max(0, round2(Number(updated.freeDeliveryThreshold) || 0))
      : storeSettings.freeDeliveryThreshold;
    const cleanDiscountType = (updated.discountType || storeSettings.discountType) === 'fixed' ? 'fixed' : 'percentage';
    let cleanDiscountVal = updated.discountValue !== undefined
      ? Math.max(0, round2(Number(updated.discountValue) || 0))
      : storeSettings.discountValue;
    if (cleanDiscountType === 'percentage') {
      cleanDiscountVal = Math.min(100, cleanDiscountVal);
    }
    const cleanMinQty = updated.minOrderQuantity !== undefined
      ? Math.max(1, Math.floor(Number(updated.minOrderQuantity) || 1))
      : storeSettings.minOrderQuantity;
    const cleanMaxQty = updated.maxOrderQuantity !== undefined
      ? Math.max(cleanMinQty, Math.floor(Number(updated.maxOrderQuantity) || 20))
      : storeSettings.maxOrderQuantity;
    const cleanPrefix = updated.orderIdPrefix !== undefined
      ? (updated.orderIdPrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MK')
      : (storeSettings.orderIdPrefix || 'MK');

    const newSettings: StoreSettings = {
      ...storeSettings,
      ...updated,
      deliveryCharge: cleanDelivery,
      freeDeliveryThreshold: cleanFreeThreshold,
      freeDeliveryAllOrders: updated.freeDeliveryAllOrders !== undefined
        ? Boolean(updated.freeDeliveryAllOrders)
        : Boolean(storeSettings.freeDeliveryAllOrders),
      discountEnabled: updated.discountEnabled !== undefined
        ? Boolean(updated.discountEnabled)
        : Boolean(storeSettings.discountEnabled),
      discountType: cleanDiscountType,
      discountValue: cleanDiscountVal,
      minOrderQuantity: cleanMinQty,
      maxOrderQuantity: cleanMaxQty,
      orderIdPrefix: cleanPrefix,
      trustBadges: updated.trustBadges || storeSettings.trustBadges,
      buttons: {
        ...storeSettings.buttons,
        ...(updated.buttons || {})
      },
      benefitsSection: {
        ...storeSettings.benefitsSection,
        ...(updated.benefitsSection || {}),
        items: updated.benefitsSection?.items || storeSettings.benefitsSection?.items || []
      },
      reviewsSection: {
        ...storeSettings.reviewsSection,
        ...(updated.reviewsSection || {}),
        reviews: updated.reviewsSection?.reviews !== undefined
          ? updated.reviewsSection.reviews
          : (storeSettings.reviewsSection?.reviews || [])
      },
      gallerySection: {
        ...storeSettings.gallerySection,
        ...(updated.gallerySection || {}),
        photos: updated.gallerySection?.photos !== undefined
          ? updated.gallerySection.photos
          : (storeSettings.gallerySection?.photos || [])
      },
      footerText: {
        ...storeSettings.footerText,
        ...(updated.footerText || {})
      },
      policies: {
        ...storeSettings.policies,
        ...(updated.policies || {})
      },
      sectionVisibility: {
        ...storeSettings.sectionVisibility,
        ...(updated.sectionVisibility || {})
      },
      sectionOrder: Array.isArray(updated.sectionOrder)
        ? updated.sectionOrder
        : (storeSettings.sectionOrder || []),
      heroSection: {
        ...storeSettings.heroSection,
        ...(updated.heroSection || {})
      },
      promoBanner: {
        ...storeSettings.promoBanner,
        ...(updated.promoBanner || {})
      },
      foodCompliance: {
        ...storeSettings.foodCompliance,
        ...(updated.foodCompliance || {}),
        nutrition: {
          ...(storeSettings.foodCompliance?.nutrition || {}),
          ...(updated.foodCompliance?.nutrition || {})
        },
        claims: {
          ...(storeSettings.foodCompliance?.claims || {}),
          ...(updated.foodCompliance?.claims || {})
        }
      },
      coupons: updated.coupons !== undefined ? updated.coupons : (storeSettings.coupons || []),
      faqs: updated.faqs !== undefined ? updated.faqs : (storeSettings.faqs || []),
      seo: {
        ...storeSettings.seo,
        ...(updated.seo || {})
      },
      whatsAppSettings: {
        ...storeSettings.whatsAppSettings,
        ...(updated.whatsAppSettings || {})
      },
      orderDisplaySettings: {
        ...DEFAULT_SETTINGS.orderDisplaySettings,
        ...(storeSettings.orderDisplaySettings || {}),
        ...(updated.orderDisplaySettings || {}),
        ...(updated.whatsAppSettings?.orderDisplaySettings || {})
      },
      socialLinks: {
        ...storeSettings.socialLinks,
        ...(updated.socialLinks || {})
      },
      mediaLibrary: updated.mediaLibrary !== undefined ? updated.mediaLibrary : (storeSettings.mediaLibrary || [])
    };
    // Ensure no password is ever saved to Firestore settings
    delete (newSettings as any).adminPassword;

    try {
      const safeSettings = await optimizeSettingsForFirestore(newSettings);
      await setDoc(doc(db, 'settings', 'store'), sanitizeForFirestore(safeSettings));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/store');
    }
  };

  // Firebase Create Order with centralized calculation & immutable pricing snapshot
  const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'paymentStatus'> & { paymentStatus?: PaymentStatus }): Promise<Order> => {
    // Generate unique, collision-resistant order ID (e.g. MK-261008-A7F3)
    const orderNumber = generateUniqueOrderId(storeSettings.orderIdPrefix || 'MK');
    const orderId = 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    // Look up authoritative product record - do NOT trust client-manipulated unit price or discount
    const product = products.find(p => p.id === orderData.productId) || products[0] || DEFAULT_PRODUCT;
    
    // Look up applicable coupon if customer provided one - authoritative server-side validation
    const couponCode = orderData.couponCode?.trim().toUpperCase();
    let appliedCoupon: Coupon | null = null;
    if (couponCode) {
      const found = (storeSettings.coupons || []).find(c => c.code.trim().toUpperCase() === couponCode);
      if (found) {
        let localOrders: any[] = [];
        try {
          const localOrdersRaw = localStorage.getItem('maknuts_my_orders');
          localOrders = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
        } catch {
          // ignore
        }
        const allKnownOrders = [...(orders || []), ...localOrders];

        const validation = validateAndApplyCoupon(
          couponCode,
          storeSettings.coupons || [],
          product.price * orderData.quantity,
          product.id,
          orderData.phone,
          allKnownOrders
        );
        if (validation.isValid && validation.coupon) {
          appliedCoupon = validation.coupon;
        }
      }
    }

    // Centralized calculation with business rules (min/max qty, discount logic, coupon, free delivery threshold)
    const pricing = calculateOrderPricing({
      productPrice: product.price,
      originalPrice: product.originalPrice,
      quantity: orderData.quantity,
      settings: storeSettings,
      appliedCoupon,
      productId: product.id,
      customerPhone: orderData.phone,
    });

    // Create immutable pricing snapshot frozen at purchase time
    const pricingSnapshot: OrderPricingSnapshot = {
      productId: product.id,
      productName: product.name,
      unitPrice: pricing.unitPrice,
      originalPrice: pricing.originalPrice,
      quantity: pricing.quantity,
      baseAmount: pricing.baseAmount,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      discountAmount: pricing.discountAmount,
      couponCode: pricing.couponCode,
      couponType: pricing.couponType,
      couponDiscount: pricing.couponDiscount,
      subtotal: pricing.subtotal,
      deliveryCharge: pricing.deliveryCharge,
      totalAmount: pricing.finalTotal,
    };

    // Strictly keep only valid payment method ('upi' or 'cod')
    const paymentMethod: 'upi' | 'cod' = orderData.paymentMethod === 'cod' ? 'cod' : 'upi';

    // Initial payment status controlled securely
    const paymentStatus: PaymentStatus = paymentMethod === 'cod' ? 'COD Pending' : 'Pending';

    // UTR number optional only for UPI, trimmed, never on COD
    const upiRefNumber = paymentMethod === 'upi' && orderData.upiRefNumber
      ? orderData.upiRefNumber.trim()
      : undefined;

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber,
      productId: product.id,
      productName: product.name,
      productWeight: product.weight,
      quantity: pricing.quantity,
      unitPrice: pricing.unitPrice,
      originalPrice: pricing.originalPrice,
      baseAmount: pricing.baseAmount,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      discountAmount: pricing.discountAmount,
      couponCode: pricing.couponCode,
      couponType: pricing.couponType,
      couponDiscount: pricing.couponDiscount,
      subtotal: pricing.subtotal,
      deliveryCharge: pricing.deliveryCharge,
      totalAmount: pricing.finalTotal,
      pricingSnapshot,
      auditHistory: [],
      paymentMethod,
      paymentStatus,
      upiRefNumber,
      paymentScreenshot: undefined, // No base64 screenshots stored
      note: orderData.note?.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };

    const trackingKey = getOrderTrackingKey(orderNumber, orderData.phone);
    const trackingInfo: OrderTrackingInfo = {
      id: trackingKey,
      orderNumber,
      phoneLast4: orderData.phone.replace(/\D/g, '').slice(-4),
      createdAt: newOrder.createdAt,
      productId: newOrder.productId,
      productName: newOrder.productName,
      productWeight: newOrder.productWeight,
      quantity: newOrder.quantity,
      unitPrice: newOrder.unitPrice,
      baseAmount: newOrder.baseAmount,
      discountAmount: newOrder.discountAmount,
      subtotal: newOrder.subtotal,
      deliveryCharge: newOrder.deliveryCharge,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
      status: 'Pending',
    };

    try {
      // 1. Save full order document for admin
      await setDoc(doc(db, 'orders', orderId), sanitizeForFirestore(newOrder));

      // 2. Save sanitized public tracking document keyed by exact (orderNumber_phone10)
      try {
        await setDoc(doc(db, 'orderTracking', trackingKey), sanitizeForFirestore(trackingInfo));
      } catch (trackErr) {
        console.warn('Could not save orderTracking doc:', trackErr);
      }

      // Cache order in customer local storage so customer can track on their device
      try {
        const raw = localStorage.getItem('maknuts_my_orders');
        const list = raw ? JSON.parse(raw) : [];
        localStorage.setItem('maknuts_my_orders', JSON.stringify([newOrder, ...list.filter((o: any) => o.id !== newOrder.id)].slice(0, 30)));
      } catch {
        // Non-fatal
      }

      // 3. Increment coupon usage count upon successful order creation
      if (appliedCoupon) {
        try {
          const updatedCoupons = (storeSettings.coupons || []).map(c => {
            if (c.id === appliedCoupon!.id || c.code.trim().toUpperCase() === appliedCoupon!.code.trim().toUpperCase()) {
              return {
                ...c,
                usedCount: (c.usedCount || 0) + 1,
              };
            }
            return c;
          });
          setStoreSettings(prev => ({ ...prev, coupons: updatedCoupons }));
          if (auth.currentUser) {
            await setDoc(doc(db, 'settings', 'store'), sanitizeForFirestore({ coupons: updatedCoupons }), { merge: true }).catch(() => {});
          }
        } catch (couponErr) {
          console.warn('Coupon usage increment note:', couponErr);
        }
      }

      return newOrder;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  // Firebase Update Order Financials (Admin correction with full audit logging)
  const updateOrderFinancials = async (
    orderId: string,
    financialUpdates: {
      quantity: number;
      unitPrice: number;
      discountAmount: number;
      deliveryCharge: number;
    },
    adminNote?: string
  ): Promise<void> => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) {
      throw new Error('Order not found');
    }

    const newQty = Math.max(1, Math.floor(Number(financialUpdates.quantity) || 1));
    const newUnitPrice = Math.max(0, round2(Number(financialUpdates.unitPrice) || 0));
    const newBaseAmount = round2(newUnitPrice * newQty);
    const newDiscount = Math.max(0, Math.min(newBaseAmount, round2(Number(financialUpdates.discountAmount) || 0)));
    const newSubtotal = Math.max(0, round2(newBaseAmount - newDiscount));
    const newDelivery = Math.max(0, round2(Number(financialUpdates.deliveryCharge) || 0));
    const newTotal = Math.max(0, round2(newSubtotal + newDelivery));

    const now = new Date().toISOString();
    const adminId = adminUser?.email || 'admin';
    const auditEntries: OrderAuditEntry[] = [...(targetOrder.auditHistory || [])];

    if (targetOrder.quantity !== newQty) {
      auditEntries.push({
        changedAt: now,
        changedBy: adminId,
        field: 'Quantity',
        oldValue: targetOrder.quantity,
        newValue: newQty,
        note: adminNote,
      });
    }
    if (targetOrder.unitPrice !== newUnitPrice) {
      auditEntries.push({
        changedAt: now,
        changedBy: adminId,
        field: 'Unit Price',
        oldValue: `₹${targetOrder.unitPrice}`,
        newValue: `₹${newUnitPrice}`,
        note: adminNote,
      });
    }
    if ((targetOrder.discountAmount ?? 0) !== newDiscount) {
      auditEntries.push({
        changedAt: now,
        changedBy: adminId,
        field: 'Discount Amount',
        oldValue: `₹${targetOrder.discountAmount ?? 0}`,
        newValue: `₹${newDiscount}`,
        note: adminNote,
      });
    }
    if (targetOrder.deliveryCharge !== newDelivery) {
      auditEntries.push({
        changedAt: now,
        changedBy: adminId,
        field: 'Delivery Charge',
        oldValue: `₹${targetOrder.deliveryCharge}`,
        newValue: `₹${newDelivery}`,
        note: adminNote,
      });
    }
    if (targetOrder.totalAmount !== newTotal) {
      auditEntries.push({
        changedAt: now,
        changedBy: adminId,
        field: 'Total Amount',
        oldValue: `₹${targetOrder.totalAmount}`,
        newValue: `₹${newTotal}`,
        note: adminNote,
      });
    }

    const updates: Partial<Order> = {
      quantity: newQty,
      unitPrice: newUnitPrice,
      baseAmount: newBaseAmount,
      discountAmount: newDiscount,
      subtotal: newSubtotal,
      deliveryCharge: newDelivery,
      totalAmount: newTotal,
      auditHistory: auditEntries,
    };

    try {
      await updateDoc(doc(db, 'orders', orderId), sanitizeForFirestore(updates));
      const trackingKey = getOrderTrackingKey(targetOrder.orderNumber, targetOrder.phone);
      try {
        await updateDoc(doc(db, 'orderTracking', trackingKey), sanitizeForFirestore({
          quantity: newQty,
          unitPrice: newUnitPrice,
          baseAmount: newBaseAmount,
          discountAmount: newDiscount,
          subtotal: newSubtotal,
          deliveryCharge: newDelivery,
          totalAmount: newTotal,
        }));
      } catch (trackErr) {
        console.warn('Could not update tracking doc financials:', trackErr);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Firebase Update Payment Status (Controlled by admin only)
  const updatePaymentStatus = async (orderId: string, paymentStatus: PaymentStatus): Promise<void> => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { paymentStatus });
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const trackingKey = getOrderTrackingKey(targetOrder.orderNumber, targetOrder.phone);
        try {
          await updateDoc(doc(db, 'orderTracking', trackingKey), { paymentStatus });
        } catch {
          // If tracking doc was not present, upsert it
          const trackingInfo: OrderTrackingInfo = {
            id: trackingKey,
            orderNumber: targetOrder.orderNumber,
            phoneLast4: targetOrder.phone.replace(/\D/g, '').slice(-4),
            createdAt: targetOrder.createdAt,
            productId: targetOrder.productId,
            productName: targetOrder.productName,
            productWeight: targetOrder.productWeight,
            quantity: targetOrder.quantity,
            unitPrice: targetOrder.unitPrice,
            deliveryCharge: targetOrder.deliveryCharge,
            totalAmount: targetOrder.totalAmount,
            paymentMethod: targetOrder.paymentMethod,
            paymentStatus,
            status: targetOrder.status,
            courierName: targetOrder.courierName,
            trackingNumber: targetOrder.trackingNumber,
            trackingUrl: targetOrder.trackingUrl,
            estimatedDelivery: targetOrder.estimatedDelivery,
            statusNotes: targetOrder.statusNotes,
          };
          await setDoc(doc(db, 'orderTracking', trackingKey), sanitizeForFirestore(trackingInfo));
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Firebase Update Order Status
  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const trackingKey = getOrderTrackingKey(targetOrder.orderNumber, targetOrder.phone);
        try {
          await updateDoc(doc(db, 'orderTracking', trackingKey), { status });
        } catch {
          // If tracking doc was not present, upsert it
          const trackingInfo: OrderTrackingInfo = {
            id: trackingKey,
            orderNumber: targetOrder.orderNumber,
            phoneLast4: targetOrder.phone.replace(/\D/g, '').slice(-4),
            createdAt: targetOrder.createdAt,
            productId: targetOrder.productId,
            productName: targetOrder.productName,
            productWeight: targetOrder.productWeight,
            quantity: targetOrder.quantity,
            unitPrice: targetOrder.unitPrice,
            deliveryCharge: targetOrder.deliveryCharge,
            totalAmount: targetOrder.totalAmount,
            paymentMethod: targetOrder.paymentMethod,
            paymentStatus: targetOrder.paymentStatus,
            status,
            courierName: targetOrder.courierName,
            trackingNumber: targetOrder.trackingNumber,
            trackingUrl: targetOrder.trackingUrl,
            estimatedDelivery: targetOrder.estimatedDelivery,
            statusNotes: targetOrder.statusNotes,
          };
          await setDoc(doc(db, 'orderTracking', trackingKey), sanitizeForFirestore(trackingInfo));
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Firebase Update Order details (Tracking, Courier, Status, Notes, Payment Status)
  const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'orders', orderId), sanitizeForFirestore(updates));
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const trackingKey = getOrderTrackingKey(targetOrder.orderNumber, targetOrder.phone);
        const trackingUpdates: Partial<OrderTrackingInfo> = {};
        if (updates.status) trackingUpdates.status = updates.status;
        if (updates.paymentStatus) trackingUpdates.paymentStatus = updates.paymentStatus;
        if (updates.courierName !== undefined) trackingUpdates.courierName = updates.courierName;
        if (updates.trackingNumber !== undefined) trackingUpdates.trackingNumber = updates.trackingNumber;
        if (updates.trackingUrl !== undefined) trackingUpdates.trackingUrl = updates.trackingUrl;
        if (updates.estimatedDelivery !== undefined) trackingUpdates.estimatedDelivery = updates.estimatedDelivery;
        if (updates.statusNotes !== undefined) trackingUpdates.statusNotes = updates.statusNotes;

        try {
          await updateDoc(doc(db, 'orderTracking', trackingKey), sanitizeForFirestore(trackingUpdates));
        } catch {
          const trackingInfo: OrderTrackingInfo = {
            id: trackingKey,
            orderNumber: targetOrder.orderNumber,
            phoneLast4: targetOrder.phone.replace(/\D/g, '').slice(-4),
            createdAt: targetOrder.createdAt,
            productId: targetOrder.productId,
            productName: targetOrder.productName,
            productWeight: targetOrder.productWeight,
            quantity: targetOrder.quantity,
            unitPrice: targetOrder.unitPrice,
            deliveryCharge: targetOrder.deliveryCharge,
            totalAmount: targetOrder.totalAmount,
            paymentMethod: targetOrder.paymentMethod,
            paymentStatus: updates.paymentStatus || targetOrder.paymentStatus,
            status: updates.status || targetOrder.status,
            courierName: updates.courierName ?? targetOrder.courierName,
            trackingNumber: updates.trackingNumber ?? targetOrder.trackingNumber,
            trackingUrl: updates.trackingUrl ?? targetOrder.trackingUrl,
            estimatedDelivery: updates.estimatedDelivery ?? targetOrder.estimatedDelivery,
            statusNotes: updates.statusNotes ?? targetOrder.statusNotes,
          };
          await setDoc(doc(db, 'orderTracking', trackingKey), sanitizeForFirestore(trackingInfo));
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Firebase Delete Order
  const deleteOrder = async (orderId: string): Promise<void> => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      await deleteDoc(doc(db, 'orders', orderId));
      if (targetOrder) {
        const trackingKey = getOrderTrackingKey(targetOrder.orderNumber, targetOrder.phone);
        try {
          await deleteDoc(doc(db, 'orderTracking', trackingKey));
        } catch {
          // Non-fatal
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  // Firebase Safe Batched Clear All Orders (Admin only)
  const clearAllOrders = async (): Promise<void> => {
    if (!adminUser) {
      throw new Error('Admin authorization required to clear orders.');
    }
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const docs = snap.docs;
      
      // Safe batched deletion (max 400 operations per Firestore batch)
      const BATCH_SIZE = 400;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_SIZE);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      const trackSnap = await getDocs(collection(db, 'orderTracking'));
      const trackDocs = trackSnap.docs;
      for (let i = 0; i < trackDocs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = trackDocs.slice(i, i + BATCH_SIZE);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      setOrders([]);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'orders');
    }
  };

  // Safe Archive Orders before clearing (moves to archivedOrders collection in batches)
  const archiveAllOrders = async (): Promise<number> => {
    if (!adminUser) {
      throw new Error('Admin authorization required to archive orders.');
    }
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const docs = snap.docs;
      if (docs.length === 0) return 0;

      const BATCH_SIZE = 200; // 200 reads + 200 writes = 400 ops safe limit
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_SIZE);
        chunk.forEach(d => {
          const archivedRef = doc(db, 'archivedOrders', d.id);
          batch.set(archivedRef, {
            ...d.data(),
            archivedAt: new Date().toISOString(),
            archivedBy: adminUser.email || 'admin'
          });
          batch.delete(d.ref);
        });
        await batch.commit();
      }

      // Also clean up orderTracking in batches
      const trackSnap = await getDocs(collection(db, 'orderTracking'));
      const trackDocs = trackSnap.docs;
      for (let i = 0; i < trackDocs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = trackDocs.slice(i, i + 400);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      setOrders([]);
      return docs.length;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'archivedOrders');
      return 0;
    }
  };

  // Customer Order Tracking: strictly requires exact Order ID and exact 10-digit registered mobile number
  const trackCustomerOrder = async (orderNumber: string, phone: string): Promise<OrderTrackingInfo | null> => {
    const cleanOrder = (orderNumber || '').trim().replace(/^#/, '');
    const cleanPhone = (phone || '').replace(/\D/g, '');

    // Strictly enforce exact Order ID and 10-digit mobile number (Requirements 4 & 5)
    if (!cleanOrder || cleanPhone.length < 10) {
      return null;
    }

    const phone10 = cleanPhone.slice(-10);
    const trackingKey = getOrderTrackingKey(cleanOrder, phone10);

    // 1. Fetch exact single document from Firestore orderTracking
    try {
      const snap = await getDoc(doc(db, 'orderTracking', trackingKey));
      if (snap.exists()) {
        const data = snap.data() as OrderTrackingInfo;
        // Verify exact order number match
        if (data.orderNumber.trim().toLowerCase() === cleanOrder.toLowerCase()) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Error fetching orderTracking document:', err);
    }

    // 2. If authenticated admin user, allow lookup from in-memory orders
    if (adminUser && orders.length > 0) {
      const foundInAdmin = orders.find(o => 
        o.orderNumber.trim().toLowerCase() === cleanOrder.toLowerCase() &&
        o.phone.replace(/\D/g, '').slice(-10) === phone10
      );
      if (foundInAdmin) {
        return {
          id: trackingKey,
          orderNumber: foundInAdmin.orderNumber,
          phoneLast4: phone10.slice(-4),
          createdAt: foundInAdmin.createdAt,
          productId: foundInAdmin.productId,
          productName: foundInAdmin.productName,
          productWeight: foundInAdmin.productWeight,
          quantity: foundInAdmin.quantity,
          unitPrice: foundInAdmin.unitPrice,
          baseAmount: foundInAdmin.baseAmount,
          discountAmount: foundInAdmin.discountAmount,
          subtotal: foundInAdmin.subtotal,
          deliveryCharge: foundInAdmin.deliveryCharge,
          totalAmount: foundInAdmin.totalAmount,
          paymentMethod: foundInAdmin.paymentMethod,
          status: foundInAdmin.status,
          courierName: foundInAdmin.courierName,
          trackingNumber: foundInAdmin.trackingNumber,
          trackingUrl: foundInAdmin.trackingUrl,
          estimatedDelivery: foundInAdmin.estimatedDelivery,
          statusNotes: foundInAdmin.statusNotes,
        };
      }
    }

    // 3. Check customer's device local storage (if placed in same browser recently)
    try {
      const raw = localStorage.getItem('maknuts_my_orders');
      if (raw) {
        const localList: Order[] = JSON.parse(raw);
        const match = localList.find(o => 
          o.orderNumber.trim().toLowerCase() === cleanOrder.toLowerCase() &&
          o.phone.replace(/\D/g, '').slice(-10) === phone10
        );
        if (match) {
          return {
            id: trackingKey,
            orderNumber: match.orderNumber,
            phoneLast4: phone10.slice(-4),
            createdAt: match.createdAt,
            productId: match.productId,
            productName: match.productName,
            productWeight: match.productWeight,
            quantity: match.quantity,
            unitPrice: match.unitPrice,
            baseAmount: match.baseAmount,
            discountAmount: match.discountAmount,
            subtotal: match.subtotal,
            deliveryCharge: match.deliveryCharge,
            totalAmount: match.totalAmount,
            paymentMethod: match.paymentMethod,
            status: match.status,
            courierName: match.courierName,
            trackingNumber: match.trackingNumber,
            trackingUrl: match.trackingUrl,
            estimatedDelivery: match.estimatedDelivery,
            statusNotes: match.statusNotes,
          };
        }
      }
    } catch {
      // Non-fatal
    }

    return null;
  };

  // Verify if a customer's Order ID and Mobile match a Delivered/Completed order
  // Requirement 7: Never exposes customer or order private data (returns boolean only)
  const verifyOrderForReview = async (orderId?: string, phone?: string): Promise<boolean> => {
    if (!orderId || !phone) return false;
    const cleanOrder = orderId.trim();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanOrder || cleanPhone.length !== 10) return false;

    // 1. Check sanitized public tracking document (orderNumber_phone10)
    try {
      const trackingKey = getOrderTrackingKey(cleanOrder, cleanPhone);
      const snap = await getDoc(doc(db, 'orderTracking', trackingKey));
      if (snap.exists()) {
        const data = snap.data();
        const status = data.status;
        if (status === 'Delivered' || status === 'Completed') {
          return true;
        }
      }
    } catch (err) {
      console.warn('Error checking orderTracking for review verification:', err);
    }

    // 2. Check in-memory orders if admin or loaded
    if (orders && orders.length > 0) {
      const match = orders.find(o => 
        (o.orderNumber.trim().toLowerCase() === cleanOrder.toLowerCase() || o.id === cleanOrder) &&
        o.phone.replace(/\D/g, '').slice(-10) === cleanPhone
      );
      if (match && (match.status === 'Delivered' || (match.status as string) === 'Completed')) {
        return true;
      }
    }

    return false;
  };

  // Requirement 1 & 4 & 5: Customer Review Submission
  // - Validates inputs (name, rating 1-5, comment)
  // - Cooldown check prevents rapid duplicate submissions
  // - Customer CANNOT set verifiedBuyer (Requirement 12 & 7)
  // - Saved as 'pending' by default in Firestore feedbacks collection
  const submitCustomerReview = async (data: {
    name: string;
    rating: number;
    comment: string;
    orderId?: string;
    phone?: string;
    location?: string;
    photo?: string;
  }): Promise<{ success: boolean; reviewId: string; verifiedBuyer: boolean }> => {
    const validation = validateReviewForm(data);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid review data');
    }

    const cooldown = checkReviewCooldown();
    if (!cooldown.allowed) {
      throw new Error(`Please wait ${cooldown.waitSeconds || 15}s before submitting another review.`);
    }

    // Check if the order qualifies as delivered (for UI notification only)
    const isDelivered = await verifyOrderForReview(data.orderId, data.phone);

    const reviewId = 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newReview: ReviewItem = {
      id: reviewId,
      name: data.name.trim(),
      location: data.location?.trim() || undefined,
      rating: Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5))),
      comment: data.comment.trim(),
      orderId: data.orderId?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      photo: data.photo || undefined,
      status: 'pending', // REQUIREMENT 1: All new reviews saved as pending by default
      verifiedBuyer: false, // REQUIREMENT 12 & 7: Public users cannot set verifiedBuyer! Authenticated admin approves.
      verifiedOrderNumber: data.orderId?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save directly to Firestore feedbacks collection with pending status and verifiedBuyer: false
      await setDoc(doc(db, 'feedbacks', reviewId), sanitizeForFirestore({
        ...newReview,
        customerName: newReview.name,
        message: newReview.comment,
        status: 'pending',
        verifiedBuyer: false,
      }));

      recordReviewSubmission();
      return { success: true, reviewId, verifiedBuyer: isDelivered };
    } catch (e: any) {
      handleFirestoreError(e, OperationType.CREATE, `feedbacks/${reviewId}`);
      throw e;
    }
  };

  // Requirement 3: Admin Approve Review
  const approveReview = async (reviewId: string): Promise<void> => {
    const target = reviews.find(r => r.id === reviewId) ||
      (storeSettings.reviewsSection?.reviews || []).find(r => r.id === reviewId) ||
      DEFAULT_SETTINGS.reviewsSection?.reviews?.find(r => r.id === reviewId);
    
    // Check genuine verified buyer status (Requirement 7: exact order ID + matching phone + Delivered/Completed)
    let isDelivered = Boolean(target?.verifiedBuyer);
    if (target?.orderId && target?.phone) {
      const verified = await verifyOrderForReview(target.orderId, target.phone);
      if (verified) {
        isDelivered = true;
      }
    }

    const safeComment = target?.comment || target?.originalComment || '';
    const safeName = target?.name || 'Customer';

    const updatedReview: ReviewItem = target
      ? { ...target, comment: safeComment, name: safeName, status: 'approved', verifiedBuyer: isDelivered }
      : { id: reviewId, name: 'Customer', rating: 5, comment: safeComment, status: 'approved', verifiedBuyer: isDelivered, createdAt: new Date().toISOString() };

    try {
      await setDoc(doc(db, 'feedbacks', reviewId), sanitizeForFirestore({
        ...updatedReview,
        customerName: updatedReview.name,
        message: updatedReview.comment,
        status: 'approved',
        verifiedBuyer: isDelivered,
      }), { merge: true });
    } catch (e) {
      console.warn('Could not update doc in feedbacks:', e);
    }

    // Instant local state update
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updatedReview } : r));

    // Sync to storeSettings.reviewsSection.reviews
    const current = storeSettings.reviewsSection?.reviews && storeSettings.reviewsSection.reviews.length > 0
      ? storeSettings.reviewsSection.reviews
      : (DEFAULT_SETTINGS.reviewsSection?.reviews || []);
    const exists = current.some(r => r.id === reviewId);
    const updatedList = exists
      ? current.map(r => r.id === reviewId ? { ...r, ...updatedReview } : r)
      : [updatedReview, ...current];

    await updateSettings({
      reviewsSection: {
        ...(storeSettings.reviewsSection || DEFAULT_SETTINGS.reviewsSection),
        reviews: updatedList,
      }
    });
  };

  // Requirement 3: Admin Reject/Hide Review
  const rejectReview = async (reviewId: string): Promise<void> => {
    const target = reviews.find(r => r.id === reviewId) ||
      (storeSettings.reviewsSection?.reviews || []).find(r => r.id === reviewId) ||
      DEFAULT_SETTINGS.reviewsSection?.reviews?.find(r => r.id === reviewId);

    try {
      if (target) {
        await setDoc(doc(db, 'feedbacks', reviewId), sanitizeForFirestore({
          name: target.name || 'Customer',
          customerName: target.name || 'Customer',
          comment: target.comment || '',
          message: target.comment || '',
          rating: target.rating ?? 5,
          location: target.location || '',
          status: 'rejected',
          verifiedBuyer: target.verifiedBuyer ?? false,
          createdAt: target.createdAt || new Date().toISOString(),
          ...(target.storeReply ? { storeReply: target.storeReply, storeReplyAt: target.storeReplyAt } : {}),
        }), { merge: true });
      } else {
        await setDoc(doc(db, 'feedbacks', reviewId), { status: 'rejected' }, { merge: true });
      }
    } catch (e) {
      console.warn('Could not update doc in feedbacks:', e);
    }

    // Instant local state update
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'rejected' } : r));

    // Remove from storeSettings.reviewsSection.reviews so it never appears publicly
    const current = storeSettings.reviewsSection?.reviews || [];
    const updatedList = current.filter(r => r.id !== reviewId);
    await updateSettings({
      reviewsSection: {
        ...(storeSettings.reviewsSection || DEFAULT_SETTINGS.reviewsSection),
        reviews: updatedList,
      }
    });
  };

  // Requirement 3: Admin Delete Spam Review
  const deleteReview = async (reviewId: string, index?: number): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'feedbacks', reviewId));
    } catch (e) {
      console.warn('Could not delete doc in feedbacks:', e);
    }

    // Instant local state update
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    const current = storeSettings.reviewsSection?.reviews || [];
    const updatedList = current.filter((r, idx) => {
      if (reviewId && r.id) return r.id !== reviewId;
      return idx !== index;
    });

    await updateSettings({
      reviewsSection: {
        ...(storeSettings.reviewsSection || DEFAULT_SETTINGS.reviewsSection),
        reviews: updatedList,
      }
    });
  };

  // Requirement 11: Admin Edit Customer Review Text (Preserving originalComment and adminEditedAt)
  const updateReviewText = async (reviewId: string, newComment: string): Promise<void> => {
    const target = reviews.find(r => r.id === reviewId) ||
      (storeSettings.reviewsSection?.reviews || []).find(r => r.id === reviewId) ||
      DEFAULT_SETTINGS.reviewsSection?.reviews?.find(r => r.id === reviewId);
    if (!target) return;
    const originalComment = target.originalComment || target.comment;
    const comment = newComment.trim();
    const adminEditedAt = new Date().toISOString();

    try {
      const payload: Record<string, any> = {
        name: target.name || 'Customer',
        customerName: target.name || 'Customer',
        comment,
        message: comment,
        originalComment,
        adminEditedAt,
        rating: target.rating ?? 5,
        location: target.location || '',
        status: target.status || 'approved',
        verifiedBuyer: target.verifiedBuyer !== undefined ? target.verifiedBuyer : true,
        createdAt: target.createdAt || new Date().toISOString(),
      };
      if (target.storeReply) payload.storeReply = target.storeReply;
      if (target.storeReplyAt) payload.storeReplyAt = target.storeReplyAt;
      if (target.photo) payload.photo = target.photo;
      if (target.category) payload.category = target.category;
      if (target.orderId) payload.orderId = target.orderId;
      if (target.phone) payload.phone = target.phone;

      await setDoc(doc(db, 'feedbacks', reviewId), sanitizeForFirestore(payload), { merge: true });
    } catch (e) {
      console.warn('Could not update doc in feedbacks:', e);
    }

    // Instant local state update
    setReviews(prev => prev.map(r => r.id === reviewId ? {
      ...r,
      comment,
      originalComment,
      adminEditedAt,
    } : r));

    const current = storeSettings.reviewsSection?.reviews && storeSettings.reviewsSection.reviews.length > 0
      ? storeSettings.reviewsSection.reviews
      : (DEFAULT_SETTINGS.reviewsSection?.reviews || []);
    const exists = current.some(r => r.id === reviewId);
    const updatedList = exists
      ? current.map(r => r.id === reviewId ? {
          ...r,
          comment,
          originalComment,
          adminEditedAt,
        } : r)
      : [{
          ...target,
          comment,
          originalComment,
          adminEditedAt,
        }, ...current];

    await updateSettings({
      reviewsSection: {
        ...(storeSettings.reviewsSection || DEFAULT_SETTINGS.reviewsSection),
        reviews: updatedList,
      }
    });
  };

  // Requirement 10: Admin Add/Edit/Remove Public Store Reply (Strictly preserving comment & review metadata)
  const updateStoreReply = async (reviewId: string, replyText: string | null): Promise<void> => {
    const storeReply = replyText && replyText.trim() ? replyText.trim() : null;
    const storeReplyAt = storeReply ? new Date().toISOString() : null;

    // Locate existing review from local state or settings to guarantee comment is never wiped
    const target = reviews.find(r => r.id === reviewId) ||
      (storeSettings.reviewsSection?.reviews || []).find(r => r.id === reviewId) ||
      DEFAULT_SETTINGS.reviewsSection?.reviews?.find(r => r.id === reviewId);

    const safeComment = (target?.comment || target?.originalComment || '').trim();
    const safeName = (target?.name || 'Customer').trim();
    const safeRating = target?.rating ?? 5;
    const safeLocation = target?.location || '';
    const safeStatus = target?.status || 'approved';
    const safeVerifiedBuyer = target?.verifiedBuyer !== undefined ? target.verifiedBuyer : true;
    const safeCreatedAt = target?.createdAt || new Date().toISOString();
    const safePhoto = target?.photo || '';
    const safeCategory = target?.category || '';
    const safeOrderId = target?.orderId || '';
    const safePhone = target?.phone || '';
    const safeOriginalComment = target?.originalComment || safeComment;
    const safeAdminEditedAt = target?.adminEditedAt || '';

    try {
      const payload: Record<string, any> = {
        name: safeName,
        customerName: safeName,
        comment: safeComment,
        message: safeComment,
        rating: safeRating,
        location: safeLocation,
        status: safeStatus,
        verifiedBuyer: safeVerifiedBuyer,
        createdAt: safeCreatedAt,
        storeReply: storeReply || '',
        storeReplyAt: storeReplyAt || '',
      };
      if (safeOriginalComment) payload.originalComment = safeOriginalComment;
      if (safeAdminEditedAt) payload.adminEditedAt = safeAdminEditedAt;
      if (safePhoto) payload.photo = safePhoto;
      if (safeCategory) payload.category = safeCategory;
      if (safeOrderId) payload.orderId = safeOrderId;
      if (safePhone) payload.phone = safePhone;

      await setDoc(doc(db, 'feedbacks', reviewId), sanitizeForFirestore(payload), { merge: true });
    } catch (e) {
      console.warn('Could not update doc in feedbacks:', e);
    }

    // Instant local state update for reviews: strictly retain comment!
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      return {
        ...r,
        comment: (r.comment && r.comment.trim()) ? r.comment : safeComment,
        name: r.name || safeName,
        rating: r.rating || safeRating,
        storeReply: storeReply || undefined,
        storeReplyAt: storeReplyAt || undefined,
      };
    }));

    const current = storeSettings.reviewsSection?.reviews && storeSettings.reviewsSection.reviews.length > 0
      ? storeSettings.reviewsSection.reviews
      : (DEFAULT_SETTINGS.reviewsSection?.reviews || []);
    const exists = current.some(r => r.id === reviewId);
    let updatedList: ReviewItem[];

    if (exists) {
      updatedList = current.map(r => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          comment: (r.comment && r.comment.trim()) ? r.comment : safeComment,
          name: r.name || safeName,
          rating: r.rating || safeRating,
          storeReply: storeReply || undefined,
          storeReplyAt: storeReplyAt || undefined,
        };
      });
    } else if (target) {
      updatedList = [
        {
          ...target,
          comment: safeComment,
          name: safeName,
          rating: safeRating,
          storeReply: storeReply || undefined,
          storeReplyAt: storeReplyAt || undefined,
        },
        ...current,
      ];
    } else {
      updatedList = current;
    }

    await updateSettings({
      reviewsSection: {
        ...(storeSettings.reviewsSection || DEFAULT_SETTINGS.reviewsSection),
        reviews: updatedList,
      }
    });
  };

  // Firebase Submit Customer Feedback
  const submitFeedback = async (feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> => {
    const feedbackId = 'fb-' + Date.now();
    const newFeedback: Feedback = {
      ...feedbackData,
      id: feedbackId,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'feedbacks', feedbackId), sanitizeForFirestore(newFeedback));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `feedbacks/${feedbackId}`);
    }
  };

  // Firebase Delete Customer Feedback
  const deleteFeedback = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'feedbacks', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `feedbacks/${id}`);
    }
  };

  // Backward compatibility wrapper for review submission: delegates to submitCustomerReview
  const submitReviewAndFeedback = async (reviewData: Omit<ReviewItem, 'id' | 'createdAt' | 'status'> & { status?: ReviewItem['status'] }): Promise<void> => {
    await submitCustomerReview({
      name: reviewData.name,
      rating: reviewData.rating,
      comment: reviewData.comment,
      orderId: reviewData.orderId,
      phone: reviewData.phone,
      location: reviewData.location,
      photo: reviewData.photo,
    });
  };

  // Backward compatibility alias
  const deleteReviewAndFeedback = deleteReview;

  // Add Photo to Gallery
  const addGalleryPhoto = async (newPhoto: GalleryPhoto): Promise<void> => {
    const currentPhotos = storeSettings.gallerySection?.photos || DEFAULT_SETTINGS.gallerySection.photos;
    const updatedPhotos = [newPhoto, ...currentPhotos];
    const newSettings: StoreSettings = {
      ...storeSettings,
      gallerySection: {
        ...(storeSettings.gallerySection || DEFAULT_SETTINGS.gallerySection),
        photos: updatedPhotos
      }
    };
    setStoreSettings(newSettings);
    try {
      const safeSettings = await optimizeSettingsForFirestore(newSettings);
      await setDoc(doc(db, 'settings', 'store'), sanitizeForFirestore(safeSettings));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/store');
    }
  };

  // Delete Photo from Gallery (reliable direct deletion)
  const deleteGalleryPhoto = async (photoId: string, index?: number): Promise<void> => {
    const currentPhotos = storeSettings.gallerySection?.photos || DEFAULT_SETTINGS.gallerySection.photos;
    const filtered = currentPhotos.filter((p, i) => {
      if (photoId && p.id) return p.id !== photoId;
      return i !== index;
    });
    const newSettings: StoreSettings = {
      ...storeSettings,
      gallerySection: {
        ...(storeSettings.gallerySection || DEFAULT_SETTINGS.gallerySection),
        photos: filtered
      }
    };
    setStoreSettings(newSettings);
    try {
      const safeSettings = await optimizeSettingsForFirestore(newSettings);
      await setDoc(doc(db, 'settings', 'store'), sanitizeForFirestore(safeSettings));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/store');
    }
  };

  // Firebase Reset to Defaults
  const resetToDefaults = async (): Promise<void> => {
    try {
      // 1. Reset products to default product
      const prodSnap = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      prodSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();

      const safeDefault = await optimizeProductForFirestore(DEFAULT_PRODUCT);
      await setDoc(doc(db, 'products', DEFAULT_PRODUCT.id), sanitizeForFirestore(safeDefault));

      // 2. Reset settings to default settings
      await setDoc(doc(db, 'settings', 'store'), DEFAULT_SETTINGS);

      setActiveProductId(DEFAULT_PRODUCT.id);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'resetToDefaults');
    }
  };

  const exportData = (): string => {
    return JSON.stringify({
      products,
      storeSettings,
      orders,
      exportedAt: new Date().toISOString()
    }, null, 2);
  };

  const importData = async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      const batch = writeBatch(db);

      if (data.products && Array.isArray(data.products)) {
        for (const p of data.products) {
          const ref = doc(db, 'products', p.id);
          batch.set(ref, p);
        }
      }
      if (data.storeSettings) {
        const ref = doc(db, 'settings', 'store');
        batch.set(ref, data.storeSettings);
      }
      await batch.commit();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        activeProduct,
        setActiveProductId,
        storeSettings,
        orders,
        feedbacks,
        reviews,
        isLoading,
        adminUser,
        isAdmin: Boolean(adminUser),
        isAuthLoading,
        adminLogin,
        adminRegister,
        adminResetPassword,
        adminLogout,
        addProduct,
        updateProduct,
        deleteProduct,
        updateSettings,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        updateOrder,
        updateOrderFinancials,
        deleteOrder,
        clearAllOrders,
        archiveAllOrders,
        trackCustomerOrder,
        verifyOrderForReview,
        submitCustomerReview,
        approveReview,
        rejectReview,
        updateReviewText,
        updateStoreReply,
        submitFeedback,
        deleteFeedback,
        submitReviewAndFeedback,
        deleteReview,
        deleteReviewAndFeedback,
        addGalleryPhoto,
        deleteGalleryPhoto,
        resetToDefaults,
        exportData,
        importData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
