import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Award, Heart, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, FileText, Sparkles, Building2, PhoneCall, Mail } from 'lucide-react';

export const FoodComplianceSection: React.FC = () => {
  const { storeSettings, activeProduct } = useStore();
  const compliance = storeSettings.foodCompliance;
  const [isExpanded, setIsExpanded] = useState(false);

  // If section visibility is turned off or compliance is disabled
  if (storeSettings.sectionVisibility?.foodCompliance === false || !compliance || !compliance.enabled) {
    return null;
  }

  const nutrition = compliance.nutrition || {
    servingSize: '100 g',
    energy: '347 kcal',
    protein: '9.7 g',
    carbohydrates: '76.9 g',
    sugar: '0.0 g',
    addedSugar: '0.0 g',
    fat: '0.1 g',
    saturatedFat: '0.0 g',
    transFat: '0.0 g',
    sodium: '2.0 mg',
  };

  const claims = compliance.claims || {
    highProtein: true,
    glutenFree: true,
    noPreservatives: true,
    zeroTransFat: true,
    noAddedSugar: true,
    natural100: true,
  };

  const claimPills: { key: string; label: string; enabled: boolean }[] = [
    { key: 'highProtein', label: 'High Protein (9.7g / 100g)', enabled: Boolean(claims.highProtein) },
    { key: 'glutenFree', label: 'Naturally Gluten Free', enabled: Boolean(claims.glutenFree) },
    { key: 'noPreservatives', label: 'Zero Artificial Preservatives', enabled: Boolean(claims.noPreservatives) },
    { key: 'zeroTransFat', label: 'Zero Trans Fat & Cholesterol', enabled: Boolean(claims.zeroTransFat) },
    { key: 'noAddedSugar', label: 'Zero Added Sugar', enabled: Boolean(claims.noAddedSugar) },
    { key: 'natural100', label: '100% Pure & Natural', enabled: Boolean(claims.natural100) },
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#E8DFD0] shadow-sm overflow-hidden my-6">
      {/* Top Header Banner */}
      <div className="bg-[#FAF8F5] px-5 sm:px-6 py-4 border-b border-[#E8DFD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Vegetarian Green Dot Symbol */}
          <div className="w-6 h-6 border-2 border-emerald-700 p-0.5 rounded-sm flex items-center justify-center shrink-0 bg-white" title="100% Pure Vegetarian">
            <div className="w-2.5 h-2.5 bg-emerald-700 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                Food Safety, Nutrition & Statutory Details
              </h3>
              {compliance.fssaiNumber && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  FSSAI Lic. {compliance.fssaiNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Complete transparency: Tested nutritional facts, ingredients, allergen warnings, and manufacturer details.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Verified Claims Ribbon */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-2">
            Nutritional & Quality Claims (Lab Tested)
          </span>
          <div className="flex flex-wrap gap-2">
            {claimPills.filter(c => c.enabled).map(c => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{c.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Nutrition Table & Ingredients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Nutrition Table */}
          <div className="md:col-span-7 bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200/90">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Nutritional Value per {nutrition.servingSize || '100g'}
              </span>
              <span className="text-[10px] text-stone-500 font-semibold">Typical Values</span>
            </div>

            <div className="divide-y divide-stone-200 text-xs">
              <div className="py-1.5 flex justify-between font-bold text-stone-900">
                <span>Energy</span>
                <span className="font-mono">{nutrition.energy}</span>
              </div>
              <div className="py-1.5 flex justify-between font-bold text-emerald-950">
                <span>Protein</span>
                <span className="font-mono text-emerald-800">{nutrition.protein}</span>
              </div>
              <div className="py-1.5 flex justify-between text-stone-700">
                <span>Carbohydrates</span>
                <span className="font-mono">{nutrition.carbohydrates}</span>
              </div>
              <div className="py-1.5 flex justify-between text-stone-500 pl-3 text-[11px]">
                <span>Total Sugar</span>
                <span className="font-mono">{nutrition.sugar}</span>
              </div>
              <div className="py-1.5 flex justify-between text-stone-500 pl-3 text-[11px]">
                <span>Added Sugar</span>
                <span className="font-mono">{nutrition.addedSugar}</span>
              </div>
              <div className="py-1.5 flex justify-between text-stone-700">
                <span>Total Fat</span>
                <span className="font-mono">{nutrition.fat}</span>
              </div>
              <div className="py-1.5 flex justify-between text-stone-500 pl-3 text-[11px]">
                <span>Saturated Fat</span>
                <span className="font-mono">{nutrition.saturatedFat}</span>
              </div>
              <div className="py-1.5 flex justify-between text-stone-500 pl-3 text-[11px]">
                <span>Trans Fat</span>
                <span className="font-mono">{nutrition.transFat}</span>
              </div>
              <div className="py-1.5 flex justify-between text-stone-700">
                <span>Sodium</span>
                <span className="font-mono">{nutrition.sodium}</span>
              </div>
              {nutrition.calcium && (
                <div className="py-1.5 flex justify-between text-stone-700">
                  <span>Calcium</span>
                  <span className="font-mono">{nutrition.calcium}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients & Allergens */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Ingredients Declaration
              </span>
              <p className="text-stone-800 font-medium leading-relaxed">
                {compliance.ingredients}
              </p>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-700" />
                <span>Allergen Advice</span>
              </span>
              <p className="text-stone-700 text-[11px] leading-relaxed">
                {compliance.allergens}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">Net Weight</span>
                <span className="font-bold text-stone-800">{activeProduct?.weight || compliance.netQuantity}</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">Best Before</span>
                <span className="font-bold text-stone-800">{compliance.shelfLife}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Expanded Legal & Manufacturer Details */}
        {isExpanded && (
          <div className="pt-4 border-t border-stone-200 space-y-4 animate-in fade-in">
            {/* Storage & Usage Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-1">Storage Instructions:</span>
                <p className="text-stone-600 leading-relaxed">{compliance.storageInstructions}</p>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-1">Serving & Usage:</span>
                <p className="text-stone-600 leading-relaxed">{compliance.servingInstructions}</p>
              </div>
            </div>

            {/* Manufacturer, Packer, Marketer Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Manufactured By
                </span>
                <span className="font-bold text-stone-900 block">{compliance.manufacturerName}</span>
                <p className="text-[11px] text-stone-500 leading-normal">{compliance.manufacturerAddress}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Packed By
                </span>
                <span className="font-bold text-stone-900 block">{compliance.packerName}</span>
                <p className="text-[11px] text-stone-500 leading-normal">{compliance.packerAddress}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Marketed By
                </span>
                <span className="font-bold text-stone-900 block">{compliance.marketerName}</span>
                <p className="text-[11px] text-stone-500 leading-normal">{compliance.marketerAddress}</p>
              </div>
            </div>

            {/* Customer Care & Legal note */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900">Customer Care & Grievance:</span>
                <div className="text-[11px] text-stone-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Phone: {compliance.customerCarePhone}</span>
                  <span>Email: {compliance.customerCareEmail}</span>
                  <span>Origin: {compliance.countryOfOrigin}</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-400">
                {compliance.otherLegalDetails}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
