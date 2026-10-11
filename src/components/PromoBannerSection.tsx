import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Tag, ArrowRight } from 'lucide-react';

interface PromoBannerSectionProps {
  onApplyCoupon?: (code: string) => void;
}

export const PromoBannerSection: React.FC<PromoBannerSectionProps> = ({ onApplyCoupon }) => {
  const { storeSettings } = useStore();
  const promo = storeSettings.promoBanner;

  if (storeSettings.sectionVisibility?.promoBanner === false || !promo || !promo.enabled) {
    return null;
  }

  const bgClasses = 
    promo.bgColor === 'amber' 
      ? 'from-amber-600 via-amber-700 to-amber-800 text-white'
      : promo.bgColor === 'stone'
      ? 'from-stone-800 via-stone-900 to-stone-950 text-white'
      : 'from-emerald-900 via-emerald-800 to-emerald-900 text-white';

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${bgClasses} p-4 sm:p-5 shadow-md border border-white/10 my-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950">
              {promo.badge}
            </span>
            <h4 className="font-bold text-sm sm:text-base font-serif">
              {promo.title}
            </h4>
          </div>
          <p className="text-xs text-white/80 mt-0.5">
            {promo.description}
          </p>
        </div>
      </div>

      {promo.couponCodeBadge && (
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 text-xs font-mono font-black tracking-wider text-amber-200">
            {promo.couponCodeBadge}
          </div>
        </div>
      )}
    </div>
  );
};
