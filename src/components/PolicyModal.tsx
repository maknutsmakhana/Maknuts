import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, Shield, FileText, RotateCcw, Truck } from 'lucide-react';

interface PolicyModalProps {
  policyType: 'terms' | 'privacy' | 'returns' | 'shipping' | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  const { storeSettings } = useStore();

  if (!policyType) return null;

  const titles: Record<string, { title: string; icon: any; content: string }> = {
    terms: {
      title: 'Terms & Conditions',
      icon: FileText,
      content: storeSettings.policies.terms,
    },
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      content: storeSettings.policies.privacy,
    },
    returns: {
      title: 'Return & Refund Policy',
      icon: RotateCcw,
      content: storeSettings.policies.returns,
    },
    shipping: {
      title: 'Shipping Policy',
      icon: Truck,
      content: storeSettings.policies.shipping,
    },
  };

  const item = titles[policyType];
  const Icon = item.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Icon className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="text-xs sm:text-sm text-stone-700 whitespace-pre-line leading-relaxed font-sans">
            {item.content}
          </div>
        </div>

        <div className="p-4 bg-[#FAF8F5] border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
