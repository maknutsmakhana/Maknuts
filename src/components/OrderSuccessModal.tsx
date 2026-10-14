import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { CheckCircle2, MessageCircle, Copy, Check, ArrowLeft, PackageCheck, Truck } from 'lucide-react';
import { generateOrderWhatsAppMessage, createWhatsAppUrl } from '../utils/whatsapp';

interface OrderSuccessModalProps {
  order: Order | null;
  storeSettings: StoreSettings;
  onClose: () => void;
  onTrackOrder?: (orderNumber: string, phone?: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  storeSettings,
  onClose,
  onTrackOrder,
}) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const customTemplate = storeSettings.whatsAppSettings?.orderTemplate;
  const orderMessage = generateOrderWhatsAppMessage(order, storeSettings.shopName, customTemplate);
  const targetPhone = storeSettings.whatsAppSettings?.businessNumber || storeSettings.whatsappNumber;
  const whatsappUrl = createWhatsAppUrl(targetPhone, orderMessage);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(orderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsAppAgain = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF8F5] w-full max-w-lg rounded-3xl shadow-2xl border border-[#E2D5C3] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div className="p-6 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-700/80 border-2 border-amber-300 flex items-center justify-center mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-amber-300" />
          </div>
          <span className="text-xs uppercase tracking-widest text-emerald-200 font-bold">
            Order Submitted
          </span>
          <h2 className="text-2xl font-black font-serif tracking-tight mt-0.5">
            Order #{order.orderNumber}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xs">
            Your order details have been prepared for WhatsApp dispatch.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* WhatsApp Action Highlight */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>Next Step: Send Message on WhatsApp</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              If WhatsApp did not open automatically, tap the button below to send your pre-filled order message to our team:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all text-center"
              >
                <MessageCircle className="w-4 h-4 text-amber-300" />
                <span>Open WhatsApp Now</span>
              </a>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-3 px-4 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
            <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px] pb-1 border-b border-stone-100 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-emerald-700" />
              <span>Order Summary</span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Item:</span>
              <span className="font-bold text-stone-800">
                {order.productName} ({order.productWeight}) x {order.quantity}
              </span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Total Amount:</span>
              <span className="font-bold text-emerald-900 text-sm">
                ₹{order.totalAmount}
              </span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Payment Mode:</span>
              <span className="font-semibold text-stone-800">
                {order.paymentMethod === 'upi' ? 'UPI' : 'Cash On Delivery'}
              </span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Payment Status:</span>
              <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {order.paymentStatus || (order.paymentMethod === 'cod' ? 'COD Pending' : 'Pending')}
              </span>
            </div>

            {order.upiRefNumber && (
              <div className="flex justify-between text-stone-600 font-mono">
                <span>UPI UTR / Ref:</span>
                <span className="font-semibold text-stone-800">{order.upiRefNumber}</span>
              </div>
            )}

            {order.paymentMethod === 'upi' && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px]">
                📸 <strong>Verification Note:</strong> After opening WhatsApp, please send your UPI payment screenshot in the chat for quick verification.
              </div>
            )}

            <div className="pt-2 border-t border-stone-100 text-stone-500">
              <span className="font-semibold text-stone-700">Delivery To: </span>
              {order.customerName} ({order.phone}) · {order.address}, PIN: {order.pincode}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row gap-2">
          {onTrackOrder && (
            <button
              type="button"
              onClick={() => onTrackOrder(order.orderNumber, order.phone)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Truck className="w-4 h-4 text-amber-300" />
              <span>Track Live Delivery</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};
