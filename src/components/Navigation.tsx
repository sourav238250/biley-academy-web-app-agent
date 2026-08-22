import React from 'react';
import { NavigationTab, AdminUser } from '../types';
import {
  LayoutDashboard,
  UserPlus,
  BookOpen,
  Users,
  CalendarCheck,
  FileCheck2,
  Award,
  CreditCard,
  Smartphone,
  HelpCircle,
  FileCheck,
  Receipt,
  Wallet,
  Lock,
} from 'lucide-react';

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentAdmin?: AdminUser | null;
  studentCount?: number;
  facultyCount?: number;
  examCount?: number;
  resultsCount?: number;
  feeDepositsCount?: number;
  pendingDuesCount?: number;
  upcomingExamsCount?: number;
  attendanceRecordsCount?: number;
  questionBankCount?: number;
  assignmentCount?: number;
  disbursementsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentAdmin,
  studentCount,
  pendingDuesCount,
  upcomingExamsCount,
  attendanceRecordsCount,
  questionBankCount,
  assignmentCount,
  disbursementsCount,
}) => {
  const isSignedOut = !currentAdmin;

  const tabs: {
    id: NavigationTab;
    label: string;
    icon: React.FC<any>;
    badge?: string | number;
    badgeColor?: string;
    requiresAuth?: boolean;
    openBadge?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'students',
      label: 'Student Admissions',
      icon: UserPlus,
      badge: studentCount,
      badgeColor: 'bg-slate-700',
      openBadge: isSignedOut ? 'Open' : undefined,
    },
    { id: 'subjects', label: 'Subject Distribution', icon: BookOpen, requiresAuth: true },
    { id: 'faculty', label: 'Faculty Allocation', icon: Users, requiresAuth: true },
    {
      id: 'attendance',
      label: 'Daily Attendance',
      icon: CalendarCheck,
      badge: attendanceRecordsCount && attendanceRecordsCount > 0 ? `${attendanceRecordsCount}` : undefined,
      badgeColor: 'bg-emerald-700',
      requiresAuth: true,
    },
    {
      id: 'question-bank',
      label: 'Question Bank & Assignments',
      icon: HelpCircle,
      badge: questionBankCount && questionBankCount > 0 ? questionBankCount : undefined,
      badgeColor: 'bg-amber-600',
      requiresAuth: true,
    },
    {
      id: 'exams',
      label: 'Examinations',
      icon: FileCheck2,
      badge: upcomingExamsCount && upcomingExamsCount > 0 ? upcomingExamsCount : undefined,
      badgeColor: 'bg-blue-600',
      requiresAuth: true,
    },
    { id: 'results', label: 'Results & Report Cards', icon: Award, requiresAuth: true },
    {
      id: 'fees',
      label: 'Fee Deposit & Receipts',
      icon: CreditCard,
      badge: pendingDuesCount && pendingDuesCount > 0 ? `${pendingDuesCount} Dues` : undefined,
      badgeColor: 'bg-amber-600',
      openBadge: isSignedOut ? 'Open' : undefined,
    },
    {
      id: 'disbursements',
      label: 'Disbursements & P&L',
      icon: Wallet,
      badge: disbursementsCount && disbursementsCount > 0 ? `${disbursementsCount}` : undefined,
      badgeColor: 'bg-indigo-700',
      requiresAuth: true,
    },
    {
      id: 'student-portal',
      label: 'Student Portal',
      icon: Smartphone,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-16 sm:top-18 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-2.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isLocked = isSignedOut && tab.requiresAuth;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : isLocked
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : isLocked ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>

                {/* Lock icon for protected administrative tabs in signed out state */}
                {isLocked && (
                  <span className="flex items-center text-slate-400 ml-0.5" title="Requires Staff Sign In">
                    <Lock className="w-3 h-3" />
                  </span>
                )}

                {/* Open tag for unauthenticated accessible tabs */}
                {tab.openBadge && !tab.badge && (
                  <span className="ml-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300/60 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    {tab.openBadge}
                  </span>
                )}

                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-amber-500 text-slate-950' : tab.badgeColor || 'bg-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
