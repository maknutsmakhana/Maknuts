import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { Heart, Award, ShieldCheck, Flame, Leaf, Truck, Sparkles, CheckCircle2 } from 'lucide-react';

const ICONS = [Leaf, Award, Flame, Heart, ShieldCheck, Truck, Sparkles, CheckCircle2];

export const ProductBenefits: React.FC = () => {
  const { storeSettings } = useStore();
  const shouldReduceMotion = useReducedMotion();
  const section = storeSettings.benefitsSection || {
    title: 'Why Choose Maknuts Makhana?',
    subtitle: 'The ancient superfood from Bihar, prepared with pure traditional care.',
    items: []
  };

  const items = section.items || [];

  return (
    <div className="my-10">
      <motion.div 
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="text-center max-w-xl mx-auto mb-8"
      >
        <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
          {section.title || `Why Choose ${storeSettings.shopName}?`}
        </h2>
        {section.subtitle && (
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {section.subtitle}
          </p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {items.map((item, idx) => {
          const Icon = ICONS[idx % ICONS.length];
          return (
            <motion.div
              key={item.id || idx}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.07, ease: 'easeOut' }}
              whileHover={shouldReduceMotion ? undefined : { y: -3, transition: { duration: 0.2 } }}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E9DFD1] shadow-xs flex flex-col justify-start transition-shadow hover:shadow-md hover:border-emerald-200"
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
