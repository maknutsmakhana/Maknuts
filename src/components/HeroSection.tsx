import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ShoppingBag, MessageCircle, CheckCircle2 } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface HeroSectionProps {
  onShopNow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onShopNow }) => {
  const { storeSettings, activeProduct } = useStore();
  const hero = storeSettings.heroSection;

  if (storeSettings.sectionVisibility?.heroBanner === false || !hero) {
    return null;
  }

  const handleWhatsAppOrder = () => {
    const text = `Hello ${storeSettings.shopName}! I would like to order ${activeProduct.name} (${activeProduct.weight}).`;
    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white p-6 sm:p-10 shadow-xl border border-emerald-800/40 my-4">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 max-w-3xl space-y-4">
        {/* Badge */}
        {hero.badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{hero.badge}</span>
          </div>
        )}

        {/* Heading */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight leading-tight text-amber-50">
          {hero.heading}
        </h1>

        {/* Subheading */}
        <p className="text-xs sm:text-base text-stone-200 max-w-2xl leading-relaxed font-normal">
          {hero.subheading}
        </p>

        {/* Trust Chips */}
        {hero.trustChips && hero.trustChips.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {hero.trustChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white/10 text-emerald-100 border border-white/15 backdrop-blur-xs"
              >
                <CheckCircle2 className="w-3 h-3 text-amber-300" />
                <span>{chip}</span>
              </span>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        {hero.showCtaButtons && (
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onShopNow}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-950/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{hero.primaryCtaText || 'Shop Fresh Harvest'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppOrder}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>{hero.secondaryCtaText || 'Quick WhatsApp Order'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
