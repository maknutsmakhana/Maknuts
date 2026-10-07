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
import { GalleryAndReviewsHub } from './components/GalleryAndReviewsHub';
import { Order } from './types';

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
      <main className="flex-1 max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full space-y-6 sm:space-y-10">
        
        {/* If store owner added multiple products, show clean tab bar */}
        {products.length > 1 && (
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-1 px-0.5">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProductId(p.id)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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

        {/* Side-by-Side Photo Gallery & Verified Reviews Hub */}
        <GalleryAndReviewsHub onOpenFeedback={() => setIsFeedbackOpen(true)} />
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
