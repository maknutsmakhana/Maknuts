import React, { useEffect } from 'react';
import { StoreSettings, Product } from '../types';

interface StoreSeoHeadProps {
  settings: StoreSettings;
  activeProduct: Product;
  isAdminOpen: boolean;
}

export const StoreSeoHead: React.FC<StoreSeoHeadProps> = ({
  settings,
  activeProduct,
  isAdminOpen,
}) => {
  useEffect(() => {
    // If Admin Control Center is active, label browser tab clearly
    if (isAdminOpen) {
      document.title = `${settings.shopName || 'Maknuts'} — Admin Control Center`;
      return;
    }

    const seo = settings.seo || {};

    // 1. Page Title Tag
    const pageTitle = seo.pageTitle || 
      (settings.shopName ? `${settings.shopName} — ${settings.tagline || '100% Premium Roasted Makhana'}` : 'Maknuts Makhana');
    document.title = pageTitle;

    // Helper to safely set or create a <meta> tag
    const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Meta Description
    const metaDesc = seo.metaDescription || 
      'Buy fresh, crispy, 100% natural Maknuts Makhana. Farm-fresh, roasted jumbo lotus seeds packed with protein and nutrients.';
    setMetaTag('name', 'description', metaDesc);

    // 3. Keywords
    if (seo.keywords) {
      setMetaTag('name', 'keywords', seo.keywords);
    }

    // 4. Canonical URL
    const canonicalUrl = seo.canonicalUrl || window.location.origin;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 5. OpenGraph Tags
    const ogTitle = seo.ogTitle || pageTitle;
    const ogDesc = seo.ogDescription || metaDesc;
    const ogImg = seo.ogImage || activeProduct?.image || '';

    setMetaTag('property', 'og:title', ogTitle);
    setMetaTag('property', 'og:description', ogDesc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    if (ogImg) {
      setMetaTag('property', 'og:image', ogImg);
    }

    // 6. Twitter Card
    const twitterCardType = seo.twitterCard || 'summary_large_image';
    setMetaTag('name', 'twitter:card', twitterCardType);
    setMetaTag('name', 'twitter:title', ogTitle);
    setMetaTag('name', 'twitter:description', ogDesc);
    if (ogImg) {
      setMetaTag('name', 'twitter:image', ogImg);
    }

    // 7. Structured Data (JSON-LD) for Organization & Product/Offer
    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${canonicalUrl}#organization`,
          name: settings.shopName || 'Maknuts',
          url: canonicalUrl,
          logo: settings.logoUrl || ogImg,
          description: settings.tagline || '100% Pure & Crisp Healthy Makhana',
          contactPoint: [
            {
              '@type': 'ContactPoint',
              telephone: settings.supportPhone || settings.whatsappNumber,
              contactType: 'customer support',
              email: settings.supportEmail || 'maknutsmakhana@gmail.com',
              areaServed: 'IN',
              availableLanguage: ['English', 'Hindi']
            }
          ],
          address: {
            '@type': 'PostalAddress',
            streetAddress: settings.address || 'Maknuts Agri Foods, Darbhanga',
            addressLocality: 'Darbhanga',
            addressRegion: 'Bihar',
            postalCode: '846004',
            addressCountry: 'IN'
          }
        },
        {
          '@type': 'Product',
          '@id': `${canonicalUrl}#product`,
          name: activeProduct?.name || 'Maknuts Makhana',
          description: seo.productDescription || activeProduct?.shortDescription || activeProduct?.tagline || metaDesc,
          image: [activeProduct?.image || ogImg],
          sku: activeProduct?.sku || 'MK-JUMBO-250',
          category: activeProduct?.category || 'Food & Grocery > Snack Foods > Nuts & Seeds',
          brand: {
            '@type': 'Brand',
            name: settings.shopName || 'Maknuts'
          },
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            priceCurrency: 'INR',
            price: activeProduct?.price || 299,
            priceValidUntil: '2026-12-31',
            itemCondition: 'https://schema.org/NewCondition',
            availability: activeProduct?.inStock !== false 
              ? 'https://schema.org/InStock' 
              : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: settings.shopName || 'Maknuts'
            }
          }
        }
      ]
    };

    // Inject or update structured data script
    const scriptId = 'maknuts-seo-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schemaData);

  }, [settings.seo, settings.shopName, settings.tagline, settings.supportPhone, settings.whatsappNumber, settings.supportEmail, settings.address, activeProduct, isAdminOpen]);

  return null;
};
