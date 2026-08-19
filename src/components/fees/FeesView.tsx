import React, { useState } from 'react';
import {
  Student,
  FeeDeposit,
  FeeHeadType,
  PaymentMode,
  ClassLevel,
  FeeStructure,
  AdminUser,
} from '../../types';
import {
  formatCurrency,
  computeStudentFeeSummary,
  generateReceiptNumber,
  DEFAULT_FEE_STRUCTURE,
  CLASS_LEVELS,
} from '../../utils/academicUtils';
import { evaluateSectionAuthorization } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import { SessionRevenueGoalTracker } from './SessionRevenueGoalTracker';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  TrendingUp,
  Receipt,
  Layers,
  ArrowUpRight,
  Filter,
  Trash2,
  X,
  FileText,
  DollarSign,
  Send,
  Lock,
} from 'lucide-react';

interface FeesViewProps {
  students: Student[];
  deposits: FeeDeposit[];
  onAddDeposit: (deposit: FeeDeposit) => void;
  onDeleteDeposit: (depositId: string) => void;
  onViewReceipt: (deposit: FeeDeposit) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  preselectedStudentId?: string;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  students,
  deposits,
  onAddDeposit,
  onDeleteDeposit,
  onViewReceipt,
  isDepositModalOpen,
  setIsDepositModalOpen,
  preselectedStudentId,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'fees');
  const [activeTab, setActiveTab] = useState<'deposits' | 'dues' | 'structure'>('deposits');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Form State for Fee Deposit Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudentId || students[0]?.id || ''
  );
  const [feeHead, setFeeHead] = useState<FeeHeadType>('Tuition Fee');
  const [amountPaid, setAmountPaid] = useState<number>(3000);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI / GPay / PhonePe');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['Current Quarter']);
  const [collectedBy, setCollectedBy] = useState<string>('Accounts Dept - S. Mukherjee');
  const [remarks, setRemarks] = useState<string>('Tuition installment received with receipt issued.');

  const handleOpenDepositModal = (studentId?: string) => {
    const sId = studentId || preselectedStudentId || students[0]?.id || '';
    setSelectedStudentId(sId);
    
    // Auto-calculate suggested monthly amount
    const targetStudent = students.find((s) => s.id === sId);
    if (targetStudent) {
      const summary = computeStudentFeeSummary(targetStudent, deposits);
      setAmountPaid(summary.dueAmount > 0 ? Math.min(summary.dueAmount, 5000) : 2500);
    }
    setTransactionRef(`UPI/${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`);
    setIsDepositModalOpen(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || amountPaid <= 0) {
      alert('Please select a student and enter a valid positive payment amount.');
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    const receiptNo = generateReceiptNumber(deposits.length);

    const newDeposit: FeeDeposit = {
      id: receiptNo,
      receiptNo,
      studentId: selectedStudentId,
      depositDate: new Date().toISOString().split('T')[0],
      amountPaid: Number(amountPaid),
      feeHead,
      monthsCovered: selectedMonths,
      paymentMode,
      transactionRef: transactionRef || undefined,
      collectedBy,
      remarks,
      discountApplied: student?.scholarshipPercent
        ? Math.round((Number(amountPaid) * student.scholarshipPercent) / 100)
        : undefined,
    };

    onAddDeposit(newDeposit);
    setIsDepositModalOpen(false);

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {}

    // Auto show receipt
    onViewReceipt(newDeposit);
  };

  // Calculations for Dues & Collections
  const allFeeSummaries = students.map((s) => ({
    student: s,
    summary: computeStudentFeeSummary(s, deposits),
  }));

  const totalCollectedGross = deposits.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalOutstandingDues = allFeeSummaries.reduce((sum, item) => sum + item.summary.dueAmount, 0);
  const defaultersList = allFeeSummaries.filter((item) => item.summary.dueAmount > 0);

  // Filtered deposits
  const filteredDeposits = deposits.filter((dep) => {
    const student = students.find((s) => s.id === dep.studentId);
    const matchesSearch =
      (student && student.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dep.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.feeHead.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dep.transactionRef && dep.transactionRef.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass =
      selectedClassFilter === 'all' || (student && student.classLevel === selectedClassFilter);

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      
      {/* Section Authorization Unit Status Banner */}
      <SectionAuthHeader
        currentAdmin={currentAdmin || null}
        sectionTab="fees"
        onOpenAdminLogin={onOpenAdminLogin || (() => {})}
        onOpenPermissionsMatrix={onOpenPermissionsMatrix}
      />

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Student Fees Deposit & Receipt Treasury
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect student fees, manage class 5-12 tuition fee structures, track outstanding arrears & generate official receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'deposits'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Collection Ledger ({deposits.length})
            </button>
            <button
              onClick={() => setActiveTab('dues')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'dues'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Dues ({defaultersList.length})
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'structure'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Structure
            </button>
          </div>

          {auth.canWrite ? (
            <button
              onClick={() => handleOpenDepositModal()}
              id="open-deposit-modal-btn"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Record Fee Deposit
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold whitespace-nowrap">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Treasury Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Academic Session Revenue Goal & Collection Velocity Progress Tracker */}
      <SessionRevenueGoalTracker
        students={students}
        deposits={deposits}
        onOpenDepositModal={() => handleOpenDepositModal()}
      />

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Total Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {formatCurrency(totalCollectedGross)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all active batches (Class 5 - 12)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding Dues</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">
            {formatCurrency(totalOutstandingDues)}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {defaultersList.length} students with unpaid balance
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Receipts Issued</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {deposits.length} Official Invoices
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Instant printable / PDF receipts available</p>
        </div>
      </div>

      {activeTab === 'deposits' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, receipt number or txn ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
              >
                <option value="all">All Classes</option>
                {CLASS_LEVELS.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredDeposits.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No deposit records found. Click "Record Fee Deposit" to add a new transaction.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt No & Date</th>
                    <th className="py-3 px-4">Student & Class</th>
                    <th className="py-3 px-4">Fee Head</th>
                    <th className="py-3 px-4">Mode / Reference</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeposits.map((dep) => {
                    const student = students.find((s) => s.id === dep.studentId);
                    return (
                      <tr key={dep.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{dep.receiptNo}</span>
                          <span className="text-[10px] text-slate-400">{dep.depositDate}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">
                            {student?.name || 'Unknown Student'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Class {student?.classLevel} ({student?.stream}) • {student?.rollNo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {dep.feeHead}
                          </span>
                          {dep.remarks && (
                            <span className="block text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                              {dep.remarks}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700">{dep.paymentMode}</span>
                          {dep.transactionRef && (
                            <span className="block font-mono text-[10px] text-slate-500">
                              {dep.transactionRef}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-black text-sm text-emerald-700">
                            {formatCurrency(dep.amountPaid)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewReceipt(dep)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-amber-400" />
                              View / Print
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete receipt ${dep.receiptNo}?`)) {
                                  onDeleteDeposit(dep.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dues' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Outstanding Fees & Defaulters Tracker</h3>
            <p className="text-xs text-slate-500">Students with pending annual tuition, admission or exam dues</p>
          </div>

          {defaultersList.length === 0 ? (
            <div className="p-12 text-center text-emerald-600 font-bold text-sm bg-emerald-50/50 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              All student fee accounts are 100% up-to-date! No pending dues.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student Name & ID</th>
                    <th className="py-3 px-4">Class & Stream</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4 text-center">Net Annual Fee</th>
                    <th className="py-3 px-4 text-center">Total Paid</th>
                    <th className="py-3 px-4 text-center">Outstanding Due</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaultersList.map(({ student, summary }) => (
                    <tr key={student.id} className="hover:bg-amber-50/40">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm block">{student.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{student.id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">Class {student.classLevel}</span>
                        <span className="block text-[11px] text-slate-500">{student.stream}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{student.guardianName}</p>
                        <p className="font-mono text-[11px] text-slate-500">{student.contactNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {formatCurrency(summary.netPayable)}
                        {student.scholarshipPercent > 0 && (
                          <span className="block text-[9px] text-emerald-700 font-bold">
                            ({student.scholarshipPercent}% Scholarship applied)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {formatCurrency(summary.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-sm text-amber-700">
                        {formatCurrency(summary.dueAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              alert(`Simulating SMS / WhatsApp payment reminder sent to ${student.guardianName} (${student.contactNumber}) for pending due of ${formatCurrency(summary.dueAmount)}.`);
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                            title="Send Payment Reminder Alert"
                          >
                            <Send className="w-3 h-3 text-slate-500" />
                            Remind
                          </button>
                          <button
                            onClick={() => handleOpenDepositModal(student.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Deposit Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'structure' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Biley Academy Official Fee Structure (Classes 1 to 12)</h3>
            <p className="text-xs text-slate-500">Standard annual fees breakdown by Class & Stream</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Class Level</th>
                  <th className="py-3 px-4">Stream Track</th>
                  <th className="py-3 px-4 text-right">Admission Fee</th>
                  <th className="py-3 px-4 text-right">Monthly Tuition</th>
                  <th className="py-3 px-4 text-right">Exam Fee / Term</th>
                  <th className="py-3 px-4 text-right">Study Materials</th>
                  <th className="py-3 px-4 text-right">Total Est. Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Object.entries(DEFAULT_FEE_STRUCTURE).map(([key, st]) => {
                  const estAnnual =
                    st.admissionFee +
                    st.monthlyTuitionFee * 12 +
                    st.examFeePerTerm * 2 +
                    st.materialsFee;

                  return (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">Class {st.classLevel}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{st.stream}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(st.admissionFee)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {formatCurrency(st.monthlyTuitionFee)}/mo
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(st.examFeePerTerm)}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(st.materialsFee)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatCurrency(estAnnual)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Fee Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Record Student Fee Deposit</h3>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-6 space-y-4 text-xs font-sans">
              
              {/* Student Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Enrolled Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    const target = students.find((s) => s.id === e.target.value);
                    if (target) {
                      const summary = computeStudentFeeSummary(target, deposits);
                      if (summary.dueAmount > 0) {
                        setAmountPaid(Math.min(summary.dueAmount, 5000));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-xs"
                >
                  {students.map((st) => {
                    const sum = computeStudentFeeSummary(st, deposits);
                    return (
                      <option key={st.id} value={st.id}>
                        {st.name} (Class {st.classLevel} - {st.stream}) • Due: {formatCurrency(sum.dueAmount)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Student Summary Preview Card */}
              {(() => {
                const targetStudent = students.find((s) => s.id === selectedStudentId);
                if (!targetStudent) return null;
                const summary = computeStudentFeeSummary(targetStudent, deposits);

                return (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Class & Stream:</span>
                      <strong className="text-slate-800">Class {targetStudent.classLevel} ({targetStudent.stream})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Total Paid So Far:</span>
                      <strong className="text-emerald-700">{formatCurrency(summary.totalPaid)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Current Outstanding Due:</span>
                      <strong className="text-amber-700 font-bold">{formatCurrency(summary.dueAmount)}</strong>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fee Particular / Head *</label>
                  <select
                    value={feeHead}
                    onChange={(e) => setFeeHead(e.target.value as FeeHeadType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Admission Fee">Admission Fee</option>
                    <option value="Exam Fee">Exam Fee</option>
                    <option value="Study Material & Lab Fee">Study Material & Lab Fee</option>
                    <option value="Annual Development Fee">Annual Development Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount Deposited (₹) *</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash Counter</option>
                    <option value="Net Banking">Net Banking / IMPS</option>
                    <option value="Debit/Credit Card">Debit/Credit Card (POS)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Transaction / Reference ID</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/260405118942"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Accounts Officer / Collected By</label>
                <input
                  type="text"
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deposit Remarks / Ledger Note</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Quarter 1 tuition fee received with verified receipt."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-fee-deposit-btn"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Generate Official Fee Receipt
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
