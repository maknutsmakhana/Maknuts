import React, { useState } from 'react';
import { StoreSettings, Product } from '../../types';
import { 
  Image as ImageIcon, 
  Upload, 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Save, 
  Sparkles,
  Camera
} from 'lucide-react';
import maknutsLogo from '../../assets/images/regenerated_image_1791357700332.png';

interface AdminMediaTabProps {
  settings: StoreSettings;
  products: Product[];
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
  onAddGalleryPhoto?: (url: string, caption: string) => Promise<void>;
}

const PRESET_MAKHANA_ASSETS = [
  { label: 'Crispy Roasted Bowl', url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=800', type: 'Product Photo' },
  { label: 'White Jumbo Grade Seeds', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800', type: 'Product Photo' },
  { label: 'Moisture Stand Pouch', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800', type: 'Packaging' },
  { label: 'Bihar Lotus Pond Harvest', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', type: 'Farm / Origin' },
];

export const AdminMediaTab: React.FC<AdminMediaTabProps> = ({
  settings,
  products,
  onSaveSettings,
  onAddGalleryPhoto,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleAddToGallery = async (url: string, title: string) => {
    if (onAddGalleryPhoto) {
      setIsSaving(true);
      try {
        await onAddGalleryPhoto(url, title);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-800" />
            <span>Centralized Media & Visual Assets Manager</span>
          </h2>
          <p className="text-xs text-stone-500">
            Manage product photography, farm gallery banners, promotional creatives, and logos.
          </p>
        </div>
      </div>

      {/* Safety Notice: Avoid Large Base64 in Firestore */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-900">
            Performance Best Practice: Cloud URLs vs Base64 Storage
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            To prevent Firestore 1MB document size limits and guarantee fast 3G mobile page loads across India, use direct image URLs (from Unsplash, Cloudinary, AWS S3, or Firebase Storage) rather than uncompressed Base64 strings.
          </p>
        </div>
      </div>

      {/* SECTION 1: ACTIVE STORE VISUAL ASSETS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-800" />
          <span>Active Storefront Assets</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Logo */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Official Store Logo</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Primary</span>
            </div>
            <div className="h-32 rounded-lg bg-stone-900 flex items-center justify-center overflow-hidden border border-stone-200">
              <img src={maknutsLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-stone-400 truncate max-w-[150px]">SVG / PNG Vector</span>
              <button
                type="button"
                onClick={() => handleCopy(maknutsLogo)}
                className="text-[11px] font-bold text-stone-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl === maknutsLogo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Asset</span>
              </button>
            </div>
          </div>

          {/* Primary Product Image */}
          {products[0] && (
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="truncate">{products[0].name} (Main)</span>
                <span className="text-[10px] font-mono text-stone-500 bg-stone-200 px-1.5 py-0.2 rounded">Product</span>
              </div>
              <div className="h-32 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-stone-200">
                <img src={products[0].image || products[0].imageUrl} alt={products[0].name} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-stone-400 truncate max-w-[150px] font-mono">{products[0].image || products[0].imageUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(products[0].image || products[0].imageUrl || '')}
                  className="text-[11px] font-bold text-stone-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedUrl === (products[0].image || products[0].imageUrl) ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy URL</span>
                </button>
              </div>
            </div>
          )}

          {/* Promotional Banner Preset */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Hero / Promo Backdrop</span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">Banner</span>
            </div>
            <div className="h-32 rounded-lg bg-emerald-950 flex items-center justify-center overflow-hidden border border-emerald-900 p-2 text-center text-xs text-amber-200 font-serif font-black">
              100% Pure Organic Makhana · Fresh From Bihar
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-stone-400">CSS Gradient Mesh</span>
              <span className="text-[10px] font-bold text-emerald-800">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: HIGH-RES MAKHANA CURATED PHOTOGRAPHY PRESETS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Curated High-Res Photography Presets</span>
            </h3>
            <p className="text-xs text-stone-500">
              Pre-licensed, ultra high-definition makhana and harvest images ready to copy or push to your gallery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {PRESET_MAKHANA_ASSETS.map((asset, idx) => (
            <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="h-28 rounded-lg overflow-hidden bg-stone-200">
                <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-stone-900 truncate">{asset.label}</div>
                <div className="text-[10px] text-stone-500">{asset.type}</div>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(asset.url)}
                  className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1"
                >
                  {copiedUrl === asset.url ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToGallery(asset.url, asset.label)}
                  disabled={isSaving}
                  className="py-1 px-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-[10px] font-bold text-white flex items-center justify-center gap-1 cursor-pointer"
                  title="Add to Customer Gallery"
                >
                  <Plus className="w-3 h-3" />
                  <span>Gallery</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
