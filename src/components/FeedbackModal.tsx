import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Star, Heart, CheckCircle2, MessageSquareHeart, Upload, Trash2, Send, MessageCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';
import { compressImageFile } from '../utils/imageCompressor';
import { validateReviewForm } from '../utils/reviews';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  5: '⭐⭐⭐⭐⭐ Outstanding Purity & Crunch!',
  4: '⭐⭐⭐⭐ Great Makhana, Very Happy!',
  3: '⭐⭐⭐ Good, Room for Improvement',
  2: '⭐⭐ Below Expectations',
  1: '⭐ Disappointed'
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { storeSettings, submitCustomerReview } = useStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [wasVerifiedBuyer, setWasVerifiedBuyer] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be less than 10MB');
      return;
    }

    try {
      const compressed = await compressImageFile(file, 640, 0.68, 45000);
      setPhoto(compressed);
      setError('');
    } catch {
      setError('Could not process photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = customerName.trim();
    const trimmedMessage = message.trim();
    const trimmedOrderId = orderId.trim();
    const trimmedPhone = phone.trim();

    // Form validation
    const validation = validateReviewForm({
      name: trimmedName,
      rating,
      comment: trimmedMessage,
    });

    if (!validation.isValid) {
      setError(validation.error || 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await submitCustomerReview({
        name: trimmedName,
        rating,
        comment: trimmedMessage,
        orderId: trimmedOrderId || undefined,
        phone: trimmedPhone || undefined,
        location: location.trim() || undefined,
        photo: photo || undefined,
      });

      setWasVerifiedBuyer(result.verifiedBuyer);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submit review error:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppFeedback = () => {
    const text = `*New Customer Review & Feedback for ${storeSettings.shopName}*\n\n` +
      `👤 *Name:* ${customerName.trim()}${location.trim() ? ` (${location.trim()})` : ''}\n` +
      `⭐ *Rating:* ${rating}/5 Stars (${RATING_LABELS[rating]})\n` +
      (orderId.trim() ? `📦 *Order ID:* ${orderId.trim()}\n` : '') +
      (phone.trim() ? `📞 *Phone:* ${phone.trim()}\n` : '') +
      `💬 *Review / Feedback:* ${message.trim()}\n\n` +
      `Thank you for delivering pure Bihar Makhana!`;

    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setMessage('');
    setLocation('');
    setOrderId('');
    setPhone('');
    setPhoto('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Identical styling to PolicyModal */}
        <div className="px-5 py-4 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                Write a Review & Feedback
              </h2>
              <p className="text-[11px] text-stone-500">
                Share your honest thoughts on crunch, taste & packaging
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close feedback modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {isSubmitted ? (
            /* Requirement 6: Success State with Exact Required Text */
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg sm:text-xl font-bold text-emerald-950 font-serif">
                  Review Received!
                </h3>
                {/* Requirement 6: Exact Required Notice */}
                <p className="text-xs sm:text-sm font-semibold text-emerald-900 bg-emerald-50 py-2.5 px-4 rounded-xl border border-emerald-200 leading-relaxed">
                  Thank you. Your review has been submitted and will appear after approval.
                </p>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-stone-500">
                  <span>Rating Given:</span>
                  <span className="font-bold text-amber-600">{'★'.repeat(rating)} ({rating}/5)</span>
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <span>Reviewer:</span>
                  <span className="font-bold text-stone-900">{customerName}</span>
                </div>
                {wasVerifiedBuyer && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Verified Buyer Attached</span>
                  </div>
                )}
                <p className="text-stone-700 italic pt-1 border-t border-stone-200/60">
                  "{message}"
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleSendWhatsAppFeedback}
                  className="flex-1 py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-200" />
                  <span>Send Also on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="py-2 px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Requirement 4 & 5: Review Form */
            <form onSubmit={handleSubmit} id="feedback-form" className="space-y-4">
              {/* Star Rating Selection */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-200 text-center">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Rate Your Experience (1 - 5 Stars) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center justify-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={isSubmitting}
                      className="p-1 transition-transform hover:scale-115 focus:outline-none cursor-pointer disabled:opacity-50"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium text-emerald-850 mt-0.5">
                  {RATING_LABELS[hoverRating || rating]}
                </p>
              </div>

              {/* Customer Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    disabled={isSubmitting}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none disabled:bg-stone-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    City / Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    disabled={isSubmitting}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, Patna, Delhi"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none disabled:bg-stone-50"
                  />
                </div>
              </div>

              {/* Requirement 4: Optional Order ID & Optional Registered Mobile for Verified Buyer Check */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Have an Order ID? (Optional Verified Buyer Badge)</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Optional</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  If you previously ordered, enter your Order ID & registered mobile number. Once verified as Delivered, a "Verified Buyer" badge will be automatically attached to your review.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                      Order ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      disabled={isSubmitting}
                      onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                      placeholder="e.g. MK-261009-A7F3"
                      className="w-full px-3 py-1.5 bg-white rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-emerald-700/30 focus:outline-none disabled:bg-stone-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                      Registered Mobile (Optional)
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      disabled={isSubmitting}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-1.5 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none disabled:bg-stone-50"
                    />
                  </div>
                </div>
              </div>

              {/* Review & Feedback Message */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Your Review / Thoughts <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  disabled={isSubmitting}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your experience with taste, crunch, packaging, delivery or suggestions..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none disabled:bg-stone-50"
                  required
                />
              </div>

              {/* Optional Photo Attachment */}
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700">
                    Add a Photo of Your Makhana (Optional)
                  </span>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto('')}
                      disabled={isSubmitting}
                      className="text-xs text-rose-600 flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {photo ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-300">
                    <img src={photo} alt="Feedback preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-stone-300 hover:border-emerald-700 bg-white hover:bg-emerald-50/40 cursor-pointer text-xs text-stone-600 transition-colors">
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span>Attach photo (bowl, pouch, crispness)</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isSubmitting}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Bottom Bar */}
        {!isSubmitted && (
          <div className="p-4 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="feedback-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting Review...' : 'Submit Review'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
