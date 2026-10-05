import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, MessageCircle, Mail, MapPin, Lock, ShieldCheck, Heart } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenPolicy: (type: 'terms' | 'privacy' | 'returns' | 'shipping') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenPolicy }) => {
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
              <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-300" />
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

              <div className="flex items-center gap-2 text-stone-600">
                <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>{storeSettings.supportEmail}</span>
              </div>

              <div className="flex items-start gap-2 text-stone-600">
                <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>{storeSettings.address}</span>
              </div>
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

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <div>
            © {new Date().getFullYear()} {storeSettings.shopName}. {storeSettings.footerText?.copyright || 'All rights reserved.'}
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-stone-400">
              {storeSettings.footerText?.craftedBy || 'Crafted for pure health by Saroj 😊'} <Heart className="w-3 h-3 text-rose-500 fill-rose-500/50" />
            </span>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-stone-500 hover:text-emerald-900 font-semibold transition-colors cursor-pointer"
              title="Store Admin Dashboard"
            >
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
