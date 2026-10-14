import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Banner } from './components/Banner';
import { HeroSection } from './components/HeroSection';
import { PromoBannerSection } from './components/PromoBannerSection';
import { ProductCard } from './components/ProductCard';
import { FoodComplianceSection } from './components/FoodComplianceSection';
import { ProductBenefits } from './components/ProductBenefits';
import { FaqSection } from './components/FaqSection';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TrackingModal } from './components/TrackingModal';
import { PolicyModal } from './components/PolicyModal';
import { Footer } from './components/Footer';
import { FeedbackModal } from './components/FeedbackModal';
import { PhotoGallery } from './components/PhotoGallery';
import { ReviewsSection } from './components/ReviewsSection';
import { GalleryAndReviewsHub } from './components/GalleryAndReviewsHub';
import { ContactSection } from './components/ContactSection';
import { StoreSeoHead } from './components/StoreSeoHead';
import { Order, SectionVisibility } from './types';

function StoreFront() {
  const { activeProduct, products, setActiveProductId, storeSettings } = useStore();

  // Check whether current URL is dedicated admin backend route (/admin or #admin)
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/admin' ||
      path.startsWith('/admin/') ||
      path === '/backend' ||
      path.startsWith('/backend/') ||
      hash === '#admin' ||
      search.includes('admin')
    );
  };

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(checkIsAdminRoute);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackingPhone, setTrackingPhone] = useState('');
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'returns' | 'shipping' | 'cancellation' | null>(null);



  // URL & Route listener for admin backend (/admin) & tracking (#track=...)
  useEffect(() => {
    const handleUrlChange = () => {
      const isRouteAdmin = checkIsAdminRoute();
      setIsAdminOpen(isRouteAdmin);

      const hash = window.location.hash;
      if (hash.startsWith('#track')) {
        const parts = hash.split('=');
        if (parts[1]) {
          setTrackingQuery(decodeURIComponent(parts[1]));
        }
        setIsTrackingOpen(true);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    // If the browser URL is currently an admin route (/admin, #admin), cleanly transition to '/'
    if (checkIsAdminRoute()) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleBuyNow = (qty: number) => {
    setSelectedQuantity(qty);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setIsCheckoutOpen(false);
    setSuccessOrder(order);
  };

  const handleOpenTrackingWithQuery = (orderId: string = '', phone: string = '') => {
    setTrackingOrderId(orderId);
    setTrackingPhone(phone);
    setTrackingQuery(orderId);
    setIsTrackingOpen(true);
  };

  const visibility = storeSettings.sectionVisibility || {
    announcementBar: true,
    headerNavigation: true,
    heroBanner: true,
    promoBanner: true,
    productShowcase: true,
    benefitsSection: true,
    foodCompliance: true,
    gallerySection: true,
    reviewsSection: true,
    faqSection: true,
    aboutSection: true,
    contactSection: true,
    floatingWhatsApp: true,
    footer: true,
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col font-sans selection:bg-amber-200 selection:text-emerald-950">
      {/* Dynamic SEO Meta, OpenGraph, Canonical & Schema.org JSON-LD */}
      <StoreSeoHead
        settings={storeSettings}
        activeProduct={activeProduct}
        isAdminOpen={isAdminOpen}
      />

      {/* Top Notification Banner with Track Link */}
      {visibility.announcementBar !== false && (
        <Banner onOpenTracking={() => handleOpenTrackingWithQuery('')} />
      )}

      {/* Navigation Header with Track Order button */}
      {visibility.headerNavigation !== false && (
        <Header
          onOpenTracking={() => handleOpenTrackingWithQuery('')}
          onOpenPolicies={policy => setActivePolicy(policy)}
        />
      )}

      {/* Main Content Showcase - Dynamically Ordered via Admin sectionOrder */}
      <main className="flex-1 max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full space-y-6 sm:space-y-8">
        {(() => {
          const defaultSections = [
            'heroBanner',
            'promoBanner',
            'productShowcase',
            'foodCompliance',
            'benefitsSection',
            'gallerySection',
            'reviewsSection',
            'faqSection',
            'contactSection',
          ];

          const currentOrder = (Array.isArray(storeSettings.sectionOrder) && storeSettings.sectionOrder.length > 0)
            ? storeSettings.sectionOrder
            : defaultSections;

          // Filter for body sections (excluding headers, footers, and floating buttons)
          const mainSections = currentOrder.filter(id => 
            id !== 'announcementBar' && id !== 'headerNavigation' && id !== 'footer' && id !== 'floatingWhatsApp'
          );

          // Append any standard sections omitted from stored order
          defaultSections.forEach(id => {
            if (!mainSections.includes(id)) {
              mainSections.push(id);
            }
          });

          let hasRenderedGalleryAndReviewsHub = false;

          return mainSections.map((sectionId) => {
            // Respect section visibility
            if (visibility[sectionId as keyof SectionVisibility] === false) {
              return null;
            }

            // Side-by-side Photo Gallery & Reviews Hub (matches user attached image in mobile & web view)
            if (sectionId === 'gallerySection' || sectionId === 'reviewsSection') {
              if (hasRenderedGalleryAndReviewsHub) {
                return null;
              }
              hasRenderedGalleryAndReviewsHub = true;
              return (
                <GalleryAndReviewsHub 
                  key="galleryAndReviewsHub" 
                  onOpenFeedback={() => setIsFeedbackOpen(true)} 
                />
              );
            }

            switch (sectionId) {
              case 'heroBanner':
                return (
                  <HeroSection 
                    key="heroBanner" 
                    onShopNow={() => handleBuyNow(1)} 
                  />
                );

              case 'promoBanner':
                return (
                  <PromoBannerSection 
                    key="promoBanner" 
                    onApplyCoupon={() => handleBuyNow(1)}
                  />
                );

              case 'productShowcase':
                return (
                  <section key="productShowcase" aria-label="Main Product Showcase" className="space-y-4">
                    {(storeSettings.productSectionTitle || storeSettings.productSectionSubtitle) && (
                      <div className="text-center max-w-xl mx-auto pt-2">
                        {storeSettings.productSectionTitle && (
                          <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
                            {storeSettings.productSectionTitle}
                          </h2>
                        )}
                        {storeSettings.productSectionSubtitle && (
                          <p className="text-xs sm:text-sm text-stone-600 mt-1">
                            {storeSettings.productSectionSubtitle}
                          </p>
                        )}
                      </div>
                    )}

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

                    <ProductCard
                      product={activeProduct}
                      onBuyNow={handleBuyNow}
                    />
                  </section>
                );

              case 'foodCompliance':
                return (
                  <section key="foodCompliance" aria-label="Food and Compliance Information">
                    <FoodComplianceSection />
                  </section>
                );

              case 'benefitsSection':
                return (
                  <section key="benefitsSection" aria-label="Product Benefits & Purity">
                    <ProductBenefits />
                  </section>
                );

              case 'faqSection':
                return (
                  <section key="faqSection" aria-label="Frequently Asked Questions">
                    <FaqSection />
                  </section>
                );

              case 'contactSection':
                return (
                  <section key="contactSection" aria-label="Customer Contact & Inquiries">
                    <ContactSection />
                  </section>
                );

              default:
                return null;
            }
          });
        })()}
      </main>

      {/* Store Footer */}
      {visibility.footer !== false && (
        <Footer
          onOpenPolicy={policy => setActivePolicy(policy)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
      )}

      {/* Floating WhatsApp Action Button */}
      {visibility.floatingWhatsApp !== false && (
        <FloatingWhatsApp />
      )}

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
        onTrackOrder={(orderNum, phone) => {
          setSuccessOrder(null);
          handleOpenTrackingWithQuery(orderNum, phone || '');
        }}
      />

      {/* Customer Order Tracking Modal */}
      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderId={trackingOrderId}
        initialPhone={trackingPhone}
        initialQuery={trackingQuery}
      />

      {/* Dedicated Admin Backend Dashboard (Access via /admin or /backend) */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
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
