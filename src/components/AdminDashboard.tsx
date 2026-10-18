import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, StoreSettings, Order, ReviewItem, PaymentStatus } from '../types';
import { 
  X, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink, 
  Menu, 
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { AdminSidebar, AdminTab, AdminPrimaryTab } from './admin/AdminSidebar';
import { DashboardPage } from './admin/DashboardPage';
import { AdminStorefrontTab } from './admin/AdminStorefrontTab';
import { CatalogPage } from './admin/CatalogPage';
import { PricingPromotionsPage } from './admin/PricingPromotionsPage';
import { OrdersPaymentsPage } from './admin/OrdersPaymentsPage';
import { CustomersReviewsPage } from './admin/CustomersReviewsPage';
import { MarketingPage } from './admin/MarketingPage';
import { CompliancePage } from './admin/CompliancePage';
import { AdminReportsTab } from './admin/AdminReportsTab';
import { SystemPage } from './admin/SystemPage';
import maknutsLogo from '../assets/images/regenerated_image_1791357700332.png';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { 
    products, 
    activeProduct,
    setActiveProductId,
    storeSettings, 
    orders, 
    reviews,
    approveReview,
    rejectReview,
    deleteReview,
    updateReviewText,
    updateStoreReply,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateSettings, 
    updateOrderStatus, 
    updatePaymentStatus,
    updateOrder,
    deleteOrder, 
    clearAllOrders, 
    archiveAllOrders,
    resetToDefaults, 
    exportData, 
    importData,
    adminUser,
    isAuthLoading,
    adminLogin,
    adminResetPassword,
    adminLogout
  } = useStore();

  // Authentication State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Authenticated state
  const isAuthenticated = Boolean(adminUser);

  // Navigation State
  const [activePrimaryTab, setActivePrimaryTab] = useState<AdminPrimaryTab>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Helper to resolve any legacy or direct tab navigation
  const handleNavigate = (tab: AdminTab, subTab?: string) => {
    switch (tab) {
      case 'dashboard':
      case 'overview':
        setActivePrimaryTab('dashboard');
        setActiveSubTab(subTab || 'overview');
        break;
      case 'storefront':
      case 'faq':
        setActivePrimaryTab('storefront');
        setActiveSubTab(subTab || (tab === 'faq' ? 'faq' : 'homepage'));
        break;
      case 'catalog':
      case 'products':
      case 'inventory':
      case 'media':
        setActivePrimaryTab('catalog');
        setActiveSubTab(subTab || (tab === 'catalog' ? 'products' : tab));
        break;
      case 'pricing_promotions':
      case 'pricing':
      case 'coupons':
        setActivePrimaryTab('pricing_promotions');
        setActiveSubTab(subTab || (tab === 'pricing_promotions' ? 'pricing' : tab));
        break;
      case 'orders_payments':
      case 'orders':
      case 'payments':
      case 'order_controls':
      case 'upi_verification':
      case 'cod':
      case 'shipping_tracking':
      case 'invoices':
        setActivePrimaryTab('orders_payments');
        setActiveSubTab(subTab || (tab === 'orders_payments' ? 'orders' : tab));
        break;
      case 'customers_reviews':
      case 'customers':
      case 'reviews':
        setActivePrimaryTab('customers_reviews');
        setActiveSubTab(subTab || (tab === 'customers_reviews' ? 'customers' : tab));
        break;
      case 'marketing':
      case 'whatsapp':
      case 'seo':
        setActivePrimaryTab('marketing');
        setActiveSubTab(subTab || (tab === 'marketing' ? 'whatsapp' : tab));
        break;
      case 'compliance':
      case 'food_compliance':
      case 'policies':
        setActivePrimaryTab('compliance');
        setActiveSubTab(subTab || (tab === 'policies' ? 'policies' : 'business_fssai'));
        break;
      case 'reports':
        setActivePrimaryTab('reports');
        setActiveSubTab(subTab || 'analytics');
        break;
      case 'system':
      case 'settings':
        setActivePrimaryTab('system');
        setActiveSubTab(subTab || 'account');
        break;
      default:
        setActivePrimaryTab('dashboard');
        setActiveSubTab('overview');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!emailInput.trim()) {
      setAuthError('Please enter the admin email address.');
      return;
    }
    if (!passwordInput) {
      setAuthError('Please enter the admin password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await adminLogin(emailInput.trim(), passwordInput);
      setPasswordInput('');
      setAuthError('');
    } catch (err: any) {
      console.error('Admin login error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setAuthError('Incorrect email or password. Please verify credentials.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Access temporarily locked due to repeated attempts. Please try again later.');
      } else {
        setAuthError('Authentication failed. Please check network connection.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailInput.trim()) {
      setAuthError('Please enter your email above to receive a reset link.');
      return;
    }
    try {
      await adminResetPassword(emailInput.trim());
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (e) {
      setAuthError('Could not send reset email. Ensure the email is registered.');
    }
  };

  // Keyboard shortcut: ESC to exit or close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMobileSidebarOpen]);

  if (!isOpen) return null;

  // Breadcrumb title map
  const getBreadcrumbLabel = (tab: AdminPrimaryTab): string => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'storefront': return 'Storefront';
      case 'catalog': return 'Catalog';
      case 'pricing_promotions': return 'Pricing & Promotions';
      case 'orders_payments': return 'Orders & Payments';
      case 'customers_reviews': return 'Customers & Reviews';
      case 'marketing': return 'Marketing';
      case 'compliance': return 'Compliance';
      case 'reports': return 'Reports & Analytics';
      case 'system': return 'System Settings';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F1EA] text-stone-900 flex flex-col font-sans overflow-hidden">
      {/* 1. AUTHENTICATION GATE */}
      {!isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl space-y-5 animate-in fade-in duration-200">
            {/* Header / Logo */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-950 border border-emerald-700/50 p-1 mx-auto shadow-md">
                <img 
                  src={maknutsLogo} 
                  alt="Maknuts" 
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
                  Maknuts Admin Portal
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Private Control Center for Store Operations
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Operator Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. maknutsmakhana@gmail.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/30 transition-all"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-emerald-800 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.getModifierState && e.getModifierState('CapsLock')) {
                        setCapsLockActive(true);
                      } else {
                        setCapsLockActive(false);
                      }
                    }}
                    onKeyUp={e => {
                      if (e.getModifierState && e.getModifierState('CapsLock')) {
                        setCapsLockActive(true);
                      } else {
                        setCapsLockActive(false);
                      }
                    }}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/30 transition-all"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {capsLockActive && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Caps Lock is ON.</span>
                  </p>
                )}

                {resetSent && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Password reset email dispatched to {emailInput}.</span>
                  </p>
                )}
              </div>

              {authError && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </form>

            {/* Return to Public Storefront */}
            <div className="pt-2 text-center border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-stone-500 hover:text-emerald-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>Return to Public Storefront</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. AUTHENTICATED ADMIN CONSOLE */
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Desktop Sidebar */}
          <div className="hidden md:block h-full shrink-0">
            <AdminSidebar
              activeTab={activePrimaryTab}
              activeSubTab={activeSubTab}
              onSelectTab={handleNavigate}
              pendingOrdersCount={orders.filter(o => o.status === 'Pending').length}
              pendingReviewsCount={(reviews || []).filter(r => r.status === 'pending').length}
              activeCouponsCount={(storeSettings.coupons || []).filter(c => c.enabled).length}
              productsCount={products.length}
              adminEmail={adminUser?.email || 'maknutsmakhana@gmail.com'}
              onLogout={async () => {
                await adminLogout();
              }}
              onClose={onClose}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div 
                className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div className="relative z-10 w-72 max-w-[85%] h-full bg-[#181C14] shadow-2xl">
                <AdminSidebar
                  activeTab={activePrimaryTab}
                  activeSubTab={activeSubTab}
                  onSelectTab={handleNavigate}
                  pendingOrdersCount={orders.filter(o => o.status === 'Pending').length}
                  pendingReviewsCount={(reviews || []).filter(r => r.status === 'pending').length}
                  activeCouponsCount={(storeSettings.coupons || []).filter(c => c.enabled).length}
                  productsCount={products.length}
                  adminEmail={adminUser?.email || 'maknutsmakhana@gmail.com'}
                  onLogout={async () => {
                    await adminLogout();
                  }}
                  onClose={onClose}
                  isMobileOpen={isMobileSidebarOpen}
                  setIsMobileOpen={setIsMobileSidebarOpen}
                />
              </div>
            </div>
          )}

          {/* Main Dashboard Canvas */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {/* Top Navigation & Breadcrumbs Bar */}
            <header className="h-14 bg-white border-b border-stone-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-1.5 -ml-1 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 md:hidden cursor-pointer"
                  title="Toggle Mobile Navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Breadcrumb Trail */}
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <span className="text-stone-400 hidden sm:inline">Maknuts</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 hidden sm:inline" />
                  <span className="font-bold text-stone-900">
                    {getBreadcrumbLabel(activePrimaryTab)}
                  </span>
                  {activeSubTab && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                      <span className="text-emerald-800 font-semibold capitalize">
                        {activeSubTab.replace('_', ' ')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="View Live Public Customer Store"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">View Public Store</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await adminLogout();
                  }}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Log out of Admin Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Scrollable Viewport */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
              {/* 1. DASHBOARD */}
              {activePrimaryTab === 'dashboard' && (
                <DashboardPage
                  orders={orders}
                  products={products}
                  storeSettings={storeSettings}
                  reviews={reviews}
                  onNavigateTab={handleNavigate}
                  onOpenOrder={(order) => {
                    setSelectedOrderForModal(order);
                    handleNavigate('orders_payments', 'orders');
                  }}
                  activeSubTab={activeSubTab}
                />
              )}

              {/* 2. STOREFRONT (Homepage, Sections Reordering, Branding, FAQ, Contact/Footer) */}
              {activePrimaryTab === 'storefront' && (
                <AdminStorefrontTab
                  settings={storeSettings}
                  initialSection={activeSubTab}
                  onSaveSettings={async (updated) => {
                    await updateSettings(updated);
                  }}
                  onPreviewStorefront={onClose}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 3. CATALOG (Products, Inventory, Media, Product Food/FSSAI) */}
              {activePrimaryTab === 'catalog' && (
                <CatalogPage
                  products={products}
                  activeProduct={activeProduct}
                  setActiveProductId={setActiveProductId}
                  storeSettings={storeSettings}
                  onAddProduct={addProduct}
                  onUpdateProduct={updateProduct}
                  onDeleteProduct={deleteProduct}
                  initialSubTab={activeSubTab}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 4. PRICING & PROMOTIONS (Pricing, Discounts, Delivery, Coupons, Scheduled Offers) */}
              {activePrimaryTab === 'pricing_promotions' && (
                <PricingPromotionsPage
                  settings={storeSettings}
                  products={products}
                  orders={orders}
                  onSaveSettings={updateSettings}
                  onUpdateProduct={updateProduct}
                  onOpenOrder={(order) => {
                    setSelectedOrderForModal(order);
                    handleNavigate('orders_payments', 'orders');
                  }}
                  initialSubTab={activeSubTab}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 5. ORDERS & PAYMENTS (Orders, Payments, UPI Verification, COD, Shipping/AWB, Invoices, Archive) */}
              {activePrimaryTab === 'orders_payments' && (
                <OrdersPaymentsPage
                  orders={orders}
                  storeSettings={storeSettings}
                  onUpdateOrderStatus={updateOrderStatus}
                  onUpdatePaymentStatus={updatePaymentStatus}
                  onUpdateOrder={updateOrder}
                  onDeleteOrder={deleteOrder}
                  onArchiveAllOrders={archiveAllOrders}
                  onClearAllOrders={clearAllOrders}
                  onSaveSettings={updateSettings}
                  initialTab={activeSubTab}
                  initialSelectedOrder={selectedOrderForModal}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 6. CUSTOMERS & REVIEWS (Customer Directory, All Reviews, Pending Reviews) */}
              {activePrimaryTab === 'customers_reviews' && (
                <CustomersReviewsPage
                  orders={orders}
                  reviews={reviews}
                  storeSettings={storeSettings}
                  onApproveReview={approveReview}
                  onRejectReview={rejectReview}
                  onDeleteReview={deleteReview}
                  onUpdateReviewText={updateReviewText}
                  onUpdateStoreReply={updateStoreReply}
                  initialSubTab={activeSubTab}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 7. MARKETING (WhatsApp, SEO & Meta, Social Sharing, Structured Data) */}
              {activePrimaryTab === 'marketing' && (
                <MarketingPage
                  settings={storeSettings}
                  products={products}
                  onSaveSettings={updateSettings}
                  initialSubTab={activeSubTab}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 8. COMPLIANCE (Business / FSSAI, Policies, Legal Packaging Norms) */}
              {activePrimaryTab === 'compliance' && (
                <CompliancePage
                  settings={storeSettings}
                  onSaveSettings={updateSettings}
                  initialSubTab={activeSubTab}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 9. REPORTS (Analytics & PDF Dossiers) */}
              {activePrimaryTab === 'reports' && (
                <AdminReportsTab
                  orders={orders}
                  products={products}
                  coupons={storeSettings.coupons || []}
                  reviews={reviews}
                  storeSettings={storeSettings}
                  initialSubTab={activeSubTab}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}

              {/* 10. SYSTEM (Admin Profile, Firebase Telemetry, App Info, Backup & Export, Security) */}
              {activePrimaryTab === 'system' && (
                <SystemPage
                  adminUser={adminUser}
                  onLogout={async () => {
                    await adminLogout();
                  }}
                  onResetPassword={adminResetPassword}
                  onExportData={exportData}
                  onImportData={importData}
                  onResetDefaults={resetToDefaults}
                  initialSubTab={activeSubTab}
                  onSubTabChange={(sub: string) => setActiveSubTab(sub)}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};
