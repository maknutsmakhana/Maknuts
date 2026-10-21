import React, { useState } from 'react';
import { 
  StoreSettings, 
  FoodComplianceSettings 
} from '../../types';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Save, 
  Check, 
  Download, 
  Info, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Scale 
} from 'lucide-react';
import { downloadFoodCompliancePdf } from '../../utils/pdfGenerator';

interface CompliancePageProps {
  settings: StoreSettings;
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export const CompliancePage: React.FC<CompliancePageProps> = ({
  settings,
  onSaveSettings,
  initialSubTab = 'business_fssai',
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'business_fssai' | 'policies' | 'legal_info'>(
    (initialSubTab as any) || 'business_fssai'
  );

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: 'business_fssai' | 'policies' | 'legal_info') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [businessName, setBusinessName] = useState(
    settings.foodCompliance?.marketerName || 'Maknuts Agri Foods'
  );
  const [fssaiNumber, setFssaiNumber] = useState(
    settings.foodCompliance?.fssaiNumber || ''
  );
  const [businessAddress, setBusinessAddress] = useState(
    settings.address || 'Maknuts Agri Foods, Darbhanga, Bihar, India - 846004'
  );
  const [customerCarePhone, setCustomerCarePhone] = useState(
    settings.foodCompliance?.customerCarePhone || settings.supportPhone || '+91 78010 51792'
  );
  const [customerCareEmail, setCustomerCareEmail] = useState(
    settings.foodCompliance?.customerCareEmail || settings.supportEmail || 'maknutsmakhana@gmail.com'
  );
  const [customerCareAddress, setCustomerCareAddress] = useState(
    settings.foodCompliance?.customerCareAddress || settings.address || 'Customer Support Desk, Maknuts Agri Foods, Darbhanga, Bihar - 846004'
  );

  // Policies
  const [policies, setPolicies] = useState({
    terms: settings.policies?.terms || '',
    privacy: settings.policies?.privacy || '',
    returns: settings.policies?.returns || '',
    shipping: settings.policies?.shipping || '',
    cancellation: settings.policies?.cancellation || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Sync state when settings update externally
  React.useEffect(() => {
    if (!isSaving && settings) {
      if (settings.foodCompliance?.marketerName) setBusinessName(settings.foodCompliance.marketerName);
      if (settings.foodCompliance?.fssaiNumber !== undefined) setFssaiNumber(settings.foodCompliance.fssaiNumber);
      if (settings.address) setBusinessAddress(settings.address);
      if (settings.foodCompliance?.customerCarePhone || settings.supportPhone) {
        setCustomerCarePhone(settings.foodCompliance?.customerCarePhone || settings.supportPhone);
      }
      if (settings.foodCompliance?.customerCareEmail || settings.supportEmail) {
        setCustomerCareEmail(settings.foodCompliance?.customerCareEmail || settings.supportEmail);
      }
      if (settings.foodCompliance?.customerCareAddress) {
        setCustomerCareAddress(settings.foodCompliance.customerCareAddress);
      }
      if (settings.policies) {
        setPolicies({
          terms: settings.policies.terms || '',
          privacy: settings.policies.privacy || '',
          returns: settings.policies.returns || '',
          shipping: settings.policies.shipping || '',
          cancellation: settings.policies.cancellation || '',
        });
      }
    }
  }, [settings, isSaving]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings({
        address: businessAddress,
        supportPhone: customerCarePhone,
        supportEmail: customerCareEmail,
        foodCompliance: {
          ...(settings.foodCompliance || {}),
          fssaiNumber,
          marketerName: businessName,
          customerCarePhone,
          customerCareEmail,
          customerCareAddress,
        },
        policies,
      });

      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Error saving compliance information.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Save Button */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <span>Corporate Compliance & Policies</span>
            </h2>
            <p className="text-xs text-stone-500">
              Authoritative business-level compliance: FSSAI registration, company contact details, and customer policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadFoodCompliancePdf(settings)}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Compliance Dossier PDF</span>
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
              <span>{saveToast ? 'Compliance Saved!' : isSaving ? 'Saving...' : 'Save & Publish'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'business_fssai', label: 'Business / FSSAI' },
            { id: 'policies', label: 'Store Legal Policies' },
            { id: 'legal_info', label: 'Packaging & Statutory Norms' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSubTabChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeSubTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: BUSINESS & FSSAI */}
      {activeSubTab === 'business_fssai' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Corporate Entity & Licensing</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Company / Marketer Legal Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Maknuts Agri Foods"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Business FSSAI License Number</label>
                <input
                  type="text"
                  value={fssaiNumber}
                  onChange={e => setFssaiNumber(e.target.value)}
                  placeholder="Enter 14-digit FSSAI License Number"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-stone-500">Leave blank if pending official issuance</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Registered Business Address *</label>
              <textarea
                rows={2}
                value={businessAddress}
                onChange={e => setBusinessAddress(e.target.value)}
                placeholder="Full registered office address..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Customer Grievance & Care */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Customer Care & Grievance Officer</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Support / Grievance Helpline *</label>
                <input
                  type="text"
                  value={customerCarePhone}
                  onChange={e => setCustomerCarePhone(e.target.value)}
                  placeholder="+91 78010 51792"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Support Email Address *</label>
                <input
                  type="email"
                  value={customerCareEmail}
                  onChange={e => setCustomerCareEmail(e.target.value)}
                  placeholder="maknutsmakhana@gmail.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Customer Care Postal Address</label>
              <input
                type="text"
                value={customerCareAddress}
                onChange={e => setCustomerCareAddress(e.target.value)}
                placeholder="Desk address for postal notices and grievances..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STORE LEGAL POLICIES */}
      {activeSubTab === 'policies' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Customer Policy Documents</h3>
            <p className="text-xs text-stone-500">Accessible from footer modals during checkout and customer store visits.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Terms & Conditions</label>
              <textarea
                rows={5}
                value={policies.terms}
                onChange={e => setPolicies({ ...policies, terms: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Privacy Policy</label>
              <textarea
                rows={4}
                value={policies.privacy}
                onChange={e => setPolicies({ ...policies, privacy: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Return, Refund & Replacement Policy</label>
              <textarea
                rows={4}
                value={policies.returns}
                onChange={e => setPolicies({ ...policies, returns: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Shipping & Delivery Policy</label>
              <textarea
                rows={4}
                value={policies.shipping}
                onChange={e => setPolicies({ ...policies, shipping: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Order Cancellation Policy</label>
              <textarea
                rows={3}
                value={policies.cancellation}
                onChange={e => setPolicies({ ...policies, cancellation: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PACKAGING & STATUTORY NORMS */}
      {activeSubTab === 'legal_info' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Packaging Standards & Statutory Guidelines</h3>
            <p className="text-xs text-stone-500">Legal declarations mandated by Legal Metrology and FSSAI (Packaging & Labelling) Regulations.</p>
          </div>

          <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-800" />
                <span>Mandatory Package Label Checklist</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
                <li>Name of Food Product and Brand Logo</li>
                <li>List of Ingredients in descending order of weight</li>
                <li>Nutritional Information per 100g serving</li>
                <li>Vegetarian / Non-Vegetarian Logo (Green Dot inside Green Square)</li>
                <li>Food Additives, Processing Aids, and Allergen Declarations</li>
                <li>Name and Complete Address of Manufacturer, Packer, and Marketer</li>
                <li>FSSAI Logo and 14-digit License Number</li>
                <li>Net Quantity (Weight when packed)</li>
                <li>Batch Code, Date of Manufacture, and Best Before / Expiry Period</li>
                <li>Maximum Retail Price (MRP inclusive of all taxes)</li>
                <li>Customer Care Helpline Phone Number, Email, and Grievance Postal Address</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1 text-amber-950">
              <span className="font-bold block">FSSAI Claims Caution:</span>
              <p>
                Under the Food Safety and Standards (Advertising and Claims) Regulations, claims such as “High Protein” or “100% Natural” must strictly be substantiated by analytical testing reports. Avoid unauthorized health or therapeutic claims.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
