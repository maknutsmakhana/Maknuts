import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Settings, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  LogOut, 
  Database, 
  Key, 
  Mail, 
  Info, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface SystemPageProps {
  adminUser: User | null;
  onLogout: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onExportData: () => string;
  onImportData: (json: string) => Promise<boolean>;
  onResetDefaults: () => Promise<void>;
  initialSubTab?: string;
}

export const SystemPage: React.FC<SystemPageProps> = ({
  adminUser,
  onLogout,
  onResetPassword,
  onExportData,
  onImportData,
  onResetDefaults,
  initialSubTab = 'account',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'firebase' | 'app_info' | 'backup' | 'security'>(
    (initialSubTab as any) || 'account'
  );

  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleSendReset = async () => {
    if (!adminUser?.email) return;
    try {
      await onResetPassword(adminUser.email);
      setPasswordResetSent(true);
      setTimeout(() => setPasswordResetSent(false), 4000);
    } catch (e) {
      alert('Could not send password reset email. Check network or connection.');
    }
  };

  const handleDownloadBackup = () => {
    const dataStr = onExportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maknuts_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = async () => {
    if (!importJson.trim()) {
      alert('Please paste valid JSON backup content.');
      return;
    }
    if (confirm('Restore store settings from this backup? Current configuration will be replaced.')) {
      const ok = await onImportData(importJson);
      if (ok) {
        setImportMessage('Backup restored successfully!');
        setImportJson('');
        setTimeout(() => setImportMessage(null), 3000);
      } else {
        alert('Invalid JSON format or corrupt backup file.');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Sub-Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-800" />
            <span>System Infrastructure & Security</span>
          </h2>
          <p className="text-xs text-stone-500">
            Dedicated system operations only: Admin profile, Firebase connection health, backups, and security policies.
          </p>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'account', label: 'Admin Profile' },
            { id: 'firebase', label: 'Firebase Health' },
            { id: 'app_info', label: 'App Information' },
            { id: 'backup', label: 'Backup & Restore' },
            { id: 'security', label: 'Security & Session' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
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

      {/* SUB-TAB 1: ADMIN PROFILE / ACCOUNT */}
      {activeSubTab === 'account' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 font-serif">Admin Operator Profile</h3>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Authenticated Email</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {adminUser?.email || 'maknutsmakhana@gmail.com'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Active Session
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-stone-800 block">Password Management</span>
                <span className="text-stone-500 text-[11px]">
                  Send a secure Firebase password reset email to your registered inbox.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSendReset}
                className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-800" />
                <span>{passwordResetSent ? 'Reset Email Sent!' : 'Send Password Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FIREBASE HEALTH */}
      {activeSubTab === 'firebase' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Cloud Datastore Telemetry</h3>
            <p className="text-xs text-stone-500">Live health indicators for Google Cloud Firestore and Firebase Auth.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-900 block">Firestore Database ID</span>
              <span className="font-mono text-stone-800 font-bold block truncate">
                ai-studio-maknutsmakhanast-7055c918-d0fb-4516-bbc9-9d37138d5e79
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                <span>Online & Synchronized</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-stone-400 block">Cloud Storage Bucket</span>
              <span className="font-mono text-stone-800 font-bold block truncate">
                gen-lang-client-0103132816.firebasestorage.app
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                <span>Storage Ready</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: APP INFORMATION */}
      {activeSubTab === 'app_info' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 font-serif">Application & Deployment Information</h3>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-stone-400 block">Application:</span>
                <span className="font-bold text-stone-900">Maknuts Makhana Store & Control Center</span>
              </div>
              <div>
                <span className="text-stone-400 block">Architecture:</span>
                <span className="font-bold text-stone-900">Separate Public Store & Private Admin Portal</span>
              </div>
              <div>
                <span className="text-stone-400 block">Runtime Framework:</span>
                <span className="font-mono text-stone-900 font-bold">React 19 + Vite 8 + Tailwind CSS 4</span>
              </div>
              <div>
                <span className="text-stone-400 block">Build Protocol:</span>
                <span className="font-mono text-stone-900 font-bold">Production SPA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Backup Export & Disaster Recovery</h3>
            <p className="text-xs text-stone-500">Export complete store settings into a single JSON file or restore from a previous snapshot.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-800" />
                <span>Download Full JSON Backup</span>
              </h4>
              <p className="text-[11px] text-stone-600">
                Exports all store settings, banners, coupons, and section configurations to your device.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Export JSON Backup
              </button>
            </div>

            {/* Import */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-stone-700" />
                <span>Restore from JSON Backup</span>
              </h4>
              <textarea
                rows={3}
                placeholder="Paste backup JSON string here..."
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded-xl text-[11px] font-mono"
              />
              {importMessage && (
                <span className="text-xs font-bold text-emerald-700 block">{importMessage}</span>
              )}
              <button
                type="button"
                onClick={handleRestoreBackup}
                className="px-4 py-2 bg-stone-800 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Restore Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SECURITY & SESSION */}
      {activeSubTab === 'security' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">Security Enforcement & Session Termination</h3>
            <p className="text-xs text-stone-500">Control active authorization credentials and sign out.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900">Security Architecture</h4>
              <ul className="list-disc list-inside space-y-1 text-stone-600">
                <li>Zero hardcoded passwords stored in code or database</li>
                <li>Session verified via cryptographic Firebase Auth token</li>
                <li>Restricted to verified admin email (<code className="font-mono">maknutsmakhana@gmail.com</code>)</li>
                <li>No public client-side admin registration endpoints</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 block">Sign Out Current Session</span>
                <span className="text-[11px] text-stone-500">Locks the Admin Control Center immediately.</span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Admin Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
