import React, { useState } from 'react';
import { StoreSettings, WhatsAppSettings } from '../../types';
import { 
  MessageCircle, 
  Save, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Info,
  Phone
} from 'lucide-react';
import { createWhatsAppUrl } from '../../utils/whatsapp';

interface AdminWhatsAppTabProps {
  settings: StoreSettings;
  onSaveSettings: (updated: Partial<StoreSettings>) => Promise<void>;
}

export const AdminWhatsAppTab: React.FC<AdminWhatsAppTabProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [phone, setPhone] = useState(settings.whatsappNumber || '919876543210');
  const [waSettings, setWaSettings] = useState<WhatsAppSettings>({
    ...(settings.whatsAppSettings || {
      enabled: true,
      businessNumber: settings.whatsappNumber || '919876543210',
      orderTemplate: 'Hello {customerName}! Thank you for choosing Maknuts Makhana. Your Order #{orderNumber} for {items} (Total: ₹{amount}) is confirmed! Payment: {paymentMethod}. We will dispatch shortly.',
      paymentTemplate: 'Hi {customerName}, we have received your payment of ₹{amount} for Order #{orderNumber}. Your fresh harvest Makhana is scheduled for dispatch.',
      supportTemplate: 'Hello Maknuts Support! I have a question regarding an order or product quality.',
    })
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [testUrl, setTestUrl] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      await onSaveSettings({
        whatsappNumber: cleanPhone,
        whatsAppSettings: {
          ...waSettings,
          businessNumber: cleanPhone,
        }
      });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestLink = (template: string) => {
    const previewText = template
      .replace('{customerName}', 'Ramesh Kumar')
      .replace('{orderNumber}', 'MK-2610-A7F')
      .replace('{items}', '1x Maknuts Makhana 250g')
      .replace('{amount}', '299')
      .replace('{paymentMethod}', 'UPI');

    const url = createWhatsAppUrl(phone, previewText);
    setTestUrl(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <span>WhatsApp Business & Messaging Automation</span>
          </h2>
          <p className="text-xs text-stone-500">
            Configure merchant hotline, instant order alerts, payment confirmations, and customer care messages.
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
          <span>{saveToast ? 'WhatsApp Saved!' : isSaving ? 'Saving...' : 'Save WhatsApp'}</span>
        </button>
      </div>

      {/* SECTION 1: BUSINESS NUMBER & FLOATING BUTTON */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-800" />
          <span>Hotline & Floating Chat Widget</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              WhatsApp Business Number (with country code, no + or spaces) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. 919876543210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <p className="text-[10px] text-stone-500 mt-1">
              Example: For India number 9876543210, enter 919876543210.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-xs font-bold text-stone-900 block">Floating WhatsApp Button</span>
              <p className="text-[11px] text-stone-500">Display corner chat bubble on storefront</p>
            </div>
            <input
              type="checkbox"
              checked={waSettings.enabled}
              onChange={e => setWaSettings({ ...waSettings, enabled: e.target.checked })}
              className="w-5 h-5 accent-emerald-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: MESSAGE TEMPLATES */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            Automated Message Templates
          </h3>
          <span className="text-[10px] text-stone-500 font-mono">
            Placeholders: {'{customerName}'}, {'{orderNumber}'}, {'{items}'}, {'{amount}'}, {'{paymentMethod}'}
          </span>
        </div>

        {/* Template 1: Order Confirmation */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800">
              1. New Order Confirmation Template
            </label>
            <button
              type="button"
              onClick={() => handleTestLink(waSettings.orderTemplate || '')}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Preview in WhatsApp</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={waSettings.orderTemplate || ''}
            onChange={e => setWaSettings({ ...waSettings, orderTemplate: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* Template 2: Payment Confirmation */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800">
              2. Payment Received Confirmation Template
            </label>
            <button
              type="button"
              onClick={() => handleTestLink(waSettings.paymentTemplate || '')}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Preview</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={waSettings.paymentTemplate || ''}
            onChange={e => setWaSettings({ ...waSettings, paymentTemplate: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* Template 3: Customer Support Template */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800">
              3. Support / Inquiry Default Message
            </label>
            <button
              type="button"
              onClick={() => handleTestLink(waSettings.supportTemplate || '')}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Preview</span>
            </button>
          </div>

          <textarea
            rows={2}
            value={waSettings.supportTemplate || ''}
            onChange={e => setWaSettings({ ...waSettings, supportTemplate: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>
      </div>
    </div>
  );
};
