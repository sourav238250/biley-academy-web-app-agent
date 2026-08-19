import React from 'react';
import { NavigationTab } from '../types';
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
} from 'lucide-react';

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  studentCount?: number;
  facultyCount?: number;
  examCount?: number;
  resultsCount?: number;
  feeDepositsCount?: number;
  pendingDuesCount?: number;
  upcomingExamsCount?: number;
  attendanceRecordsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  pendingDuesCount,
  upcomingExamsCount,
  attendanceRecordsCount,
}) => {
  const tabs: { id: NavigationTab; label: string; icon: React.FC<any>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'students',
      label: 'Student Admissions',
      icon: UserPlus,
      badge: studentCount,
      badgeColor: 'bg-slate-700',
    },
    { id: 'subjects', label: 'Subject Distribution', icon: BookOpen },
    { id: 'faculty', label: 'Faculty Allocation', icon: Users },
    {
      id: 'attendance',
      label: 'Daily Attendance',
      icon: CalendarCheck,
      badge: attendanceRecordsCount && attendanceRecordsCount > 0 ? `${attendanceRecordsCount}` : undefined,
      badgeColor: 'bg-emerald-700',
    },
    {
      id: 'exams',
      label: 'Examinations',
      icon: FileCheck2,
      badge: upcomingExamsCount && upcomingExamsCount > 0 ? upcomingExamsCount : undefined,
      badgeColor: 'bg-blue-600',
    },
    { id: 'results', label: 'Results & Report Cards', icon: Award },
    {
      id: 'fees',
      label: 'Fee Deposit & Receipts',
      icon: CreditCard,
      badge: pendingDuesCount && pendingDuesCount > 0 ? `${pendingDuesCount} Dues` : undefined,
      badgeColor: 'bg-amber-600',
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
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
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
