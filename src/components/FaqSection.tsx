import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp';

export const FaqSection: React.FC = () => {
  const { storeSettings } = useStore();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  if (storeSettings.sectionVisibility?.faqSection === false) {
    return null;
  }

  const faqs = storeSettings.faqs || [];
  if (faqs.length === 0) return null;

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const handleWhatsAppHelp = () => {
    const text = `Hello ${storeSettings.shopName}! I have a question about placing an order.`;
    const url = createWhatsAppUrl(storeSettings.whatsappNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="my-10 bg-white rounded-3xl border border-[#E8DFD0] p-5 sm:p-8 shadow-xs">
      <div className="text-center max-w-xl mx-auto mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
          Have Questions? We Have Answers.
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Everything you need to know about our sourcing, quality grades, delivery, and payment.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {faqs.map(faq => {
          const isOpen = openFaqId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-2xl border border-stone-200 overflow-hidden transition-all bg-[#FAF8F5]"
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-4 sm:px-5 py-3.5 text-left font-bold text-stone-900 text-xs sm:text-sm flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-100/70 transition-colors"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-emerald-800 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-4 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-200/60 bg-white animate-in fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still need help callout */}
      <div className="mt-6 pt-5 border-t border-stone-200/80 text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-stone-500">
        <span>Still have queries?</span>
        <button
          type="button"
          onClick={handleWhatsAppHelp}
          className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Chat with us on WhatsApp ({storeSettings.whatsappNumber})</span>
        </button>
      </div>
    </div>
  );
};
