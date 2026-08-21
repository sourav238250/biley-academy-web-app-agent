import React, { useState, useMemo } from 'react';
import {
  PaymentDisbursement,
  DisbursementLedgerCategory,
  DisbursementStatus,
  FeeDeposit,
  Student,
  AdminUser,
  InstitutionalAuthorizationConfig,
} from '../../types';
import {
  formatCurrency,
  computeProfitAndLossSummary,
  LEDGER_DEFINITIONS,
} from '../../utils/academicUtils';
import { hasPermission } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import { DisbursementModal } from './DisbursementModal';
import { DisbursementVoucherModal } from './DisbursementVoucherModal';
import { MonthlyLedgerExportModal } from './MonthlyLedgerExportModal';
import {
  generateMonthlyDisbursementLedgerPDF,
  exportMonthlyDisbursementLedgerCSV,
} from '../../utils/disbursementExportUtils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  PieChart,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface DisbursementsViewProps {
  disbursements: PaymentDisbursement[];
  deposits: FeeDeposit[];
  students?: Student[];
  currentAdmin?: AdminUser | null;
  authConfig?: InstitutionalAuthorizationConfig;
  onAddDisbursement: (disbursement: PaymentDisbursement) => void;
  onUpdateDisbursement: (disbursement: PaymentDisbursement) => void;
  onDeleteDisbursement: (id: string) => void;
  onOpenAuthSettings?: () => void;
}

