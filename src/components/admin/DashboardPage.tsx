import React, { useState } from 'react';
import { 
  Order, 
  Product, 
  StoreSettings, 
  ReviewItem 
} from '../../types';
import { 
  ShoppingCart, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Users, 
  Star, 
  TrendingUp, 
  ArrowRight, 
  Search,
  ExternalLink,
  ShieldAlert,
  Ticket,
  Package,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download
} from 'lucide-react';
import { calculateReviewStats } from '../../utils/reviews';
import { AdminTab } from './AdminSidebar';
import { downloadStoreExecutiveReportPdf } from '../../utils/pdfGenerator';

interface DashboardPageProps {
  orders: Order[];
  products: Product[];
  storeSettings: StoreSettings;
  reviews: ReviewItem[];
  onNavigateTab: (tab: AdminTab, subTab?: string) => void;
  onOpenOrder: (order: Order) => void;
  activeSubTab?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  orders,
  products,
  storeSettings,
  reviews,
  onNavigateTab,
  onOpenOrder,
  activeSubTab,
}) => {
  React.useEffect(() => {
    if (activeSubTab === 'alerts') {
      const el = document.getElementById('dashboard-alerts-card');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubTab === 'overview') {
      const el = document.getElementById('dashboard-overview-top');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSubTab]);

  const [recentOrderSearch, setRecentOrderSearch] = useState('');

  // 1. Today calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 2. Metrics required
  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const pendingUpiOrders = orders.filter(o => o.paymentMethod === 'upi' && (o.paymentStatus === 'Pending' || o.paymentStatus === 'Verification Required'));
  const codPendingOrders = orders.filter(o => o.paymentMethod === 'cod' && o.paymentStatus !== 'COD Collected');
  const averageOrderValue = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;

  // Customers (unique phone count)
  const uniquePhones = new Set(orders.map(o => o.phone.trim().replace(/\D/g, '').slice(-10)));
  const totalCustomers = uniquePhones.size;

  // Reviews & Rating
  const approvedReviews = (reviews || []).filter(r => (r.status || 'approved') === 'approved');
  const pendingReviews = (reviews || []).filter(r => r.status === 'pending');
  const reviewStats = calculateReviewStats(approvedReviews);

  // 3. Needs Attention items
  const lowStockThreshold = 10;
  const lowStockProducts = products.filter(p => (p.stockCount !== undefined ? p.stockCount : 100) < (p.lowStockThreshold || lowStockThreshold));
  
  // Coupons expiring within 7 days or expired but active
  const todayDate = new Date();
  const nextWeekDate = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekStr = nextWeekDate.toISOString().slice(0, 10);
  const expiringCoupons = (storeSettings.coupons || []).filter(c => {
    if (!c.enabled || !c.expiryDate) return false;
    return c.expiryDate <= nextWeekStr;
  });

  // Products missing Food/FSSAI compliance
  const productsMissingFoodData = products.filter(p => {
    const fc = p.foodCompliance || storeSettings.foodCompliance;
    return !fc || !fc.ingredients || !fc.fssaiNumber || !fc.netQuantity;
  });

  // 4. Payment Split (UPI vs COD)
  const upiOrders = orders.filter(o => o.paymentMethod === 'upi');
  const upiSales = upiOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const codOrders = orders.filter(o => o.paymentMethod === 'cod');
  const codSales = codOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 5. Order Status Breakdown
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed');
  const shippedOrders = orders.filter(o => o.status === 'Shipped');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');

  // Filtered recent orders
  const filteredRecent = orders
    .filter(o => {
      if (!recentOrderSearch.trim()) return true;
      const q = recentOrderSearch.toLowerCase();
      return o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q);
    })
    .slice(0, 6);

  return (
    <div id="dashboard-overview-top" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-950 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-amber-300">
                Maknuts Command Deck
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-white">
              Store Control Center
            </h1>
            <p className="text-xs text-stone-300 max-w-xl">
              Live telemetry for sales, orders, payment verification, and customer satisfaction.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('orders_payments', 'orders')}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Orders ({pendingOrders.length} pending)</span>
            </button>

            <button
              type="button"
              onClick={() => downloadStoreExecutiveReportPdf(orders, products, storeSettings, storeSettings.coupons || [])}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download Executive PDF Dossier"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Executive Report PDF</span>
            </button>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* SECTION 1: 9 KEY ACTION METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Today's Orders */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Today Orders</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {todayOrders.length}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            ₹{todaySales.toLocaleString()} today
          </p>
        </div>

        {/* 2. Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Today Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
            ₹{todaySales.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Total sales: ₹{totalSales.toLocaleString()}
          </p>
        </div>

        {/* 3. Pending Orders */}
        <div 
          onClick={() => onNavigateTab('orders_payments', 'orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-800">Pending Orders</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
            {pendingOrders.length}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1 flex items-center gap-1">
            <span>Awaiting dispatch</span>
            <ArrowRight className="w-3 h-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* 4. Pending UPI Verification */}
        <div 
          onClick={() => onNavigateTab('orders_payments', 'upi_verification')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-purple-800">UPI Verification</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-900 font-mono">
            {pendingUpiOrders.length}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Needs UTR review
          </p>
        </div>

        {/* 5. COD Pending */}
        <div 
          onClick={() => onNavigateTab('orders_payments', 'cod')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">COD Pending</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {codPendingOrders.length}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            ₹{codSales.toLocaleString()} receivable
          </p>
        </div>

        {/* 6. Delivered Orders */}
        <div 
          onClick={() => onNavigateTab('orders_payments', 'orders')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Delivered Orders</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
            {deliveredOrders.length}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Successful dispatches
          </p>
        </div>

        {/* 7. Average Order Value */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Order Value</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            ₹{averageOrderValue}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Per transaction
          </p>
        </div>

        {/* 8. Total Customers */}
        <div 
          onClick={() => onNavigateTab('customers_reviews', 'customers')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {totalCustomers}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Verified phones
          </p>
        </div>

        {/* 9. Average Rating */}
        <div 
          onClick={() => onNavigateTab('customers_reviews', 'reviews')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-amber-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Rating</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono flex items-center gap-1.5">
            <span>{reviewStats.averageRating}</span>
            <span className="text-xs text-amber-500">★</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            {approvedReviews.length} approved reviews
          </p>
        </div>
      </div>

      {/* SECTION 2: “NEEDS ATTENTION” ACTION ALERTS */}
      <div id="dashboard-alerts-card" className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <h3 className="text-sm font-bold text-amber-950 font-serif">
              Needs Attention ({
                (pendingOrders.length > 0 ? 1 : 0) +
                (pendingUpiOrders.length > 0 ? 1 : 0) +
                (pendingReviews.length > 0 ? 1 : 0) +
                (lowStockProducts.length > 0 ? 1 : 0) +
                (expiringCoupons.length > 0 ? 1 : 0) +
                (productsMissingFoodData.length > 0 ? 1 : 0)
              })
            </h3>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
            Action items requiring merchant review
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Orders Awaiting Action */}
          {pendingOrders.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('orders_payments', 'orders')}
              className="bg-white p-3.5 rounded-2xl border border-amber-300 hover:border-amber-500 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                  <span>Orders Awaiting Dispatch</span>
                </span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-mono font-bold">
                  {pendingOrders.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                New customer orders ready for packaging & courier dispatch.
              </p>
              <span className="text-[10px] font-bold text-amber-700 group-hover:underline mt-2 inline-flex items-center gap-1">
                Open Orders Tab <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ) : null}

          {/* Payments Requiring Verification */}
          {pendingUpiOrders.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('orders_payments', 'upi_verification')}
              className="bg-white p-3.5 rounded-2xl border border-purple-300 hover:border-purple-500 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>UPI Verification Required</span>
                </span>
                <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md font-mono font-bold">
                  {pendingUpiOrders.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Customers submitted UPI payment awaiting UTR reconciliation.
              </p>
              <span className="text-[10px] font-bold text-purple-700 group-hover:underline mt-2 inline-flex items-center gap-1">
                Verify Payments <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ) : null}

          {/* Reviews Awaiting Approval */}
          {pendingReviews.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('customers_reviews', 'pending_reviews')}
              className="bg-white p-3.5 rounded-2xl border border-rose-300 hover:border-rose-500 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-rose-600" />
                  <span>Reviews Awaiting Approval</span>
                </span>
                <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md font-mono font-bold">
                  {pendingReviews.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                New customer feedback submitted awaiting moderation.
              </p>
              <span className="text-[10px] font-bold text-rose-700 group-hover:underline mt-2 inline-flex items-center gap-1">
                Moderate Reviews <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ) : null}

          {/* Low Stock Products */}
          {lowStockProducts.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('catalog', 'inventory')}
              className="bg-white p-3.5 rounded-2xl border border-amber-300 hover:border-amber-500 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Low-Stock Products</span>
                </span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-mono font-bold">
                  {lowStockProducts.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Product inventory running below safe threshold ({lowStockThreshold} units).
              </p>
              <span className="text-[10px] font-bold text-amber-700 group-hover:underline mt-2 inline-flex items-center gap-1">
                Update Inventory <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ) : null}

          {/* Coupons Expiring Soon */}
          {expiringCoupons.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('pricing_promotions', 'coupons')}
              className="bg-white p-3.5 rounded-2xl border border-stone-300 hover:border-emerald-500 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-emerald-700" />
                  <span>Coupons Expiring Soon</span>
                </span>
                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-mono font-bold">
                  {expiringCoupons.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Active discount coupons expiring within the next 7 days.
              </p>
              <span className="text-[10px] font-bold text-emerald-800 group-hover:underline mt-2 inline-flex items-center gap-1">
                Review Coupons <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ) : null}

          {/* Products Missing Food/FSSAI Data */}
          {productsMissingFoodData.length > 0 ? (
            <div 
              onClick={() => onNavigateTab('catalog', 'food_fssai')}
              className="bg-white p-3.5 rounded-2xl border border-blue-300 hover:border-blue-500 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span>Missing Food/FSSAI Info</span>
                </span>
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-mono font-bold">
                  {productsMissingFoodData.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Products lacking mandatory ingredients, net weight, or FSSAI registration.
              </p>
              <span className="text-[10px] font-bold text-blue-700 group-hover:underline mt-2 inline-flex items-center gap-1">
                Complete Compliance <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ) : null}

          {/* All Good state if no items need attention */}
          {pendingOrders.length === 0 &&
           pendingUpiOrders.length === 0 &&
           pendingReviews.length === 0 &&
           lowStockProducts.length === 0 &&
           expiringCoupons.length === 0 &&
           productsMissingFoodData.length === 0 && (
            <div className="col-span-full bg-white p-4 rounded-2xl border border-emerald-200 text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-emerald-950">Everything is in order!</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-0.5">
                No orders are awaiting dispatch, all payments are reconciled, and catalog compliance is up to date.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: RECENT ORDERS & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">Recent Orders</h3>
              <p className="text-xs text-stone-500">Showing latest customer checkout transactions</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter order #..."
                  value={recentOrderSearch}
                  onChange={e => setRecentOrderSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs w-36 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('orders_payments', 'orders')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({orders.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {filteredRecent.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              No orders found matching filter.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 text-stone-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRecent.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-stone-900 truncate max-w-[120px]">{order.customerName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{order.phone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          order.paymentMethod === 'upi' ? 'bg-purple-100 text-purple-800' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {order.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">
                        ₹{order.totalAmount}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Confirmed' ? 'bg-amber-100 text-amber-900' :
                          order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                          'bg-stone-200 text-stone-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateTab('orders_payments', 'orders');
                            onOpenOrder(order);
                          }}
                          className="px-2 py-1 rounded bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 font-bold text-[11px] cursor-pointer transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar Breakdowns (1 Col) */}
        <div className="space-y-4">
          {/* Payment Split */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Payment Breakdown</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span>UPI Payment</span>
                </span>
                <span className="font-mono font-bold text-stone-900">
                  ₹{upiSales.toLocaleString()} ({upiOrders.length})
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-purple-600 h-full" 
                  style={{ width: `${orders.length > 0 ? (upiOrders.length / orders.length) * 100 : 50}%` }} 
                />
                <div 
                  className="bg-stone-400 h-full" 
                  style={{ width: `${orders.length > 0 ? (codOrders.length / orders.length) * 100 : 50}%` }} 
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-500" />
                  <span>Cash on Delivery</span>
                </span>
                <span className="font-mono font-bold text-stone-900">
                  ₹{codSales.toLocaleString()} ({codOrders.length})
                </span>
              </div>
            </div>
          </div>

          {/* Order Status Summary */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Order Status Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold block uppercase">Pending</span>
                <span className="text-base font-black text-amber-900 font-mono">{pendingOrders.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-800 font-bold block uppercase">Confirmed/Shipped</span>
                <span className="text-base font-black text-blue-900 font-mono">{confirmedOrders.length + shippedOrders.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">Delivered</span>
                <span className="text-base font-black text-emerald-900 font-mono">{deliveredOrders.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-800 font-bold block uppercase">Cancelled</span>
                <span className="text-base font-black text-rose-900 font-mono">{cancelledOrders.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
