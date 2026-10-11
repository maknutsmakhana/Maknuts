import React from 'react';
import { Order, StoreSettings } from '../types';
import { X, Printer, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  storeSettings: StoreSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, storeSettings, onClose }) => {
  if (!order) return null;

  const compliance = storeSettings.foodCompliance;
  const fssaiNumber = compliance?.fssaiNumber || '10424000000892';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar (Hidden when printing) */}
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              Retail Invoice — {order.orderNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-stone-800 text-xs space-y-6 print:p-0 print:overflow-visible">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-300">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 font-serif tracking-tight">
                {storeSettings.shopName}
              </h1>
              <p className="text-[11px] text-stone-500 font-medium">
                {storeSettings.tagline}
              </p>
              <p className="text-[11px] text-stone-600 mt-1 max-w-xs leading-normal">
                {storeSettings.address}
              </p>
              <p className="text-[11px] text-stone-600 font-medium">
                Phone: {storeSettings.whatsappNumber} · Email: {storeSettings.supportEmail}
              </p>
              {fssaiNumber && (
                <p className="text-[11px] text-emerald-900 font-bold font-mono mt-0.5">
                  FSSAI Lic. No: {fssaiNumber}
                </p>
              )}
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                Tax / Retail Invoice
              </span>
              <div className="text-xs">
                <span className="text-stone-500">Invoice / Order ID: </span>
                <span className="font-mono font-bold text-stone-900">{order.orderNumber}</span>
              </div>
              <div className="text-xs">
                <span className="text-stone-500">Invoice Date: </span>
                <span className="font-medium text-stone-900">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-stone-500">Payment: </span>
                <span className="font-bold text-stone-900 uppercase">{order.paymentMethod}</span>
                <span className="text-stone-500"> ({order.paymentStatus})</span>
              </div>
            </div>
          </div>

          {/* Billed & Shipped To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-200">
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Billed & Shipped To
              </span>
              <div className="font-bold text-stone-900 text-sm">{order.customerName}</div>
              <div className="text-stone-600 text-xs mt-0.5 font-mono">Mobile: +91 {order.phone}</div>
              <div className="text-stone-700 text-xs mt-1 leading-relaxed">
                {order.address}
              </div>
              <div className="text-stone-700 text-xs font-semibold">PIN: {order.pincode}</div>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Logistics & Dispatch Info
              </span>
              <div>
                <span className="text-stone-500">Status: </span>
                <span className="font-bold text-stone-900">{order.status}</span>
              </div>
              {order.courierName && (
                <div>
                  <span className="text-stone-500">Courier: </span>
                  <span className="font-semibold text-stone-900">{order.courierName}</span>
                </div>
              )}
              {order.trackingNumber && (
                <div>
                  <span className="text-stone-500">AWB / Tracking: </span>
                  <span className="font-mono font-bold text-emerald-900">{order.trackingNumber}</span>
                </div>
              )}
              {order.upiRefNumber && (
                <div>
                  <span className="text-stone-500">UPI Ref / UTR: </span>
                  <span className="font-mono text-stone-800">{order.upiRefNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-300 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Pack</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="py-3 font-semibold text-stone-900">
                    <div>{order.productName}</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      100% Raw Jumbo Bihar Lotus Seeds (Phool Makhana)
                    </div>
                  </td>
                  <td className="py-3 text-center text-stone-600 font-mono">{order.productWeight}</td>
                  <td className="py-3 text-center font-bold text-stone-900">{order.quantity}</td>
                  <td className="py-3 text-right font-mono text-stone-700">₹{order.unitPrice}</td>
                  <td className="py-3 text-right font-mono font-bold text-stone-900">
                    ₹{(order.unitPrice * order.quantity)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">₹{(order.unitPrice * order.quantity)}</span>
              </div>

              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Store Discount:</span>
                  <span className="font-mono">−₹{order.discountAmount}</span>
                </div>
              ) : null}

              {order.couponCode && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Coupon ({order.couponCode}):</span>
                  <span className="font-mono">−₹{order.couponDiscount || 0}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Delivery Charges:</span>
                <span className="font-mono font-semibold">
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                </span>
              </div>

              <div className="pt-2 border-t-2 border-stone-800 flex justify-between font-black text-stone-900 text-sm">
                <span>Total Amount:</span>
                <span className="font-mono font-serif text-base text-emerald-950">
                  ₹{order.totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Legal notice */}
          <div className="pt-6 border-t border-stone-200 text-[10px] text-stone-500 space-y-1 text-center">
            <p className="font-medium text-stone-600">
              Thank you for choosing Maknuts! Direct from the wetlands of Mithila, Bihar to your home.
            </p>
            <p>
              This is a computer-generated tax invoice. Sealed hygienic food product. For any queries, contact {storeSettings.supportEmail} or WhatsApp {storeSettings.whatsappNumber}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
