import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Truck } from 'lucide-react';

interface HeaderProps {
  onOpenAdmin?: () => void;
  onOpenTracking: () => void;
  onOpenPolicies: (type: 'terms' | 'privacy' | 'returns' | 'shipping') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTracking }) => {
  const { storeSettings, products, activeProduct, setActiveProductId } = useStore();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8DFD0]">
      {/* Main Navbar */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-amber-300 shadow-md shadow-emerald-900/10 border border-emerald-700/30 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300/30" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg sm:text-2xl text-emerald-950 font-serif truncate">
                {storeSettings.shopName}
              </span>
              {storeSettings.brandBadge && (
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300/60 shrink-0">
                  {storeSettings.brandBadge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-800/80 font-medium hidden md:block truncate">
              {storeSettings.tagline}
            </p>
          </div>
        </div>

        {/* If multiple products exist, quick switcher */}
        {products.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 bg-amber-50/80 p-1 rounded-lg border border-amber-200/60 text-xs overflow-x-auto no-scrollbar">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProductId(p.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap ${
                  p.id === activeProduct.id
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'text-emerald-900/80 hover:text-emerald-950 hover:bg-amber-100/50'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Top Actions: Track Order */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Customer Track Order Button */}
          <button
            type="button"
            onClick={onOpenTracking}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-extrabold text-emerald-950 bg-emerald-100 hover:bg-emerald-200/90 border border-emerald-300 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            title="Track your order delivery status"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-800" />
            <span>{storeSettings.buttons.trackOrder || 'Track Order'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
