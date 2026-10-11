import React, { useState } from 'react';
import { Coupon, Product } from '../../types';
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
  ToggleRight
} from 'lucide-react';

interface AdminCouponsTabProps {
  coupons: Coupon[];
  products: Product[];
  onSaveCoupons: (updatedCoupons: Coupon[]) => Promise<void>;
}

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({
  coupons,
  products,
  onSaveCoupons,
}) => {
  const [couponList, setCouponList] = useState<Coupon[]>([...coupons]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

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

        <button
          type="button"
          onClick={handleStartAdd}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
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
                        <div>Used: {c.usedCount || 0} / {c.usageLimit || '∞'}</div>
                        <div className="text-[10px] text-stone-400">Per user: {c.perCustomerLimit || 1}</div>
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
    </div>
  );
};
