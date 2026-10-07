import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Check, Plus, Minus, ShoppingBag, MessageCircle, ShieldCheck, Sparkles, AlertCircle, Maximize2, ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface ProductCardProps {
  product: Product;
  onBuyNow: (quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  const { storeSettings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Multiple product images resolution
  const productImages = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : []);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = productImages[activeImageIndex] || product.image;

  const discountPercent = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev > 0 ? prev - 1 : productImages.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev < productImages.length - 1 ? prev + 1 : 0));
  };

  const handleDirectWhatsAppQuery = () => {
    const text = `Hello! I want to inquire about purchasing *${product.name} (${product.weight})* priced at ₹${product.price}.`;
    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E9DFD1] shadow-xl shadow-stone-200/50 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Left Side: Product Image Display & Thumbnails */}
        <div className="md:col-span-6 bg-gradient-to-b from-[#F7F4EE] to-[#EFE9DF] p-4 sm:p-6 md:p-8 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-[#E9DFD1]">
          {/* Badge */}
          <div className="w-full flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-900 text-amber-200 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {product.badge || '100% Bihar Harvest'}
            </span>
          </div>

          {/* Main Product Image Container */}
          <div 
            className="relative my-3 sm:my-4 group cursor-zoom-in w-full max-w-[340px] aspect-square flex items-center justify-center select-none"
            onClick={() => setIsImageZoomed(true)}
          >
            <div className="absolute inset-0 bg-radial from-amber-200/30 via-transparent to-transparent rounded-full blur-2xl -z-0" />
            <img
              src={activeImage}
              alt={`${product.name} - Photo ${activeImageIndex + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-2xl drop-shadow-2xl transition-all duration-300 group-hover:scale-105 z-10"
            />

            {/* Left / Right Nav Arrows on photo */}
            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-emerald-900 shadow-md flex items-center justify-center transition-all z-20 cursor-pointer active:scale-90"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-emerald-900 shadow-md flex items-center justify-center transition-all z-20 cursor-pointer active:scale-90"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button 
              type="button" 
              className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-emerald-900 opacity-80 group-hover:opacity-100 transition-opacity z-20"
              title="Click to zoom image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Additional Product Photos Thumbnail Strip */}
          {productImages.length > 1 && (
            <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-2 px-1 max-w-full mb-2">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white p-0.5 ${
                    idx === activeImageIndex
                      ? 'border-emerald-800 ring-2 ring-emerald-700/30 scale-105 shadow-sm'
                      : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                  }`}
                  title={`View photo ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Trust points under photo */}
          {storeSettings.trustBadges && storeSettings.trustBadges.length > 0 && (
            <div className="w-full pt-3 border-t border-[#DFD5C6] flex flex-wrap items-center justify-around gap-2 text-[11px] font-semibold text-emerald-950/80">
              {storeSettings.trustBadges.map((badge, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" /> {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Purchase Actions */}
        <div className="md:col-span-6 p-5 sm:p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* Title & Tagline */}
            <div className="mb-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 font-serif tracking-tight">
                {product.name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-800 font-medium mt-1">
                {product.tagline}
              </p>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 my-4 p-3.5 bg-[#FAF8F3] rounded-2xl border border-[#ECE4D8]">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-950 font-serif">
                ₹{product.price}
              </div>
              {product.originalPrice > product.price && (
                <div className="text-sm sm:text-base text-stone-400 line-through font-semibold">
                  MRP ₹{product.originalPrice}
                </div>
              )}
              <div className="ml-auto text-right">
                <div className="text-xs font-bold text-stone-700 bg-amber-100/90 text-amber-900 px-2.5 py-1 rounded-md inline-block">
                  Pack of {product.weight}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  (Incl. of all taxes)
                </div>
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="flex items-center gap-2 mb-4">
              {product.inStock ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {product.stockStatusText || 'In Stock · Fresh Batch Ready to Ship'}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Currently Out of Stock
                </div>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5">
              {product.shortDescription}
            </p>

            {/* Highlights bullets */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="space-y-1.5 mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-950/70">
                  Key Benefits & Purity:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-700">
                  {product.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Zone */}
          <div className="pt-4 border-t border-[#ECE4D8] space-y-3">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Quantity:
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xs cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-lg text-emerald-950">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-all active:scale-95 shadow-xs cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtotal preview */}
            <div className="flex items-center justify-between text-xs px-1 text-stone-500">
              <span>Item Total ({quantity} x ₹{product.price}):</span>
              <span className="font-bold text-emerald-950 text-sm">
                ₹{quantity * product.price}
              </span>
            </div>

            {/* Big Primary BUY NOW Button */}
            <button
              type="button"
              onClick={() => onBuyNow(quantity)}
              disabled={!product.inStock}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-900 hover:to-emerald-900 active:scale-[0.99] text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-900/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-emerald-600/30"
            >
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <span>{storeSettings.buttons.buyNow || 'Buy Now'}</span>
              <span className="text-emerald-200 text-sm font-normal">
                (₹{quantity * product.price})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Product Photos Window Modal */}
      {isImageZoomed && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
        >
          <div 
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Window Top Bar */}
            <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                    {product.name} — Photos
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Photo {activeImageIndex + 1} of {productImages.length} · {product.weight} Pack
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImageZoomed(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close photos window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Stage */}
            <div className="relative flex-1 bg-stone-50/80 p-4 sm:p-6 flex items-center justify-center min-h-[280px] max-h-[60vh] overflow-hidden">
              <img
                src={activeImage}
                alt={`${product.name} photo ${activeImageIndex + 1}`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[55vh] object-contain rounded-2xl drop-shadow-lg transition-transform duration-300"
              />

              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-800 hover:text-emerald-900 shadow-md flex items-center justify-center transition-all border border-stone-200 cursor-pointer active:scale-95"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-800 hover:text-emerald-900 shadow-md flex items-center justify-center transition-all border border-stone-200 cursor-pointer active:scale-95"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation & Footer */}
            <div className="p-3.5 bg-[#FAF8F5] border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {productImages.length > 1 ? (
                <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-white p-0.5 ${
                        idx === activeImageIndex
                          ? 'border-emerald-800 ring-2 ring-emerald-700/30 scale-105 shadow-xs'
                          : 'border-stone-300 opacity-60 hover:opacity-100'
                      }`}
                      title={`View photo ${idx + 1}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-stone-500">100% Verified Bihar Makhana Image</span>
              )}

              <button
                type="button"
                onClick={() => setIsImageZoomed(false)}
                className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Close Photos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
