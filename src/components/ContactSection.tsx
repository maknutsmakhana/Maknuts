import React from 'react';
import { useStore } from '../context/StoreContext';
import { Phone, Mail, MessageCircle, Clock, MapPin, ShieldCheck, HeartHandshake } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

export const ContactSection: React.FC = () => {
  const { storeSettings } = useStore();

  if (storeSettings.sectionVisibility?.contactSection === false) {
    return null;
  }

  const title = storeSettings.contactSectionTitle || 'Customer Support & Inquiries';
  const subtitle = storeSettings.contactSectionSubtitle || 'Need assistance with bulk orders, harvest inquiries, or fast delivery? Reach out directly.';

  const handleWhatsAppChat = () => {
    const text = `Hello ${storeSettings.shopName}! I have an inquiry about my order.`;
    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section aria-label="Customer Support and Contact Information" className="my-8">
      <div className="bg-white rounded-3xl border border-[#E8DFD0] p-6 sm:p-8 shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
            <span>Dedicated Farm-Direct Support</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* WhatsApp Support Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#25D366] mb-3">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                WhatsApp Live Help
              </h3>
              <p className="text-xs text-stone-600 mb-3">
                Fastest response for order status, UPI verification, and custom queries.
              </p>
            </div>
            <button
              type="button"
              onClick={handleWhatsAppChat}
              className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp</span>
            </button>
          </div>

          {/* Direct Phone Support Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 mb-3">
                <Phone className="w-5 h-5 text-emerald-800" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                Direct Phone Line
              </h3>
              <p className="text-xs text-stone-600 mb-3">
                Speak directly with our operations desk for wholesale & shipping.
              </p>
            </div>
            <a
              href={`tel:${storeSettings.supportPhone || storeSettings.whatsappNumber}`}
              className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>{storeSettings.supportPhone || storeSettings.whatsappNumber}</span>
            </a>
          </div>

          {/* Email Support Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 mb-3 border border-blue-200">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                Email Desk
              </h3>
              <p className="text-xs text-stone-600 mb-3">
                Official billing, B2B procurement invoices, and feedback records.
              </p>
            </div>
            <a
              href={`mailto:${storeSettings.supportEmail || 'care@maknuts.com'}`}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center truncate"
            >
              <Mail className="w-3.5 h-3.5 text-stone-500" />
              <span className="truncate">{storeSettings.supportEmail || 'care@maknuts.com'}</span>
            </a>
          </div>
        </div>

        {/* Operating Hours and Farm Address */}
        <div className="mt-5 pt-4 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-900 block">Support Hours</span>
              <span>{storeSettings.supportHours || 'Monday to Saturday: 9:00 AM – 8:00 PM IST'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-900 block">Origin & Sourcing</span>
              <span>{storeSettings.address || 'Mithila Region, Darbhanga, Bihar, India'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
