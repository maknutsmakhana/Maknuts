import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Star, MessageSquareHeart, CheckCircle2, Award, ChevronDown, ChevronUp, User } from 'lucide-react';
import { calculateReviewStats } from '../utils/reviews';

interface ReviewsSectionProps {
  onOpenFeedback: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ onOpenFeedback }) => {
  const { storeSettings, reviews } = useStore();
  const [showAllReviews, setShowAllReviews] = useState(false);

  if (storeSettings.sectionVisibility?.reviewsSection === false) {
    return null;
  }

  const section = storeSettings.reviewsSection || {
    title: 'Customer Reviews & Feedback',
    subtitle: 'Genuine verified feedback from makhana lovers across India.',
    ratingText: '',
    guaranteeBadge: '100% Quality Guaranteed',
    reviews: []
  };

  // Requirement: Only approved reviews appear publicly
  const approvedReviews = (reviews || []).filter(r => (r.status || 'approved') === 'approved');
  const reviewStats = calculateReviewStats(approvedReviews);

  const displayedReviews = showAllReviews ? approvedReviews : approvedReviews.slice(0, 3);

  return (
    <section aria-label="Customer Reviews and Ratings" className="my-8">
      <div className="bg-white rounded-3xl border border-[#E8DFD0] p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-2">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>{section.guaranteeBadge || '100% Quality Guaranteed'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
              {section.title || 'Customer Reviews & Feedback'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
              {section.subtitle || 'Genuine verified feedback from makhana lovers across India.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Rating Summary Box */}
            {reviewStats.hasReviews && (
              <div className="bg-[#FAF8F5] px-4 py-2 rounded-2xl border border-stone-200 flex items-center gap-2.5">
                <div className="text-2xl font-black text-emerald-950 font-serif">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(reviewStats.averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {reviewStats.totalReviews} verified {reviewStats.totalReviews === 1 ? 'rating' : 'ratings'}
                  </div>
                </div>
              </div>
            )}

            {/* Write Review Button */}
            <button
              type="button"
              onClick={onOpenFeedback}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <MessageSquareHeart className="w-4 h-4 text-amber-300" />
              <span>Write Review</span>
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {approvedReviews.length === 0 ? (
          <div className="text-center py-8 bg-[#FAF8F5] rounded-2xl border border-dashed border-stone-200">
            <MessageSquareHeart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-stone-500 font-medium">
              Be the first to share your experience with fresh harvest Phool Makhana!
            </p>
            <button
              type="button"
              onClick={onOpenFeedback}
              className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-emerald-900"
            >
              Share Your Review
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {displayedReviews.map(r => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">
                          {r.name ? r.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold text-stone-900 truncate max-w-[120px]">
                          {r.name}
                        </span>
                      </div>
                      {r.verifiedBuyer && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed italic">
                      "{r.comment}"
                    </p>
                  </div>

                  {r.location && (
                    <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-200/60 mt-3">
                      {r.location}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {approvedReviews.length > 3 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllReviews(prev => !prev)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>{showAllReviews ? 'Show Fewer Reviews' : `View All ${approvedReviews.length} Reviews`}</span>
                  {showAllReviews ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
