import React, { useState, useRef } from 'react';
import { StoreSettings, Product, GalleryPhoto } from '../../types';
import { 
  Image as ImageIcon, 
  Upload, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Camera,
  Search,
  X,
  ZoomIn,
  Tag,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import maknutsLogo from '../../assets/images/regenerated_image_1791357700332.png';

interface AdminMediaTabProps {
  settings: StoreSettings;
  products: Product[];
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
  onAddGalleryPhoto?: (url: string, caption: string, tag?: string) => Promise<void>;
  onDeleteGalleryPhoto?: (photoId: string, index?: number) => Promise<void>;
}

const COMMON_TAGS = [
  'Product Photo',
  'Farm Harvest',
  'Packaging & Purity',
  'Batch Roasting',
  'Customer Moments',
  'Store Gallery',
  'Promotional',
];

export const AdminMediaTab: React.FC<AdminMediaTabProps> = ({
  settings,
  products,
  onSaveSettings: _onSaveSettings,
  onAddGalleryPhoto,
  onDeleteGalleryPhoto,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Photo form state
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoTag, setPhotoTag] = useState('Product Photo');
  const [customTag, setCustomTag] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Gallery filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewModalPhoto, setViewModalPhoto] = useState<GalleryPhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPhotos: GalleryPhoto[] = settings.gallerySection?.photos || [];

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Handle file selection and compression
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Compress image client-side to keep under ~45KB and preserve fast mobile load
      const compressedDataUrl = await compressImageFile(file, 800, 0.72, 48000);
      setPreviewUrl(compressedDataUrl);
      setPhotoUrlInput(compressedDataUrl);

      // Auto-suggest caption from filename if empty
      if (!photoCaption.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        setPhotoCaption(cleanName);
      }
    } catch (err: any) {
      console.error('Image upload/compression error:', err);
      setErrorMessage('Failed to process image file. Please try a different file or paste a direct image URL.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (val: string) => {
    setPhotoUrlInput(val);
    setErrorMessage(null);
    if (val.trim()) {
      setPreviewUrl(val.trim());
    } else {
      setPreviewUrl(null);
    }
  };

  const resetForm = () => {
    setPhotoUrlInput('');
    setPhotoCaption('');
    setPreviewUrl(null);
    setCustomTag('');
    setErrorMessage(null);
  };

  // Submit and save new photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = (previewUrl || photoUrlInput).trim();

    if (!finalUrl) {
      setErrorMessage('Please choose an image file from your device or paste an image URL.');
      return;
    }

    const effectiveTag = photoTag === 'Custom' ? customTag.trim() || 'Store Photo' : photoTag;
    const effectiveCaption = photoCaption.trim() || 'Maknuts Pure Makhana';

    if (!onAddGalleryPhoto) {
      setErrorMessage('Save action not configured.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onAddGalleryPhoto(finalUrl, effectiveCaption, effectiveTag);
      showToast('Photo successfully added to media & store gallery!');
      resetForm();
    } catch (err: any) {
      console.error('Failed to add photo:', err);
      setErrorMessage(err?.message || 'Failed to save photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle photo deletion
  const handleDeletePhoto = async (photoId: string, idx: number) => {
    if (!onDeleteGalleryPhoto) return;
    try {
      await onDeleteGalleryPhoto(photoId, idx);
      setDeleteConfirmId(null);
      showToast('Photo removed from media.');
    } catch (err: any) {
      console.error('Failed to delete photo:', err);
      setErrorMessage('Failed to remove photo.');
    }
  };

  // Filtered photos
  const filteredPhotos = currentPhotos.filter(p => {
    const matchesTag = selectedTagFilter === 'all' || (p.tag || 'Store Photo').toLowerCase() === selectedTagFilter.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      (p.caption && p.caption.toLowerCase().includes(query)) ||
      (p.tag && p.tag.toLowerCase().includes(query));
    return matchesTag && matchesSearch;
  });

  const allTags = Array.from(new Set(currentPhotos.map(p => p.tag || 'Store Photo').filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-amber-200 px-4 py-3 rounded-xl shadow-xl border border-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-800" />
            <span>Media & Visual Assets Manager</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Add, upload, and organize product photos, customer snaps, farm harvest pictures, and official brand assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>{currentPhotos.length} Media Photos</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: ADD NEW PHOTO IN MEDIA */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">
                Add Photo to Media
              </h3>
              <p className="text-[11px] text-stone-500">
                Upload directly from your phone/computer or paste an image URL.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setInputMode('upload');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Upload Device File
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('url');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                inputMode === 'url'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Paste Image URL
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleAddPhoto} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Input Column (8 cols) */}
            <div className="md:col-span-7 space-y-4">
              {inputMode === 'upload' ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Select Image File
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-600/40 hover:border-emerald-600 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-emerald-800" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-950">
                        {isUploading ? 'Compressing & Preparing...' : 'Click to Browse Device Photo'}
                      </span>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        JPEG, PNG, WEBP (Automatically optimized for mobile speed)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={photoUrlInput.startsWith('data:') ? '' : photoUrlInput}
                    onChange={e => handleUrlChange(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-... or cloud image link"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Paste any public image link from Unsplash, Cloudinary, Imgur, or direct CDN.
                  </p>
                </div>
              )}

              {/* Photo Caption / Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Photo Caption / Title
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Crisp Jumbo Makhana Lotus Seeds in Moisture-Lock Zipper Pouch"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
                />
              </div>

              {/* Tag / Category Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Category Tag
                  </label>
                  <select
                    value={photoTag}
                    onChange={e => setPhotoTag(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 cursor-pointer"
                  >
                    {COMMON_TAGS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Custom">+ Custom Tag...</option>
                  </select>
                </div>

                {photoTag === 'Custom' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Enter Custom Tag Name
                    </label>
                    <input
                      type="text"
                      value={customTag}
                      onChange={e => setCustomTag(e.target.value)}
                      placeholder="e.g. Festival Special"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Column (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center">
              <label className="block text-xs font-bold text-stone-700 mb-1.5 self-start">
                Live Preview
              </label>
              <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden p-3 space-y-2.5">
                <div className="relative w-full h-44 rounded-xl bg-stone-200 overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={resetForm}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white text-xs transition-colors cursor-pointer"
                        title="Remove preview"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 text-stone-400 space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                      <p className="text-xs font-medium">No photo selected yet</p>
                      <p className="text-[10px]">Upload a file or paste URL to preview</p>
                    </div>
                  )}
                </div>

                {/* Simulated Metadata */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      <span>{photoTag === 'Custom' ? customTag || 'Custom' : photoTag}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {previewUrl ? (previewUrl.startsWith('data:') ? 'Compressed Image' : 'Cloud URL') : 'Waiting'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-stone-800 truncate">
                    {photoCaption || 'Photo caption will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200/80">
            {previewUrl && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || !previewUrl}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isSaving || !previewUrl
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-900 hover:bg-emerald-950 active:scale-95'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Photo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>Save Photo to Media</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: CURRENT MEDIA & GALLERY PHOTOS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Current Media & Gallery Photos ({currentPhotos.length})</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Photos currently visible on the public store gallery, customer reviews, and media catalog.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by caption or tag..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTagFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTagFilter === 'all'
                ? 'bg-emerald-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All ({currentPhotos.length})
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTagFilter(tag)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedTagFilter.toLowerCase() === tag.toLowerCase()
                  ? 'bg-emerald-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2 bg-stone-50/50 rounded-2xl border border-stone-200/60">
            <ImageIcon className="w-10 h-10 mx-auto stroke-1" />
            <p className="text-xs font-semibold text-stone-600">No media photos found</p>
            <p className="text-[11px] text-stone-400">
              {searchQuery ? 'Try adjusting your search query' : 'Use the form above to add your first photo to media!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo, idx) => {
              const isConfirmingDelete = deleteConfirmId === photo.id;
              return (
                <div
                  key={photo.id || idx}
                  className="group bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden hover:border-emerald-600/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Image container */}
                  <div className="relative h-40 bg-stone-200 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Maknuts Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Quick Preview overlay */}
                    <button
                      type="button"
                      onClick={() => setViewModalPhoto(photo)}
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      title="Click to view full size"
                    >
                      <span className="flex items-center gap-1 text-xs font-bold bg-black/60 px-2.5 py-1 rounded-lg">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>View</span>
                      </span>
                    </button>

                    {/* Tag badge */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold text-emerald-950 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-2xs border border-stone-200/60">
                        {photo.tag || 'Store Photo'}
                      </span>
                    </div>
                  </div>

                  {/* Caption & Details */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug">
                        {photo.caption || 'Maknuts Makhana Photo'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(photo.url)}
                        className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Copy image URL to clipboard"
                      >
                        {copiedUrl === photo.url ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id, idx)}
                            className="py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-[10px] font-bold text-white cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(photo.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete photo"
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
        )}
      </div>

      {/* SECTION 3: ACTIVE STOREFRONT BRAND ASSETS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-800" />
          <span>Active Storefront Brand Assets</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Official Store Logo */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Official Store Logo</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Primary</span>
            </div>
            <div className="h-32 rounded-lg bg-emerald-950 flex items-center justify-center overflow-hidden border border-emerald-900 p-2">
              <img
                src={settings.logoUrl || maknutsLogo}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-stone-400 truncate max-w-[150px]">SVG / PNG Vector</span>
              <button
                type="button"
                onClick={() => handleCopy(settings.logoUrl || maknutsLogo)}
                className="text-[11px] font-bold text-stone-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl === (settings.logoUrl || maknutsLogo) ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Asset</span>
              </button>
            </div>
          </div>

          {/* Primary Catalog Product Images */}
          {products.map((prod) => (
            <div key={prod.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="truncate">{prod.name} ({prod.weight})</span>
                <span className="text-[10px] font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">Product</span>
              </div>
              <div className="h-32 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-stone-200">
                <img
                  src={prod.image || prod.imageUrl}
                  alt={prod.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-stone-400 truncate max-w-[150px] font-mono">
                  {prod.image || prod.imageUrl}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(prod.image || prod.imageUrl || '')}
                  className="text-[11px] font-bold text-stone-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedUrl === (prod.image || prod.imageUrl) ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy URL</span>
                </button>
              </div>
            </div>
          ))}

          {/* Promotional Banner Backdrop */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Hero / Promo Backdrop</span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Banner</span>
            </div>
            <div className="h-32 rounded-lg bg-gradient-to-br from-emerald-950 via-emerald-900 to-amber-950 flex items-center justify-center overflow-hidden border border-emerald-900 p-2 text-center text-xs text-amber-200 font-serif font-black">
              100% Pure Organic Makhana · Fresh From Bihar
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-stone-400">CSS Gradient Mesh</span>
              <span className="text-[10px] font-bold text-emerald-800">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SIZE IMAGE PREVIEW MODAL */}
      {viewModalPhoto && (
        <div
          onClick={() => setViewModalPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-700 animate-in zoom-in-95 duration-200"
          >
            <div className="p-3 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {viewModalPhoto.tag || 'Store Photo'}
                </span>
                <span className="text-xs font-medium text-stone-300 truncate max-w-md">
                  {viewModalPhoto.caption}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewModalPhoto(null)}
                className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center bg-black p-2">
              <img
                src={viewModalPhoto.url}
                alt={viewModalPhoto.caption}
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-mono truncate max-w-md">
                {viewModalPhoto.url}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(viewModalPhoto.url)}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUrl === viewModalPhoto.url ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
