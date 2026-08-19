import React, { useState, useMemo } from 'react';
import { Student, FeeDeposit, Subject, ClassLevel, StudentFeeSummary, AdminUser } from '../../types';
import { formatCurrency, computeStudentFeeSummary, CLASS_LEVELS, DEFAULT_FEE_STRUCTURE } from '../../utils/academicUtils';
import { SendReminderModal } from './SendReminderModal';
import {
  AlertTriangle,
  Send,
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Phone,
  User,
  Check,
  Calendar,
  AlertCircle,
  TrendingDown,
  Sparkles,
  MessageSquare,
  RefreshCw,
  BellRing,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

export interface OverdueStudentItem {
  student: Student;
  feeSummary: StudentFeeSummary;
  daysOverdue: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  isInitialAdmissionOnly: boolean;
  urgencyLevel: 'moderate' | 'urgent' | 'critical';
}

interface PendingFeeAlertSectionProps {
  students: Student[];
  deposits: FeeDeposit[];
  subjects: Subject[];
  onOpenFeeDepositModal: (studentId?: string) => void;
  onNavigateToFees?: () => void;
  currentAdmin?: AdminUser | null;
}

const REMINDER_STORAGE_KEY = 'biley_academy_fee_reminders_v1';

export const PendingFeeAlertSection: React.FC<PendingFeeAlertSectionProps> = ({
  students,
  deposits,
  subjects,
  onOpenFeeDepositModal,
  onNavigateToFees,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [agingFilter, setAgingFilter] = useState<'ALL' | '30-59' | '60-89' | '90+'>('ALL');
  const [sortBy, setSortBy] = useState<'days' | 'amount' | 'name'>('days');

  // Modal State
  const [selectedOverdueItem, setSelectedOverdueItem] = useState<OverdueStudentItem | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Local storage reminder history
  const [remindersLog, setRemindersLog] = useState<Record<string, { timestamp: string; channel: string }>>(() => {
    try {
      const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Batch reminder dispatch feedback
  const [batchReminderSuccess, setBatchReminderSuccess] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);

  // Calculate 30+ days overdue students
  const overdueStudentsList: OverdueStudentItem[] = useMemo(() => {
    const today = new Date();
    const result: OverdueStudentItem[] = [];

    students.forEach((student) => {
      const feeSummary = computeStudentFeeSummary(student, deposits, DEFAULT_FEE_STRUCTURE, subjects);
      
      // Only students who have unpaid due amount
      if (feeSummary.dueAmount <= 0) return;

      const studentDeposits = deposits.filter((d) => d.studentId === student.id);

      let daysOverdue = 0;
      let lastPaymentDate: string | undefined;
      let lastPaymentAmount: number | undefined;
      let isInitialAdmissionOnly = true;

      if (studentDeposits.length > 0) {
        const sorted = [...studentDeposits].sort(
          (a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime()
        );
        const lastDeposit = sorted[0];
        lastPaymentDate = lastDeposit.depositDate;
        lastPaymentAmount = lastDeposit.amountPaid;
        isInitialAdmissionOnly = false;

        const depTime = new Date(lastDeposit.depositDate).getTime();
        daysOverdue = Math.max(0, Math.floor((today.getTime() - depTime) / (1000 * 60 * 60 * 24)));
      } else {
        // No deposits yet: calculate days since admission
        const admTime = new Date(student.admissionDate).getTime();
        daysOverdue = isNaN(admTime)
          ? 35
          : Math.max(0, Math.floor((today.getTime() - admTime) / (1000 * 60 * 60 * 24)));
      }

      // Filter for students who haven't made a payment in over 30 days
      if (daysOverdue >= 30) {
        let urgencyLevel: 'moderate' | 'urgent' | 'critical' = 'moderate';
        if (daysOverdue >= 90) {
          urgencyLevel = 'critical';
        } else if (daysOverdue >= 60) {
          urgencyLevel = 'urgent';
        }

        result.push({
          student,
          feeSummary,
          daysOverdue,
          lastPaymentDate,
          lastPaymentAmount,
          isInitialAdmissionOnly,
          urgencyLevel,
        });
      }
    });

    return result;
  }, [students, deposits, subjects]);

  // Filtered and Sorted list
  const filteredOverdueList = useMemo(() => {
    return overdueStudentsList
      .filter((item) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.student.name.toLowerCase().includes(q);
          const matchRoll = item.student.rollNo.toLowerCase().includes(q);
          const matchGuardian = item.student.guardianName.toLowerCase().includes(q);
          const matchPhone = item.student.contactNumber.includes(q);
          if (!matchName && !matchRoll && !matchGuardian && !matchPhone) {
            return false;
          }
        }

        // Class filter
        if (classFilter !== 'ALL' && item.student.classLevel !== classFilter) {
          return false;
        }

        // Aging urgency filter
        if (agingFilter === '30-59' && (item.daysOverdue < 30 || item.daysOverdue >= 60)) return false;
        if (agingFilter === '60-89' && (item.daysOverdue < 60 || item.daysOverdue >= 90)) return false;
        if (agingFilter === '90+' && item.daysOverdue < 90) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'days') {
          return b.daysOverdue - a.daysOverdue;
        }
        if (sortBy === 'amount') {
          return b.feeSummary.dueAmount - a.feeSummary.dueAmount;
        }
        return a.student.name.localeCompare(b.student.name);
      });
  }, [overdueStudentsList, searchQuery, classFilter, agingFilter, sortBy]);

  // Aggregate Metrics for 30+ days overdue
  const totalOverdueCapital = useMemo(() => {
    return overdueStudentsList.reduce((acc, curr) => acc + curr.feeSummary.dueAmount, 0);
  }, [overdueStudentsList]);

  const criticalOverdueCount = useMemo(() => {
    return overdueStudentsList.filter((item) => item.daysOverdue >= 90).length;
  }, [overdueStudentsList]);

  const remindersSentCount = useMemo(() => {
    return Object.keys(remindersLog).length;
  }, [remindersLog]);

  // Handle single reminder log
  const handleReminderSent = (studentId: string, channel: 'SMS' | 'WhatsApp' | 'Email' | 'Copy') => {
    const updated = {
      ...remindersLog,
      [studentId]: {
        timestamp: new Date().toISOString(),
        channel,
      },
    };
    setRemindersLog(updated);
    try {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save reminder log:', e);
    }
  };

  // Open individual reminder modal
  const handleOpenReminderModal = (item: OverdueStudentItem) => {
    setSelectedOverdueItem(item);
    setIsReminderModalOpen(true);
  };

  // Handle batch SMS reminder dispatch
  const handleSendBatchReminders = () => {
    if (filteredOverdueList.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to dispatch SMS Fee Reminders to all ${filteredOverdueList.length} filtered students?`
      )
    ) {
      return;
    }

    setIsBatchSending(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const updated = { ...remindersLog };
      filteredOverdueList.forEach((item) => {
        updated[item.student.id] = {
          timestamp: now,
          channel: 'SMS (Batch)',
        };
      });

      setRemindersLog(updated);
      try {
        localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save reminder log:', e);
      }

      setIsBatchSending(false);
      setBatchReminderSuccess(
        `Bulk Fee Reminder SMS successfully dispatched to ${filteredOverdueList.length} student guardians!`
      );
      setTimeout(() => setBatchReminderSuccess(null), 5000);
    }, 1200);
  };

  // CSV Export for Administrative Record-Keeping
  const handleExportCSV = () => {
    if (filteredOverdueList.length === 0) {
      alert('No overdue students available to export for the current filters.');
      return;
    }

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'Student ID',
      'Roll Number',
      'Student Name',
      'Class Level',
      'Stream',
      'Batch',
      'Guardian Name',
      'Guardian Relation',
      'Contact Number',
      'Email Address',
      'Net Payable (INR)',
      'Total Paid (INR)',
      'Outstanding Due (INR)',
      'Fee Status',
      'Days Overdue',
      'Urgency Tier',
      'Last Payment Date',
      'Last Payment Amount (INR)',
      'Admission Date',
      'Reminder Channel',
      'Last Reminder Sent At',
    ];

    const rows = filteredOverdueList.map((item) => {
      const reminderInfo = remindersLog[item.student.id];
      return [
        escapeCsv(item.student.id),
        escapeCsv(item.student.rollNo),
        escapeCsv(item.student.name),
        escapeCsv(`Class ${item.student.classLevel}`),
        escapeCsv(item.student.stream),
        escapeCsv(item.student.batch),
        escapeCsv(item.student.guardianName),
        escapeCsv(item.student.guardianRelation),
        escapeCsv(item.student.contactNumber),
        escapeCsv(item.student.email),
        item.feeSummary.netPayable,
        item.feeSummary.totalPaid,
        item.feeSummary.dueAmount,
        escapeCsv(item.feeSummary.feeStatus),
        item.daysOverdue,
        escapeCsv(item.urgencyLevel.toUpperCase()),
        escapeCsv(item.lastPaymentDate || 'N/A (No Payments)'),
        item.lastPaymentAmount !== undefined ? item.lastPaymentAmount : 0,
        escapeCsv(item.student.admissionDate),
        escapeCsv(reminderInfo?.channel || 'None'),
        escapeCsv(reminderInfo?.timestamp ? new Date(reminderInfo.timestamp).toLocaleString() : 'N/A'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `biley_academy_pending_fee_defaulters_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBatchReminderSuccess(
      `Exported CSV record for ${filteredOverdueList.length} student(s) with pending fees.`
    );
    setTimeout(() => setBatchReminderSuccess(null), 4000);
  };

  return (
    <div id="pending-fee-alert-section" className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 sm:p-7 space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-rose-100">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs border border-rose-200">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Pending Fee Alert &amp; Aging Defaulters
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-xs">
                {overdueStudentsList.length} Overdue (&gt;30 Days)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies students with unpaid fee dues and no payment received in over 30 days. Send direct SMS/WhatsApp reminders or collect fees.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV Button */}
          <button
            id="export-pending-fees-csv-btn"
            onClick={handleExportCSV}
            disabled={filteredOverdueList.length === 0}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download administrative CSV spreadsheet of all currently listed overdue students"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* Remind All Button at the top of the Pending Fee Alert section */}
          <button
            id="remind-all-overdue-btn"
            onClick={handleSendBatchReminders}
            disabled={isBatchSending || filteredOverdueList.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-rose-500"
          >
            <Send className={`w-4 h-4 ${isBatchSending ? 'animate-spin' : ''}`} />
            <span>
              {isBatchSending
                ? 'Dispatching Reminders...'
                : `Remind All (${filteredOverdueList.length})`}
            </span>
          </button>

          {onNavigateToFees && (
            <button
              onClick={onNavigateToFees}
              className="px-3.5 py-2.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Fee Registry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Batch Success Feedback */}
      {batchReminderSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{batchReminderSuccess}</span>
          </div>
          <button
            onClick={() => setBatchReminderSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Overdue KPI Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Overdue Students */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">30+ Days Defaulters</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-2">{overdueStudentsList.length}</div>
          <p className="text-[11px] text-rose-700 mt-0.5">Students awaiting payment</p>
        </div>

        {/* Total Overdue Capital */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Overdue Capital</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{formatCurrency(totalOverdueCapital)}</div>
          <p className="text-[11px] text-amber-700 mt-0.5">Uncollected aging balance</p>
        </div>

        {/* Critical (>90 Days) */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Critical (&gt;90 Days)</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2">{criticalOverdueCount}</div>
          <p className="text-[11px] text-purple-700 mt-0.5">Severe aging cases</p>
        </div>

        {/* Reminders Dispatched */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Reminders Logged</span>
            <Send className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{remindersSentCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Dispatched this session</p>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, roll number, guardian, phone..."
            className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Classes (1 to 12)</option>
              {CLASS_LEVELS.map((cl) => (
                <option key={cl} value={cl}>Class {cl}</option>
              ))}
            </select>
          </div>

          {/* Aging Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Aging:</span>
            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value as any)}
              className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All 30+ Days</option>
              <option value="30-59">30 - 59 Days</option>
              <option value="60-89">60 - 89 Days</option>
              <option value="90+">90+ Days (Critical)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="days">Days Overdue (Highest)</option>
              <option value="amount">Due Amount (Highest)</option>
              <option value="name">Student Name (A-Z)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Overdue Students Cards / Table */}
      {filteredOverdueList.length === 0 ? (
        <div className="p-10 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-emerald-950 text-sm">No Pending Fee Defaulters Found</h4>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            {overdueStudentsList.length === 0
              ? 'All enrolled student accounts have cleared their fees or made payment within the last 30 days!'
              : 'No students match your current search or class filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
            <div>
              Showing <strong className="text-slate-900 font-bold">{filteredOverdueList.length}</strong> overdue student{filteredOverdueList.length === 1 ? '' : 's'} totaling{' '}
              <strong className="text-rose-700 font-bold">
                {formatCurrency(filteredOverdueList.reduce((acc, c) => acc + c.feeSummary.dueAmount, 0))}
              </strong>{' '}
              in uncollected fees
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                disabled={filteredOverdueList.length === 0}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={handleSendBatchReminders}
                disabled={isBatchSending || filteredOverdueList.length === 0}
                className="text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>Batch Remind All ({filteredOverdueList.length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOverdueList.map((item) => {
              const { student, feeSummary, daysOverdue, lastPaymentDate, lastPaymentAmount, urgencyLevel } = item;
              const reminderInfo = remindersLog[student.id];

              return (
                <div
                  key={student.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 hover:shadow-md ${
                    urgencyLevel === 'critical'
                      ? 'bg-rose-50/30 border-rose-300'
                      : urgencyLevel === 'urgent'
                      ? 'bg-amber-50/30 border-amber-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                {/* Top Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${
                      urgencyLevel === 'critical'
                        ? 'bg-rose-600 text-white'
                        : urgencyLevel === 'urgent'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-white'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        Roll: {student.rollNo} • Class {student.classLevel} ({student.stream})
                      </p>
                    </div>
                  </div>

                  {/* Overdue Badge */}
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black border ${
                      urgencyLevel === 'critical'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : urgencyLevel === 'urgent'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                      {daysOverdue} Days Overdue
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {urgencyLevel === 'critical'
                        ? '🚨 Critical Defaulter'
                        : urgencyLevel === 'urgent'
                        ? '⚠️ Urgent Overdue'
                        : '⏱️ Attention Needed'}
                    </p>
                  </div>
                </div>

                {/* Financial Summary & Payment Progress */}
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total Unpaid Balance:</span>
                    <span className="font-black text-rose-700 text-sm">{formatCurrency(feeSummary.dueAmount)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Paid: {formatCurrency(feeSummary.totalPaid)}</span>
                      <span>Total: {formatCurrency(feeSummary.netPayable)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          urgencyLevel === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((feeSummary.totalPaid / Math.max(1, feeSummary.netPayable)) * 100)
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Last payment or admission note */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {lastPaymentDate ? (
                        <>Last payment: <strong>{formatCurrency(lastPaymentAmount || 0)}</strong> on {lastPaymentDate}</>
                      ) : (
                        <>No payments since admission on {student.admissionDate}</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Guardian Details & Reminder History */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Guardian Contact:</span>
                    <span className="font-semibold text-slate-800">
                      {student.guardianName} ({student.contactNumber})
                    </span>
                  </div>

                  {reminderInfo && (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Reminded ({reminderInfo.channel})
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2.5">
                  <button
                    onClick={() => onOpenFeeDepositModal(student.id)}
                    className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Collect Fee</span>
                  </button>

                  <button
                    onClick={() => handleOpenReminderModal(item)}
                    id={`send-reminder-btn-${student.id}`}
                    className={`flex-1 px-3.5 py-2 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      reminderInfo
                        ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-400'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{reminderInfo ? 'Send Follow-up' : 'Send Reminder'}</span>
                  </button>
                </div>

              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Send Reminder Modal Component */}
      {selectedOverdueItem && (
        <SendReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setSelectedOverdueItem(null);
          }}
          student={selectedOverdueItem.student}
          feeSummary={selectedOverdueItem.feeSummary}
          daysOverdue={selectedOverdueItem.daysOverdue}
          lastPaymentDate={selectedOverdueItem.lastPaymentDate}
          lastPaymentAmount={selectedOverdueItem.lastPaymentAmount}
          onReminderSent={handleReminderSent}
          onOpenFeeDepositModal={onOpenFeeDepositModal}
        />
      )}

    </div>
  );
};
