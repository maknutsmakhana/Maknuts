import React from 'react';
import { useStore } from '../context/StoreContext';
import { MessageCircle } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

export const FloatingWhatsApp: React.FC = () => {
  const { storeSettings } = useStore();

  const handleOpenWhatsApp = () => {
    const text = `Hi ${storeSettings.shopName}! I would like to order or ask a question about Maknuts Makhana.`;
    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center group">
      {/* Floating Tooltip Label */}
      <div className="hidden sm:flex items-center mr-2 px-3 py-1.5 rounded-full bg-stone-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs opacity-90 group-hover:opacity-100 transition-opacity">
        <span>Order on WhatsApp</span>
      </div>

      {/* Floating Button */}
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xl shadow-emerald-900/30 transition-transform transform active:scale-90 hover:scale-105 border-2 border-white cursor-pointer"
        aria-label="Order or Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400" />
        </span>
        <MessageCircle className="w-7 h-7 fill-white stroke-[#25D366]" />
      </button>
    </div>
  );
};
