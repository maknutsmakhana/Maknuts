import React, { useState, useEffect } from 'react';
import { Product, StoreSettings, Order, Coupon } from '../types';
import { useStore } from '../context/StoreContext';
import { 
  X, Check, Copy, ShieldCheck, Truck,
  CreditCard, Banknote, QrCode, AlertCircle, MessageCircle, ExternalLink, Plus, Minus, RefreshCw, Tag, Sparkles, Ticket
} from 'lucide-react';
import QRCode from 'qrcode';
import { generateOrderWhatsAppMessage, createWhatsAppUrl } from '../utils/whatsapp';
import { calculateOrderPricing, validateAndApplyCoupon } from '../utils/pricing';
import { DEFAULT_ORDER_DISPLAY_SETTINGS } from '../constants';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  initialQuantity: number;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  initialQuantity,
  onOrderSuccess,
}) => {
  const { storeSettings, createOrder, orders } = useStore();

  const ds = {
    ...DEFAULT_ORDER_DISPLAY_SETTINGS,
    ...(storeSettings.orderDisplaySettings || {}),
    ...(storeSettings.whatsAppSettings?.orderDisplaySettings || {})
  };

  const minQty = Math.max(1, storeSettings?.minOrderQuantity || 1);
  const maxQty = Math.max(minQty, storeSettings?.maxOrderQuantity || 20);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [note, setNote] = useState('');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Payment state - strictly 'upi' or 'cod'
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [upiRefNumber, setUpiRefNumber] = useState('');

  // UI state
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [formValidationMessage, setFormValidationMessage] = useState<string>('');
  const isSubmittingRef = React.useRef(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Sync initial quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      const clamped = Math.min(Math.max(initialQuantity > 0 ? initialQuantity : minQty, minQty), maxQty);
      setQuantity(clamped);
      setErrors({});
      setSubmissionError('');
      setFormValidationMessage('');
      setCouponFeedback(null);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [isOpen, initialQuantity, minQty, maxQty]);

  const isUpiAllowed = ds.checkoutAllowUpi !== false && storeSettings.enableUpi !== false;
  const isCodAllowed = ds.checkoutAllowCod !== false && storeSettings.enableCod !== false;

  // If UPI disabled by admin, fallback to COD, or vice versa
  useEffect(() => {
    if (!isUpiAllowed && isCodAllowed) {
      setPaymentMethod('cod');
    } else if (isUpiAllowed && !isCodAllowed) {
      setPaymentMethod('upi');
    }
  }, [isUpiAllowed, isCodAllowed]);

  // Centralized calculations with coupon
  const pricing = calculateOrderPricing({
    productPrice: product.price,
    originalPrice: product.originalPrice,
    quantity,
    settings: storeSettings,
    appliedCoupon,
    productId: product.id,
    customerPhone: phone,
  });

  const {
    unitPrice,
    baseAmount,
    discountAmount,
    discountType,
    discountValue,
    couponCode,
    couponDiscount,
    subtotal,
    deliveryCharge,
    isFreeDelivery,
    finalTotal,
    totalSavings,
  } = pricing;

  const totalAmount = finalTotal;

  // Handle coupon application
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponFeedback({ type: 'error', message: 'Please enter a coupon code' });
      return;
    }

    const availableCoupons = storeSettings.coupons || [];
    let localOrders: any[] = [];
    try {
      const localOrdersRaw = localStorage.getItem('maknuts_my_orders');
      localOrders = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
    } catch {
      // ignore
    }
    const allKnownOrders = [...(orders || []), ...localOrders];

    const validation = validateAndApplyCoupon(
      code,
      availableCoupons,
      baseAmount,
      product.id,
      phone,
      allKnownOrders
    );

    if (validation.isValid && validation.coupon) {
      setAppliedCoupon(validation.coupon);
      setCouponCodeInput(validation.coupon.code);
      setCouponFeedback({ 
        type: 'success', 
        message: validation.isFreeDelivery 
          ? `Coupon "${validation.coupon.code}" applied: Free Delivery!` 
          : `Coupon "${validation.coupon.code}" applied: Saved ₹${validation.discountAmount}!` 
      });
    } else {
      setCouponFeedback({ 
        type: 'error', 
        message: validation.errorMessage || `Coupon "${code}" is invalid or expired` 
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponFeedback(null);
  };

  // Generate UPI QR Code URL with exact store details and total amount
  const upiPayee = encodeURIComponent(storeSettings.upiPayeeName || storeSettings.shopName || 'Maknuts');
  const upiUrl = `upi://pay?pa=${storeSettings.upiId}&pn=${upiPayee}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent('Order Payment - ' + (storeSettings.shopName || 'Maknuts'))}`;

  useEffect(() => {
    if (storeSettings.upiId) {
      QRCode.toDataURL(upiUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('Failed to generate UPI QR', err));
    }
  }, [storeSettings.upiId, upiUrl]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Customer Name validation
    if (ds.checkoutShowCustomerName !== false && !customerName.trim()) {
      newErrors.customerName = 'Please enter your full name';
    }

    // Phone validation
    if (ds.checkoutShowPhone !== false) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        newErrors.phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    // Address validation (only required if enabled and required by admin)
    if (ds.checkoutShowAddress !== false && ds.checkoutRequireAddress !== false && !address.trim()) {
      newErrors.address = 'Please enter delivery address';
    }

    // Pincode validation (only required if enabled and required by admin)
    if (ds.checkoutShowPincode !== false && ds.checkoutRequirePincode !== false) {
      const cleanPin = pincode.replace(/\D/g, '');
      if (!cleanPin || cleanPin.length < 6) {
        newErrors.pincode = 'Please enter 6-digit PIN code';
      }
    }

    // Optional UTR validation when UPI is selected
    if (paymentMethod === 'upi' && upiRefNumber.trim()) {
      const cleanUtr = upiRefNumber.trim();
      // Reasonable length and character check (alphanumeric, 6 to 30 characters)
      if (!/^[a-zA-Z0-9_-]{6,30}$/.test(cleanUtr)) {
        newErrors.upiRefNumber = 'UTR / Reference ID should be 6-30 letters or digits';
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const missingFields: string[] = [];
      if (newErrors.customerName) missingFields.push('Name');
      if (newErrors.phone) missingFields.push('Mobile');
      if (newErrors.address) missingFields.push('Address');
      if (newErrors.pincode) missingFields.push('PIN Code');
      if (newErrors.upiRefNumber) missingFields.push('UTR format');
      
      setFormValidationMessage(`Please review: ${missingFields.join(', ')}`);
      
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return false;
    }

    setFormValidationMessage('');
    return true;
  };

  const handlePlaceOrder = async () => {
    // Requirement 12: Prevent duplicate order creation if double-clicked
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      // 1. Create order record in Firebase Firestore
      const effectiveName = customerName.trim() || 'Valued Customer';
      const effectivePhone = phone.trim() || storeSettings.whatsappNumber || '917801051792';
      const effectiveAddress = address.trim() || 'Direct Store Pickup';

      const order = await createOrder({
        customerName: effectiveName,
        phone: effectivePhone,
        alternatePhone: alternatePhone.trim() ? alternatePhone.trim() : undefined,
        address: effectiveAddress,
        landmark: landmark.trim() ? landmark.trim() : undefined,
        pincode: pincode.trim(),
        productId: product.id,
        productName: product.name,
        productWeight: product.weight,
        quantity,
        unitPrice,
        subtotal,
        deliveryCharge,
        totalAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        couponType: appliedCoupon ? appliedCoupon.discountType : undefined,
        couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
        paymentMethod,
        upiRefNumber: (paymentMethod === 'upi' && upiRefNumber.trim()) ? upiRefNumber.trim() : undefined,
        note: note.trim() ? note.trim() : '',
      });

      // 2. Format WhatsApp message using Admin configured template and URL
      const customTemplate = storeSettings.whatsAppSettings?.orderTemplate;
      const message = generateOrderWhatsAppMessage(order, storeSettings.shopName, customTemplate, ds);
      const targetPhone = storeSettings.whatsAppSettings?.businessNumber || storeSettings.whatsappNumber;
      const whatsappUrl = createWhatsAppUrl(targetPhone, message);

      // 3. Requirement 14: Open WhatsApp only ONCE after the order is successfully created
      try {
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error('Error triggering WhatsApp click', e);
      }

      // 4. Trigger success screen
      onOrderSuccess(order);
    } catch (err) {
      // Requirement 13: If order creation fails: do not open WhatsApp, show clear error, let customer retry safely
      console.error('Error placing order', err);
      setSubmissionError('Could not create order. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF8F5] w-full max-w-xl rounded-3xl shadow-2xl border border-[#E2D5C3] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E8DFCFC] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-emerald-950 font-serif">
              Complete Your Order
            </h2>
            <p className="text-xs text-stone-500">
              Quick order directly via WhatsApp · No account needed
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div ref={scrollContainerRef} className="p-5 overflow-y-auto space-y-6">

          {/* Section 1: Product & Quantity */}
          {ds.checkoutShowProductCard !== false && (
            <div className="bg-white p-4 rounded-2xl border border-[#E9DFD1] shadow-xs">
              <div className="flex items-center gap-3.5">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-contain rounded-xl bg-[#FAF8F5] p-1 border border-stone-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-stone-900 truncate font-serif">
                    {product.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Pack: {product.weight} · <span className="font-bold text-stone-900">₹{unitPrice}</span>
                    {product.originalPrice > unitPrice && (
                      <span className="line-through text-stone-400 ml-1.5">₹{product.originalPrice}</span>
                    )}
                  </p>
                  <div className="text-xs font-semibold text-emerald-800 mt-1">
                    Base Amount: ₹{baseAmount}
                  </div>
                </div>

                {/* Quantity Stepper (Bounded by admin rules) */}
                {ds.checkoutShowQuantityStepper !== false && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
                      <button
                        type="button"
                        onClick={() => setQuantity(q => (q > minQty ? q - 1 : minQty))}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs text-sm font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        disabled={quantity <= minQty || isSubmitting}
                        title={quantity <= minQty ? `Minimum order quantity is ${minQty}` : 'Decrease quantity'}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-stone-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => (q < maxQty ? q + 1 : maxQty))}
                        disabled={quantity >= maxQty || isSubmitting}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs text-sm font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        title={quantity >= maxQty ? `Maximum order quantity is ${maxQty}` : 'Increase quantity'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {(minQty > 1 || maxQty < 20) && (
                      <span className="text-[10px] text-stone-400 font-medium">
                        Limit: {minQty}–{maxQty}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Pan-India Delivery Banner */}
          {ds.checkoutShowEstimatedDelivery !== false && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 font-medium">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{ds.checkoutEstimatedDeliveryText || 'Dispatched within 24 hours · Delivery in 2-4 business days across India'}</span>
            </div>
          )}

          {/* Section 2: Delivery Details Form */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                1. Delivery Information
              </label>
              <span className="text-[11px] text-stone-400">
                {ds.checkoutRequireAddress !== false ? 'Required for dispatch' : 'Express Checkout'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              {ds.checkoutShowCustomerName !== false && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    disabled={isSubmitting}
                    onChange={e => {
                      setCustomerName(e.target.value);
                      if (errors.customerName) setErrors({ ...errors, customerName: '' });
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 ${
                      errors.customerName ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                    }`}
                  />
                  {errors.customerName && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.customerName}
                    </p>
                  )}
                </div>
              )}

              {/* Mobile Number */}
              {ds.checkoutShowPhone !== false && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mobile Number (WhatsApp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      disabled={isSubmitting}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 ${
                        errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Optional Alternate Phone */}
              {ds.checkoutShowAlternatePhone === true && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Alternate Mobile / Contact <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9811223344"
                    value={alternatePhone}
                    disabled={isSubmitting}
                    onChange={e => setAlternatePhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              )}
            </div>

            {/* Address */}
            {ds.checkoutShowAddress !== false && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Delivery Address (House/Flat No, Street, Area, City) {ds.checkoutRequireAddress !== false ? '*' : '(Optional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flat 302, Green Park Residency, Near Gandhi Chowk, Patna, Bihar"
                  value={address}
                  disabled={isSubmitting}
                  onChange={e => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({ ...errors, address: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 ${
                    errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.address}
                  </p>
                )}
              </div>
            )}

            {/* Landmark & PIN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Landmark */}
              {ds.checkoutShowLandmark !== false && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Landmark / Floor / Apt <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opp. City Mall, 3rd Floor"
                    value={landmark}
                    disabled={isSubmitting}
                    onChange={e => setLandmark(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              )}

              {/* PIN Code */}
              {ds.checkoutShowPincode !== false && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Postal PIN Code {ds.checkoutRequirePincode !== false ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 846004"
                    value={pincode}
                    disabled={isSubmitting}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPincode(val);
                      if (errors.pincode) setErrors({ ...errors, pincode: '' });
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 ${
                      errors.pincode ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                    }`}
                  />
                  {errors.pincode && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.pincode}
                    </p>
                  )}
                </div>
              )}

              {/* Optional Delivery Note */}
              {ds.checkoutShowCustomerNote !== false && (
                <div className={ds.checkoutShowLandmark === false || ds.checkoutShowPincode === false ? 'sm:col-span-1' : 'sm:col-span-2'}>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Optional Delivery Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please call before arriving or leave with security"
                    value={note}
                    disabled={isSubmitting}
                    onChange={e => setNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Coupon Code Section */}
          {ds.checkoutShowCouponInput !== false && (
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Apply Coupon / Promo Code</span>
                </label>
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                  >
                    Remove Coupon
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold px-2 py-0.5 rounded bg-emerald-800 text-white text-[11px]">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-emerald-900 font-semibold">
                      {appliedCoupon.discountType === 'free_delivery'
                        ? 'Free Delivery Activated'
                        : `₹${couponDiscount} Discount Applied`}
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-emerald-700" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10, MAKNUTS50"
                    value={couponCodeInput}
                    disabled={isSubmitting}
                    onChange={e => {
                      setCouponCodeInput(e.target.value.toUpperCase());
                      if (couponFeedback) setCouponFeedback(null);
                    }}
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs uppercase font-mono font-bold text-stone-900 placeholder:normal-case placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={!couponCodeInput.trim() || isSubmitting}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Quick Coupon Suggestions */}
              {!appliedCoupon && storeSettings.coupons && storeSettings.coupons.filter(c => c.enabled).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-stone-500 font-medium">Offers:</span>
                  {storeSettings.coupons.filter(c => c.enabled).slice(0, 3).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleApplyCoupon(c.code)}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-stone-200 rounded-lg text-[10px] font-mono font-bold text-stone-700 cursor-pointer transition-colors"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              )}

              {/* Feedback message */}
              {couponFeedback && (
                <p className={`text-[11px] font-semibold flex items-center gap-1 pt-0.5 ${
                  couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {couponFeedback.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{couponFeedback.message}</span>
                </p>
              )}
            </div>
          )}

          {/* Section 3: Order Summary with Full Pricing Breakdown */}
          {ds.checkoutShowPriceBreakdown !== false && (
            <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E6DCce] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                  2. Price Breakdown
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  {quantity} {quantity === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Base Amount */}
              {ds.checkoutShowBaseAmount !== false && (
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Product Price ({quantity} × ₹{unitPrice}):</span>
                  <span className="font-semibold text-stone-900">₹{baseAmount}</span>
                </div>
              )}

              {/* Discount Row (If applied) */}
              {ds.checkoutShowStoreDiscount !== false && discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-800 font-semibold bg-emerald-50/80 -mx-1 px-1.5 py-1 rounded-lg border border-emerald-200/60">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-700" />
                    <span>Store Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}:</span>
                  </span>
                  <span>−₹{discountAmount}</span>
                </div>
              )}

              {/* Coupon Discount Row (If applied) */}
              {ds.checkoutShowCouponDiscount !== false && couponDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-800 font-semibold bg-emerald-50 -mx-1 px-1.5 py-1 rounded-lg border border-emerald-300">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-emerald-700" />
                    <span>Coupon Discount ({couponCode}):</span>
                  </span>
                  <span>−₹{couponDiscount}</span>
                </div>
              )}

              {/* Subtotal */}
              {ds.checkoutShowSubtotal !== false && (
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-stone-900">₹{subtotal}</span>
                </div>
              )}

              {/* Delivery Charge */}
              {ds.checkoutShowDeliveryCharge !== false && (
                <div className="flex justify-between text-xs text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <span>Delivery:</span>
                    {isFreeDelivery && (
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        FREE Delivery
                      </span>
                    )}
                  </span>
                  <span className={`font-semibold ${isFreeDelivery ? 'text-emerald-700 font-bold' : 'text-stone-900'}`}>
                    {isFreeDelivery ? 'FREE (₹0)' : `₹${deliveryCharge}`}
                  </span>
                </div>
              )}

              {/* Free Delivery incentive if not yet free */}
              {ds.checkoutShowDeliveryIncentive !== false && !isFreeDelivery && storeSettings.freeDeliveryThreshold > 0 && subtotal < storeSettings.freeDeliveryThreshold && (
                <div className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl px-2.5 py-1 flex items-center justify-between">
                  <span>Add ₹{Math.max(0, storeSettings.freeDeliveryThreshold - subtotal)} more for Free Delivery!</span>
                  <span className="text-[10px] text-amber-700 font-bold">(Eligible at ₹{storeSettings.freeDeliveryThreshold})</span>
                </div>
              )}

              {/* Total Payable Amount */}
              <div className="pt-2.5 border-t border-[#DFD3C1] flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-extrabold text-emerald-950 block">
                    Final Payable Amount:
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Inclusive of all taxes & delivery
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-emerald-900 font-serif">
                  ₹{finalTotal}
                </span>
              </div>

              {/* Total Savings banner */}
              {ds.checkoutShowTotalSavings !== false && totalSavings > 0 && (
                <div className="mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300/80 rounded-xl py-1.5 px-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>You save ₹{totalSavings} on this order!</span>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Payment Options (Only UPI and COD) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
              3. Choose Payment Method
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* UPI Option */}
              {isUpiAllowed && (
                <label 
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-700 bg-emerald-50/50 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs sm:text-sm text-stone-900">
                        UPI Payment
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      disabled={isSubmitting}
                      className="text-emerald-700 focus:ring-emerald-700"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Pay via GPay, PhonePe, Paytm, or any UPI app
                  </p>
                </label>
              )}

              {/* Cash On Delivery Option */}
              {isCodAllowed && (
                <label 
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-700 bg-emerald-50/50 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-xs sm:text-sm text-stone-900">
                        Cash On Delivery
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      disabled={isSubmitting}
                      className="text-amber-700 focus:ring-amber-700"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Pay cash in hand when order arrives
                  </p>
                </label>
              )}
            </div>

            {/* UPI Details Box (Shown when UPI is selected) */}
            {paymentMethod === 'upi' && isUpiAllowed && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3.5 mt-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-800" />
                    <span>UPI Payment Details</span>
                  </span>
                  {ds.checkoutShowUpiQr !== false && (
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-stone-200 shadow-xs cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showQrCode ? 'Hide QR' : 'Show QR Code'}</span>
                    </button>
                  )}
                </div>

                {/* Configured UPI ID Row */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                      Configured UPI ID:
                    </span>
                    <span className="font-mono font-bold text-sm sm:text-base text-emerald-950 select-all">
                      {storeSettings.upiId}
                    </span>
                    {storeSettings.upiPayeeName && (
                      <span className="block text-[11px] text-stone-500 mt-0.5">
                        Payee: {storeSettings.upiPayeeName}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{storeSettings.buttons.copyUpi || 'Copy UPI ID'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Working UPI QR Code with exact amount and details */}
                {ds.checkoutShowUpiQr !== false && showQrCode && qrCodeDataUrl && (
                  <div className="bg-white p-4 rounded-xl border border-stone-200 text-center flex flex-col items-center">
                    <img
                      src={qrCodeDataUrl}
                      alt="UPI QR Code"
                      referrerPolicy="no-referrer"
                      className="w-44 h-44 rounded-lg shadow-xs"
                    />
                    <p className="text-xs font-bold text-emerald-950 mt-2">
                      Scan to Pay ₹{totalAmount}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Works with Google Pay, PhonePe, Paytm, BHIM or any banking app
                    </p>
                  </div>
                )}

                {/* Requirement 2: Pay with UPI App button */}
                <div>
                  <a
                    href={upiUrl}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                    <span>Pay with UPI App (GPay, PhonePe, Paytm, BHIM)</span>
                  </a>
                </div>

                {/* Requirement 4: Optional UPI Transaction ID / UTR Number */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    UPI Transaction ID / UTR Number <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 429381928371"
                    value={upiRefNumber}
                    disabled={isSubmitting}
                    onChange={e => {
                      setUpiRefNumber(e.target.value);
                      if (errors.upiRefNumber) setErrors({ ...errors, upiRefNumber: '' });
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-white border text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 font-mono ${
                      errors.upiRefNumber ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                    }`}
                  />
                  {errors.upiRefNumber && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.upiRefNumber}
                    </p>
                  )}
                </div>

                {/* Requirement 5: Clear notice about WhatsApp screenshot verification */}
                {ds.checkoutShowUpiVerificationNote !== false && (
                  <div className="p-3 bg-emerald-900/5 rounded-xl border border-emerald-800/15 text-emerald-950 text-xs flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Payment Verification:</strong> After placing the order, you may send your payment screenshot on WhatsApp for verification.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Bottom Actions */}
        <div className="p-4 bg-white border-t border-[#E8DFCFC] shrink-0 space-y-2.5">
          {formValidationMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formValidationMessage}</span>
            </div>
          )}

          {submissionError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* Main Action Button with loading state and double-click protection */}
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-base sm:text-lg shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-emerald-700"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 text-amber-300 animate-spin" />
                <span>Creating Order...</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-6 h-6 text-amber-300 fill-emerald-900" />
                <span>{ds.checkoutSubmitButtonText || storeSettings.buttons?.whatsappOrder || 'PLACE ORDER ON WHATSAPP'}</span>
                <span className="text-emerald-200 text-sm font-normal">
                  (₹{totalAmount})
                </span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-stone-500">
            A WhatsApp chat with pre-filled order details will open. Just press Send to confirm!
          </p>
        </div>
      </div>
    </div>
  );
};
