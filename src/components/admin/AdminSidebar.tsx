import React from 'react';
import { 
  LayoutDashboard, 
  Palette, 
  Package, 
  BadgePercent, 
  ShoppingCart, 
  Users, 
  MessageCircle, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  ExternalLink, 
  LogOut, 
  ChevronRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import maknutsLogo from '../../assets/images/regenerated_image_1791357700332.png';

export type AdminPrimaryTab = 
  | 'dashboard'
  | 'storefront'
  | 'catalog'
  | 'pricing_promotions'
  | 'orders_payments'
  | 'customers_reviews'
  | 'marketing'
  | 'compliance'
  | 'reports'
  | 'system';

// Supported tab types including legacy aliases for 100% backwards compatibility
export type AdminTab = 
  | AdminPrimaryTab
  | 'overview'
  | 'products'
  | 'inventory'
  | 'pricing'
  | 'coupons'
  | 'orders'
  | 'payments'
  | 'order_controls'
  | 'upi_verification'
  | 'cod'
  | 'shipping_tracking'
  | 'invoices'
  | 'customers'
  | 'reviews'
  | 'food_compliance'
  | 'media'
  | 'faq'
  | 'whatsapp'
  | 'seo'
  | 'policies'
  | 'settings';

export interface NavSection {
  id: AdminPrimaryTab;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
  subItems: { id: string; label: string }[];
}

interface AdminSidebarProps {
  activeTab: AdminTab;
  activeSubTab?: string;
  onSelectTab: (tab: AdminTab, subTab?: string) => void;
  pendingOrdersCount: number;
  pendingReviewsCount: number;
  activeCouponsCount: number;
  productsCount: number;
  adminEmail?: string;
  onLogout: () => void;
  onClose: () => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  activeSubTab,
  onSelectTab,
  pendingOrdersCount,
  pendingReviewsCount,
  activeCouponsCount,
  productsCount,
  adminEmail,
  onLogout,
  onClose,
  setIsMobileOpen,
}) => {
  // Map any legacy tab names to primary navigation IDs
  const getPrimaryTab = (tab: AdminTab): AdminPrimaryTab => {
    switch (tab) {
      case 'overview': return 'dashboard';
      case 'products':
      case 'inventory':
      case 'media': return 'catalog';
      case 'pricing':
      case 'coupons': return 'pricing_promotions';
      case 'orders':
      case 'payments':
      case 'order_controls':
      case 'upi_verification':
      case 'cod':
      case 'shipping_tracking':
      case 'invoices': return 'orders_payments';
      case 'customers':
      case 'reviews': return 'customers_reviews';
      case 'whatsapp':
      case 'seo': return 'marketing';
      case 'food_compliance':
      case 'policies': return 'compliance';
      case 'faq': return 'storefront';
      case 'settings': return 'system';
      default: return tab as AdminPrimaryTab;
    }
  };

  const currentPrimaryTab = getPrimaryTab(activeTab);

  const sections: NavSection[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      subItems: [
        { id: 'overview', label: 'Command Deck' },
        { id: 'alerts', label: 'Needs Attention' },
      ]
    },
    {
      id: 'storefront',
      label: 'Storefront',
      icon: <Palette className="w-4 h-4" />,
      subItems: [
        { id: 'homepage', label: 'Homepage & Hero' },
        { id: 'sections', label: 'Sections Ordering' },
        { id: 'branding', label: 'Branding & Header' },
        { id: 'faq', label: 'FAQ Accordion' },
        { id: 'contact', label: 'Contact & Footer' },
      ]
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: <Package className="w-4 h-4" />,
      badge: productsCount,
      badgeColor: 'bg-emerald-700/60 text-emerald-200',
      subItems: [
        { id: 'products', label: 'Products' },
        { id: 'inventory', label: 'Inventory' },
        { id: 'media', label: 'Product Media' },
        { id: 'food_fssai', label: 'Product Food / FSSAI' },
      ]
    },
    {
      id: 'pricing_promotions',
      label: 'Pricing & Offers',
      icon: <BadgePercent className="w-4 h-4" />,
      badge: activeCouponsCount > 0 ? activeCouponsCount : undefined,
      badgeColor: 'bg-emerald-600 text-white',
      subItems: [
        { id: 'pricing', label: 'Pricing & Quantities' },
        { id: 'discounts', label: 'Store Discounts' },
        { id: 'delivery', label: 'Delivery Rules' },
        { id: 'coupons', label: 'Coupons' },
        { id: 'scheduled_offers', label: 'Scheduled Offers' },
      ]
    },
    {
      id: 'orders_payments',
      label: 'Orders & Payments',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-950 font-black',
      subItems: [
        { id: 'orders', label: 'Orders List' },
        { id: 'payments', label: 'Payments' },
        { id: 'upi_verification', label: 'UPI Verification' },
        { id: 'cod', label: 'COD Tracking' },
        { id: 'shipping_tracking', label: 'Shipping & AWB' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'order_controls', label: 'Order Form & WhatsApp' },
      ]
    },
    {
      id: 'customers_reviews',
      label: 'Customers & Reviews',
      icon: <Users className="w-4 h-4" />,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      badgeColor: 'bg-rose-500 text-white font-bold',
      subItems: [
        { id: 'customers', label: 'Customer Directory' },
        { id: 'reviews', label: 'All Reviews' },
        { id: 'pending_reviews', label: 'Pending Reviews' },
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <MessageCircle className="w-4 h-4" />,
      subItems: [
        { id: 'whatsapp', label: 'WhatsApp Automation' },
        { id: 'seo', label: 'SEO & Meta Tags' },
        { id: 'social', label: 'Social Sharing' },
      ]
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: <ShieldCheck className="w-4 h-4" />,
      subItems: [
        { id: 'business_fssai', label: 'Business / FSSAI' },
        { id: 'policies', label: 'Store Policies' },
        { id: 'legal_info', label: 'Legal Standards' },
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      subItems: [
        { id: 'analytics', label: 'Sales & Trends' },
        { id: 'downloads', label: 'PDF Dossiers' },
      ]
    },
    {
      id: 'system',
      label: 'System',
      icon: <Settings className="w-4 h-4" />,
      subItems: [
        { id: 'account', label: 'Admin Profile' },
        { id: 'firebase', label: 'Firebase Health' },
        { id: 'backup', label: 'Backup & Export' },
        { id: 'security', label: 'Security & Auth' },
      ]
    },
  ];

  const handleSectionClick = (secId: AdminPrimaryTab, defaultSub?: string) => {
    onSelectTab(secId, defaultSub);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleSubItemClick = (e: React.MouseEvent, secId: AdminPrimaryTab, subId: string) => {
    e.stopPropagation();
    onSelectTab(secId, subId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <aside className="w-64 h-full bg-[#181C14] text-stone-200 flex flex-col shrink-0 border-r border-stone-800 selection:bg-emerald-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-emerald-950 border border-emerald-700/40 p-0.5 shrink-0 shadow-md">
            <img 
              src={maknutsLogo} 
              alt="Maknuts" 
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-white text-base tracking-tight">Maknuts</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                Portal
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-medium">Store Control Center</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors sm:hidden"
          title="Close Sidebar"
        >
          ✕
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs">
        {sections.map((section) => {
          const isActive = currentPrimaryTab === section.id;

          return (
            <div key={section.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSectionClick(section.id, section.subItems[0]?.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs font-extrabold'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`${isActive ? 'text-amber-300' : 'text-stone-400'}`}>
                    {section.icon}
                  </span>
                  <span className="truncate">{section.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {section.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${section.badgeColor || 'bg-stone-700 text-stone-300'}`}>
                      {section.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                  )}
                </div>
              </button>

              {/* Sub-items (nested when active) */}
              {isActive && section.subItems.length > 0 && (
                <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-emerald-700/40 ml-4 animate-in fade-in duration-150">
                  {section.subItems.map((sub) => {
                    const isSubActive = 
                      activeSubTab === sub.id || 
                      (sub.id === 'homepage' && (activeSubTab === 'hero' || activeSubTab === 'homepage')) ||
                      (sub.id === 'orders' && (activeSubTab === 'all' || activeSubTab === 'orders')) ||
                      (sub.id === 'payments' && (activeSubTab === 'upi_verification' || activeSubTab === 'payments')) ||
                      (!activeSubTab && sub.id === section.subItems[0]?.id);

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={(e) => handleSubItemClick(e, section.id, sub.id)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          isSubActive
                            ? 'bg-emerald-950/80 text-amber-300 font-bold border border-emerald-700/50'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {isSubActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Account & Storefront Link */}
      <div className="p-3 border-t border-stone-800 space-y-2 bg-[#141710]">
        {/* User Card */}
        <div className="px-2.5 py-2 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">
              Signed in Admin
            </span>
            <span className="text-[11px] text-stone-300 font-medium truncate block" title={adminEmail}>
              {adminEmail || 'maknutsmakhana@gmail.com'}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Sign out of Admin Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* View Public Storefront */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          <span>Exit to Public Store</span>
        </button>
      </div>
    </aside>
  );
};