export const DisbursementsView: React.FC<DisbursementsViewProps> = ({
  disbursements,
  deposits,
  students = [],
  currentAdmin,
  authConfig,
  onAddDisbursement,
  onUpdateDisbursement,
  onDeleteDisbursement,
  onOpenAuthSettings,
}) => {
  // Extract unique months for filter
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthSet.add(currentMonth);

    disbursements.forEach((d) => {
      if (d.disbursementDate) monthSet.add(d.disbursementDate.slice(0, 7));
    });
    deposits.forEach((d) => {
      if (d.depositDate) monthSet.add(d.depositDate.slice(0, 7));
    });

    const sorted = Array.from(monthSet).sort().reverse();
    return sorted.map((key) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const label = date.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      });
      return { key, label };
    });
  }, [disbursements, deposits]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [selectedLedgerFilter, setSelectedLedgerFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [editingDisbursement, setEditingDisbursement] = useState<PaymentDisbursement | null>(null);
  const [activeVoucherDisbursement, setActiveVoucherDisbursement] = useState<PaymentDisbursement | null>(null);
  const [quickLedgerSelection, setQuickLedgerSelection] = useState<DisbursementLedgerCategory | undefined>(undefined);

  // Permissions
  const canCreateDisbursement = hasPermission(currentAdmin || null, 'DISBURSEMENT_CREATE');
  const canDeleteDisbursement = hasPermission(currentAdmin || null, 'DISBURSEMENT_DELETE') || currentAdmin?.role === 'Super Admin / Director';

  // Compute Full Profit & Loss Breakdown
  const pnlSummary = useMemo(() => {
    return computeProfitAndLossSummary(
      deposits,
      disbursements,
      students,
      authConfig?.monthlyDisbursementBudgetCap,
      authConfig?.minimumProfitReserveTarget
    );
  }, [deposits, disbursements, students, authConfig]);

  // Filtered List
  const filteredDisbursements = useMemo(() => {
    return disbursements.filter((item) => {
      const matchesMonth =
        selectedMonthFilter === 'all' || item.disbursementDate.startsWith(selectedMonthFilter);

      const matchesSearch =
        item.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.invoiceBillNo && item.invoiceBillNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.transactionRef && item.transactionRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.purposeDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLedger =
        selectedLedgerFilter === 'all' || item.ledger === selectedLedgerFilter;

      const matchesStatus =
        selectedStatusFilter === 'all' || item.status === selectedStatusFilter;

      return matchesMonth && matchesSearch && matchesLedger && matchesStatus;
    });
  }, [disbursements, searchQuery, selectedMonthFilter, selectedLedgerFilter, selectedStatusFilter]);

  // Direct PDF Export
  const handleExportPDFDirect = () => {
    const monthObj = availableMonths.find((m) => m.key === selectedMonthFilter);
    const monthLabel =
      selectedMonthFilter === 'all'
        ? 'All Recorded Months'
        : monthObj
        ? monthObj.label
        : selectedMonthFilter;

    const doc = generateMonthlyDisbursementLedgerPDF({
      monthKey: selectedMonthFilter,
      monthLabel,
      ledgerFilter: selectedLedgerFilter,
      statusFilter: selectedStatusFilter,
      disbursements,
      deposits,
      authConfig,
    });

    const fileSuffix = selectedMonthFilter === 'all' ? 'All_Months' : selectedMonthFilter;
    doc.save(`Biley_Academy_Disbursement_Ledger_${fileSuffix}.pdf`);
  };

  // Direct CSV Export
  const handleExportCSVDirect = () => {
    const monthObj = availableMonths.find((m) => m.key === selectedMonthFilter);
    const monthLabel =
      selectedMonthFilter === 'all'
        ? 'All Recorded Months'
        : monthObj
        ? monthObj.label
        : selectedMonthFilter;

    exportMonthlyDisbursementLedgerCSV({
      monthKey: selectedMonthFilter,
      monthLabel,
      ledgerFilter: selectedLedgerFilter,
      statusFilter: selectedStatusFilter,
      disbursements,
      deposits,
      authConfig,
    });
  };

  const handleOpenAddModal = (ledgerCat?: DisbursementLedgerCategory) => {
    setEditingDisbursement(null);
    setQuickLedgerSelection(ledgerCat);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (item: PaymentDisbursement) => {
    setEditingDisbursement(item);
    setQuickLedgerSelection(undefined);
    setIsCreateModalOpen(true);
  };

  const handleSave = (item: PaymentDisbursement) => {
    if (editingDisbursement) {
      onUpdateDisbursement(item);
    } else {
      onAddDisbursement(item);
    }
  };

  const isProfitPositive = pnlSummary.netOperatingProfit >= 0;
  const reserveSurplus = pnlSummary.netOperatingProfit - pnlSummary.minimumProfitReserveTarget;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Role Access Header */}
      <SectionAuthHeader
        section="disbursements"
        currentAdmin={currentAdmin}
        onOpenPermissionsMatrix={onOpenAuthSettings}
      />

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black tracking-widest uppercase bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-md">
              TREASURY & LEDGERS
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Real-time Profit & Loss Allocation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Payment Disbursements Against Profit
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Track, authorize, and disburse expenditures across institutional ledgers (Faculty Salary, Vendors, Contractors, Capital Assets, Grocery & Pantry, Utilities, Marketing, and Misc) with instant solvency margin tracking against gross fee revenue.
          </p>
        </div>

        {/* Action Buttons with Export Ledger PDF/CSV */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Export Monthly Ledger Button */}
          <button
            id="export-monthly-ledger-modal-btn"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            title="Configure and Export Monthly Disbursement Ledger (PDF / CSV)"
          >
            <Download className="w-4 h-4" />
            <span>Export Monthly Ledger</span>
          </button>

          {/* Quick PDF Export */}
          <button
            id="quick-export-disbursements-pdf-btn"
            onClick={handleExportPDFDirect}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            title="Download formatted PDF of current ledger records"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Quick CSV Export */}
          <button
            id="quick-export-disbursements-csv-btn"
            onClick={handleExportCSVDirect}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            title="Download CSV spreadsheet of current ledger records"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {canCreateDisbursement && (
            <button
              id="new-disbursement-btn"
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Record Disbursement</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Financial Overview Cards (P&L Metric Deck) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Fee Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Fee Inflow</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(pnlSummary.grossRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total realized fee collections from {deposits.length} deposits
          </p>
        </div>

        {/* Card 2: Total Disbursed Outflow */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Disbursed</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(pnlSummary.totalDisbursed)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realized across 8 operational ledger accounts
          </p>
        </div>

        {/* Card 3: Net Operating Profit */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
          isProfitPositive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Net Operating Profit</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isProfitPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            isProfitPositive ? 'text-emerald-900' : 'text-rose-900'
          }`}>
            {formatCurrency(pnlSummary.netOperatingProfit)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs font-bold">
            <span className={isProfitPositive ? 'text-emerald-700' : 'text-rose-700'}>
              {pnlSummary.profitMarginPercent.toFixed(1)}% Profit Margin
            </span>
            <span className="text-slate-500 font-normal">on collections</span>
          </div>
        </div>

        {/* Card 4: Reserve Target Surplus */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reserve Headroom</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            reserveSurplus >= 0 ? 'text-purple-900' : 'text-amber-600'
          }`}>
            {formatCurrency(reserveSurplus)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Target Reserve: {formatCurrency(pnlSummary.minimumProfitReserveTarget)}
          </p>
        </div>
      </div>

      {/* Ledger Accounts Category Grid (Salary, Vendors, Contractor, Assets, Grocery, Utilities, Marketing, Misc) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Institutional Ledger Accounts</h2>
            <p className="text-xs text-slate-500">Expenditure distribution and quick disbursement triggers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pnlSummary.ledgerBreakdown.map((item) => {
            const meta = LEDGER_DEFINITIONS[item.ledger];
            return (
              <div
                key={item.ledger}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                      {item.ledger}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {item.transactionCount} txn{item.transactionCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">{meta.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {meta.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[11px] text-slate-500 font-semibold">Total Disbursed:</span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>

                  {/* Progress Bar of total expenses */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div
                      className="bg-slate-900 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentageOfTotalExpense)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
                    <span>{item.percentageOfTotalExpense.toFixed(1)}% of total cost</span>
                    <span>{item.percentageOfRevenue.toFixed(1)}% of revenue</span>
                  </div>

                  {canCreateDisbursement && (
                    <button
                      onClick={() => handleOpenAddModal(item.ledger)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Disburse {item.ledger}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Payee, Voucher #, Bill #, Purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Filter */}
            <select
              id="disbursements-month-filter"
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Ledger filter */}
            <select
              id="disbursements-ledger-filter"
              value={selectedLedgerFilter}
              onChange={(e) => setSelectedLedgerFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Ledgers</option>
              <option value="Salary">Salary</option>
              <option value="Vendors">Vendors</option>
              <option value="Contractor">Contractor</option>
              <option value="Assets">Assets</option>
              <option value="Grocery">Grocery</option>
              <option value="Utilities">Utilities</option>
              <option value="Marketing">Marketing</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>

            {/* Status filter */}
            <select
              id="disbursements-status-filter"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Disbursed">Disbursed</option>
              <option value="Approved">Approved</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {(searchQuery || selectedMonthFilter !== 'all' || selectedLedgerFilter !== 'all' || selectedStatusFilter !== 'all') && (
              <button
                id="clear-disbursement-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMonthFilter('all');
                  setSelectedLedgerFilter('all');
                  setSelectedStatusFilter('all');
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results summary pill */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-900">{filteredDisbursements.length}</strong> of{' '}
            <strong className="text-slate-900">{disbursements.length}</strong> disbursement records
          </span>
          <span>
            Filtered Total:{' '}
            <strong className="text-slate-900 font-mono">
              {formatCurrency(filteredDisbursements.reduce((sum, d) => sum + d.amount, 0))}
            </strong>
          </span>
        </div>
      </div>

      {/* Disbursements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Voucher No & Date</th>
                <th className="py-3.5 px-4">Ledger & Head</th>
                <th className="py-3.5 px-4">Payee / Beneficiary</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4">Payment Mode & Ref</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No disbursement records match your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust filters or create a new ledger disbursement voucher</p>
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((item) => {
                  const ledgerMeta = LEDGER_DEFINITIONS[item.ledger] || LEDGER_DEFINITIONS.Miscellaneous;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Voucher & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {item.voucherNo}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(item.disbursementDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        </div>
                      </td>

                      {/* 2. Ledger & Head */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md border ${ledgerMeta.badgeBg} ${ledgerMeta.badgeText} ${ledgerMeta.badgeBorder}`}>
                          {item.ledger}
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 max-w-xs" title={item.subCategory}>
                          {item.subCategory || 'General Disbursement'}
                        </p>
                      </td>

                      {/* 3. Payee */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.payeeName}</div>
                        {item.payeeContact && (
                          <div className="text-[11px] text-slate-500">{item.payeeContact}</div>
                        )}
                      </td>

                      {/* 4. Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black font-mono text-slate-950 text-sm sm:text-base">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Auth: {item.authorizedBy}
                        </div>
                      </td>

                      {/* 5. Payment Mode & Ref */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.paymentMode}
                        </span>
                        {item.transactionRef && (
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-[140px]" title={item.transactionRef}>
                            Ref: {item.transactionRef}
                          </p>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.status === 'Disbursed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Approved'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'Pending Approval'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status === 'Disbursed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {item.status === 'Approved' && <Clock className="w-3 h-3 text-blue-600" />}
                          {item.status === 'Pending Approval' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                          {item.status}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveVoucherDisbursement(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                            title="Print Official Payment Voucher"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {canCreateDisbursement && (
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                              title="Edit Disbursement"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canDeleteDisbursement && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete disbursement voucher #${item.voucherNo} for ${item.payeeName} (${formatCurrency(
                                      item.amount
                                    )})?`
                                  )
                                ) {
                                  onDeleteDisbursement(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursement Create/Edit Modal */}
      <DisbursementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaveDisbursement={handleSave}
        editingDisbursement={editingDisbursement}
        deposits={deposits}
        existingDisbursements={disbursements}
        studentsCount={students.length}
        currentAdmin={currentAdmin}
        authConfig={authConfig}
        preselectedLedger={quickLedgerSelection}
      />

      {/* Printable Voucher Modal */}
      <DisbursementVoucherModal
        isOpen={!!activeVoucherDisbursement}
        onClose={() => setActiveVoucherDisbursement(null)}
        disbursement={activeVoucherDisbursement}
        authConfig={authConfig}
      />

      {/* Monthly Ledger PDF/CSV Export Modal */}
      <MonthlyLedgerExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        disbursements={disbursements}
        deposits={deposits}
        authConfig={authConfig}
        initialMonth={selectedMonthFilter !== 'all' ? selectedMonthFilter : undefined}
      />

    </div>
  );
};
