import React, { useState, useMemo } from 'react';
import { Order, Product, Coupon, ReviewItem, StoreSettings } from '../../types';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  IndianRupee, 
  ShoppingCart, 
  TrendingUp, 
  Ticket, 
  Star, 
  Users, 
  Package,
  CheckCircle2,
  Filter,
  FileText
} from 'lucide-react';
import { calculateReviewStats } from '../../utils/reviews';
import { downloadStoreExecutiveReportPdf, downloadOrdersReportPdf } from '../../utils/pdfGenerator';

interface AdminReportsTabProps {
  orders: Order[];
  products: Product[];
  coupons: Coupon[];
  reviews: ReviewItem[];
  storeSettings?: StoreSettings;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  orders,
  products,
  coupons,
  reviews,
  storeSettings,
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d' | 'today'>('all');

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    if (timeRange === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      return orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
    }
    if (timeRange === '7d') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter(o => o.createdAt && new Date(o.createdAt) >= cutoff);
    }
    if (timeRange === '30d') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orders.filter(o => o.createdAt && new Date(o.createdAt) >= cutoff);
    }
    return orders;
  }, [orders, timeRange]);

  // Aggregate Key Metrics
  const grossSales = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalBase = filteredOrders.reduce((sum, o) => sum + (o.baseAmount || (o.unitPrice * o.quantity)), 0);
  const totalDiscounts = filteredOrders.reduce((sum, o) => sum + (o.discountAmount || 0) + (o.couponDiscount || 0), 0);
  const totalDeliveryCharges = filteredOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
  const totalItemsSold = filteredOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const avgOrderValue = filteredOrders.length > 0 ? Math.round(grossSales / filteredOrders.length) : 0;

  // Payments breakdown
  const upiOrders = filteredOrders.filter(o => o.paymentMethod === 'upi');
  const upiSales = upiOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const codOrders = filteredOrders.filter(o => o.paymentMethod === 'cod');
  const codSales = codOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Status breakdown
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled');
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending');

  // Product sales breakdown
  const productSalesMap = useMemo(() => {
    const map = new Map<string, { name: string; units: number; revenue: number }>();
    for (const o of filteredOrders) {
      const name = o.productName || 'Maknuts Makhana';
      const existing = map.get(name) || { name, units: 0, revenue: 0 };
      existing.units += (o.quantity || 1);
      existing.revenue += (o.totalAmount || 0);
      map.set(name, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Coupon usage breakdown
  const couponUsageMap = useMemo(() => {
    const map = new Map<string, { code: string; count: number; totalDiscount: number }>();
    for (const o of filteredOrders) {
      if (o.couponCode) {
        const code = o.couponCode.toUpperCase();
        const existing = map.get(code) || { code, count: 0, totalDiscount: 0 };
        existing.count += 1;
        existing.totalDiscount += (o.couponDiscount || 0);
        map.set(code, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Reviews Stats
  const approvedReviews = (reviews || []).filter(r => (r.status || 'approved') === 'approved');
  const reviewStats = calculateReviewStats(approvedReviews);

  // Export full detailed Orders CSV
  const handleExportOrdersCsv = () => {
    if (orders.length === 0) return;
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Phone',
      'Address',
      'PIN',
      'Product',
      'Quantity',
      'Unit Price',
      'Base Amount',
      'Discount',
      'Coupon Code',
      'Coupon Discount',
      'Delivery Charge',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Courier AWB',
      'Courier Name'
    ];

    const rows = orders.map(o => [
      `"${o.orderNumber}"`,
      `"${o.createdAt || ''}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.phone}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${o.pincode}"`,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      o.quantity,
      o.unitPrice,
      o.baseAmount || (o.unitPrice * o.quantity),
      o.discountAmount || 0,
      `"${o.couponCode || ''}"`,
      o.couponDiscount || 0,
      o.deliveryCharge || 0,
      o.totalAmount,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus || 'Pending'}"`,
      `"${o.status}"`,
      `"${o.courierTrackingNumber || ''}"`,
      `"${o.courierName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maknuts_orders_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-800" />
            <span>Store Reports & Business Intelligence</span>
          </h2>
          <p className="text-xs text-stone-500">
            Comprehensive sales, payments, coupons, and fulfillment metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setTimeRange(r.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  timeRange === r.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (storeSettings) {
                downloadStoreExecutiveReportPdf(orders, products, storeSettings, coupons);
              }
            }}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-amber-300 border border-emerald-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            title="Download Comprehensive Executive Store Audit Report PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Executive Audit PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (storeSettings) {
                downloadOrdersReportPdf(filteredOrders, storeSettings, `Orders Report (${timeRange.toUpperCase()})`);
              }
            }}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download Detailed Orders Report PDF"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-800" />
            <span>Orders PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportOrdersCsv}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export CSV spreadsheet format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Gross Sales</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-1">
            ₹{grossSales.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">In selected period</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Orders</span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1">
            {filteredOrders.length}
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">
            {deliveredOrders.length} fulfilled successfully
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Avg Order Value (AOV)</span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1">
            ₹{avgOrderValue}
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Per customer order</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Units Dispatched</span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1">
            {totalItemsSold} packs
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Phool Makhana packs</span>
        </div>
      </div>

      {/* Sales Channels & Payment Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Split */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            Payment Method Breakdown
          </h3>

          <div className="space-y-2">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-emerald-950 block">UPI Direct Transfers</span>
                <span className="text-[10px] text-stone-500">{upiOrders.length} transactions</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-900 text-sm">₹{upiSales.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block font-mono">
                  {grossSales > 0 ? Math.round((upiSales / grossSales) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-stone-900 block">Cash on Delivery (COD)</span>
                <span className="text-[10px] text-stone-500">{codOrders.length} transactions</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-stone-900 text-sm">₹{codSales.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block font-mono">
                  {grossSales > 0 ? Math.round((codSales / grossSales) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Deductions & Shipping */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            Financial Ledger Summary
          </h3>

          <div className="divide-y divide-stone-100 text-xs">
            <div className="py-2 flex justify-between">
              <span className="text-stone-600">Base Catalog Total</span>
              <span className="font-mono font-bold text-stone-900">₹{totalBase.toLocaleString()}</span>
            </div>
            <div className="py-2 flex justify-between text-rose-700">
              <span>Discounts & Coupons Given</span>
              <span className="font-mono font-bold">-₹{totalDiscounts.toLocaleString()}</span>
            </div>
            <div className="py-2 flex justify-between text-stone-600">
              <span>Delivery Fees Collected</span>
              <span className="font-mono font-bold">+₹{totalDeliveryCharges.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between text-sm font-black text-emerald-950 border-t-2 border-stone-200">
              <span>Net Invoiced Revenue</span>
              <span className="font-mono">₹{grossSales.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Sales & Coupon Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Sales */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 font-serif font-bold text-sm text-stone-900">
            Top Selling Products
          </div>
          {productSalesMap.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">No product sales in this period.</div>
          ) : (
            <div className="divide-y divide-stone-100 text-xs">
              {productSalesMap.map((prod, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 block">{prod.name}</span>
                    <span className="text-[10px] text-stone-500">{prod.units} units ordered</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-950 text-sm">
                    ₹{prod.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coupon Performance */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 font-serif font-bold text-sm text-stone-900">
            Coupon Redemption Performance
          </div>
          {couponUsageMap.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">No coupons applied in this period.</div>
          ) : (
            <div className="divide-y divide-stone-100 text-xs">
              {couponUsageMap.map((c, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-xs">
                      {c.code}
                    </span>
                    <span className="text-[10px] text-stone-500">{c.count} redemptions</span>
                  </div>
                  <span className="font-mono font-bold text-rose-700 text-xs">
                    -₹{c.totalDiscount.toLocaleString()} saved
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
