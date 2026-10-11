import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Camera, Star, X, ChevronLeft, ChevronRight, Award, MessageSquareHeart, CheckCircle2, Store } from 'lucide-react';
import { calculateReviewStats } from '../utils/reviews';

interface GalleryAndReviewsHubProps {
  onOpenFeedback: () => void;
}

export const GalleryAndReviewsHub: React.FC<GalleryAndReviewsHubProps> = ({ onOpenFeedback }) => {
  const { storeSettings, reviews } = useStore();

  const gallery = storeSettings.gallerySection || {
    title: 'Our Purity in Pictures',
    subtitle: 'Direct from pristine wetlands of Mithila, Bihar to crispy, nutritious snack bowls.',
    photos: []
  };
  const photos = gallery.photos || [];

  const reviewsSection = storeSettings.reviewsSection || {
    title: 'Customer Reviews & Feedback',
    subtitle: 'Genuine verified feedback from makhana lovers across India.',
    ratingText: '',
    guaranteeBadge: '100% Quality Guaranteed',
    reviews: []
  };

  // Requirement 2 & 8 & 9: Only APPROVED reviews appear publicly and calculate ratings
  const approvedReviews = (reviews || []).filter(r => (r.status || 'approved') === 'approved');
  const reviewStats = calculateReviewStats(approvedReviews);

  // Modals state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev! > 0 ? prev! - 1 : photos.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev! < photos.length - 1 ? prev! + 1 : 0));
  };

  const currentPhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  return (
    <section aria-label="Photo Gallery & Customer Reviews Hub" className="my-5 sm:my-8">
      {/* Side-by-Side Dual Button Box (Matches User Wireframe / Layout) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#D8CABE] shadow-xs overflow-hidden grid grid-cols-2 divide-x divide-[#D8CABE]">
        {/* Left Half: Photo Gallery */}
        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="group p-4 sm:p-6 flex flex-col items-center justify-center text-center hover:bg-[#FAF8F5] active:bg-[#F4EFE6] transition-all cursor-pointer min-h-[82px] sm:min-h-[100px]"
          aria-label="Open Photo Gallery"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 group-hover:scale-110 transition-transform">
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="font-extrabold text-xs sm:text-base text-emerald-950 font-serif leading-tight">
              Photo Gallery
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-stone-500 font-medium truncate max-w-[140px] sm:max-w-none">
            {photos.length > 0 ? `${photos.length} Verified Photos` : 'Explore Farm Visuals'}
          </span>
        </button>

        {/* Right Half: View & Write Review */}
        <button
          type="button"
          onClick={() => setIsReviewsOpen(true)}
          className="group p-4 sm:p-6 flex flex-col items-center justify-center text-center hover:bg-[#FAF8F5] active:bg-[#F4EFE6] transition-all cursor-pointer min-h-[82px] sm:min-h-[100px]"
          aria-label="Open Customer Reviews"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-110 transition-transform">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 stroke-amber-400" />
            </div>
            <span className="font-extrabold text-xs sm:text-base text-emerald-950 font-serif leading-tight">
              View & Write Review
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-stone-500 font-medium truncate max-w-[140px] sm:max-w-none">
            {reviewStats.hasReviews ? (
              <>★ {reviewStats.averageRating.toFixed(1)} / 5.0 · ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'Review' : 'Reviews'})</>
            ) : (
              'No reviews yet.'
            )}
          </span>
        </button>
      </div>

      {/* ========================================================
          1. PHOTO GALLERY MODAL WINDOW
         ======================================================== */}
      {isGalleryOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsGalleryOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-tight">
                    {gallery.title || 'Photo Gallery'}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    {photos.length} Verified Photos · Mithila, Bihar Farms to Bowl
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close photos window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photos Grid Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {photos.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm">
                  No gallery photos available right now.
                </div>
              ) : (
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
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 text-[11px]">Tap any photo to enlarge and view slideshow</span>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="px-4 py-2 bg-stone-150 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ENLARGED PHOTO LIGHTBOX MODAL
         ======================================================== */}
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
              <span className="text-stone-300 font-medium">
                Photo {activePhotoIndex! + 1} of {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                aria-label="Close enlarged photo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Center Display */}
            <div className="relative flex-1 flex items-center justify-center bg-black/60 p-2 sm:p-4 min-h-[300px] sm:min-h-[460px] max-h-[70vh] select-none">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || 'Maknuts pure makhana photo'}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl mx-auto"
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-900 text-white flex items-center justify-center transition-all shadow-lg border border-stone-700/60 cursor-pointer backdrop-blur-xs hover:scale-110 active:scale-95"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-900 text-white flex items-center justify-center transition-all shadow-lg border border-stone-700/60 cursor-pointer backdrop-blur-xs hover:scale-110 active:scale-95"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Caption Footer */}
            {currentPhoto.caption && (
              <div className="p-4 bg-stone-900/90 border-t border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-stone-200">
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  {currentPhoto.caption}
                </p>
                <span className="text-[11px] text-stone-400 shrink-0">
                  {storeSettings.shopName} Pure Bihar Fox Nuts
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          2. CUSTOMER REVIEWS & FEEDBACK MODAL WINDOW
         ======================================================== */}
      {isReviewsOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsReviewsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#FAF8F5] border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Star className="w-5 h-5 fill-amber-400 stroke-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-600">
                      {reviewStats.hasReviews ? `★ ${reviewStats.averageRating.toFixed(1)} / 5.0` : 'No reviews yet.'}
                    </span>
                    <span className="text-[11px] text-stone-400">•</span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'Approved Review' : 'Approved Reviews'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-emerald-950 font-serif leading-tight">
                    {reviewsSection.title || 'Customer Reviews & Feedback'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewsOpen(false);
                    onOpenFeedback();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-amber-200 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-amber-300" />
                  <span>Write Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReviewsOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close reviews window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reviews Summary Banner */}
            <div className="px-5 py-3.5 bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {reviewStats.hasReviews ? (
                  <>
                    <div className="flex text-amber-300 gap-0.5">
                      {[...Array(Math.max(1, Math.min(5, Math.round(reviewStats.averageRating))))].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-amber-200">
                      {reviewStats.averageRating.toFixed(1)} / 5.0 Rating
                    </span>
                    <span className="text-stone-300 text-[11px] hidden sm:inline">
                      — 100% Bihar Harvest Quality
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-amber-200">
                    No reviews yet.
                  </span>
                )}
              </div>

              {/* Star Breakdown Summary */}
              {reviewStats.hasReviews && (
                <div className="flex items-center gap-2 text-[10px] text-stone-300 overflow-x-auto py-0.5">
                  <span className="text-amber-300 font-bold">5★: {reviewStats.starCounts[5]}</span>
                  <span>•</span>
                  <span>4★: {reviewStats.starCounts[4]}</span>
                  <span>•</span>
                  <span>3★: {reviewStats.starCounts[3]}</span>
                  {reviewStats.starCounts[2] > 0 && <><span>•</span><span>2★: {reviewStats.starCounts[2]}</span></>}
                  {reviewStats.starCounts[1] > 0 && <><span>•</span><span>1★: {reviewStats.starCounts[1]}</span></>}
                </div>
              )}

              {reviewsSection.guaranteeBadge && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200 bg-emerald-900/70 px-2.5 py-0.5 rounded-full border border-emerald-700/50 shrink-0">
                  <Award className="w-3 h-3 text-amber-300" />
                  <span>{reviewsSection.guaranteeBadge}</span>
                </div>
              )}
            </div>

            {/* Scrollable Reviews Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {approvedReviews.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm space-y-2">
                  <p className="font-semibold text-stone-500">No reviews yet.</p>
                  <p className="text-xs">Be the first to share your honest thoughts on Maknuts crunch and quality!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 text-xs">
                  {approvedReviews.map((review, idx) => (
                    <div 
                      key={review.id || idx} 
                      className="bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200/90 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div>
                        {/* Rating Stars & Date */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex text-amber-500 gap-0.5">
                            {[...Array(review.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                            ))}
                          </div>
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

                        {/* Comment text */}
                        <p className="text-stone-700 italic leading-relaxed text-xs">
                          "{review.comment}"
                        </p>

                        {/* Attached customer photo */}
                        {review.photo && (
                          <div className="mt-2.5 w-16 h-16 rounded-xl overflow-hidden border border-stone-300 shadow-2xs">
                            <img 
                              src={review.photo} 
                              alt="Customer review photo" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Store Reply if admin responded */}
                        {review.storeReply && (
                          <div className="mt-2.5 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-emerald-950 font-bold">
                              <span className="flex items-center gap-1 text-emerald-800">
                                <Store className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Maknuts Store Reply</span>
                              </span>
                              {review.storeReplyAt && (
                                <span className="text-[10px] font-normal text-stone-400">
                                  {new Date(review.storeReplyAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-stone-700 italic">
                              "{review.storeReply}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Author & Verified Tag (Only when genuinely verified) */}
                      <div className="font-bold text-stone-900 pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px]">
                        <span className="truncate pr-2">
                          — {review.name}{review.location ? `, ${review.location}` : ''}
                        </span>
                        {review.verifiedBuyer && (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0 border border-emerald-200" title="Genuine verified customer order delivered">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="p-4 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-between gap-3 text-xs">
              <span className="text-stone-500 text-[11px] hidden sm:inline">
                Verified buyer reviews from all across India
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewsOpen(false);
                    onOpenFeedback();
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-200 rounded-xl font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-amber-300" />
                  <span>Write Feedback</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReviewsOpen(false)}
                  className="px-4 py-2 bg-stone-150 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
