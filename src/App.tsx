import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Banner } from './components/Banner';
import { ProductCard } from './components/ProductCard';
import { ProductBenefits } from './components/ProductBenefits';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TrackingModal } from './components/TrackingModal';
import { PolicyModal } from './components/PolicyModal';
import { Footer } from './components/Footer';
import { FeedbackModal } from './components/FeedbackModal';
import { PhotoGallery } from './components/PhotoGallery';
import { Order } from './types';
import { Star, ShieldCheck, Heart, Sparkles, Award } from 'lucide-react';

function StoreFront() {
  const { activeProduct, products, setActiveProductId, storeSettings } = useStore();

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'returns' | 'shipping' | null>(null);

  // Hash listener for admin & tracking (e.g. #admin or #track=MK10001 in URL)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setIsAdminOpen(true);
      } else if (hash.startsWith('#track')) {
        const parts = hash.split('=');
        if (parts[1]) {
          setTrackingQuery(decodeURIComponent(parts[1]));
        }
        setIsTrackingOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleBuyNow = (qty: number) => {
    setSelectedQuantity(qty);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setIsCheckoutOpen(false);
    setSuccessOrder(order);
  };

  const handleOpenTrackingWithQuery = (query: string = '') => {
    setTrackingQuery(query);
    setIsTrackingOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col font-sans selection:bg-amber-200 selection:text-emerald-950">
      {/* Top Notification Banner with Track Link */}
      <Banner onOpenTracking={() => handleOpenTrackingWithQuery('')} />

      {/* Navigation Header with Track Order button */}
      <Header
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTracking={() => handleOpenTrackingWithQuery('')}
        onOpenPolicies={policy => setActivePolicy(policy)}
      />

      {/* Main Content Showcase */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10 w-full space-y-10">
        
        {/* If store owner added multiple products, show clean tab bar */}
        {products.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProductId(p.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  p.id === activeProduct.id
                    ? 'bg-emerald-900 text-amber-200 shadow-md border border-emerald-800'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
                }`}
              >
                {p.name} ({p.weight})
              </button>
            ))}
          </div>
        )}

        {/* Featured Product Card */}
        <section aria-label="Main Product Showcase">
          <ProductCard
            product={activeProduct}
            onBuyNow={handleBuyNow}
          />
        </section>

        {/* Nutritional & Quality Benefits */}
        <section aria-label="Product Benefits & Purity">
          <ProductBenefits />
        </section>

        {/* Verified Customer Reviews / Social Proof */}
        {storeSettings.reviewsSection && (
          <section className="bg-white rounded-3xl border border-[#E9DFD1] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#E9DFD1]">
              <div>
                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-stone-800 ml-1">
                    {storeSettings.reviewsSection.ratingText || '4.9 / 5.0'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-emerald-950 font-serif">
                  {storeSettings.reviewsSection.title || 'Loved by Customers Across India'}
                </h3>
                {storeSettings.reviewsSection.subtitle && (
                  <p className="text-xs text-stone-500">
                    {storeSettings.reviewsSection.subtitle}
                  </p>
                )}
              </div>

              {storeSettings.reviewsSection.guaranteeBadge && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{storeSettings.reviewsSection.guaranteeBadge}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {(storeSettings.reviewsSection.reviews || []).map((review, idx) => (
                <div key={review.id || idx} className="bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200/80 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-500 gap-0.5 mb-2">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <p className="text-stone-700 italic leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>
                  <div className="font-bold text-stone-900 pt-2 border-t border-stone-200/60">
                    — {review.name}{review.location ? `, ${review.location}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Real Farm & Product Photo Showcase */}
        <PhotoGallery />
      </main>

      {/* Store Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPolicy={policy => setActivePolicy(policy)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Customer Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={activeProduct}
        initialQuantity={selectedQuantity}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Success Confirmation Screen */}
      <OrderSuccessModal
        order={successOrder}
        storeSettings={storeSettings}
        onClose={() => setSuccessOrder(null)}
        onTrackOrder={(orderNum) => {
          setSuccessOrder(null);
          handleOpenTrackingWithQuery(orderNum);
        }}
      />

      {/* Customer Order Tracking Modal */}
      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialQuery={trackingQuery}
      />

      {/* Password-protected Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Policy Modal */}
      <PolicyModal
        policyType={activePolicy}
        onClose={() => setActivePolicy(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StoreFront />
    </StoreProvider>
  );
}
