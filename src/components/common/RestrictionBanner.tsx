import React from 'react';
import { Lock, AlertCircle, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { AdminUser, InstitutionalAuthorizationConfig } from '../../types';

interface RestrictionBannerProps {
  type: 'admission' | 'fee_deposit';
  authConfig?: InstitutionalAuthorizationConfig;
  currentAdmin?: AdminUser | null;
  onOpenSettings?: () => void;
}

export const RestrictionBanner: React.FC<RestrictionBannerProps> = ({
  type,
  authConfig,
  currentAdmin,
  onOpenSettings,
}) => {
  const isLocked =
    type === 'admission'
      ? authConfig?.isAdmissionLocked
      : authConfig?.isFeeDepositLocked;

  const lockReason =
    type === 'admission'
      ? authConfig?.admissionLockReason
      : authConfig?.feeDepositLockReason;

  if (!isLocked) return null;

  const isDirector = currentAdmin?.role === 'Super Admin / Director';

  return (
    <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-rose-900/90 to-slate-900 text-white rounded-2xl border-2 border-rose-500/50 shadow-lg relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 flex-shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-slate-950 px-2 py-0.5 rounded">
                INSTITUTIONAL RESTRICTION ACTIVE
              </span>
              <span className="text-xs text-rose-200 font-semibold">
                {type === 'admission' ? 'New Student Enrollment Suspended' : 'Fee Collection Registry Locked'}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mt-1">
              {type === 'admission'
                ? 'New Student Admissions are currently restricted by Institute Policy'
                : 'Deposit fee collections and new receipts are currently restricted'}
            </h4>
            <p className="text-xs text-rose-200/90 mt-0.5">
              {lockReason
                ? `Policy Directive: "${lockReason}"`
                : type === 'admission'
                ? 'Batch capacity ceiling reached or admission intake cycle is closed for this session.'
                : 'Central accounts treasury reconciliation in progress or financial audit window active.'}
            </p>
          </div>
        </div>

        {onOpenSettings && (
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            {isDirector ? (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                <span>Manage Restriction in Settings</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            ) : (
              <div className="text-[11px] text-rose-300 italic bg-rose-950/60 px-3 py-1.5 rounded-lg border border-rose-800">
                Contact Director to unlock
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
