import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Camera, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export const PhotoGallery: React.FC = () => {
  const { storeSettings } = useStore();
  const gallery = storeSettings.gallerySection || {
    title: 'Our Purity in Pictures',
    subtitle: 'Direct from pristine wetlands of Mithila, Bihar to crispy, nutritious snack bowls.',
    buttonLabel: '📸 View Photos',
    photos: []
  };

  const photos = gallery.photos || [];
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev! > 0 ? prev! - 1 : photos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev! < photos.length - 1 ? prev! + 1 : 0));
  };

  const currentPhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  return (
    <section className="bg-white rounded-3xl border border-[#E9DFD1] p-5 sm:p-6 shadow-xs my-6">
      {/* Visuals Action Card with View Photos button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
              {gallery.title || 'Farm & Product Photos'}
            </h3>
            <p className="text-xs text-stone-500">
              {gallery.subtitle || 'Direct from pristine wetlands of Mithila, Bihar · Pure Makhana Visuals'}
            </p>
          </div>
        </div>

        {/* View Photos Button - Opens new photos window */}
        <button
          type="button"
          onClick={() => setIsWindowOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
        >
          <Camera className="w-4 h-4 text-amber-300" />
          <span>View Photos</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-amber-200 text-xs font-semibold">
            {photos.length}
          </span>
        </button>
      </div>

      {/* Photos Window Modal - Opens on clicking 'View Photos' */}
      {isWindowOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsWindowOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[88vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Window Top Bar */}
            <div className="px-5 py-4 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                    {gallery.title || 'Farm & Product Photos'}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Showing all {photos.length} verified photos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWindowOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close photos window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photos Grid Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:scale-[1.02] active:scale-98"
                    title={photo.caption || 'Click to view photo full size'}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Maknuts photo'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Window Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 text-[11px]">Click any photo to enlarge</span>
              <button
                type="button"
                onClick={() => setIsWindowOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Lightbox Modal */}
      {currentPhoto && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox Top Bar */}
            <div className="px-4 py-3 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-300 font-medium">
                  Photo {activePhotoIndex! + 1} of {photos.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                aria-label="Close enlarged photo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Center Display with navigation */}
            <div className="relative flex-1 flex items-center justify-center bg-black/60 p-2 sm:p-4 min-h-[300px] sm:min-h-[460px] max-h-[70vh] select-none">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || 'Maknuts pure makhana photo'}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl mx-auto"
              />

              {/* Prev Button */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-900 text-white flex items-center justify-center transition-all shadow-lg border border-stone-700/60 cursor-pointer backdrop-blur-xs hover:scale-110"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Button */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-900 text-white flex items-center justify-center transition-all shadow-lg border border-stone-700/60 cursor-pointer backdrop-blur-xs hover:scale-110"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Bottom Caption Bar */}
            {currentPhoto.caption && (
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
            )}
          </div>
        </div>
      )}
    </section>
  );
};
