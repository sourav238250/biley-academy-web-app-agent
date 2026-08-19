import React, { useState, useRef } from 'react';
import {
  Student,
  Subject,
  Faculty,
  Exam,
  ExamResult,
  FeeDeposit,
  TimetableSlot,
  AttendanceRecord,
  ClassLevel,
  AdminUser,
  NavigationTab,
} from '../../types';
import { formatCurrency, computeStudentFeeSummary, CLASS_LEVELS } from '../../utils/academicUtils';
import {
  exportDatabaseBackup,
  parseDatabaseBackup,
  getEstimatedStorageUsage,
  AppStateData,
} from '../../utils/storage';
import { PendingFeeAlertSection } from './PendingFeeAlertSection';
import {
  Users,
  UserPlus,
  BookOpen,
  Award,
  CreditCard,
  AlertTriangle,
  Calendar,
  CalendarCheck,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  Download,
  Database,
  HardDrive,
  Upload,
  RotateCcw,
  FileJson,
  Check,
  Server,
  Save,
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  subjects: Subject[];
  faculty: Faculty[];
  exams: Exam[];
  results: ExamResult[];
  deposits: FeeDeposit[];
  timetable?: TimetableSlot[];
  attendance?: AttendanceRecord[];
  onNavigateTab?: (tab: NavigationTab) => void;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenAdmissionModal: () => void;
  onOpenFeeDepositModal: (studentId?: string) => void;
  onViewReceipt: (deposit: FeeDeposit) => void;
  onViewReportCard?: (result: ExamResult) => void;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
  onRestoreData?: (data: AppStateData) => void;
  onResetData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  subjects,
  faculty,
  exams,
  results,
  deposits,
  timetable = [],
  attendance = [],
  onNavigateTab,
  onNavigate,
  onOpenAdmissionModal,
  onOpenFeeDepositModal,
  onViewReceipt,
  onViewReportCard,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
  onRestoreData,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const navigate = (tab: NavigationTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (onNavigate) {
      onNavigate(tab);
    }
  };

  // Handler for Download Database Backup
  const handleDownloadBackup = () => {
    try {
      setIsExporting(true);
      const appState: AppStateData = {
        students,
        faculty,
        subjects,
        exams,
        results,
        deposits,
        timetable,
        attendance,
      };

      const result = exportDatabaseBackup(appState);
      setBackupSuccessMessage(`Database backup downloaded successfully: ${result.filename} (${result.sizeKb} KB)`);
      setRestoreErrorMessage(null);
      setTimeout(() => setBackupSuccessMessage(null), 6000);
    } catch (err) {
      console.error('Failed to export backup:', err);
      setRestoreErrorMessage('Failed to generate database backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler for Importing / Restoring JSON Backup
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedState = parseDatabaseBackup(content);

        const totalRecords =
          parsedState.students.length +
          parsedState.faculty.length +
          parsedState.subjects.length +
          parsedState.exams.length +
          parsedState.results.length +
          parsedState.deposits.length +
          parsedState.timetable.length +
          (parsedState.attendance?.length || 0);

        if (
          confirm(
            `Restore database from backup?\n\nRecords to import:\n• ${parsedState.students.length} Students\n• ${parsedState.faculty.length} Faculty\n• ${parsedState.subjects.length} Subjects\n• ${parsedState.exams.length} Exams\n• ${parsedState.results.length} Exam Results\n• ${parsedState.deposits.length} Fee Receipts\n• ${parsedState.timetable.length} Timetable Slots\n• ${parsedState.attendance?.length || 0} Attendance Records\n\nTotal: ${totalRecords} records. This will overwrite current session state.`
          )
        ) {
          if (onRestoreData) {
            onRestoreData(parsedState);
            setBackupSuccessMessage(`Database successfully restored with ${totalRecords} records from ${file.name}!`);
            setRestoreErrorMessage(null);
            setTimeout(() => setBackupSuccessMessage(null), 6000);
          }
        }
      } catch (err: any) {
        console.error('Error importing backup:', err);
        setRestoreErrorMessage(err.message || 'Invalid JSON file format. Please upload a valid Biley Academy backup.');
        setBackupSuccessMessage(null);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Aggregate Metrics
  const totalCollected = deposits.reduce((sum, d) => sum + d.amountPaid, 0);

  // Calculate total pending dues
  const feeSummaries = students.map((s) => computeStudentFeeSummary(s, deposits));
  const totalDues = feeSummaries.reduce((sum, f) => sum + f.dueAmount, 0);
  const studentsWithDues = feeSummaries.filter((f) => f.dueAmount > 0);

  // Upcoming Exams
  const upcomingExams = exams.filter((e) => e.status === 'Upcoming' || e.status === 'Ongoing');

  // Class-wise Student Count
  const classBreakdown = CLASS_LEVELS.map((cls) => ({
    classLevel: cls,
    count: students.filter((s) => s.classLevel === cls).length,
  }));

  // Recent 5 Admissions
  const recentStudents = [...students]
    .sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())
    .slice(0, 5);

  // Recent 5 Fee Deposits
  const recentDeposits = [...deposits]
    .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner with Active Admin Staff Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {currentAdmin ? `Logged In: ${currentAdmin.role}` : 'Staff & Admin ERP System'}
              </span>
              <span className="text-xs text-slate-300">Session 2025–2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentAdmin ? `Welcome back, ${currentAdmin.name}` : 'Biley Academy Management'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {currentAdmin
                ? `${currentAdmin.designation} • Authorized management of Admissions, Subjects, Faculty, Exams, Results and Student Fee Collections.`
                : 'Centralized coaching operations across Classes 1 to 12. Monitor student enrollments, faculty lectures, exam report cards, and fee treasury.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                id="dashboard-admin-auth-btn"
                className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{currentAdmin ? 'Switch Staff Role' : 'Admin Login'}</span>
              </button>
            )}

            <button
              onClick={onOpenAdmissionModal}
              id="dashboard-new-admission-btn"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Admission</span>
            </button>

            <button
              onClick={() => navigate('attendance')}
              id="dashboard-attendance-btn"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Daily Attendance</span>
            </button>

            <button
              onClick={() => onOpenFeeDepositModal()}
              id="dashboard-deposit-fee-btn"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Collect Fee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        
        {/* Total Students */}
        <div
          onClick={() => navigate('students')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrolled Students</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{students.length}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                 Class 1 to 12
              </span>
              active batches
            </p>
          </div>
        </div>

        {/* Total Faculty */}
        <div
          onClick={() => navigate('faculty')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Allocated Faculty</span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{faculty.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              Across <strong className="text-slate-800">{subjects.length}</strong> curriculum subjects
            </p>
          </div>
        </div>

        {/* Daily Attendance & Register */}
        <div
          onClick={() => navigate('attendance')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Attendance</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-700">{attendance.length}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">
                {new Set(attendance.map((a) => a.date)).size} Lecture Days
              </span>
              logged
            </p>
          </div>
        </div>

        {/* Total Fees Collected */}
        <div
          onClick={() => navigate('fees')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collections</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">{formatCurrency(totalCollected)}</div>
            <p className="text-xs text-slate-500 mt-1">
              <strong className="text-slate-800 font-semibold">{deposits.length}</strong> receipts issued
            </p>
          </div>
        </div>

        {/* Total Pending Dues */}
        <div
          onClick={() => navigate('fees')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Dues</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-700">{formatCurrency(totalDues)}</div>
            <p className="text-xs text-amber-600 font-semibold mt-1">
              {studentsWithDues.length} students with dues
            </p>
          </div>
        </div>

      </div>

      {/* Class-wise Enrollment Distribution Bar (Class 1 to 12) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Student Enrollment by Class (1 to 12)</h2>
            <p className="text-xs text-slate-500">Distribution across Primary, Middle School, High School & Senior Secondary Streams</p>
          </div>
          <button
            onClick={() => navigate('students')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            View Student Directory <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5">
          {classBreakdown.map((item) => {
            const hasStudents = item.count > 0;
            return (
              <div
                key={item.classLevel}
                onClick={() => navigate('students')}
                className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  hasStudents
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-slate-100/80'
                    : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Class {item.classLevel}
                </span>
                <span className={`text-xl font-black block mt-1 ${hasStudents ? 'text-slate-900' : 'text-slate-400'}`}>
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Students</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Fee Alert & Aging Defaulters Section */}
      <PendingFeeAlertSection
        students={students}
        deposits={deposits}
        subjects={subjects}
        onOpenFeeDepositModal={onOpenFeeDepositModal}
        onNavigateToFees={() => navigate('fees')}
        currentAdmin={currentAdmin}
      />

      {/* 2-Column Section: Upcoming Exams & Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Examinations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active & Upcoming Examinations</h3>
                  <p className="text-xs text-slate-500">Board preps, mid-terms & unit assessments</p>
                </div>
              </div>
              <button
                onClick={() => navigate('exams')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Manage Exams <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingExams.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">No upcoming exams scheduled right now.</div>
              ) : (
                upcomingExams.slice(0, 3).map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-colors flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{exam.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          exam.status === 'Ongoing' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {exam.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Class {exam.classLevel} ({exam.stream}) • {exam.subjectsSchedule.length} Papers
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {exam.startDate} to {exam.endDate}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('exams')}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shrink-0 cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Total Exams Logged: <strong className="text-slate-800">{exams.length}</strong></span>
            <button
              onClick={() => navigate('results')}
              className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" /> View Exam Results
            </button>
          </div>
        </div>

        {/* Recent Fee Deposits & Receipts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Fee Deposits</h3>
                  <p className="text-xs text-slate-500">Latest collection transactions and generated receipts</p>
                </div>
              </div>
              <button
                onClick={() => navigate('fees')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                All Deposits <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentDeposits.map((dep) => {
                const student = students.find((s) => s.id === dep.studentId);
                return (
                  <div
                    key={dep.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{student?.name || 'Unknown Student'}</p>
                      <p className="text-[11px] text-slate-500">
                        {dep.feeHead} • <span className="font-mono text-slate-600">{dep.paymentMode}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">{dep.depositDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-700">{formatCurrency(dep.amountPaid)}</p>
                      <button
                        onClick={() => onViewReceipt(dep)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline mt-0.5 inline-block cursor-pointer"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Outstanding balance: <strong className="text-amber-700 font-bold">{formatCurrency(totalDues)}</strong></span>
            <button
              onClick={() => onOpenFeeDepositModal()}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              + Deposit Fee
            </button>
          </div>
        </div>

      </div>

      {/* Database Backup & System Storage Settings Section */}
      <div id="dashboard-system-settings-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  System Settings & Database Administration
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Local Storage Persisted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Export offline JSON snapshots, manage browser storage persistence, or restore database state across sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono">
              Storage footprint: <strong className="text-slate-900 font-bold">{getEstimatedStorageUsage()}</strong>
            </span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {backupSuccessMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{backupSuccessMessage}</div>
            <button
              onClick={() => setBackupSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-sm leading-none"
            >
              ×
            </button>
          </div>
        )}

        {restoreErrorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{restoreErrorMessage}</div>
            <button
              onClick={() => setRestoreErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 font-bold text-sm leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Settings Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Action: Download Backup Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5" />
                  Full Database Snapshot (JSON)
                </span>
                <span className="text-xs text-slate-400">
                  Version 2.0.0 • All 7 Entities
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-white tracking-tight">
                  Download Full Database Backup
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Generates an offline, uncompressed JSON snapshot containing all current student profiles, faculty members, standardized subjects, exam schedules, graded results, fee payment receipts, and class timetable schedules.
                </p>
              </div>

              {/* Entity counts pill list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-400 font-medium">Students</p>
                  <p className="text-base font-bold text-amber-300">{students.length}</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-400 font-medium">Faculty</p>
                  <p className="text-base font-bold text-amber-300">{faculty.length}</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-400 font-medium">Subjects</p>
                  <p className="text-base font-bold text-amber-300">{subjects.length}</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-400 font-medium">Fee Receipts</p>
                  <p className="text-base font-bold text-emerald-400">{deposits.length}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 pt-5 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compatible with standard JSON restoration & archive utilities</span>
              </div>

              <button
                id="download-db-backup-btn"
                onClick={handleDownloadBackup}
                disabled={isExporting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating JSON...' : 'Download Database Backup'}</span>
              </button>
            </div>
          </div>

          {/* Secondary Administration Actions: Restore & Reset Card */}
          <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Database Restore & Maintenance
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Import a previous JSON backup to restore all tables, or reset to default demo dataset.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                className="hidden"
                id="import-db-backup-input"
              />

              {/* Import / Restore Button */}
              <button
                id="restore-db-backup-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Restore / Import JSON Backup</span>
              </button>

              {/* Reset to Default Button */}
              {onResetData && (
                <button
                  id="reset-default-data-btn"
                  onClick={onResetData}
                  className="w-full px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 font-semibold text-xs rounded-xl border border-rose-200 hover:border-rose-300 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>Reset to Factory Demo Data</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <strong className="font-bold">Persistence Note:</strong> All modifications are automatically stored inside your browser's persistent key-value store (<span className="font-mono text-[10px]">localStorage</span>).
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
