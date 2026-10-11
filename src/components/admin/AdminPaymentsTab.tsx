import React, { useState } from 'react';
import { Order, PaymentStatus } from '../../types';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  IndianRupee, 
  Filter, 
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { createWhatsAppUrl } from '../../utils/whatsapp';

interface AdminPaymentsTabProps {
  orders: Order[];
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => Promise<void>;
  onOpenOrder: (order: Order) => void;
  whatsappNumber: string;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({
  orders,
  onUpdatePaymentStatus,
  onOpenOrder,
  whatsappNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'cod' | 'verification'>('all');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Financial Summary
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid / Verified' || o.paymentStatus === 'COD Collected');
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingOnlineOrders = orders.filter(o => o.paymentMethod === 'upi' && (o.paymentStatus === 'Pending' || o.paymentStatus === 'Verification Required'));
  const totalPendingOnlineAmount = pendingOnlineOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingCodOrders = orders.filter(o => o.paymentMethod === 'cod' && o.paymentStatus !== 'COD Collected');
  const totalPendingCodAmount = pendingCodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Filtering
  const filteredOrders = orders.filter(order => {
    // Search
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.phone.toLowerCase().includes(q) ||
      (order.upiRefNumber && order.upiRefNumber.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'paid') {
      return order.paymentStatus === 'Paid / Verified' || order.paymentStatus === 'COD Collected';
    }
    if (statusFilter === 'pending') {
      return order.paymentStatus === 'Pending';
    }
    if (statusFilter === 'verification') {
      return order.paymentStatus === 'Verification Required' || (order.paymentMethod === 'upi' && order.upiRefNumber && order.paymentStatus !== 'Paid / Verified');
    }
    if (statusFilter === 'cod') {
      return order.paymentMethod === 'cod';
    }
    return true;
  });

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleWhatsAppInquiry = (order: Order) => {
    const text = `Hello ${order.customerName}, this is regarding your Maknuts Order #${order.orderNumber} (₹${order.totalAmount}). Could you please share the UPI payment confirmation screenshot or 12-digit UTR reference number? Thank you!`;
    const url = createWhatsAppUrl(order.phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Reconciliation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Paid Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Verified Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
            ₹{totalPaidRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {paidOrders.length} orders settled & confirmed
          </p>
        </div>

        {/* Pending UPI Verification */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pending UPI Verification
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
            ₹{totalPendingOnlineAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {pendingOnlineOrders.length} online transfers awaiting bank check
          </p>
        </div>

        {/* COD Pending Collection */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
              COD Receivable
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            ₹{totalPendingCodAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {pendingCodOrders.length} COD parcels to be collected at doorstep
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer name, Phone, or UTR reference number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'verification', label: `Needs Verification (${orders.filter(o => o.upiRefNumber && o.paymentStatus !== 'Paid / Verified').length})` },
            { id: 'paid', label: `Paid / Collected (${paidOrders.length})` },
            { id: 'cod', label: `COD (${orders.filter(o => o.paymentMethod === 'cod').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            Transactions & Reconciliation ({filteredOrders.length})
          </h3>
          <span className="text-[11px] text-stone-500">
            Click transaction to inspect order details or adjust status
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            No payment records match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Order ID & Date</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Method & UTR</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Payment Status</th>
                  <th className="py-2.5 px-4 text-right">Quick Reconciliation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map(order => (
                  <tr 
                    key={order.id}
                    onClick={() => onOpenOrder(order)}
                    className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-950">
                        {order.orderNumber}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{order.customerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{order.phone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          order.paymentMethod === 'cod' 
                            ? 'bg-stone-200 text-stone-800' 
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {order.paymentMethod}
                        </span>
                        {order.upiRefNumber && (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded text-[11px]">
                              {order.upiRefNumber}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyUtr(order.upiRefNumber!);
                              }}
                              className="text-stone-400 hover:text-stone-700 p-0.5"
                              title="Copy UTR"
                            >
                              {copiedUtr === order.upiRefNumber ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-stone-900">
                      ₹{order.totalAmount}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'Paid / Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'COD Collected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'Verification Required'
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : order.paymentStatus === 'Failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {order.paymentStatus || 'Pending'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {order.paymentStatus !== 'Paid / Verified' && order.paymentStatus !== 'COD Collected' ? (
                          <button
                            type="button"
                            onClick={() => onUpdatePaymentStatus(order.id, order.paymentMethod === 'cod' ? 'COD Collected' : 'Paid / Verified')}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            Mark {order.paymentMethod === 'cod' ? 'Collected' : 'Verified'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleWhatsAppInquiry(order)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition-colors cursor-pointer"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
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
    </div>
  );
};
