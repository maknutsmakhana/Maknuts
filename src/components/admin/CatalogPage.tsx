import React, { useState, useRef } from 'react';
import { 
  Product, 
  StoreSettings, 
  FoodComplianceSettings, 
  NutritionFacts, 
  ProductClaims 
} from '../../types';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Image as ImageIcon, 
  Camera, 
  AlertTriangle, 
  Layers, 
  Tag, 
  Save, 
  Upload, 
  Download, 
  ExternalLink,
  ShieldCheck, 
  Star, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Search,
  CheckCircle2,
  X,
  ArrowUpDown
} from 'lucide-react';
import { downloadProductsCatalogPdf } from '../../utils/pdfGenerator';
import { uploadImageToStorage } from '../../utils/storage';

interface CatalogPageProps {
  products: Product[];
  activeProduct: Product;
  setActiveProductId: (id: string) => void;
  storeSettings: StoreSettings;
  onAddProduct: (prod: Omit<Product, 'id'>) => Promise<Product>;
  onUpdateProduct: (prod: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  activeProduct,
  setActiveProductId,
  storeSettings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  initialSubTab = 'products',
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'inventory' | 'media' | 'food_fssai'>(
    (initialSubTab as any) || 'products'
  );

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: 'products' | 'inventory' | 'media' | 'food_fssai') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'pricing' | 'inventory' | 'media' | 'food_compliance'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Media state inside edit modal
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Start adding a new product
  const startAddProduct = () => {
    const blankProduct: Product = {
      id: '',
      name: '',
      tagline: '',
      sku: `MK-${Date.now().toString().slice(-4)}`,
      category: 'Raw Phool Makhana',
      price: 299,
      originalPrice: 399,
      weight: '250g Pouch',
      shortDescription: '',
      fullDescription: '',
      image: products[0]?.image || '',
      images: products[0]?.images ? [...products[0].images] : [],
      altText: '',
      inStock: true,
      stockCount: 100,
      lowStockThreshold: 10,
      minQuantity: 1,
      maxQuantity: 20,
      badge: '',
      isFeatured: false,
      isBestseller: false,
      foodCompliance: {
        enabled: true,
        fssaiNumber: '',
        ingredients: '',
        allergens: '',
        isVeg: true,
        netQuantity: '250g',
        shelfLife: '',
        storageInstructions: '',
        countryOfOrigin: 'India',
        manufacturerName: '',
        packerName: '',
        marketerName: '',
        customerCarePhone: storeSettings.supportPhone || '',
        customerCareEmail: storeSettings.supportEmail || '',
        nutrition: {
          servingSize: '100g',
          energy: '',
          protein: '',
          carbohydrates: '',
          sugar: '',
          fat: '',
          dietaryFiber: '',
        },
        claims: {
          highProtein: false,
          glutenFree: false,
          noPreservatives: false,
          zeroTransFat: false,
          noAddedSugar: false,
          natural100: false,
          customClaims: [],
        }
      }
    };
    setEditingProduct(blankProduct);
    setIsAddingNew(true);
    setActiveModalTab('general');
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct({
      ...prod,
      foodCompliance: prod.foodCompliance || {
        enabled: true,
        fssaiNumber: '',
        ingredients: '',
        allergens: '',
        isVeg: true,
        netQuantity: prod.weight || '250g',
        shelfLife: '',
        storageInstructions: '',
        countryOfOrigin: 'India',
        manufacturerName: '',
        packerName: '',
        marketerName: '',
        customerCarePhone: storeSettings.supportPhone || '',
        customerCareEmail: storeSettings.supportEmail || '',
        nutrition: {
          servingSize: '100g',
          energy: '',
          protein: '',
          carbohydrates: '',
          sugar: '',
          fat: '',
          dietaryFiber: '',
        },
        claims: {
          highProtein: false,
          glutenFree: false,
          noPreservatives: false,
          zeroTransFat: false,
          noAddedSugar: false,
          natural100: false,
          customClaims: [],
        }
      }
    });
    setIsAddingNew(false);
    setActiveModalTab('general');
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      alert('Product name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (isAddingNew) {
        const { id, ...data } = editingProduct;
        await onAddProduct(data);
      } else {
        await onUpdateProduct(editingProduct);
      }
      setSaveToast(true);
      setTimeout(() => {
        setSaveToast(false);
        setEditingProduct(null);
      }, 1000);
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Error saving product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload primary photo to Firebase Storage
  const handlePrimaryImageUpload = async (file: File) => {
    if (!editingProduct) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToStorage(file, 'products', `primary_${Date.now()}_${file.name}`);
      const curImages = editingProduct.images || [];
      setEditingProduct({
        ...editingProduct,
        image: url,
        images: curImages.includes(url) ? curImages : [url, ...curImages.filter(i => i !== editingProduct.image)]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload gallery photo to Firebase Storage
  const handleGalleryImageUpload = async (files: FileList) => {
    if (!editingProduct) return;
    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImageToStorage(file, 'products', `gallery_${Date.now()}_${i}_${file.name}`);
        newUrls.push(url);
      }
      const curImages = editingProduct.images || (editingProduct.image ? [editingProduct.image] : []);
      setEditingProduct({
        ...editingProduct,
        images: [...curImages, ...newUrls]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingImage(false);
    }
  };

  // Filter products by search
  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-800" />
              <span>Catalog & Products Manager</span>
            </h2>
            <p className="text-xs text-stone-500">
              Manage product listings, inventory levels, media assets, and product-specific Food / FSSAI compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => downloadProductsCatalogPdf(products, storeSettings)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Product Catalog PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Catalog PDF</span>
            </button>

            <button
              type="button"
              onClick={startAddProduct}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'products', label: `Products (${products.length})` },
            { id: 'inventory', label: 'Inventory & Stock' },
            { id: 'media', label: 'Product Media' },
            { id: 'food_fssai', label: 'Product Food / FSSAI' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSubTabChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeSubTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: PRODUCTS LIST */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search products by title, SKU, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <span className="text-xs text-stone-500 font-medium shrink-0">
              {filteredProducts.length} items
            </span>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((prod) => {
              const isHomeShowcase = prod.id === activeProduct.id;
              const hasLowStock = (prod.stockCount !== undefined ? prod.stockCount : 100) < (prod.lowStockThreshold || 10);

              return (
                <div
                  key={prod.id}
                  className={`bg-white p-4 rounded-3xl border transition-all ${
                    isHomeShowcase ? 'border-emerald-600 shadow-sm' : 'border-stone-200/90 shadow-2xs'
                  }`}
                >
                  <div className="flex gap-3.5">
                    <img
                      src={prod.image}
                      alt={prod.altText || prod.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 object-contain rounded-2xl bg-stone-50 p-1 border border-stone-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-sm text-stone-900 truncate">
                          {prod.name}
                        </h4>
                        {isHomeShowcase && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                            Home Showcase
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span>SKU: {prod.sku || 'N/A'}</span>
                        <span>•</span>
                        <span>{prod.weight}</span>
                      </div>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-extrabold text-sm text-emerald-950 font-mono">
                          ₹{prod.price}
                        </span>
                        {prod.originalPrice > prod.price && (
                          <span className="text-xs text-stone-400 line-through font-mono">
                            ₹{prod.originalPrice}
                          </span>
                        )}
                        {prod.originalPrice > prod.price && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>

                      {/* Stock Status Badge */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateProduct({ ...prod, inStock: !prod.inStock })}
                          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                            prod.inStock 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {prod.inStock ? '✓ Active & In Stock' : '✗ Inactive / Out of Stock'}
                        </button>

                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg font-mono ${
                          hasLowStock ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                        }`}>
                          Stock: {prod.stockCount !== undefined ? prod.stockCount : 100} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveProductId(prod.id)}
                      className="text-xs text-emerald-800 hover:text-emerald-950 hover:underline font-bold cursor-pointer"
                    >
                      {isHomeShowcase ? '★ Current Showcase' : 'Set as Home Showcase'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditProduct(prod)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-100 text-stone-800 hover:text-emerald-900 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Full Product</span>
                      </button>

                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INVENTORY & STOCK */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Quick Inventory & Stock Control</h3>
            <p className="text-xs text-stone-500">Update stock numbers, thresholds, and min/max checkout quantity rules.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Current Stock</th>
                  <th className="py-2.5 px-3">Low-Stock Alert Level</th>
                  <th className="py-2.5 px-3">Min Qty</th>
                  <th className="py-2.5 px-3">Max Qty</th>
                  <th className="py-2.5 px-3 text-right">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-3 font-bold text-stone-900 flex items-center gap-2">
                      <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-contain bg-stone-50 border border-stone-200 p-0.5" />
                      <span>{prod.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-600">{prod.sku || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        value={prod.stockCount !== undefined ? prod.stockCount : 100}
                        onChange={e => onUpdateProduct({ ...prod, stockCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-20 px-2 py-1 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="1"
                        value={prod.lowStockThreshold || 10}
                        onChange={e => onUpdateProduct({ ...prod, lowStockThreshold: Math.max(1, parseInt(e.target.value) || 10) })}
                        className="w-20 px-2 py-1 border border-stone-300 rounded-lg text-xs font-mono"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="1"
                        value={prod.minQuantity || 1}
                        onChange={e => onUpdateProduct({ ...prod, minQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-16 px-2 py-1 border border-stone-300 rounded-lg text-xs font-mono"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="1"
                        value={prod.maxQuantity || 20}
                        onChange={e => onUpdateProduct({ ...prod, maxQuantity: Math.max(1, parseInt(e.target.value) || 20) })}
                        className="w-16 px-2 py-1 border border-stone-300 rounded-lg text-xs font-mono"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onUpdateProduct({ ...prod, inStock: !prod.inStock })}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                          prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {prod.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PRODUCT MEDIA */}
      {activeSubTab === 'media' && (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">Product Media Assets</h3>
              <p className="text-xs text-stone-500">
                Manage high-resolution product pack shots and gallery imagery. Assets use persistent Firebase Storage.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              Cloud Storage Connected
            </span>
          </div>

          <div className="space-y-6">
            {products.map((prod) => (
              <div key={prod.id} className="p-4 rounded-2xl bg-stone-50/60 border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-stone-900">{prod.name}</span>
                    <span className="text-[10px] font-mono text-stone-500">({prod.weight})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditProduct(prod)}
                    className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Photos & Alt Text</span>
                  </button>
                </div>

                {/* Images grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {/* Primary Cover */}
                  <div className="relative group bg-white rounded-xl border border-emerald-400 p-1 shadow-2xs">
                    <img src={prod.image} alt={prod.altText || prod.name} className="w-full h-24 object-contain rounded-lg" />
                    <span className="absolute top-1.5 left-1.5 bg-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                      Primary
                    </span>
                  </div>

                  {/* Gallery items */}
                  {(prod.images || []).filter(img => img !== prod.image).map((imgUrl, idx) => (
                    <div key={idx} className="relative group bg-white rounded-xl border border-stone-200 p-1">
                      <img src={imgUrl} alt={`${prod.name} photo ${idx + 1}`} className="w-full h-24 object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (prod.images || []).filter(u => u !== imgUrl);
                          onUpdateProduct({ ...prod, images: updated });
                        }}
                        className="absolute top-1.5 right-1.5 bg-stone-900/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PRODUCT FOOD / FSSAI */}
      {activeSubTab === 'food_fssai' && (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Product Food Compliance & FSSAI Details</h3>
            <p className="text-xs text-stone-500">
              Food & FSSAI declarations are strictly product-specific. Configure ingredients, nutrition facts, and verified claims for each item.
            </p>
          </div>

          {/* Mandatory FSSAI Regulatory Warning Banner */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950">Statutory Regulatory Notice:</h4>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                “Use only claims supported by actual product composition, testing, label and applicable FSSAI requirements.”
                All claims are strictly disabled by default and should only be enabled when backed by testing reports.
              </p>
            </div>
          </div>

          {/* Products Food Compliance Accordion / Cards */}
          <div className="space-y-4 pt-2">
            {products.map((prod) => {
              const fc = prod.foodCompliance || storeSettings.foodCompliance || {};
              const claims = fc.claims || {};
              const activeClaimsCount = Object.values(claims).filter(Boolean).length;

              return (
                <div key={prod.id} className="p-4 rounded-2xl border border-stone-200/90 bg-stone-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img src={prod.image} alt={prod.name} className="w-10 h-10 object-contain rounded-xl bg-white border border-stone-200 p-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">{prod.name}</h4>
                        <div className="text-xs text-stone-500 flex items-center gap-2">
                          <span>FSSAI: {fc.fssaiNumber || 'Not set'}</span>
                          <span>•</span>
                          <span>{activeClaimsCount} Verified Claims Enabled</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        startEditProduct(prod);
                        setActiveModalTab('food_compliance');
                      }}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                      <span>Configure Food & Claims</span>
                    </button>
                  </div>

                  {/* Summary of ingredients & active claims */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-stone-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Ingredients:</span>
                      <p className="text-stone-700 mt-0.5 line-clamp-2">
                        {fc.ingredients || 'No ingredients configured yet. Click Configure Food & Claims to set.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Enabled Claims:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {claims.highProtein && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">High Protein</span>}
                        {claims.glutenFree && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Gluten Free</span>}
                        {claims.zeroTransFat && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Zero Trans Fat</span>}
                        {claims.noAddedSugar && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">No Added Sugar</span>}
                        {claims.noPreservatives && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">No Preservatives</span>}
                        {claims.natural100 && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">100% Natural</span>}
                        {activeClaimsCount === 0 && (
                          <span className="text-stone-400 text-[11px] italic">No claims enabled (strictly opt-in)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PRODUCT EDIT / ADD MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 border border-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
              <div>
                <h4 className="font-bold text-base text-stone-900 font-serif">
                  {isAddingNew ? 'Add New Product' : `Edit Product: ${editingProduct.name}`}
                </h4>
                <p className="text-xs text-stone-500">Configure catalog information, pricing, stock, images and food compliance.</p>
              </div>

              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1.5 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'general', label: 'General' },
                { id: 'pricing', label: 'Pricing' },
                { id: 'inventory', label: 'Inventory' },
                { id: 'media', label: 'Media & Photos' },
                { id: 'food_compliance', label: 'Food & Compliance' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModalTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                    activeModalTab === tab.id
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* 1. GENERAL */}
              {activeModalTab === 'general' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="e.g. Maknuts Premium Makhana"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">SKU Code</label>
                      <input
                        type="text"
                        value={editingProduct.sku || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                        placeholder="e.g. MK-JUMBO-250"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={editingProduct.category || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        placeholder="e.g. Raw Phool Makhana"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tagline / Subheading</label>
                    <input
                      type="text"
                      value={editingProduct.tagline || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                      placeholder="e.g. 100% Premium Bihar Fox Nuts · Handpicked Jumbo Grade"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Short Description (Customer Cards)</label>
                    <textarea
                      rows={2}
                      value={editingProduct.shortDescription || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                      placeholder="Crispy, natural roasted lotus seeds harvested from Mithila ponds..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Full Detailed Story / Description</label>
                    <textarea
                      rows={3}
                      value={editingProduct.fullDescription || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, fullDescription: e.target.value })}
                      placeholder="Complete product details, health benefits, and culinary uses..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={editingProduct.inStock}
                        onChange={e => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                        className="w-4 h-4 accent-emerald-800 rounded"
                      />
                      <span>Active on Store</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={editingProduct.isBestseller || false}
                        onChange={e => setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>Featured Bestseller Badge</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 2. PRICING */}
              {activeModalTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({ ...editingProduct, price: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold text-emerald-950 focus:bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-stone-500">Actual price charged to customer</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">MRP / Strikethrough Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.originalPrice}
                        onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-600 focus:bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-stone-500">Displayed with strikethrough</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-950 block">Customer Discount Savings:</span>
                      <span className="text-stone-600">
                        {editingProduct.originalPrice > editingProduct.price 
                          ? `₹${editingProduct.originalPrice - editingProduct.price} (${Math.round(((editingProduct.originalPrice - editingProduct.price) / editingProduct.originalPrice) * 100)}% discount)`
                          : 'No discount (Selling at MRP)'}
                      </span>
                    </div>
                    <span className="font-mono text-base font-black text-emerald-900">
                      ₹{editingProduct.price}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. INVENTORY */}
              {activeModalTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Current Stock Count</label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.stockCount !== undefined ? editingProduct.stockCount : 100}
                        onChange={e => setEditingProduct({ ...editingProduct, stockCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Low-Stock Alert Level</label>
                      <input
                        type="number"
                        min="1"
                        value={editingProduct.lowStockThreshold || 10}
                        onChange={e => setEditingProduct({ ...editingProduct, lowStockThreshold: Math.max(1, parseInt(e.target.value) || 10) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Min Order Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={editingProduct.minQuantity || 1}
                        onChange={e => setEditingProduct({ ...editingProduct, minQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Max Order Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={editingProduct.maxQuantity || 20}
                        onChange={e => setEditingProduct({ ...editingProduct, maxQuantity: Math.max(1, parseInt(e.target.value) || 20) })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MEDIA & PHOTOS */}
              {activeModalTab === 'media' && (
                <div className="space-y-4">
                  {/* Primary Image */}
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2">
                    <label className="block text-xs font-bold text-stone-800">Primary Cover Photo</label>
                    <div className="flex items-center gap-3">
                      <img src={editingProduct.image} alt="Preview" className="w-16 h-16 rounded-xl object-contain bg-white border border-stone-200 p-1 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={editingProduct.image}
                          onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          placeholder="Primary image URL (https://...)"
                          className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-800" />
                            <span>Upload to Cloud Storage</span>
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={e => {
                                if (e.target.files?.[0]) handlePrimaryImageUpload(e.target.files[0]);
                              }}
                              className="hidden"
                            />
                          </label>
                          {uploadingImage && <span className="text-[11px] text-emerald-700 animate-pulse font-medium">Uploading...</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Image Alt Text (SEO & Accessibility)</label>
                    <input
                      type="text"
                      value={editingProduct.altText || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, altText: e.target.value })}
                      placeholder="e.g. Maknuts Premium 250g Roasted Lotus Seeds Standee Pouch"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Gallery Photos */}
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800">Additional Gallery Photos</label>
                      <label className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1">
                        <Plus className="w-3 h-3 text-amber-300" />
                        <span>Add Photos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          ref={galleryInputRef}
                          onChange={e => {
                            if (e.target.files) handleGalleryImageUpload(e.target.files);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(editingProduct.images || []).map((imgUrl, i) => (
                        <div key={i} className="relative group bg-stone-50 rounded-xl border border-stone-200 p-1">
                          <img src={imgUrl} alt={`Photo ${i}`} className="w-full h-16 object-contain rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = (editingProduct.images || []).filter((_, idx) => idx !== i);
                              setEditingProduct({ ...editingProduct, images: filtered });
                            }}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. FOOD & COMPLIANCE */}
              {activeModalTab === 'food_compliance' && (
                <div className="space-y-4">
                  {/* Warning banner */}
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Warning:</strong> Use only claims supported by actual product composition, testing, label and applicable FSSAI requirements. No claim is enabled automatically.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Product FSSAI License Number</label>
                      <input
                        type="text"
                        value={editingProduct.foodCompliance?.fssaiNumber || ''}
                        onChange={e => setEditingProduct({
                          ...editingProduct,
                          foodCompliance: {
                            ...(editingProduct.foodCompliance || {}),
                            fssaiNumber: e.target.value
                          }
                        })}
                        placeholder="14-digit FSSAI Number"
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Net Quantity / Weight</label>
                      <input
                        type="text"
                        value={editingProduct.foodCompliance?.netQuantity || editingProduct.weight || '250g'}
                        onChange={e => setEditingProduct({
                          ...editingProduct,
                          foodCompliance: {
                            ...(editingProduct.foodCompliance || {}),
                            netQuantity: e.target.value
                          }
                        })}
                        placeholder="e.g. 250 g"
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ingredients List</label>
                    <textarea
                      rows={2}
                      value={editingProduct.foodCompliance?.ingredients || ''}
                      onChange={e => setEditingProduct({
                        ...editingProduct,
                        foodCompliance: {
                          ...(editingProduct.foodCompliance || {}),
                          ingredients: e.target.value
                        }
                      })}
                      placeholder="e.g. 100% Pure Raw Lotus Seeds (Phool Makhana)"
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Allergen Declarations</label>
                      <input
                        type="text"
                        value={editingProduct.foodCompliance?.allergens || ''}
                        onChange={e => setEditingProduct({
                          ...editingProduct,
                          foodCompliance: {
                            ...(editingProduct.foodCompliance || {}),
                            allergens: e.target.value
                          }
                        })}
                        placeholder="e.g. Contains lotus seeds. May contain traces of tree nuts."
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Shelf Life / Best Before</label>
                      <input
                        type="text"
                        value={editingProduct.foodCompliance?.shelfLife || ''}
                        onChange={e => setEditingProduct({
                          ...editingProduct,
                          foodCompliance: {
                            ...(editingProduct.foodCompliance || {}),
                            shelfLife: e.target.value
                          }
                        })}
                        placeholder="e.g. 12 Months from packaging date"
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Claims Checkboxes (Strictly Opt-In) */}
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <label className="block text-xs font-bold text-stone-900">
                      Product Claims (Enable strictly if supported by testing & composition)
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                      {[
                        { id: 'highProtein', label: 'High Protein' },
                        { id: 'glutenFree', label: 'Gluten Free' },
                        { id: 'zeroTransFat', label: 'Zero Trans Fat' },
                        { id: 'noAddedSugar', label: 'No Added Sugar' },
                        { id: 'noPreservatives', label: 'No Preservatives' },
                        { id: 'natural100', label: '100% Natural' },
                      ].map(claim => {
                        const curClaims = editingProduct.foodCompliance?.claims || {};
                        const isChecked = Boolean((curClaims as any)[claim.id]);

                        return (
                          <label key={claim.id} className="flex items-center gap-1.5 cursor-pointer text-stone-800">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => setEditingProduct({
                                ...editingProduct,
                                foodCompliance: {
                                  ...(editingProduct.foodCompliance || {}),
                                  claims: {
                                    ...curClaims,
                                    [claim.id]: e.target.checked
                                  }
                                }
                              })}
                              className="w-3.5 h-3.5 accent-emerald-800 rounded"
                            />
                            <span className="text-[11px] font-medium">{claim.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saveToast ? (
                  <Check className="w-4 h-4 text-amber-300" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saveToast ? 'Product Saved!' : isSaving ? 'Saving...' : 'Save Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
