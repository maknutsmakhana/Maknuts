import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { GalleryPhoto } from '../types';
import { Camera, X, ChevronLeft, ChevronRight, Sparkles, Maximize2, Tag } from 'lucide-react';

export const PhotoGallery: React.FC = () => {
  const { storeSettings } = useStore();
  const gallery = storeSettings.gallerySection || {
    title: 'Our Purity in Pictures',
    subtitle: 'Direct from pristine wetlands of Mithila, Bihar to crispy, nutritious snack bowls.',
    buttonLabel: '📸 View Farm & Product Photos',
    photos: []
  };

  const photos = gallery.photos || [];

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [filterTag, setFilterTag] = useState<string>('All');

  if (photos.length === 0) return null;

  const allTags = ['All', ...Array.from(new Set(photos.map(p => p.tag).filter(Boolean)))];

  const filteredPhotos = filterTag === 'All' 
    ? photos 
    : photos.filter(p => p.tag === filterTag);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev! > 0 ? prev! - 1 : filteredPhotos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev! < filteredPhotos.length - 1 ? prev! + 1 : 0));
  };

  const currentPhoto = activePhotoIndex !== null ? filteredPhotos[activePhotoIndex] : null;

  return (
    <section className="bg-white rounded-3xl border border-[#E9DFD1] p-6 sm:p-8 shadow-xs my-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#E9DFD1]">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Real Farm & Product Visuals</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
            {gallery.title || 'Our Purity in Pictures'}
          </h2>
          {gallery.subtitle && (
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
              {gallery.subtitle}
            </p>
          )}
        </div>

        {/* Primary Action Button to Open Lightbox */}
        <button
          type="button"
          onClick={() => setActivePhotoIndex(0)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-950 hover:to-stone-900 text-amber-200 border border-emerald-700/50 shadow-md text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Camera className="w-4 h-4 text-amber-300" />
          <span>{gallery.buttonLabel || '📸 View All Photos'}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px]">
            {photos.length}
          </span>
        </button>
      </div>

      {/* Filter Tabs if multiple categories exist */}
      {allTags.length > 2 && (
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 text-xs">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setFilterTag(tag);
                setActivePhotoIndex(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTag === tag
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Photo Grid Preview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {filteredPhotos.map((photo, idx) => (
          <div
            key={photo.id || idx}
            onClick={() => setActivePhotoIndex(idx)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 cursor-zoom-in shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <img
              src={photo.url}
              alt={photo.caption || 'Maknuts photo'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Tag Badge */}
            {photo.tag && (
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-amber-200 backdrop-blur-xs border border-emerald-700/40">
                {photo.tag}
              </span>
            )}
            {/* Overlay Caption on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
              <p className="text-[11px] font-medium line-clamp-2 leading-snug">
                {photo.caption}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold mt-1">
                <Maximize2 className="w-3 h-3" /> Click to view
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Lightbox Modal */}
      {currentPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox Top Bar */}
            <div className="px-4 py-3 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-amber-200 text-[10px] font-bold">
                  {currentPhoto.tag || 'Maknuts Visual'}
                </span>
                <span className="text-stone-400">
                  {activePhotoIndex! + 1} of {filteredPhotos.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                aria-label="Close photo lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Center Display with navigation */}
            <div className="relative flex-1 flex items-center justify-center bg-black/50 p-2 sm:p-4 min-h-[300px] max-h-[65vh]">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />

              {/* Prev Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-900 text-white flex items-center justify-center transition-all shadow-lg border border-stone-700/60 cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-900 text-white flex items-center justify-center transition-all shadow-lg border border-stone-700/60 cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Bottom Caption Bar */}
            <div className="p-4 bg-stone-900/90 border-t border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-stone-200">
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {currentPhoto.caption}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-stone-400">
                  {storeSettings.shopName} Pure Bihar Fox Nuts
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
