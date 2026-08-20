import React from 'react';
import { NavigationTab, AdminUser } from '../../types';
import {
  Lock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  UserCheck,
  Smartphone,
  Key,
  CheckCircle2,
} from 'lucide-react';
import { DEMO_ADMIN_ACCOUNTS } from '../auth/AdminLoginModal';

interface AccessDeniedGateProps {
  sectionName: string;
  onOpenAdminLogin: () => void;
  onNavigateToPortal: () => void;
  requiredRoleHint?: string;
  onDirectLogin?: (user: AdminUser) => void;
}

export const AccessDeniedGate: React.FC<AccessDeniedGateProps> = ({
  sectionName,
  onOpenAdminLogin,
  onNavigateToPortal,
  requiredRoleHint = 'Institutional Staff / Admin',
  onDirectLogin,
}) => {
  return (
    <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-6 sm:p-10 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
        Security Protected Section
      </span>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 mb-2">
        Authorization Required for {sectionName}
      </h2>

      <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-6">
        This module contains sensitive institutional operations (admissions, faculty allocation, curriculum, marks grading, or fee collections). Please authenticate with staff credentials to proceed.
      </p>

      {/* Quick 1-Click Role Login Selector */}
      {onDirectLogin && (
        <div className="mb-8 text-left">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
            Quick 1-Click Staff Sign In:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_ADMIN_ACCOUNTS.map((acc) => (
              <button
                key={acc.user.id}
                onClick={() => onDirectLogin(acc.user)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 bg-slate-50/70 hover:bg-white text-left transition-all group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                    {acc.user.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {acc.user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {acc.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto mb-6 text-left text-xs text-slate-700 space-y-2">
        <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
          <span>Required Authorization:</span>
          <span className="text-amber-700">{requiredRoleHint}</span>
        </div>
        <p className="text-slate-500 text-[11px]">
          Click any role above or use the Staff Login dialog to access administrative controls.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onOpenAdminLogin}
          id="access-denied-login-btn"
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>Open Full Staff Login</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onNavigateToPortal}
          id="access-denied-portal-btn"
          className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-slate-500" />
          <span>Go to Student & Parent Portal</span>
        </button>
      </div>
    </div>
  );
};
