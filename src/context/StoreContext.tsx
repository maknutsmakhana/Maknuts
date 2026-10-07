import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, StoreSettings, Order, Feedback, ReviewItem, GalleryPhoto } from '../types';
import { DEFAULT_PRODUCT, DEFAULT_SETTINGS } from '../constants';
import { optimizeProductForFirestore, optimizeSettingsForFirestore } from '../utils/imageCompressor';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

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
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
  submitFeedback: (feedbackData: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  submitReviewAndFeedback: (reviewData: Omit<ReviewItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteReview: (reviewId: string, index?: number) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

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
            footerText: { ...DEFAULT_SETTINGS.footerText, ...(data.footerText || {}) },
            policies: { ...DEFAULT_SETTINGS.policies, ...(data.policies || {}) },
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, settingsDocPath);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Realtime Firestore Sync for Orders
  useEffect(() => {
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
  }, []);

  // 4. Realtime Firestore Sync for Customer Feedbacks
  useEffect(() => {
    const feedbacksPath = 'feedbacks';
    const unsubscribe = onSnapshot(
      collection(db, feedbacksPath),
      (snapshot) => {
        const list: Feedback[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Feedback);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFeedbacks(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, feedbacksPath);
      }
    );

    return () => unsubscribe();
  }, []);

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
    const newSettings: StoreSettings = {
      ...storeSettings,
      ...updated,
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
      }
    };
    try {
      const safeSettings = await optimizeSettingsForFirestore(newSettings);
      await setDoc(doc(db, 'settings', 'store'), sanitizeForFirestore(safeSettings));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/store');
    }
  };

  // Next order sequence calculation based on online orders
  const getNextOrderNumber = (): string => {
    const existingNumbers = orders
      .map(o => {
        const match = o.orderNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n) && n >= 10000);

    const max = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 10000;
    return `MK${max + 1}`;
  };

  // Firebase Create Order
  const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>): Promise<Order> => {
    const orderNumber = getNextOrderNumber();
    const orderId = 'ord-' + Date.now();
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };
    try {
      await setDoc(doc(db, 'orders', orderId), sanitizeForFirestore(newOrder));
      return newOrder;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  // Firebase Update Order Status
  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Firebase Update Order details (Tracking, Courier, Status, Notes)
  const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'orders', orderId), sanitizeForFirestore(updates));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Firebase Delete Order
  const deleteOrder = async (orderId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  // Firebase Clear All Orders
  const clearAllOrders = async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      snap.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'orders');
    }
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

  // Unified Submit Review & Feedback
  const submitReviewAndFeedback = async (reviewData: Omit<ReviewItem, 'id' | 'createdAt'>): Promise<void> => {
    const newId = 'rev-' + Date.now();
    const newReview: ReviewItem = {
      ...reviewData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    const currentReviews = storeSettings.reviewsSection?.reviews || [];
    const updatedReviews = [newReview, ...currentReviews];
    await updateSettings({
      reviewsSection: {
        ...(storeSettings.reviewsSection || DEFAULT_SETTINGS.reviewsSection),
        reviews: updatedReviews
      }
    });

    try {
      await setDoc(doc(db, 'feedbacks', newId), sanitizeForFirestore({
        ...newReview,
        customerName: newReview.name,
        message: newReview.comment,
        createdAt: newReview.createdAt
      }));
    } catch {
      // Non-fatal
    }
  };

  // Unified Delete Review / Feedback
  const deleteReviewAndFeedback = async (id: string, index?: number): Promise<void> => {
    const currentReviews = storeSettings.reviewsSection?.reviews || [];
    const updatedReviews = currentReviews.filter((r, idx) => {
      if (id && r.id) return r.id !== id;
      return idx !== index;
    });
    const newSettings: StoreSettings = {
      ...storeSettings,
      reviewsSection: {
        ...(storeSettings.reviewsSection || DEFAULT_SETTINGS.reviewsSection),
        reviews: updatedReviews
      }
    };
    setStoreSettings(newSettings);
    try {
      await setDoc(doc(db, 'settings', 'store'), sanitizeForFirestore(newSettings));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/store');
    }

    if (id) {
      try {
        await deleteDoc(doc(db, 'feedbacks', id));
      } catch {
        // Non-fatal
      }
    }
  };

  // Backwards compatibility alias
  const deleteReview = deleteReviewAndFeedback;

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
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        updateSettings,
        createOrder,
        updateOrderStatus,
        updateOrder,
        deleteOrder,
        clearAllOrders,
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
