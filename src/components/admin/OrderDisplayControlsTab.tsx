import React, { useState } from 'react';
import { StoreSettings, OrderDisplaySettings, WhatsAppSettings } from '../../types';
import { DEFAULT_ORDER_DISPLAY_SETTINGS } from '../../constants';
import { 
  Check, 
  Save, 
  Eye, 
  MessageCircle, 
  ShoppingCart, 
  Sliders, 
  Sparkles, 
  MapPin, 
  Phone, 
  CreditCard, 
  Truck, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { generateOrderWhatsAppMessage, createWhatsAppUrl } from '../../utils/whatsapp';

interface OrderDisplayControlsTabProps {
  settings: StoreSettings;
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
}

export const OrderDisplayControlsTab: React.FC<OrderDisplayControlsTabProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [controls, setControls] = useState<OrderDisplaySettings>({
    ...DEFAULT_ORDER_DISPLAY_SETTINGS,
    ...(settings.orderDisplaySettings || {}),
    ...(settings.whatsAppSettings?.orderDisplaySettings || {})
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<'whatsapp' | 'checkout'>('whatsapp');

  // Sample order for live WhatsApp preview
  const sampleOrder: any = {
    id: 'ord-sample-123',
    orderNumber: 'MK-261017-8743',
    customerName: 'Rahul Sharma',
    phone: '9876543210',
    alternatePhone: controls.checkoutShowAlternatePhone ? '9811223344' : undefined,
    address: 'Flat 302, Green Park Residency, Gandhi Chowk, Patna',
    landmark: controls.checkoutShowLandmark ? 'Opp. City Mall, 3rd Floor' : undefined,
    pincode: '800001',
    productId: 'maknuts-makhana-jumbo-250g',
    productName: 'Maknuts Makhana',
    productWeight: '250g Pouch',
    quantity: 2,
    unitPrice: 299,
    baseAmount: 598,
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: 60,
    couponCode: 'MAKNUTS50',
    couponDiscount: 50,
    subtotal: 488,
    deliveryCharge: 0,
    totalAmount: 488,
    paymentMethod: 'upi',
    paymentStatus: 'Pending',
    upiRefNumber: '429381928371',
    note: 'Please call before arriving',
    createdAt: new Date().toISOString(),
    status: 'Pending'
  };

  const previewMessage = generateOrderWhatsAppMessage(
    sampleOrder,
    settings.shopName || 'Maknuts Makhana',
    settings.whatsAppSettings?.orderTemplate,
    controls
  );

  const handleToggle = (key: keyof OrderDisplaySettings) => {
    setControls(prev => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key]
    }));
  };

  const handleTextChange = (key: keyof OrderDisplaySettings, value: string) => {
    setControls(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings({
        orderDisplaySettings: controls,
        whatsAppSettings: {
          ...(settings.whatsAppSettings || {}),
          orderDisplaySettings: controls,
        }
      });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (e) {
      console.error('Failed to save display settings', e);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (preset: 'standard' | 'minimal' | 'cod') => {
    if (preset === 'standard') {
      setControls({
        ...DEFAULT_ORDER_DISPLAY_SETTINGS,
        useStructuredFormat: true,
        showCustomerDetails: true,
        showCustomerName: true,
        showCustomerPhone: true,
        showCustomerAddress: true,
        showCustomerPincode: true,
        showOrderDetails: true,
        showPaymentMethod: true,
        checkoutShowAddress: true,
        checkoutRequireAddress: true,
        checkoutShowPincode: true,
        checkoutRequirePincode: true,
        checkoutShowLandmark: true,
        checkoutShowCustomerNote: true,
        checkoutAllowUpi: true,
        checkoutAllowCod: true,
        checkoutShowUpiQr: true,
      });
    } else if (preset === 'minimal') {
      setControls(prev => ({
        ...prev,
        useStructuredFormat: true,
        showOrderHeader: true,
        showOrderId: true,
        showOrderDate: false,
        showCustomerDetails: true,
        showCustomerName: true,
        showCustomerPhone: true,
        showCustomerAddress: true,
        showCustomerPincode: false,
        showOrderDetails: true,
        showUnitPrice: false,
        showBaseAmount: false,
        showDiscount: false,
        showSubtotal: false,
        showDeliveryCharge: false,
        showFinalPayableAmount: true,
        showPaymentMethod: true,
        showUpiTransactionId: false,
        showPaymentVerificationNote: false,
        checkoutShowLandmark: false,
        checkoutShowAlternatePhone: false,
        checkoutShowPincode: false,
        checkoutRequirePincode: false,
        checkoutShowCustomerNote: false,
        checkoutShowUpiQr: false,
      }));
    } else if (preset === 'cod') {
      setControls(prev => ({
        ...prev,
        useStructuredFormat: true,
        checkoutAllowUpi: false,
        checkoutAllowCod: true,
        showPaymentMethod: true,
        showCodNotice: true,
        showUpiTransactionId: false,
        showPaymentVerificationNote: false,
        checkoutShowAddress: true,
        checkoutRequireAddress: true,
      }));
    }
  };

  const handleTestWhatsApp = () => {
    const targetPhone = settings.whatsAppSettings?.businessNumber || settings.whatsappNumber || '917801051792';
    const url = createWhatsAppUrl(targetPhone, previewMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-800" />
            <span>Order & Checkout Display Controls</span>
          </h2>
          <p className="text-xs text-stone-500">
            Control what fields customers fill out during order checkout, and what details appear in the WhatsApp order sharing receipt.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="text-xs font-bold text-amber-950">Quick One-Click Configuration Presets:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
          >
            Full Pan-India Delivery (Recommended)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('minimal')}
            className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
          >
            Express Fast Checkout
          </button>
          <button
            type="button"
            onClick={() => applyPreset('cod')}
            className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
          >
            Cash on Delivery (COD) Focus
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: CUSTOMER CHECKOUT MODAL CONTROLS */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-800" />
                  <span>1. Customer Checkout Form Fields</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Control what inputs the customer sees and is required to fill out during checkout.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                During Order
              </span>
            </div>

            <div className="space-y-3">
              {/* Full Name Field */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Full Name Input</span>
                  <span className="text-[11px] text-stone-500">Customer provides their name for order label</span>
                </div>
                <input
                  type="checkbox"
                  checked={controls.checkoutShowCustomerName !== false}
                  onChange={() => handleToggle('checkoutShowCustomerName')}
                  className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                />
              </div>

              {/* Mobile Phone Field */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">10-Digit Mobile Number (WhatsApp)</span>
                  <span className="text-[11px] text-stone-500">Required for courier tracking, delivery OTP & WhatsApp chat</span>
                </div>
                <input
                  type="checkbox"
                  checked={controls.checkoutShowPhone !== false}
                  onChange={() => handleToggle('checkoutShowPhone')}
                  className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                />
              </div>

              {/* Delivery Address Field */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Full Delivery Address Field</span>
                    <span className="text-[11px] text-stone-500">House / Flat No., Street, Area, City</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={controls.checkoutShowAddress !== false}
                    onChange={() => handleToggle('checkoutShowAddress')}
                    className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                  />
                </div>
                {controls.checkoutShowAddress !== false && (
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-700">Require Address to place order</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={controls.checkoutRequireAddress !== false}
                        onChange={() => handleToggle('checkoutRequireAddress')}
                        className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                      />
                      <span>Mandatory</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Postal PIN Code Field */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Postal PIN Code (6-digit)</span>
                    <span className="text-[11px] text-stone-500">Enables exact courier dispatch & serviceable hub lookup</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={controls.checkoutShowPincode !== false}
                    onChange={() => handleToggle('checkoutShowPincode')}
                    className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                  />
                </div>
                {controls.checkoutShowPincode !== false && (
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-700">Require PIN Code before order submission</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={controls.checkoutRequirePincode !== false}
                        onChange={() => handleToggle('checkoutRequirePincode')}
                        className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                      />
                      <span>Mandatory</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Landmark / Floor / Apartment */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Landmark / Floor / Flat optional field</span>
                  <span className="text-[11px] text-stone-500">Helps delivery executives locate customer easily</span>
                </div>
                <input
                  type="checkbox"
                  checked={controls.checkoutShowLandmark !== false}
                  onChange={() => handleToggle('checkoutShowLandmark')}
                  className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                />
              </div>

              {/* Alternate Mobile */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Alternate Contact Number (Optional)</span>
                  <span className="text-[11px] text-stone-500">Secondary contact if primary phone is unreachable</span>
                </div>
                <input
                  type="checkbox"
                  checked={controls.checkoutShowAlternatePhone === true}
                  onChange={() => handleToggle('checkoutShowAlternatePhone')}
                  className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                />
              </div>

              {/* Delivery Note */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Special Delivery Notes Box</span>
                  <span className="text-[11px] text-stone-500">Customer can specify "Call before arrival" or gate notes</span>
                </div>
                <input
                  type="checkbox"
                  checked={controls.checkoutShowCustomerNote !== false}
                  onChange={() => handleToggle('checkoutShowCustomerNote')}
                  className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                />
              </div>

              {/* Payment Methods */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <span className="text-xs font-bold text-stone-900 block">Payment Methods & QR Display</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.checkoutAllowUpi !== false}
                      onChange={() => handleToggle('checkoutAllowUpi')}
                      className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="font-semibold text-stone-800">Allow UPI Payment</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.checkoutAllowCod !== false}
                      onChange={() => handleToggle('checkoutAllowCod')}
                      className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="font-semibold text-stone-800">Allow Cash on Delivery</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.checkoutShowUpiQr !== false}
                      onChange={() => handleToggle('checkoutShowUpiQr')}
                      className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="text-stone-700">Show UPI QR Code</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.checkoutShowUpiVerificationNote !== false}
                      onChange={() => handleToggle('checkoutShowUpiVerificationNote')}
                      className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="text-stone-700">Show WhatsApp Screenshot Note</span>
                  </label>
                </div>
              </div>

              {/* Estimated Delivery Notice */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">Estimated Delivery Banner</span>
                  <input
                    type="checkbox"
                    checked={controls.checkoutShowEstimatedDelivery !== false}
                    onChange={() => handleToggle('checkoutShowEstimatedDelivery')}
                    className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                  />
                </div>
                {controls.checkoutShowEstimatedDelivery !== false && (
                  <input
                    type="text"
                    value={controls.checkoutEstimatedDeliveryText || ''}
                    placeholder="Dispatched within 24 hours · Delivery in 2-4 business days across India"
                    onChange={e => handleTextChange('checkoutEstimatedDeliveryText', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                )}
              </div>

              {/* Coupons & Price Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-semibold text-stone-800">Coupon / Promo Box</span>
                  <input
                    type="checkbox"
                    checked={controls.checkoutShowCouponInput !== false}
                    onChange={() => handleToggle('checkoutShowCouponInput')}
                    className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-semibold text-stone-800">Price Breakdown Box</span>
                  <input
                    type="checkbox"
                    checked={controls.checkoutShowPriceBreakdown !== false}
                    onChange={() => handleToggle('checkoutShowPriceBreakdown')}
                    className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom Submit Button Text */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <label className="text-[11px] font-bold text-stone-700 block">
                  Submit Button Text in Checkout
                </label>
                <input
                  type="text"
                  placeholder="PLACE ORDER ON WHATSAPP"
                  value={controls.checkoutSubmitButtonText || ''}
                  onChange={e => handleTextChange('checkoutSubmitButtonText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: WHATSAPP ORDER SHARING MESSAGE RECEIPT */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>2. WhatsApp Order Sharing Details (Receipt)</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Select which customer, delivery, order, and payment lines are included in the WhatsApp message.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-[#25D366]/10 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300">
                In WhatsApp
              </span>
            </div>

            {/* Master Structured Toggle */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Use Clean Structured Receipt (Guaranteed Delivery Details)
                </span>
                <span className="text-[11px] text-emerald-800">
                  Formats the order into the authoritative receipt with customer details, phone, and delivery address.
                </span>
              </div>
              <input
                type="checkbox"
                checked={controls.useStructuredFormat !== false}
                onChange={() => handleToggle('useStructuredFormat')}
                className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
              />
            </div>

            {/* Customer Details Block */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Customer & Address Section</span>
                </span>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controls.showCustomerDetails !== false}
                    onChange={() => handleToggle('showCustomerDetails')}
                    className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                  />
                  <span>Show Section</span>
                </label>
              </div>

              {controls.showCustomerDetails !== false && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showCustomerName !== false}
                      onChange={() => handleToggle('showCustomerName')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="text-stone-800">Customer Name</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showCustomerPhone !== false}
                      onChange={() => handleToggle('showCustomerPhone')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="text-stone-800">Mobile Number</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showCustomerAddress !== false}
                      onChange={() => handleToggle('showCustomerAddress')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="text-stone-800">Delivery Address</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showCustomerPincode !== false}
                      onChange={() => handleToggle('showCustomerPincode')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="text-stone-800">Postal PIN Code</span>
                  </label>
                </div>
              )}
            </div>

            {/* Order Items & Pricing Breakdown Block */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Order Items & Pricing Lines</span>
                </span>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controls.showOrderDetails !== false}
                    onChange={() => handleToggle('showOrderDetails')}
                    className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                  />
                  <span>Show Section</span>
                </label>
              </div>

              {controls.showOrderDetails !== false && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showProductName !== false}
                      onChange={() => handleToggle('showProductName')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Product Name</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showUnitPrice !== false}
                      onChange={() => handleToggle('showUnitPrice')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Unit Price</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showQuantity !== false}
                      onChange={() => handleToggle('showQuantity')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Quantity</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showBaseAmount !== false}
                      onChange={() => handleToggle('showBaseAmount')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Base Amount</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showDiscount !== false}
                      onChange={() => handleToggle('showDiscount')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Discount</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showCouponDiscount !== false}
                      onChange={() => handleToggle('showCouponDiscount')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Coupon</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showSubtotal !== false}
                      onChange={() => handleToggle('showSubtotal')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Subtotal</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showDeliveryCharge !== false}
                      onChange={() => handleToggle('showDeliveryCharge')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span>Delivery Fee</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controls.showFinalPayableAmount !== false}
                      onChange={() => handleToggle('showFinalPayableAmount')}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                    />
                    <span className="font-bold text-emerald-950">Payable Total</span>
                  </label>
                </div>
              )}
            </div>

            {/* Payment & Verification Block */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-stone-900 block">Payment Method & Verification Lines</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controls.showPaymentMethod !== false}
                    onChange={() => handleToggle('showPaymentMethod')}
                    className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                  />
                  <span>Payment Mode (UPI / COD)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controls.showUpiTransactionId !== false}
                    onChange={() => handleToggle('showUpiTransactionId')}
                    className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                  />
                  <span>UPI Reference / UTR ID</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controls.showPaymentVerificationNote !== false}
                    onChange={() => handleToggle('showPaymentVerificationNote')}
                    className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                  />
                  <span>Screenshot Verification Request</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controls.showCodNotice !== false}
                    onChange={() => handleToggle('showCodNotice')}
                    className="w-3.5 h-3.5 accent-emerald-800 rounded cursor-pointer"
                  />
                  <span>Cash on Delivery Collection Notice</span>
                </label>
              </div>
            </div>

            {/* Closing Thank You Greeting */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">Closing Greeting Text</span>
                <input
                  type="checkbox"
                  checked={controls.showClosingText !== false}
                  onChange={() => handleToggle('showClosingText')}
                  className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                />
              </div>
              {controls.showClosingText !== false && (
                <input
                  type="text"
                  value={controls.closingText || ''}
                  placeholder="Please confirm my order and send dispatch details. Thank you!"
                  onChange={e => handleTextChange('closingText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEWS (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs sticky top-24 space-y-4">
            
            {/* Preview Switcher */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewTab('whatsapp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    previewTab === 'whatsapp'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  WhatsApp Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('checkout')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    previewTab === 'checkout'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Checkout Form
                </button>
              </div>

              {previewTab === 'whatsapp' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                    title="Copy sample receipt text"
                  >
                    {copiedPreview ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Test send to your WhatsApp"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Test Send</span>
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: WHATSAPP MESSAGE PREVIEW */}
            {previewTab === 'whatsapp' && (
              <div className="space-y-3">
                <div className="text-[11px] text-stone-500 font-medium flex items-center justify-between">
                  <span>Live WhatsApp Message Preview:</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold">Auto-Generated</span>
                </div>

                {/* WhatsApp Chat Bubble Mockup */}
                <div className="bg-[#EFEAE2] p-3.5 rounded-2xl border border-stone-300 shadow-inner max-h-[520px] overflow-y-auto">
                  <div className="bg-[#E7FFDB] p-3.5 rounded-2xl rounded-tr-none shadow-xs border border-emerald-200/60 text-xs font-sans text-stone-900 whitespace-pre-wrap leading-relaxed select-text">
                    {previewMessage}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Guaranteed Customer Details:</strong> Customer name, mobile phone, and full delivery address are protected and formatted for fast packing and dispatch.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: CHECKOUT FORM PREVIEW */}
            {previewTab === 'checkout' && (
              <div className="space-y-3">
                <div className="text-[11px] text-stone-500 font-medium">
                  What customer sees in Checkout Modal:
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E2D5C3] shadow-xs space-y-3 text-xs max-h-[520px] overflow-y-auto">
                  {/* Estimated Delivery */}
                  {controls.checkoutShowEstimatedDelivery !== false && (
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 font-medium flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{controls.checkoutEstimatedDeliveryText || 'Dispatched within 24 hours · Delivery in 2-4 days'}</span>
                    </div>
                  )}

                  {/* Form fields mockup */}
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-stone-200">
                    <span className="text-[11px] font-bold text-emerald-950 block">1. Delivery Information</span>
                    
                    {controls.checkoutShowCustomerName !== false && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold">Full Name *</span>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-700 font-medium">
                          Rahul Sharma
                        </div>
                      </div>
                    )}

                    {controls.checkoutShowPhone !== false && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold">Mobile Number (WhatsApp) *</span>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-700 font-medium">
                          +91 9876543210
                        </div>
                      </div>
                    )}

                    {controls.checkoutShowAlternatePhone === true && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold">Alternate Mobile (Optional)</span>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-700 font-medium">
                          +91 9811223344
                        </div>
                      </div>
                    )}

                    {controls.checkoutShowAddress !== false && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold">
                          Delivery Address {controls.checkoutRequireAddress !== false ? '*' : '(Optional)'}
                        </span>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-700 font-medium">
                          Flat 302, Green Park Residency, Patna
                        </div>
                      </div>
                    )}

                    {controls.checkoutShowLandmark !== false && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold">Landmark (Optional)</span>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-700 font-medium">
                          Opp. City Mall, 3rd Floor
                        </div>
                      </div>
                    )}

                    {controls.checkoutShowPincode !== false && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold">
                          Postal PIN Code {controls.checkoutRequirePincode !== false ? '*' : '(Optional)'}
                        </span>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-700 font-medium">
                          800001
                        </div>
                      </div>
                    )}

                    {controls.checkoutShowCustomerNote !== false && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold">Delivery Note</span>
                        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-700 font-medium">
                          Please call before arriving
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coupon Mockup */}
                  {controls.checkoutShowCouponInput !== false && (
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-700">Promo Code Box</span>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        MAKNUTS50
                      </span>
                    </div>
                  )}

                  {/* Price Breakdown Mockup */}
                  {controls.checkoutShowPriceBreakdown !== false && (
                    <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span>Product Total:</span>
                        <span className="font-bold">₹598</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 font-semibold">
                        <span>Discount / Coupon:</span>
                        <span>−₹110</span>
                      </div>
                      <div className="flex justify-between font-black text-xs pt-1 border-t border-amber-200 text-emerald-950">
                        <span>Final Total:</span>
                        <span>₹488</span>
                      </div>
                    </div>
                  )}

                  {/* Button Mockup */}
                  <div className="p-3 bg-emerald-800 text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                    <MessageCircle className="w-4 h-4 text-amber-300" />
                    <span>{controls.checkoutSubmitButtonText || 'PLACE ORDER ON WHATSAPP'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
