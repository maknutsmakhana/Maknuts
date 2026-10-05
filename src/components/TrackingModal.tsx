import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { 
  Search, X, Truck, Package, CheckCircle2, Clock, 
  MapPin, ExternalLink, MessageCircle, AlertCircle, 
  Phone, Copy, Check, ChevronRight, Calendar, ArrowRight
} from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const { orders, storeSettings, products } = useStore();

  const [query, setQuery] = useState(initialQuery);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [matchingOrders, setMatchingOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Sync initial query
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
        executeSearch(initialQuery);
      } else if (orders.length > 0 && !hasSearched) {
        // Don't auto-search everything, wait for customer input
      }
    } else {
      setHasSearched(false);
      setSelectedOrder(null);
      setMatchingOrders([]);
    }
  }, [isOpen, initialQuery, orders]);

  if (!isOpen) return null;

  const executeSearch = (searchVal: string) => {
    const clean = searchVal.trim().toLowerCase();
    if (!clean) {
      setMatchingOrders([]);
      setSelectedOrder(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    // Clean numeric query for phone / order number
    const numericOnly = clean.replace(/\D/g, '');

    const results = orders.filter((o) => {
      const matchOrderNum = o.orderNumber.toLowerCase().includes(clean);
      const matchId = o.id.toLowerCase().includes(clean);
      const matchPhone = numericOnly.length >= 4 && o.phone.replace(/\D/g, '').includes(numericOnly);
      const matchCustomer = o.customerName.toLowerCase().includes(clean);
      return matchOrderNum || matchId || matchPhone || matchCustomer;
    });

    setMatchingOrders(results);
    if (results.length === 1) {
      setSelectedOrder(results[0]);
    } else {
      setSelectedOrder(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Determine active stepper index (0 to 3)
  const getStepIndex = (status: Order['status']) => {
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

  // Find product thumbnail if available
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
                Live delivery status for {storeSettings.shopName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Search by Order ID or Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. MK10001 or 9876543210"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400 shadow-2xs font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              >
                Track Now
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              Tip: You can find your Order ID in your WhatsApp order confirmation message.
            </p>
          </form>

          {/* Results: Multiple Orders Found List */}
          {hasSearched && matchingOrders.length > 1 && !selectedOrder && (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <p className="text-xs font-bold text-stone-700">
                Found {matchingOrders.length} orders matching your search. Select one to view tracking:
              </p>
              <div className="space-y-2">
                {matchingOrders.map(order => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left p-3.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-600 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-emerald-950 font-mono">
                          #{order.orderNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'Confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 font-medium">
                        {order.productName} ({order.quantity} {order.quantity > 1 ? 'packs' : 'pack'}) • ₹{order.totalAmount}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results: Selected / Single Order Tracking Details */}
          {selectedOrder && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {matchingOrders.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-emerald-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  ← Back to all orders
                </button>
              )}

              {/* Order Status Header Card */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Order Reference
                    </span>
                    <h4 className="text-xl font-black text-emerald-950 font-mono tracking-tight">
                      #{selectedOrder.orderNumber}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${
                      selectedOrder.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedOrder.status === 'Shipped'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : selectedOrder.status === 'Confirmed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : selectedOrder.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {selectedOrder.status === 'Delivered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {selectedOrder.status === 'Shipped' && <Truck className="w-3.5 h-3.5" />}
                      {selectedOrder.status === 'Confirmed' && <Package className="w-3.5 h-3.5" />}
                      {selectedOrder.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                      {selectedOrder.status === 'Cancelled' && <AlertCircle className="w-3.5 h-3.5" />}
                      {selectedOrder.status === 'Pending' ? 'Order Received' : selectedOrder.status}
                    </span>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Message / Notice */}
                {selectedOrder.status === 'Cancelled' ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">This order has been cancelled.</span>
                      {selectedOrder.statusNotes && <p className="mt-0.5">{selectedOrder.statusNotes}</p>}
                    </div>
                  </div>
                ) : (
                  /* Visual Progress Stepper */
                  <div className="pt-2 pb-1">
                    <div className="grid grid-cols-4 gap-1 relative">
                      {/* Stepper bar backgrounds */}
                      <div className="absolute top-3.5 left-[12%] right-[12%] h-1 bg-stone-200 -z-0">
                        <div 
                          className="h-full bg-emerald-600 transition-all duration-500"
                          style={{
                            width: `${
                              getStepIndex(selectedOrder.status) === 0 ? '0%' :
                              getStepIndex(selectedOrder.status) === 1 ? '33%' :
                              getStepIndex(selectedOrder.status) === 2 ? '66%' : '100%'
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
                          {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {/* Step 2: Confirmed */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-colors ${
                          getStepIndex(selectedOrder.status) >= 1
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {getStepIndex(selectedOrder.status) >= 1 ? <Check className="w-3.5 h-3.5" /> : '2'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 leading-tight ${
                          getStepIndex(selectedOrder.status) >= 1 ? 'text-stone-800' : 'text-stone-400'
                        }`}>
                          Packed
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {getStepIndex(selectedOrder.status) >= 1 ? 'Ready' : 'Pending'}
                        </span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-colors ${
                          getStepIndex(selectedOrder.status) >= 2
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {getStepIndex(selectedOrder.status) >= 2 ? <Truck className="w-3.5 h-3.5" /> : '3'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 leading-tight ${
                          getStepIndex(selectedOrder.status) >= 2 ? 'text-stone-800' : 'text-stone-400'
                        }`}>
                          Shipped
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {selectedOrder.courierName || (getStepIndex(selectedOrder.status) >= 2 ? 'In Transit' : 'Pending')}
                        </span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-colors ${
                          getStepIndex(selectedOrder.status) >= 3
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {getStepIndex(selectedOrder.status) >= 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '4'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 leading-tight ${
                          getStepIndex(selectedOrder.status) >= 3 ? 'text-stone-800' : 'text-stone-400'
                        }`}>
                          Delivered
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {selectedOrder.status === 'Delivered' ? 'Completed' : 'Expected'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Courier & AWB Tracking Box (if shipped or info provided) */}
              {(selectedOrder.trackingNumber || selectedOrder.courierName || selectedOrder.estimatedDelivery || selectedOrder.statusNotes) && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50/50 border border-emerald-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                      <Truck className="w-4 h-4 text-emerald-700" />
                      Shipment Tracking Details
                    </span>
                    {selectedOrder.courierName && (
                      <span className="text-[11px] font-bold bg-white text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        {selectedOrder.courierName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedOrder.trackingNumber && (
                      <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase">AWB / Tracking Number</span>
                          <p className="font-mono font-black text-sm text-stone-900 mt-0.5">
                            {selectedOrder.trackingNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyAwb(selectedOrder.trackingNumber || '')}
                          className="p-1.5 bg-stone-100 hover:bg-emerald-100 rounded-lg text-stone-600 hover:text-emerald-800 transition-colors"
                          title="Copy AWB Number"
                        >
                          {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {selectedOrder.estimatedDelivery && (
                      <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          Estimated Delivery
                        </span>
                        <p className="font-bold text-stone-900 mt-0.5">
                          {selectedOrder.estimatedDelivery}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedOrder.statusNotes && (
                    <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 text-xs text-stone-700">
                      <span className="font-bold text-stone-900 block text-[10px] uppercase text-stone-400">Latest Update</span>
                      {selectedOrder.statusNotes}
                    </div>
                  )}

                  {/* Direct Courier Website Button */}
                  {selectedOrder.trackingNumber && (
                    <div className="pt-1">
                      <a
                        href={getCourierDirectLink(selectedOrder.courierName, selectedOrder.trackingNumber, selectedOrder.trackingUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <span>Track Directly on {selectedOrder.courierName || 'Courier'} Website</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Order Item & Customer Summary */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <h5 className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                  Order Summary
                </h5>

                <div className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                  {getProductImage(selectedOrder.productId) ? (
                    <img
                      src={getProductImage(selectedOrder.productId)}
                      alt={selectedOrder.productName}
                      className="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-stone-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-lg shrink-0">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h6 className="font-bold text-sm text-stone-900 truncate">
                      {selectedOrder.productName}
                    </h6>
                    <p className="text-xs text-stone-500">
                      Size: {selectedOrder.productWeight} • Qty: {selectedOrder.quantity}
                    </p>
                    <p className="text-xs font-extrabold text-emerald-950 mt-0.5">
                      ₹{selectedOrder.totalAmount}
                      <span className="text-[10px] font-normal text-stone-500 ml-1.5">
                        ({selectedOrder.paymentMethod.toUpperCase()})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="text-xs text-stone-600 flex items-start gap-2 pt-2 border-t border-stone-100">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900 block">{selectedOrder.customerName}</span>
                    <p className="text-stone-600">{selectedOrder.address}, PIN: {selectedOrder.pincode}</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">Phone: {selectedOrder.phone}</p>
                  </div>
                </div>
              </div>

              {/* Need Help WhatsApp Button */}
              <div className="pt-1">
                <a
                  href={createWhatsAppUrl(
                    storeSettings.whatsappNumber,
                    `Hi ${storeSettings.shopName} team, I am checking the status of my Order #${selectedOrder.orderNumber}. Please provide an update.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Have questions? WhatsApp Maknuts Support</span>
                </a>
              </div>
            </div>
          )}

          {/* If search performed and no orders found */}
          {hasSearched && matchingOrders.length === 0 && (
            <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-stone-900">
                No orders found for "{query}"
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Please make sure you entered the correct Order ID (e.g. MK10001) or the 10-digit mobile number used during order placement.
              </p>
              <div className="pt-2">
                <a
                  href={createWhatsAppUrl(
                    storeSettings.whatsappNumber,
                    `Hi ${storeSettings.shopName} team, I could not find my order with details: "${query}". Can you please check for me?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Ask customer support on WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Quick FAQ / Info when no search active */}
          {!hasSearched && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-2 text-stone-700">
              <p className="font-bold text-emerald-950 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-800" />
                How order delivery works:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                <li>Orders are verified and packed fresh within 12-24 hours.</li>
                <li>Shipped across India via premium courier partners (Delhivery, Blue Dart, DTDC).</li>
                <li>Delivery typically takes 3-5 business days depending on your pincode.</li>
                <li>You can track the live courier progress right here at any time.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
