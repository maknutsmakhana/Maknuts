import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, StoreSettings, Order, GalleryPhoto, Feedback, PaymentStatus, OrderAuditEntry, ReviewItem } from '../types';
import { 
  X, Lock, Key, Plus, Trash2, Edit3, Save, Check, Copy,
  RotateCcw, Package, Settings, ShoppingCart, FileText, 
  Download, Upload, Eye, EyeOff, MessageCircle, AlertTriangle, ExternalLink, Image as ImageIcon, Truck,
  Star, Sparkles, Award, Leaf, Heart, Camera, ShieldCheck, KeyRound, MessageSquareHeart, AlertCircle, RefreshCw, ArrowRight,
  Phone, Mail, MapPin, Clock, Headphones, ChevronLeft, ChevronRight, MoreHorizontal,
  Calculator, Tag, BadgePercent, History, Unlock, ShieldAlert, CreditCard,
  Search, Filter, ArrowUpDown, Store, CheckCircle2, Menu, LayoutDashboard, Archive
} from 'lucide-react';
import { AdminSidebar, AdminTab } from './admin/AdminSidebar';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminStorefrontTab } from './admin/AdminStorefrontTab';
import { AdminCouponsTab } from './admin/AdminCouponsTab';
import { AdminFoodComplianceTab } from './admin/AdminFoodComplianceTab';
import { AdminPaymentsTab } from './admin/AdminPaymentsTab';
import { AdminCustomersTab } from './admin/AdminCustomersTab';
import { AdminMediaTab } from './admin/AdminMediaTab';
import { AdminWhatsAppTab } from './admin/AdminWhatsAppTab';
import { AdminSeoTab } from './admin/AdminSeoTab';
import { AdminReportsTab } from './admin/AdminReportsTab';
import { 
  downloadOrderInvoicePdf, 
  downloadOrdersReportPdf, 
  downloadStoreExecutiveReportPdf, 
  downloadFoodCompliancePdf,
  downloadProductsCatalogPdf
} from '../utils/pdfGenerator';
import { createWhatsAppUrl } from '../utils/whatsapp';
import { compressImageFile, optimizeProductForFirestore } from '../utils/imageCompressor';
import { calculateOrderPricing, round2, validatePriceInput } from '../utils/pricing';
import { calculateReviewStats } from '../utils/reviews';
import maknutsLogo from '../assets/images/regenerated_image_1791357700332.png';

