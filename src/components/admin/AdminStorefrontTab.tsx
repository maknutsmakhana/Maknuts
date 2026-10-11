import React, { useState } from 'react';
import { 
  StoreSettings, 
  SectionVisibility, 
  HeroSectionSettings, 
  PromoBannerSettings, 
  FaqItem, 
  SocialLinksSettings 
} from '../../types';
import { 
  Palette, 
  Eye, 
  EyeOff, 
  Save, 
  Check, 
  RotateCcw, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  Share2, 
  ExternalLink,
  MessageCircle,
  AlertCircle
} from 'lucide-react';

interface AdminStorefrontTabProps {
  settings: StoreSettings;
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
  onPreviewStorefront: () => void;
}

export const AdminStorefrontTab: React.FC<AdminStorefrontTabProps> = ({
  settings,
  onSaveSettings,
  onPreviewStorefront,
}) => {
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const visibility: SectionVisibility = form.sectionVisibility || {
    announcementBar: true,
    headerNavigation: true,
    heroBanner: true,
    promoBanner: true,
    productShowcase: true,
    benefitsSection: true,
    foodCompliance: true,
    gallerySection: true,
    reviewsSection: true,
    faqSection: true,
    aboutSection: true,
    contactSection: true,
    floatingWhatsApp: true,
    footer: true,
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    const updated = {
      ...visibility,
      [key]: !visibility[key],
    };
    setForm({
      ...form,
      sectionVisibility: updated,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings(form);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // FAQ Handlers
  const faqs = form.faqs || [];
  const handleAddFaq = () => {
    const newFaq: FaqItem = {
      id: 'faq-' + Date.now(),
      question: 'New Question',
      answer: 'Answer description goes here.',
    };
    setForm({
      ...form,
      faqs: [...faqs, newFaq],
    });
  };

  const handleUpdateFaq = (id: string, question: string, answer: string) => {
    setForm({
      ...form,
      faqs: faqs.map(f => f.id === id ? { ...f, question, answer } : f),
    });
  };

  const handleDeleteFaq = (id: string) => {
    setForm({
      ...form,
      faqs: faqs.filter(f => f.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Save Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-800" />
            <span>Storefront Layout & Visual Control</span>
          </h2>
          <p className="text-xs text-stone-500">
            Customize typography, banners, sections visibility, and page copy with zero code changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviewStorefront}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Store</span>
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
            <span>{saveToast ? 'Published!' : isSaving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MASTER SECTION SHOW / HIDE CONTROLS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-800" />
            <span>Section Visibility Matrix</span>
          </h3>
          <span className="text-[11px] text-stone-500">
            Turn sections ON/OFF on the live storefront instantly
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {[
            { key: 'announcementBar', label: 'Announcement / Top Bar', desc: 'Promo bar at page header' },
            { key: 'headerNavigation', label: 'Header Navigation', desc: 'Logo, shop title & track order' },
            { key: 'heroBanner', label: 'Hero Banner Section', desc: 'Main headline, badge & CTA buttons' },
            { key: 'promoBanner', label: 'Promotional Banner', desc: 'Secondary promotion highlight' },
            { key: 'productShowcase', label: 'Product Showcase', desc: 'Main product cards & ordering' },
            { key: 'foodCompliance', label: 'Food & FSSAI Compliance', desc: 'Nutrition table, statutory & claims' },
            { key: 'benefitsSection', label: 'Why Choose Us / Benefits', desc: 'Handpicked, roasted & pure' },
            { key: 'gallerySection', label: 'Photo Gallery', desc: 'Customer & farm gallery photos' },
            { key: 'reviewsSection', label: 'Verified Reviews Hub', desc: 'Ratings & verified buyer reviews' },
            { key: 'faqSection', label: 'FAQ Accordion', desc: 'Customer questions & answers' },
            { key: 'floatingWhatsApp', label: 'Floating WhatsApp Button', desc: 'Instant WhatsApp chat bubble' },
            { key: 'footer', label: 'Store Footer', desc: 'Policies, contact info & copyright' },
          ].map(item => {
            const isVisible = visibility[item.key as keyof SectionVisibility] !== false;
            return (
              <div 
                key={item.key}
                onClick={() => toggleSection(item.key as keyof SectionVisibility)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isVisible 
                    ? 'bg-emerald-50/50 border-emerald-300/80 text-emerald-950' 
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className={`text-xs font-bold truncate ${isVisible ? 'text-stone-900' : 'text-stone-500 line-through'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">{item.desc}</div>
                </div>

                <button
                  type="button"
                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isVisible ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: BRANDING & ANNOUNCEMENT BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif">
          Store Branding & Top Bar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={form.shopName}
              onChange={e => setForm({ ...form, shopName: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Store Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={e => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Brand Badge (e.g. 100% PURE BIHAR)
            </label>
            <input
              type="text"
              value={form.brandBadge}
              onChange={e => setForm({ ...form, brandBadge: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs uppercase font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Announcement Bar Text */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-stone-700">
              Announcement / Notification Bar Text
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-500">Visible</span>
              <input
                type="checkbox"
                checked={form.bannerVisible}
                onChange={e => setForm({ ...form, bannerVisible: e.target.checked })}
                className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
              />
            </div>
          </div>
          <input
            type="text"
            value={form.bannerText}
            onChange={e => setForm({ ...form, bannerText: e.target.value })}
            placeholder="e.g. 🥜 Pure Harvest Special: ₹100 OFF 2-Pack orders! Use code WELCOME10"
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>
      </div>

      {/* SECTION 3: HERO BANNER SECTION CONTROLS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Hero Banner Content & CTA Buttons</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-500">CTA Buttons</span>
            <input
              type="checkbox"
              checked={form.heroSection?.showCtaButtons !== false}
              onChange={e => setForm({
                ...form,
                heroSection: {
                  ...form.heroSection,
                  showCtaButtons: e.target.checked,
                  heading: form.heroSection?.heading || '100% Pure Organic Makhana',
                  subheading: form.heroSection?.subheading || '',
                }
              })}
              className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Hero Heading
              </label>
              <input
                type="text"
                value={form.heroSection?.heading || ''}
                onChange={e => setForm({
                  ...form,
                  heroSection: {
                    ...form.heroSection,
                    heading: e.target.value,
                    subheading: form.heroSection?.subheading || '',
                  }
                })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Hero Badge Tag
              </label>
              <input
                type="text"
                value={form.heroSection?.badge || ''}
                onChange={e => setForm({
                  ...form,
                  heroSection: {
                    ...form.heroSection,
                    badge: e.target.value,
                    heading: form.heroSection?.heading || '',
                    subheading: form.heroSection?.subheading || '',
                  }
                })}
                placeholder="e.g. FRESH CROP 2026"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold uppercase text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Hero Subheading
            </label>
            <textarea
              rows={2}
              value={form.heroSection?.subheading || ''}
              onChange={e => setForm({
                ...form,
                heroSection: {
                  ...form.heroSection,
                  subheading: e.target.value,
                  heading: form.heroSection?.heading || '',
                }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Primary CTA Button Label
              </label>
              <input
                type="text"
                value={form.heroSection?.primaryCtaText || 'Shop Fresh Harvest'}
                onChange={e => setForm({
                  ...form,
                  heroSection: {
                    ...form.heroSection,
                    primaryCtaText: e.target.value,
                    heading: form.heroSection?.heading || '',
                    subheading: form.heroSection?.subheading || '',
                  }
                })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Secondary CTA Button Label
              </label>
              <input
                type="text"
                value={form.heroSection?.secondaryCtaText || 'Quick WhatsApp Order'}
                onChange={e => setForm({
                  ...form,
                  heroSection: {
                    ...form.heroSection,
                    secondaryCtaText: e.target.value,
                    heading: form.heroSection?.heading || '',
                    subheading: form.heroSection?.subheading || '',
                  }
                })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: PROMOTIONAL BANNER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            Middle Promotional Banner
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-500">Banner Enabled</span>
            <input
              type="checkbox"
              checked={form.promoBanner?.enabled !== false}
              onChange={e => setForm({
                ...form,
                promoBanner: {
                  ...form.promoBanner,
                  enabled: e.target.checked,
                  title: form.promoBanner?.title || 'Save with Value Packs',
                  subtitle: form.promoBanner?.subtitle || '',
                }
              })}
              className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Banner Headline
            </label>
            <input
              type="text"
              value={form.promoBanner?.title || ''}
              onChange={e => setForm({
                ...form,
                promoBanner: {
                  ...form.promoBanner,
                  title: e.target.value,
                  subtitle: form.promoBanner?.subtitle || '',
                }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Banner Tag / Badge
            </label>
            <input
              type="text"
              value={form.promoBanner?.badge || ''}
              onChange={e => setForm({
                ...form,
                promoBanner: {
                  ...form.promoBanner,
                  badge: e.target.value,
                  title: form.promoBanner?.title || '',
                  subtitle: form.promoBanner?.subtitle || '',
                }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs uppercase font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Banner Subtitle / Description
          </label>
          <input
            type="text"
            value={form.promoBanner?.subtitle || ''}
            onChange={e => setForm({
              ...form,
              promoBanner: {
                ...form.promoBanner,
                subtitle: e.target.value,
                title: form.promoBanner?.title || '',
              }
            })}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>
      </div>

      {/* SECTION 5: FAQ MANAGER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-800" />
              <span>Customer FAQ Management</span>
            </h3>
            <p className="text-xs text-stone-500">
              Answer common buyer inquiries regarding freshness, delivery, shelf life, and payments.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddFaq}
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={faq.id} className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-stone-400">
                  Question #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteFaq(faq.id)}
                  className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                  title="Delete question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                value={faq.question}
                onChange={e => handleUpdateFaq(faq.id, e.target.value, faq.answer)}
                placeholder="Question"
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />

              <textarea
                rows={2}
                value={faq.answer}
                onChange={e => handleUpdateFaq(faq.id, faq.question, e.target.value)}
                placeholder="Detailed Answer"
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: SOCIAL LINKS & FOOTER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-800" />
          <span>Social Media & Footer Links</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Instagram Profile URL
            </label>
            <input
              type="text"
              value={form.socialLinks?.instagram || ''}
              onChange={e => setForm({
                ...form,
                socialLinks: { ...form.socialLinks, instagram: e.target.value }
              })}
              placeholder="https://instagram.com/maknuts"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Facebook Page URL
            </label>
            <input
              type="text"
              value={form.socialLinks?.facebook || ''}
              onChange={e => setForm({
                ...form,
                socialLinks: { ...form.socialLinks, facebook: e.target.value }
              })}
              placeholder="https://facebook.com/maknuts"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              WhatsApp Community / Channel
            </label>
            <input
              type="text"
              value={form.socialLinks?.whatsapp || ''}
              onChange={e => setForm({
                ...form,
                socialLinks: { ...form.socialLinks, whatsapp: e.target.value }
              })}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Footer Craftsmanship Note
            </label>
            <input
              type="text"
              value={form.footerText?.craftedBy || ''}
              onChange={e => setForm({
                ...form,
                footerText: { ...form.footerText, craftedBy: e.target.value }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Copyright Text
            </label>
            <input
              type="text"
              value={form.footerText?.copyright || ''}
              onChange={e => setForm({
                ...form,
                footerText: { ...form.footerText, copyright: e.target.value }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: STOREFRONT ACTION BUTTONS TEXT CONTROLS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-800" />
          <span>Action Buttons & CTA Text Labels</span>
        </h3>
        <p className="text-xs text-stone-500">
          Customize the exact words shown on all interactive buttons across the customer experience.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              "Buy Now" Button Label
            </label>
            <input
              type="text"
              value={form.buttons?.buyNow || 'Buy Now'}
              onChange={e => setForm({
                ...form,
                buttons: { ...form.buttons, buyNow: e.target.value }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              "WhatsApp Order" Button Label
            </label>
            <input
              type="text"
              value={form.buttons?.whatsappOrder || 'Order via WhatsApp'}
              onChange={e => setForm({
                ...form,
                buttons: { ...form.buttons, whatsappOrder: e.target.value }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              "Copy UPI ID" Button Label
            </label>
            <input
              type="text"
              value={form.buttons?.copyUpi || 'Copy UPI ID'}
              onChange={e => setForm({
                ...form,
                buttons: { ...form.buttons, copyUpi: e.target.value }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              "Track Order" Button Label
            </label>
            <input
              type="text"
              value={form.buttons?.trackOrder || 'Track Order'}
              onChange={e => setForm({
                ...form,
                buttons: { ...form.buttons, trackOrder: e.target.value }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              "Chat on WhatsApp" Label
            </label>
            <input
              type="text"
              value={form.buttons?.chatWhatsApp || 'Chat with Us'}
              onChange={e => setForm({
                ...form,
                buttons: { ...form.buttons, chatWhatsApp: e.target.value }
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
