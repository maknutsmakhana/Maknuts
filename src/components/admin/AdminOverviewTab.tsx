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
  Package, 
  Ticket, 
  Star, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowRight, 
  ExternalLink,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  X,
  ShieldCheck
} from 'lucide-react';
import { calculateReviewStats } from '../../utils/reviews';
import { AdminTab } from './AdminSidebar';
import { 
  downloadStoreExecutiveReportPdf,
  downloadOrderInvoicePdf,
  downloadOrdersReportPdf,
  downloadFoodCompliancePdf,
  downloadProductsCatalogPdf,
  downloadCustomersReportPdf,
  downloadCouponsReportPdf
} from '../../utils/pdfGenerator';

interface AdminOverviewTabProps {
  orders: Order[];
  products: Product[];
  storeSettings: StoreSettings;
  reviews: ReviewItem[];
  onNavigateTab: (tab: AdminTab) => void;
  onOpenOrder: (order: Order) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  orders,
  products,
  storeSettings,
  reviews,
  onNavigateTab,
  onOpenOrder,
}) => {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  // Today's Date Calculation (IST or local)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Overall Metrics
  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid / Verified');
  const pendingPayments = orders.filter(o => o.paymentStatus === 'Pending' || o.paymentStatus === 'Verification Required');
  const codOrders = orders.filter(o => o.paymentMethod === 'cod');
  const totalCodSales = codOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const averageOrderValue = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;
  
  // Total Unique Customers (by phone)
  const uniquePhones = new Set(orders.map(o => o.phone.trim().replace(/\s+/g, '')));
  const totalCustomers = uniquePhones.size;

  // Product Stock Sum
  const totalStock = products.reduce((sum, p) => sum + (p.stockCount !== undefined ? p.stockCount : 100), 0);
  const lowStockProducts = products.filter(p => (p.stockCount !== undefined ? p.stockCount : 100) < 10);

  // Active Coupons
  const activeCoupons = (storeSettings.coupons || []).filter(c => c.enabled);

  // Average Rating
  const approvedReviews = (reviews || []).filter(r => (r.status || 'approved') === 'approved');
  const reviewStats = calculateReviewStats(approvedReviews);

  // Recent 6 Orders
  const recentOrders = [...orders].slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
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
            <p className="text-xs text-stone-200 max-w-xl">
              Live telemetry for orders, inventory, promotions, and customer satisfaction.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Orders ({pendingOrders.length} pending)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products ({products.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('coupons')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Coupons ({activeCoupons.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-950/90 hover:bg-black text-amber-300 rounded-xl text-xs font-bold border border-amber-300/40 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              title="Download Any Store Document or Audit Dossier in Beautiful PDF"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download PDF Hub</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today Orders */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today Orders</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {todayOrders.length}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            ₹{todaySales.toLocaleString()} today sales
          </p>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            ₹{totalSales.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Across {orders.length} total orders
          </p>
        </div>

        {/* Pending Orders */}
        <div 
          onClick={() => onNavigateTab('orders')}
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
            <span>Needs dispatch</span>
            <ArrowRight className="w-3 h-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Average Order Value */}
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

        {/* Paid vs Pending Payments */}
        <div 
          onClick={() => onNavigateTab('payments')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-800">Payments Status</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
            {paidOrders.length} Paid
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            {pendingPayments.length} Pending verification
          </p>
        </div>

        {/* COD Orders */}
        <div 
          onClick={() => onNavigateTab('payments')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">COD Orders</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {codOrders.length}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            ₹{totalCodSales.toLocaleString()} receivable
          </p>
        </div>

        {/* Total Customers */}
        <div 
          onClick={() => onNavigateTab('customers')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {totalCustomers}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Unique phone numbers
          </p>
        </div>

        {/* Product Stock */}
        <div 
          onClick={() => onNavigateTab('products')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Product Stock</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {totalStock} units
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            {lowStockProducts.length > 0 ? (
              <span className="text-rose-600 font-bold">{lowStockProducts.length} low stock alert</span>
            ) : (
              'All products well-stocked'
            )}
          </p>
        </div>

        {/* Active Coupons */}
        <div 
          onClick={() => onNavigateTab('coupons')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Coupons</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
            {activeCoupons.length}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            {(storeSettings.coupons || []).length} total created
          </p>
        </div>

        {/* Average Rating */}
        <div 
          onClick={() => onNavigateTab('reviews')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-amber-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rating & Feedback</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {reviewStats.hasReviews ? `★ ${reviewStats.averageRating.toFixed(1)}` : 'No reviews'}
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            {approvedReviews.length} approved reviews
          </p>
        </div>
      </div>

      {/* Recent Orders Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
              Recent Orders
            </h3>
            <p className="text-xs text-stone-500">
              Showing latest {recentOrders.length} customer purchases
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            No orders placed yet. As customers order, they will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Payment</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentOrders.map(order => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                    onClick={() => onOpenOrder(order)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{order.customerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{order.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-800 truncate max-w-[140px]">
                        {order.productName}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Qty: {order.quantity} · {order.productWeight}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      ₹{order.totalAmount}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'Paid / Verified' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : order.paymentMethod === 'cod'
                          ? 'bg-stone-100 text-stone-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {order.paymentMethod.toUpperCase()} · {order.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Delivered' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : order.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadOrderInvoicePdf(order, storeSettings);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Download Tax Invoice PDF"
                        >
                          <Download className="w-3 h-3 text-amber-700" />
                          <span className="hidden sm:inline">Invoice</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOrder(order);
                          }}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF HUB MODAL */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-950 text-white flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
                  <Download className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-serif text-white">
                    Store PDF Document Hub
                  </h3>
                  <p className="text-xs text-stone-300">
                    Download beautifully branded official PDF documents on demand.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-stone-600">
                Select any required report to immediately generate and download as a formatted A4 vector PDF:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Executive Audit Report */}
                <button
                  type="button"
                  onClick={() => {
                    downloadStoreExecutiveReportPdf(orders, products, storeSettings, storeSettings.coupons || []);
                    setIsPdfModalOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-950">
                      Store Executive Audit PDF
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      KPIs, sales revenue, payment split, inventory status & coupons.
                    </p>
                  </div>
                </button>

                {/* 2. All Orders Detailed Report */}
                <button
                  type="button"
                  onClick={() => {
                    downloadOrdersReportPdf(orders, storeSettings, 'All Orders Detailed Audit Dossier');
                    setIsPdfModalOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </span>
                    <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-950">
                      Detailed Orders Log PDF
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Complete transaction register ({orders.length} orders) with AWB tracking & totals.
                    </p>
                  </div>
                </button>

                {/* 3. Product Catalog */}
                <button
                  type="button"
                  onClick={() => {
                    downloadProductsCatalogPdf(products, storeSettings);
                    setIsPdfModalOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </span>
                    <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-950">
                      Product Catalog & Stock PDF
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Official product list ({products.length} SKUs), MRP, weights, and availability.
                    </p>
                  </div>
                </button>

                {/* 4. Customer Directory */}
                <button
                  type="button"
                  onClick={() => {
                    downloadCustomersReportPdf(orders, storeSettings);
                    setIsPdfModalOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </span>
                    <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-950">
                      Customer CRM Directory PDF
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Buyer profiles, phone contacts, lifetime spends & delivery destinations.
                    </p>
                  </div>
                </button>

                {/* 5. Coupons Registry */}
                <button
                  type="button"
                  onClick={() => {
                    downloadCouponsReportPdf(storeSettings.coupons || [], storeSettings);
                    setIsPdfModalOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </span>
                    <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-950">
                      Coupons & Promo Policies PDF
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Active and disabled promo codes, usage caps, and validity limits.
                    </p>
                  </div>
                </button>

                {/* 6. Food Safety & FSSAI Compliance */}
                <button
                  type="button"
                  onClick={() => {
                    downloadFoodCompliancePdf(storeSettings, products);
                    setIsPdfModalOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-950">
                      Food & FSSAI Compliance PDF
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      FSSAI license, nutritional facts panel, statutory labels & claims.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
