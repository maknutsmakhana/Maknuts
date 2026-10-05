import React from 'react';
import { Heart, Award, ShieldCheck, Flame, Leaf, Truck } from 'lucide-react';

export const ProductBenefits: React.FC = () => {
  const benefits = [
    {
      icon: Leaf,
      title: '100% Farm Fresh',
      desc: 'Harvested directly from ponds in Mithila, Bihar without synthetic chemicals or bleaching.'
    },
    {
      icon: Award,
      title: 'Jumbo 6+ Sutta Grade',
      desc: 'Only the largest, fluffiest lotus seeds are handpicked for superior crunch and puffiness.'
    },
    {
      icon: Flame,
      title: 'Slow Hand-Roasted',
      desc: 'Gently roasted in small batches to preserve natural crispiness and vital nutrients.'
    },
    {
      icon: Heart,
      title: 'Heart & Diet Friendly',
      desc: 'Packed with plant protein, rich in calcium, zero trans fat, low sodium and gluten-free.'
    },
    {
      icon: ShieldCheck,
      title: 'Hygienic Packaging',
      desc: 'Sealed in moisture-proof, food-grade zipper pouches to maintain peak crunchiness.'
    },
    {
      icon: Truck,
      title: 'Prompt Delivery',
      desc: 'Dispatched directly to your doorstep across India with careful packaging.'
    }
  ];

  return (
    <div className="my-10">
      <div className="text-center max-w-xl mx-auto mb-8">
        <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
          Why Choose Maknuts Makhana?
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          The ancient superfood from Bihar, prepared with pure traditional care.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {benefits.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
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
