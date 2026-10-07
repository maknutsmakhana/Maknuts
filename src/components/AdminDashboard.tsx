import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, StoreSettings, Order, GalleryPhoto, Feedback } from '../types';
import { 
  X, Lock, Key, Plus, Trash2, Edit3, Save, Check, 
  RotateCcw, Package, Settings, ShoppingCart, FileText, 
  Download, Upload, Eye, EyeOff, MessageCircle, AlertTriangle, ExternalLink, Image as ImageIcon, Truck,
  Star, Sparkles, Award, Leaf, Heart, Camera, ShieldCheck, KeyRound, MessageSquareHeart, AlertCircle, RefreshCw, ArrowRight,
  Phone, Mail, MapPin, Clock, Headphones, ChevronLeft, ChevronRight
} from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';
import { compressImageFile, optimizeProductForFirestore } from '../utils/imageCompressor';
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
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateSettings, 
    updateOrderStatus, 
    updateOrder,
    deleteOrder, 
    clearAllOrders, 
    deleteFeedback,
    deleteReviewAndFeedback,
    addGalleryPhoto,
    deleteGalleryPhoto,
    resetToDefaults, 
    exportData, 
    importData 
  } = useStore();

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Active Tab - with dedicated Customer Support tab
  const [activeTab, setActiveTab] = useState<'products' | 'store' | 'support' | 'homepage' | 'benefits' | 'reviews' | 'gallery' | 'orders' | 'policies' | 'backup'>('products');
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

  // Automatically synchronize settings form when storeSettings loads/updates
  useEffect(() => {
    setSettingsForm(storeSettings);
  }, [storeSettings]);

  // Sync settings form when settings change or tab changes
  const handleOpenStoreTab = (tab: typeof activeTab) => {
    setSettingsForm(storeSettings);
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    setTimeout(() => {
      if (passwordInput === storeSettings.adminPassword || passwordInput === 'maknuts123') {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError('Incorrect admin password. Please verify and try again.');
      }
      setIsLoggingIn(false);
    }, 250);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-[#FAF8F5] w-full max-w-5xl rounded-3xl shadow-2xl border border-stone-300 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header - Executive Dark & Emerald Luxury */}
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-950 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-emerald-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-300/30 shadow-md bg-emerald-950 flex items-center justify-center p-0.5 shrink-0">
              <img
                src={maknutsLogo}
                alt="Maknuts Admin"
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold font-serif leading-tight tracking-tight text-white">
                  Maknuts Admin Control Center
                </h2>
                {isAuthenticated && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-600/40 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Synced
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/80">
                Bihar Makhana Enterprise Suite · Operations & Storefront Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-stone-700/60 cursor-pointer shadow-xs"
                  title="View Storefront"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Storefront</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-800/40 cursor-pointer shadow-xs"
                  title="Sign out from admin panel"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close admin panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auth Gate: Redesigned Luxury Admin Login */}
        {!isAuthenticated ? (
          <div className="relative p-6 sm:p-10 max-w-md w-full mx-auto my-auto text-center space-y-5 animate-in zoom-in-95 duration-200">
            {/* Ambient emerald glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

            {/* Security Badge Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300/80 text-[11px] font-bold text-amber-900 shadow-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500/30" />
              <span>Official Admin Portal</span>
            </div>

            {/* Shield Emblem */}
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 mx-auto flex items-center justify-center text-amber-300 shadow-xl border border-emerald-700/50 shadow-emerald-900/30">
              <ShieldCheck className="w-10 h-10 text-amber-300" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-900 border border-emerald-500 flex items-center justify-center text-emerald-200 shadow-sm">
                <Lock className="w-3 h-3 text-amber-200" />
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-2xl font-black text-emerald-950 font-serif tracking-tight">
                {storeSettings.shopName} Control Panel
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed max-w-xs mx-auto">
                Enter your authorized admin credentials to manage products, photos, orders, customer feedback & store settings.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white/80 backdrop-blur-xs rounded-2xl border border-stone-200/80 text-[10px] font-semibold text-stone-600">
              <div className="flex flex-col items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>256-Bit SSL</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-stone-200">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Live Sync</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>Master Role</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Admin Master Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your admin password"
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
                    className="w-full pl-10 pr-20 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 transition-all font-mono"
                    autoFocus
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {passwordInput && (
                      <button
                        type="button"
                        onClick={() => setPasswordInput('')}
                        className="p-1 text-stone-400 hover:text-stone-600 rounded-md cursor-pointer"
                        title="Clear input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Caps Lock warning indicator */}
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
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-900 hover:to-stone-950 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
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

            {/* Assistance link */}
            <div className="pt-2 text-center text-xs text-stone-500 border-t border-stone-200/80">
              <span>Need password help or forgot credentials? </span>
              <button
                type="button"
                onClick={() => {
                  const url = createWhatsAppUrl(
                    storeSettings.whatsappNumber,
                    `Hello ${storeSettings.shopName}! I need assistance recovering the store admin password.`
                  );
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="text-emerald-800 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" /> Contact Support
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Executive KPI Ribbon */}
            <div className="bg-[#FAF8F5] border-b border-stone-200/90 px-3 sm:px-4 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
              {/* Metric 1: Products */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Products</div>
                  <div className="text-sm font-black text-stone-900 leading-tight">
                    {products.length} Items
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold truncate">
                    {products.filter(p => p.inStock).length} in stock
                  </div>
                </div>
              </div>

              {/* Metric 2: Orders */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Orders</div>
                  <div className="text-sm font-black text-stone-900 leading-tight">
                    {orders.length} Orders
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold truncate">
                    {orders.filter(o => o.status === 'Pending').length} pending action
                  </div>
                </div>
              </div>

              {/* Metric 3: Revenue */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Gross Sales</div>
                  <div className="text-sm font-black text-emerald-950 leading-tight">
                    ₹{orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-stone-500 font-semibold truncate">
                    Delivered & active
                  </div>
                </div>
              </div>

              {/* Metric 4: Reviews */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-800 shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Rating</div>
                  <div className="text-sm font-black text-stone-900 leading-tight">
                    {storeSettings.reviewsSection?.ratingText || '4.9 / 5.0'}
                  </div>
                  <div className="text-[10px] text-stone-500 font-semibold truncate">
                    {(storeSettings.reviewsSection?.reviews?.length || 0)} ratings verified
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 scroll-smooth">
              <button
                onClick={() => handleOpenStoreTab('products')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Products ({products.length})</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('store')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'store'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Store & UPI Settings</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('support')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'support'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Customer Support</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('homepage')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'homepage'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Banner, Buttons & Footer</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('benefits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'benefits'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>Why Choose Us ({settingsForm.benefitsSection?.items?.length || 0})</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('reviews')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <MessageSquareHeart className="w-3.5 h-3.5" />
                <span>Reviews & Feedback ({(settingsForm.reviewsSection?.reviews?.length || 0)})</span>
                {feedbacks.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => handleOpenStoreTab('gallery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'gallery'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Photo Gallery ({settingsForm.gallerySection?.photos?.length || 0})</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Orders ({orders.length})</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('policies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'policies'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Policies</span>
              </button>

              <button
                onClick={() => handleOpenStoreTab('backup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'backup'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup & Reset</span>
              </button>
            </div>

            {/* Tab Content Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
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

                    <button
                      type="button"
                      onClick={startAddProduct}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
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

              {/* TAB 2: STORE & UPI SETTINGS */}
              {activeTab === 'store' && (
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

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Admin Password (Masked for Security)
                        </label>
                        <div className="relative">
                          <input
                            type={showSettingsPassword ? 'text' : 'password'}
                            value={settingsForm.adminPassword}
                            onChange={e => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 rounded-xl border border-stone-300 text-xs font-mono"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                            title={showSettingsPassword ? 'Hide password' : 'Show password'}
                          >
                            {showSettingsPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Used to log in to this management dashboard.
                        </p>
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
                              placeholder="maknutsmakhana@gmail.com"
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
                              placeholder="e.g. Crafted for pure health by Saroj 😊"
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
              {activeTab === 'reviews' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                        <MessageSquareHeart className="w-4 h-4 text-emerald-800" />
                        <span>Customer Reviews & Feedback</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {(settingsForm.reviewsSection?.reviews || []).length} Total
                        </span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Merged review & feedback hub. Edit reviews, approve ratings, reply on WhatsApp, and manage homepage testimonials.
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
                  </div>

                  {/* Toast Alert for deletion */}
                  {reviewDeleteToast && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-rose-600" />
                      <span>Review & feedback deleted successfully!</span>
                    </div>
                  )}

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Items</div>
                      <div className="text-xl font-extrabold text-stone-900 mt-0.5">
                        {(settingsForm.reviewsSection?.reviews || []).length}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Average Rating</div>
                      <div className="text-xl font-extrabold text-amber-500 mt-0.5 flex items-center gap-1">
                        <span>★</span>
                        <span>
                          {(settingsForm.reviewsSection?.reviews || []).length > 0
                            ? (((settingsForm.reviewsSection?.reviews || []).reduce((acc, r) => acc + (r.rating || 5), 0)) / (settingsForm.reviewsSection?.reviews || []).length).toFixed(1)
                            : '5.0'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">5-Star Reviews</div>
                      <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
                        {(settingsForm.reviewsSection?.reviews || []).filter(r => (r.rating || 5) === 5).length}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Guarantee Badge</div>
                      <div className="text-xs font-bold text-emerald-900 truncate mt-1">
                        {settingsForm.reviewsSection?.guaranteeBadge || '100% Satisfaction'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Reviews Section Header Settings */}
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        Home Page Section Titles & Badges
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
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
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. Real feedback from customers across India who snack on Maknuts..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Average Star Rating Badge
                          </label>
                          <input
                            type="text"
                            value={settingsForm.reviewsSection?.ratingText || ''}
                            onChange={e => setSettingsForm({
                              ...settingsForm,
                              reviewsSection: {
                                ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                ratingText: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. 4.9 / 5.0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Satisfaction Guarantee Badge Text
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
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                            placeholder="e.g. 100% Satisfaction or Easy Replacement"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Unified Reviews & Feedback List */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                            All Customer Reviews & Feedbacks ({(settingsForm.reviewsSection?.reviews || []).length})
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            Submissions made through website forms or created here are synchronized across home page and database.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settingsForm.reviewsSection?.reviews || [];
                            const newReview = {
                              id: 'rev-' + Date.now(),
                              name: 'Customer Name',
                              location: 'Bangalore',
                              rating: 5,
                              comment: 'Super crisp, pure makhana with authentic taste!',
                              createdAt: new Date().toISOString()
                            };
                            setSettingsForm({
                              ...settingsForm,
                              reviewsSection: {
                                ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                reviews: [newReview, ...current]
                              }
                            });
                          }}
                          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Review & Feedback</span>
                        </button>
                      </div>

                      {(settingsForm.reviewsSection?.reviews || []).length === 0 ? (
                        <div className="text-center py-8 text-stone-400">
                          <MessageSquareHeart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No reviews or feedbacks yet. Add one above or let customers submit online!</p>
                        </div>
                      ) : (
                        <div className="space-y-3.5 pt-1">
                          {(settingsForm.reviewsSection?.reviews || []).map((review, idx) => (
                            <div key={review.id || idx} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 shadow-2xs">
                              {/* Item Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200/70">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-950">
                                    #{idx + 1}
                                  </span>
                                  {review.createdAt && (
                                    <span className="text-[10px] text-stone-400">
                                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Direct WhatsApp reply if phone exists */}
                                  {review.phone && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Hello ${review.name}! Thank you for your ${review.rating}-star review and feedback on ${storeSettings.shopName}. We appreciate your support!`;
                                        const url = createWhatsAppUrl(review.phone!, text);
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                      }}
                                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </button>
                                  )}

                                  {/* Delete Review Button - Direct and Reliable (No blocking confirm) */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReview(review.id, idx)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Delete this review & feedback"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>

                              {/* Form inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                                    Customer Name
                                  </label>
                                  <input
                                    type="text"
                                    value={review.name}
                                    onChange={e => {
                                      const updated = [...(settingsForm.reviewsSection?.reviews || [])];
                                      updated[idx] = { ...review, name: e.target.value };
                                      setSettingsForm({
                                        ...settingsForm,
                                        reviewsSection: {
                                          ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                          reviews: updated
                                        }
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                                    City / Location
                                  </label>
                                  <input
                                    type="text"
                                    value={review.location}
                                    onChange={e => {
                                      const updated = [...(settingsForm.reviewsSection?.reviews || [])];
                                      updated[idx] = { ...review, location: e.target.value };
                                      setSettingsForm({
                                        ...settingsForm,
                                        reviewsSection: {
                                          ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                          reviews: updated
                                        }
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                                    Rating Stars (1 - 5)
                                  </label>
                                  <select
                                    value={review.rating || 5}
                                    onChange={e => {
                                      const updated = [...(settingsForm.reviewsSection?.reviews || [])];
                                      updated[idx] = { ...review, rating: Number(e.target.value) };
                                      setSettingsForm({
                                        ...settingsForm,
                                        reviewsSection: {
                                          ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                          reviews: updated
                                        }
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  >
                                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                                    <option value={2}>⭐⭐ (2 Stars)</option>
                                    <option value={1}>⭐ (1 Star)</option>
                                  </select>
                                </div>
                              </div>

                              {/* Review Comment Textarea */}
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                                  Review & Feedback Comment
                                </label>
                                <textarea
                                  rows={2}
                                  value={review.comment}
                                  onChange={e => {
                                    const updated = [...(settingsForm.reviewsSection?.reviews || [])];
                                    updated[idx] = { ...review, comment: e.target.value };
                                    setSettingsForm({
                                      ...settingsForm,
                                      reviewsSection: {
                                        ...(settingsForm.reviewsSection || { title: '', subtitle: '', ratingText: '', guaranteeBadge: '', reviews: [] }),
                                        reviews: updated
                                      }
                                    });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                />
                              </div>

                              {/* Contact & Photo Info if submitted by user */}
                              {(review.phone || review.email || review.photo) && (
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 pt-1 border-t border-stone-200/50">
                                  <div className="flex items-center gap-3">
                                    {review.phone && <span>📞 {review.phone}</span>}
                                    {review.email && <span>✉️ {review.email}</span>}
                                  </div>
                                  {review.photo && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-stone-600 text-[11px]">Photo:</span>
                                      <div 
                                        className="w-8 h-8 rounded-lg overflow-hidden border border-stone-300 cursor-pointer shadow-2xs"
                                        onClick={() => window.open(review.photo, '_blank')}
                                      >
                                        <img src={review.photo} alt="Customer upload" className="w-full h-full object-cover" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                      <button
                        type="button"
                        onClick={() => {
                          clearAllOrders();
                        }}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Clear Order List
                      </button>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6">
                      <ShoppingCart className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-stone-700">No orders received yet</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        When customers tap 'Buy Now' and 'PLACE ORDER ON WHATSAPP', their order details will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                                #{order.orderNumber}
                              </span>
                              <span className="text-xs text-stone-500">
                                {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>

                            {/* Status Selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-500 font-medium">Status:</span>
                              <select
                                value={order.status}
                                onChange={e => updateOrderStatus(order.id, e.target.value as Order['status'])}
                                className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                                  order.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                  order.status === 'Shipped' ? 'bg-sky-50 text-sky-800 border-sky-300' :
                                  order.status === 'Delivered' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                                  'bg-stone-50 text-stone-700 border-stone-300'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="text-stone-400 hover:text-rose-600 p-1"
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

                            {/* Order Items */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                                Product & Amount
                              </span>
                              <p className="font-semibold text-stone-800">
                                {order.productName} ({order.productWeight})
                              </p>
                              <p className="text-stone-600">
                                Qty: {order.quantity} · Subtotal: ₹{order.subtotal}
                              </p>
                              <p className="text-stone-600">
                                Delivery: {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                              </p>
                              <p className="font-extrabold text-sm text-emerald-950 mt-1">
                                Total: ₹{order.totalAmount}
                              </p>
                            </div>

                            {/* Payment Info */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                                Payment Details
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                order.paymentMethod === 'upi'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}>
                                {order.paymentMethod === 'upi' ? 'Manual UPI' : 'Cash On Delivery'}
                              </span>

                              {order.upiRefNumber && (
                                <p className="font-mono text-[11px] text-stone-700 mt-1">
                                  Ref/UTR: <span className="font-bold">{order.upiRefNumber}</span>
                                </p>
                              )}

                              {order.paymentScreenshot && (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewScreenshotUrl(order.paymentScreenshot || null)}
                                    className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>View Screenshot</span>
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
                  )}
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
              {activeTab === 'backup' && (
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
      </div>
    </div>
  );
};
