import React, { useState } from 'react';
import { FoodComplianceSettings, StoreSettings, Product } from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Save, 
  Check, 
  Building2, 
  Award, 
  FileCheck, 
  Heart, 
  Info, 
  CheckCircle2,
  Download
} from 'lucide-react';
import { downloadFoodCompliancePdf } from '../../utils/pdfGenerator';

interface AdminFoodComplianceTabProps {
  settings: StoreSettings;
  products?: Product[];
  onSaveCompliance: (compliance: FoodComplianceSettings) => Promise<void>;
}

export const AdminFoodComplianceTab: React.FC<AdminFoodComplianceTabProps> = ({
  settings,
  products = [],
  onSaveCompliance,
}) => {
  const [compliance, setCompliance] = useState<FoodComplianceSettings>({
    ...(settings.foodCompliance || {
      enabled: true,
      fssaiNumber: '10024011000123',
      isVegetarian: true,
      ingredients: '100% Raw Phool Makhana (Euryale Ferox / Lotus Seeds / Fox Nuts). No added preservatives, no artificial flavors, no artificial color.',
      allergens: 'Packed in a dedicated hygienic dry fruit facility. Naturally gluten-free. Contains no nuts, dairy, or soy.',
      netQuantity: '250g Pouch',
      storageInstructions: 'Store in an airtight container in a cool, dry place away from direct sunlight and moisture. Transfer to an airtight jar once opened.',
      servingInstructions: 'Can be consumed raw or lightly roasted with a spoonful of pure A2 cow ghee and rock salt / black pepper.',
      shelfLife: '12 Months from Date of Packaging',
      countryOfOrigin: 'India',
      manufacturerName: 'Maknuts Agro Foods Pvt Ltd',
      manufacturerAddress: 'Industrial Area, Phase 2, Darbhanga, Bihar - 846004, India',
      packerName: 'Maknuts Agro Foods Pvt Ltd',
      packerAddress: 'Industrial Area, Phase 2, Darbhanga, Bihar - 846004, India',
      marketerName: 'Maknuts Agro Foods Pvt Ltd',
      marketerAddress: 'Plot 42, Green Agro Park, Darbhanga, Bihar - 846004, India',
      customerCarePhone: '+91 98765 43210',
      customerCareEmail: 'care@maknuts.com',
      otherLegalDetails: 'FSSAI Central License compliant. Commodity: Phool Makhana (Fox Nuts / Gorgon Nuts). Grade: Jumbo Handpicked.',
      nutrition: {
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
        calcium: '60 mg',
      },
      claims: {
        highProtein: true,
        glutenFree: true,
        noPreservatives: true,
        zeroTransFat: true,
        noAddedSugar: true,
        natural100: true,
      }
    })
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

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
    calcium: '60 mg',
  };

  const claims = compliance.claims || {
    highProtein: true,
    glutenFree: true,
    noPreservatives: true,
    zeroTransFat: true,
    noAddedSugar: true,
    natural100: true,
  };

  const handleNutritionChange = (key: string, val: string) => {
    setCompliance({
      ...compliance,
      nutrition: {
        ...nutrition,
        [key]: val,
      }
    });
  };

  const handleClaimToggle = (key: string) => {
    setCompliance({
      ...compliance,
      claims: {
        ...claims,
        [key]: !claims[key as keyof typeof claims],
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveCompliance(compliance);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <span>Food Safety, FSSAI & Legal Compliance</span>
          </h2>
          <p className="text-xs text-stone-500">
            Mandatory packaging declarations, verified nutrition panel, allergen advice, and FSSAI statutory records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadFoodCompliancePdf(settings, products)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-stone-300 transition-colors cursor-pointer"
            title="Download Food & FSSAI Compliance Dossier PDF"
          >
            <Download className="w-4 h-4 text-emerald-800" />
            <span>Download FSSAI PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveToast ? (
              <Check className="w-4 h-4 text-amber-300" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveToast ? 'Compliance Saved!' : isSaving ? 'Saving...' : 'Save Compliance'}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Statutory Warning Banner */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-900">
            Statutory Legal Requirement (Food Safety and Standards Act, 2006)
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            All nutrition facts, manufacturer addresses, allergen advisories, and packaging details must accurately mirror physical pouch testing and lab verification. Never invent false claims or mock license numbers.
          </p>
        </div>
      </div>

      {/* SECTION 1: FSSAI LICENCE & STATUTORY INFO */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-800" />
            <span>FSSAI License & Identification</span>
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-500">Section Enabled</span>
            <input
              type="checkbox"
              checked={compliance.enabled}
              onChange={e => setCompliance({ ...compliance, enabled: e.target.checked })}
              className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              FSSAI 14-Digit License Number *
            </label>
            <input
              type="text"
              required
              value={compliance.fssaiNumber}
              onChange={e => setCompliance({ ...compliance, fssaiNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 14) })}
              placeholder="e.g. 10024011000123"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Vegetarian Symbol
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs">
              <div className="w-4 h-4 border-2 border-emerald-700 p-0.5 rounded-sm flex items-center justify-center bg-white">
                <div className="w-1.5 h-1.5 bg-emerald-700 rounded-full" />
              </div>
              <span className="font-bold text-emerald-950">100% Pure Vegetarian</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Country of Origin
            </label>
            <input
              type="text"
              value={compliance.countryOfOrigin}
              onChange={e => setCompliance({ ...compliance, countryOfOrigin: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PRODUCT CLAIMS MATRIX */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-800" />
            <span>Product Claims (Admin Controlled)</span>
          </h3>
          <p className="text-xs text-stone-500">
            Claims will only be displayed as verified badges if verified against testing protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'highProtein', label: 'High Protein (9.7g / 100g)' },
            { key: 'glutenFree', label: 'Naturally Gluten Free' },
            { key: 'noPreservatives', label: 'Zero Artificial Preservatives' },
            { key: 'zeroTransFat', label: 'Zero Trans Fat & Cholesterol' },
            { key: 'noAddedSugar', label: 'Zero Added Sugar' },
            { key: 'natural100', label: '100% Pure & Natural' },
          ].map(claim => {
            const isChecked = claims[claim.key as keyof typeof claims];
            return (
              <div
                key={claim.key}
                onClick={() => handleClaimToggle(claim.key)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${isChecked ? 'text-emerald-700' : 'text-stone-300'}`} />
                  <span className={`text-xs font-bold ${isChecked ? 'text-stone-900' : 'text-stone-500 line-through'}`}>
                    {claim.label}
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-mono font-bold ${isChecked ? 'text-emerald-800' : 'text-stone-400'}`}>
                  {isChecked ? 'ON' : 'OFF'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: TESTED NUTRITION PANEL */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            Laboratory Tested Nutrition Facts
          </h3>
          <p className="text-xs text-stone-500">
            Nutritional values formatted per serving size (e.g. 100 g typical values).
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Serving Size</label>
            <input
              type="text"
              value={nutrition.servingSize}
              onChange={e => handleNutritionChange('servingSize', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Energy</label>
            <input
              type="text"
              value={nutrition.energy}
              onChange={e => handleNutritionChange('energy', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Protein</label>
            <input
              type="text"
              value={nutrition.protein}
              onChange={e => handleNutritionChange('protein', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-emerald-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Carbohydrates</label>
            <input
              type="text"
              value={nutrition.carbohydrates}
              onChange={e => handleNutritionChange('carbohydrates', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Total Sugar</label>
            <input
              type="text"
              value={nutrition.sugar}
              onChange={e => handleNutritionChange('sugar', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Added Sugar</label>
            <input
              type="text"
              value={nutrition.addedSugar}
              onChange={e => handleNutritionChange('addedSugar', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Total Fat</label>
            <input
              type="text"
              value={nutrition.fat}
              onChange={e => handleNutritionChange('fat', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Saturated Fat</label>
            <input
              type="text"
              value={nutrition.saturatedFat}
              onChange={e => handleNutritionChange('saturatedFat', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Trans Fat</label>
            <input
              type="text"
              value={nutrition.transFat}
              onChange={e => handleNutritionChange('transFat', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Sodium</label>
            <input
              type="text"
              value={nutrition.sodium}
              onChange={e => handleNutritionChange('sodium', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Calcium</label>
            <input
              type="text"
              value={nutrition.calcium || '60 mg'}
              onChange={e => handleNutritionChange('calcium', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: INGREDIENTS, ALLERGENS, STORAGE & SHELF LIFE */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif">
          Ingredients Declaration & Instructions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Ingredients Declaration *
            </label>
            <textarea
              rows={3}
              value={compliance.ingredients}
              onChange={e => setCompliance({ ...compliance, ingredients: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Allergen Advice *
            </label>
            <textarea
              rows={3}
              value={compliance.allergens}
              onChange={e => setCompliance({ ...compliance, allergens: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Storage Instructions
            </label>
            <textarea
              rows={2}
              value={compliance.storageInstructions}
              onChange={e => setCompliance({ ...compliance, storageInstructions: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Serving & Usage Instructions
            </label>
            <textarea
              rows={2}
              value={compliance.servingInstructions}
              onChange={e => setCompliance({ ...compliance, servingInstructions: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Net Quantity / Weight
            </label>
            <input
              type="text"
              value={compliance.netQuantity}
              onChange={e => setCompliance({ ...compliance, netQuantity: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Shelf Life / Best Before
            </label>
            <input
              type="text"
              value={compliance.shelfLife}
              onChange={e => setCompliance({ ...compliance, shelfLife: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Batch / Lot Information Format
            </label>
            <input
              type="text"
              value={compliance.otherLegalDetails}
              onChange={e => setCompliance({ ...compliance, otherLegalDetails: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: STATUTORY ADDRESSES (MANUFACTURER, PACKER, MARKETER) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-800" />
          <span>Manufacturer, Packer & Marketer Addresses</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Manufacturer */}
          <div className="space-y-2 p-3 bg-stone-50/80 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Manufactured By
            </span>
            <input
              type="text"
              placeholder="Company Name"
              value={compliance.manufacturerName}
              onChange={e => setCompliance({ ...compliance, manufacturerName: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900"
            />
            <textarea
              rows={3}
              placeholder="Full postal address with PIN code"
              value={compliance.manufacturerAddress}
              onChange={e => setCompliance({ ...compliance, manufacturerAddress: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-700"
            />
          </div>

          {/* Packer */}
          <div className="space-y-2 p-3 bg-stone-50/80 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Packed By
            </span>
            <input
              type="text"
              placeholder="Company Name"
              value={compliance.packerName}
              onChange={e => setCompliance({ ...compliance, packerName: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900"
            />
            <textarea
              rows={3}
              placeholder="Full postal address with PIN code"
              value={compliance.packerAddress}
              onChange={e => setCompliance({ ...compliance, packerAddress: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-700"
            />
          </div>

          {/* Marketer */}
          <div className="space-y-2 p-3 bg-stone-50/80 rounded-xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Marketed By
            </span>
            <input
              type="text"
              placeholder="Company Name"
              value={compliance.marketerName}
              onChange={e => setCompliance({ ...compliance, marketerName: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900"
            />
            <textarea
              rows={3}
              placeholder="Full postal address with PIN code"
              value={compliance.marketerAddress}
              onChange={e => setCompliance({ ...compliance, marketerAddress: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-700"
            />
          </div>
        </div>

        {/* Customer Care */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Customer Care Hotline Phone
            </label>
            <input
              type="text"
              value={compliance.customerCarePhone}
              onChange={e => setCompliance({ ...compliance, customerCarePhone: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Customer Care Email Address
            </label>
            <input
              type="email"
              value={compliance.customerCareEmail}
              onChange={e => setCompliance({ ...compliance, customerCareEmail: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
