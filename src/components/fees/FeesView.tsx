import React, { useState, useEffect } from 'react';
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
import { evaluateSectionAuthorization, hasPermission } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import { RestrictionBanner } from '../common/RestrictionBanner';
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
  Download,
  Calculator,
  FileSpreadsheet,
  Edit3,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';

interface FeesViewProps {
  students: Student[];
  deposits: FeeDeposit[];
  authConfig?: import('../../types').InstitutionalAuthorizationConfig;
  onAddDeposit: (deposit: FeeDeposit) => void;
  onDeleteDeposit: (depositId: string) => void;
  onViewReceipt: (deposit: FeeDeposit) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  preselectedStudentId?: string;
  initialActiveTab?: 'deposits' | 'dues' | 'structure';
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
  onOpenAuthorizationSettings?: () => void;
  onOpenAuthSettings?: () => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  students,
  deposits,
  authConfig,
  onAddDeposit,
  onDeleteDeposit,
  onViewReceipt,
  isDepositModalOpen,
  setIsDepositModalOpen,
  preselectedStudentId,
  initialActiveTab,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
  onOpenAuthorizationSettings,
  onOpenAuthSettings,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'fees');
  const isFeeDepositLocked = authConfig?.isFeeDepositLocked || false;
  const canCollectFees = auth.canWrite && hasPermission(currentAdmin, 'FEES_COLLECT_DEPOSIT') && !isFeeDepositLocked;
  const canManageStructures = auth.canWrite && hasPermission(currentAdmin, 'FEES_MANAGE_STRUCTURE');
  const handleOpenAuthSettings = onOpenAuthorizationSettings || onOpenAuthSettings;
  const [activeTab, setActiveTab] = useState<'deposits' | 'dues' | 'structure'>(
    initialActiveTab || 'deposits'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Sync initial tab when changed from props
  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  // Fee Structures State with Local Persistence
  const [feeStructures, setFeeStructures] = useState<Record<string, FeeStructure>>(() => {
    try {
      const saved = localStorage.getItem('biley_academy_custom_fee_structure_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load fee structures:', e);
    }
    return DEFAULT_FEE_STRUCTURE;
  });

  // Fee Structure UI Filter & Search
  const [structureCategoryFilter, setStructureCategoryFilter] = useState<
    'ALL' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR' | 'SCIENCE' | 'COMMERCE' | 'ARTS'
  >('ALL');

  // Interactive Fee Calculator State
  const [calcClass, setCalcClass] = useState<ClassLevel>('10');
  const [calcStream, setCalcStream] = useState<string>('General');
  const [calcMode, setCalcMode] = useState<'full' | 'perSubject'>('full');
  const [calcSubjectCount, setCalcSubjectCount] = useState<number>(4);
  const [calcScholarship, setCalcScholarship] = useState<number>(0);

  // Edit Fee Rate Modal State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editAdmissionFee, setEditAdmissionFee] = useState<number>(0);
  const [editMonthlyFee, setEditMonthlyFee] = useState<number>(0);
  const [editPerSubjectFee, setEditPerSubjectFee] = useState<number>(0);
  const [editExamFee, setEditExamFee] = useState<number>(0);
  const [editMaterialsFee, setEditMaterialsFee] = useState<number>(0);
  const [structureSuccessNotice, setStructureSuccessNotice] = useState<string | null>(null);

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

  const handleOpenDepositModal = (studentId?: string, customAmount?: number) => {
    const sId = studentId || preselectedStudentId || students[0]?.id || '';
    setSelectedStudentId(sId);
    
    // Auto-calculate suggested monthly amount
    const targetStudent = students.find((s) => s.id === sId);
    if (customAmount) {
      setAmountPaid(customAmount);
    } else if (targetStudent) {
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

  // Fee Structure Handlers
  const handleExportFeeScheduleCSV = () => {
    const headers = [
      'Class Level',
      'Stream Track',
      'Admission Fee (INR)',
      'Monthly Tuition Fee (INR)',
      'Per Subject Fee (INR)',
      'Exam Fee Per Term (INR)',
      'Study Materials Fee (INR)',
      'Total Estimated Annual Fee (INR)',
    ];

    const rows = (Object.values(feeStructures) as FeeStructure[]).map((st: FeeStructure) => {
      const estAnnual =
        st.admissionFee +
        st.monthlyTuitionFee * 12 +
        st.examFeePerTerm * 2 +
        st.materialsFee;
      return [
        `"Class ${st.classLevel}"`,
        `"${st.stream}"`,
        st.admissionFee,
        st.monthlyTuitionFee,
        st.perSubjectMonthlyFee || 0,
        st.examFeePerTerm,
        st.materialsFee,
        estAnnual,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `biley_academy_active_fee_structure_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFeeStructures = () => {
    if (window.confirm('Reset all class fee structures back to academy standard defaults?')) {
      setFeeStructures(DEFAULT_FEE_STRUCTURE);
      localStorage.removeItem('biley_academy_custom_fee_structure_v1');
      setStructureSuccessNotice('Fee structures successfully reset to Academy standard rates.');
      setTimeout(() => setStructureSuccessNotice(null), 4000);
    }
  };

  const handleStartEditStructure = (key: string, st: FeeStructure) => {
    setEditingKey(key);
    setEditAdmissionFee(st.admissionFee);
    setEditMonthlyFee(st.monthlyTuitionFee);
    setEditPerSubjectFee(st.perSubjectMonthlyFee || 300);
    setEditExamFee(st.examFeePerTerm);
    setEditMaterialsFee(st.materialsFee);
  };

  const handleSaveStructureEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;
    const current = feeStructures[editingKey];
    if (!current) return;

    const updated: FeeStructure = {
      ...current,
      admissionFee: Number(editAdmissionFee),
      monthlyTuitionFee: Number(editMonthlyFee),
      perSubjectMonthlyFee: Number(editPerSubjectFee),
      examFeePerTerm: Number(editExamFee),
      materialsFee: Number(editMaterialsFee),
    };

    const updatedMap = {
      ...feeStructures,
      [editingKey]: updated,
    };

    setFeeStructures(updatedMap);
    try {
      localStorage.setItem('biley_academy_custom_fee_structure_v1', JSON.stringify(updatedMap));
    } catch (err) {
      console.error('Failed to save custom fee structures:', err);
    }
    setEditingKey(null);
    setStructureSuccessNotice(`Rates for Class ${current.classLevel} (${current.stream}) updated successfully!`);
    setTimeout(() => setStructureSuccessNotice(null), 4000);
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

      {/* Institutional Policy Restriction Banner (if Fee Deposit locked) */}
      <RestrictionBanner
        type="fee_deposit"
        authConfig={authConfig}
        currentAdmin={currentAdmin}
        onOpenSettings={handleOpenAuthSettings}
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
              id="fee-deposits-tab-btn"
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
              id="fee-dues-tab-btn"
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
              id="fee-structure-tab-btn"
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'structure'
                  ? 'bg-slate-900 text-amber-300 shadow-xs border border-slate-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Active Fee Structure</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-extrabold">
                12 Classes
              </span>
            </button>

            {handleOpenAuthSettings && (
              <button
                onClick={handleOpenAuthSettings}
                id="fee-signatory-settings-btn"
                title="Edit Authorized Accounts Signatory Name, Designation, and Receipt Seal"
                className="px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 text-emerald-800 hover:bg-emerald-100 bg-emerald-50 border border-emerald-200"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Receipt Signatory</span>
              </button>
            )}
          </div>

          {isFeeDepositLocked ? (
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold whitespace-nowrap">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Deposits Restricted by Policy</span>
            </div>
          ) : canCollectFees ? (
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
                            {canCollectFees && (
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
                            )}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Outstanding Fees &amp; Defaulters Tracker</h3>
              <p className="text-xs text-slate-500">Students with pending annual tuition, admission or exam dues</p>
            </div>
            {defaultersList.length > 0 && (
              <button
                onClick={() => {
                  const escapeCsv = (val: string | number | undefined | null) => {
                    if (val === undefined || val === null) return '""';
                    const s = String(val).replace(/"/g, '""');
                    return `"${s}"`;
                  };
                  const headers = [
                    'Student ID',
                    'Roll No',
                    'Student Name',
                    'Class Level',
                    'Stream',
                    'Guardian Name',
                    'Contact Number',
                    'Email',
                    'Net Annual Fee (INR)',
                    'Total Paid (INR)',
                    'Outstanding Due (INR)',
                    'Fee Status',
                    'Scholarship Percent',
                  ];
                  const rows = defaultersList.map(({ student, summary }) => [
                    escapeCsv(student.id),
                    escapeCsv(student.rollNo),
                    escapeCsv(student.name),
                    escapeCsv(`Class ${student.classLevel}`),
                    escapeCsv(student.stream),
                    escapeCsv(student.guardianName),
                    escapeCsv(student.contactNumber),
                    escapeCsv(student.email),
                    summary.netPayable,
                    summary.totalPaid,
                    summary.dueAmount,
                    escapeCsv(summary.feeStatus),
                    student.scholarshipPercent || 0,
                  ].join(','));
                  const csvContent = [headers.join(','), ...rows].join('\r\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `biley_academy_fee_dues_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dues CSV ({defaultersList.length})</span>
              </button>
            )}
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
                          {canCollectFees && (
                            <button
                              onClick={() => handleOpenDepositModal(student.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Deposit Now
                            </button>
                          )}
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
        <div className="space-y-6">
          
          {/* Active Fee Policy Header Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-slate-800">
            <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-400 text-slate-950 text-[11px] font-extrabold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Active Fee Policy (2025–2026)
                  </span>
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[11px] font-semibold rounded-full border border-slate-700">
                    Classes 1 to 12 Covered
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 text-[11px] font-semibold rounded-full border border-emerald-800/60">
                    Standard INR (₹)
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Biley Academy Official Fee Structure & Rate Card
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Transparent, structured fee schedule covering Admission, Monthly Tuition, Examination cycles, and Lab/Study Material packages for all classes and senior secondary academic streams.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportFeeScheduleCSV}
                  id="export-fee-structure-csv-btn"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Schedule CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  id="print-fee-structure-btn"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Schedule</span>
                </button>
                {canManageStructures && (
                  <button
                    onClick={handleResetFeeStructures}
                    id="reset-fee-structure-btn"
                    title="Reset to Academy Standard Defaults"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification alert */}
            {structureSuccessNotice && (
              <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{structureSuccessNotice}</span>
              </div>
            )}
          </div>

          {/* Interactive Live Fee Calculator & Admission Estimator */}
          <div className="bg-gradient-to-br from-amber-50/70 via-white to-slate-50 rounded-2xl border border-amber-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Interactive Live Fee & Admission Estimator
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Instantly project monthly tuition, annual package, and scholarship concessions for any prospective student.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full w-fit">
                Live Dynamic Calculator
              </span>
            </div>

            {/* Calculator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Class Level</label>
                <select
                  value={calcClass}
                  onChange={(e) => {
                    const newClass = e.target.value as ClassLevel;
                    setCalcClass(newClass);
                    if (['11', '12'].includes(newClass)) {
                      setCalcStream('Science');
                    } else {
                      setCalcStream('General');
                    }
                  }}
                  id="calc-class-select"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Academic Stream</label>
                <select
                  value={calcStream}
                  onChange={(e) => setCalcStream(e.target.value)}
                  disabled={!['11', '12'].includes(calcClass)}
                  id="calc-stream-select"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {['11', '12'].includes(calcClass) ? (
                    <>
                      <option value="Science">Science (PCB / PCM)</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts / Humanities</option>
                      <option value="General">General Track</option>
                    </>
                  ) : (
                    <option value="General">General Foundation</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Enrollment Package</label>
                <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setCalcMode('full')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      calcMode === 'full'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Full Combo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('perSubject')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      calcMode === 'perSubject'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Per-Subject ({calcSubjectCount})
                  </button>
                </div>
                {calcMode === 'perSubject' && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">Subjects:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCalcSubjectCount(num)}
                          className={`w-6 h-6 rounded-md text-[10px] font-bold cursor-pointer ${
                            calcSubjectCount === num
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Merit Scholarship</label>
                <select
                  value={calcScholarship}
                  onChange={(e) => setCalcScholarship(Number(e.target.value))}
                  id="calc-scholarship-select"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value={0}>0% - Standard Rate</option>
                  <option value={10}>10% - Early Bird / Sibling</option>
                  <option value={25}>25% - Academic Merit</option>
                  <option value={50}>50% - High Distinction</option>
                  <option value={100}>100% - Full Academy Scholarship</option>
                </select>
              </div>
            </div>

            {/* Calculated Breakdown Display */}
            {(() => {
              const structKey = `${calcClass}-${calcStream}`;
              const st = feeStructures[structKey] || feeStructures[`${calcClass}-General`] || Object.values(feeStructures)[0];
              const monthlyRate =
                calcMode === 'full'
                  ? st.monthlyTuitionFee
                  : (st.perSubjectMonthlyFee || 300) * calcSubjectCount;
              const annualTuition = monthlyRate * 12;
              const admissionFee = st.admissionFee;
              const examFees = st.examFeePerTerm * 2;
              const materialsFee = st.materialsFee;
              const grossAnnual = admissionFee + annualTuition + examFees + materialsFee;
              const scholarshipSavings = Math.round((grossAnnual * calcScholarship) / 100);
              const netAnnual = grossAnnual - scholarshipSavings;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Tuition</span>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                      {formatCurrency(monthlyRate)}
                      <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                    </p>
                    <span className="text-[9px] text-slate-400">12 installments</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">One-time Admission</span>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {formatCurrency(admissionFee)}
                    </p>
                    <span className="text-[9px] text-slate-400">Enrollment & Reg.</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Cycles</span>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {formatCurrency(examFees)}
                    </p>
                    <span className="text-[9px] text-slate-400">2 Terms (Mid & Final)</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Notes & Materials</span>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {formatCurrency(materialsFee)}
                    </p>
                    <span className="text-[9px] text-slate-400">Annual Kit & Modules</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Scholarship Concession</span>
                    <p className="text-base font-extrabold text-rose-600 mt-0.5">
                      {scholarshipSavings > 0 ? `-${formatCurrency(scholarshipSavings)}` : '₹0'}
                    </p>
                    <span className="text-[9px] text-slate-400">{calcScholarship}% Concession</span>
                  </div>

                  <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">Net Est. Annual</span>
                      <p className="text-base font-black text-white mt-0.5">
                        {formatCurrency(netAnnual)}
                      </p>
                    </div>
                    {auth.canWrite && (
                      <button
                        onClick={() => handleOpenDepositModal(undefined, monthlyRate)}
                        className="mt-1 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Collect This Rate
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Fee Schedule Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            
            {/* Table Filters Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Standard Class Fee Matrix (Grades 1 to 12)
                </h4>
                <p className="text-xs text-slate-500">
                  Click 'Edit Rates' to modify amounts or 'Estimate / Deposit' to collect fees for that class.
                </p>
              </div>

              {/* Category Segment Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'ALL', label: 'All Classes' },
                  { id: 'PRIMARY', label: 'Primary (1-4)' },
                  { id: 'MIDDLE', label: 'Middle (5-8)' },
                  { id: 'SECONDARY', label: 'Secondary (9-10)' },
                  { id: 'SENIOR', label: 'Senior (11-12)' },
                  { id: 'SCIENCE', label: 'Science' },
                  { id: 'COMMERCE', label: 'Commerce' },
                  { id: 'ARTS', label: 'Arts' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStructureCategoryFilter(tab.id as any)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                      structureCategoryFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Class Level</th>
                    <th className="py-3 px-4">Stream Track</th>
                    <th className="py-3 px-4 text-right">Admission Fee</th>
                    <th className="py-3 px-4 text-right">Monthly Tuition</th>
                    <th className="py-3 px-4 text-right">Per-Subject Rate</th>
                    <th className="py-3 px-4 text-right">Exam Fee / Term</th>
                    <th className="py-3 px-4 text-right">Study Materials</th>
                    <th className="py-3 px-4 text-right">Est. Annual Total</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(Object.entries(feeStructures) as [string, FeeStructure][])
                    .filter(([key, st]) => {
                      const classNum = parseInt(st.classLevel, 10);
                      if (structureCategoryFilter === 'PRIMARY') return classNum >= 1 && classNum <= 4;
                      if (structureCategoryFilter === 'MIDDLE') return classNum >= 5 && classNum <= 8;
                      if (structureCategoryFilter === 'SECONDARY') return classNum >= 9 && classNum <= 10;
                      if (structureCategoryFilter === 'SENIOR') return classNum >= 11 && classNum <= 12;
                      if (structureCategoryFilter === 'SCIENCE') return st.stream === 'Science';
                      if (structureCategoryFilter === 'COMMERCE') return st.stream === 'Commerce';
                      if (structureCategoryFilter === 'ARTS') return st.stream === 'Arts';
                      return true;
                    })
                    .map(([key, st]) => {
                      const estAnnual =
                        st.admissionFee +
                        st.monthlyTuitionFee * 12 +
                        st.examFeePerTerm * 2 +
                        st.materialsFee;

                      return (
                        <tr key={key} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-900">
                            Class {st.classLevel}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] ${
                                st.stream === 'Science'
                                  ? 'bg-blue-100 text-blue-800'
                                  : st.stream === 'Commerce'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : st.stream === 'Arts'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {st.stream}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700 font-medium">
                            {formatCurrency(st.admissionFee)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {formatCurrency(st.monthlyTuitionFee)}/mo
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {st.perSubjectMonthlyFee ? `${formatCurrency(st.perSubjectMonthlyFee)}/mo` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {formatCurrency(st.examFeePerTerm)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {formatCurrency(st.materialsFee)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-950">
                            {formatCurrency(estAnnual)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setCalcClass(st.classLevel);
                                  setCalcStream(st.stream);
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                                title="Load into live fee calculator"
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Estimate
                              </button>
                              {canManageStructures && (
                                <button
                                  onClick={() => handleStartEditStructure(key, st)}
                                  title="Edit fee amounts for this class"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[10px] transition-colors cursor-pointer flex items-center gap-0.5"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

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

      {/* Edit Class Fee Structure Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">
                    Edit Fee Rates: Class {feeStructures[editingKey]?.classLevel} ({feeStructures[editingKey]?.stream})
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Adjust standard session charges for this specific academic track
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingKey(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStructureEdit} className="p-6 space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Admission Fee (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={editAdmissionFee}
                    onChange={(e) => setEditAdmissionFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">One-time registration fee</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Tuition (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={editMonthlyFee}
                    onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-400">Full combo monthly rate</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Per-Subject Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={editPerSubjectFee}
                    onChange={(e) => setEditPerSubjectFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400">Single subject rate</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Exam Fee / Term (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={editExamFee}
                    onChange={(e) => setEditExamFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400">Per term (2 terms/yr)</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Study Materials (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={editMaterialsFee}
                    onChange={(e) => setEditMaterialsFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400">Annual kit & notes</span>
                </div>
              </div>

              {/* Calculated Annual Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Computed Est. Annual Fee</span>
                  <span className="text-xs text-slate-500">Admission + (12 × Tuition) + (2 × Exam) + Materials</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">
                    {formatCurrency(
                      editAdmissionFee + (editMonthlyFee * 12) + (editExamFee * 2) + editMaterialsFee
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-fee-structure-edit-btn"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Save Class Rates</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
