import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Star, Heart, CheckCircle2, MessageSquareHeart, Upload, Trash2, Send, MessageCircle } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Taste & Crunch Quality',
  'Packaging & Seal',
  'Delivery & Shipping Speed',
  'New Flavors Suggestion',
  'General Experience'
];

const RATING_LABELS: Record<number, string> = {
  5: '⭐⭐⭐⭐⭐ Outstanding Purity & Crunch!',
  4: '⭐⭐⭐⭐ Great Makhana, Very Happy!',
  3: '⭐⭐⭐ Good, Room for Improvement',
  2: '⭐⭐ Below Expectations',
  1: '⭐ Disappointed'
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { storeSettings, submitReviewAndFeedback } = useStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customerName, setCustomerName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Photo must be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!message.trim()) {
      setError('Please write your review & feedback message.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitReviewAndFeedback({
        name: customerName.trim(),
        location: location.trim() || 'Verified Buyer',
        rating,
        category,
        comment: message.trim(),
        phone: phone.trim() || undefined,
        photo: photo || undefined,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Failed to submit review. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppFeedback = () => {
    const text = `*New Customer Review & Feedback for ${storeSettings.shopName}*\n\n` +
      `👤 *Name:* ${customerName}${location ? ` (${location})` : ''}\n` +
      `⭐ *Rating:* ${rating}/5 Stars (${RATING_LABELS[rating]})\n` +
      `🏷️ *Category:* ${category}\n` +
      (phone ? `📞 *Phone:* ${phone}\n` : '') +
      `💬 *Review / Feedback:* ${message}\n\n` +
      `Thank you for delivering pure Bihar Makhana!`;

    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setMessage('');
    setLocation('');
    setPhoto('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl shadow-2xl border border-[#DFD5C6] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
              <MessageSquareHeart className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg font-serif tracking-tight text-amber-100">
                Customer Feedback & Experience
              </h2>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Your thoughts help {storeSettings.shopName} serve you the crispest makhana
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close feedback modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {isSubmitted ? (
            /* Success State */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-emerald-950 font-serif">
                  Thank You, {customerName}!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  Your feedback has been received and shared directly with the {storeSettings.shopName} quality team.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-stone-500">
                  <span>Rating Given:</span>
                  <span className="font-bold text-amber-600">{'★'.repeat(rating)} ({rating}/5)</span>
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <span>Category:</span>
                  <span className="font-semibold text-stone-800">{category}</span>
                </div>
                <p className="text-stone-700 italic pt-1 border-t border-stone-100">
                  "{message}"
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleSendWhatsAppFeedback}
                  className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-200" />
                  <span>Send Also to Owner on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="py-2.5 px-5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Feedback Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Selection */}
              <div className="bg-white p-4 rounded-2xl border border-[#E9DFD1] text-center shadow-xs">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-950 mb-1">
                  How was your experience?
                </label>
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-emerald-900 mt-1">
                  {RATING_LABELS[hoverRating || rating]}
                </p>
              </div>

              {/* Feedback Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Feedback Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Message */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Your Thoughts & Suggestions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you liked about the crunch, taste, or how we can do even better..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                  required
                />
              </div>

              {/* Customer Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, Patna"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    WhatsApp / Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Photo Attachment */}
              <div className="bg-white p-3 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700">
                    Add a Photo of your Makhana (Optional)
                  </span>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto('')}
                      className="text-xs text-rose-600 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {photo ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200">
                    <img src={photo} alt="Feedback preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/50 cursor-pointer text-xs text-stone-600 transition-colors">
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span>Click to attach photo (bowl, pouch, recipe)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {error}
                </p>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="py-3 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
