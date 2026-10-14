import React, { useState } from 'react';
import { StoreSettings, SeoSettings } from '../../types';
import { 
  Search, 
  Save, 
  Check, 
  Globe, 
  Share2, 
  Sparkles,
  Info,
  Code,
  Copy,
  Twitter,
  Link2
} from 'lucide-react';

interface AdminSeoTabProps {
  settings: StoreSettings;
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
}

export const AdminSeoTab: React.FC<AdminSeoTabProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [seo, setSeo] = useState<SeoSettings>({
    pageTitle: settings.seo?.pageTitle || 'Maknuts — 100% Pure Organic Makhana | Fresh Bihar Harvest',
    metaDescription: settings.seo?.metaDescription || 'Direct from Bihar lotus ponds, handpicked jumbo grade raw phool makhana. Rich in protein, zero preservatives, 100% natural superfood delivered pan-India.',
    keywords: settings.seo?.keywords || 'makhana, fox nuts, lotus seeds, phool makhana, roasted makhana, bihar makhana, organic snack, high protein, healthy food',
    canonicalUrl: settings.seo?.canonicalUrl || 'https://maknuts.com',
    ogTitle: settings.seo?.ogTitle || 'Maknuts — 100% Pure Organic Makhana',
    ogDescription: settings.seo?.ogDescription || 'Direct from Bihar lotus ponds, handpicked jumbo grade raw phool makhana. Rich in protein, zero preservatives, 100% natural superfood.',
    ogImage: settings.seo?.ogImage || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=1200',
    twitterCard: settings.seo?.twitterCard || 'summary_large_image',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings({ seo });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Structured Data (JSON-LD) representation
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${seo.canonicalUrl || 'https://maknuts.com'}#organization`,
        name: 'Maknuts Agri Foods',
        url: seo.canonicalUrl || 'https://maknuts.com',
        logo: {
          '@type': 'ImageObject',
          url: seo.ogImage || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=1200'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: settings.supportPhone || '+91 78010 51792',
          contactType: 'customer support',
          areaServed: 'IN',
          availableLanguage: ['en', 'hi']
        }
      },
      {
        '@type': 'WebSite',
        '@id': `${seo.canonicalUrl || 'https://maknuts.com'}#website`,
        url: seo.canonicalUrl || 'https://maknuts.com',
        name: 'Maknuts',
        description: seo.metaDescription,
        publisher: {
          '@id': `${seo.canonicalUrl || 'https://maknuts.com'}#organization`
        }
      },
      {
        '@type': 'Product',
        name: 'Maknuts 100% Pure Organic Makhana',
        image: [seo.ogImage || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=1200'],
        description: seo.metaDescription,
        brand: {
          '@type': 'Brand',
          name: 'Maknuts'
        },
        offers: {
          '@type': 'Offer',
          url: seo.canonicalUrl || 'https://maknuts.com',
          priceCurrency: 'INR',
          price: '299',
          availability: 'https://schema.org/InStock',
          seller: {
            '@id': `${seo.canonicalUrl || 'https://maknuts.com'}#organization`
          }
        }
      }
    ]
  };

  const jsonLdString = JSON.stringify(jsonLdSchema, null, 2);

  const handleCopyJsonLd = () => {
    navigator.clipboard.writeText(jsonLdString);
    setCopiedJsonLd(true);
    setTimeout(() => setCopiedJsonLd(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-800" />
            <span>Search Engine Optimization (SEO) & Social Sharing</span>
          </h2>
          <p className="text-xs text-stone-500">
            Control Google search snippets, canonical URLs, Twitter cards, and Schema.org structured data.
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
          <span>{saveToast ? 'SEO Saved!' : isSaving ? 'Saving...' : 'Save & Sync SEO'}</span>
        </button>
      </div>

      {/* SECTION 1: SEARCH ENGINE METADATA */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-800" />
          <span>Core Page Title, Meta Tags & Canonical URL</span>
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700">
                Page Title Tag (&lt;title&gt;) *
              </label>
              <span className={`text-[10px] font-mono ${(seo.pageTitle || '').length > 60 ? 'text-amber-600 font-bold' : 'text-stone-400'}`}>
                {(seo.pageTitle || '').length} / 60 recommended
              </span>
            </div>
            <input
              type="text"
              required
              value={seo.pageTitle || ''}
              onChange={e => setSeo({ ...seo, pageTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700">
                Meta Description Tag *
              </label>
              <span className={`text-[10px] font-mono ${(seo.metaDescription || '').length > 160 ? 'text-amber-600 font-bold' : 'text-stone-400'}`}>
                {(seo.metaDescription || '').length} / 160 recommended
              </span>
            </div>
            <textarea
              rows={3}
              required
              value={seo.metaDescription || ''}
              onChange={e => setSeo({ ...seo, metaDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Canonical URL
              </label>
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://maknuts.com"
                  value={seo.canonicalUrl || ''}
                  onChange={e => setSeo({ ...seo, canonicalUrl: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Meta Keywords (Comma separated)
              </label>
              <input
                type="text"
                value={seo.keywords || ''}
                onChange={e => setSeo({ ...seo, keywords: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE GOOGLE SEARCH SNIPPET PREVIEW */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-stone-900 font-serif">
          Google Search Snippet Preview (Desktop & Mobile SERP)
        </h3>

        <div className="p-4 bg-stone-50/80 rounded-xl border border-stone-200 max-w-2xl font-sans space-y-1">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5 truncate">
            <span className="w-4 h-4 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold">M</span>
            <span>{seo.canonicalUrl || 'https://maknuts.com'}</span>
            <span>› shop</span>
          </div>
          <div className="text-sm sm:text-base font-medium text-[#1a0dab] hover:underline cursor-pointer truncate">
            {seo.pageTitle || 'Maknuts — 100% Pure Organic Makhana'}
          </div>
          <div className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
            {seo.metaDescription || 'Direct from Bihar lotus ponds, handpicked jumbo grade raw phool makhana.'}
          </div>
        </div>
      </div>

      {/* SECTION 3: SOCIAL SHARING & OPEN GRAPH / TWITTER CARD */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-800" />
          <span>Social Link Share Cards (WhatsApp, Facebook, Twitter/X)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Social Title (og:title)
              </label>
              <input
                type="text"
                value={seo.ogTitle || ''}
                onChange={e => setSeo({ ...seo, ogTitle: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Social Description (og:description)
              </label>
              <textarea
                rows={2}
                value={seo.ogDescription || ''}
                onChange={e => setSeo({ ...seo, ogDescription: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Social Image Preview URL (og:image)
              </label>
              <input
                type="text"
                value={seo.ogImage || ''}
                onChange={e => setSeo({ ...seo, ogImage: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
                <span>Twitter Card Type (twitter:card)</span>
              </label>
              <select
                value={seo.twitterCard || 'summary_large_image'}
                onChange={e => setSeo({ ...seo, twitterCard: e.target.value as any })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-bold"
              >
                <option value="summary_large_image">summary_large_image (Large Hero Card Preview)</option>
                <option value="summary">summary (Standard Square Thumbnail)</option>
              </select>
            </div>
          </div>

          {/* Social Card Preview */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Live Preview
            </span>
            <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-2xs">
              <div className="h-36 bg-stone-200 overflow-hidden">
                {seo.ogImage ? (
                  <img src={seo.ogImage} alt="OG Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                    No image URL set
                  </div>
                )}
              </div>
              <div className="p-3 bg-stone-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  {seo.canonicalUrl ? new URL(seo.canonicalUrl).hostname : 'maknuts.com'}
                </span>
                <div className="text-xs font-bold text-stone-900 truncate">
                  {seo.ogTitle || seo.pageTitle}
                </div>
                <div className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                  {seo.ogDescription || seo.metaDescription}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: SCHEMA.ORG JSON-LD STRUCTURED DATA */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              Schema.org JSON-LD Structured Data
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyJsonLd}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            {copiedJsonLd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
            <span>{copiedJsonLd ? 'JSON-LD Copied!' : 'Copy JSON-LD'}</span>
          </button>
        </div>
        <p className="text-xs text-stone-500">
          Google Rich Snippets markup automatically generated for Maknuts Organization, WebSite, and Product Offer schemas.
        </p>

        <pre className="p-3.5 bg-stone-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed border border-stone-800">
          {jsonLdString}
        </pre>
      </div>
    </div>
  );
};
