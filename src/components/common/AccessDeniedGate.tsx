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
  Layers,
  UserPlus,
  CreditCard,
} from 'lucide-react';
import { DEMO_ADMIN_ACCOUNTS } from '../auth/AdminLoginModal';

interface AccessDeniedGateProps {
  sectionName: string;
  onOpenAdminLogin: () => void;
  onNavigateToPortal: () => void;
  onNavigateToTab?: (tab: NavigationTab) => void;
  onOpenPermissionsMatrix?: () => void;
  requiredRoleHint?: string;
  onDirectLogin?: (user: AdminUser) => void;
}

export const AccessDeniedGate: React.FC<AccessDeniedGateProps> = ({
  sectionName,
  onOpenAdminLogin,
  onNavigateToPortal,
  onNavigateToTab,
  onOpenPermissionsMatrix,
  requiredRoleHint = 'Institutional Staff / Admin',
  onDirectLogin,
}) => {
  return (
    <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-6 sm:p-10 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
        ERP Staff Session Locked
      </span>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 mb-2">
        Authorization Required for {sectionName}
      </h2>

      <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-6">
        This section is protected under the <strong>Institutional Authorization Matrix</strong>. Sign in with staff credentials to unlock this administrative module.
      </p>

      {/* Quick 1-Click Role Login Selector */}
      {onDirectLogin && (
        <div className="mb-6 text-left">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick 1-Click Staff Sign In:
            </p>
            {onOpenPermissionsMatrix && (
              <button
                onClick={onOpenPermissionsMatrix}
                className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View Authorization Matrix</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_ADMIN_ACCOUNTS.map((acc) => (
              <button
                key={acc.user.id}
                onClick={() => onDirectLogin(acc.user)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/40 text-left transition-all group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                    {acc.user.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {acc.user.role.split('/')[0].trim()}
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

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg mx-auto mb-6 text-left text-xs text-slate-700 space-y-2">
        <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
          <span>Required Authorization:</span>
          <span className="text-amber-700">{requiredRoleHint}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Accessible without login:</span>
          <span className="text-emerald-700 font-bold">New Admission • Fee Deposit • Student Portal</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onOpenAdminLogin}
          id="access-denied-login-btn"
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>Staff Login</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('students')}
            id="access-denied-new-admission-btn"
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Admission (Open)</span>
          </button>
        )}

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('fees')}
            id="access-denied-deposit-fee-btn"
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Deposit Fee (Open)</span>
          </button>
        )}

        <button
          onClick={onNavigateToPortal}
          id="access-denied-portal-btn"
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-slate-500" />
          <span>Student Portal</span>
        </button>
      </div>
    </div>
  );
};
