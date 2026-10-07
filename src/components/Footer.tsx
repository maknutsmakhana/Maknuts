import React from 'react';
import { useStore } from '../context/StoreContext';
import { MessageCircle, Mail, MapPin, Lock, ShieldCheck, Heart, MessageSquareHeart, Phone } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';
import maknutsLogo from '../assets/images/regenerated_image_1791357700332.png';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenPolicy: (type: 'terms' | 'privacy' | 'returns' | 'shipping') => void;
  onOpenFeedback: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenPolicy, onOpenFeedback }) => {
  const { storeSettings } = useStore();

  const handleWhatsAppChat = () => {
    const text = `Hello ${storeSettings.shopName}! I would like to get in touch.`;
    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="mt-16 bg-[#F2EDE4] border-t border-[#DFD5C6] text-stone-700 pt-10 pb-8 text-xs">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#D8CABE]">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-800/40 shrink-0 bg-emerald-950 flex items-center justify-center p-0.5 shadow-xs">
                <img
                  src={maknutsLogo}
                  alt={storeSettings.shopName || 'Maknuts Logo'}
                  className="w-full h-full object-cover rounded-md"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-extrabold text-xl font-serif text-emerald-950">
                {storeSettings.shopName}
              </span>
            </div>
            <p className="text-stone-600 text-xs leading-relaxed max-w-sm">
              {storeSettings.footerText?.about || 'Bringing you 100% natural, farm-fresh jumbo Phool Makhana from the pristine wetlands of Bihar. Crispy, high-protein superfood snacks for your healthy daily life.'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-emerald-900 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{storeSettings.footerText?.qualityPromise || '100% Quality Guaranteed · Hygienic Sealed Packaging'}</span>
            </div>
          </div>

          {/* Quick Contact Col */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
              Customer Support
            </h4>
            <div className="space-y-2 text-stone-600">
              <button
                type="button"
                onClick={handleWhatsAppChat}
                className="flex items-center gap-2 text-emerald-800 hover:text-emerald-950 font-semibold transition-colors cursor-pointer text-left"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>WhatsApp: {storeSettings.whatsappNumber}</span>
              </button>

              {storeSettings.supportPhone && storeSettings.supportPhone !== storeSettings.whatsappNumber && (
                <div className="flex items-center gap-2 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>Call: {storeSettings.supportPhone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-stone-600">
                <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>{storeSettings.supportEmail}</span>
              </div>

              <div className="flex items-start gap-2 text-stone-600">
                <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>{storeSettings.address}</span>
              </div>

              {storeSettings.supportHours && (
                <div className="text-[11px] text-stone-500 pt-0.5">
                  🕒 {storeSettings.supportHours}
                </div>
              )}
            </div>
          </div>

          {/* Policies & Admin Col */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
              Information & Policies
            </h4>
            <ul className="space-y-1.5 text-stone-600">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('returns')}
                  className="hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  Return & Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('shipping')}
                  className="hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  Shipping & Delivery Info
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('terms')}
                  className="hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar matching user specification */}
        <div className="pt-6">
          <div className="border border-[#D8CABE] rounded-xl sm:rounded-2xl bg-white/75 overflow-hidden text-center text-xs text-stone-700 shadow-2xs divide-y divide-[#D8CABE]">
            {/* Top row: Copyright & Admin Login */}
            <div className="py-2.5 px-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 leading-normal">
              <span>
                © {new Date().getFullYear()} {storeSettings.shopName.includes('Makhana') ? storeSettings.shopName : `${storeSettings.shopName} Makhana`}. {storeSettings.footerText?.copyright || 'All rights reserved.'}
              </span>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-stone-700 hover:text-emerald-900 font-semibold transition-colors cursor-pointer group"
                title="Store Admin Dashboard"
              >
                <Lock className="w-3.5 h-3.5 text-stone-600 group-hover:text-emerald-800" />
                <span>Admin Login</span>
              </button>
            </div>

            {/* Bottom row: Crafted with Love by Saroj */}
            <div className="py-2.5 px-4 flex items-center justify-center gap-1.5 text-stone-800 font-medium">
              <span>
                {storeSettings.footerText?.craftedBy || 'From our heart to your bowl, crafted with Love by Saroj'}
              </span>
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
