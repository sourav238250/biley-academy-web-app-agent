import React, { useState } from 'react';
import { AdminUser, AdminRole } from '../../types';
import {
  GraduationCap,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

export const DEMO_ADMIN_ACCOUNTS: { user: AdminUser; password: string; description: string }[] = [
  {
    user: {
      id: 'ADM-001',
      name: 'Dr. Birendra Nath Biley',
      email: 'director@bileyacademy.edu',
      role: 'Super Admin / Director',
      designation: 'Director & Founder',
    },
    password: 'admin',
    description: 'Full administrative access across all modules, faculty & finances',
  },
  {
    user: {
      id: 'ADM-002',
      name: 'Prof. Ananya Sen',
      email: 'academic@bileyacademy.edu',
      role: 'Academic Administrator',
      designation: 'Academic Dean & Admissions Head',
    },
    password: 'admin',
    description: 'Admissions, curriculum distribution, examinations & report cards',
  },
  {
    user: {
      id: 'ADM-003',
      name: 'S. Mukherjee',
      email: 'accounts@bileyacademy.edu',
      role: 'Accounts & Cashier',
      designation: 'Chief Accounts Officer',
    },
    password: 'admin',
    description: 'Student fee deposits, receipts, dues tracking & financial ledgers',
  },
  {
    user: {
      id: 'ADM-004',
      name: 'Dr. Debabrata Roy',
      email: 'faculty@bileyacademy.edu',
      role: 'Faculty Mentor',
      designation: 'Senior Physics Lead',
    },
    password: 'admin',
    description: 'Class timetable, marks evaluation & student performance reviews',
  },
];

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
  isMandatoryLock?: boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isMandatoryLock = false,
}) => {
  const [email, setEmail] = useState('director@bileyacademy.edu');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const match = DEMO_ADMIN_ACCOUNTS.find(
        (acc) => acc.user.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (match && (match.password === password || password === 'admin' || password === 'admin123')) {
        const loggedUser: AdminUser = {
          ...match.user,
          lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        onLoginSuccess(loggedUser);
        if (onClose) onClose();
      } else {
        // Allow custom email if entered with simple password
        if (email.includes('@') && password.length >= 3) {
          const customAdmin: AdminUser = {
            id: `ADM-${Date.now().toString().slice(-4)}`,
            name: email.split('@')[0].toUpperCase(),
            email: email.trim(),
            role: 'Super Admin / Director',
            designation: 'Verified Administrator',
            lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          onLoginSuccess(customAdmin);
          if (onClose) onClose();
        } else {
          setErrorMessage('Invalid credentials. Select one of the quick demo roles below or enter valid credentials.');
        }
      }
      setIsLoading(false);
    }, 300);
  };

  const handleQuickLogin = (account: (typeof DEMO_ADMIN_ACCOUNTS)[0]) => {
    setEmail(account.user.email);
    setPassword(account.password);
    setErrorMessage('');
    const loggedUser: AdminUser = {
      ...account.user,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onLoginSuccess(loggedUser);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-7 relative">
          {!isMandatoryLock && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-black text-xl shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  Secure ERP Access
                </span>
                <span className="text-[11px] text-slate-400">Portal Security</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Biley Academy Staff Login
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Enter administrative credentials to manage student admissions, subject curriculum, exams, and fee registers.
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@bileyacademy.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Access Password / Security PIN
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Demo: admin</span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="admin-login-submit-btn"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Authenticate & Open Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                1-Click Quick Demo Roles
              </span>
              <span className="text-[10px] text-slate-400">Click any role to test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ADMIN_ACCOUNTS.map((acc) => (
                <button
                  key={acc.user.id}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50/70 hover:border-amber-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-amber-900 truncate">
                      {acc.user.name.split(' ')[0]} {acc.user.name.split(' ').slice(-1)[0]}
                    </span>
                    <span className="text-[9px] font-bold uppercase bg-slate-200 group-hover:bg-amber-200 text-slate-800 px-1.5 py-0.5 rounded">
                      {acc.user.role.split('/')[0].trim()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {acc.user.designation}
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
