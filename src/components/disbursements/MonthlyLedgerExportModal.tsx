import React, { useState, useMemo } from 'react';
import {
  PaymentDisbursement,
  FeeDeposit,
  InstitutionalAuthorizationConfig,
  DisbursementLedgerCategory,
} from '../../types';
import {
  generateMonthlyDisbursementLedgerPDF,
  exportMonthlyDisbursementLedgerCSV,
  getFilteredDisbursementLedgerData,
} from '../../utils/disbursementExportUtils';
import { formatCurrency, LEDGER_DEFINITIONS } from '../../utils/academicUtils';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  Printer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MonthlyLedgerExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  disbursements: PaymentDisbursement[];
  deposits: FeeDeposit[];
  authConfig?: InstitutionalAuthorizationConfig;
  initialMonth?: string;
}

export const MonthlyLedgerExportModal: React.FC<MonthlyLedgerExportModalProps> = ({
  isOpen,
  onClose,
  disbursements,
  deposits,
  authConfig,
  initialMonth,
}) => {
  // Extract all available months from disbursements and deposits
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    
    // Always include current month
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
        month: 'long',
        year: 'numeric',
      });
      return { key, label };
    });
  }, [disbursements, deposits]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || (availableMonths[0]?.key || 'all')
  );
  const [selectedLedger, setSelectedLedger] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);

  // Month label
  const activeMonthLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'Consolidated All-Time Ledger';
    const found = availableMonths.find((m) => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [selectedMonth, availableMonths]);

  // Preview Summary
  const summary = useMemo(() => {
    return getFilteredDisbursementLedgerData({
      monthKey: selectedMonth,
      monthLabel: activeMonthLabel,
      ledgerFilter: selectedLedger,
      statusFilter: selectedStatus,
      disbursements,
      deposits,
      authConfig,
    });
  }, [selectedMonth, activeMonthLabel, selectedLedger, selectedStatus, disbursements, deposits, authConfig]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    try {
      setIsExportingPDF(true);
      const doc = generateMonthlyDisbursementLedgerPDF({
        monthKey: selectedMonth,
        monthLabel: activeMonthLabel,
        ledgerFilter: selectedLedger,
        statusFilter: selectedStatus,
        disbursements,
        deposits,
        authConfig,
      });

      const sanitized = activeMonthLabel.replace(/[\s/\\:]+/g, '_');
      doc.save(`Biley_Academy_Monthly_Disbursement_Ledger_${sanitized}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadCSV = () => {
    try {
      setIsExportingCSV(true);
      exportMonthlyDisbursementLedgerCSV({
        monthKey: selectedMonth,
        monthLabel: activeMonthLabel,
        ledgerFilter: selectedLedger,
        statusFilter: selectedStatus,
        disbursements,
        deposits,
        authConfig,
      });
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const isProfit = summary.netOperatingProfit >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                  FINANCIAL AUDIT EXPORT
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Export Monthly Disbursement Ledger
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-slate-800 text-xs sm:text-sm">
          
          {/* Controls & Period Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Month Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Reporting Month</span>
              </label>
              <select
                id="export-month-selector"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs sm:text-sm"
              >
                <option value="all">Consolidated All Time</option>
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Ledger Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Ledger Category</span>
              </label>
              <select
                id="export-ledger-selector"
                value={selectedLedger}
                onChange={(e) => setSelectedLedger(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs sm:text-sm"
              >
                <option value="all">All Ledgers (Full Institute)</option>
                {Object.keys(LEDGER_DEFINITIONS).map((ledger) => (
                  <option key={ledger} value={ledger}>
                    {ledger}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Voucher Status</span>
              </label>
              <select
                id="export-status-selector"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Disbursed">Disbursed Only</option>
                <option value="Approved">Approved Only</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

          </div>

          {/* Real-time Financial Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Export Scope & Performance
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {activeMonthLabel}
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 font-mono font-bold text-xs rounded-lg">
                {summary.recordCount} Vouchers Selected
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Fee Revenue</span>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 block mt-0.5">
                  {formatCurrency(summary.grossRevenue)}
                </span>
                <span className="text-[10px] text-slate-400">{summary.filteredDeposits.length} receipts</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Disbursed</span>
                <span className="text-xs sm:text-sm font-black font-mono text-rose-700 block mt-0.5">
                  {formatCurrency(summary.totalDisbursed)}
                </span>
                <span className="text-[10px] text-slate-400">{summary.recordCount} records</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Profit</span>
                <span className={`text-xs sm:text-sm font-black font-mono block mt-0.5 ${isProfit ? 'text-indigo-700' : 'text-rose-700'}`}>
                  {formatCurrency(summary.netOperatingProfit)}
                </span>
                <span className="text-[10px] text-slate-400">{summary.profitMargin.toFixed(1)}% margin</span>
              </div>
            </div>

            {/* Active Ledger Summary Preview */}
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 block">Included Ledger Heads:</span>
              <div className="flex flex-wrap gap-1.5">
                {summary.ledgerBreakdown
                  .filter((l) => l.amount > 0)
                  .map((l) => (
                    <span
                      key={l.ledger}
                      className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 text-[10px]"
                    >
                      {l.ledger}: <strong className="font-mono">{formatCurrency(l.amount)}</strong> ({l.pctOfExpense.toFixed(0)}%)
                    </span>
                  ))}
                {summary.ledgerBreakdown.every((l) => l.amount === 0) && (
                  <span className="text-slate-400 italic">No expense records found for selected filters</span>
                )}
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Record-Keeping Format
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: PDF Document */}
              <button
                id="modal-download-pdf-ledger-btn"
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-slate-900 transition-all cursor-pointer group text-left shadow-2xs hover:border-rose-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-rose-950 text-sm">
                      Export as PDF Report
                    </h4>
                    <p className="text-[11px] text-rose-700">
                      Printable institutional format with official seal & signatory slots
                    </p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-rose-700 shrink-0 ml-2 group-hover:translate-y-0.5 transition-transform" />
              </button>

              {/* Option 2: CSV Spreadsheet */}
              <button
                id="modal-download-csv-ledger-btn"
                type="button"
                onClick={handleDownloadCSV}
                disabled={isExportingCSV}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-slate-900 transition-all cursor-pointer group text-left shadow-2xs hover:border-emerald-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-950 text-sm">
                      Export as CSV File
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Excel / Audit spreadsheet with line-item metadata & UTRs
                    </p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-emerald-700 shrink-0 ml-2 group-hover:translate-y-0.5 transition-transform" />
              </button>

            </div>
          </div>

          {/* Audit Note */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-100 p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <p>
              Administrative record exports are stamped with current institutional signatories (<strong>{authConfig?.accountsSignatoryName || 'Accounts Officer'}</strong> & <strong>{authConfig?.directorName || 'Director'}</strong>) and include gross revenue, budget allocations, and net profit margins.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
