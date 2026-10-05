import React, { useState, useEffect } from 'react';
import { Product, StoreSettings, Order } from '../types';
import { useStore } from '../context/StoreContext';
import { 
  X, Check, Copy, Upload, Image, ArrowRight, ShieldCheck, 
  CreditCard, Banknote, QrCode, AlertCircle, Sparkles, MessageCircle, ExternalLink, Plus, Minus
} from 'lucide-react';
import QRCode from 'qrcode';
import { generateOrderWhatsAppMessage, createWhatsAppUrl } from '../utils/whatsapp';

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
  const { storeSettings, createOrder } = useStore();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [note, setNote] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>(undefined);
  const [screenshotName, setScreenshotName] = useState<string>('');

  // UI state
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValidationMessage, setFormValidationMessage] = useState<string>('');
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Sync initial quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity > 0 ? initialQuantity : 1);
      setErrors({});
    }
  }, [isOpen, initialQuantity]);

  // If UPI disabled by admin, fallback to COD, or vice versa
  useEffect(() => {
    if (!storeSettings.enableUpi && storeSettings.enableCod) {
      setPaymentMethod('cod');
    } else if (storeSettings.enableUpi && !storeSettings.enableCod) {
      setPaymentMethod('upi');
    }
  }, [storeSettings.enableUpi, storeSettings.enableCod]);

  // Calculations
  const unitPrice = product.price;
  const subtotal = unitPrice * quantity;
  const deliveryCharge = (storeSettings.freeDeliveryThreshold > 0 && subtotal >= storeSettings.freeDeliveryThreshold)
    ? 0
    : storeSettings.deliveryCharge;
  const totalAmount = subtotal + deliveryCharge;

  // Generate UPI QR Code URL
  useEffect(() => {
    if (storeSettings.upiId) {
      // standard UPI payment intent string
      const payeeName = encodeURIComponent(storeSettings.upiPayeeName || storeSettings.shopName);
      const upiUrl = `upi://pay?pa=${storeSettings.upiId}&pn=${payeeName}&am=${totalAmount}&cu=INR&tn=Order%20Payment`;
      
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
  }, [storeSettings.upiId, storeSettings.upiPayeeName, storeSettings.shopName, totalAmount]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshotDataUrl(undefined);
    setScreenshotName('');
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Please enter your full name';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!address.trim()) {
      newErrors.address = 'Please enter delivery address';
    }

    const cleanPin = pincode.replace(/\D/g, '');
    if (!cleanPin || cleanPin.length < 6) {
      newErrors.pincode = 'Please enter 6-digit PIN code';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const missingFields: string[] = [];
      if (newErrors.customerName) missingFields.push('Name');
      if (newErrors.phone) missingFields.push('Mobile');
      if (newErrors.address) missingFields.push('Address');
      if (newErrors.pincode) missingFields.push('PIN Code');
      
      setFormValidationMessage(`Please fill in required fields: ${missingFields.join(', ')}`);
      
      // Auto-scroll modal container to top so customer sees fields
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return false;
    }

    setFormValidationMessage('');
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create order record in Firebase Firestore
      const order = await createOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        productId: product.id,
        productName: product.name,
        productWeight: product.weight,
        quantity,
        unitPrice,
        subtotal,
        deliveryCharge,
        totalAmount,
        paymentMethod,
        upiRefNumber: upiRefNumber.trim() ? upiRefNumber.trim() : '',
        paymentScreenshot: screenshotDataUrl || '',
        note: note.trim() ? note.trim() : '',
      });

      // 2. Format WhatsApp message and URL
      const message = generateOrderWhatsAppMessage(order, storeSettings.shopName);
      const whatsappUrl = createWhatsAppUrl(storeSettings.whatsappNumber, message);

      // 3. Open WhatsApp via direct anchor dispatch (bypasses browser popup blockers)
      try {
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error('Link click error', e);
      }

      // Also attempt window.open
      try {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.error('Window open error', e);
      }

      // 4. Trigger success screen with direct link as guaranteed fallback
      onOrderSuccess(order);
    } catch (err) {
      console.error('Error placing order', err);
      alert('Could not place order. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Pack: {product.weight} · ₹{product.price} each
                </p>
                <div className="text-xs font-semibold text-emerald-800 mt-1">
                  Subtotal: ₹{quantity * product.price}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setQuantity(q => (q > 1 ? q - 1 : 1))}
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs text-sm font-bold disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-sm text-stone-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs text-sm font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Details Form */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                1. Delivery Information
              </label>
              <span className="text-[11px] text-stone-400">All fields required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
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

              {/* Mobile Number */}
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
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Delivery Address (House/Flat No, Street, Landmark, City) *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Flat 302, Green Park Residency, Near Gandhi Chowk, Patna, Bihar"
                value={address}
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

            {/* PIN Code & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Postal PIN Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 846004"
                  value={pincode}
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Optional Delivery Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call before delivery"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Order Summary */}
          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E6DCce] space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">
              2. Order Summary
            </div>
            <div className="flex justify-between text-xs text-stone-600">
              <span>{product.name} ({quantity} x ₹{unitPrice}):</span>
              <span className="font-semibold text-stone-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-stone-600">
              <span className="flex items-center gap-1">
                Delivery Charge:
                {deliveryCharge === 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 rounded">
                    Free Delivery
                  </span>
                )}
              </span>
              <span className="font-semibold text-stone-900">
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
            <div className="pt-2 border-t border-[#DFD3C1] flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-emerald-950">
                Total Payable Amount:
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-900 font-serif">
                ₹{totalAmount}
              </span>
            </div>
          </div>

          {/* Section 4: Payment Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
              3. Choose Payment Method
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Manual UPI Option */}
              {storeSettings.enableUpi && (
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
                        Manual UPI Payment
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="text-emerald-700 focus:ring-emerald-700"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Pay via GPay, PhonePe, Paytm or BHIM UPI
                  </p>
                </label>
              )}

              {/* Cash On Delivery Option */}
              {storeSettings.enableCod && (
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
            {paymentMethod === 'upi' && storeSettings.enableUpi && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3 mt-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Manual UPI Transfer Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-stone-200 shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQrCode ? 'Hide QR' : 'Show QR Code'}</span>
                  </button>
                </div>

                {/* UPI ID Row */}
                <div className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                      Pay to UPI ID:
                    </span>
                    <span className="font-mono font-bold text-sm sm:text-base text-emerald-950 select-all">
                      {storeSettings.upiId}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
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

                {/* QR Code expansion */}
                {showQrCode && qrCodeDataUrl && (
                  <div className="bg-white p-4 rounded-xl border border-stone-200 text-center flex flex-col items-center">
                    <img
                      src={qrCodeDataUrl}
                      alt="UPI QR Code"
                      referrerPolicy="no-referrer"
                      className="w-44 h-44 rounded-lg shadow-xs"
                    />
                    <p className="text-[11px] font-semibold text-stone-700 mt-2">
                      Scan with Google Pay, PhonePe, Paytm, BHIM to pay ₹{totalAmount}
                    </p>
                  </div>
                )}

                {/* Mobile Direct Pay Deep Link */}
                <div className="text-center">
                  <a
                    href={`upi://pay?pa=${storeSettings.upiId}&pn=${encodeURIComponent(storeSettings.upiPayeeName)}&am=${totalAmount}&cu=INR`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline py-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Installed UPI App on this phone</span>
                  </a>
                </div>

                {/* Optional UPI Ref Number */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    UPI Transaction / Reference Number (UTR) <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 429381928371 or UTR"
                    value={upiRefNumber}
                    onChange={e => setUpiRefNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 font-mono"
                  />
                </div>

                {/* Optional Screenshot Upload */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Upload Payment Screenshot <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  
                  {screenshotDataUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-300">
                      <img
                        src={screenshotDataUrl}
                        alt="Payment Proof"
                        className="w-12 h-12 object-cover rounded-lg border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-stone-800 truncate">
                          {screenshotName || 'Screenshot attached'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Ready to share
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="text-xs text-rose-600 hover:text-rose-800 p-1.5"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-stone-300 hover:border-emerald-600 rounded-xl cursor-pointer transition-colors text-xs text-stone-600">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <span>Select Screenshot Image (PNG, JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Bottom Actions */}
        <div className="p-4 bg-white border-t border-[#E8DFCFC] shrink-0 space-y-2.5">
          {formValidationMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formValidationMessage}</span>
            </div>
          )}

          {/* Main Action Button */}
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-emerald-700"
          >
            <MessageCircle className="w-6 h-6 text-amber-300 fill-emerald-900" />
            <span>{storeSettings.buttons.whatsappOrder || 'PLACE ORDER ON WHATSAPP'}</span>
            <span className="text-emerald-200 text-sm font-normal">
              (₹{totalAmount})
            </span>
          </button>

          <p className="text-[11px] text-center text-stone-500">
            A WhatsApp chat with pre-filled order details will open. Just press Send to confirm!
          </p>
        </div>
      </div>
    </div>
  );
};
