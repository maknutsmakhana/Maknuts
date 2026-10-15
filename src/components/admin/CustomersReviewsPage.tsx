import React, { useState } from 'react';
import { 
  Order, 
  ReviewItem, 
  StoreSettings 
} from '../../types';
import { 
  Users, 
  Star, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  MessageCircle, 
  ShieldCheck, 
  MessageSquareHeart, 
  Check, 
  Save, 
  Filter, 
  AlertCircle,
  Download,
  Calendar,
  IndianRupee,
  Phone
} from 'lucide-react';
import { calculateReviewStats } from '../../utils/reviews';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { downloadCustomersReportPdf } from '../../utils/pdfGenerator';

interface CustomersReviewsPageProps {
  orders: Order[];
  reviews: ReviewItem[];
  storeSettings: StoreSettings;
  onApproveReview: (id: string) => Promise<void>;
  onRejectReview: (id: string) => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
  onUpdateReviewText: (id: string, newComment: string) => Promise<void>;
  onUpdateStoreReply: (id: string, replyText: string | null) => Promise<void>;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export const CustomersReviewsPage: React.FC<CustomersReviewsPageProps> = ({
  orders,
  reviews,
  storeSettings,
  onApproveReview,
  onRejectReview,
  onDeleteReview,
  onUpdateReviewText,
  onUpdateStoreReply,
  initialSubTab = 'customers',
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'reviews' | 'pending_reviews'>(
    (initialSubTab as any) || 'customers'
  );

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: 'customers' | 'reviews' | 'pending_reviews') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [customerSearch, setCustomerSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Editing review text
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState('');

  // Replying to review
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // 1. Group unique customers from orders
  const customerMap = new Map<string, {
    phone: string;
    name: string;
    orders: Order[];
    totalSpent: number;
    lastOrderDate: string;
    addresses: Set<string>;
  }>();

  orders.forEach(order => {
    const cleanPhone = order.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return;

    const existing = customerMap.get(cleanPhone);
    if (existing) {
      existing.orders.push(order);
      existing.totalSpent += (order.totalAmount || 0);
      existing.addresses.add(`${order.address}, PIN: ${order.pincode}`);
      if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.createdAt;
        existing.name = order.customerName || existing.name;
      }
    } else {
      customerMap.set(cleanPhone, {
        phone: cleanPhone,
        name: order.customerName || 'Customer',
        orders: [order],
        totalSpent: order.totalAmount || 0,
        lastOrderDate: order.createdAt,
        addresses: new Set([`${order.address}, PIN: ${order.pincode}`])
      });
    }
  });

  const customerList = Array.from(customerMap.values())
    .sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());

  const filteredCustomers = customerList.filter(c => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // 2. Reviews metrics
  const approvedReviews = reviews.filter(r => (r.status || 'approved') === 'approved');
  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const reviewStats = calculateReviewStats(approvedReviews);

  const filteredReviews = reviews.filter(rev => {
    if (activeSubTab === 'pending_reviews') {
      return rev.status === 'pending';
    }
    if (reviewStatusFilter !== 'all' && rev.status !== reviewStatusFilter) {
      return false;
    }
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      return rev.name.toLowerCase().includes(q) ||
        rev.comment.toLowerCase().includes(q) ||
        (rev.orderId && rev.orderId.toLowerCase().includes(q));
    }
    return true;
  });

  const handleSaveEditedComment = async (id: string) => {
    await onUpdateReviewText(id, editingComment);
    setEditingReviewId(null);
  };

