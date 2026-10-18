import React, { useState } from 'react';
import { 
  StoreSettings, 
  WhatsAppSettings, 
  SeoSettings, 
  SocialLinksSettings,
  Product 
} from '../../types';
import { 
  MessageCircle, 
  Search, 
  Share2, 
  Save, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Globe, 
  Code2, 
  Tag, 
  Phone 
} from 'lucide-react';
import { createWhatsAppUrl, renderWhatsAppTemplate } from '../../utils/whatsapp';
import { OrderDisplayControlsTab } from './OrderDisplayControlsTab';

interface MarketingPageProps {
  settings: StoreSettings;
  products: Product[];
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export const MarketingPage: React.FC<MarketingPageProps> = ({
  settings,
  products,
  onSaveSettings,
  initialSubTab = 'whatsapp',
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'order_controls' | 'seo' | 'social' | 'structured_data'>(
    (initialSubTab as any) || 'whatsapp'
  );

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: 'whatsapp' | 'order_controls' | 'seo' | 'social' | 'structured_data') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  // 1. WhatsApp Form
  const [businessNumber, setBusinessNumber] = useState(
    settings.whatsAppSettings?.businessNumber || settings.whatsappNumber || '917801051792'
  );
  const [supportNumber, setSupportNumber] = useState(
    settings.whatsAppSettings?.supportNumber || settings.supportPhone || '917801051792'
  );
  const [orderTemplate, setOrderTemplate] = useState(
    settings.whatsAppSettings?.orderTemplate ||
    '🌿 *NEW ORDER - MAKNUTS* 🌿\n\n📦 *Order ID:* {{orderId}}\n👤 *Customer Name:* {{customerName}}\n📱 *Mobile:* {{phone}}\n📍 *Delivery Address:* {{address}}, PIN: {{pincode}}\n🛒 *Product:* {{productName}} (Qty: {{quantity}})\n💰 *Total:* ₹{{total}}\n💳 *Payment Method:* {{paymentMethod}}\n{{utr}}\n\nPlease confirm my order and send dispatch details. Thank you!'
  );
  const [paymentTemplate, setPaymentTemplate] = useState(
    settings.whatsAppSettings?.paymentTemplate ||
    'Hi {{customerName}}, we have received your payment of ₹{{total}} for Order #{{orderId}}. Your fresh harvest Makhana is scheduled for dispatch.'
  );
  const [supportTemplate, setSupportTemplate] = useState(
    settings.whatsAppSettings?.supportTemplate ||
    'Hello Maknuts Support! I have a question regarding an order or product quality.'
  );
  const [floatingEnabled, setFloatingEnabled] = useState(
    settings.whatsAppSettings?.enableFloatingButton !== false && settings.sectionVisibility?.floatingWhatsApp !== false
  );

  // 2. SEO Form
  const [seo, setSeo] = useState<SeoSettings>({
    pageTitle: settings.seo?.pageTitle || 'Maknuts Makhana — 100% Pure Jumbo Fox Nuts from Bihar',
    metaDescription: settings.seo?.metaDescription || 'Buy fresh, crispy Jumbo Grade Phool Makhana online direct from Mithila, Bihar farms. High protein, gluten-free, zero trans fat. Fast pan-India delivery & COD.',
    keywords: settings.seo?.keywords || 'Maknuts, Makhana, Phool Makhana, Fox Nuts, Lotus Seeds, Bihar Makhana, Mithila Makhana, Healthy Snacks',
    canonicalUrl: settings.seo?.canonicalUrl || 'https://maknuts.com',
    ogTitle: settings.seo?.ogTitle || 'Maknuts Makhana — 100% Pure Jumbo Fox Nuts from Bihar',
    ogDescription: settings.seo?.ogDescription || 'Buy fresh, crispy Jumbo Grade Phool Makhana online direct from Mithila, Bihar farms. High protein, gluten-free, zero trans fat.',
    ogImage: settings.seo?.ogImage || products[0]?.image || '',
    twitterCard: settings.seo?.twitterCard || 'summary_large_image',
    productSeoTitle: settings.seo?.productSeoTitle || 'Maknuts Jumbo Grade Fox Nuts 250g Pouch',
    productDescription: settings.seo?.productDescription || 'Naturally roasted jumbo lotus seeds handpicked from Bihar wetlands. Crunchy, protein-rich, zero preservatives.',
    imageAltText: settings.seo?.imageAltText || 'Maknuts Premium Jumbo Grade Makhana Pouch',
  });

  // 3. Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLinksSettings>({
    instagram: settings.socialLinks?.instagram || 'https://instagram.com/maknutsmakhana',
    facebook: settings.socialLinks?.facebook || 'https://facebook.com/maknutsmakhana',
    youtube: settings.socialLinks?.youtube || '',
    twitter: settings.socialLinks?.twitter || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [testPreviewText, setTestPreviewText] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanBusiness = businessNumber.replace(/\D/g, '');
      const cleanSupport = supportNumber.replace(/\D/g, '');

      const updatedWhatsApp: WhatsAppSettings = {
        businessNumber: cleanBusiness,
        supportNumber: cleanSupport,
        orderTemplate,
        paymentTemplate,
        supportTemplate,
        enabled: true,
        enableFloatingButton: floatingEnabled,
        phoneNumber: cleanBusiness,
      };

      await onSaveSettings({
        whatsappNumber: cleanBusiness,
        supportPhone: cleanSupport,
        whatsAppSettings: updatedWhatsApp,
        seo,
        socialLinks,
        sectionVisibility: {
          ...(settings.sectionVisibility || {}),
          floatingWhatsApp: floatingEnabled,
        }
      });

      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Error saving marketing configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsAppOrder = () => {
    const rendered = renderWhatsAppTemplate(orderTemplate, {
      orderId: 'MK-2610-A7F',
      customerName: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      address: 'House 42, Green Park Road, Darbhanga',
      pincode: '846004',
      productName: 'Maknuts Jumbo 250g',
      quantity: 2,
      total: 598,
      paymentMethod: 'Cash on Delivery',
      utr: ''
    });
    setTestPreviewText(rendered);
    const url = createWhatsAppUrl(businessNumber, rendered);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Save Button */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-800" />
              <span>Marketing, WhatsApp & SEO Automation</span>
            </h2>
            <p className="text-xs text-stone-500">
              One authoritative place for WhatsApp messaging templates, Google search SEO, social cards, and schema structured data.
            </p>
          </div>

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
            <span>{saveToast ? 'Marketing Saved!' : isSaving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'whatsapp', label: 'WhatsApp Automation' },
            { id: 'order_controls', label: 'Order Form & Sharing Toggles ⚙️' },
            { id: 'seo', label: 'SEO & Meta Tags' },
            { id: 'social', label: 'Social Media Links' },
            { id: 'structured_data', label: 'Schema.org JSON-LD' },
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

      {/* SUB-TAB 1: WHATSAPP AUTOMATION */}
      {activeSubTab === 'whatsapp' && (
        <div className="space-y-4">
          {/* Numbers Config */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 font-serif">WhatsApp Contact Numbers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Business WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={businessNumber}
                  onChange={e => setBusinessNumber(e.target.value)}
                  placeholder="e.g. 917801051792"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-stone-500">Receives order checkout notifications</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Support WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={supportNumber}
                  onChange={e => setSupportNumber(e.target.value)}
                  placeholder="e.g. 917801051792"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-stone-500">For floating chat button & customer help</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800 pt-1">
              <input
                type="checkbox"
                checked={floatingEnabled}
                onChange={e => setFloatingEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-800 rounded"
              />
              <span>Display Floating WhatsApp Chat Button on Storefront</span>
            </label>
          </div>

          {/* Placeholders Guide */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
            <span className="text-xs font-bold text-emerald-950 block">Supported Dynamic Template Placeholders:</span>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded-md text-emerald-900 font-bold">{'{{orderId}}'}</span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded-md text-emerald-900 font-bold">{'{{customerName}}'}</span>
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-md text-amber-950 font-bold">{'{{phone}}'}</span>
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-md text-amber-950 font-bold">{'{{address}}'}</span>
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-md text-amber-950 font-bold">{'{{pincode}}'}</span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded-md text-emerald-900 font-bold">{'{{productName}}'}</span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded-md text-emerald-900 font-bold">{'{{quantity}}'}</span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded-md text-emerald-900 font-bold">{'{{total}}'}</span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded-md text-emerald-900 font-bold">{'{{paymentMethod}}'}</span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded-md text-emerald-900 font-bold">{'{{utr}}'}</span>
            </div>
            <p className="text-[11px] text-stone-600">
              When an order is created, customer contact, delivery address, items, and pricing tokens will be replaced with real purchase parameters automatically.
            </p>
          </div>

          {/* 3 Templates (Authoritative) */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 font-serif">Message Templates</h3>
              <button
                type="button"
                onClick={handleTestWhatsAppOrder}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Test Order Message in WhatsApp</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Template */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  1. Order Confirmation Template (Used on Checkout & Success Modal)
                </label>
                <textarea
                  rows={6}
                  value={orderTemplate}
                  onChange={e => setOrderTemplate(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Payment Template */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  2. Payment Received / Verified Template
                </label>
                <textarea
                  rows={3}
                  value={paymentTemplate}
                  onChange={e => setPaymentTemplate(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Support Template */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  3. General Customer Support Template (Floating Button)
                </label>
                <textarea
                  rows={3}
                  value={supportTemplate}
                  onChange={e => setSupportTemplate(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Quick link banner to granular toggles */}
          <div className="p-4 bg-gradient-to-r from-emerald-900 to-stone-900 rounded-3xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <span>⚙️ Granular Order Form & Receipt Display Controls</span>
              </h4>
              <p className="text-xs text-emerald-200 mt-0.5">
                Turn on/off customer name, phone, full address, landmark, PIN code, UPI QR, pricing breakdowns, and WhatsApp receipt lines with instant live preview.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSubTabChange('order_controls')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
            >
              Open Order Controls & Preview →
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB: ORDER & CHECKOUT DISPLAY CONTROLS */}
      {activeSubTab === 'order_controls' && (
        <OrderDisplayControlsTab
          settings={settings}
          onSaveSettings={onSaveSettings}
        />
      )}

      {/* SUB-TAB 2: SEO & META TAGS */}
      {activeSubTab === 'seo' && (
        <div className="space-y-4">
          {/* Google Search Snippet Simulator */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              Live Google Search Preview
            </span>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-xs text-stone-500 block truncate">
                {seo.canonicalUrl || 'https://maknuts.com'}
              </span>
              <h4 className="text-base text-[#1a0dab] hover:underline font-medium cursor-pointer truncate">
                {seo.pageTitle || 'Maknuts Makhana — 100% Pure Jumbo Fox Nuts from Bihar'}
              </h4>
              <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                {seo.metaDescription || 'Buy fresh, crispy Jumbo Grade Phool Makhana online direct from Mithila, Bihar farms. High protein, gluten-free, zero trans fat.'}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Core SEO Metadata</h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Page Title Tag (&lt;title&gt;) *</label>
                <input
                  type="text"
                  value={seo.pageTitle || ''}
                  onChange={e => setSeo({ ...seo, pageTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Meta Description *</label>
                <textarea
                  rows={3}
                  value={seo.metaDescription || ''}
                  onChange={e => setSeo({ ...seo, metaDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Canonical URL</label>
                  <input
                    type="url"
                    value={seo.canonicalUrl || ''}
                    onChange={e => setSeo({ ...seo, canonicalUrl: e.target.value })}
                    placeholder="https://maknuts.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Keywords</label>
                  <input
                    type="text"
                    value={seo.keywords || ''}
                    onChange={e => setSeo({ ...seo, keywords: e.target.value })}
                    placeholder="makhana, fox nuts, roasted makhana"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* OpenGraph & Social Cards */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">OpenGraph & Social Sharing Cards</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">og:title</label>
                    <input
                      type="text"
                      value={seo.ogTitle || ''}
                      onChange={e => setSeo({ ...seo, ogTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Twitter Card Format</label>
                    <select
                      value={seo.twitterCard || 'summary_large_image'}
                      onChange={e => setSeo({ ...seo, twitterCard: e.target.value as any })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                    >
                      <option value="summary_large_image">summary_large_image (Large Hero Card)</option>
                      <option value="summary">summary (Standard Square Card)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">og:image (Social Share Preview Banner URL)</label>
                  <input
                    type="text"
                    value={seo.ogImage || ''}
                    onChange={e => setSeo({ ...seo, ogImage: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SOCIAL MEDIA LINKS */}
      {activeSubTab === 'social' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Social Media Profiles</h3>
            <p className="text-xs text-stone-500">Connected to public website footer and share buttons.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Instagram URL</label>
              <input
                type="url"
                value={socialLinks.instagram || ''}
                onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                placeholder="https://instagram.com/maknutsmakhana"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Facebook URL</label>
              <input
                type="url"
                value={socialLinks.facebook || ''}
                onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                placeholder="https://facebook.com/maknutsmakhana"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">YouTube URL</label>
              <input
                type="url"
                value={socialLinks.youtube || ''}
                onChange={e => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                placeholder="https://youtube.com/@maknutsmakhana"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Twitter / X URL</label>
              <input
                type="url"
                value={socialLinks.twitter || ''}
                onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                placeholder="https://x.com/maknutsmakhana"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SCHEMA.ORG JSON-LD STRUCTURED DATA */}
      {activeSubTab === 'structured_data' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">Public Schema.org JSON-LD Structured Data</h3>
              <p className="text-xs text-stone-500">Live JSON-LD schema injected automatically for Google Rich Snippets.</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Live & Synced
            </span>
          </div>

          <div className="p-4 bg-stone-900 text-amber-200 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed">
            <pre>
{JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": settings.shopName || "Maknuts",
      "url": seo.canonicalUrl || "https://maknuts.com",
      "description": settings.tagline || "100% Pure & Crisp Healthy Makhana",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": supportNumber,
          "contactType": "customer service",
          "email": settings.supportEmail || "maknutsmakhana@gmail.com",
          "areaServed": "IN"
        }
      ]
    },
    {
      "@type": "Product",
      "name": products[0]?.name || "Maknuts Makhana",
      "sku": products[0]?.sku || "MK-JUMBO-250",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": products[0]?.price || 299,
        "availability": "https://schema.org/InStock"
      }
    }
  ]
}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
