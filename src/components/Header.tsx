import React, { useState } from 'react';
import { NavigationTab, AdminUser } from '../types';
import {
  GraduationCap,
  Sparkles,
  UserPlus,
  CreditCard,
  RotateCcw,
  UserCheck,
  Layers,
  LayoutDashboard,
  Smartphone,
  Lock,
  LogOut,
  ShieldCheck,
  ChevronDown,
  User,
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenNewAdmission: () => void;
  onOpenFeeDeposit: () => void;
  onResetData: () => void;
  totalStudents: number;
  totalFaculty: number;
  currentAdmin: AdminUser | null;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onOpenPermissionsMatrix?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAdmission,
  onOpenFeeDeposit,
  onResetData,
  totalStudents,
  totalFaculty,
  currentAdmin,
  onOpenAdminLogin,
  onAdminLogout,
  onOpenPermissionsMatrix,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const isStudentPortal = activeTab === 'student-portal';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Institute Identity */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg font-bold shrink-0">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                  BILEY ACADEMY
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  <Sparkles className="w-3 h-3" /> Class 5 to 12
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                Secondary & Senior Secondary Coaching ERP System
              </p>
            </div>
          </div>

          {/* Quick Counters & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Counters (Desktop) */}
            <div className="hidden xl:flex items-center gap-3 text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span><strong className="text-white font-bold">{totalStudents}</strong> Students</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span><strong className="text-white font-bold">{totalFaculty}</strong> Faculty</span>
              </div>
            </div>

            {/* Quick Admission & Fee Deposit Buttons */}
            <button
              onClick={onOpenNewAdmission}
              id="header-new-admission-btn"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>New Admission</span>
            </button>

            <button
              onClick={onOpenFeeDeposit}
              id="header-deposit-fee-btn"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Deposit Fee</span>
            </button>

            {/* Student & Parent Portal Toggle Switch */}
            <button
              onClick={() => setActiveTab(isStudentPortal ? 'dashboard' : 'student-portal')}
              id="header-student-portal-toggle-btn"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                isStudentPortal
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
              }`}
            >
              {isStudentPortal ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Admin ERP</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Student Portal</span>
                </>
              )}
            </button>

            {/* Admin User / Login Action */}
            {currentAdmin ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  id="header-admin-profile-btn"
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow shrink-0">
                    {currentAdmin.name.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-white truncate max-w-[110px]">
                      {currentAdmin.name.split(' ')[0]}
                    </p>
                    <p className="text-[9px] text-amber-300 uppercase font-semibold tracking-wider truncate max-w-[110px]">
                      {currentAdmin.role.split('/')[0].trim()}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Admin Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Authenticated Staff Session
                        </p>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1">{currentAdmin.name}</p>
                      <p className="text-[11px] text-slate-500">{currentAdmin.email}</p>
                      <span className="inline-block text-[10px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full mt-1.5">
                        {currentAdmin.role}
                      </span>
                    </div>

                    <div className="p-1 space-y-0.5 text-xs font-medium text-slate-700">
                      {onOpenPermissionsMatrix && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenPermissionsMatrix();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer text-slate-800 font-semibold"
                        >
                          <Layers className="w-4 h-4 text-amber-500" />
                          <span>View Authorization Matrix</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAdminLogin();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-500" />
                        <span>Switch Staff Role / Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onAdminLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer font-semibold"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out / Lock ERP Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                id="header-admin-login-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-950" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              title="Reset Demo Data"
              id="header-reset-data-btn"
              className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
