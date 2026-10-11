import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { OrderTrackingInfo } from '../types';
import { 
  Search, X, Truck, Package, CheckCircle2, Clock, 
  ExternalLink, MessageCircle, AlertCircle, 
  Phone, Copy, Check, Calendar, Hash, RefreshCw, ShieldCheck
} from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  initialPhone?: string;
  initialQuery?: string;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = '',
  initialPhone = '',
  initialQuery = '',
}) => {
  const { trackCustomerOrder, storeSettings, products } = useStore();

  // Inputs strictly requiring Exact Order ID + Exact 10-digit registered mobile number
  const [orderIdInput, setOrderIdInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // States
  const [trackedOrder, setTrackedOrder] = useState<OrderTrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Synchronize initial parameters when modal opens
  useEffect(() => {
    if (isOpen) {
      // Determine initial order ID from initialOrderId or initialQuery
      let startOrderId = initialOrderId || '';
      let startPhone = initialPhone || '';

      if (!startOrderId && initialQuery) {
        const cleanQ = initialQuery.trim();
        // If it looks like an order number (e.g. MK10001 or ord-...)
        if (cleanQ.toUpperCase().startsWith('MK') || cleanQ.startsWith('#') || cleanQ.toLowerCase().startsWith('ord')) {
          startOrderId = cleanQ.replace(/^#/, '');
        } else if (/^\d{10}$/.test(cleanQ)) {
          startPhone = cleanQ;
        }
      }

      setOrderIdInput(startOrderId);
      setPhoneInput(startPhone);
      setErrorMessage('');

      // Auto-trigger if both exact fields are already provided (e.g. redirected right after checkout)
      if (startOrderId && startPhone && startPhone.replace(/\D/g, '').length >= 10) {
        performTracking(startOrderId, startPhone);
      } else {
        setTrackedOrder(null);
        setHasSearched(false);
      }
    } else {
      // Reset state when closing
      setTrackedOrder(null);
      setHasSearched(false);
      setErrorMessage('');
      setIsLoading(false);
    }
  }, [isOpen, initialOrderId, initialPhone, initialQuery]);

  if (!isOpen) return null;

  const performTracking = async (orderIdVal: string, phoneVal: string) => {
    const cleanOrderId = orderIdVal.trim().replace(/^#/, '');
    const cleanPhone = phoneVal.replace(/\D/g, '');

    // Requirement 4 & 5: Do NOT allow partial inputs or tracking by name / partial phone
    if (!cleanOrderId) {
      setErrorMessage('Please enter your exact Order ID (e.g. MK10001).');
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter your complete 10-digit registered mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    try {
      const result = await trackCustomerOrder(cleanOrderId, cleanPhone);
      if (result) {
        setTrackedOrder(result);
        setErrorMessage('');
      } else {
        setTrackedOrder(null);
        setErrorMessage('Order ID or mobile number does not match. Please verify your exact Order ID and registered mobile number.');
      }
    } catch (err) {
      console.error('Tracking query error:', err);
      setTrackedOrder(null);
      setErrorMessage('Order not found. Please verify your exact Order ID and 10-digit registered mobile number.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performTracking(orderIdInput, phoneInput);
  };

  const handleResetSearch = () => {
    setTrackedOrder(null);
    setHasSearched(false);
    setErrorMessage('');
    setOrderIdInput('');
    setPhoneInput('');
  };

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Stepper progress index
  const getStepIndex = (status: OrderTrackingInfo['status']) => {
    switch (status) {
      case 'Pending':
        return 0; // Order Placed
      case 'Confirmed':
        return 1; // Confirmed & Packing
      case 'Shipped':
        return 2; // Dispatched & In Transit
      case 'Delivered':
        return 3; // Delivered
      case 'Cancelled':
        return -1; // Cancelled
      default:
        return 0;
    }
  };

  // Build Courier tracking portal URL fallback if not manually provided
  const getCourierDirectLink = (courierName?: string, awb?: string, customUrl?: string) => {
    if (customUrl) return customUrl;
    if (!awb || !courierName) return null;

    const lower = courierName.toLowerCase();
    if (lower.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${awb}`;
    }
    if (lower.includes('blue dart') || lower.includes('bluedart')) {
      return `https://www.bluedart.com/tracking?trackNumber=${awb}`;
    }
    if (lower.includes('dtdc')) {
      return `https://www.dtdc.in/tracking/tracking_results.asp?trkType=awb&strCnno=${awb}`;
    }
    if (lower.includes('india post') || lower.includes('speed post')) {
      return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    }
    if (lower.includes('shiprocket')) {
      return `https://shiprocket.co/tracking/${awb}`;
    }
    if (lower.includes('shadowfax')) {
      return `https://tracker.shadowfax.in/#/track?awb=${awb}`;
    }
    if (lower.includes('ekart')) {
      return `https://ekartlogistics.com/shipmenttrack/${awb}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(`${courierName} tracking ${awb}`)}`;
  };

  // Find product thumbnail
  const getProductImage = (productId: string) => {
    const found = products.find(p => p.id === productId);
    return found?.image || '';
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F5] w-full max-w-xl rounded-3xl shadow-2xl border border-[#E2D5C3] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <Truck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white font-serif">
                Track Your Order
              </h3>
              <p className="text-xs text-emerald-200/90">
                Secure delivery tracking for {storeSettings.shopName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close tracking"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Search Form (Requires Exact Order ID + Exact 10-Digit Mobile Number) */}
          <form onSubmit={handleSearchSubmit} className="space-y-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Customer Verification Required
              </span>
              {trackedOrder && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  Track Different Order
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field 1: Exact Order ID */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Order ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
                    placeholder="e.g. MK10001"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Field 2: Exact Registered Mobile Number */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Registered Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-stone-500">
                Enter the exact Order ID and 10-digit phone used during order placement.
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 text-amber-300" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{errorMessage}</p>
                  <p className="text-[11px] text-rose-700/80 mt-0.5">
                    Make sure there are no typos in the Order ID or phone number.
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
              <p className="font-bold text-sm text-stone-800">
                Verifying Order & Live Tracking...
              </p>
              <p className="text-xs text-stone-500">
                Querying authenticated shipment data from {storeSettings.shopName}
              </p>
            </div>
          )}

          {/* Verified Order Tracking Display */}
          {!isLoading && trackedOrder && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Order Status Header Card */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Order Reference
                    </span>
                    <h4 className="text-xl font-black text-emerald-950 font-mono tracking-tight">
                      #{trackedOrder.orderNumber}
                    </h4>
                    {trackedOrder.phoneLast4 && (
                      <span className="text-[10px] text-emerald-700 font-semibold inline-flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified mobile: ••••••{trackedOrder.phoneLast4}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${
                      trackedOrder.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : trackedOrder.status === 'Shipped'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : trackedOrder.status === 'Confirmed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : trackedOrder.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {trackedOrder.status === 'Delivered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {trackedOrder.status === 'Shipped' && <Truck className="w-3.5 h-3.5" />}
                      {trackedOrder.status === 'Confirmed' && <Package className="w-3.5 h-3.5" />}
                      {trackedOrder.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                      {trackedOrder.status === 'Cancelled' && <AlertCircle className="w-3.5 h-3.5" />}
                      {trackedOrder.status === 'Pending' ? 'Order Received' : trackedOrder.status}
                    </span>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Placed on {new Date(trackedOrder.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Cancelled Notice */}
                {trackedOrder.status === 'Cancelled' ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">This order has been cancelled.</span>
                      {trackedOrder.statusNotes && <p className="mt-0.5">{trackedOrder.statusNotes}</p>}
                    </div>
                  </div>
                ) : (
                  /* Shipment Progress Stepper */
                  <div className="pt-2 pb-1">
                    <div className="grid grid-cols-4 gap-1 relative">
                      {/* Stepper bar backgrounds */}
                      <div className="absolute top-3.5 left-[12%] right-[12%] h-1 bg-stone-200 -z-0">
                        <div 
                          className="h-full bg-emerald-600 transition-all duration-500"
                          style={{
                            width: `${
                              getStepIndex(trackedOrder.status) === 0 ? '0%' :
                              getStepIndex(trackedOrder.status) === 1 ? '33%' :
                              getStepIndex(trackedOrder.status) === 2 ? '66%' : '100%'
                            }`
                          }}
                        />
                      </div>

                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-stone-800 mt-1.5 leading-tight">
                          Placed
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {new Date(trackedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {/* Step 2: Packed */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-colors ${
                          getStepIndex(trackedOrder.status) >= 1
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {getStepIndex(trackedOrder.status) >= 1 ? <Check className="w-3.5 h-3.5" /> : '2'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 leading-tight ${
                          getStepIndex(trackedOrder.status) >= 1 ? 'text-stone-800' : 'text-stone-400'
                        }`}>
                          Packed
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {getStepIndex(trackedOrder.status) >= 1 ? 'Verified' : 'In Queue'}
                        </span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-colors ${
                          getStepIndex(trackedOrder.status) >= 2
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {getStepIndex(trackedOrder.status) >= 2 ? <Truck className="w-3.5 h-3.5" /> : '3'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 leading-tight ${
                          getStepIndex(trackedOrder.status) >= 2 ? 'text-stone-800' : 'text-stone-400'
                        }`}>
                          Shipped
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {trackedOrder.courierName || (getStepIndex(trackedOrder.status) >= 2 ? 'In Transit' : 'Pending')}
                        </span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-colors ${
                          getStepIndex(trackedOrder.status) >= 3
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {getStepIndex(trackedOrder.status) >= 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '4'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 leading-tight ${
                          getStepIndex(trackedOrder.status) >= 3 ? 'text-stone-800' : 'text-stone-400'
                        }`}>
                          Delivered
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {trackedOrder.status === 'Delivered' ? 'Completed' : 'Expected'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Courier & AWB Tracking Box (if tracking details present) */}
              {(trackedOrder.trackingNumber || trackedOrder.courierName || trackedOrder.estimatedDelivery || trackedOrder.statusNotes) && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50/50 border border-emerald-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                      <Truck className="w-4 h-4 text-emerald-700" />
                      Shipment Details
                    </span>
                    {trackedOrder.courierName && (
                      <span className="text-[11px] font-bold bg-white text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        {trackedOrder.courierName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {trackedOrder.trackingNumber && (
                      <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase">AWB / Tracking Number</span>
                          <p className="font-mono font-black text-sm text-stone-900 mt-0.5">
                            {trackedOrder.trackingNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyAwb(trackedOrder.trackingNumber || '')}
                          className="p-1.5 bg-stone-100 hover:bg-emerald-100 rounded-lg text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer"
                          title="Copy AWB Number"
                        >
                          {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {trackedOrder.estimatedDelivery && (
                      <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          Estimated Delivery
                        </span>
                        <p className="font-bold text-stone-900 mt-0.5">
                          {trackedOrder.estimatedDelivery}
                        </p>
                      </div>
                    )}
                  </div>

                  {trackedOrder.statusNotes && (
                    <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 text-xs text-stone-700">
                      <span className="font-bold text-stone-900 block text-[10px] uppercase text-stone-400">Latest Remarks</span>
                      {trackedOrder.statusNotes}
                    </div>
                  )}

                  {/* Direct Courier Website Link */}
                  {trackedOrder.trackingNumber && (
                    <div className="pt-1">
                      <a
                        href={getCourierDirectLink(trackedOrder.courierName, trackedOrder.trackingNumber, trackedOrder.trackingUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <span>Track Directly on {trackedOrder.courierName || 'Courier'} Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items & Total Summary (Requirement 7 - NO Address Exposed!) */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <h5 className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                  Order Summary
                </h5>

                <div className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                  {getProductImage(trackedOrder.productId) ? (
                    <img
                      src={getProductImage(trackedOrder.productId)}
                      alt={trackedOrder.productName}
                      className="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-stone-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-lg shrink-0">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h6 className="font-bold text-sm text-stone-900 truncate">
                      {trackedOrder.productName}
                    </h6>
                    <p className="text-xs text-stone-500">
                      Pack: {trackedOrder.productWeight} • Qty: {trackedOrder.quantity} {trackedOrder.quantity > 1 ? 'packs' : 'pack'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs font-black text-emerald-950">
                        Total: ₹{trackedOrder.totalAmount}
                      </span>
                      <span className="text-[10px] font-bold text-stone-700 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
                        {trackedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}
                      </span>
                      {trackedOrder.paymentStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          trackedOrder.paymentStatus === 'Paid / Verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : trackedOrder.paymentStatus === 'Verification Required'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : trackedOrder.paymentStatus === 'COD Collected'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : trackedOrder.paymentStatus === 'COD Pending'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : trackedOrder.paymentStatus === 'Refunded'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : trackedOrder.paymentStatus === 'Failed'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-stone-50 text-stone-700 border-stone-300'
                        }`}>
                          Payment: {trackedOrder.paymentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Customer Support Assistance */}
              <div className="pt-1">
                <a
                  href={createWhatsAppUrl(
                    storeSettings.whatsappNumber,
                    `Hi ${storeSettings.shopName} team, I am checking the status of my Order #${trackedOrder.orderNumber}. Please provide an update.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Have questions? WhatsApp Maknuts Support</span>
                </a>
              </div>
            </div>
          )}

          {/* Quick FAQ / Info when no search active */}
          {!hasSearched && !trackedOrder && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-2 text-stone-700">
              <p className="font-bold text-emerald-950 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-800" />
                How order tracking works:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                <li>Orders are verified and packed fresh within 12–24 hours from Mithila, Bihar.</li>
                <li>Shipped across India via premium courier partners (Delhivery, Blue Dart, DTDC).</li>
                <li>Enter your exact <strong>Order ID</strong> (from your WhatsApp message) and your <strong>10-digit mobile number</strong> to see live tracking.</li>
                <li>Your personal data and address are kept strictly private.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
