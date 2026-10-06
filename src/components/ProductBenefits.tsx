import React from 'react';
import { useStore } from '../context/StoreContext';
import { Heart, Award, ShieldCheck, Flame, Leaf, Truck, Sparkles, CheckCircle2 } from 'lucide-react';

const ICONS = [Leaf, Award, Flame, Heart, ShieldCheck, Truck, Sparkles, CheckCircle2];

export const ProductBenefits: React.FC = () => {
  const { storeSettings } = useStore();
  const section = storeSettings.benefitsSection || {
    title: 'Why Choose Maknuts Makhana?',
    subtitle: 'The ancient superfood from Bihar, prepared with pure traditional care.',
    items: []
  };

  const items = section.items || [];

  return (
    <div className="my-10">
      <div className="text-center max-w-xl mx-auto mb-8">
        <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
          {section.title || `Why Choose ${storeSettings.shopName}?`}
        </h2>
        {section.subtitle && (
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {section.subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {items.map((item, idx) => {
          const Icon = ICONS[idx % ICONS.length];
          return (
            <div
              key={item.id || idx}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E9DFD1] shadow-xs flex flex-col justify-start"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-800 mb-3">
                <Icon className="w-5 h-5 text-emerald-800" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
