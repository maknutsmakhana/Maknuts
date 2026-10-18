import React, { useState } from 'react';
import { 
  Order, 
  PaymentStatus, 
  StoreSettings 
} from '../../types';
import { 
  ShoppingCart, 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Download, 
  Archive, 
  Trash2, 
  AlertTriangle, 
  ExternalLink, 
  MessageCircle, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  FileText, 
  X,
  Phone,
  Calendar,
  AlertCircle,
  Eye,
  IndianRupee,
  Sparkles
} from 'lucide-react';
import { downloadOrderInvoicePdf, downloadOrdersReportPdf } from '../../utils/pdfGenerator';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { OrderDisplayControlsTab } from './OrderDisplayControlsTab';

interface OrdersPaymentsPageProps {
  orders: Order[];
  storeSettings: StoreSettings;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => Promise<void>;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onArchiveAllOrders: () => Promise<number>;
  onClearAllOrders: () => Promise<void>;
  onSaveSettings?: (updated: Partial<StoreSettings>) => Promise<void>;
  initialTab?: string;
  initialSelectedOrder?: Order | null;
  onSubTabChange?: (tab: string) => void;
}

export const OrdersPaymentsPage: React.FC<OrdersPaymentsPageProps> = ({
  orders,
  storeSettings,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onUpdateOrder,
  onDeleteOrder,
  onArchiveAllOrders,
  onClearAllOrders,
  onSaveSettings,
  initialTab = 'all',
  initialSelectedOrder = null,
  onSubTabChange,
}) => {
  const mapInitialTab = (tab?: string) => {
    if (!tab) return 'all';
    if (tab === 'orders') return 'all';
    if (tab === 'payments') return 'upi_verification';
    if (tab === 'order_controls' || tab === 'checkout_controls') return 'order_controls';
    return tab;
  };

  const [activeTab, setActiveTab] = useState<
    'all' | 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'upi_verification' | 'cod' | 'refunds' | 'shipping_tracking' | 'invoices' | 'order_controls' | 'archive'
  >((mapInitialTab(initialTab) as any) || 'all');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(mapInitialTab(initialTab) as any);
    }
  }, [initialTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    onSubTabChange?.(tabId);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(initialSelectedOrder);
  const [unlockedFinancialsOrderIds, setUnlockedFinancialsOrderIds] = useState<Set<string>>(new Set());

  // Archive & Safety Modal
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeType, setPurgeType] = useState<'archive' | 'permanent'>('archive');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Financial summary
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid / Verified' || o.paymentStatus === 'COD Collected');
  const totalVerifiedRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingUpiOrders = orders.filter(o => o.paymentMethod === 'upi' && (o.paymentStatus === 'Pending' || o.paymentStatus === 'Verification Required'));
  const pendingCodOrders = orders.filter(o => o.paymentMethod === 'cod' && o.paymentStatus !== 'COD Collected');
  const totalCodReceivable = pendingCodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter(order => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = 
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.includes(q) ||
        (order.upiRefNumber && order.upiRefNumber.toLowerCase().includes(q)) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
        (order.courierName && order.courierName.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Tab filter
    switch (activeTab) {
      case 'all':
        return true;
      case 'Pending':
      case 'Confirmed':
      case 'Shipped':
      case 'Delivered':
      case 'Cancelled':
        return order.status === activeTab;
      case 'upi_verification':
        return order.paymentMethod === 'upi' && (order.paymentStatus === 'Verification Required' || (order.paymentStatus === 'Pending' && order.upiRefNumber));
      case 'cod':
        return order.paymentMethod === 'cod';
      case 'refunds':
        return order.paymentStatus === 'Refunded' || order.status === 'Cancelled';
      case 'shipping_tracking':
        return order.status === 'Shipped' || order.status === 'Confirmed' || Boolean(order.trackingNumber);
      case 'invoices':
        return true;
      case 'archive':
        return false; // Handled in dedicated sub-view
      default:
        return true;
    }
  });

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleWhatsAppCustomer = (order: Order) => {
    const text = `Hello ${order.customerName}! This is regarding your Maknuts Order #${order.orderNumber} (₹${order.totalAmount}). Status: ${order.status}. Let us know if you have any questions!`;
    const url = createWhatsAppUrl(order.phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmPurge = async () => {
    if (purgeType === 'permanent') {
      if (typedConfirmation.trim() !== 'DELETE ALL ORDERS') {
        alert('Please type DELETE ALL ORDERS exactly to confirm permanent deletion.');
        return;
      }
      setIsPurging(true);
      try {
        await onClearAllOrders();
        setIsPurgeModalOpen(false);
        setTypedConfirmation('');
      } finally {
        setIsPurging(false);
      }
    } else {
      setIsPurging(true);
      try {
        await onArchiveAllOrders();
        setIsPurgeModalOpen(false);
      } finally {
        setIsPurging(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Metrics Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-800" />
              <span>Orders & Payments Command</span>
            </h2>
            <p className="text-xs text-stone-500">
              Authoritative single location for order fulfillment, UPI verification, cash on delivery, courier tracking, and invoicing.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => downloadOrdersReportPdf(orders, storeSettings)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Download Orders PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPurgeType('archive');
                setTypedConfirmation('');
                setIsPurgeModalOpen(true);
              }}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5 text-amber-700" />
              <span>Archive Orders</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Verified Revenue</span>
              <span className="text-lg font-black font-mono text-emerald-950">₹{totalVerifiedRevenue.toLocaleString()}</span>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
              {paidOrders.length} Paid
            </span>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">UPI Verification Pending</span>
              <span className="text-lg font-black font-mono text-purple-950">{pendingUpiOrders.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('upi_verification')}
              className="text-xs text-purple-700 font-bold hover:underline cursor-pointer"
            >
              Verify Now →
            </button>
          </div>

          <div className="p-3 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">COD Receivable</span>
              <span className="text-lg font-black font-mono text-stone-900">₹{totalCodReceivable.toLocaleString()}</span>
            </div>
            <span className="text-xs text-stone-600 font-bold bg-white px-2 py-0.5 rounded-lg border border-stone-200">
              {pendingCodOrders.length} Pending
            </span>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'Pending', label: `Pending (${orders.filter(o => o.status === 'Pending').length})` },
            { id: 'Confirmed', label: `Confirmed (${orders.filter(o => o.status === 'Confirmed').length})` },
            { id: 'Shipped', label: `Shipped (${orders.filter(o => o.status === 'Shipped').length})` },
            { id: 'Delivered', label: `Delivered (${orders.filter(o => o.status === 'Delivered').length})` },
            { id: 'Cancelled', label: `Cancelled (${orders.filter(o => o.status === 'Cancelled').length})` },
            { id: 'upi_verification', label: `UPI Verification (${pendingUpiOrders.length})` },
            { id: 'cod', label: `COD (${orders.filter(o => o.paymentMethod === 'cod').length})` },
            { id: 'shipping_tracking', label: 'Shipping & AWB' },
            { id: 'invoices', label: 'Invoices' },
            { id: 'order_controls', label: 'Order Form & WhatsApp ⚙️' },
            { id: 'archive', label: 'Archive & Safety' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-VIEW: ORDER & CHECKOUT DISPLAY CONTROLS TAB */}
      {activeTab === 'order_controls' && (
        <OrderDisplayControlsTab
          settings={storeSettings}
          onSaveSettings={onSaveSettings || (async () => {})}
        />
      )}

      {/* SUB-VIEW: ARCHIVE & PURGE SAFETY TAB */}
      {activeTab === 'archive' && (
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Order Archive & Safe Deletion Management</h3>
            <p className="text-xs text-stone-500">
              Safe order lifecycle management. Always prefer archiving rather than direct deletion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preferred Archive Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Archive className="w-4 h-4 text-amber-700" />
                <span>Archive Orders (Recommended)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Moves orders into the private <code className="font-mono bg-white px-1 py-0.5 rounded">archivedOrders</code> Firestore collection.
                Maintains historical telemetry while clearing the active fulfillment deck safely.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPurgeType('archive');
                  setIsPurgeModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Archive All {orders.length} Active Orders
              </button>
            </div>

            {/* Permanent Deletion (Dangerous - Typed Confirmation Required) */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <span>Permanent Deletion (Danger Zone)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Permanently wipes all orders. Requires typing <code className="font-mono bg-white px-1 py-0.5 rounded text-rose-700 font-bold">DELETE ALL ORDERS</code> to prevent accidental loss.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPurgeType('permanent');
                  setTypedConfirmation('');
                  setIsPurgeModalOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Permanently Delete Orders...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD ORDERS TABLE VIEW */}
      {activeTab !== 'archive' && activeTab !== 'order_controls' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by Order #, Customer Name, Mobile, UTR, Courier, or AWB..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <span className="text-xs text-stone-500 font-medium shrink-0">
              {filteredOrders.length} matching
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200/90 text-center space-y-2">
              <ShoppingCart className="w-8 h-8 text-stone-300 mx-auto" />
              <h4 className="text-sm font-bold text-stone-800">No orders found in this view</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No orders match the selected tab filter and search terms.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3.5">Order</th>
                      <th className="py-3 px-3.5">Customer & Contact</th>
                      <th className="py-3 px-3.5">Items</th>
                      <th className="py-3 px-3.5">Total Amount</th>
                      <th className="py-3 px-3.5">Payment Status</th>
                      <th className="py-3 px-3.5">Fulfillment Status</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((order) => {
                      const isDeliveredOrPaid = order.status === 'Delivered' && (order.paymentStatus === 'Paid / Verified' || order.paymentStatus === 'COD Collected');
                      const isLocked = isDeliveredOrPaid && !unlockedFinancialsOrderIds.has(order.id);

                      return (
                        <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-stone-900">
                            <div>{order.orderNumber}</div>
                            <span className="text-[10px] text-stone-400 font-normal">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="font-bold text-stone-900">{order.customerName}</div>
                            <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                              <span>{order.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleWhatsAppCustomer(order)}
                                className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
                                title="Contact customer on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-stone-800">{order.quantity}x {order.productName}</span>
                            <span className="text-[10px] text-stone-400 block">{order.productWeight}</span>
                          </td>

                          <td className="py-3 px-3.5 font-mono font-bold text-emerald-950">
                            ₹{order.totalAmount}
                            {order.deliveryCharge === 0 && (
                              <span className="text-[9px] text-emerald-700 font-bold block">Free Ship</span>
                            )}
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="space-y-1">
                              <select
                                value={order.paymentStatus}
                                disabled={isLocked}
                                onChange={e => onUpdatePaymentStatus(order.id, e.target.value as PaymentStatus)}
                                className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                                  order.paymentStatus === 'Paid / Verified' || order.paymentStatus === 'COD Collected'
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : order.paymentStatus === 'Verification Required'
                                    ? 'bg-purple-50 text-purple-900 border-purple-300 animate-pulse'
                                    : order.paymentStatus === 'Failed' || order.paymentStatus === 'Refunded'
                                    ? 'bg-rose-50 text-rose-900 border-rose-300'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                } ${isLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Verification Required">Verification Required</option>
                                <option value="Paid / Verified">Paid / Verified</option>
                                <option value="COD Pending">COD Pending</option>
                                <option value="COD Collected">COD Collected</option>
                                <option value="Refunded">Refunded</option>
                                <option value="Failed">Failed</option>
                              </select>

                              {order.upiRefNumber && (
                                <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono">
                                  <span>UTR: {order.upiRefNumber}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyUtr(order.upiRefNumber!)}
                                    className="hover:text-stone-800 cursor-pointer"
                                    title="Copy UTR"
                                  >
                                    {copiedUtr === order.upiRefNumber ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <select
                              value={order.status}
                              onChange={e => onUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                              className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : order.status === 'Shipped'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : order.status === 'Confirmed'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : order.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-stone-200 text-stone-800 border-stone-300'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Financial Lock Toggle Indicator */}
                              {isDeliveredOrPaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = new Set(unlockedFinancialsOrderIds);
                                    if (next.has(order.id)) {
                                      next.delete(order.id);
                                    } else {
                                      if (confirm(`Unlock order #${order.orderNumber} financials for editing?`)) {
                                        next.add(order.id);
                                      }
                                    }
                                    setUnlockedFinancialsOrderIds(next);
                                  }}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isLocked 
                                      ? 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200' 
                                      : 'bg-amber-100 text-amber-900 border-amber-300'
                                  }`}
                                  title={isLocked ? 'Financially Locked (Click to Unlock)' : 'Unlocked for Editing'}
                                >
                                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 font-bold text-xs transition-colors cursor-pointer"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadOrderInvoicePdf(order, storeSettings)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                title="Download PDF Invoice"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-800" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAILED ORDER MODAL / DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-3xl p-5 border border-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h4 className="font-bold text-base text-stone-900 font-serif flex items-center gap-2">
                  <span>Order #{selectedOrder.orderNumber}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    selectedOrder.status === 'Delivered' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </h4>
                <p className="text-xs text-stone-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Customer Information</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-500 block">Full Name:</span>
                  <span className="font-bold text-stone-900">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Phone Mobile:</span>
                  <span className="font-mono font-bold text-stone-900">{selectedOrder.phone}</span>
                </div>
              </div>
              <div>
                <span className="text-stone-500 block">Delivery Address:</span>
                <span className="font-medium text-stone-800">{selectedOrder.address}, PIN: {selectedOrder.pincode}</span>
              </div>
              {selectedOrder.note && (
                <div>
                  <span className="text-stone-500 block">Customer Note:</span>
                  <span className="italic text-stone-700 font-medium">&ldquo;{selectedOrder.note}&rdquo;</span>
                </div>
              )}
            </div>

            {/* Financial Line Items */}
            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Financial Breakdown</span>
              <div className="flex justify-between text-stone-700">
                <span>{selectedOrder.productName} ({selectedOrder.productWeight}) × {selectedOrder.quantity}:</span>
                <span className="font-mono">₹{selectedOrder.baseAmount || (selectedOrder.unitPrice * selectedOrder.quantity)}</span>
              </div>
              {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-₹{selectedOrder.discountAmount}</span>
                </div>
              ) : null}
              {selectedOrder.couponCode && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Coupon ({selectedOrder.couponCode}):</span>
                  <span className="font-mono">-₹{selectedOrder.couponDiscount || 0}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-700">
                <span>Delivery Shipping Fee:</span>
                <span className="font-mono">{selectedOrder.deliveryCharge === 0 ? 'FREE' : `₹${selectedOrder.deliveryCharge}`}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-bold border-t border-emerald-200/80 pt-2 text-sm">
                <span>Total Amount:</span>
                <span className="font-mono font-black text-emerald-950">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            {/* Shipping & Tracking Assignments */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Courier & Live Tracking</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">Courier Partner</label>
                  <input
                    type="text"
                    value={selectedOrder.courierName || ''}
                    onChange={e => onUpdateOrder(selectedOrder.id, { courierName: e.target.value })}
                    placeholder="e.g. Delhivery, Blue Dart, DTDC"
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">AWB Tracking Number</label>
                  <input
                    type="text"
                    value={selectedOrder.trackingNumber || ''}
                    onChange={e => onUpdateOrder(selectedOrder.id, { trackingNumber: e.target.value })}
                    placeholder="e.g. 1423859201"
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-stone-600 font-bold mb-1">Direct Courier Tracking Link (Optional)</label>
                <input
                  type="text"
                  value={selectedOrder.trackingUrl || ''}
                  onChange={e => onUpdateOrder(selectedOrder.id, { trackingUrl: e.target.value })}
                  placeholder="https://track.delhivery.com/..."
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => downloadOrderInvoicePdf(selectedOrder, storeSettings)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-800" />
                <span>Download Invoice PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleWhatsAppCustomer(selectedOrder)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-amber-300" />
                <span>Contact via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SAFETY MODAL (TYPED CONFIRMATION) */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                purgeType === 'permanent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {purgeType === 'permanent' ? <Trash2 className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 font-serif">
                  {purgeType === 'permanent' ? 'Permanent Deletion Safety Warning' : 'Archive All Orders Confirmation'}
                </h4>
                <p className="text-xs text-stone-500">
                  {purgeType === 'permanent' ? 'This action is irreversible.' : 'Orders will be moved to archived storage.'}
                </p>
              </div>
            </div>

            {purgeType === 'permanent' ? (
              <div className="space-y-3">
                <p className="text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
                  To permanently delete all active customer orders from Firestore, please type <strong>DELETE ALL ORDERS</strong> in the field below:
                </p>
                <input
                  type="text"
                  placeholder="Type DELETE ALL ORDERS"
                  value={typedConfirmation}
                  onChange={e => setTypedConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            ) : (
              <p className="text-xs text-stone-600 leading-relaxed">
                Are you sure you want to archive all {orders.length} orders? They will remain safe in Firestore under <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">archivedOrders</code>.
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={isPurging || (purgeType === 'permanent' && typedConfirmation.trim() !== 'DELETE ALL ORDERS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white cursor-pointer transition-all disabled:opacity-40 ${
                  purgeType === 'permanent' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isPurging ? 'Processing...' : purgeType === 'permanent' ? 'Permanently Delete' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