const SAMPLE_MAKHANA_PHOTOS = [
  { label: 'Crispy Roasted Bowl', url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=800' },
  { label: 'White Jumbo Seeds', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800' },
  { label: 'Moisture Stand Pouch', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800' },
  { label: 'Lotus Pond Harvest', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800' },
];

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { 
    products, 
    activeProduct,
    setActiveProductId,
    storeSettings, 
    orders, 
    feedbacks,
    reviews,
    approveReview,
    rejectReview,
    deleteReview,
    updateReviewText,
    updateStoreReply,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateSettings, 
    updateOrderStatus, 
    updatePaymentStatus,
    updateOrder,
    updateOrderFinancials,
    deleteOrder, 
    clearAllOrders, 
    archiveAllOrders,
    deleteFeedback,
    deleteReviewAndFeedback,
    addGalleryPhoto,
    deleteGalleryPhoto,
    resetToDefaults, 
    exportData, 
    importData,
    adminUser,
    isAdmin,
    isAuthLoading,
    adminLogin,
    adminRegister,
    adminResetPassword,
    adminLogout
  } = useStore();

  // Authentication - email is empty by default so it is not shown
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [showMoreMobileTabs, setShowMoreMobileTabs] = useState(false);

  // Authenticated state derived from Firebase Auth
  const isAuthenticated = Boolean(adminUser);

  // Active Tab - with all Store Control Center tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [galleryDeleteToast, setGalleryDeleteToast] = useState(false);
  const [reviewDeleteToast, setReviewDeleteToast] = useState(false);

  // Photo Gallery add state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Product Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);
  const [newProductPhotoUrlInput, setNewProductPhotoUrlInput] = useState<string>('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [saveProductError, setSaveProductError] = useState('');

  // Product Photos Preview Modal state (View Photos from admin catalog)
  const [previewProductPhotosModal, setPreviewProductPhotosModal] = useState<Product | null>(null);
  const [previewProductPhotoIndex, setPreviewProductPhotoIndex] = useState<number>(0);

  // Temporary Form States for Store Settings
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Dedicated Pricing & Order Controls State
  const [pricingForm, setPricingForm] = useState<{
    productPrice: number;
    originalPrice: number;
    discountEnabled: boolean;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    deliveryCharge: number;
    freeDeliveryThreshold: number;
    freeDeliveryAllOrders: boolean;
    minOrderQuantity: number;
    maxOrderQuantity: number;
    orderIdPrefix: string;
    enableCod: boolean;
    enableUpi: boolean;
  }>({
    productPrice: activeProduct?.price || 299,
    originalPrice: activeProduct?.originalPrice || 399,
    discountEnabled: Boolean(storeSettings.discountEnabled),
    discountType: storeSettings.discountType || 'percentage',
    discountValue: storeSettings.discountValue ?? 0,
    deliveryCharge: storeSettings.deliveryCharge ?? 40,
    freeDeliveryThreshold: storeSettings.freeDeliveryThreshold ?? 600,
    freeDeliveryAllOrders: Boolean(storeSettings.freeDeliveryAllOrders),
    minOrderQuantity: storeSettings.minOrderQuantity || 1,
    maxOrderQuantity: storeSettings.maxOrderQuantity || 20,
    orderIdPrefix: storeSettings.orderIdPrefix || 'MK',
    enableCod: storeSettings.enableCod !== undefined ? Boolean(storeSettings.enableCod) : true,
    enableUpi: storeSettings.enableUpi !== undefined ? Boolean(storeSettings.enableUpi) : true,
  });
  const [previewTestQty, setPreviewTestQty] = useState<number>(1);
  const [pricingSavedToast, setPricingSavedToast] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Order Financial Editing State
  const [editingFinancialOrderId, setEditingFinancialOrderId] = useState<string | null>(null);
  const [financialForm, setFinancialForm] = useState<{
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    deliveryCharge: number;
    adminNote: string;
  }>({
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
    deliveryCharge: 0,
    adminNote: '',
  });
  const [unlockedDeliveredOrderIds, setUnlockedDeliveredOrderIds] = useState<Set<string>>(new Set());
  const [warningUnlockOrder, setWarningUnlockOrder] = useState<Order | null>(null);
  const [confirmFinancialOrder, setConfirmFinancialOrder] = useState<{
    order: Order;
    newQuantity: number;
    newUnitPrice: number;
    newDiscountAmount: number;
    newDeliveryCharge: number;
    newTotal: number;
    adminNote: string;
    changesSummary: string[];
  } | null>(null);
  const [isSavingFinancials, setIsSavingFinancials] = useState(false);
  const [financialSaveToast, setFinancialSaveToast] = useState(false);

  // Screenshot viewer modal
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Order Tracking edit state
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState<{
    courierName: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery: string;
    statusNotes: string;
  }>({
    courierName: 'Delhivery',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '',
    statusNotes: '',
  });

  // Safe Order Deletion & Archival State (Requirement 11)
  const [isClearOrdersModalOpen, setIsClearOrdersModalOpen] = useState(false);
  const [clearOrdersConfirmationText, setClearOrdersConfirmationText] = useState('');
  const [isProcessingOrderPurge, setIsProcessingOrderPurge] = useState(false);
  const [orderPurgeActionType, setOrderPurgeActionType] = useState<'archive' | 'permanent'>('archive');
  const [orderActionToast, setOrderActionToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  // Single order delete confirmation state
  const [deletingSingleOrder, setDeletingSingleOrder] = useState<Order | null>(null);

  // Customer Reviews & Feedback Moderation State
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reviewSearch, setReviewSearch] = useState<string>('');
  const [reviewSort, setReviewSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState<string>('');
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyingText, setReplyingText] = useState<string>('');
  const [reviewToast, setReviewToast] = useState<{ message: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [expandedOriginalId, setExpandedOriginalId] = useState<string | null>(null);

  const triggerReviewToast = (message: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setReviewToast({ message, type });
    setTimeout(() => setReviewToast(null), 3000);
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
      triggerReviewToast('Review approved! Now published on the public store.', 'success');
    } catch (e: any) {
      triggerReviewToast('Failed to approve review: ' + (e?.message || 'Error'), 'danger');
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await rejectReview(reviewId);
      triggerReviewToast('Review rejected and hidden from public store.', 'info');
    } catch (e: any) {
      triggerReviewToast('Failed to reject review: ' + (e?.message || 'Error'), 'danger');
    }
  };

  const handleDeleteSpamReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      triggerReviewToast('Spam review permanently deleted.', 'danger');
    } catch (e: any) {
      triggerReviewToast('Failed to delete review: ' + (e?.message || 'Error'), 'danger');
    }
  };

  const handleSaveEditedReviewText = async (reviewId: string) => {
    if (!editingReviewText.trim()) {
      triggerReviewToast('Review text cannot be empty.', 'danger');
      return;
    }
    try {
      await updateReviewText(reviewId, editingReviewText);
      setEditingReviewId(null);
      setEditingReviewText('');
      triggerReviewToast('Review text updated! Original text preserved.', 'success');
    } catch (e: any) {
      triggerReviewToast('Failed to save review text: ' + (e?.message || 'Error'), 'danger');
    }
  };

  const handleSaveStoreReply = async (reviewId: string) => {
    try {
      await updateStoreReply(reviewId, replyingText);
      setReplyingReviewId(null);
      setReplyingText('');
      triggerReviewToast(replyingText.trim() ? 'Store reply published to review!' : 'Store reply removed.', 'success');
    } catch (e: any) {
      triggerReviewToast('Failed to save store reply: ' + (e?.message || 'Error'), 'danger');
    }
  };

  const handleRemoveStoreReply = async (reviewId: string) => {
    try {
      await updateStoreReply(reviewId, null);
      triggerReviewToast('Store reply removed.', 'info');
    } catch (e: any) {
      triggerReviewToast('Failed to remove store reply: ' + (e?.message || 'Error'), 'danger');
    }
  };

  // Automatically synchronize settings form when storeSettings loads/updates
  useEffect(() => {
    setSettingsForm(storeSettings);
    setPricingForm({
      productPrice: activeProduct?.price || 299,
      originalPrice: activeProduct?.originalPrice || 399,
      discountEnabled: Boolean(storeSettings.discountEnabled),
      discountType: storeSettings.discountType || 'percentage',
      discountValue: storeSettings.discountValue ?? 0,
      deliveryCharge: storeSettings.deliveryCharge ?? 40,
      freeDeliveryThreshold: storeSettings.freeDeliveryThreshold ?? 600,
      freeDeliveryAllOrders: Boolean(storeSettings.freeDeliveryAllOrders),
      minOrderQuantity: storeSettings.minOrderQuantity || 1,
      maxOrderQuantity: storeSettings.maxOrderQuantity || 20,
      orderIdPrefix: storeSettings.orderIdPrefix || 'MK',
      enableCod: storeSettings.enableCod !== undefined ? Boolean(storeSettings.enableCod) : true,
      enableUpi: storeSettings.enableUpi !== undefined ? Boolean(storeSettings.enableUpi) : true,
    });
  }, [storeSettings, activeProduct]);

  // Sync settings form when settings change or tab changes
  const handleOpenStoreTab = (tab: typeof activeTab) => {
    setSettingsForm(storeSettings);
    setPricingForm({
      productPrice: activeProduct?.price || 299,
      originalPrice: activeProduct?.originalPrice || 399,
      discountEnabled: Boolean(storeSettings.discountEnabled),
      discountType: storeSettings.discountType || 'percentage',
      discountValue: storeSettings.discountValue ?? 0,
      deliveryCharge: storeSettings.deliveryCharge ?? 40,
      freeDeliveryThreshold: storeSettings.freeDeliveryThreshold ?? 600,
      freeDeliveryAllOrders: Boolean(storeSettings.freeDeliveryAllOrders),
      minOrderQuantity: storeSettings.minOrderQuantity || 1,
      maxOrderQuantity: storeSettings.maxOrderQuantity || 20,
      orderIdPrefix: storeSettings.orderIdPrefix || 'MK',
      enableCod: storeSettings.enableCod !== undefined ? Boolean(storeSettings.enableCod) : true,
      enableUpi: storeSettings.enableUpi !== undefined ? Boolean(storeSettings.enableUpi) : true,
    });
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  // Handle Login using Firebase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthError('Please enter admin email address.');
      return;
    }
    if (!passwordInput) {
      setAuthError('Please enter admin password.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');

    try {
      await adminLogin(emailInput.trim(), passwordInput);
      setAuthError('');
    } catch (err: any) {
      console.warn('Admin login attempt result:', err?.code || err);
      if (err?.code === 'auth/operation-not-allowed') {
        setAuthError('Authentication method restricted. Please sign in with authorized store credentials (maknutsmakhana@gmail.com).');
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        // If first-time initialization for the authorized store owner email, register initial admin
        const authorizedEmail = (storeSettings.supportEmail || 'maknutsmakhana@gmail.com').toLowerCase();
        if (emailInput.trim().toLowerCase() === authorizedEmail) {
          try {
            await adminRegister(emailInput.trim(), passwordInput);
            setAuthError('');
            return;
          } catch (regErr: any) {
            console.error('Registration fallback error:', regErr);
          }
        }
        setAuthError('Invalid admin email or password. Please verify credentials.');
      } else if (err?.code === 'auth/wrong-password') {
        setAuthError('Incorrect admin password. Please try again.');
      } else if (err?.code === 'auth/too-many-requests') {
        setAuthError('Access temporarily blocked due to repeated failed attempts. Please wait a few moments.');
      } else {
        setAuthError(err?.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Gallery Photo File Upload
  const handleGalleryFileUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 640, 0.68, 45000);
      setNewPhotoUrl(compressedDataUrl);
    } catch (err) {
      console.error('Failed to process photo', err);
      setAuthError('Could not process photo file. Please try a different image.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Add Photo to Gallery
  const handleAddPhotoToGallery = async () => {
    if (!newPhotoUrl.trim()) return;
    const newPhoto: GalleryPhoto = {
      id: 'photo-' + Date.now(),
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Maknuts Bihar Makhana',
      tag: '',
      createdAt: new Date().toISOString()
    };

    const currentPhotos = settingsForm.gallerySection?.photos || storeSettings.gallerySection?.photos || [];
    const updatedPhotos = [newPhoto, ...currentPhotos];
    const updated = {
      ...settingsForm,
      gallerySection: {
        ...(settingsForm.gallerySection || { title: '', subtitle: '', buttonLabel: '', photos: [] }),
        photos: updatedPhotos
      }
    };
    setSettingsForm(updated);
    await addGalleryPhoto(newPhoto);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2000);
  };

  // Delete Photo from Gallery - Direct and reliable deletion (no broken confirm()!)
  const handleDeletePhotoFromGallery = async (photoId: string, index?: number) => {
    const currentPhotos = settingsForm.gallerySection?.photos || storeSettings.gallerySection?.photos || [];
    const filtered = currentPhotos.filter((p, i) => {
      if (photoId && p.id) return p.id !== photoId;
      return i !== index;
    });
    const updated = {
      ...settingsForm,
      gallerySection: {
        ...(settingsForm.gallerySection || { title: '', subtitle: '', buttonLabel: '', photos: [] }),
        photos: filtered
      }
    };
    setSettingsForm(updated);
    await deleteGalleryPhoto(photoId, index);
    setGalleryDeleteToast(true);
    setTimeout(() => setGalleryDeleteToast(false), 2500);
  };

  // Delete Review / Feedback - Direct and reliable deletion
  const handleDeleteReview = async (reviewId: string, index?: number) => {
    const current = settingsForm.reviewsSection?.reviews || storeSettings.reviewsSection?.reviews || [];
    const updated = current.filter((r, i) => (reviewId && r.id ? r.id !== reviewId : i !== index));
    const updatedForm = {
      ...settingsForm,
      reviewsSection: {
        ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
        reviews: updated
      }
    };
    setSettingsForm(updatedForm);
    await deleteReviewAndFeedback(reviewId, index);
    setReviewDeleteToast(true);
    setTimeout(() => setReviewDeleteToast(false), 2500);
  };

  // Handle Settings Save
  const handleSaveSettings = async () => {
    await updateSettings(settingsForm);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  // Handle Image Upload for Product Primary Image (Compressed)
  const handleProductImageUpload = async (file: File, isNew: boolean) => {
    try {
      const dataUrl = await compressImageFile(file, 640, 0.68, 45000);
      if (editingProduct) {
        const currentImages = editingProduct.images || (editingProduct.image ? [editingProduct.image] : []);
        setEditingProduct({
          ...editingProduct,
          image: dataUrl,
          images: [dataUrl, ...currentImages.filter(img => img !== dataUrl)].slice(0, 10)
        });
      }
    } catch (err) {
      console.error('Failed to compress product image', err);
    }
  };

  // Handle Adding Multiple Product Photos from Device (Compressed)
  const handleAddMultipleProductImages = async (files: FileList) => {
    if (!editingProduct) return;
    try {
      const compressedList = await Promise.all(
        Array.from(files).map(f => compressImageFile(f, 640, 0.68, 45000))
      );
      setEditingProduct(prev => {
        if (!prev) return null;
        const currentList = prev.images || (prev.image ? [prev.image] : []);
        const merged = [...currentList, ...compressedList];
        const unique = Array.from(new Set(merged.filter(Boolean)));
        return {
          ...prev,
          image: prev.image || compressedList[0] || '',
          images: unique.slice(0, 10)
        };
      });
    } catch (err) {
      console.error('Failed to compress multiple product images', err);
    }
  };

  // Handle Add Single Product Photo URL
  const handleAddProductPhotoUrl = (url: string) => {
    if (!editingProduct || !url.trim()) return;
    const cleanUrl = url.trim();
    const currentList = editingProduct.images || (editingProduct.image ? [editingProduct.image] : []);
    if (currentList.includes(cleanUrl)) return;
    setEditingProduct({
      ...editingProduct,
      image: editingProduct.image || cleanUrl,
      images: [...currentList, cleanUrl]
    });
  };

  // Handle Remove Photo from Product Gallery
  const handleRemoveProductPhoto = (urlToRemove: string) => {
    if (!editingProduct) return;
    const currentList = editingProduct.images || (editingProduct.image ? [editingProduct.image] : []);
    const filtered = currentList.filter(u => u !== urlToRemove);
    const newPrimary = editingProduct.image === urlToRemove ? (filtered[0] || '') : editingProduct.image;
    setEditingProduct({
      ...editingProduct,
      image: newPrimary,
      images: filtered
    });
  };

  // Start Editing Product
  const startEditProduct = (prod: Product) => {
    const prodImages = prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []);
    setEditingProduct({
      ...prod,
      image: prod.image || prodImages[0] || '',
      images: prodImages
    });
    setNewProductPhotoUrlInput('');
    setIsAddingNewProduct(false);
  };

  // Start Adding Product
  const startAddProduct = () => {
    const initialImg = products[0]?.image || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=800';
    setEditingProduct({
      id: '',
      name: '',
      tagline: '100% Premium Bihar Fox Nuts',
      price: 299,
      originalPrice: 399,
      weight: '250g Pouch',
      shortDescription: 'Fresh crispy makhana roasted to perfection from Mithila wetlands.',
      fullDescription: '',
      image: initialImg,
      images: [initialImg],
      inStock: true,
      stockStatusText: 'In Stock',
      badge: 'New Arrival',
      highlights: ['100% Natural', 'High Protein', 'Gluten Free']
    });
    setNewProductPhotoUrlInput('');
    setIsAddingNewProduct(true);
  };

  // Save Product
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      alert('Product name is required');
      return;
    }

    setIsSavingProduct(true);
    setSaveProductError('');

    try {
      const currentImages = editingProduct.images && editingProduct.images.length > 0
        ? editingProduct.images
        : (editingProduct.image ? [editingProduct.image] : []);
      const primaryImg = editingProduct.image || currentImages[0] || '';
      const finalImages = Array.from(new Set([primaryImg, ...currentImages].filter(Boolean))).slice(0, 10);

      const productPayload = {
        name: editingProduct.name.trim(),
        tagline: (editingProduct.tagline || '').trim(),
        price: Number(editingProduct.price) || 0,
        originalPrice: Number(editingProduct.originalPrice) || 0,
        weight: (editingProduct.weight || '').trim(),
        shortDescription: (editingProduct.shortDescription || '').trim(),
        fullDescription: (editingProduct.fullDescription || '').trim(),
        image: primaryImg,
        images: finalImages,
        inStock: editingProduct.inStock,
        stockStatusText: editingProduct.stockStatusText || 'In Stock',
        badge: editingProduct.badge || 'New Arrival',
        highlights: editingProduct.highlights || [],
      };

      if (isAddingNewProduct) {
        const added = await addProduct(productPayload);
        if (added) {
          setActiveProductId(added.id);
        }
      } else {
        await updateProduct({
          ...editingProduct,
          ...productPayload,
          id: editingProduct.id
        });
      }

      setEditingProduct(null);
      setIsAddingNewProduct(false);
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setSaveProductError('Could not save product: ' + (err?.message || 'Storage error'));
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Save Pricing & Order Rules Settings
  const handleSavePricing = async () => {
    setIsSavingPricing(true);
    setPricingError('');
    try {
      const priceNum = Math.max(0, round2(Number(pricingForm.productPrice) || 0));
      if (priceNum <= 0) throw new Error('Selling Price must be greater than 0');

      const mrpNum = Math.max(priceNum, round2(Number(pricingForm.originalPrice) || priceNum));

      const deliveryNum = Math.max(0, round2(Number(pricingForm.deliveryCharge) || 0));
      const thresholdNum = Math.max(0, round2(Number(pricingForm.freeDeliveryThreshold) || 0));

      let discNum = Math.max(0, round2(Number(pricingForm.discountValue) || 0));
      if (pricingForm.discountType === 'percentage' && discNum > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      if (pricingForm.discountType === 'fixed' && discNum > priceNum) {
        throw new Error(`Fixed discount (₹${discNum}) cannot exceed the product selling price (₹${priceNum})`);
      }

      const minQ = Math.max(1, Math.floor(Number(pricingForm.minOrderQuantity) || 1));
      const maxQ = Math.max(minQ, Math.floor(Number(pricingForm.maxOrderQuantity) || 20));
      const prefix = (pricingForm.orderIdPrefix || 'MK').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MK';

      // 1. Update Firestore settings
      await updateSettings({
        deliveryCharge: deliveryNum,
        freeDeliveryThreshold: thresholdNum,
        freeDeliveryAllOrders: Boolean(pricingForm.freeDeliveryAllOrders),
        discountEnabled: Boolean(pricingForm.discountEnabled),
        discountType: pricingForm.discountType,
        discountValue: discNum,
        minOrderQuantity: minQ,
        maxOrderQuantity: maxQ,
        orderIdPrefix: prefix,
        enableCod: Boolean(pricingForm.enableCod),
        enableUpi: Boolean(pricingForm.enableUpi),
      });

      // 2. Update active product price & MRP in Firestore
      if (activeProduct) {
        await updateProduct({
          ...activeProduct,
          price: priceNum,
          originalPrice: mrpNum,
        });
      }

      setPricingSavedToast(true);
      setTimeout(() => setPricingSavedToast(false), 2500);
    } catch (err: any) {
      console.error('Failed to save pricing settings', err);
      setPricingError(err.message || 'Failed to save pricing settings. Please verify monetary inputs.');
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Initiate Financial Modification for an Order
  const handleStartEditFinancials = (order: Order) => {
    // If completed/delivered order and not yet unlocked by admin, prompt warning dialog first
    if ((order.status === 'Delivered' || order.paymentStatus === 'COD Collected' || order.paymentStatus === 'Paid / Verified') && !unlockedDeliveredOrderIds.has(order.id)) {
      setWarningUnlockOrder(order);
      return;
    }

    setEditingFinancialOrderId(order.id);
    setFinancialForm({
      quantity: order.quantity || 1,
      unitPrice: order.unitPrice || 0,
      discountAmount: order.discountAmount ?? 0,
      deliveryCharge: order.deliveryCharge || 0,
      adminNote: '',
    });
  };

  // Confirm Unlock of Delivered Order
  const handleConfirmUnlockDeliveredOrder = () => {
    if (!warningUnlockOrder) return;
    setUnlockedDeliveredOrderIds(prev => new Set([...prev, warningUnlockOrder.id]));
    setEditingFinancialOrderId(warningUnlockOrder.id);
    setFinancialForm({
      quantity: warningUnlockOrder.quantity || 1,
      unitPrice: warningUnlockOrder.unitPrice || 0,
      discountAmount: warningUnlockOrder.discountAmount ?? 0,
      deliveryCharge: warningUnlockOrder.deliveryCharge || 0,
      adminNote: '',
    });
    setWarningUnlockOrder(null);
  };

  // Request Save Financials -> triggers comparison confirmation modal
  const handleRequestSaveFinancials = (order: Order) => {
    const newQty = Math.max(1, Math.floor(Number(financialForm.quantity) || 1));
    const newUnitPrice = Math.max(0, round2(Number(financialForm.unitPrice) || 0));
    const newBase = round2(newUnitPrice * newQty);
    const newDiscount = Math.max(0, Math.min(newBase, round2(Number(financialForm.discountAmount) || 0)));
    const newSub = Math.max(0, round2(newBase - newDiscount));
    const newDelivery = Math.max(0, round2(Number(financialForm.deliveryCharge) || 0));
    const newTotal = Math.max(0, round2(newSub + newDelivery));

    const changesSummary: string[] = [];
    if (order.quantity !== newQty) changesSummary.push(`Quantity: ${order.quantity} → ${newQty}`);
    if (order.unitPrice !== newUnitPrice) changesSummary.push(`Unit Price: ₹${order.unitPrice} → ₹${newUnitPrice}`);
    if ((order.discountAmount ?? 0) !== newDiscount) changesSummary.push(`Discount: ₹${order.discountAmount ?? 0} → ₹${newDiscount}`);
    if (order.deliveryCharge !== newDelivery) changesSummary.push(`Delivery: ₹${order.deliveryCharge} → ₹${newDelivery}`);
    if (order.totalAmount !== newTotal) changesSummary.push(`Total Amount: ₹${order.totalAmount} → ₹${newTotal}`);

    setConfirmFinancialOrder({
      order,
      newQuantity: newQty,
      newUnitPrice,
      newDiscountAmount: newDiscount,
      newDeliveryCharge: newDelivery,
      newTotal,
      adminNote: financialForm.adminNote.trim(),
      changesSummary,
    });
  };

  // Final Execution of Financial Update with Audit History
  const handleExecuteSaveFinancials = async () => {
    if (!confirmFinancialOrder) return;
    setIsSavingFinancials(true);
    try {
      await updateOrderFinancials(
        confirmFinancialOrder.order.id,
        {
          quantity: confirmFinancialOrder.newQuantity,
          unitPrice: confirmFinancialOrder.newUnitPrice,
          discountAmount: confirmFinancialOrder.newDiscountAmount,
          deliveryCharge: confirmFinancialOrder.newDeliveryCharge,
        },
        confirmFinancialOrder.adminNote
      );

      setEditingFinancialOrderId(null);
      setConfirmFinancialOrder(null);
      setFinancialSaveToast(true);
      setTimeout(() => setFinancialSaveToast(false), 2500);
    } catch (err: any) {
      console.error('Failed to update order financials', err);
      alert('Could not update order financials: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingFinancials(false);
    }
  };

  // Export Data Download
  const handleDownloadBackup = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maknuts-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Data Upload
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const success = await importData(content);
        if (success) {
          alert('Store data restored successfully!');
          setSettingsForm(storeSettings);
        } else {
          alert('Failed to parse backup JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-2 md:p-3 animate-in fade-in duration-150">
      <div 
        className="bg-[#FAF8F5] w-full h-[100dvh] sm:h-[96vh] sm:max-w-7xl lg:max-w-[96vw] rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-stone-300 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header - Mobile-first Executive Dark & Emerald Luxury */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-950 text-white flex items-center justify-between gap-2 shrink-0 border-b border-emerald-900/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-amber-300/30 shadow-md bg-emerald-950 flex items-center justify-center p-0.5 shrink-0">
              <img
                src={maknutsLogo}
                alt="Maknuts Admin"
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-lg font-extrabold font-serif leading-tight tracking-tight text-white truncate">
                  Admin Control Center
                </h2>
                {isAuthenticated && (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-600/40 text-[9px] sm:text-[10px] font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden xs:inline">Synced</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-200/80 truncate hidden sm:block">
                Operations & Storefront Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-stone-700/60 cursor-pointer shadow-xs active:scale-95"
                  title="View Storefront"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Storefront</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await adminLogout();
                  }}
                  className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-rose-800/40 cursor-pointer shadow-xs active:scale-95"
                  title="Sign out from admin panel"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              aria-label="Close admin panel"
            >
              <X className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Auth Gate: Redesigned Mobile-Friendly Luxury Admin Login */}
        {!isAuthenticated ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
            <div className="relative max-w-sm sm:max-w-md w-full mx-auto my-auto text-center space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-200">
              {/* Security Shield & Title */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 mx-auto flex items-center justify-center text-amber-300 shadow-xl border border-emerald-700/50 shadow-emerald-900/30">
                <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-900 border border-emerald-500 flex items-center justify-center text-emerald-200 shadow-sm">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200" />
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-950 font-serif tracking-tight">
                  Admin Control Center
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-xs mx-auto">
                  Enter your credentials to manage products, orders, delivery tracking & store settings.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 py-2 px-3 bg-white/80 backdrop-blur-xs rounded-2xl border border-stone-200/80 text-[10px] font-semibold text-stone-600">
                <div className="flex flex-col items-center gap-0.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>256-Bit SSL</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 border-x border-stone-200">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Live Sync</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Master Role</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5 text-left bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter admin email address"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 transition-all min-h-[44px]"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Admin Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter admin password"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.getModifierState && e.getModifierState('CapsLock')) {
                          setCapsLockActive(true);
                        } else {
                          setCapsLockActive(false);
                        }
                      }}
                      onKeyUp={e => {
                        if (e.getModifierState && e.getModifierState('CapsLock')) {
                          setCapsLockActive(true);
                        } else {
                          setCapsLockActive(false);
                        }
                      }}
                      className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 transition-all font-mono min-h-[44px]"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {passwordInput && (
                        <button
                          type="button"
                          onClick={() => setPasswordInput('')}
                          className="p-1.5 text-stone-400 hover:text-stone-600 rounded-md cursor-pointer"
                          title="Clear input"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {capsLockActive && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-1.5 flex items-center gap-1 font-medium animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Caps Lock is ON — passwords are case-sensitive.</span>
                    </p>
                  )}
                </div>

                {authError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-900 hover:to-stone-950 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 min-h-[48px]"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Verifying Access...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-300" />
                      <span>Login to Admin Console</span>
                      <ArrowRight className="w-4 h-4 text-emerald-300" />
                    </>
                  )}
                </button>
              </form>

              {/* Exit to Public Storefront */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-stone-500 hover:text-emerald-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-stone-200/50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Return to Public Storefront</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* Desktop Left Sidebar */}
            <div className="hidden md:block h-full shrink-0">
              <AdminSidebar
                activeTab={activeTab}
                onSelectTab={handleOpenStoreTab}
                pendingOrdersCount={orders.filter(o => o.status === 'Pending').length}
                pendingReviewsCount={(reviews || []).filter(r => r.status === 'pending').length}
                activeCouponsCount={(storeSettings.coupons || []).filter(c => c.enabled).length}
                productsCount={products.length}
                adminEmail={adminUser?.email || 'maknutsmakhana@gmail.com'}
                onLogout={async () => {
                  await adminLogout();
                }}
                onClose={onClose}
              />
            </div>

            {/* Mobile Drawer (Modal) */}
            {isMobileSidebarOpen && (
              <div 
                className="md:hidden fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <div 
                  className="w-72 h-full max-w-[85vw] animate-in slide-in-from-left duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  <AdminSidebar
                    activeTab={activeTab}
                    onSelectTab={tab => {
                      handleOpenStoreTab(tab);
                      setIsMobileSidebarOpen(false);
                    }}
                    pendingOrdersCount={orders.filter(o => o.status === 'Pending').length}
                    pendingReviewsCount={(reviews || []).filter(r => r.status === 'pending').length}
                    activeCouponsCount={(storeSettings.coupons || []).filter(c => c.enabled).length}
                    productsCount={products.length}
                    adminEmail={adminUser?.email || 'maknutsmakhana@gmail.com'}
                    onLogout={async () => {
                      setIsMobileSidebarOpen(false);
                      await adminLogout();
                    }}
                    onClose={() => setIsMobileSidebarOpen(false)}
                    isMobileOpen={isMobileSidebarOpen}
                    setIsMobileOpen={setIsMobileSidebarOpen}
                  />
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#FAF8F5]">
              {/* Top Sub-Header Bar */}
              <div className="bg-white border-b border-stone-200/90 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
                    title="Toggle Admin Menu"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Store Control Center</div>
                    <div className="text-sm font-serif font-black text-stone-900 capitalize">
                      {activeTab === 'food_compliance' ? 'Food & FSSAI Compliance' : activeTab.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadStoreExecutiveReportPdf(orders, products, storeSettings, storeSettings.coupons || [])}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                    title="Download Complete Store Executive Audit Report PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Store PDF Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
                    title="Preview public customer website"
                  >
                    <Store className="w-3.5 h-3.5 text-emerald-800" />
                    <span className="hidden sm:inline">Preview Storefront</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Container */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 sm:pb-6 space-y-6">
                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                  <AdminOverviewTab
                    orders={orders}
                    products={products}
                    storeSettings={storeSettings}
                    reviews={reviews || []}
                    onNavigateTab={handleOpenStoreTab}
                    onOpenOrder={(order) => {
                      handleOpenStoreTab('orders');
                      setOrderSearchQuery(order.orderNumber);
                    }}
                  />
                )}

                {/* TAB: STOREFRONT */}
                {activeTab === 'storefront' && (
                  <AdminStorefrontTab
                    settings={storeSettings}
                    onSaveSettings={async (updated) => {
                      await updateSettings(updated);
                    }}
                    onPreviewStorefront={onClose}
                  />
                )}

                {/* TAB: COUPONS */}
                {activeTab === 'coupons' && (
                  <AdminCouponsTab
                    coupons={storeSettings.coupons || []}
                    products={products}
                    orders={orders}
                    storeSettings={storeSettings}
                    onOpenOrder={(order) => {
                      handleOpenStoreTab('orders');
                      setOrderSearchQuery(order.orderNumber);
                    }}
                    onSaveCoupons={async (updatedCoupons) => {
                      await updateSettings({ coupons: updatedCoupons });
                    }}
                  />
                )}

                {/* TAB: FOOD & FSSAI COMPLIANCE */}
                {activeTab === 'food_compliance' && (
                  <AdminFoodComplianceTab
                    settings={storeSettings}
                    products={products}
                    onSaveCompliance={async (updatedCompliance) => {
                      await updateSettings({ foodCompliance: updatedCompliance });
                    }}
                  />
                )}

                {/* TAB: PAYMENTS */}
                {activeTab === 'payments' && (
                  <AdminPaymentsTab
                    orders={orders}
                    onUpdatePaymentStatus={async (orderId, newStatus) => {
                      await updatePaymentStatus(orderId, newStatus);
                    }}
                    onOpenOrder={(order) => {
                      handleOpenStoreTab('orders');
                      setOrderSearchQuery(order.orderNumber);
                    }}
                    whatsappNumber={storeSettings.whatsappNumber}
                  />
                )}

                {/* TAB: CUSTOMERS */}
                {activeTab === 'customers' && (
                  <AdminCustomersTab
                    orders={orders}
                    storeSettings={storeSettings}
                    onOpenOrder={(order) => {
                      handleOpenStoreTab('orders');
                      setOrderSearchQuery(order.orderNumber);
                    }}
                  />
                )}

                {/* TAB: MEDIA MANAGER */}
                {activeTab === 'media' && (
                  <AdminMediaTab
                    settings={storeSettings}
                    products={products}
                    onSaveSettings={async (updated) => {
                      await updateSettings(updated);
                    }}
                    onAddGalleryPhoto={async (url, caption) => {
                      await addGalleryPhoto({
                        id: 'gal-' + Date.now(),
                        url,
                        caption,
                        tag: 'Store Photo',
                        createdAt: new Date().toISOString(),
                      });
                    }}
                  />
                )}

                {/* TAB: WHATSAPP */}
                {activeTab === 'whatsapp' && (
                  <AdminWhatsAppTab
                    settings={storeSettings}
                    onSaveSettings={async (updated) => {
                      await updateSettings(updated);
                    }}
                  />
                )}

                {/* TAB: SEO */}
                {activeTab === 'seo' && (
                  <AdminSeoTab
                    settings={storeSettings}
                    onSaveSettings={async (updated) => {
                      await updateSettings(updated);
                    }}
                  />
                )}

                {/* TAB: REPORTS */}
                {activeTab === 'reports' && (
                  <AdminReportsTab
                    orders={orders}
                    products={products}
                    coupons={storeSettings.coupons || []}
                    reviews={reviews || []}
                    storeSettings={storeSettings}
                  />
                )}
              
              {/* TAB 1: PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        Products Catalog
                      </h3>
                      <p className="text-xs text-stone-500">
                        Add, edit prices, descriptions, images and stock status.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => downloadProductsCatalogPdf(products, storeSettings)}
                        className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Download Product Catalog Sheet PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Download Catalog PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={startAddProduct}
                        className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Product</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Cards List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map(prod => (
                      <div 
                        key={prod.id} 
                        className={`bg-white p-4 rounded-2xl border transition-all ${
                          prod.id === activeProduct.id ? 'border-emerald-600 shadow-sm' : 'border-stone-200'
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 object-contain rounded-xl bg-stone-50 p-1 border border-stone-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-bold text-sm text-stone-900 truncate">
                                {prod.name}
                              </h4>
                              {prod.id === activeProduct.id && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                                  Home Showcase
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500">
                              Weight: {prod.weight}
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="font-extrabold text-sm text-emerald-950">
                                ₹{prod.price}
                              </span>
                              {prod.originalPrice > prod.price && (
                                <span className="text-xs text-stone-400 line-through">
                                  ₹{prod.originalPrice}
                                </span>
                              )}
                            </div>

                            {/* In Stock toggle & View Photos button */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateProduct({ ...prod, inStock: !prod.inStock })}
                                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                                  prod.inStock 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {prod.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewProductPhotosModal(prod);
                                  setPreviewProductPhotoIndex(0);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 text-[11px] font-bold transition-all cursor-pointer"
                                title="Click to view all photos for this product in a window"
                              >
                                <Camera className="w-3 h-3 text-emerald-700" />
                                <span>View Photos ({(prod.images && prod.images.length > 0) ? prod.images.length : (prod.image ? 1 : 0)})</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setActiveProductId(prod.id)}
                            className="text-xs text-emerald-800 hover:underline font-semibold"
                          >
                            Set as Homepage Product
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditProduct(prod)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                              title="Edit product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {products.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  deleteProduct(prod.id);
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Edit / Add Product Modal */}
                  {editingProduct && (
                    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
                      <div className="bg-white w-full max-w-xl rounded-3xl p-5 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                          <h4 className="font-bold text-base text-stone-900 font-serif">
                            {isAddingNewProduct ? 'Add New Product' : `Edit: ${editingProduct.name}`}
                          </h4>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Name */}
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            value={editingProduct.name}
                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                            placeholder="e.g. Maknuts Makhana"
                          />
                        </div>

                        {/* Tagline */}
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Tagline / Subtitle
                          </label>
                          <input
                            type="text"
                            value={editingProduct.tagline}
                            onChange={e => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                            placeholder="e.g. 100% Premium Bihar Fox Nuts"
                          />
                        </div>

                        {/* Price, MRP, Weight */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Offer Price (₹) *
                            </label>
                            <input
                              type="number"
                              value={editingProduct.price}
                              onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              MRP Price (₹)
                            </label>
                            <input
                              type="number"
                              value={editingProduct.originalPrice}
                              onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Weight / Size *
                            </label>
                            <input
                              type="text"
                              value={editingProduct.weight}
                              onChange={e => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                              placeholder="e.g. 250g Pouch"
                            />
                          </div>
                        </div>

                        {/* Product Image & Photo Gallery (Multiple Photos Option) */}
                        <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-stone-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-xs font-bold text-stone-900">
                                Product Images & Photo Gallery
                              </label>
                              <p className="text-[11px] text-stone-500">
                                Give customers multiple photos to view (pack, roasted bowl, raw seeds, nutrition).
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                              {(editingProduct.images?.length || (editingProduct.image ? 1 : 0))} Photos
                            </span>
                          </div>

                          {/* Primary Cover Image Card */}
                          <div className="bg-white p-3 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={editingProduct.image || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=800'}
                                alt="Primary Preview"
                                className="w-16 h-16 object-contain rounded-xl border border-stone-200 bg-stone-50 p-1"
                              />
                              <span className="absolute -top-1.5 -left-1.5 bg-emerald-800 text-amber-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                                Primary
                              </span>
                            </div>
                            <div className="flex-1 w-full space-y-1.5">
                              <div className="text-[11px] font-bold text-stone-700">Primary Cover Photo URL or Upload</div>
                              <input
                                type="text"
                                value={editingProduct.image}
                                onChange={e => {
                                  const val = e.target.value;
                                  const cur = editingProduct.images || (editingProduct.image ? [editingProduct.image] : []);
                                  setEditingProduct({
                                    ...editingProduct,
                                    image: val,
                                    images: cur.includes(val) ? cur : [val, ...cur.filter(u => u !== editingProduct.image)]
                                  });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                                placeholder="Primary image URL (http...)"
                              />
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs cursor-pointer transition-colors">
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Change Primary Image File</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleProductImageUpload(file, isAddingNewProduct);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Option to Add More Photos to Catalog */}
                          <div className="pt-2 border-t border-stone-200 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5 text-emerald-800" />
                                <span>Add More Photos to this Product:</span>
                              </span>

                              {/* Multi-photo file uploader from device */}
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                                <Plus className="w-3.5 h-3.5 text-amber-300" />
                                <span>+ Upload Photos from Device</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={e => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleAddMultipleProductImages(e.target.files);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Add Photo by URL */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Or paste photo image URL (https://...)"
                                value={newProductPhotoUrlInput}
                                onChange={e => setNewProductPhotoUrlInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (newProductPhotoUrlInput.trim()) {
                                      handleAddProductPhotoUrl(newProductPhotoUrlInput.trim());
                                      setNewProductPhotoUrlInput('');
                                    }
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newProductPhotoUrlInput.trim()) {
                                    handleAddProductPhotoUrl(newProductPhotoUrlInput.trim());
                                    setNewProductPhotoUrlInput('');
                                  }
                                }}
                                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Add URL
                              </button>
                            </div>

                            {/* Quick Add Sample Makhana Photos */}
                            <div className="bg-stone-100/80 p-2.5 rounded-xl border border-stone-200/70">
                              <div className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Quick Samples (1-Click Add):</span>
                              </div>
                              <div className="flex items-center gap-2 overflow-x-auto py-1">
                                {SAMPLE_MAKHANA_PHOTOS.map((sample, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAddProductPhotoUrl(sample.url)}
                                    className="group flex items-center gap-1.5 px-2 py-1 bg-white hover:bg-emerald-50 rounded-lg border border-stone-200 hover:border-emerald-500 text-[11px] font-medium text-stone-700 transition-all shrink-0 cursor-pointer shadow-2xs"
                                    title="Click to add photo to product gallery"
                                  >
                                    <img src={sample.url} alt="" className="w-5 h-5 rounded object-cover" />
                                    <span>{sample.label}</span>
                                    <Plus className="w-3 h-3 text-emerald-700 group-hover:scale-125 transition-transform" />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Product Photos Gallery Thumbnails */}
                            {(editingProduct.images && editingProduct.images.length > 0) && (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-[11px] font-bold text-stone-600">
                                  Current Product Photos ({editingProduct.images.length}):
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {editingProduct.images.map((imgUrl, idx) => {
                                    const isPrimary = imgUrl === editingProduct.image;
                                    return (
                                      <div 
                                        key={idx} 
                                        className={`relative group bg-white p-1 rounded-xl border transition-all ${
                                          isPrimary ? 'border-emerald-700 ring-2 ring-emerald-700/20 shadow-xs' : 'border-stone-200'
                                        }`}
                                      >
                                        <div className="aspect-square rounded-lg overflow-hidden bg-stone-50 flex items-center justify-center">
                                          <img 
                                            src={imgUrl} 
                                            alt={`Photo ${idx + 1}`} 
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                        {isPrimary && (
                                          <span className="absolute top-2 left-2 bg-emerald-800 text-amber-200 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                                            Primary
                                          </span>
                                        )}
                                        <div className="mt-1 flex items-center justify-between text-[10px] px-0.5">
                                          {!isPrimary ? (
                                            <button
                                              type="button"
                                              onClick={() => setEditingProduct({ ...editingProduct, image: imgUrl })}
                                              className="text-emerald-800 hover:underline font-bold cursor-pointer"
                                            >
                                              Set Primary
                                            </button>
                                          ) : (
                                            <span className="text-emerald-800 font-bold">Cover</span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveProductPhoto(imgUrl)}
                                            className="text-rose-600 hover:text-rose-800 p-0.5 rounded hover:bg-rose-50 cursor-pointer"
                                            title="Remove photo"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={editingProduct.shortDescription}
                            onChange={e => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        {/* Stock & Badge */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Stock Availability
                            </label>
                            <select
                              value={editingProduct.inStock ? 'true' : 'false'}
                              onChange={e => setEditingProduct({ ...editingProduct, inStock: e.target.value === 'true' })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            >
                              <option value="true">In Stock</option>
                              <option value="false">Out of Stock</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Highlight Badge
                            </label>
                            <input
                              type="text"
                              value={editingProduct.badge || ''}
                              onChange={e => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                              placeholder="e.g. Best Seller / Premium"
                            />
                          </div>
                        </div>

                        {saveProductError && (
                          <div className="p-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{saveProductError}</span>
                          </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isSavingProduct}
                            onClick={() => {
                              setEditingProduct(null);
                              setSaveProductError('');
                            }}
                            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingProduct}
                            onClick={handleSaveProduct}
                            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSavingProduct ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Optimizing & Saving...</span>
                              </>
                            ) : (
                              <span>Save Product</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dedicated Product Photos Viewer Window Modal */}
                  {previewProductPhotosModal && (
                    <div 
                      className="fixed inset-0 z-60 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
                      onClick={() => setPreviewProductPhotosModal(null)}
                    >
                      <div 
                        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Top bar */}
                        <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                              <Camera className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-stone-900 font-serif">
                                {previewProductPhotosModal.name} — Photos Gallery
                              </h4>
                              <p className="text-[11px] text-stone-500">
                                Photo {previewProductPhotoIndex + 1} of {((previewProductPhotosModal.images && previewProductPhotosModal.images.length > 0) ? previewProductPhotosModal.images : [previewProductPhotosModal.image]).length}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewProductPhotosModal(null)}
                            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Image stage */}
                        <div className="relative flex-1 bg-stone-50 p-4 flex items-center justify-center min-h-[260px] max-h-[55vh] overflow-hidden">
                          {(() => {
                            const pImgs = (previewProductPhotosModal.images && previewProductPhotosModal.images.length > 0)
                              ? previewProductPhotosModal.images
                              : (previewProductPhotosModal.image ? [previewProductPhotosModal.image] : []);
                            const currentPImg = pImgs[previewProductPhotoIndex] || previewProductPhotosModal.image;
                            return (
                              <>
                                <img
                                  src={currentPImg}
                                  alt="Product preview"
                                  className="max-w-full max-h-[50vh] object-contain rounded-xl drop-shadow-md"
                                />
                                {pImgs.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewProductPhotoIndex(prev => (prev > 0 ? prev - 1 : pImgs.length - 1))}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center border border-stone-200 cursor-pointer active:scale-95"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewProductPhotoIndex(prev => (prev < pImgs.length - 1 ? prev + 1 : 0))}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center border border-stone-200 cursor-pointer active:scale-95"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Thumbnails & footer */}
                        <div className="p-3.5 bg-[#FAF8F5] border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                          {(() => {
                            const pImgs = (previewProductPhotosModal.images && previewProductPhotosModal.images.length > 0)
                              ? previewProductPhotosModal.images
                              : (previewProductPhotosModal.image ? [previewProductPhotosModal.image] : []);
                            return pImgs.length > 1 ? (
                              <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
                                {pImgs.map((img, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setPreviewProductPhotoIndex(idx)}
                                    className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white p-0.5 cursor-pointer ${
                                      idx === previewProductPhotoIndex ? 'border-emerald-800 ring-2 ring-emerald-700/20 scale-105' : 'border-stone-200 opacity-60'
                                    }`}
                                  >
                                    <img src={img} alt="" className="w-full h-full object-cover rounded" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-stone-500">1 photo for this product</span>
                            );
                          })()}

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const prodToEdit = previewProductPhotosModal;
                                setPreviewProductPhotosModal(null);
                                startEditProduct(prodToEdit);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Add / Edit Photos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewProductPhotosModal(null)}
                              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PRICING & ORDER CONTROLS */}
              {activeTab === 'pricing' && (() => {
                const previewPricing = calculateOrderPricing({
                  productPrice: pricingForm.productPrice,
                  originalPrice: pricingForm.originalPrice,
                  quantity: previewTestQty,
                  settings: {
                    ...storeSettings,
                    deliveryCharge: pricingForm.deliveryCharge,
                    freeDeliveryThreshold: pricingForm.freeDeliveryThreshold,
                    freeDeliveryAllOrders: pricingForm.freeDeliveryAllOrders,
                    discountEnabled: pricingForm.discountEnabled,
                    discountType: pricingForm.discountType,
                    discountValue: pricingForm.discountValue,
                    minOrderQuantity: pricingForm.minOrderQuantity,
                    maxOrderQuantity: pricingForm.maxOrderQuantity,
                    orderIdPrefix: pricingForm.orderIdPrefix,
                  },
                });

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                          <BadgePercent className="w-5 h-5 text-emerald-800" />
                          <span>Pricing & Order Settings</span>
                        </h3>
                        <p className="text-xs text-stone-500">
                          Live store pricing, discount rules, delivery charges, and order limits saved to Firestore.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSavePricing}
                        disabled={isSavingPricing}
                        className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                      >
                        {isSavingPricing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                            <span>Saving Changes...</span>
                          </>
                        ) : pricingSavedToast ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-300" />
                            <span>Settings Saved!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 text-amber-300" />
                            <span>Save Pricing Settings</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Feedback Banners */}
                    {pricingSavedToast && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium animate-in fade-in">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Pricing and order parameters updated and published successfully to Firestore!</span>
                      </div>
                    )}

                    {pricingError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>{pricingError}</span>
                      </div>
                    )}

                    {/* Main Layout Grid: Settings Form (Col 1) & Live Preview (Col 2) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      
                      {/* Left: Interactive Controls */}
                      <div className="lg:col-span-7 space-y-4">
                        
                        {/* 1. Product Selling & MRP Price */}
                        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-emerald-700" />
                              1. Product Pricing
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium">
                              Applies to: {activeProduct?.name || 'Primary Product'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Selling Price (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-bold">₹</span>
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={pricingForm.productPrice}
                                  onChange={e => setPricingForm({ ...pricingForm, productPrice: Math.max(0, Number(e.target.value) || 0) })}
                                  className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                                />
                              </div>
                              <span className="text-[10px] text-stone-500 mt-0.5 block">Customer payable unit price</span>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                MRP / Original Price (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-bold">₹</span>
                                <input
                                  type="number"
                                  min={pricingForm.productPrice}
                                  step={1}
                                  value={pricingForm.originalPrice}
                                  onChange={e => setPricingForm({ ...pricingForm, originalPrice: Math.max(0, Number(e.target.value) || 0) })}
                                  className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                                />
                              </div>
                              <span className="text-[10px] text-stone-500 mt-0.5 block">Strikethrough reference MRP</span>
                            </div>
                          </div>

                          {pricingForm.originalPrice > pricingForm.productPrice && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between font-semibold">
                              <span>Display Strikethrough Discount:</span>
                              <span>
                                {Math.round(((pricingForm.originalPrice - pricingForm.productPrice) / pricingForm.originalPrice) * 100)}% OFF MRP
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2. Discount Controls */}
                        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                              <BadgePercent className="w-3.5 h-3.5 text-emerald-700" />
                              2. Store Discount Rule
                            </span>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <span className="text-xs font-bold text-stone-700">
                                {pricingForm.discountEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                              <input
                                type="checkbox"
                                checked={pricingForm.discountEnabled}
                                onChange={e => setPricingForm({ ...pricingForm, discountEnabled: e.target.checked })}
                                className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700 cursor-pointer"
                              />
                            </label>
                          </div>

                          {pricingForm.discountEnabled ? (
                            <div className="space-y-3 animate-in fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Discount Calculation Type
                                  </label>
                                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
                                    <button
                                      type="button"
                                      onClick={() => setPricingForm({ ...pricingForm, discountType: 'percentage' })}
                                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        pricingForm.discountType === 'percentage'
                                          ? 'bg-white text-emerald-950 shadow-xs'
                                          : 'text-stone-600 hover:text-stone-900'
                                      }`}
                                    >
                                      Percentage (%)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPricingForm({ ...pricingForm, discountType: 'fixed' })}
                                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        pricingForm.discountType === 'fixed'
                                          ? 'bg-white text-emerald-950 shadow-xs'
                                          : 'text-stone-600 hover:text-stone-900'
                                      }`}
                                    >
                                      Fixed (₹)
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Discount Value ({pricingForm.discountType === 'percentage' ? '%' : '₹'}) *
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-bold">
                                      {pricingForm.discountType === 'percentage' ? '%' : '₹'}
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={pricingForm.discountType === 'percentage' ? 100 : pricingForm.productPrice}
                                      step={pricingForm.discountType === 'percentage' ? 1 : 5}
                                      value={pricingForm.discountValue}
                                      onChange={e => {
                                        const raw = Number(e.target.value) || 0;
                                        const clamped = pricingForm.discountType === 'percentage'
                                          ? Math.min(100, Math.max(0, raw))
                                          : Math.max(0, raw);
                                        setPricingForm({ ...pricingForm, discountValue: clamped });
                                      }}
                                      className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                                    />
                                  </div>
                                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                                    {pricingForm.discountType === 'percentage'
                                      ? 'Allowed: 0% to 100% of base amount'
                                      : `Max allowed: up to product price (₹${pricingForm.productPrice})`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-500 italic py-1">
                              Discount is currently disabled. Customers will pay full product price without store promotion.
                            </p>
                          )}
                        </div>

                        {/* 3. Delivery Controls */}
                        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-emerald-700" />
                              3. Delivery Charge & Free Delivery Rule
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Standard Delivery Charge (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-bold">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={5}
                                  value={pricingForm.deliveryCharge}
                                  onChange={e => setPricingForm({ ...pricingForm, deliveryCharge: Math.max(0, Number(e.target.value) || 0) })}
                                  className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                                />
                              </div>
                              <span className="text-[10px] text-stone-500 mt-0.5 block">Applied when order below free limit</span>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Free Delivery Threshold (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-bold">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={50}
                                  value={pricingForm.freeDeliveryThreshold}
                                  onChange={e => setPricingForm({ ...pricingForm, freeDeliveryThreshold: Math.max(0, Number(e.target.value) || 0) })}
                                  className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                                />
                              </div>
                              <span className="text-[10px] text-stone-500 mt-0.5 block">Free delivery eligible when subtotal ≥ this</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-stone-900 block">Offer Free Delivery On All Orders</span>
                              <span className="text-[11px] text-stone-500">Bypasses threshold and sets ₹0 delivery for all orders</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={Boolean(pricingForm.freeDeliveryAllOrders)}
                              onChange={e => setPricingForm({ ...pricingForm, freeDeliveryAllOrders: e.target.checked })}
                              className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* 4. Quantity Bounds & Order ID Prefix */}
                        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                              <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
                              4. Quantity Limits & Order ID Prefix
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Minimum Order Qty *
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={pricingForm.maxOrderQuantity}
                                value={pricingForm.minOrderQuantity}
                                onChange={e => {
                                  const val = Math.max(1, Math.floor(Number(e.target.value) || 1));
                                  setPricingForm({ ...pricingForm, minOrderQuantity: val });
                                }}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                              />
                              <span className="text-[10px] text-stone-500 mt-0.5 block">Min customer can pick (min 1)</span>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Maximum Order Qty *
                              </label>
                              <input
                                type="number"
                                min={pricingForm.minOrderQuantity}
                                max={100}
                                value={pricingForm.maxOrderQuantity}
                                onChange={e => {
                                  const val = Math.max(pricingForm.minOrderQuantity, Math.floor(Number(e.target.value) || 20));
                                  setPricingForm({ ...pricingForm, maxOrderQuantity: val });
                                }}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                              />
                              <span className="text-[10px] text-stone-500 mt-0.5 block">Max customer can pick</span>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Order ID Prefix *
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                value={pricingForm.orderIdPrefix}
                                onChange={e => {
                                  const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                  setPricingForm({ ...pricingForm, orderIdPrefix: clean });
                                }}
                                placeholder="MK"
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                              />
                              <span className="text-[10px] text-stone-500 mt-0.5 block font-mono">
                                e.g. {pricingForm.orderIdPrefix || 'MK'}-261009-A7F3
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 5. Payment Options Enabled */}
                        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                              5. Accepted Payment Methods
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-all">
                              <div>
                                <span className="text-xs font-bold text-stone-900 block">UPI QR / Direct UPI</span>
                                <span className="text-[11px] text-stone-500">Google Pay, PhonePe, Paytm QR</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={pricingForm.enableUpi}
                                onChange={e => setPricingForm({ ...pricingForm, enableUpi: e.target.checked })}
                                className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700 cursor-pointer"
                              />
                            </label>

                            <label className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-all">
                              <div>
                                <span className="text-xs font-bold text-stone-900 block">Cash On Delivery (COD)</span>
                                <span className="text-[11px] text-stone-500">Cash collection on delivery</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={pricingForm.enableCod}
                                onChange={e => setPricingForm({ ...pricingForm, enableCod: e.target.checked })}
                                className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>

                      </div>

                      {/* Right: Live Admin Preview Card (Requirement: Product Price − Discount + Delivery = Customer Pays) */}
                      <div className="lg:col-span-5 sticky top-3 space-y-4">
                        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 text-white p-5 rounded-3xl shadow-xl border border-emerald-800/40 space-y-4">
                          
                          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-amber-300" />
                                Live Admin Preview
                              </span>
                              <span className="text-[11px] text-emerald-200/80 block mt-0.5">
                                Live checkout math for customer cart
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-700">
                              Formula Verified
                            </span>
                          </div>

                          {/* Quick Quantity Test Switcher */}
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-200 block mb-1.5">
                              Test Customer Quantity:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[1, 2, 3, 5, 10].map(qty => (
                                <button
                                  key={qty}
                                  type="button"
                                  onClick={() => setPreviewTestQty(qty)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    previewTestQty === qty
                                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                                      : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700/80 border border-emerald-700/60'
                                  }`}
                                >
                                  {qty} {qty === 1 ? 'Unit' : 'Units'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* The Exact Calculation Breakdown Box */}
                          <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                            
                            {/* Product Selling Price x Qty */}
                            <div className="flex justify-between items-center text-emerald-100">
                              <span className="font-sans">Product Price ({previewTestQty} × ₹{pricingForm.productPrice}):</span>
                              <span className="font-bold text-white text-sm">₹{previewPricing.baseAmount.toFixed(2)}</span>
                            </div>

                            {/* Discount */}
                            <div className="flex justify-between items-center text-amber-300">
                              <span className="font-sans flex items-center gap-1">
                                <span>− Store Discount</span>
                                {pricingForm.discountEnabled && pricingForm.discountValue > 0 && (
                                  <span className="text-[10px] bg-amber-400/20 px-1 rounded text-amber-200">
                                    {pricingForm.discountType === 'percentage' ? `${pricingForm.discountValue}% OFF` : 'Fixed'}
                                  </span>
                                )}
                                :
                              </span>
                              <span className="font-bold">−₹{previewPricing.discountAmount.toFixed(2)}</span>
                            </div>

                            {/* Subtotal line */}
                            <div className="flex justify-between items-center text-emerald-200/90 pt-1 border-t border-emerald-800/60">
                              <span className="font-sans">Subtotal (Base − Discount):</span>
                              <span className="font-bold">₹{previewPricing.subtotal.toFixed(2)}</span>
                            </div>

                            {/* Delivery Charge */}
                            <div className="flex justify-between items-center text-emerald-100">
                              <span className="font-sans flex items-center gap-1">
                                <span>+ Delivery Charge:</span>
                                {previewPricing.isFreeDelivery && (
                                  <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1 rounded">
                                    Eligible Free
                                  </span>
                                )}
                              </span>
                              <span className={`font-bold ${previewPricing.isFreeDelivery ? 'text-emerald-300' : 'text-white'}`}>
                                {previewPricing.isFreeDelivery ? '₹0.00 (FREE)' : `+₹${previewPricing.deliveryCharge.toFixed(2)}`}
                              </span>
                            </div>

                            {/* Final Total */}
                            <div className="pt-2.5 border-t-2 border-amber-400/60 flex justify-between items-baseline font-sans">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                                  = Customer Pays
                                </span>
                                <span className="text-[10px] text-emerald-300">
                                  Final Payable Amount
                                </span>
                              </div>
                              <span className="text-2xl font-black text-amber-300 font-serif">
                                ₹{previewPricing.finalTotal.toFixed(2)}
                              </span>
                            </div>

                            {/* Customer savings readout */}
                            {previewPricing.totalSavings > 0 && (
                              <div className="mt-2 pt-2 border-t border-emerald-800/80 font-sans text-[11px] text-emerald-200 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Total Savings:
                                </span>
                                <span className="font-bold text-amber-300 font-mono">
                                  ₹{previewPricing.totalSavings.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Live Guidance Note */}
                          <div className="text-[11px] text-emerald-200/80 space-y-1 bg-emerald-950/80 p-3 rounded-xl border border-emerald-800/60 leading-relaxed">
                            <p className="font-bold text-amber-300">⚙️ How Calculations Work:</p>
                            <p>• <strong>Base Amount:</strong> Product Price × Quantity.</p>
                            <p>• <strong>Discount:</strong> Applied to base amount; never makes total negative.</p>
                            <p>• <strong>Delivery:</strong> Free when subtotal reaches ₹{pricingForm.freeDeliveryThreshold} (otherwise ₹{pricingForm.deliveryCharge}).</p>
                            <p>• <strong>Order ID:</strong> Generated as {pricingForm.orderIdPrefix || 'MK'}-YYMMDD-HEX4 with zero collision.</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* TAB 2: STORE & UPI SETTINGS */}
              {(activeTab === 'store' || activeTab === 'settings') && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        Store, UPI & Payment Settings
                      </h3>
                      <p className="text-xs text-stone-500">
                        Update payment parameters, contact numbers and delivery charges.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {settingsSavedToast ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* UPI ID */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                        UPI Payment Setup
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          UPI ID for Manual Payments
                        </label>
                        <input
                          type="text"
                          value={settingsForm.upiId}
                          onChange={e => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold text-emerald-900"
                          placeholder="e.g. 7504805846@ibl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          UPI Payee Name (Shown in QR)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.upiPayeeName}
                          onChange={e => setSettingsForm({ ...settingsForm, upiPayeeName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          placeholder="e.g. Maknuts Makhana"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-stone-700 font-medium">Enable UPI Payment Option</span>
                        <input
                          type="checkbox"
                          checked={settingsForm.enableUpi}
                          onChange={e => setSettingsForm({ ...settingsForm, enableUpi: e.target.checked })}
                          className="w-4 h-4 text-emerald-700 rounded"
                        />
                      </div>
                    </div>

                    {/* WhatsApp & Cash On Delivery */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        WhatsApp Orders & COD
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          WhatsApp Order Number (with Country Code)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.whatsappNumber}
                          onChange={e => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold text-emerald-900"
                          placeholder="+91 78010 51792"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-xs text-stone-700 font-medium block">
                            Enable Cash on Delivery (COD)
                          </span>
                          <span className="text-[11px] text-stone-400">
                            Allow customers to select Cash on Delivery at checkout
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.enableCod}
                          onChange={e => setSettingsForm({ ...settingsForm, enableCod: e.target.checked })}
                          className="w-4 h-4 text-emerald-700 rounded"
                        />
                      </div>
                    </div>

                    {/* Delivery Charges */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        Shipping & Delivery Charges
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Delivery Charge (₹)
                          </label>
                          <input
                            type="number"
                            value={settingsForm.deliveryCharge}
                            onChange={e => setSettingsForm({ ...settingsForm, deliveryCharge: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Free Delivery Above (₹)
                          </label>
                          <input
                            type="number"
                            value={settingsForm.freeDeliveryThreshold}
                            onChange={e => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="0 for disabled"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Company Info & Password */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        Company & Admin Password
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Shop / Brand Name
                          </label>
                          <input
                            type="text"
                            value={settingsForm.shopName}
                            onChange={e => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Brand Badge (e.g. "Pure", "Organic")
                          </label>
                          <input
                            type="text"
                            value={settingsForm.brandBadge || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, brandBadge: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. Pure"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-900">Firebase Authentication Protected</p>
                          <p className="text-[11px] text-emerald-800/80 mt-0.5">
                            Admin credentials and active sessions are encrypted and authenticated directly via Firebase Auth. Master passwords are never exposed or stored in public documents.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CUSTOMER SUPPORT SETTINGS */}
              {activeTab === 'support' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-emerald-800" />
                        <span>Customer Support & Contact Info</span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        Update customer helpline, email, WhatsApp, warehouse address, and support hours.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {settingsSavedToast && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                          <Check className="w-3.5 h-3.5" /> Saved!
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Support Info</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Form Fields Column */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Contact Channels Card */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Direct Support Channels</span>
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-stone-500" />
                              <span>Support Phone / Helpline</span>
                            </label>
                            <input
                              type="text"
                              value={settingsForm.supportPhone || ''}
                              onChange={e => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                              placeholder="+91 78010 51792"
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                            />
                            <p className="text-[11px] text-stone-400 mt-1">
                              Displayed in the footer as "Call: {settingsForm.supportPhone || 'Not set'}".
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-stone-500" />
                              <span>Support Email Address</span>
                            </label>
                            <input
                              type="email"
                              value={settingsForm.supportEmail || ''}
                              onChange={e => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                              placeholder="Enter support email address"
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                            />
                            <p className="text-[11px] text-stone-400 mt-1">
                              Displayed in the footer and used for customer service inquiries.
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp Support Number</span>
                            </label>
                            <input
                              type="text"
                              value={settingsForm.whatsappNumber || ''}
                              onChange={e => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                              placeholder="+91 78010 51792"
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                            />
                            <p className="text-[11px] text-stone-400 mt-1">
                              Used for quick WhatsApp order placement and live chat buttons.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Address & Hours Card */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Dispatch Location & Operating Hours</span>
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-500" />
                              <span>Customer Support Hours</span>
                            </label>
                            <input
                              type="text"
                              value={settingsForm.supportHours || ''}
                              onChange={e => setSettingsForm({ ...settingsForm, supportHours: e.target.value })}
                              placeholder="Mon - Sun: 9:00 AM - 9:00 PM"
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                            />
                            <p className="text-[11px] text-stone-400 mt-1">
                              Shown with 🕒 icon so customers know operating hours.
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-stone-500" />
                              <span>Dispatch Warehouse / Store Address</span>
                            </label>
                            <textarea
                              rows={2}
                              value={settingsForm.address || ''}
                              onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                              placeholder="Maknuts Agri Foods, Darbhanga, Bihar, India - 846004"
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                            />
                            <p className="text-[11px] text-stone-400 mt-1">
                              Physical dispatch address displayed in footer and order documents.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Column */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Store Footer Preview</span>
                          </span>
                          <span className="text-[10px] text-stone-400">Live Customer View</span>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-stone-200/80 space-y-3 text-xs">
                          <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                            Customer Support
                          </h5>

                          {settingsForm.supportPhone && (
                            <div className="flex items-center gap-2 text-stone-700">
                              <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-medium">Call: {settingsForm.supportPhone}</span>
                            </div>
                          )}

                          {settingsForm.supportEmail && (
                            <div className="flex items-center gap-2 text-stone-700">
                              <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-medium">{settingsForm.supportEmail}</span>
                            </div>
                          )}

                          {settingsForm.address && (
                            <div className="flex items-start gap-2 text-stone-700">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span className="leading-snug">{settingsForm.address}</span>
                            </div>
                          )}

                          {settingsForm.supportHours && (
                            <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 flex items-center gap-1.5">
                              <span>🕒 {settingsForm.supportHours}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSaveSettings}
                            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Support Info</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HOMEPAGE, BANNER & BUTTONS */}
              {activeTab === 'homepage' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        Homepage Text, Banners & Buttons
                      </h3>
                      <p className="text-xs text-stone-500">
                        Edit announcement banner, marketing slogans, and customer buttons.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {settingsSavedToast ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Announcement Banner */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                          Top Announcement Banner
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-600">Show Banner</span>
                          <input
                            type="checkbox"
                            checked={settingsForm.bannerVisible}
                            onChange={e => setSettingsForm({ ...settingsForm, bannerVisible: e.target.checked })}
                            className="w-4 h-4 text-emerald-700 rounded"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={settingsForm.bannerText}
                        onChange={e => setSettingsForm({ ...settingsForm, bannerText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                        placeholder="e.g. 100% Pure Makhana Direct from Bihar Farms · Free Delivery on ₹600+"
                      />
                    </div>

                    {/* Tagline */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                        Header Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={settingsForm.tagline}
                        onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>

                    {/* Button Texts Customization */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        Customer Button Texts
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Buy Now Button Label
                          </label>
                          <input
                            type="text"
                            value={settingsForm.buttons.buyNow}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              buttons: { ...settingsForm.buttons, buyNow: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Place Order WhatsApp Button Label
                          </label>
                          <input
                            type="text"
                            value={settingsForm.buttons.whatsappOrder}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              buttons: { ...settingsForm.buttons, whatsappOrder: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Copy UPI Button Label
                          </label>
                          <input
                            type="text"
                            value={settingsForm.buttons.copyUpi}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              buttons: { ...settingsForm.buttons, copyUpi: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            WhatsApp Contact Button Label
                          </label>
                          <input
                            type="text"
                            value={settingsForm.buttons.chatWhatsApp}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              buttons: { ...settingsForm.buttons, chatWhatsApp: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Track Order (Header) Button Label
                          </label>
                          <input
                            type="text"
                            value={settingsForm.buttons.trackOrder || 'Track Order'}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              buttons: { ...settingsForm.buttons, trackOrder: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Track Order (Banner) Button Label
                          </label>
                          <input
                            type="text"
                            value={settingsForm.buttons.trackBanner || 'Track Order Live'}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              buttons: { ...settingsForm.buttons, trackBanner: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trust Badges Under Product Image */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                            Trust Points Under Product Image
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            Checkmark pills shown directly under the main product picture.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settingsForm.trustBadges || [];
                            setSettingsForm({
                              ...settingsForm,
                              trustBadges: [...current, 'New Trust Badge']
                            });
                          }}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Badge</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(settingsForm.trustBadges || []).map((badge, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                            <input
                              type="text"
                              value={badge}
                              onChange={e => {
                                const updated = [...(settingsForm.trustBadges || [])];
                                updated[idx] = e.target.value;
                                setSettingsForm({ ...settingsForm, trustBadges: updated });
                              }}
                              className="flex-1 px-2 py-1 bg-white rounded-lg border border-stone-200 text-xs font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (settingsForm.trustBadges || []).filter((_, i) => i !== idx);
                                setSettingsForm({ ...settingsForm, trustBadges: updated });
                              }}
                              className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                              title="Delete badge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Content & Credits */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        Footer Texts & Credits
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            About Brand / Store Description (Left Footer Column)
                          </label>
                          <textarea
                            rows={3}
                            value={settingsForm.footerText?.about || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              footerText: {
                                ...(settingsForm.footerText || { about: '', qualityPromise: '', craftedBy: '', copyright: '' }),
                                about: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Quality Guarantee Note (with Shield Icon)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.footerText?.qualityPromise || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              footerText: {
                                ...(settingsForm.footerText || { about: '', qualityPromise: '', craftedBy: '', copyright: '' }),
                                qualityPromise: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Crafted By Credit Note
                            </label>
                            <input
                              type="text"
                              value={settingsForm.footerText?.craftedBy || ''}
                              onChange={e => setSettingsForm({
                                ...settingsForm,
                                footerText: {
                                  ...(settingsForm.footerText || { about: '', qualityPromise: '', craftedBy: '', copyright: '' }),
                                  craftedBy: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                              placeholder="e.g. From our heart to your bowl, crafted with Love by Saroj"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Copyright Note
                            </label>
                            <input
                              type="text"
                              value={settingsForm.footerText?.copyright || ''}
                              onChange={e => setSettingsForm({
                                ...settingsForm,
                                footerText: {
                                  ...(settingsForm.footerText || { about: '', qualityPromise: '', craftedBy: '', copyright: '' }),
                                  copyright: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                              placeholder="e.g. All rights reserved."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WHY CHOOSE US / BENEFITS */}
              {activeTab === 'benefits' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        Why Choose Us / Product Benefits Section
                      </h3>
                      <p className="text-xs text-stone-500">
                        Customize the 6 benefits cards, headings, and descriptions shown on the home page.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {settingsSavedToast ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Headings */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        Section Titles
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Main Heading Title
                          </label>
                          <input
                            type="text"
                            value={settingsForm.benefitsSection?.title || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              benefitsSection: {
                                ...(settingsForm.benefitsSection || { title: '', subtitle: '', items: [] }),
                                title: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. Why Choose Maknuts Makhana?"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Subtitle Text
                          </label>
                          <input
                            type="text"
                            value={settingsForm.benefitsSection?.subtitle || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              benefitsSection: {
                                ...(settingsForm.benefitsSection || { title: '', subtitle: '', items: [] }),
                                subtitle: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. The ancient superfood from Bihar..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Benefit Cards List */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                          Benefit Cards ({settingsForm.benefitsSection?.items?.length || 0})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settingsForm.benefitsSection?.items || [];
                            const newItem = {
                              id: 'benefit-' + Date.now(),
                              title: 'New Benefit',
                              desc: 'Description of the benefit here.'
                            };
                            setSettingsForm({
                              ...settingsForm,
                              benefitsSection: {
                                ...(settingsForm.benefitsSection || { title: '', subtitle: '', items: [] }),
                                items: [...current, newItem]
                              }
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Benefit Card</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {(settingsForm.benefitsSection?.items || []).map((item, idx) => (
                          <div key={item.id || idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 relative">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                                Card #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (settingsForm.benefitsSection?.items || []).filter((_, i) => i !== idx);
                                  setSettingsForm({
                                    ...settingsForm,
                                    benefitsSection: {
                                      ...(settingsForm.benefitsSection || { title: '', subtitle: '', items: [] }),
                                      items: updated
                                    }
                                  });
                                }}
                                className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                                title="Delete card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                                Card Title
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={e => {
                                  const updated = [...(settingsForm.benefitsSection?.items || [])];
                                  updated[idx] = { ...item, title: e.target.value };
                                  setSettingsForm({
                                    ...settingsForm,
                                    benefitsSection: {
                                      ...(settingsForm.benefitsSection || { title: '', subtitle: '', items: [] }),
                                      items: updated
                                    }
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                                Card Description
                              </label>
                              <textarea
                                rows={2}
                                value={item.desc}
                                onChange={e => {
                                  const updated = [...(settingsForm.benefitsSection?.items || [])];
                                  updated[idx] = { ...item, desc: e.target.value };
                                  setSettingsForm({
                                    ...settingsForm,
                                    benefitsSection: {
                                      ...(settingsForm.benefitsSection || { title: '', subtitle: '', items: [] }),
                                      items: updated
                                    }
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: UNIFIED CUSTOMER REVIEWS & FEEDBACK */}
              {activeTab === 'reviews' && (() => {
                const allReviewsList = reviews || [];
                const pendingCount = allReviewsList.filter(r => r.status === 'pending').length;
                const approvedCount = allReviewsList.filter(r => (r.status || 'approved') === 'approved').length;
                const rejectedCount = allReviewsList.filter(r => r.status === 'rejected').length;

                const approvedList = allReviewsList.filter(r => (r.status || 'approved') === 'approved');
                const approvedStats = calculateReviewStats(approvedList);

                const filteredReviews = allReviewsList.filter(r => {
                  const s = r.status || 'approved';
                  if (reviewFilter === 'pending' && s !== 'pending') return false;
                  if (reviewFilter === 'approved' && s !== 'approved') return false;
                  if (reviewFilter === 'rejected' && s !== 'rejected') return false;

                  if (reviewSearch.trim()) {
                    const q = reviewSearch.trim().toLowerCase();
                    const matchName = (r.name || '').toLowerCase().includes(q);
                    const matchComment = (r.comment || '').toLowerCase().includes(q);
                    const matchOriginal = (r.originalComment || '').toLowerCase().includes(q);
                    const matchOrder = (r.orderId || '').toLowerCase().includes(q);
                    const matchPhone = (r.phone || '').includes(q);
                    const matchLocation = (r.location || '').toLowerCase().includes(q);
                    const matchReply = (r.storeReply || '').toLowerCase().includes(q);
                    if (!matchName && !matchComment && !matchOriginal && !matchOrder && !matchPhone && !matchLocation && !matchReply) {
                      return false;
                    }
                  }
                  return true;
                }).sort((a, b) => {
                  if (reviewSort === 'newest') {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  }
                  if (reviewSort === 'oldest') {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  }
                  if (reviewSort === 'highest') {
                    return (Number(b.rating) || 5) - (Number(a.rating) || 5);
                  }
                  if (reviewSort === 'lowest') {
                    return (Number(a.rating) || 5) - (Number(b.rating) || 5);
                  }
                  return 0;
                });

                return (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                      <div>
                        <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                          <MessageSquareHeart className="w-4 h-4 text-emerald-800" />
                          <span>Customer Reviews & Feedback Moderation</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            {allReviewsList.length} Total
                          </span>
                          {pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              {pendingCount} Pending Review
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Moderate customer reviews. Approve to publish, reject/hide, delete spam, verify genuine buyers, and reply publicly.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          {settingsSavedToast ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-amber-300" />
                              <span>Settings Saved!</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Section Settings</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Toast Notification */}
                    {reviewToast && (
                      <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                        reviewToast.type === 'success' 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : reviewToast.type === 'danger'
                          ? 'bg-rose-50 border border-rose-200 text-rose-800'
                          : 'bg-amber-50 border border-amber-200 text-amber-800'
                      }`}>
                        {reviewToast.type === 'success' ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : reviewToast.type === 'danger' ? (
                          <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span>{reviewToast.message}</span>
                      </div>
                    )}

                    {/* Executive Metric Cards - Requirement 9: Calculated strictly from APPROVED reviews only */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Submissions</div>
                        <div className="text-xl font-extrabold text-stone-900 mt-0.5">
                          {allReviewsList.length}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {pendingCount} pending · {approvedCount} live
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Approved Rating</div>
                        <div className="text-xl font-extrabold text-amber-500 mt-0.5 flex items-center gap-1">
                          <span>★</span>
                          <span>
                            {approvedStats.hasReviews ? approvedStats.averageRating.toFixed(1) : '—'}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {approvedStats.hasReviews ? `from ${approvedCount} approved reviews` : 'No reviews yet'}
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Star Breakdown</div>
                        <div className="text-xs font-bold text-stone-800 mt-1 space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-amber-500">5★ / 4★</span>
                            <span className="text-stone-900 font-extrabold">{approvedStats.starCounts[5]} / {approvedStats.starCounts[4]}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-400">3★ / 2★ / 1★</span>
                            <span className="text-stone-700">{approvedStats.starCounts[3]} / {approvedStats.starCounts[2]} / {approvedStats.starCounts[1]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Verified Buyers</div>
                        <div className="text-xl font-extrabold text-emerald-800 mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          <span>{allReviewsList.filter(r => r.verifiedBuyer).length}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Delivered order matches
                        </div>
                      </div>
                    </div>

                    {/* Section Titles Settings */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Public Website Reviews Section Settings</span>
                        </h4>
                        <span className="text-[11px] text-stone-400">Homepage Display</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Main Heading Title
                          </label>
                          <input
                            type="text"
                            value={settingsForm.reviewsSection?.title || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              reviewsSection: {
                                ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                title: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs focus:bg-white focus:outline-none"
                            placeholder="e.g. Customer Reviews & Feedback"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Subtitle Text
                          </label>
                          <input
                            type="text"
                            value={settingsForm.reviewsSection?.subtitle || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              reviewsSection: {
                                ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                subtitle: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs focus:bg-white focus:outline-none"
                            placeholder="e.g. Real feedback from customers across India who snack on Maknuts..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Guarantee Badge Text
                          </label>
                          <input
                            type="text"
                            value={settingsForm.reviewsSection?.guaranteeBadge || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              reviewsSection: {
                                ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                guaranteeBadge: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs focus:bg-white focus:outline-none"
                            placeholder="e.g. 100% Quality Guaranteed"
                          />
                        </div>
                      </div>

                      {/* Requirement 9: Automatic calculation notice, no hardcoded rating */}
                      <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                        <span className="text-stone-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Average Rating on Website:</span>
                          <span className="font-bold text-emerald-950">
                            {approvedStats.hasReviews ? `${approvedStats.averageRating.toFixed(1)} / 5.0 (${approvedCount} approved)` : 'No reviews yet.'}
                          </span>
                        </span>
                        <span className="text-[11px] text-stone-400 italic">
                          Calculated automatically from approved reviews only
                        </span>
                      </div>
                    </div>

                    {/* Moderation Hub: Search, Filters & Sorting (Requirement 3) */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                      {/* Filter Tabs, Search & Sort Bar */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                        {/* Status Filter Tabs (Requirement 3) */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                          <button
                            type="button"
                            onClick={() => setReviewFilter('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              reviewFilter === 'all'
                                ? 'bg-emerald-900 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            All ({allReviewsList.length})
                          </button>

                          <button
                            type="button"
                            onClick={() => setReviewFilter('pending')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                              reviewFilter === 'pending'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : pendingCount > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            <span>⏳ Pending</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/40">
                              {pendingCount}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setReviewFilter('approved')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                              reviewFilter === 'approved'
                                ? 'bg-emerald-800 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            <span>✓ Approved</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200/60">
                              {approvedCount}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setReviewFilter('rejected')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                              reviewFilter === 'rejected'
                                ? 'bg-rose-800 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            <span>✕ Rejected</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200/60">
                              {rejectedCount}
                            </span>
                          </button>
                        </div>

                        {/* Search & Sort Controls (Requirement 3) */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          {/* Search Input */}
                          <div className="relative flex-1 sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                              type="text"
                              value={reviewSearch}
                              onChange={e => setReviewSearch(e.target.value)}
                              placeholder="Search name, text, order, phone..."
                              className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                            />
                            {reviewSearch && (
                              <button
                                type="button"
                                onClick={() => setReviewSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Sort Dropdown */}
                          <div className="relative">
                            <select
                              value={reviewSort}
                              onChange={e => setReviewSort(e.target.value as any)}
                              className="w-full sm:w-auto px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer focus:bg-white focus:outline-none"
                            >
                              <option value="newest">Sort: Newest First</option>
                              <option value="oldest">Sort: Oldest First</option>
                              <option value="highest">Sort: Highest Rating (5★ → 1★)</option>
                              <option value="lowest">Sort: Lowest Rating (1★ → 5★)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Reviews List */}
                      {filteredReviews.length === 0 ? (
                        <div className="text-center py-12 text-stone-400">
                          <MessageSquareHeart className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-800" />
                          <p className="text-sm font-semibold text-stone-600">No reviews match your filter</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {reviewSearch ? 'Try a different search keyword or clear filters.' : 'No customer reviews submitted in this category.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-1">
                          {filteredReviews.map((review, idx) => {
                            const isPending = review.status === 'pending';
                            const isApproved = (review.status || 'approved') === 'approved';
                            const isRejected = review.status === 'rejected';

                            // Requirement 7: Verified buyer matching against loaded orders
                            const cleanPhone = review.phone ? review.phone.replace(/\D/g, '').slice(-10) : '';
                            const cleanOrder = review.orderId ? review.orderId.trim().toLowerCase() : '';
                            const matchedOrder = orders.find(o => 
                              cleanOrder && (o.orderNumber.trim().toLowerCase() === cleanOrder || o.id === review.orderId?.trim()) &&
                              cleanPhone && o.phone.replace(/\D/g, '').slice(-10) === cleanPhone
                            );
                            const orderIsDelivered = matchedOrder && (matchedOrder.status === 'Delivered' || (matchedOrder.status as string) === 'Completed');

                            return (
                              <div 
                                key={review.id || idx} 
                                className={`p-4 rounded-2xl border transition-all space-y-3.5 shadow-2xs ${
                                  isPending 
                                    ? 'bg-amber-50/40 border-amber-300/80 ring-1 ring-amber-300/30' 
                                    : isApproved 
                                    ? 'bg-stone-50/80 border-stone-200' 
                                    : 'bg-rose-50/30 border-rose-200 opacity-80'
                                }`}
                              >
                                {/* Item Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Status Badge */}
                                    {isPending && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                                        <span>⏳ Pending Moderation</span>
                                      </span>
                                    )}
                                    {isApproved && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                                        <Check className="w-3 h-3 text-emerald-700" />
                                        <span>Live on Website</span>
                                      </span>
                                    )}
                                    {isRejected && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                        <EyeOff className="w-3 h-3 text-rose-600" />
                                        <span>Rejected / Hidden</span>
                                      </span>
                                    )}

                                    {/* Star Rating Badge */}
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                                      <span>{'★'.repeat(review.rating || 5)}</span>
                                      <span className="text-stone-700 font-bold">({review.rating || 5}/5)</span>
                                    </span>

                                    {/* Date */}
                                    {review.createdAt && (
                                      <span className="text-[10px] text-stone-400">
                                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Top Actions: WhatsApp, Delete */}
                                  <div className="flex items-center gap-2">
                                    {review.phone && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const text = `Hello ${review.name}! Thank you for your ${review.rating}-star review on ${storeSettings.shopName}. We appreciate your support!`;
                                          const url = createWhatsAppUrl(review.phone!, text);
                                          window.open(url, '_blank', 'noopener,noreferrer');
                                        }}
                                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                        title="Send message to customer on WhatsApp"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>WhatsApp</span>
                                      </button>
                                    )}

                                    {/* Delete Spam Review (Requirement 3) */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSpamReview(review.id)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Permanently delete spam review"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete Spam</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Customer Info & Verified Buyer Inspection (Requirement 7) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Customer Name</span>
                                    <span className="font-bold text-stone-900">{review.name}</span>
                                    {review.location && <span className="text-stone-500 text-[11px]"> ({review.location})</span>}
                                  </div>

                                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Contact Phone</span>
                                    <span className="font-mono text-stone-800">{review.phone || 'Not provided'}</span>
                                  </div>

                                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Order ID Provided</span>
                                    <span className="font-mono text-stone-800">{review.orderId || 'None'}</span>
                                  </div>

                                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Verified Buyer Status</span>
                                    {review.verifiedBuyer ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[11px]">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Verified Buyer ✓</span>
                                      </span>
                                    ) : orderIsDelivered ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]" title="Order matches and is Delivered">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Delivered (Eligible)</span>
                                      </span>
                                    ) : matchedOrder ? (
                                      <span className="text-amber-700 font-semibold text-[11px]">
                                        Order Status: {matchedOrder.status}
                                      </span>
                                    ) : review.orderId ? (
                                      <span className="text-stone-500 text-[11px]">
                                        Unmatched Order
                                      </span>
                                    ) : (
                                      <span className="text-stone-400 text-[11px]">
                                        No order attached
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Review Comment & Edit Area (Requirement 11) */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                                      <span>Customer Review Text</span>
                                      {review.adminEditedAt && (
                                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.2 rounded-md border border-amber-200">
                                          Edited by Admin on {new Date(review.adminEditedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </label>

                                    {editingReviewId !== review.id && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingReviewId(review.id);
                                          setEditingReviewText(review.comment || review.originalComment || '');
                                        }}
                                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Edit Text</span>
                                      </button>
                                    )}
                                  </div>

                                  {editingReviewId === review.id ? (
                                    <div className="space-y-2 p-3 bg-white rounded-xl border border-emerald-300">
                                      <textarea
                                        rows={3}
                                        value={editingReviewText}
                                        onChange={e => setEditingReviewText(e.target.value)}
                                        className="w-full p-2 bg-stone-50 rounded-lg border border-stone-300 text-xs focus:bg-white focus:outline-none"
                                        placeholder="Edit review text..."
                                      />
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingReviewId(null);
                                            setEditingReviewText('');
                                          }}
                                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveEditedReviewText(review.id)}
                                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                          Save & Preserve Original
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 italic">
                                      "{review.comment || review.originalComment || ''}"
                                    </div>
                                  )}

                                  {/* Requirement 11: Preserved Original Comment Display */}
                                  {review.originalComment && review.originalComment !== review.comment && (
                                    <div className="text-[11px] pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedOriginalId(expandedOriginalId === review.id ? null : review.id)}
                                        className="text-stone-500 hover:text-stone-700 font-semibold underline cursor-pointer"
                                      >
                                        {expandedOriginalId === review.id ? 'Hide Original Customer Text' : 'View Original Customer Text'}
                                      </button>
                                      {expandedOriginalId === review.id && (
                                        <div className="mt-1 p-2.5 bg-stone-100/80 rounded-lg border border-stone-200 text-stone-600 italic">
                                          Original: "{review.originalComment}"
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Customer Uploaded Photo if present */}
                                {review.photo && (
                                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 text-xs">
                                    <span className="font-semibold text-stone-600 text-[11px]">Attached Photo:</span>
                                    <div 
                                      className="w-10 h-10 rounded-lg overflow-hidden border border-stone-300 cursor-pointer shadow-2xs"
                                      onClick={() => window.open(review.photo, '_blank')}
                                      title="Click to view full photo"
                                    >
                                      <img src={review.photo} alt="Customer upload" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}

                                {/* Store Reply Section (Requirement 10) */}
                                <div className="space-y-1.5 pt-1">
                                  {review.storeReply && replyingReviewId !== review.id ? (
                                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                                          <Store className="w-3.5 h-3.5 text-emerald-700" />
                                          <span>Public Store Reply</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setReplyingReviewId(review.id);
                                              setReplyingText(review.storeReply || '');
                                            }}
                                            className="text-emerald-800 hover:underline font-semibold cursor-pointer"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveStoreReply(review.id)}
                                            className="text-rose-700 hover:underline font-semibold cursor-pointer"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-stone-700 italic">
                                        "{review.storeReply}"
                                      </p>
                                    </div>
                                  ) : replyingReviewId === review.id ? (
                                    <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
                                      <label className="block text-[11px] font-bold text-emerald-950">
                                        Add / Edit Public Store Reply
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={replyingText}
                                        onChange={e => setReplyingText(e.target.value)}
                                        placeholder="Thank you! We're glad you loved the crunch..."
                                        className="w-full p-2 bg-stone-50 rounded-lg border border-stone-300 text-xs focus:bg-white focus:outline-none"
                                      />
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReplyingReviewId(null);
                                            setReplyingText('');
                                          }}
                                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveStoreReply(review.id)}
                                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                          Publish Store Reply
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingReviewId(review.id);
                                        setReplyingText('');
                                      }}
                                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Store className="w-3.5 h-3.5" />
                                      <span>Add Public Store Reply</span>
                                    </button>
                                  )}
                                </div>

                                {/* Main Moderation Action Buttons (Requirement 3: Approve / Reject / Hide) */}
                                <div className="pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-[11px] text-stone-500">
                                    ID: <span className="font-mono">{review.id}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Approve Button */}
                                    {!isApproved && (
                                      <button
                                        type="button"
                                        onClick={() => handleApproveReview(review.id)}
                                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                        title="Approve review so it appears publicly on the store"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Approve & Publish</span>
                                      </button>
                                    )}

                                    {/* Reject / Hide Button */}
                                    {!isRejected && (
                                      <button
                                        type="button"
                                        onClick={() => handleRejectReview(review.id)}
                                        className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                                        title="Reject or hide review from public store"
                                      >
                                        <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                                        <span>Reject / Hide</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB: PHOTO GALLERY MANAGER */}
              {activeTab === 'gallery' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        Photo Gallery Manager
                      </h3>
                      <p className="text-xs text-stone-500">
                        Upload farm photos, roasting batches, and customer snaps shown on the home page.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {settingsSavedToast ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Gallery Section Texts */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        Section Titles & Button Label
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Gallery Section Title
                          </label>
                          <input
                            type="text"
                            value={settingsForm.gallerySection?.title || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              gallerySection: {
                                ...(settingsForm.gallerySection || { title: '', subtitle: '', buttonLabel: '', photos: [] }),
                                title: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. Our Purity in Pictures"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Subtitle Text
                          </label>
                          <input
                            type="text"
                            value={settingsForm.gallerySection?.subtitle || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              gallerySection: {
                                ...(settingsForm.gallerySection || { title: '', subtitle: '', buttonLabel: '', photos: [] }),
                                subtitle: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. Direct from pristine wetlands of Bihar..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Photo Showcase Button Label
                          </label>
                          <input
                            type="text"
                            value={settingsForm.gallerySection?.buttonLabel || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              gallerySection: {
                                ...(settingsForm.gallerySection || { title: '', subtitle: '', buttonLabel: '', photos: [] }),
                                buttonLabel: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. 📸 View Farm & Product Photos"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Add Photo Card */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                              Add New Photo
                            </h4>
                            <p className="text-[11px] text-stone-500">
                              Upload an image from your device or paste any image web URL.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                        {/* Left: Image input options */}
                        <div className="sm:col-span-8 space-y-3">
                          {/* File upload or URL */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Option A: Upload Image File
                              </label>
                              <label className="flex items-center justify-center gap-2 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-300 rounded-xl cursor-pointer text-xs text-stone-700 transition-colors">
                                <Upload className="w-4 h-4 text-emerald-700" />
                                <span>{isUploadingPhoto ? 'Uploading...' : 'Choose Photo (Device)'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleGalleryFileUpload(file);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Option B: Paste Image URL
                              </label>
                              <input
                                type="url"
                                value={newPhotoUrl.startsWith('data:') ? '' : newPhotoUrl}
                                onChange={e => setNewPhotoUrl(e.target.value)}
                                placeholder="https://example.com/photo.jpg"
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                              />
                            </div>
                          </div>

                          {/* Caption */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Photo Caption / Story
                            </label>
                            <input
                              type="text"
                              value={newPhotoCaption}
                              onChange={e => setNewPhotoCaption(e.target.value)}
                              placeholder="e.g. Hand-harvested lotus seeds drying under clean Mithila sun"
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                            />
                          </div>
                        </div>

                        {/* Right: Live Preview Box */}
                        <div className="sm:col-span-4 flex flex-col items-center">
                          <label className="block text-xs font-semibold text-stone-700 mb-1 self-start">
                            Photo Preview
                          </label>
                          <div className="w-full aspect-square rounded-2xl border border-stone-300 bg-stone-50 overflow-hidden flex items-center justify-center relative shadow-inner">
                            {newPhotoUrl ? (
                              <img
                                src={newPhotoUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-3 text-stone-400">
                                <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                                <p className="text-[11px]">Upload or paste URL to preview</p>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleAddPhotoToGallery}
                            disabled={!newPhotoUrl}
                            className="w-full mt-3 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Photo to Gallery</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current Photos List */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                            Current Gallery Photos ({(settingsForm.gallerySection?.photos || []).length})
                          </h4>
                          <span className="text-[11px] text-stone-500">
                            These appear in the photo gallery showcase on your home page.
                          </span>
                        </div>
                      </div>

                      {galleryDeleteToast && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
                          <Check className="w-4 h-4 text-rose-600" />
                          <span>Photo removed from gallery successfully!</span>
                        </div>
                      )}

                      {(settingsForm.gallerySection?.photos || []).length === 0 ? (
                        <div className="text-center py-8 text-stone-400">
                          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No photos in gallery currently. Upload a photo above to display it on your home page!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
                          {(settingsForm.gallerySection?.photos || []).map((photo, idx) => (
                            <div key={photo.id || idx} className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between">
                              <div className="relative aspect-video w-full bg-stone-100">
                                <img
                                  src={photo.url}
                                  alt={photo.caption}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhotoFromGallery(photo.id, idx)}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer transition-colors active:scale-95"
                                  title="Delete photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="p-3 space-y-2 text-xs">
                                <div>
                                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    Photo Caption / Story
                                  </label>
                                  <input
                                    type="text"
                                    value={photo.caption}
                                    onChange={e => {
                                      const current = [...(settingsForm.gallerySection?.photos || [])];
                                      current[idx] = { ...photo, caption: e.target.value };
                                      setSettingsForm({
                                        ...settingsForm,
                                        gallerySection: {
                                          ...(settingsForm.gallerySection || { title: '', subtitle: '', buttonLabel: '', photos: [] }),
                                          photos: current
                                        }
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                                    placeholder="Photo caption..."
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePhotoFromGallery(photo.id, idx)}
                                  className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-98 shadow-2xs"
                                  title="Delete this photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete Photo</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ORDERS RECEIVED */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        Customer Orders ({orders.length})
                      </h3>
                      <p className="text-xs text-stone-500">
                        Orders initiated by customers with full delivery details.
                      </p>
                    </div>

                    {orders.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOrderPurgeActionType('archive');
                            setClearOrdersConfirmationText('');
                            setIsClearOrdersModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5 text-amber-700" />
                          <span>Archive Orders</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderPurgeActionType('permanent');
                            setClearOrdersConfirmationText('');
                            setIsClearOrdersModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                          <span>Clear Order List</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Order Search & Status Filter Toolbar */}
                  <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Search orders by Order #, Customer Name, Phone, or Courier AWB..."
                          value={orderSearchQuery}
                          onChange={e => setOrderSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                        {[
                          { id: 'all', label: `All (${orders.length})` },
                          { id: 'Pending', label: `Pending (${orders.filter(o => o.status === 'Pending').length})` },
                          { id: 'Confirmed', label: 'Confirmed' },
                          { id: 'Shipped', label: 'Shipped' },
                          { id: 'Delivered', label: 'Delivered' },
                          { id: 'Cancelled', label: 'Cancelled' },
                        ].map(status => (
                          <button
                            key={status.id}
                            type="button"
                            onClick={() => setOrderStatusFilter(status.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              orderStatusFilter === status.id
                                ? 'bg-emerald-800 text-white shadow-2xs'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PDF Batch & Detail Export Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-stone-700">
                          <input
                            type="checkbox"
                            checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedOrderIds(orders.map(o => o.id));
                              } else {
                                setSelectedOrderIds([]);
                              }
                            }}
                            className="w-4 h-4 accent-emerald-800 rounded"
                          />
                          <span>Select All ({selectedOrderIds.length}/{orders.length})</span>
                        </label>
                        {selectedOrderIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderIds([])}
                            className="text-stone-400 hover:text-stone-700 text-[11px] underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedOrderIds.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
                              downloadOrdersReportPdf(selectedOrders, storeSettings, `Selected ${selectedOrders.length} Orders Detailed Report`);
                            }}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-300" />
                            <span>Download Selected ({selectedOrderIds.length}) PDF</span>
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => downloadOrdersReportPdf(orders, storeSettings, 'All Orders Detailed Audit Report')}
                          disabled={orders.length === 0}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Download All Orders PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const filteredAdminOrders = orders.filter(o => {
                      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                      if (!orderSearchQuery.trim()) return true;
                      const q = orderSearchQuery.toLowerCase().trim();
                      return (
                        o.orderNumber.toLowerCase().includes(q) ||
                        o.customerName.toLowerCase().includes(q) ||
                        o.phone.toLowerCase().includes(q) ||
                        (o.courierTrackingNumber && o.courierTrackingNumber.toLowerCase().includes(q))
                      );
                    });

                    if (orders.length === 0) {
                      return (
                        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6">
                          <ShoppingCart className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-stone-700">No orders received yet</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            When customers tap 'Buy Now' and place orders, their order details will appear here.
                          </p>
                        </div>
                      );
                    }

                    if (filteredAdminOrders.length === 0) {
                      return (
                        <div className="text-center py-8 bg-white rounded-2xl border border-stone-200 p-6 text-xs text-stone-400">
                          No orders match "{orderSearchQuery}" with status "{orderStatusFilter}".
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filteredAdminOrders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedOrderIds(prev => [...prev, order.id]);
                                  } else {
                                    setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                                  }
                                }}
                                className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                                title="Select order for batch operations"
                              />
                              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                                #{order.orderNumber}
                              </span>
                              <span className="text-xs text-stone-500">
                                {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>

                              <button
                                type="button"
                                onClick={() => downloadOrderInvoicePdf(order, storeSettings)}
                                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Download Customer Invoice PDF"
                              >
                                <Download className="w-3 h-3 text-amber-700" />
                                <span>Invoice PDF</span>
                              </button>
                            </div>

                            {/* Status Selectors (Order Status & Payment Status kept separate) */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Order Fulfillment Status */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Order:</span>
                                <select
                                  value={order.status}
                                  onChange={e => updateOrderStatus(order.id, e.target.value as Order['status'])}
                                  className={`text-xs font-bold px-2.5 py-1.5 min-h-[38px] rounded-xl border cursor-pointer ${
                                    order.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                    order.status === 'Shipped' ? 'bg-sky-50 text-sky-800 border-sky-300' :
                                    order.status === 'Delivered' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                                    order.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                                    'bg-stone-50 text-stone-700 border-stone-300'
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>

                              {/* Payment Status (Controlled by Admin Only) */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Payment:</span>
                                <select
                                  value={order.paymentStatus || (order.paymentMethod === 'cod' ? 'COD Pending' : 'Pending')}
                                  onChange={e => updatePaymentStatus(order.id, e.target.value as PaymentStatus)}
                                  className={`text-xs font-bold px-2.5 py-1.5 min-h-[38px] rounded-xl border cursor-pointer ${
                                    (order.paymentStatus === 'Paid / Verified' || order.paymentStatus === 'COD Collected')
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : (order.paymentStatus === 'Verification Required')
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : (order.paymentStatus === 'COD Pending')
                                      ? 'bg-sky-50 text-sky-800 border-sky-300'
                                      : (order.paymentStatus === 'Failed')
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : (order.paymentStatus === 'Refunded')
                                      ? 'bg-purple-50 text-purple-800 border-purple-300'
                                      : 'bg-stone-50 text-stone-700 border-stone-300'
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Verification Required">Verification Required</option>
                                  <option value="Paid / Verified">Paid / Verified</option>
                                  <option value="COD Pending">COD Pending</option>
                                  <option value="COD Collected">COD Collected</option>
                                  <option value="Failed">Failed</option>
                                  <option value="Refunded">Refunded</option>
                                </select>
                              </div>

                              <button
                                onClick={() => setDeletingSingleOrder(order)}
                                className="min-h-[38px] min-w-[38px] rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete order record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            {/* Customer Column */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                                Customer & Contact
                              </span>
                              <p className="font-bold text-stone-900">{order.customerName}</p>
                              <p className="text-stone-600 flex items-center gap-1.5 mt-0.5">
                                <span>📞 +91 {order.phone}</span>
                                <a
                                  href={`https://wa.me/91${order.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(order.customerName)},%20regarding%20your%20Maknuts%20Order%20%23${order.orderNumber}:`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-emerald-700 font-bold hover:underline"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Chat</span>
                                </a>
                              </p>
                              <p className="text-stone-500 mt-1 text-[11px] leading-snug">
                                {order.address}, PIN: {order.pincode}
                              </p>
                            </div>

                            {/* Order Items & Complete Pricing Breakdown */}
                            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-stone-200/80 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                                  Pricing Breakdown
                                </span>
                                {order.pricingSnapshot && (
                                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded" title="Immutable pricing snapshot captured at purchase time">
                                    Snapshot Saved
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-stone-900 text-xs">
                                {order.productName} ({order.productWeight})
                              </p>
                              <div className="space-y-0.5 text-[11px] text-stone-600 pt-1 border-t border-stone-200/60">
                                <div className="flex justify-between">
                                  <span>Unit Price:</span>
                                  <span className="font-medium text-stone-800">
                                    ₹{order.unitPrice} {order.originalPrice && order.originalPrice > order.unitPrice ? <span className="text-[10px] text-stone-400 line-through">(MRP ₹{order.originalPrice})</span> : null}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Quantity:</span>
                                  <span className="font-medium text-stone-800">{order.quantity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Base Amount ({order.quantity} × ₹{order.unitPrice}):</span>
                                  <span className="font-medium text-stone-800">₹{order.baseAmount ?? round2(order.unitPrice * order.quantity)}</span>
                                </div>
                                {(order.discountAmount ?? 0) > 0 ? (
                                  <div className="flex justify-between text-emerald-800 font-semibold">
                                    <span>Discount {order.discountType === 'percentage' && order.discountValue ? `(${order.discountValue}%)` : ''}:</span>
                                    <span>−₹{order.discountAmount}</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-between text-stone-400">
                                    <span>Discount:</span>
                                    <span>₹0</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span className="font-medium text-stone-800">₹{order.subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery Charge:</span>
                                  <span className={`font-medium ${order.deliveryCharge === 0 ? 'text-emerald-700 font-bold' : 'text-stone-800'}`}>
                                    {order.deliveryCharge === 0 ? 'FREE (₹0)' : `₹${order.deliveryCharge}`}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs font-extrabold text-emerald-950 pt-1 border-t border-stone-200">
                                  <span>Final Payable Total:</span>
                                  <span className="text-emerald-900 font-bold">₹{order.totalAmount}</span>
                                </div>
                              </div>
                            </div>

                            {/* Payment Info */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                                Payment Details
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  order.paymentMethod === 'upi'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}>
                                  {order.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash On Delivery'}
                                </span>
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  (order.paymentStatus === 'Paid / Verified' || order.paymentStatus === 'COD Collected')
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : (order.paymentStatus === 'Verification Required')
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : (order.paymentStatus === 'COD Pending')
                                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                                    : (order.paymentStatus === 'Failed')
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : (order.paymentStatus === 'Refunded')
                                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                                    : 'bg-stone-50 text-stone-700 border-stone-300'
                                }`}>
                                  {order.paymentStatus || (order.paymentMethod === 'cod' ? 'COD Pending' : 'Pending')}
                                </span>
                              </div>

                              {order.upiRefNumber && (
                                <div className="flex items-center gap-1.5 p-1.5 bg-stone-50 rounded-lg border border-stone-200 mt-1">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">UTR Number:</span>
                                    <span className="font-mono font-bold text-xs text-stone-900 truncate block select-all">{order.upiRefNumber}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(order.upiRefNumber || '')}
                                    className="p-1 text-stone-500 hover:text-emerald-800 rounded bg-white border border-stone-200 cursor-pointer"
                                    title="Copy UTR Number"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {order.paymentScreenshot && (
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewScreenshotUrl(order.paymentScreenshot || null)}
                                    className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>View Legacy Screenshot</span>
                                  </button>
                                </div>
                              )}

                              {order.note && (
                                <p className="text-stone-500 italic mt-1 text-[11px]">
                                  Note: "{order.note}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Order Financial Controls & Corrections */}
                          <div className="pt-2 border-t border-stone-100">
                            {(() => {
                              const isCompleted = order.status === 'Delivered' || order.paymentStatus === 'COD Collected' || order.paymentStatus === 'Paid / Verified';
                              const isUnlocked = unlockedDeliveredOrderIds.has(order.id);
                              const isLocked = isCompleted && !isUnlocked;
                              const isEditing = editingFinancialOrderId === order.id;

                              // Live recalculation values
                              const liveQty = Math.max(1, Math.floor(Number(financialForm.quantity) || 1));
                              const livePrice = Math.max(0, round2(Number(financialForm.unitPrice) || 0));
                              const liveBase = round2(livePrice * liveQty);
                              const liveDiscount = Math.max(0, Math.min(liveBase, round2(Number(financialForm.discountAmount) || 0)));
                              const liveSubtotal = Math.max(0, round2(liveBase - liveDiscount));
                              const liveDelivery = Math.max(0, round2(Number(financialForm.deliveryCharge) || 0));
                              const liveTotal = Math.max(0, round2(liveSubtotal + liveDelivery));

                              return (
                                <div className="space-y-2">
                                  {/* Bar with Edit / Unlock trigger */}
                                  {!isEditing && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-stone-50 p-2 rounded-xl border border-stone-200">
                                      <div className="flex items-center gap-2">
                                        <Calculator className="w-3.5 h-3.5 text-stone-500" />
                                        <span className="font-semibold text-stone-700">Financial Order Control:</span>
                                        {isLocked ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                            <Lock className="w-3 h-3 text-amber-700" />
                                            <span>Protected (Completed Order)</span>
                                          </span>
                                        ) : isCompleted && isUnlocked ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                                            <Unlock className="w-3 h-3 text-rose-700" />
                                            <span>Unlocked for Correction</span>
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-stone-500">
                                            Editable by authenticated admin
                                          </span>
                                        )}
                                      </div>

                                      {isLocked ? (
                                        <button
                                          type="button"
                                          onClick={() => setWarningUnlockOrder(order)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors cursor-pointer"
                                          title="Unlock completed order financials for genuine accounting correction"
                                        >
                                          <Unlock className="w-3.5 h-3.5" />
                                          <span>Unlock for Correction</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleStartEditFinancials(order)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>Modify Financials</span>
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* Inline Financial Modification Form */}
                                  {isEditing && (
                                    <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                                      <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                                        <div className="flex items-center gap-2">
                                          <Calculator className="w-4 h-4 text-amber-800" />
                                          <span className="text-xs font-bold text-amber-950">
                                            Modify Financial Values — Order #{order.orderNumber}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setEditingFinancialOrderId(null)}
                                          className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer font-semibold"
                                        >
                                          ✕ Cancel
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                        {/* Quantity */}
                                        <div>
                                          <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                            Quantity *
                                          </label>
                                          <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={financialForm.quantity}
                                            onChange={e => setFinancialForm({ ...financialForm, quantity: Math.max(1, Number(e.target.value) || 1) })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                          />
                                        </div>

                                        {/* Unit Price */}
                                        <div>
                                          <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                            Unit Price (₹) *
                                          </label>
                                          <input
                                            type="number"
                                            min={0}
                                            value={financialForm.unitPrice}
                                            onChange={e => setFinancialForm({ ...financialForm, unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                          />
                                        </div>

                                        {/* Discount Amount */}
                                        <div>
                                          <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                            Discount (₹)
                                          </label>
                                          <input
                                            type="number"
                                            min={0}
                                            max={liveBase}
                                            value={financialForm.discountAmount}
                                            onChange={e => setFinancialForm({ ...financialForm, discountAmount: Math.max(0, Number(e.target.value) || 0) })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                          />
                                          <span className="text-[10px] text-stone-500 block mt-0.5">Max: ₹{liveBase}</span>
                                        </div>

                                        {/* Delivery Charge */}
                                        <div>
                                          <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                            Delivery (₹)
                                          </label>
                                          <input
                                            type="number"
                                            min={0}
                                            value={financialForm.deliveryCharge}
                                            onChange={e => setFinancialForm({ ...financialForm, deliveryCharge: Math.max(0, Number(e.target.value) || 0) })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                          />
                                        </div>
                                      </div>

                                      {/* Reason / Admin Note */}
                                      <div>
                                        <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                          Reason for Modification / Audit Note (Required for records) *
                                        </label>
                                        <input
                                          type="text"
                                          value={financialForm.adminNote}
                                          onChange={e => setFinancialForm({ ...financialForm, adminNote: e.target.value })}
                                          placeholder="e.g. Adjusted delivery discount as approved by store manager"
                                          className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                        />
                                      </div>

                                      {/* Live Recalculation Summary */}
                                      <div className="bg-white p-2.5 rounded-lg border border-amber-300/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                        <div className="space-y-0.5 text-stone-600">
                                          <div>Base Amount: <strong className="text-stone-900">₹{liveBase}</strong></div>
                                          <div>Subtotal (Base − Disc): <strong className="text-stone-900">₹{liveSubtotal}</strong></div>
                                          <div>Delivery: <strong className="text-stone-900">₹{liveDelivery}</strong></div>
                                        </div>

                                        <div className="text-right">
                                          <span className="text-[10px] uppercase font-bold text-stone-500 block">
                                            Automatically Recalculated Total:
                                          </span>
                                          <span className="text-base sm:text-lg font-black text-emerald-950 font-serif">
                                            ₹{liveTotal}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Action buttons */}
                                      <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => setEditingFinancialOrderId(null)}
                                          className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRequestSaveFinancials(order)}
                                          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                                        >
                                          <Check className="w-3.5 h-3.5 text-amber-300" />
                                          <span>Review & Save Changes</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Order Audit History Log */}
                            {order.auditHistory && order.auditHistory.length > 0 && (
                              <div className="mt-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                                  <History className="w-3.5 h-3.5 text-stone-500" />
                                  <span>Audit History ({order.auditHistory.length} adjustment{order.auditHistory.length > 1 ? 's' : ''}):</span>
                                </div>
                                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                  {order.auditHistory.map((entry, idx) => (
                                    <div key={idx} className="bg-white p-1.5 rounded-lg border border-stone-200/80 text-[11px] text-stone-600 space-y-0.5">
                                      <div className="flex items-center justify-between text-stone-500 text-[10px]">
                                        <span>{new Date(entry.changedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        <span className="font-semibold text-emerald-800">By: {entry.changedBy}</span>
                                      </div>
                                      <div className="font-medium text-stone-800">
                                        <strong className="text-stone-900">{entry.field}:</strong> {String(entry.oldValue)} → <span className="text-emerald-900 font-bold">{String(entry.newValue)}</span>
                                      </div>
                                      {entry.note && (
                                        <div className="text-stone-500 italic text-[10px]">
                                          Note: "{entry.note}"
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Tracking & Courier Section */}
                          <div className="pt-2 border-t border-stone-100">
                            {editingTrackingOrderId === order.id ? (
                              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <Truck className="w-4 h-4 text-emerald-700" />
                                    <span>Update Courier & Tracking for #{order.orderNumber}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTrackingOrderId(null)}
                                    className="text-xs text-stone-500 hover:text-stone-800"
                                  >
                                    ✕ Cancel
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                      Courier Partner
                                    </label>
                                    <select
                                      value={trackingForm.courierName}
                                      onChange={e => setTrackingForm({ ...trackingForm, courierName: e.target.value })}
                                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                    >
                                      <option value="Delhivery">Delhivery</option>
                                      <option value="Blue Dart">Blue Dart</option>
                                      <option value="DTDC">DTDC</option>
                                      <option value="India Post">India Post / Speed Post</option>
                                      <option value="Shiprocket">Shiprocket</option>
                                      <option value="Ekart Logistics">Ekart Logistics</option>
                                      <option value="Shadowfax">Shadowfax</option>
                                      <option value="Other Courier">Other Courier</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                      AWB / Tracking Number
                                    </label>
                                    <input
                                      type="text"
                                      value={trackingForm.trackingNumber}
                                      onChange={e => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                                      placeholder="e.g. 123456789012"
                                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                      Estimated Delivery Date
                                    </label>
                                    <input
                                      type="text"
                                      value={trackingForm.estimatedDelivery}
                                      onChange={e => setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })}
                                      placeholder="e.g. 3-4 Days or 15 Oct"
                                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                      Direct Tracking URL (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      value={trackingForm.trackingUrl}
                                      onChange={e => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                                      placeholder="https://..."
                                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                    Live Status Update Note (Visible to customer)
                                  </label>
                                  <input
                                    type="text"
                                    value={trackingForm.statusNotes}
                                    onChange={e => setTrackingForm({ ...trackingForm, statusNotes: e.target.value })}
                                    placeholder="e.g. Dispatched from Bihar warehouse via Delhivery Air."
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await updateOrder(order.id, {
                                        courierName: trackingForm.courierName,
                                        trackingNumber: trackingForm.trackingNumber.trim(),
                                        trackingUrl: trackingForm.trackingUrl.trim(),
                                        estimatedDelivery: trackingForm.estimatedDelivery.trim(),
                                        statusNotes: trackingForm.statusNotes.trim(),
                                        status: order.status === 'Pending' ? 'Shipped' : order.status,
                                      });
                                      setEditingTrackingOrderId(null);
                                    }}
                                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                                  >
                                    Save Tracking Info
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                {order.trackingNumber || order.courierName ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
                                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>{order.courierName || 'Courier'}: {order.trackingNumber || 'Tracking set'}</span>
                                    </span>
                                    {order.estimatedDelivery && (
                                      <span className="text-stone-500 text-[11px]">
                                        Est: {order.estimatedDelivery}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-stone-400 text-xs italic">
                                    No tracking details attached yet
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTrackingOrderId(order.id);
                                    setTrackingForm({
                                      courierName: order.courierName || 'Delhivery',
                                      trackingNumber: order.trackingNumber || '',
                                      trackingUrl: order.trackingUrl || '',
                                      estimatedDelivery: order.estimatedDelivery || '',
                                      statusNotes: order.statusNotes || '',
                                    });
                                  }}
                                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>{order.trackingNumber ? 'Edit Tracking Details' : '+ Add Tracking / Courier Info'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                </div>
              )}

              {/* TAB 5: POLICIES */}
              {activeTab === 'policies' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        Store Policies
                      </h3>
                      <p className="text-xs text-stone-500">
                        Customer-facing terms, returns, privacy and shipping guidelines.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {settingsSavedToast ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Policies</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1">
                        Return & Refund Policy
                      </label>
                      <textarea
                        rows={5}
                        value={settingsForm.policies.returns}
                        onChange={e => setSettingsForm({
                          ...settingsForm,
                          policies: { ...settingsForm.policies, returns: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1">
                        Terms & Conditions
                      </label>
                      <textarea
                        rows={5}
                        value={settingsForm.policies.terms}
                        onChange={e => setSettingsForm({
                          ...settingsForm,
                          policies: { ...settingsForm.policies, terms: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1">
                        Privacy Policy
                      </label>
                      <textarea
                        rows={4}
                        value={settingsForm.policies.privacy}
                        onChange={e => setSettingsForm({
                          ...settingsForm,
                          policies: { ...settingsForm.policies, privacy: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: BACKUP & RESET */}
              {(activeTab === 'backup' || activeTab === 'settings') && (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 font-serif">
                      Backup, Export & Factory Reset
                    </h3>
                    <p className="text-xs text-stone-500">
                      Export your product inventory and settings to JSON, or restore at any time.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                      Export Store Data
                    </h4>
                    <p className="text-xs text-stone-600">
                      Download a JSON file containing all products, current settings, and order history.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON Backup</span>
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                      Import Store Data
                    </h4>
                    <p className="text-xs text-stone-600">
                      Restore previously downloaded store configuration and products.
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span>Choose Backup JSON File</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Reset to Original Maknuts Defaults</span>
                    </div>
                    <p className="text-xs text-rose-700/80">
                      This will reset products, UPI settings, and prices back to initial Maknuts Makhana defaults.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await resetToDefaults();
                        setSettingsForm(storeSettings);
                        setSettingsSavedToast(true);
                        setTimeout(() => setSettingsSavedToast(false), 2000);
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Reset Store to Defaults
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Quick Tab Bar (Shown only on mobile view < md) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 h-16 flex items-center justify-around px-2 pb-safe shadow-lg">
              <button
                type="button"
                onClick={() => {
                  handleOpenStoreTab('overview');
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] cursor-pointer ${
                  activeTab === 'overview' ? 'text-emerald-800 font-bold' : 'text-stone-500'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenStoreTab('orders');
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 relative min-h-[44px] cursor-pointer ${
                  activeTab === 'orders' ? 'text-emerald-800 font-bold' : 'text-stone-500'
                }`}
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {orders.filter(o => o.status === 'Pending').length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {orders.filter(o => o.status === 'Pending').length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">Orders</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenStoreTab('products');
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] cursor-pointer ${
                  activeTab === 'products' ? 'text-emerald-800 font-bold' : 'text-stone-500'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Products</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] cursor-pointer text-stone-600 hover:text-emerald-800"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Menu (16)</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Screenshot preview modal */}
        {previewScreenshotUrl && (
          <div 
            className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewScreenshotUrl(null)}
          >
            <div className="bg-white p-3 rounded-2xl max-w-lg max-h-[85vh] overflow-hidden">
              <img
                src={previewScreenshotUrl}
                alt="Payment proof"
                className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
              />
              <p className="text-center text-xs text-stone-500 mt-2">
                Click anywhere to close
              </p>
            </div>
          </div>
        )}

        {/* Warning Unlock Completed Order Modal */}
        {warningUnlockOrder && (
          <div className="fixed inset-0 z-80 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
              <div className="flex items-center gap-3 text-amber-900 pb-3 border-b border-amber-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-serif text-stone-900">
                    Unlock Completed Order?
                  </h3>
                  <p className="text-xs text-stone-500">
                    Order #{warningUnlockOrder.orderNumber}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 text-xs text-amber-950 space-y-2">
                <p className="font-semibold">
                  ⚠️ This order is marked as <strong>{warningUnlockOrder.status}</strong> / <strong>{warningUnlockOrder.paymentStatus}</strong>.
                </p>
                <p className="text-stone-600 leading-relaxed">
                  Financial figures for completed transactions are read-only by default to prevent accidental modifications to settled accounts and customer receipts.
                </p>
                <p className="text-stone-600 leading-relaxed">
                  Only unlock if a genuine accounting correction, quantity refund, or delivery charge rectification is strictly required. Any changes will be recorded with your admin ID and timestamp in the order's audit history.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWarningUnlockOrder(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel / Keep Locked
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnlockDeliveredOrder}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock for Correction</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal Before Saving Financial Modifications */}
        {confirmFinancialOrder && (
          <div className="fixed inset-0 z-80 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-3 text-emerald-950 pb-3 border-b border-stone-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <Calculator className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-serif text-stone-900">
                    Confirm Financial Modification
                  </h3>
                  <p className="text-xs text-stone-500">
                    Order #{confirmFinancialOrder.order.orderNumber} ({confirmFinancialOrder.order.customerName})
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-stone-600">
                  Please review the recalculated financial values before applying changes. A permanent audit entry will be created.
                </p>

                {/* Changes summary box */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Detected Modifications:
                  </span>
                  {confirmFinancialOrder.changesSummary.length > 0 ? (
                    <ul className="space-y-1">
                      {confirmFinancialOrder.changesSummary.map((change, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 font-medium text-stone-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-stone-500 italic">No monetary values changed.</p>
                  )}
                </div>

                {/* Total amount highlight */}
                <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Previous Total: ₹{confirmFinancialOrder.order.totalAmount}
                    </span>
                    <span className="text-xs font-bold text-emerald-950">
                      New Recalculated Total:
                    </span>
                  </div>
                  <span className="text-xl font-black text-emerald-900 font-serif">
                    ₹{confirmFinancialOrder.newTotal}
                  </span>
                </div>

                {/* Reason note */}
                {confirmFinancialOrder.adminNote && (
                  <div className="text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <strong className="text-stone-900">Audit Reason:</strong> "{confirmFinancialOrder.adminNote}"
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setConfirmFinancialOrder(null)}
                  disabled={isSavingFinancials}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Go Back / Edit Again
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSaveFinancials}
                  disabled={isSavingFinancials}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingFinancials ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-300" />
                      <span>Confirm & Apply Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Single Order Delete Confirmation Modal */}
        {deletingSingleOrder && (
          <div
            className="fixed inset-0 z-90 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            onClick={() => setDeletingSingleOrder(null)}
          >
            <div
              className="bg-white max-w-md w-full rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-stone-900">
                    Delete Order #{deletingSingleOrder.orderNumber}?
                  </h4>
                  <p className="text-xs text-stone-500">
                    Customer: {deletingSingleOrder.customerName} (₹{deletingSingleOrder.totalAmount})
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">⚠️ Action cannot be undone</p>
                <p className="text-[11px] text-amber-800">
                  This will permanently remove the order record and associated customer tracking entry from Firestore.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDeletingSingleOrder(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = deletingSingleOrder.id;
                    const num = deletingSingleOrder.orderNumber;
                    setDeletingSingleOrder(null);
                    try {
                      await deleteOrder(id);
                      setOrderActionToast({ message: `Order #${num} successfully deleted.`, type: 'success' });
                      setTimeout(() => setOrderActionToast(null), 3000);
                    } catch (e: any) {
                      setOrderActionToast({ message: `Failed to delete order: ${e?.message || 'Error'}`, type: 'danger' });
                      setTimeout(() => setOrderActionToast(null), 3500);
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear All / Archive All Orders Safe Confirmation Modal (Requirement 11) */}
        {isClearOrdersModalOpen && (
          <div
            className="fixed inset-0 z-90 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            onClick={() => {
              if (!isProcessingOrderPurge) {
                setIsClearOrdersModalOpen(false);
              }
            }}
          >
            <div
              className="bg-white max-w-lg w-full rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  orderPurgeActionType === 'archive' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'
                }`}>
                  {orderPurgeActionType === 'archive' ? (
                    <Archive className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900">
                    {orderPurgeActionType === 'archive' ? 'Archive All Orders to Safe Vault' : 'Permanently Delete All Orders'}
                  </h4>
                  <p className="text-xs text-stone-500">
                    Total {orders.length} order documents currently in system
                  </p>
                </div>
              </div>

              {/* Action Selector */}
              <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOrderPurgeActionType('archive')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    orderPurgeActionType === 'archive'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-amber-700" />
                  <span>Archive (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPurgeActionType('permanent')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    orderPurgeActionType === 'permanent'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-rose-700'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanent Delete</span>
                </button>
              </div>

              {orderPurgeActionType === 'archive' ? (
                <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Safe Archival Storage</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    All {orders.length} orders will be moved to the protected <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">archivedOrders</code> collection in Firestore batches with timestamp and admin credentials preserved. Active customer tracking will be closed.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Permanent Irreversible Deletion</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-rose-800">
                    All {orders.length} orders and tracking records will be permanently erased from Firestore in batched transactions. No recovery is possible.
                  </p>
                </div>
              )}

              {/* Typed Confirmation required for permanent deletion */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-stone-800 block">
                  To confirm, type <span className="font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 select-all font-black">{orderPurgeActionType === 'archive' ? 'ARCHIVE ALL ORDERS' : 'DELETE ALL ORDERS'}</span> below:
                </label>
                <input
                  type="text"
                  placeholder={orderPurgeActionType === 'archive' ? 'Type ARCHIVE ALL ORDERS' : 'Type DELETE ALL ORDERS'}
                  value={clearOrdersConfirmationText}
                  onChange={e => setClearOrdersConfirmationText(e.target.value)}
                  disabled={isProcessingOrderPurge}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsClearOrdersModalOpen(false)}
                  disabled={isProcessingOrderPurge}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    isProcessingOrderPurge ||
                    clearOrdersConfirmationText.trim() !== (orderPurgeActionType === 'archive' ? 'ARCHIVE ALL ORDERS' : 'DELETE ALL ORDERS')
                  }
                  onClick={async () => {
                    setIsProcessingOrderPurge(true);
                    try {
                      if (orderPurgeActionType === 'archive') {
                        const count = await archiveAllOrders();
                        setIsClearOrdersModalOpen(false);
                        setOrderActionToast({ message: `Successfully archived ${count} orders to safe vault!`, type: 'success' });
                      } else {
                        await clearAllOrders();
                        setIsClearOrdersModalOpen(false);
                        setOrderActionToast({ message: `All ${orders.length} orders safely cleared via batched deletion.`, type: 'success' });
                      }
                      setTimeout(() => setOrderActionToast(null), 3500);
                    } catch (e: any) {
                      setOrderActionToast({ message: `Operation failed: ${e?.message || 'Error'}`, type: 'danger' });
                      setTimeout(() => setOrderActionToast(null), 4000);
                    } finally {
                      setIsProcessingOrderPurge(false);
                      setClearOrdersConfirmationText('');
                    }
                  }}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    orderPurgeActionType === 'archive' ? 'bg-amber-700 hover:bg-amber-800' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessingOrderPurge ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Batches...</span>
                    </>
                  ) : orderPurgeActionType === 'archive' ? (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive All Orders</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Action Toast Notification */}
        {orderActionToast && (
          <div className={`fixed bottom-6 right-6 z-90 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border animate-bounce ${
            orderActionToast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}>
            {orderActionToast.type === 'success' ? (
              <Check className="w-4 h-4 text-amber-300" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            )}
            <span>{orderActionToast.message}</span>
          </div>
        )}

        {/* Financial Save Success Toast */}
        {financialSaveToast && (
          <div className="fixed bottom-6 right-6 z-90 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-700 animate-bounce">
            <Check className="w-4 h-4 text-amber-300" />
            <span>Order financials recalculated & audit trail updated!</span>
          </div>
        )}
      </div>
    </div>
  );
};
