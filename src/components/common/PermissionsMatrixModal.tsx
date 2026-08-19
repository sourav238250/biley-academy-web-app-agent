import React from 'react';
import { AdminRole, AdminUser } from '../../types';
import { ROLE_DEFINITIONS } from '../../utils/auth';
import { DEMO_ADMIN_ACCOUNTS } from '../auth/AdminLoginModal';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Users,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface PermissionsMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: AdminUser | null;
  onSelectRole: (admin: AdminUser) => void;
}

export const PermissionsMatrixModal: React.FC<PermissionsMatrixModalProps> = ({
  isOpen,
  onClose,
  currentAdmin,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  const modules = [
    {
      name: 'Student Admissions',
      permissions: {
        'Super Admin / Director': { read: true, write: true, delete: true },
        'Academic Administrator': { read: true, write: true, delete: false },
        'Accounts & Cashier': { read: true, write: false, delete: false },
        'Faculty Mentor': { read: true, write: false, delete: false },
      },
    },
    {
      name: 'Subject Curriculum & Syllabus',
      permissions: {
        'Super Admin / Director': { read: true, write: true, delete: true },
        'Academic Administrator': { read: true, write: true, delete: true },
        'Accounts & Cashier': { read: true, write: false, delete: false },
        'Faculty Mentor': { read: true, write: false, delete: false },
      },
    },
    {
      name: 'Faculty Directory & Timetable',
      permissions: {
        'Super Admin / Director': { read: true, write: true, delete: true },
        'Academic Administrator': { read: true, write: true, delete: true },
        'Accounts & Cashier': { read: true, write: false, delete: false },
        'Faculty Mentor': { read: true, write: true, delete: false }, // can edit timetable slots
      },
    },
    {
      name: 'Examinations Scheduling',
      permissions: {
        'Super Admin / Director': { read: true, write: true, delete: true },
        'Academic Administrator': { read: true, write: true, delete: true },
        'Accounts & Cashier': { read: true, write: false, delete: false },
        'Faculty Mentor': { read: true, write: false, delete: false },
      },
    },
    {
      name: 'Results & Marks Evaluation',
      permissions: {
        'Super Admin / Director': { read: true, write: true, delete: true },
        'Academic Administrator': { read: true, write: true, delete: true },
        'Accounts & Cashier': { read: true, write: false, delete: false },
        'Faculty Mentor': { read: true, write: true, delete: false },
      },
    },
    {
      name: 'Fees Deposit & Receipts Treasury',
      permissions: {
        'Super Admin / Director': { read: true, write: true, delete: true },
        'Academic Administrator': { read: true, write: false, delete: false },
        'Accounts & Cashier': { read: true, write: true, delete: true },
        'Faculty Mentor': { read: false, write: false, delete: false },
      },
    },
  ];

  const roles: AdminRole[] = [
    'Super Admin / Director',
    'Academic Administrator',
    'Accounts & Cashier',
    'Faculty Mentor',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-7 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  ERP Role-Based Access Control
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Institutional Authorization Matrix
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Body */}
        <div className="p-6 sm:p-7 space-y-6">
          <p className="text-xs text-slate-600 leading-relaxed">
            Biley Academy implements strict Role-Based Access Control (RBAC) across all six core management units to ensure academic integrity and financial segregation of duties.
          </p>

          {/* Matrix Table */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3.5 min-w-[200px]">Management Unit</th>
                  {roles.map((r) => {
                    const isCurrent = currentAdmin?.role === r;
                    return (
                      <th
                        key={r}
                        className={`p-3.5 text-center min-w-[130px] border-l border-slate-800 ${
                          isCurrent ? 'bg-amber-500/20 text-amber-300' : ''
                        }`}
                      >
                        <div className="font-bold">{r.split('/')[0].trim()}</div>
                        {isCurrent && (
                          <span className="text-[9px] uppercase font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                            Active
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {modules.map((m, idx) => (
                  <tr
                    key={m.name}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                  >
                    <td className="p-3.5 font-bold text-slate-900">{m.name}</td>
                    {roles.map((r) => {
                      const perm = m.permissions[r];
                      const isCurrent = currentAdmin?.role === r;
                      return (
                        <td
                          key={r}
                          className={`p-3.5 text-center border-l border-slate-200 ${
                            isCurrent ? 'bg-amber-50/40 font-semibold' : ''
                          }`}
                        >
                          {perm.write ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Full Access</span>
                            </span>
                          ) : perm.read ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              <span>Read Only</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>Restricted</span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Role Switch Buttons */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Quick Switch Role to Test Permissions:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {DEMO_ADMIN_ACCOUNTS.map((acc) => {
                const isCurrent = currentAdmin?.role === acc.user.role;
                return (
                  <button
                    key={acc.user.id}
                    onClick={() => {
                      onSelectRole(acc.user);
                      onClose();
                    }}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {acc.user.name.split(' ')[0]} {acc.user.name.split(' ').slice(-1)[0]}
                      </span>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      {acc.user.role.split('/')[0].trim()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
