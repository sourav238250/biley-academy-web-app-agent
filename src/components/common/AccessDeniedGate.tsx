import React from 'react';
import { NavigationTab } from '../../types';
import {
  Lock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  UserCheck,
  Smartphone,
  Key,
} from 'lucide-react';
import { DEMO_ADMIN_ACCOUNTS } from '../auth/AdminLoginModal';

interface AccessDeniedGateProps {
  sectionName: string;
  onOpenAdminLogin: () => void;
  onNavigateToPortal: () => void;
  requiredRoleHint?: string;
}

export const AccessDeniedGate: React.FC<AccessDeniedGateProps> = ({
  sectionName,
  onOpenAdminLogin,
  onNavigateToPortal,
  requiredRoleHint = 'Institutional Staff / Admin',
}) => {
  return (
    <div className="max-w-3xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-12 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
        Security Protected Section
      </span>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 mb-2">
        Authorization Required for {sectionName}
      </h2>

      <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-6">
        This section contains sensitive institutional operations (admissions, faculty allocation, exam controller registries, or fee collections). Please authenticate with staff credentials to proceed.
      </p>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto mb-8 text-left text-xs text-slate-700 space-y-2">
        <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
          <span>Required Authorization:</span>
          <span className="text-amber-700">{requiredRoleHint}</span>
        </div>
        <p className="text-slate-500 text-[11px]">
          Use the quick 1-click credentials below or in the Staff Login dialog to access all modules instantly.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onOpenAdminLogin}
          id="access-denied-login-btn"
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>Sign In as Staff / Administrator</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onNavigateToPortal}
          id="access-denied-portal-btn"
          className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-slate-500" />
          <span>Go to Student & Parent Portal</span>
        </button>
      </div>
    </div>
  );
};
