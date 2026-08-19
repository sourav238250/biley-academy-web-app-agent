import React from 'react';
import { AdminUser, NavigationTab } from '../../types';
import { evaluateSectionAuthorization, ROLE_DEFINITIONS } from '../../utils/auth';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
  Info,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SectionAuthHeaderProps {
  currentAdmin: AdminUser | null;
  sectionTab: NavigationTab;
  onOpenAdminLogin: () => void;
  onOpenPermissionsMatrix?: () => void;
}

export const SectionAuthHeader: React.FC<SectionAuthHeaderProps> = ({
  currentAdmin,
  sectionTab,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, sectionTab);

  if (sectionTab === 'student-portal') return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs mb-6 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        {/* Left: Role & Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              auth.canWrite
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            {auth.canWrite ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900 tracking-tight">
                Authorization Unit:
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${auth.badgeStyle}`}
              >
                {auth.badgeLabel}
              </span>
              {currentAdmin && (
                <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
                  (Authenticated as <strong>{currentAdmin.name}</strong>)
                </span>
              )}
            </div>

            {auth.notice ? (
              <p className="text-xs text-amber-800 font-medium mt-0.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>{auth.notice}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentAdmin?.role} possesses active write and modification credentials for this section.
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick Role Elevation or Matrix Helper */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {onOpenPermissionsMatrix && (
            <button
              onClick={onOpenPermissionsMatrix}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">View</span> Matrix
            </button>
          )}

          <button
            onClick={onOpenAdminLogin}
            id={`switch-role-btn-${sectionTab}`}
            className="text-[11px] font-bold text-slate-800 hover:text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Switch Role</span>
          </button>
        </div>

      </div>
    </div>
  );
};
