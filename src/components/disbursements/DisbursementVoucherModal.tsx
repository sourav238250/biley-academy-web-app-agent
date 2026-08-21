import React, { useRef } from 'react';
import { PaymentDisbursement, InstitutionalAuthorizationConfig } from '../../types';
import { formatCurrency, LEDGER_DEFINITIONS } from '../../utils/academicUtils';
import { Printer, X, Download, ShieldCheck, CheckCircle2, Building2, Layers, DollarSign, Calendar, FileText, ArrowUpRight } from 'lucide-react';

interface DisbursementVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  disbursement: PaymentDisbursement | null;
  authConfig?: InstitutionalAuthorizationConfig;
}

export const DisbursementVoucherModal: React.FC<DisbursementVoucherModalProps> = ({
  isOpen,
  onClose,
  disbursement,
  authConfig,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !disbursement) return null;

  const ledgerMeta = LEDGER_DEFINITIONS[disbursement.ledger] || LEDGER_DEFINITIONS.Miscellaneous;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6 print:m-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Official Payment Voucher</h3>
              <p className="text-xs text-slate-400 font-mono">Voucher #{disbursement.voucherNo}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="print-disbursement-voucher-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div ref={printAreaRef} className="p-6 sm:p-10 bg-white text-slate-900 font-sans">
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black tracking-widest uppercase bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-md">
                    FINANCIAL DISBURSEMENT
                  </span>
                  <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
                    P&L Operating Ledger
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
                  {authConfig?.sealInstitutionName || 'BILEY ACADEMY'}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Academic & Professional Coaching Institute (Classes 1 - 12)
                </p>
                <p className="text-xs text-slate-500">
                  Registered Institute Headquarters • Central Accounts & Treasury Cell
                </p>
              </div>

              {/* Status Badge & Stamp */}
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 flex flex-col items-start sm:items-end justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {disbursement.status}
                </div>
                <p className="text-xs font-mono font-bold text-slate-900">{disbursement.voucherNo}</p>
                <p className="text-[11px] text-slate-500">
                  Date: <span className="font-semibold text-slate-700">{new Date(disbursement.disbursementDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ledger Classification Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Disbursement Ledger</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${ledgerMeta.badgeBg} ${ledgerMeta.badgeText} ${ledgerMeta.badgeBorder}`}>
                  {disbursement.ledger} Ledger
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sub-Category / Head</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{disbursement.subCategory || 'General Disbursement'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Invoice / Reference</span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">
                {disbursement.invoiceBillNo ? `Bill #${disbursement.invoiceBillNo}` : 'Direct Treasury Voucher'}
              </p>
            </div>
          </div>

          {/* Beneficiary & Payment Details Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
            <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Payee & Transaction Specifications</span>
              <span className="text-amber-400 font-mono">INR Currency</span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
                <span className="text-slate-500 font-medium">Beneficiary / Payee Name:</span>
                <span className="font-bold text-slate-950 text-sm sm:text-base">{disbursement.payeeName}</span>
              </div>

              {disbursement.payeeContact && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
                  <span className="text-slate-500 font-medium">Contact / Phone:</span>
                  <span className="font-semibold text-slate-800">{disbursement.payeeContact}</span>
                </div>
              )}

              {disbursement.payeeAccountOrUpi && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
                  <span className="text-slate-500 font-medium">Bank A/C or UPI Handle:</span>
                  <span className="font-mono font-semibold text-slate-800">{disbursement.payeeAccountOrUpi}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
                <span className="text-slate-500 font-medium">Mode of Payment:</span>
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                  {disbursement.paymentMode}
                </span>
              </div>

              {disbursement.transactionRef && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
                  <span className="text-slate-500 font-medium">Transaction Reference / UTR / Cheque:</span>
                  <span className="font-mono font-bold text-slate-900">{disbursement.transactionRef}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-slate-100 gap-1">
                <span className="text-slate-500 font-medium">Purpose Description:</span>
                <span className="text-slate-800 font-medium sm:text-right max-w-md">{disbursement.purposeDescription}</span>
              </div>

              {disbursement.notes && (
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                  <span className="text-slate-500 font-medium">Treasury Audit Notes:</span>
                  <span className="text-slate-600 italic sm:text-right max-w-md">{disbursement.notes}</span>
                </div>
              )}
            </div>

            {/* Total Amount Callout */}
            <div className="bg-slate-50 border-t-2 border-slate-300 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Net Disbursed Amount</span>
                <span className="text-[11px] text-slate-500">Debited against Institute Operational Inflow</span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight">
                  {formatCurrency(disbursement.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Verification Note */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-slate-700 text-[11px] leading-relaxed mb-8">
            <p className="font-semibold text-amber-900 mb-0.5">Statutory & Institutional Accounting Note:</p>
            This voucher serves as verified proof of payment disbursed from institutional fee collections and revenue reserves under the categorized ledger code. Retained for annual chartered accountancy audit and institutional P&L assessment.
          </div>

          {/* Signatures & Seal Block */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 items-end text-center">
            {/* Accounts Officer */}
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif italic text-sm text-slate-700 font-semibold border-b border-slate-400 px-4">
                  {authConfig?.accountsSignatoryName || 'S. Mukherjee'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {authConfig?.accountsSignatoryName || 'S. Mukherjee'}
              </p>
              <p className="text-[10px] text-slate-500">
                {authConfig?.accountsSignatoryDesignation || 'Chief Accounts Officer'}
              </p>
              <p className="text-[9px] text-slate-400">Treasury Disbursement Cell</p>
            </div>

            {/* Academy Seal Stamp */}
            <div className="hidden sm:flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-500/60 flex flex-col items-center justify-center text-amber-700 p-1">
                <ShieldCheck className="w-5 h-5 text-amber-600 mb-0.5" />
                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-900">
                  {authConfig?.sealInstitutionName || 'BILEY ACADEMY'}
                </span>
                <span className="text-[7px] font-bold text-amber-600">TREASURY SEAL</span>
              </div>
            </div>

            {/* Director Authorization */}
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif italic text-sm text-purple-900 font-semibold border-b border-slate-400 px-4">
                  {disbursement.authorizedBy || authConfig?.directorName || 'Dr. Birendra Nath Biley'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {disbursement.authorizedBy || authConfig?.directorName || 'Dr. Birendra Nath Biley'}
              </p>
              <p className="text-[10px] text-slate-500">
                {authConfig?.directorDesignation || 'Director & Founder'}
              </p>
              <p className="text-[9px] text-slate-400">Institutional Authority</p>
            </div>
          </div>

        </div>

        {/* Footer info (Hidden on Print) */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-500 print:hidden">
          Use the Print Voucher button to print or save a PDF copy for institute records.
        </div>

      </div>
    </div>
  );
};
