import React, { useState } from 'react';
import { Coupon, Product, StoreSettings, Order } from '../../types';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Save, 
  AlertCircle, 
  Calendar, 
  IndianRupee, 
  Percent, 
  Truck, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Download,
  Eye,
  X,
  ExternalLink,
  Package
} from 'lucide-react';
import { downloadCouponsReportPdf } from '../../utils/pdfGenerator';

interface AdminCouponsTabProps {
  coupons: Coupon[];
  products: Product[];
  orders?: Order[];
  storeSettings?: StoreSettings;
  onOpenOrder?: (order: Order) => void;
  onSaveCoupons: (updatedCoupons: Coupon[]) => Promise<void>;
}

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({
  coupons,
  products,
  orders = [],
  storeSettings,
  onOpenOrder,
  onSaveCoupons,
}) => {
  const [couponList, setCouponList] = useState<Coupon[]>([...coupons]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [viewOrdersForCoupon, setViewOrdersForCoupon] = useState<Coupon | null>(null);

  // New Coupon Form State
  const [form, setForm] = useState<Coupon>({
    id: '',
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 299,
    maxDiscount: 100,
    usageLimit: 500,
    perCustomerLimit: 1,
    enabled: true,
    firstOrderOnly: false,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: '',
  });

  const handleStartAdd = () => {
    setForm({
      id: 'cpn-' + Date.now(),
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 299,
      maxDiscount: 100,
      usageLimit: 500,
      perCustomerLimit: 1,
      enabled: true,
      firstOrderOnly: false,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      description: '',
    });
    setEditingCoupon(null);
    setIsAddingNew(true);
  };

  const handleStartEdit = (coupon: Coupon) => {
    setForm({ ...coupon });
    setEditingCoupon(coupon);
    setIsAddingNew(false);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = form.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      alert('Please enter a valid coupon code (e.g. WELCOME10)');
      return;
    }

    const payload: Coupon = {
      ...form,
      id: form.id || 'cpn-' + Date.now(),
      code: cleanCode,
      discountValue: Math.max(0, Number(form.discountValue) || 0),
      minOrderValue: Math.max(0, Number(form.minOrderValue) || 0),
      maxDiscount: form.maxDiscount ? Math.max(0, Number(form.maxDiscount)) : undefined,
      usageLimit: form.usageLimit ? Math.max(1, Number(form.usageLimit)) : undefined,
      perCustomerLimit: form.perCustomerLimit ? Math.max(1, Number(form.perCustomerLimit)) : 1,
    };

    let updatedList: Coupon[];
    if (editingCoupon) {
      updatedList = couponList.map(c => c.id === editingCoupon.id ? payload : c);
    } else {
      // Check duplicate code
      if (couponList.some(c => c.code === cleanCode)) {
        alert(`Coupon code "${cleanCode}" already exists. Please choose another code.`);
        return;
      }
      updatedList = [payload, ...couponList];
    }

    setIsSaving(true);
    try {
      await onSaveCoupons(updatedList);
      setCouponList(updatedList);
      setIsAddingNew(false);
      setEditingCoupon(null);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const updated = couponList.filter(c => c.id !== id);
    setIsSaving(true);
    try {
      await onSaveCoupons(updated);
      setCouponList(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    const updated = couponList.map(c => c.id === coupon.id ? { ...c, enabled: !c.enabled } : c);
    setIsSaving(true);
    try {
      await onSaveCoupons(updated);
      setCouponList(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAll = async (enable: boolean) => {
    const updated = couponList.map(c => ({ ...c, enabled: enable }));
    setIsSaving(true);
    try {
      await onSaveCoupons(updated);
      setCouponList(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApplyPreset = (type: 'welcome' | 'fixed50' | 'freeship') => {
    if (type === 'welcome') {
      setForm({
        ...form,
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 299,
        maxDiscount: 100,
        firstOrderOnly: true,
        description: '10% off for first time buyers',
      });
    } else if (type === 'fixed50') {
      setForm({
        ...form,
        code: 'MAKNUTS50',
        discountType: 'fixed',
        discountValue: 50,
        minOrderValue: 499,
        description: 'Flat ₹50 off on orders above ₹499',
      });
    } else if (type === 'freeship') {
      setForm({
        ...form,
        code: 'FREESHIP',
        discountType: 'free_delivery',
        discountValue: 0,
        minOrderValue: 299,
        description: 'Free pan-India delivery on eligible orders',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-800" />
            <span>Coupon & Promotional Discount System</span>
          </h2>
          <p className="text-xs text-stone-500">
            Create percentage, flat rupees, or free-delivery promo codes with strict validation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (storeSettings) {
                downloadCouponsReportPdf(couponList, storeSettings);
              }
            }}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Coupons Report PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-800" />
            <span>Download Coupons PDF</span>
          </button>

          <button
            type="button"
            onClick={handleStartAdd}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Editor Modal / Drawer */}
      {(isAddingNew || editingCoupon) && (
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-800/40 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promo Code'}</span>
            </h3>

            {/* Presets */}
            {!editingCoupon && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] text-stone-500 font-medium">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('welcome')}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] border border-emerald-300"
                >
                  WELCOME10
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('fixed50')}
                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-mono font-bold text-[10px] border border-amber-300"
                >
                  MAKNUTS50
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('freeship')}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-900 font-mono font-bold text-[10px] border border-blue-300"
                >
                  FREESHIP
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold uppercase text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={form.discountType}
                  onChange={e => setForm({ ...form, discountType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="fixed">Fixed Rupee Discount (₹)</option>
                  <option value="free_delivery">Free Delivery (100% Shipping Waiver)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {form.discountType === 'percentage' ? 'Percentage (%)' : form.discountType === 'fixed' ? 'Amount (₹)' : 'Delivery Waiver'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  disabled={form.discountType === 'free_delivery'}
                  value={form.discountType === 'free_delivery' ? 0 : form.discountValue}
                  onChange={e => setForm({ ...form, discountValue: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Minimum Order Value */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Min Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minOrderValue || 0}
                  onChange={e => setForm({ ...form, minOrderValue: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              {/* Maximum Discount Cap */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Max Cap (₹) (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="No limit"
                  value={form.maxDiscount || ''}
                  onChange={e => setForm({ ...form, maxDiscount: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Total Uses Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={form.usageLimit || ''}
                  onChange={e => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              {/* Per-customer Limit */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Per Customer Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.perCustomerLimit || 1}
                  onChange={e => setForm({ ...form, perCustomerLimit: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate || ''}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiryDate || ''}
                  onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Internal Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwali festive offer"
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            {/* Product-Specific Restriction Selector */}
            <div className="p-3.5 bg-stone-50/90 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Product-Specific Restriction
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Apply to all products across the store or restrict this voucher to specific catalog items only.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={!form.applicableProductIds || form.applicableProductIds.length === 0}
                    onChange={e => {
                      if (e.target.checked) {
                        setForm({ ...form, applicableProductIds: undefined });
                      } else {
                        setForm({ ...form, applicableProductIds: products.length > 0 ? [products[0].id] : [] });
                      }
                    }}
                    className="w-4 h-4 accent-emerald-800 rounded"
                  />
                  <span>All Products (Storewide)</span>
                </label>
              </div>

              {form.applicableProductIds && form.applicableProductIds.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-stone-200/80">
                  {products.map(p => {
                    const isSelected = form.applicableProductIds?.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer text-xs transition-colors ${
                          isSelected ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            const cur = form.applicableProductIds || [];
                            const next = e.target.checked
                              ? [...cur, p.id]
                              : cur.filter(id => id !== p.id);
                            setForm({ ...form, applicableProductIds: next.length > 0 ? next : undefined });
                          }}
                          className="w-4 h-4 accent-emerald-800 rounded"
                        />
                        <span className="truncate">{p.name} ({p.weight})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Checkbox Controls */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-stone-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={e => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-800 rounded"
                />
                <span>Active & Redeemable</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={form.firstOrderOnly || false}
                  onChange={e => setForm({ ...form, firstOrderOnly: e.target.checked })}
                  className="w-4 h-4 accent-emerald-800 rounded"
                />
                <span>First-Order Customers Only</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingCoupon(null);
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingCoupon ? 'Update Coupon' : 'Save Coupon'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table List */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              All Coupons ({couponList.length})
            </h3>
            <span className="text-[11px] text-stone-500">
              {couponList.filter(c => c.enabled).length} Enabled · {couponList.filter(c => !c.enabled).length} Disabled
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleAll(true)}
              disabled={isSaving || couponList.length === 0}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-50"
            >
              Enable All
            </button>
            <button
              type="button"
              onClick={() => handleToggleAll(false)}
              disabled={isSaving || couponList.length === 0}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-50"
            >
              Disable All
            </button>
          </div>
        </div>

        {couponList.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            No coupons configured yet. Click "Create New Coupon" to set up your first offer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Coupon Code</th>
                  <th className="py-2.5 px-4">Discount</th>
                  <th className="py-2.5 px-4">Min Order</th>
                  <th className="py-2.5 px-4">Usage Limits</th>
                  <th className="py-2.5 px-4">Validity</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {couponList.map(c => {
                  const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold px-2.5 py-1 rounded bg-stone-900 text-amber-300 text-xs shadow-2xs">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className="text-stone-400 hover:text-stone-700 p-1 rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {c.description && (
                          <div className="text-[10px] text-stone-500 mt-1">{c.description}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-950">
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}% OFF`
                            : c.discountType === 'fixed'
                            ? `₹${c.discountValue} FLAT`
                            : 'FREE SHIPPING'}
                        </span>
                        {c.maxDiscount && (
                          <div className="text-[10px] text-stone-500">Max ₹{c.maxDiscount}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        ₹{c.minOrderValue || 0}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-stone-600">
                        {(() => {
                          const ordersUsingThis = (orders || []).filter(o => 
                            o.couponCode && o.couponCode.trim().toUpperCase() === c.code.trim().toUpperCase() && o.status !== 'Cancelled'
                          );
                          const totalUses = Math.max(c.usedCount || 0, ordersUsingThis.length);

                          return (
                            <div>
                              <div className="font-semibold text-stone-900">
                                Used: {totalUses} / {c.usageLimit || '∞'}
                              </div>
                              <div className="text-[10px] text-stone-400">
                                Per user: {c.perCustomerLimit || 1}
                              </div>
                              {ordersUsingThis.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setViewOrdersForCoupon(c)}
                                  className="mt-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                                  title="View all orders that redeemed this coupon"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{ordersUsingThis.length} {ordersUsingThis.length === 1 ? 'Order' : 'Orders'}</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        <div className="text-stone-700">Exp: {c.expiryDate || 'Never'}</div>
                        {isExpired && (
                          <span className="text-[9px] font-bold text-rose-600 uppercase">Expired</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(c)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border shadow-2xs ${
                            c.enabled 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                              : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                          }`}
                          title={c.enabled ? "Click to Disable this coupon" : "Click to Enable this coupon"}
                        >
                          {c.enabled ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-700" />
                              <span>Enabled</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-stone-400" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(c)}
                            className="p-1.5 text-stone-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: VIEW ORDERS THAT REDEEMED THIS COUPON
         ======================================================== */}
      {viewOrdersForCoupon && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setViewOrdersForCoupon(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-emerald-800" />
                  <span>Orders Redeeming Coupon: <span className="font-mono text-emerald-800 font-black">{viewOrdersForCoupon.code}</span></span>
                </h3>
                <p className="text-xs text-stone-500">
                  {viewOrdersForCoupon.discountType === 'percentage' 
                    ? `${viewOrdersForCoupon.discountValue}% Discount` 
                    : viewOrdersForCoupon.discountType === 'fixed' 
                    ? `Flat ₹${viewOrdersForCoupon.discountValue} Discount` 
                    : 'Free Delivery Waiver'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewOrdersForCoupon(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Orders Table Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {(() => {
                const matchingOrders = (orders || []).filter(o => 
                  o.couponCode && o.couponCode.trim().toUpperCase() === viewOrdersForCoupon.code.trim().toUpperCase() && o.status !== 'Cancelled'
                );

                if (matchingOrders.length === 0) {
                  return (
                    <div className="text-center py-12 text-stone-400 text-xs">
                      No orders have redeemed coupon "{viewOrdersForCoupon.code}" yet.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-600 px-1">
                      <span>{matchingOrders.length} {matchingOrders.length === 1 ? 'order' : 'orders'} found</span>
                      <span>Total Coupon Savings: ₹{matchingOrders.reduce((sum, o) => sum + (o.couponDiscount || o.pricingSnapshot?.couponDiscount || 0), 0)}</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500">
                          <tr>
                            <th className="py-2.5 px-3">Order #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Item / Qty</th>
                            <th className="py-2.5 px-3">Coupon Disc.</th>
                            <th className="py-2.5 px-3">Final Amount</th>
                            <th className="py-2.5 px-3">Payment</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {matchingOrders.map(order => (
                            <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">
                                {order.orderNumber}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-stone-600 whitespace-nowrap">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-stone-900">{order.customerName}</div>
                                <div className="text-[10px] text-stone-500">{order.phone}</div>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-stone-700">
                                {order.productName} ({order.quantity}x)
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-800">
                                −₹{order.couponDiscount || order.pricingSnapshot?.couponDiscount || 0}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                                ₹{order.totalAmount}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  order.paymentStatus === 'Paid / Verified'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}>
                                  {order.paymentMethod?.toUpperCase()} · {order.paymentStatus}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {onOpenOrder && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewOrdersForCoupon(null);
                                      onOpenOrder(order);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    View
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
