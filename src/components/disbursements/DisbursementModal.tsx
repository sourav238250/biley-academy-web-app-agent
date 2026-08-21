import React, { useState, useEffect } from 'react';
import {
  PaymentDisbursement,
  DisbursementLedgerCategory,
  DisbursementPaymentMode,
  DisbursementStatus,
  AdminUser,
  FeeDeposit,
  InstitutionalAuthorizationConfig,
} from '../../types';
import {
  formatCurrency,
  generateDisbursementVoucherNumber,
  LEDGER_DEFINITIONS,
  computeProfitAndLossSummary,
} from '../../utils/academicUtils';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Info,
  HelpCircle,
} from 'lucide-react';

interface DisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDisbursement: (disbursement: PaymentDisbursement) => void;
  editingDisbursement?: PaymentDisbursement | null;
  deposits: FeeDeposit[];
  existingDisbursements: PaymentDisbursement[];
  studentsCount: number;
  currentAdmin?: AdminUser | null;
  authConfig?: InstitutionalAuthorizationConfig;
  preselectedLedger?: DisbursementLedgerCategory;
}

export const DisbursementModal: React.FC<DisbursementModalProps> = ({
  isOpen,
  onClose,
  onSaveDisbursement,
  editingDisbursement,
  deposits,
  existingDisbursements,
  studentsCount,
  currentAdmin,
  authConfig,
  preselectedLedger,
}) => {
  const [ledger, setLedger] = useState<DisbursementLedgerCategory>(
    preselectedLedger || 'Salary'
  );
  const [subCategory, setSubCategory] = useState<string>('');
  const [payeeName, setPayeeName] = useState<string>('');
  const [payeeContact, setPayeeContact] = useState<string>('');
  const [payeeAccountOrUpi, setPayeeAccountOrUpi] = useState<string>('');
  const [amount, setAmount] = useState<number>(15000);
  const [paymentMode, setPaymentMode] = useState<DisbursementPaymentMode>('Bank NEFT / RTGS');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [invoiceBillNo, setInvoiceBillNo] = useState<string>('');
  const [authorizedBy, setAuthorizedBy] = useState<string>(
    currentAdmin?.name || authConfig?.directorName || 'Dr. Birendra Nath Biley'
  );
  const [purposeDescription, setPurposeDescription] = useState<string>('');
  const [status, setStatus] = useState<DisbursementStatus>('Disbursed');
  const [notes, setNotes] = useState<string>('');
  const [disbursementDate, setDisbursementDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Sync state when modal opens or editing item changes
  useEffect(() => {
    if (editingDisbursement) {
      setLedger(editingDisbursement.ledger);
      setSubCategory(editingDisbursement.subCategory || '');
      setPayeeName(editingDisbursement.payeeName);
      setPayeeContact(editingDisbursement.payeeContact || '');
      setPayeeAccountOrUpi(editingDisbursement.payeeAccountOrUpi || '');
      setAmount(editingDisbursement.amount);
      setPaymentMode(editingDisbursement.paymentMode);
      setTransactionRef(editingDisbursement.transactionRef || '');
      setInvoiceBillNo(editingDisbursement.invoiceBillNo || '');
      setAuthorizedBy(editingDisbursement.authorizedBy);
      setPurposeDescription(editingDisbursement.purposeDescription);
      setStatus(editingDisbursement.status);
      setNotes(editingDisbursement.notes || '');
      setDisbursementDate(editingDisbursement.disbursementDate);
    } else {
      const defaultLedger = preselectedLedger || 'Salary';
      setLedger(defaultLedger);
      setSubCategory(LEDGER_DEFINITIONS[defaultLedger].commonSubCategories[0] || '');
      setPayeeName('');
      setPayeeContact('');
      setPayeeAccountOrUpi('');
      setAmount(defaultLedger === 'Salary' ? 35000 : defaultLedger === 'Assets' ? 45000 : 8500);
      setPaymentMode(defaultLedger === 'Salary' || defaultLedger === 'Assets' ? 'Bank NEFT / RTGS' : 'Corporate UPI / IMPS');
      setTransactionRef('');
      setInvoiceBillNo('');
      setAuthorizedBy(currentAdmin?.name || authConfig?.directorName || 'Dr. Birendra Nath Biley');
      setPurposeDescription('');
      setStatus('Disbursed');
      setNotes('');
      setDisbursementDate(new Date().toISOString().slice(0, 10));
    }
  }, [editingDisbursement, isOpen, preselectedLedger, currentAdmin, authConfig]);

  // When ledger changes in creation mode, update default subCategory and amount suggestion
  const handleLedgerChange = (newLedger: DisbursementLedgerCategory) => {
    setLedger(newLedger);
    if (!editingDisbursement) {
      setSubCategory(LEDGER_DEFINITIONS[newLedger].commonSubCategories[0] || '');
      if (newLedger === 'Salary') setAmount(45000);
      else if (newLedger === 'Assets') setAmount(50000);
      else if (newLedger === 'Grocery') setAmount(4500);
      else if (newLedger === 'Utilities') setAmount(12000);
      else if (newLedger === 'Marketing') setAmount(18000);
      else if (newLedger === 'Contractor') setAmount(7500);
      else if (newLedger === 'Vendors') setAmount(12500);
      else setAmount(3000);
    }
  };

  if (!isOpen) return null;

  // Real-time Solvency & Profit Calculation
  const currentSummary = computeProfitAndLossSummary(deposits, existingDisbursements, []);
  
  // Calculate impact of this disbursement
  const otherDisbursements = editingDisbursement
    ? existingDisbursements.filter((d) => d.id !== editingDisbursement.id)
    : existingDisbursements;
  
  const currentTotalPaid = otherDisbursements
    .filter((d) => d.status === 'Disbursed')
    .reduce((sum, d) => sum + d.amount, 0);

  const newTotalDisbursed = status === 'Disbursed' ? currentTotalPaid + Number(amount || 0) : currentTotalPaid;
  const newNetProfit = currentSummary.grossRevenue - newTotalDisbursed;
  const newProfitMargin = currentSummary.grossRevenue > 0 ? (newNetProfit / currentSummary.grossRevenue) * 100 : 0;

  const isDeficit = newNetProfit < 0;
  const isLowSurplus = newNetProfit >= 0 && newNetProfit < (authConfig?.minimumProfitReserveTarget || 100000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeName.trim()) {
      alert('Please enter the Payee / Beneficiary Name');
      return;
    }
    if (Number(amount) <= 0) {
      alert('Please enter a valid disbursement amount greater than 0');
      return;
    }

    const disbursementData: PaymentDisbursement = {
      id: editingDisbursement?.id || `DISB-${Date.now()}`,
      voucherNo: editingDisbursement?.voucherNo || generateDisbursementVoucherNumber(),
      disbursementDate,
      ledger,
      subCategory: subCategory.trim() || LEDGER_DEFINITIONS[ledger].commonSubCategories[0] || 'General Head',
      payeeName: payeeName.trim(),
      payeeContact: payeeContact.trim() || undefined,
      payeeAccountOrUpi: payeeAccountOrUpi.trim() || undefined,
      amount: Number(amount),
      paymentMode,
      transactionRef: transactionRef.trim() || undefined,
      invoiceBillNo: invoiceBillNo.trim() || undefined,
      authorizedBy: authorizedBy.trim() || 'Chief Accounts Officer',
      purposeDescription: purposeDescription.trim() || `${ledger} ledger disbursement approved against operational profit.`,
      status,
      notes: notes.trim() || undefined,
      createdAt: editingDisbursement?.createdAt || new Date().toISOString(),
    };

    onSaveDisbursement(disbursementData);

    if (status === 'Disbursed') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // Safe fallback
      }
    }

    onClose();
  };

  const currentLedgerMeta = LEDGER_DEFINITIONS[ledger];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-7 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                  P&L DISBURSEMENT
                </span>
                <span className="text-xs text-slate-400 font-medium">Against Fee Collections</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {editingDisbursement ? 'Edit Payment Disbursement' : 'Record Payment Disbursement'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer relative z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Live Profit Impact Dashboard Ribbon */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Solvency & Net Profit Impact Gauge
              </span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isDeficit
                ? 'bg-rose-500 text-white'
                : isLowSurplus
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            }`}>
              {isDeficit ? '⚠️ Deficit Alert' : isLowSurplus ? '⚡ Low Profit Reserve' : '✓ Safe Profit Headroom'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Gross Inflow (Fees)</span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                {formatCurrency(currentSummary.grossRevenue)}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Disbursement Amount</span>
              <span className="text-sm sm:text-base font-bold font-mono text-amber-300">
                {formatCurrency(Number(amount || 0))}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Net Profit After Disb.</span>
              <span className={`text-sm sm:text-base font-bold font-mono ${
                isDeficit ? 'text-rose-400' : 'text-white'
              }`}>
                {formatCurrency(newNetProfit)}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Projected Margin</span>
              <span className={`text-sm sm:text-base font-bold font-mono ${
                newProfitMargin > 40 ? 'text-emerald-400' : newProfitMargin > 15 ? 'text-amber-300' : 'text-rose-400'
              }`}>
                {newProfitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* 1. Ledger Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Disbursement Ledger Head <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(LEDGER_DEFINITIONS) as DisbursementLedgerCategory[]).map((cat) => {
                const meta = LEDGER_DEFINITIONS[cat];
                const isSelected = ledger === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleLedgerChange(cat)}
                    className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black uppercase ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                        {cat}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>
                    <span className={`text-[10px] line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {meta.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sub-Category Preset / Custom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Head / Sub-Category
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 bg-white"
              >
                {currentLedgerMeta.commonSubCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="Custom Expense Head">Other / Custom Head...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Disbursement Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 3. Beneficiary Details */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-600" />
              Beneficiary & Payee Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Payee / Vendor / Contractor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anirban Mukherjee / Apex Printing Press / CESC Kolkata"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98301 XXXXX"
                  value={payeeContact}
                  onChange={(e) => setPayeeContact(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Bank Account / UPI Handle / Payment Destination
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC A/C 50100239182910 or vendor@okhdfcbank"
                value={payeeAccountOrUpi}
                onChange={(e) => setPayeeAccountOrUpi(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 4. Payment Amount & Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as DisbursementPaymentMode)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="Bank NEFT / RTGS">Bank NEFT / RTGS</option>
                <option value="Corporate UPI / IMPS">Corporate UPI / IMPS</option>
                <option value="Cheque">Account Payee Cheque</option>
                <option value="Cash Voucher">Cash Voucher</option>
                <option value="Debit/Credit Card">Debit/Credit Corporate Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Disbursement Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DisbursementStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="Disbursed">Disbursed (Debit Realized)</option>
                <option value="Approved">Approved (Pending Bank Release)</option>
                <option value="Pending Approval">Pending Approval / Draft</option>
                <option value="Cancelled">Cancelled / Void</option>
              </select>
            </div>
          </div>

          {/* 5. References & Signatory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transaction Ref / UTR / Cheque No.
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-HDFC-991823 or CHQ-0021"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Invoice / Bill Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-881"
                value={invoiceBillNo}
                onChange={(e) => setInvoiceBillNo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Authorized Signatory <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 6. Purpose & Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Purpose Description & Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Monthly professional faculty compensation for Classes 11-12 Physics & Foundation batches..."
              value={purposeDescription}
              onChange={(e) => setPurposeDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Internal Audit Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fixed asset serial tags attached to register; verified by Lab In-Charge."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Institutional Treasury Record</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-disbursement-btn"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>{editingDisbursement ? 'Update Voucher' : 'Authorize & Disburse'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
