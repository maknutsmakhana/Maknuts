import React, { useState } from 'react';
import { 
  StoreSettings, 
  Product, 
  Coupon, 
  FlashOfferSettings,
  Order 
} from '../../types';
import { 
  BadgePercent, 
  IndianRupee, 
  Truck, 
  Ticket, 
  Calendar, 
  Save, 
  Check, 
  Clock, 
  Sparkles, 
  Percent, 
  AlertCircle 
} from 'lucide-react';
import { AdminCouponsTab } from './AdminCouponsTab';

interface PricingPromotionsPageProps {
  settings: StoreSettings;
  products: Product[];
  orders: Order[];
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
  onUpdateProduct: (prod: Product) => Promise<void>;
  onOpenOrder: (order: Order) => void;
  initialSubTab?: string;
}

export const PricingPromotionsPage: React.FC<PricingPromotionsPageProps> = ({
  settings,
  products,
  orders,
  onSaveSettings,
  onUpdateProduct,
  onOpenOrder,
  initialSubTab = 'pricing',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pricing' | 'discounts' | 'delivery' | 'coupons' | 'scheduled_offers'>(
    (initialSubTab as any) || 'pricing'
  );

  const [deliveryCharge, setDeliveryCharge] = useState(settings.deliveryCharge ?? 40);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(settings.freeDeliveryThreshold ?? 600);
  const [freeDeliveryAllOrders, setFreeDeliveryAllOrders] = useState(Boolean(settings.freeDeliveryAllOrders));

  const [discountEnabled, setDiscountEnabled] = useState(Boolean(settings.discountEnabled));
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(settings.discountType || 'percentage');
  const [discountValue, setDiscountValue] = useState(settings.discountValue || 0);

  const [minOrderQty, setMinOrderQty] = useState(settings.minOrderQuantity || 1);
  const [maxOrderQty, setMaxOrderQty] = useState(settings.maxOrderQuantity || 20);

  // Scheduled Flash Offers
  const [flashOffer, setFlashOffer] = useState<FlashOfferSettings>(
    settings.flashOffer || {
      enabled: false,
      title: 'Festive Season Special',
      discountType: 'percentage',
      discountValue: 10,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      badgeText: 'Limited Offer',
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings({
        deliveryCharge,
        freeDeliveryThreshold,
        freeDeliveryAllOrders,
        discountEnabled,
        discountType,
        discountValue,
        minOrderQuantity: minOrderQty,
        maxOrderQuantity: maxOrderQty,
        flashOffer,
      });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Error saving pricing settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Save Button */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-emerald-800" />
              <span>Pricing & Promotions Command</span>
            </h2>
            <p className="text-xs text-stone-500">
              ONE central authoritative area for product prices, delivery thresholds, coupons, and scheduled offers.
            </p>
          </div>

          {activeSubTab !== 'coupons' && (
            <button
              type="button"
              onClick={handleSaveGeneral}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveToast ? (
                <Check className="w-4 h-4 text-amber-300" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saveToast ? 'Settings Saved!' : isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'pricing', label: 'Pricing & Quantities' },
            { id: 'discounts', label: 'Store Discounts' },
            { id: 'delivery', label: 'Delivery Rules' },
            { id: 'coupons', label: `Coupons (${(settings.coupons || []).length})` },
            { id: 'scheduled_offers', label: 'Scheduled Offers' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeSubTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: PRICING & QUANTITIES */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-4">
          {/* Global Order Quantity Rules */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Checkout Quantity Bounds</h3>
            <p className="text-xs text-stone-500">Enforce minimum and maximum quantity allowed per checkout transaction.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Minimum Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={minOrderQty}
                  onChange={e => setMinOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Maximum Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={maxOrderQty}
                  onChange={e => setMaxOrderQty(Math.max(minOrderQty, parseInt(e.target.value) || 20))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Product Prices Quick Editor */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Product Selling & MRP Prices</h3>
            <p className="text-xs text-stone-500">Quickly adjust offer price and MRP across all products in catalog.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Selling Price (₹)</th>
                    <th className="py-2.5 px-3">MRP (₹)</th>
                    <th className="py-2.5 px-3">Discount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td className="py-3 px-3 font-bold text-stone-900">
                        {prod.name} <span className="text-stone-400 font-normal">({prod.weight})</span>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          value={prod.price}
                          onChange={e => onUpdateProduct({ ...prod, price: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-24 px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-mono font-bold text-emerald-950"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          value={prod.originalPrice}
                          onChange={e => onUpdateProduct({ ...prod, originalPrice: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-24 px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-mono text-stone-600"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {prod.originalPrice > prod.price 
                          ? `${Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}% OFF`
                          : 'None'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          Live Sync
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STORE DISCOUNTS */}
      {activeSubTab === 'discounts' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Store-Wide General Discount</h3>
            <p className="text-xs text-stone-500">Apply an automatic discount to all orders (calculated before coupons).</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={e => setDiscountEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-800 rounded"
              />
              <span>Enable Store-Wide Promotional Discount</span>
            </label>

            {discountEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Rupee Deduction (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? 100 : 10000}
                    value={discountValue}
                    onChange={e => setDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DELIVERY RULES */}
      {activeSubTab === 'delivery' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Delivery Charges & Free Delivery Threshold</h3>
            <p className="text-xs text-stone-500">Configure shipping rates and free delivery incentives.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Standard Delivery Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryCharge}
                  onChange={e => setDeliveryCharge(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-stone-500">Set to 0 for free standard shipping</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Free Delivery Threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={freeDeliveryThreshold}
                  onChange={e => setFreeDeliveryThreshold(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-stone-500">Cart subtotal at which delivery becomes automatically free</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800 pt-1">
              <input
                type="checkbox"
                checked={freeDeliveryAllOrders}
                onChange={e => setFreeDeliveryAllOrders(e.target.checked)}
                className="w-4 h-4 accent-emerald-800 rounded"
              />
              <span>Free Delivery on ALL Orders (Overrides standard fee)</span>
            </label>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: COUPONS (EMBEDDED SECURE COUPON TAB) */}
      {activeSubTab === 'coupons' && (
        <AdminCouponsTab
          coupons={settings.coupons || []}
          products={products}
          orders={orders}
          storeSettings={settings}
          onOpenOrder={onOpenOrder}
          onSaveCoupons={async (updatedCoupons) => {
            await onSaveSettings({ coupons: updatedCoupons });
          }}
        />
      )}

      {/* SUB-TAB 5: SCHEDULED OFFERS */}
      {activeSubTab === 'scheduled_offers' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Scheduled Offers & Festive Sales</h3>
            <p className="text-xs text-stone-500">Plan and schedule limited-time promotions with auto start and expiry.</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
              <input
                type="checkbox"
                checked={flashOffer.enabled}
                onChange={e => setFlashOffer({ ...flashOffer, enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-800 rounded"
              />
              <span>Enable Scheduled Flash Offer</span>
            </label>

            {flashOffer.enabled && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3.5 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Offer Title</label>
                    <input
                      type="text"
                      value={flashOffer.title}
                      onChange={e => setFlashOffer({ ...flashOffer, title: e.target.value })}
                      placeholder="e.g. Diwali Super Crunch Sale"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={flashOffer.badgeText}
                      onChange={e => setFlashOffer({ ...flashOffer, badgeText: e.target.value })}
                      placeholder="e.g. Limited 48h Offer"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={flashOffer.startDate}
                      onChange={e => setFlashOffer({ ...flashOffer, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">End / Expiry Date</label>
                    <input
                      type="date"
                      value={flashOffer.endDate}
                      onChange={e => setFlashOffer({ ...flashOffer, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
