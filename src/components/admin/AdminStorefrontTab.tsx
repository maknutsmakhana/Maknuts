import React, { useState } from 'react';
import { 
  StoreSettings, 
  SectionVisibility, 
  HeroSectionSettings, 
  PromoBannerSettings, 
  FaqItem, 
  GalleryPhoto,
  BenefitItem
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
  ArrowUp,
  ArrowDown,
  GripVertical,
  Camera,
  MessageSquareHeart,
  ShieldCheck,
  Award,
  PhoneCall,
  ShoppingBag,
  MessageCircle,
  Image as ImageIcon,
  ExternalLink,
  X
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../../constants';

interface AdminStorefrontTabProps {
  settings: StoreSettings;
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
  onPreviewStorefront: () => void;
  initialSection?: string;
}

export const AdminStorefrontTab: React.FC<AdminStorefrontTabProps> = ({
  settings,
  onSaveSettings,
  onPreviewStorefront,
  initialSection,
}) => {
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [activeSectionEditor, setActiveSectionEditor] = useState<string>(initialSection || 'hero');

  React.useEffect(() => {
    if (initialSection) {
      setActiveSectionEditor(initialSection);
    }
  }, [initialSection]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // New gallery photo state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoTag, setNewPhotoTag] = useState('Farm Harvest');

  const defaultOrder = [
    'heroBanner',
    'promoBanner',
    'productShowcase',
    'foodCompliance',
    'benefitsSection',
    'gallerySection',
    'reviewsSection',
    'faqSection',
    'contactSection',
    'footer',
  ];

  const currentOrder = (Array.isArray(form.sectionOrder) && form.sectionOrder.length > 0)
    ? form.sectionOrder
    : defaultOrder;

  // Ensure all standard sections exist in the list
  const fullOrderList = [...currentOrder];
  defaultOrder.forEach(sec => {
    if (!fullOrderList.includes(sec)) {
      fullOrderList.push(sec);
    }
  });

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

  const sectionMeta: Record<string, { label: string; desc: string; icon: any }> = {
    heroBanner: { label: 'Hero Banner', desc: 'Main headline, badge, CTA buttons & farm photo', icon: Sparkles },
    promoBanner: { label: 'Promotional Banner', desc: 'Special discount strip & promo coupon highlight', icon: Sparkles },
    productShowcase: { label: 'Product Showcase', desc: 'Featured makhana packs, selector tabs & buy buttons', icon: ShoppingBag },
    foodCompliance: { label: 'Food & FSSAI Compliance', desc: 'Nutrition table, FSSAI licence & statutory claims', icon: ShieldCheck },
    benefitsSection: { label: 'Why Choose Us / Benefits', desc: 'Farm-direct, roasted crunch & purity benefits cards', icon: Award },
    gallerySection: { label: 'Photo Gallery', desc: 'Wetland harvest, roasting & customer photos viewer', icon: Camera },
    reviewsSection: { label: 'Customer Reviews Hub', desc: 'Star ratings, verified customer feedback & guarantee', icon: MessageSquareHeart },
    faqSection: { label: 'FAQ Accordion', desc: 'Expandable questions & answers about orders and shelf-life', icon: HelpCircle },
    contactSection: { label: 'Contact & Support', desc: 'WhatsApp chat, phone line, hours & origin warehouse', icon: PhoneCall },
    footer: { label: 'Store Footer', desc: 'About store, craftsmanship promise, policies & social links', icon: Layers },
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    const nextVal = !visibility[key];
    const updated = {
      ...visibility,
      [key]: nextVal,
    };
    const nextWhatsAppSettings = key === 'floatingWhatsApp'
      ? { ...(form.whatsAppSettings || {}), enableFloatingButton: nextVal, enabled: nextVal }
      : form.whatsAppSettings;

    setForm({
      ...form,
      sectionVisibility: updated,
      whatsAppSettings: nextWhatsAppSettings,
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fullOrderList.length) return;

    const updated = [...fullOrderList];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);

    setForm({
      ...form,
      sectionOrder: updated,
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...fullOrderList];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setForm({
      ...form,
      sectionOrder: updated,
    });
    setDraggedIndex(null);
  };

  const handleResetOrder = () => {
    if (confirm('Reset section order to standard store layout?')) {
      setForm({
        ...form,
        sectionOrder: [...defaultOrder],
      });
    }
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
      visible: true,
    };
    setForm({
      ...form,
      faqs: [...faqs, newFaq],
    });
  };

  const handleUpdateFaq = (id: string, question: string, answer: string, visible?: boolean) => {
    setForm({
      ...form,
      faqs: faqs.map(f => f.id === id ? { ...f, question, answer, visible: visible !== undefined ? visible : (f.visible !== false) } : f),
    });
  };

  const handleToggleFaqVisible = (id: string) => {
    setForm({
      ...form,
      faqs: faqs.map(f => f.id === id ? { ...f, visible: f.visible === false ? true : false } : f),
    });
  };

  const handleDeleteFaq = (id: string) => {
    setForm({
      ...form,
      faqs: faqs.filter(f => f.id !== id),
    });
  };

  // Gallery Photos Handlers
  const galleryPhotos = form.gallerySection?.photos || [];
  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }
    const newPhoto: GalleryPhoto = {
      id: 'gp-' + Date.now(),
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Maknuts Farm Purity',
      tag: newPhotoTag.trim() || 'Harvest',
      createdAt: new Date().toISOString(),
    };
    setForm({
      ...form,
      gallerySection: {
        ...(form.gallerySection || DEFAULT_SETTINGS.gallerySection),
        photos: [...galleryPhotos, newPhoto],
      },
    });
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  const handleDeletePhoto = (id: string) => {
    setForm({
      ...form,
      gallerySection: {
        ...(form.gallerySection || DEFAULT_SETTINGS.gallerySection),
        photos: galleryPhotos.filter(p => p.id !== id),
      },
    });
  };

  // Benefits Handlers
  const benefitItems = form.benefitsSection?.items || [];
  const handleUpdateBenefit = (id: string, title: string, desc: string) => {
    setForm({
      ...form,
      benefitsSection: {
        ...(form.benefitsSection || DEFAULT_SETTINGS.benefitsSection),
        items: benefitItems.map(b => b.id === id ? { ...b, title, desc } : b),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Save Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-800" />
            <span>Storefront Top-to-Bottom Control</span>
          </h2>
          <p className="text-xs text-stone-500">
            Reorder sections, edit headings, toggle CTA buttons, and customize photos in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Preview changes before publishing"
          >
            <Eye className="w-4 h-4 text-emerald-800" />
            <span>Preview Changes</span>
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

      {/* SECTION 1: DYNAMIC SECTION REORDERING & VISIBILITY */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-800" />
              <span>Section Sequence & Visibility (Live Dynamic Ordering)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Drag or use Move Up/Down to rearrange sections. The customer storefront immediately follows this sequence.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetOrder}
            className="self-start sm:self-auto px-3 py-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1 font-medium cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Default Order</span>
          </button>
        </div>

        <div className="space-y-2">
          {fullOrderList.map((secKey, idx) => {
            const meta = sectionMeta[secKey] || { label: secKey, desc: 'Section', icon: Layers };
            const Icon = meta.icon;
            const isVisible = visibility[secKey as keyof SectionVisibility] !== false;

            return (
              <div
                key={secKey}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isVisible 
                    ? 'bg-white border-stone-200 shadow-2xs hover:border-emerald-300' 
                    : 'bg-stone-50 border-stone-200/80 opacity-60'
                } ${draggedIndex === idx ? 'border-dashed border-emerald-500 bg-emerald-50/40' : ''}`}
              >
                {/* Drag Handle & Order Badge */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 p-1 rounded" 
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>

                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate ${isVisible ? 'text-stone-900' : 'text-stone-500 line-through'}`}>
                      {meta.label}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate hidden sm:block">
                      {meta.desc}
                    </div>
                  </div>
                </div>

                {/* Controls: Move Up, Move Down, Show/Hide */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 cursor-pointer transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === fullOrderList.length - 1}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 cursor-pointer transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSection(secKey as keyof SectionVisibility)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isVisible
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                    }`}
                    title={isVisible ? "Click to hide from customer website" : "Click to show on customer website"}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">{isVisible ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: EDIT SECTION TITLES, SUBTITLES & CONTENT */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            Edit Section Titles, Subtitles, Banners & Buttons
          </h3>
          <p className="text-xs text-stone-500">
            Select a section below to configure copy, headings, imagery, and interactive CTA buttons.
          </p>

          {/* Editor Tabs Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 pb-1">
            {[
              { id: 'hero', label: 'Hero Banner' },
              { id: 'promo', label: 'Promo Banner' },
              { id: 'product', label: 'Product Showcase' },
              { id: 'compliance', label: 'Food & FSSAI' },
              { id: 'benefits', label: 'Why Choose Us' },
              { id: 'gallery', label: 'Photo Gallery' },
              { id: 'reviews', label: 'Reviews Hub' },
              { id: 'faq', label: 'FAQ Accordion' },
              { id: 'contact', label: 'Contact & Support' },
              { id: 'branding', label: 'Branding & Header' },
              { id: 'buttons', label: 'CTA Buttons' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSectionEditor(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  activeSectionEditor === tab.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. HERO SECTION CUSTOMIZER */}
        {activeSectionEditor === 'hero' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Hero Section Details</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                <input
                  type="checkbox"
                  checked={form.heroSection?.showCtaButtons !== false}
                  onChange={e => setForm({
                    ...form,
                    heroSection: {
                      ...(form.heroSection || {}),
                      showCtaButtons: e.target.checked,
                    }
                  })}
                  className="w-4 h-4 accent-emerald-800 rounded"
                />
                <span>Enable Hero CTA Buttons</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Hero Heading *
                </label>
                <input
                  type="text"
                  value={form.heroSection?.heading || ''}
                  onChange={e => setForm({
                    ...form,
                    heroSection: { ...(form.heroSection || {}), heading: e.target.value }
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
                    heroSection: { ...(form.heroSection || {}), badge: e.target.value }
                  })}
                  placeholder="e.g. 100% Mithila Origin"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold uppercase text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Hero Subheading / Story
              </label>
              <textarea
                rows={2}
                value={form.heroSection?.subheading || ''}
                onChange={e => setForm({
                  ...form,
                  heroSection: { ...(form.heroSection || {}), subheading: e.target.value }
                })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            {/* Banner Image URL with Preview */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                Hero Banner / Product Photo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.heroSection?.bannerImage || ''}
                  onChange={e => setForm({
                    ...form,
                    heroSection: { ...(form.heroSection || {}), bannerImage: e.target.value }
                  })}
                  placeholder="https://images.unsplash.com/... or paste image URL"
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 font-mono"
                />
              </div>
              {form.heroSection?.bannerImage && (
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={form.heroSection.bannerImage}
                    alt="Hero Preview"
                    className="w-14 h-14 rounded-lg object-cover border border-stone-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[11px] text-stone-500">Image successfully loaded for hero card</span>
                </div>
              )}
            </div>

            {/* CTA Button Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">Primary CTA Button</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-stone-600">
                    <input
                      type="checkbox"
                      checked={form.heroSection?.enablePrimaryCta !== false}
                      onChange={e => setForm({
                        ...form,
                        heroSection: { ...(form.heroSection || {}), enablePrimaryCta: e.target.checked }
                      })}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={form.heroSection?.primaryCtaText || 'Shop Fresh Harvest'}
                  onChange={e => setForm({
                    ...form,
                    heroSection: { ...(form.heroSection || {}), primaryCtaText: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">Secondary WhatsApp CTA</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-stone-600">
                    <input
                      type="checkbox"
                      checked={form.heroSection?.enableSecondaryCta !== false}
                      onChange={e => setForm({
                        ...form,
                        heroSection: { ...(form.heroSection || {}), enableSecondaryCta: e.target.checked }
                      })}
                      className="w-3.5 h-3.5 accent-emerald-800 rounded"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={form.heroSection?.secondaryCtaText || 'Quick WhatsApp Order'}
                  onChange={e => setForm({
                    ...form,
                    heroSection: { ...(form.heroSection || {}), secondaryCtaText: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. PROMOTIONAL BANNER CUSTOMIZER */}
        {activeSectionEditor === 'promo' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Promotional Strip Details</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                <input
                  type="checkbox"
                  checked={form.promoBanner?.enabled !== false}
                  onChange={e => setForm({
                    ...form,
                    promoBanner: { ...(form.promoBanner || {}), enabled: e.target.checked }
                  })}
                  className="w-4 h-4 accent-emerald-800 rounded"
                />
                <span>Banner Enabled</span>
              </label>
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
                    promoBanner: { ...(form.promoBanner || {}), title: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Banner Badge Tag
                </label>
                <input
                  type="text"
                  value={form.promoBanner?.badge || ''}
                  onChange={e => setForm({
                    ...form,
                    promoBanner: { ...(form.promoBanner || {}), badge: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs uppercase font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Banner Subtitle / Description
                </label>
                <input
                  type="text"
                  value={form.promoBanner?.description || form.promoBanner?.subtitle || ''}
                  onChange={e => setForm({
                    ...form,
                    promoBanner: { 
                      ...(form.promoBanner || {}), 
                      description: e.target.value,
                      subtitle: e.target.value 
                    }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Coupon Code Tag (Optional)
                </label>
                <input
                  type="text"
                  value={form.promoBanner?.couponCodeBadge || ''}
                  onChange={e => setForm({
                    ...form,
                    promoBanner: { ...(form.promoBanner || {}), couponCodeBadge: e.target.value.toUpperCase() }
                  })}
                  placeholder="e.g. MAKNUTS50"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold uppercase text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Background Theme
              </label>
              <div className="flex gap-3">
                {[
                  { id: 'emerald', label: 'Emerald Green', cls: 'bg-emerald-800 text-white' },
                  { id: 'amber', label: 'Warm Amber', cls: 'bg-amber-600 text-white' },
                  { id: 'stone', label: 'Deep Charcoal', cls: 'bg-stone-900 text-white' },
                ].map(th => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setForm({
                      ...form,
                      promoBanner: { ...(form.promoBanner || {}), bgColor: th.id as any }
                    })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      form.promoBanner?.bgColor === th.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    } ${th.cls}`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. PRODUCT SHOWCASE CUSTOMIZER */}
        {activeSectionEditor === 'product' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Product Showcase Headers & CTA Buttons</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Section Title (Optional)
                </label>
                <input
                  type="text"
                  value={form.productSectionTitle || ''}
                  onChange={e => setForm({ ...form, productSectionTitle: e.target.value })}
                  placeholder="e.g. Our Farm-Direct Makhana Harvest"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Section Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={form.productSectionSubtitle || ''}
                  onChange={e => setForm({ ...form, productSectionSubtitle: e.target.value })}
                  placeholder="e.g. Grade 6+ Sutta Fox Nuts hand-roasted to perfection"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                <input
                  type="checkbox"
                  checked={form.buttons?.enableBuyNow !== false}
                  onChange={e => setForm({
                    ...form,
                    buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), enableBuyNow: e.target.checked }
                  })}
                  className="w-4 h-4 accent-emerald-800 rounded"
                />
                <span>Enable "Buy Now" Checkout CTA</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                <input
                  type="checkbox"
                  checked={form.buttons?.enableWhatsAppOrder !== false}
                  onChange={e => setForm({
                    ...form,
                    buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), enableWhatsAppOrder: e.target.checked }
                  })}
                  className="w-4 h-4 accent-emerald-800 rounded"
                />
                <span>Enable "Order via WhatsApp" CTA</span>
              </label>
            </div>
          </div>
        )}

        {/* 4. FOOD & FSSAI COMPLIANCE */}
        {activeSectionEditor === 'compliance' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Food & FSSAI Statutory Compliance</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={form.foodComplianceSectionTitle || 'Food Safety, Nutrition & Statutory Details'}
                  onChange={e => setForm({ ...form, foodComplianceSectionTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={form.foodComplianceSectionSubtitle || 'Complete transparency: Tested nutritional facts & statutory notice.'}
                  onChange={e => setForm({ ...form, foodComplianceSectionSubtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                FSSAI License Number
              </label>
              <input
                type="text"
                value={form.foodCompliance?.fssaiNumber || ''}
                onChange={e => setForm({
                  ...form,
                  foodCompliance: { ...(form.foodCompliance || DEFAULT_SETTINGS.foodCompliance), fssaiNumber: e.target.value }
                })}
                placeholder="e.g. 10424000000001"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
        )}

        {/* 5. BENEFITS SECTION */}
        {activeSectionEditor === 'benefits' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Why Choose Us / Nutrition Benefits</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={form.benefitsSection?.title || ''}
                  onChange={e => setForm({
                    ...form,
                    benefitsSection: { ...(form.benefitsSection || DEFAULT_SETTINGS.benefitsSection), title: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={form.benefitsSection?.subtitle || ''}
                  onChange={e => setForm({
                    ...form,
                    benefitsSection: { ...(form.benefitsSection || DEFAULT_SETTINGS.benefitsSection), subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-stone-700 block">Benefit Feature Cards</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {benefitItems.map((b, idx) => (
                  <div key={b.id || idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <input
                      type="text"
                      value={b.title}
                      onChange={e => handleUpdateBenefit(b.id, e.target.value, b.desc)}
                      placeholder="Benefit Title"
                      className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={b.desc}
                      onChange={e => handleUpdateBenefit(b.id, b.title, e.target.value)}
                      placeholder="Benefit Description"
                      className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs text-stone-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. PHOTO GALLERY CUSTOMIZER */}
        {activeSectionEditor === 'gallery' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Photo Gallery Visuals & Sourcing Images</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Gallery Section Title
                </label>
                <input
                  type="text"
                  value={form.gallerySection?.title || ''}
                  onChange={e => setForm({
                    ...form,
                    gallerySection: { ...(form.gallerySection || DEFAULT_SETTINGS.gallerySection), title: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Gallery Subtitle
                </label>
                <input
                  type="text"
                  value={form.gallerySection?.subtitle || ''}
                  onChange={e => setForm({
                    ...form,
                    gallerySection: { ...(form.gallerySection || DEFAULT_SETTINGS.gallerySection), subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            {/* Add New Photo */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="text-xs font-bold text-stone-900 block">Add New Gallery Photo</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  placeholder="Image URL (https://...)"
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 font-mono focus:outline-none"
                />
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={e => setNewPhotoCaption(e.target.value)}
                  placeholder="Caption (e.g. Wetland Harvest)"
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none"
                />
                <div className="flex gap-2">
                  <select
                    value={newPhotoTag}
                    onChange={e => setNewPhotoTag(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800"
                  >
                    <option value="Farm Harvest">Farm Harvest</option>
                    <option value="Batch Roasting">Batch Roasting</option>
                    <option value="Packaging & Purity">Packaging & Purity</option>
                    <option value="Customer Moments">Customer Moments</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Current Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {galleryPhotos.map(p => (
                <div key={p.id} className="group relative rounded-xl overflow-hidden border border-stone-200 bg-white shadow-2xs">
                  <img
                    src={p.url}
                    alt={p.caption}
                    className="w-full h-24 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-emerald-800 block truncate">{p.tag}</span>
                    <span className="text-[11px] text-stone-700 block truncate">{p.caption}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(p.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. REVIEWS SECTION */}
        {activeSectionEditor === 'reviews' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Verified Customer Reviews Hub</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reviews Section Title
                </label>
                <input
                  type="text"
                  value={form.reviewsSection?.title || ''}
                  onChange={e => setForm({
                    ...form,
                    reviewsSection: { ...(form.reviewsSection || DEFAULT_SETTINGS.reviewsSection), title: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reviews Section Subtitle
                </label>
                <input
                  type="text"
                  value={form.reviewsSection?.subtitle || ''}
                  onChange={e => setForm({
                    ...form,
                    reviewsSection: { ...(form.reviewsSection || DEFAULT_SETTINGS.reviewsSection), subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Quality Guarantee Badge Text
                </label>
                <input
                  type="text"
                  value={form.reviewsSection?.guaranteeBadge || '100% Quality Guaranteed'}
                  onChange={e => setForm({
                    ...form,
                    reviewsSection: { ...(form.reviewsSection || DEFAULT_SETTINGS.reviewsSection), guaranteeBadge: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Highlight Rating Text (Optional)
                </label>
                <input
                  type="text"
                  value={form.reviewsSection?.ratingText || ''}
                  onChange={e => setForm({
                    ...form,
                    reviewsSection: { ...(form.reviewsSection || DEFAULT_SETTINGS.reviewsSection), ratingText: e.target.value }
                  })}
                  placeholder="e.g. Rated 4.9/5 by 5,000+ happy buyers"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* 8. FAQ SECTION */}
        {activeSectionEditor === 'faq' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Master Storefront Visibility Banner */}
            <div className={`p-4 rounded-2xl border transition-all ${
              form.sectionVisibility?.faqSection !== false
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-stone-100/90 border-stone-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    form.sectionVisibility?.faqSection !== false
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-300 text-stone-600'
                  }`}>
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900">
                        Show FAQ Accordion on Storefront
                      </h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        form.sectionVisibility?.faqSection !== false
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-stone-200 text-stone-600'
                      }`}>
                        {form.sectionVisibility?.faqSection !== false ? 'Live & Shown' : 'Hidden from Store'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Toggle whether the Frequently Asked Questions accordion section is displayed to customers on the live storefront.
                    </p>
                  </div>
                </div>

                {/* Master Toggle Button */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !(form.sectionVisibility?.faqSection !== false);
                      setForm({
                        ...form,
                        sectionVisibility: {
                          ...(form.sectionVisibility || {}),
                          faqSection: nextVal,
                        },
                      });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      form.sectionVisibility?.faqSection !== false
                        ? 'bg-emerald-800 text-white shadow-xs hover:bg-emerald-900'
                        : 'bg-stone-300 text-stone-700 hover:bg-stone-400/80'
                    }`}
                  >
                    {form.sectionVisibility?.faqSection !== false ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>FAQ Section is Shown</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>FAQ Section is Hidden</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-banner: Still Have Questions Callout Toggle (WhatsApp specialist) */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-800">
                      Show &ldquo;Still have queries? Specialist Chat&rdquo; Callout
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      form.faqShowContactCallout !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {form.faqShowContactCallout !== false ? 'Callout Shown' : 'Callout Hidden'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Interactive WhatsApp contact strip placed right below the FAQ question list.
                  </p>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-stone-700 shrink-0">
                  <input
                    type="checkbox"
                    checked={form.faqShowContactCallout !== false}
                    onChange={e => setForm({
                      ...form,
                      faqShowContactCallout: e.target.checked
                    })}
                    className="w-4 h-4 accent-emerald-800 rounded"
                  />
                  <span>{form.faqShowContactCallout !== false ? 'Shown at bottom' : 'Hidden'}</span>
                </label>
              </div>

              {form.faqShowContactCallout !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-stone-200/80">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                      Callout Question / Prompt
                    </label>
                    <input
                      type="text"
                      value={form.faqContactCalloutText || 'Still have queries?'}
                      onChange={e => setForm({ ...form, faqContactCalloutText: e.target.value })}
                      placeholder="Still have queries?"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                      WhatsApp Specialist Button Text
                    </label>
                    <input
                      type="text"
                      value={form.faqContactButtonText || 'Chat with Makhana Specialist'}
                      onChange={e => setForm({ ...form, faqContactButtonText: e.target.value })}
                      placeholder="Chat with Makhana Specialist"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Header with Title Inputs and Add FAQ */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">FAQ Section Headings & Question Entries</span>
                <span className="text-[11px] text-stone-500">
                  {faqs.filter(f => f.visible !== false).length} of {faqs.length} questions visible on storefront
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  FAQ Section Title
                </label>
                <input
                  type="text"
                  value={form.faqSectionTitle || 'Have Questions? We Have Answers.'}
                  onChange={e => setForm({ ...form, faqSectionTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  FAQ Section Subtitle
                </label>
                <input
                  type="text"
                  value={form.faqSectionSubtitle || 'Everything you need to know about our sourcing, quality grades, delivery, and payment.'}
                  onChange={e => setForm({ ...form, faqSectionSubtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3 pt-1">
              {faqs.map((faq, idx) => (
                <div 
                  key={faq.id} 
                  className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                    faq.visible !== false
                      ? 'bg-stone-50 border-stone-200'
                      : 'bg-stone-100/60 border-stone-300/80 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-stone-400">
                        Question #{idx + 1}
                      </span>
                      {faq.visible === false && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Individual Question Show/Hide Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleFaqVisible(faq.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          faq.visible !== false
                            ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                        title={faq.visible !== false ? 'Visible on storefront. Click to hide.' : 'Hidden from storefront. Click to show.'}
                      >
                        {faq.visible !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Shown</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => handleUpdateFaq(faq.id, e.target.value, faq.answer, faq.visible)}
                    placeholder="Question"
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none"
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={e => handleUpdateFaq(faq.id, faq.question, e.target.value, faq.visible)}
                    placeholder="Detailed Answer"
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-700 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. CONTACT & SUPPORT SECTION */}
        {activeSectionEditor === 'contact' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Customer Contact & Helpdesk Information</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Contact Section Title
                </label>
                <input
                  type="text"
                  value={form.contactSectionTitle || 'Customer Support & Inquiries'}
                  onChange={e => setForm({ ...form, contactSectionTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Contact Section Subtitle
                </label>
                <input
                  type="text"
                  value={form.contactSectionSubtitle || 'Need assistance with bulk orders, harvest inquiries, or fast delivery? Reach out directly.'}
                  onChange={e => setForm({ ...form, contactSectionSubtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Direct Phone Number
                </label>
                <input
                  type="text"
                  value={form.supportPhone || ''}
                  onChange={e => setForm({ ...form, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Support Email
                </label>
                <input
                  type="text"
                  value={form.supportEmail || ''}
                  onChange={e => setForm({ ...form, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Support Hours
                </label>
                <input
                  type="text"
                  value={form.supportHours || ''}
                  onChange={e => setForm({ ...form, supportHours: e.target.value })}
                  placeholder="e.g. Mon – Sat: 9:00 AM – 8:00 PM IST"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Farm / Sourcing Address
              </label>
              <input
                type="text"
                value={form.address || ''}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
        )}

        {/* 10. BRANDING & HEADER */}
        {activeSectionEditor === 'branding' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Store Name, Logo, Tagline & Announcement Bar</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={form.shopName}
                  onChange={e => setForm({ ...form, shopName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Store Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={e => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Brand Badge</label>
                <input
                  type="text"
                  value={form.brandBadge}
                  onChange={e => setForm({ ...form, brandBadge: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs uppercase font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <label className="block text-xs font-bold text-stone-700">Logo Image URL</label>
              <input
                type="text"
                value={form.logoUrl || ''}
                onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://... logo image URL"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none"
              />
              {form.logoUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <img src={form.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover border" />
                  <span className="text-[11px] text-stone-500">Logo preview</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">Announcement / Top Promo Bar</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-stone-600">
                  <input
                    type="checkbox"
                    checked={form.bannerVisible}
                    onChange={e => setForm({ ...form, bannerVisible: e.target.checked })}
                    className="w-3.5 h-3.5 accent-emerald-800 rounded"
                  />
                  <span>Visible</span>
                </label>
              </div>
              <input
                type="text"
                value={form.bannerText}
                onChange={e => setForm({ ...form, bannerText: e.target.value })}
                placeholder="Top notification bar text"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-medium focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 11. ACTION BUTTONS & CTA LABELS */}
        {activeSectionEditor === 'buttons' && (
          <div className="space-y-4 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-900 block">Master Action Buttons Text & Floating Controls</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">"Buy Now" Button Label</label>
                <input
                  type="text"
                  value={form.buttons?.buyNow || 'Buy Now'}
                  onChange={e => setForm({
                    ...form,
                    buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), buyNow: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">"WhatsApp Order" Button Label</label>
                <input
                  type="text"
                  value={form.buttons?.whatsappOrder || 'Order via WhatsApp'}
                  onChange={e => setForm({
                    ...form,
                    buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), whatsappOrder: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">"Copy UPI ID" Button Label</label>
                <input
                  type="text"
                  value={form.buttons?.copyUpi || 'Copy UPI ID'}
                  onChange={e => setForm({
                    ...form,
                    buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), copyUpi: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">"Track Order" Button Label</label>
                <input
                  type="text"
                  value={form.buttons?.trackOrder || 'Track Order'}
                  onChange={e => setForm({
                    ...form,
                    buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), trackOrder: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">"Chat on WhatsApp" Label</label>
                <input
                  type="text"
                  value={form.buttons?.chatWhatsApp || 'Chat with Us'}
                  onChange={e => setForm({
                    ...form,
                    buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), chatWhatsApp: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Floating WhatsApp Button (Bottom-Right)</label>
                <input
                  type="text"
                  value={form.buttons?.floatingWhatsApp || form.whatsAppSettings?.floatingButtonText || 'Order on WhatsApp'}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      buttons: { ...(form.buttons || DEFAULT_SETTINGS.buttons), floatingWhatsApp: val },
                      whatsAppSettings: { ...(form.whatsAppSettings || {}), floatingButtonText: val }
                    });
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          LIVE STOREFRONT PREVIEW MODAL
         ======================================================== */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className="bg-[#FAF8F5] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-800" />
                  <span>Storefront Live Preview (Unpublished Changes)</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Simulating active customer view using current sequence & copy settings
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await handleSave();
                    setIsPreviewOpen(false);
                  }}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Simulated Page Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Notification Banner */}
              {form.bannerVisible && form.bannerText && (
                <div className="bg-emerald-900 text-amber-200 px-4 py-2 rounded-xl text-xs font-semibold text-center">
                  {form.bannerText}
                </div>
              )}

              {/* Render Sections in configured sequence */}
              {fullOrderList.map((secId) => {
                if (visibility[secId as keyof SectionVisibility] === false) return null;

                if (secId === 'heroBanner') {
                  return (
                    <div key={secId} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 to-stone-900 text-white space-y-2 border border-emerald-800/40">
                      {form.heroSection?.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                          {form.heroSection.badge}
                        </span>
                      )}
                      <h2 className="text-xl sm:text-2xl font-black font-serif text-amber-50">
                        {form.heroSection?.heading || 'Hero Heading'}
                      </h2>
                      <p className="text-xs text-stone-200">
                        {form.heroSection?.subheading}
                      </p>
                      {form.heroSection?.showCtaButtons !== false && (
                        <div className="flex gap-2 pt-2">
                          {form.heroSection?.enablePrimaryCta !== false && (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs">
                              {form.heroSection?.primaryCtaText || 'Shop Fresh Harvest'}
                            </span>
                          )}
                          {form.heroSection?.enableSecondaryCta !== false && (
                            <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white font-bold text-xs">
                              {form.heroSection?.secondaryCtaText || 'Quick WhatsApp Order'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                if (secId === 'promoBanner' && form.promoBanner?.enabled !== false) {
                  return (
                    <div key={secId} className="p-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 text-white flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase bg-amber-400 text-stone-950 px-2 py-0.5 rounded">
                          {form.promoBanner?.badge || 'OFFER'}
                        </span>
                        <h4 className="text-sm font-bold mt-1">{form.promoBanner?.title}</h4>
                        <p className="text-xs text-white/80">{form.promoBanner?.description || form.promoBanner?.subtitle}</p>
                      </div>
                      {form.promoBanner?.couponCodeBadge && (
                        <span className="px-3 py-1 rounded-lg bg-white/20 font-mono text-xs font-bold text-amber-200">
                          {form.promoBanner.couponCodeBadge}
                        </span>
                      )}
                    </div>
                  );
                }

                if (secId === 'productShowcase') {
                  return (
                    <div key={secId} className="p-5 rounded-2xl bg-white border border-stone-200 space-y-3">
                      {(form.productSectionTitle || form.productSectionSubtitle) && (
                        <div className="text-center pb-2">
                          <h3 className="font-serif font-bold text-base text-stone-900">{form.productSectionTitle}</h3>
                          <p className="text-xs text-stone-500">{form.productSectionSubtitle}</p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-stone-900 font-serif">Featured Makhana Pack</h4>
                          <span className="text-xs text-stone-500">6+ Sutta Jumbo Grade</span>
                        </div>
                        <div className="flex gap-2">
                          {form.buttons?.enableBuyNow !== false && (
                            <span className="px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl">
                              {form.buttons?.buyNow || 'Buy Now'}
                            </span>
                          )}
                          {form.buttons?.enableWhatsAppOrder !== false && (
                            <span className="px-3 py-2 bg-stone-200 text-stone-800 font-bold text-xs rounded-xl">
                              {form.buttons?.whatsappOrder || 'Order via WhatsApp'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (secId === 'foodCompliance') {
                  return (
                    <div key={secId} className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-stone-900">
                          {form.foodComplianceSectionTitle || 'Food Safety, Nutrition & Statutory Details'}
                        </h4>
                        <p className="text-xs text-stone-500">FSSAI Lic. {form.foodCompliance?.fssaiNumber || '10424000000001'}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">100% Pure Vegetarian</span>
                    </div>
                  );
                }

                if (secId === 'benefitsSection') {
                  return (
                    <div key={secId} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
                      <h4 className="font-serif font-bold text-sm text-stone-900 text-center">
                        {form.benefitsSection?.title || 'Why Choose Us?'}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {(form.benefitsSection?.items || []).slice(0, 3).map(b => (
                          <div key={b.id} className="p-2.5 bg-stone-50 rounded-xl text-center">
                            <span className="text-xs font-bold text-stone-900 block truncate">{b.title}</span>
                            <span className="text-[10px] text-stone-500 truncate block">{b.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (secId === 'gallerySection' || secId === 'reviewsSection') {
                  return (
                    <div key={secId} className="bg-white rounded-xl border-2 border-[#9DB2D0] shadow-xs overflow-hidden grid grid-cols-2 divide-x-2 divide-[#9DB2D0]">
                      <div className="p-4 sm:p-5 text-center flex flex-col items-center justify-center min-h-[75px]">
                        <span className="text-sm sm:text-base font-bold text-stone-900 font-sans">Photo Galary</span>
                        <span className="text-[10px] text-stone-500 mt-0.5">{galleryPhotos.length} Verified Photos</span>
                      </div>
                      <div className="p-4 sm:p-5 text-center flex flex-col items-center justify-center min-h-[75px]">
                        <span className="text-sm sm:text-base font-bold text-stone-900 font-sans leading-tight">View & Write<br />Review</span>
                        <span className="text-[10px] text-amber-700 font-semibold mt-0.5">★ Verified Reviews</span>
                      </div>
                    </div>
                  );
                }

                if (secId === 'faqSection') {
                  return (
                    <div key={secId} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
                      <h4 className="font-serif font-bold text-sm text-stone-900 text-center">
                        {form.faqSectionTitle || 'Frequently Asked Questions'}
                      </h4>
                      <p className="text-xs text-stone-500 text-center">{form.faqSectionSubtitle}</p>
                    </div>
                  );
                }

                if (secId === 'contactSection') {
                  return (
                    <div key={secId} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
                      <h4 className="font-serif font-bold text-sm text-stone-900 text-center">
                        {form.contactSectionTitle || 'Customer Support & Inquiries'}
                      </h4>
                      <div className="flex justify-center gap-4 text-xs text-stone-600 pt-1">
                        <span>📞 {form.supportPhone}</span>
                        <span>✉️ {form.supportEmail}</span>
                      </div>
                    </div>
                  );
                }

                if (secId === 'footer') {
                  return (
                    <div key={secId} className="p-4 rounded-xl bg-[#F2EDE4] text-center text-xs text-stone-600 border border-stone-200">
                      <span className="font-bold text-stone-900 block">{form.shopName}</span>
                      <span>{form.footerText?.craftedBy || 'Hand-harvested in Mithila, Bihar.'}</span>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
