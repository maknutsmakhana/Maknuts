import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, StoreSettings, Order } from '../types';
import { 
  X, Lock, Key, Plus, Trash2, Edit3, Save, Check, 
  RotateCcw, Package, Settings, ShoppingCart, FileText, 
  Download, Upload, Eye, EyeOff, MessageCircle, AlertTriangle, ExternalLink, Image as ImageIcon, Truck
} from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

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
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateSettings, 
    updateOrderStatus, 
    updateOrder,
    deleteOrder, 
    clearAllOrders, 
    resetToDefaults, 
    exportData, 
    importData 
  } = useStore();

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'products' | 'store' | 'homepage' | 'orders' | 'policies' | 'backup'>('products');

  // Product Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);

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

  // Sync settings form when settings change or tab changes
  const handleOpenStoreTab = (tab: typeof activeTab) => {
    setSettingsForm(storeSettings);
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === storeSettings.adminPassword || passwordInput === 'maknuts123') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect admin password. (Default is: maknuts123)');
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async () => {
    await updateSettings(settingsForm);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  // Handle Image Upload for Product
  const handleProductImageUpload = (file: File, isNew: boolean) => {
    if (file.size > 4 * 1024 * 1024) {
      alert('Image size should be under 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (editingProduct) {
        setEditingProduct({ ...editingProduct, image: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Editing Product
  const startEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsAddingNewProduct(false);
  };

  // Start Adding Product
  const startAddProduct = () => {
    setEditingProduct({
      id: '',
      name: '',
      tagline: '100% Premium Bihar Fox Nuts',
      price: 299,
      originalPrice: 399,
      weight: '250g Pouch',
      shortDescription: 'Fresh crispy makhana roasted to perfection.',
      fullDescription: '',
      image: products[0]?.image || '',
      inStock: true,
      stockStatusText: 'In Stock',
      badge: 'New Arrival',
      highlights: ['100% Natural', 'High Protein', 'Gluten Free']
    });
    setIsAddingNewProduct(true);
  };

  // Save Product
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      alert('Product name is required');
      return;
    }

    if (isAddingNewProduct) {
      const added = await addProduct({
        name: editingProduct.name.trim(),
        tagline: editingProduct.tagline.trim(),
        price: Number(editingProduct.price) || 0,
        originalPrice: Number(editingProduct.originalPrice) || 0,
        weight: editingProduct.weight.trim(),
        shortDescription: editingProduct.shortDescription.trim(),
        fullDescription: editingProduct.fullDescription?.trim(),
        image: editingProduct.image,
        inStock: editingProduct.inStock,
        stockStatusText: editingProduct.stockStatusText,
        badge: editingProduct.badge,
        highlights: editingProduct.highlights,
      });
      setActiveProductId(added.id);
    } else {
      await updateProduct(editingProduct);
    }

    setEditingProduct(null);
    setIsAddingNewProduct(false);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-[#FAF8F5] w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-300 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif leading-tight">
                Maknuts Admin Control Center
              </h2>
              <p className="text-[11px] text-emerald-200/80">
                Manage Products, Prices, UPI, WhatsApp, Banners & Orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto my-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 mx-auto flex items-center justify-center text-amber-800 shadow-sm">
              <Key className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900 font-serif">
                Enter Admin Password
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Access the store management console
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password (default: maknuts123)"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <p className="text-xs text-rose-600 font-medium">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Login to Admin
              </button>
            </form>
            <div className="text-[11px] text-stone-400 pt-2">
              Default password: <code className="bg-stone-200 text-stone-700 px-1 py-0.5 rounded font-mono">maknuts123</code>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs Navigation */}
            <div className="bg-white border-b border-stone-200 px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0">
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
                onClick={() => handleOpenStoreTab('homepage')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'homepage'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Banner & Buttons</span>
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

                            {/* In Stock toggle */}
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateProduct({ ...prod, inStock: !prod.inStock })}
                                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors ${
                                  prod.inStock 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {prod.inStock ? '✓ In Stock' : '✗ Out of Stock'}
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
                                  if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                                    deleteProduct(prod.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
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

                        {/* Image: URL or Upload */}
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Product Image (Upload from Device or enter URL)
                          </label>
                          <div className="flex items-center gap-3">
                            <img
                              src={editingProduct.image}
                              alt="Preview"
                              className="w-14 h-14 object-contain rounded-xl border border-stone-200 bg-stone-50 p-1 shrink-0"
                            />
                            <div className="flex-1 space-y-1.5">
                              <input
                                type="text"
                                value={editingProduct.image}
                                onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                                placeholder="Image URL (http... or /src/...)"
                              />
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs cursor-pointer transition-colors">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Upload Image File from Device</span>
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

                        {/* Modal Action Buttons */}
                        <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(null)}
                            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProduct}
                            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs"
                          >
                            Save Product
                          </button>
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
                          Admin Password
                        </label>
                        <input
                          type="text"
                          value={settingsForm.adminPassword}
                          onChange={e => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                        />
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
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ORDERS RECEIVED */}
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
                          if (confirm('Clear all orders from history?')) {
                            clearAllOrders();
                          }
                        }}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-semibold"
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
                        if (confirm('Are you sure you want to reset all store data to original defaults?')) {
                          await resetToDefaults();
                          setSettingsForm(storeSettings);
                          alert('Reset completed.');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Reset Store
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
