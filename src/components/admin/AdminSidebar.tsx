import React from 'react';
import { 
  LayoutDashboard, 
  Palette, 
  Package, 
  BadgePercent, 
  Ticket, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  MessageSquareHeart, 
  ShieldCheck, 
  Image as ImageIcon, 
  MessageCircle, 
  Search, 
  FileText, 
  BarChart3, 
  Settings, 
  ExternalLink, 
  LogOut, 
  ChevronRight,
  Store,
  Sparkles
} from 'lucide-react';
import maknutsLogo from '../../assets/images/regenerated_image_1791357700332.png';

export type AdminTab = 
  | 'overview'
  | 'storefront'
  | 'products'
  | 'pricing'
  | 'coupons'
  | 'orders'
  | 'payments'
  | 'customers'
  | 'reviews'
  | 'food_compliance'
  | 'media'
  | 'whatsapp'
  | 'seo'
  | 'policies'
  | 'reports'
  | 'settings'
  | 'store'
  | 'support'
  | 'homepage'
  | 'benefits'
  | 'gallery'
  | 'backup';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
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
  onSelectTab,
  pendingOrdersCount,
  pendingReviewsCount,
  activeCouponsCount,
  productsCount,
  adminEmail,
  onLogout,
  onClose,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string; group?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, group: 'Core' },
    { id: 'storefront', label: 'Storefront', icon: <Palette className="w-4 h-4" />, group: 'Core' },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, badge: productsCount, group: 'Catalog' },
    { id: 'pricing', label: 'Pricing & Offers', icon: <BadgePercent className="w-4 h-4" />, group: 'Catalog' },
    { id: 'coupons', label: 'Coupons', icon: <Ticket className="w-4 h-4" />, badge: activeCouponsCount > 0 ? activeCouponsCount : undefined, badgeColor: 'bg-emerald-600', group: 'Catalog' },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" />, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined, badgeColor: 'bg-amber-500', group: 'Sales' },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" />, group: 'Sales' },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" />, group: 'Sales' },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquareHeart className="w-4 h-4" />, badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined, badgeColor: 'bg-rose-500', group: 'Marketing' },
    { id: 'food_compliance', label: 'Food / FSSAI', icon: <ShieldCheck className="w-4 h-4" />, group: 'Compliance' },
    { id: 'media', label: 'Media Manager', icon: <ImageIcon className="w-4 h-4" />, group: 'Content' },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />, group: 'Marketing' },
    { id: 'seo', label: 'SEO & Meta', icon: <Search className="w-4 h-4" />, group: 'Marketing' },
    { id: 'policies', label: 'Policies', icon: <FileText className="w-4 h-4" />, group: 'Compliance' },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" />, group: 'Analytics' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, group: 'System' },
  ];

  const handleItemClick = (id: AdminTab) => {
    onSelectTab(id);
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
                Control
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

      {/* Live Store Quick Link Banner */}
      <div className="px-3 py-2 bg-stone-900/60 border-b border-stone-800/60">
        <button
          type="button"
          onClick={onClose}
          className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 text-[11px] font-bold text-emerald-300 flex items-center justify-between transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Public Storefront</span>
          </span>
          <ExternalLink className="w-3 h-3 text-emerald-400/80 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5 no-scrollbar">
        {navItems.map((item, idx) => {
          const isActive = activeTab === item.id;
          const showGroup = idx === 0 || navItems[idx - 1].group !== item.group;

          return (
            <React.Fragment key={item.id}>
              {showGroup && item.group && (
                <div className="px-3 pt-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  {item.group}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm font-bold'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`${isActive ? 'text-amber-300' : 'text-stone-400 group-hover:text-stone-200'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black text-white ${
                        item.badgeColor || (isActive ? 'bg-emerald-950' : 'bg-stone-700')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />}
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Admin User Footer & Logout */}
      <div className="p-3 border-t border-stone-800 bg-[#141611]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Signed In As</div>
            <div className="text-xs font-semibold text-stone-200 truncate">
              {adminEmail || 'Admin'}
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-800/60">
            Owner
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900/50 border border-stone-700/60 text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