  const handleSaveStoreReply = async (id: string) => {
    await onUpdateStoreReply(id, replyText.trim() ? replyText.trim() : null);
    setReplyingReviewId(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Sub-Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-800" />
              <span>Customers & Reviews Hub</span>
            </h2>
            <p className="text-xs text-stone-500">
              Directory of verified purchasing customers, review moderation queue, and public rating management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCustomersReportPdf(orders, storeSettings)}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Customer Dossier PDF</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'customers', label: `Customer Directory (${customerList.length})` },
            { id: 'reviews', label: `All Reviews (${reviews.length})` },
            { 
              id: 'pending_reviews', 
              label: `Pending Reviews (${pendingReviews.length})`, 
              badge: pendingReviews.length > 0 ? pendingReviews.length : undefined 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSubTabChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                activeSubTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: CUSTOMER DIRECTORY */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search customers by name or 10-digit mobile number..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
              />
            </div>
            <span className="text-xs text-stone-500 font-medium shrink-0">
              {filteredCustomers.length} verified customers
            </span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200/90 text-center text-xs text-stone-400">
              No customers match your search query.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3.5">Customer Name</th>
                      <th className="py-3 px-3.5">Mobile Number</th>
                      <th className="py-3 px-3.5">Orders Count</th>
                      <th className="py-3 px-3.5">Total Spent</th>
                      <th className="py-3 px-3.5">Last Order Date</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.phone} className="hover:bg-stone-50/70">
                        <td className="py-3 px-3.5 font-bold text-stone-900">
                          {cust.name}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-stone-600">
                          +91 {cust.phone}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded-lg font-mono">
                            {cust.orders.length} orders
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-emerald-950">
                          ₹{cust.totalSpent.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-stone-500 text-[11px]">
                          {new Date(cust.lastOrderDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const text = `Hello ${cust.name}! Thank you for being a valued Maknuts customer. We'd love to assist you with fresh orders!`;
                              const url = createWhatsAppUrl(cust.phone, text);
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2 & 3: REVIEWS & PENDING REVIEWS */}
      {(activeSubTab === 'reviews' || activeSubTab === 'pending_reviews') && (
        <div className="space-y-4">
          {/* Reviews Score Card Banner */}
          <div className="bg-amber-50/70 border border-amber-200/90 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex flex-col items-center justify-center font-black font-mono shadow-xs">
                <span className="text-base leading-none">{reviewStats.averageRating}</span>
                <span className="text-[10px] leading-none">★</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Public Store Rating
                </h4>
                <p className="text-xs text-stone-600">
                  Based on <strong>{approvedReviews.length}</strong> approved reviews. Unapproved or pending reviews never affect public store score.
                </p>
              </div>
            </div>

            {activeSubTab === 'reviews' && (
              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
                {[
                  { id: 'all', label: `All (${reviews.length})` },
                  { id: 'approved', label: `Approved (${approvedReviews.length})` },
                  { id: 'pending', label: `Pending (${pendingReviews.length})` },
                  { id: 'rejected', label: `Rejected (${reviews.filter(r => r.status === 'rejected').length})` },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setReviewStatusFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reviewStatusFilter === f.id
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {filteredReviews.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-stone-200/90 text-center text-xs text-stone-400">
                {activeSubTab === 'pending_reviews' ? 'No pending reviews awaiting approval!' : 'No reviews match your filter.'}
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div 
                  key={rev.id}
                  className={`bg-white p-4 rounded-3xl border transition-all space-y-3 ${
                    rev.status === 'pending' ? 'border-amber-400/80 shadow-2xs' : 'border-stone-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-stone-900">{rev.name}</span>
                      {rev.location && <span className="text-[11px] text-stone-400">({rev.location})</span>}
                      
                      {rev.verifiedBuyer && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.2 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Verified Buyer</span>
                        </span>
                      )}

                      <div className="flex items-center text-amber-500 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rev.rating ? 'text-amber-400' : 'text-stone-300'}>★</span>
                        ))}
                      </div>

                      <span className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full ${
                        rev.status === 'approved' ? 'bg-emerald-100 text-emerald-900' :
                        rev.status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-900'
                      }`}>
                        {rev.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {rev.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => onApproveReview(rev.id)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      {rev.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => onRejectReview(rev.id)}
                          className="px-2.5 py-1 bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingReviewId(rev.id);
                          setEditingComment(rev.comment);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title="Edit Review Text"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this review permanently?')) {
                            onDeleteReview(rev.id);
                          }
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comment Body */}
                  {editingReviewId === rev.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={editingComment}
                        onChange={e => setEditingComment(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingReviewId(null)}
                          className="px-3 py-1 bg-stone-100 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedComment(rev.id)}
                          className="px-3 py-1 bg-emerald-800 text-white rounded-lg text-xs font-bold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-700 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}

                  {/* Store Reply */}
                  {rev.storeReply && (
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs space-y-1">
                      <span className="font-bold text-[10px] text-emerald-900 uppercase block">Maknuts Team Reply:</span>
                      <p className="text-stone-700">{rev.storeReply}</p>
                    </div>
                  )}

                  {/* Reply Action */}
                  {replyingReviewId === rev.id ? (
                    <div className="space-y-2 pt-1 border-t border-stone-100">
                      <input
                        type="text"
                        placeholder="Write store response..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingReviewId(null)}
                          className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveStoreReply(rev.id)}
                          className="px-3 py-1 bg-emerald-800 text-white rounded-lg text-xs font-bold"
                        >
                          Publish Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingReviewId(rev.id);
                          setReplyText(rev.storeReply || '');
                        }}
                        className="text-emerald-800 hover:text-emerald-950 font-bold hover:underline cursor-pointer"
                      >
                        {rev.storeReply ? 'Edit Store Reply' : '+ Add Store Reply'}
                      </button>

                      <span className="text-stone-400">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
