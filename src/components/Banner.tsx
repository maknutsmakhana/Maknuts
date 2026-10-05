import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Sparkles, Truck } from 'lucide-react';

interface BannerProps {
  onOpenTracking?: () => void;
}

export const Banner: React.FC<BannerProps> = ({ onOpenTracking }) => {
  const { storeSettings } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (!storeSettings.bannerVisible || !storeSettings.bannerText || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 shadow-sm border-b border-emerald-800/30">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 mx-auto text-center flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
            <span className="text-amber-100 font-medium text-xs sm:text-sm">
              {storeSettings.bannerText}
            </span>
          </div>

          {onOpenTracking && (
            <button
              type="button"
              onClick={onOpenTracking}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 text-[11px] font-bold transition-all cursor-pointer"
            >
              <Truck className="w-3 h-3 text-amber-300" />
              <span>Track Order Live</span>
            </button>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-emerald-200 hover:text-white p-1 rounded-md transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
