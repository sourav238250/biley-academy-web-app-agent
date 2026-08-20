import React, { useState } from 'react';
import { FeeDeposit, Student, InstitutionalAuthorizationConfig } from '../../types';
import { formatCurrency } from '../../utils/academicUtils';
import { DEFAULT_AUTHORIZATION_CONFIG } from '../../utils/storage';
import {
  Printer,
  X,
  CheckCircle,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  FileDown,
  Edit3,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ReceiptModalProps {
  deposit: FeeDeposit | null;
  student: Student | null;
  onClose: () => void;
  authConfig?: InstitutionalAuthorizationConfig;
  onUpdateAuthConfig?: (config: InstitutionalAuthorizationConfig) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  deposit,
  student,
  onClose,
  authConfig = DEFAULT_AUTHORIZATION_CONFIG,
  onUpdateAuthConfig,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditingAuth, setIsEditingAuth] = useState(false);

  // Editable authorization signatory fields
  const [signatoryName, setSignatoryName] = useState(
    authConfig.accountsSignatoryName || 'S. Mukherjee'
  );
  const [signatoryDesignation, setSignatoryDesignation] = useState(
    authConfig.accountsSignatoryDesignation || 'Chief Accounts Officer'
  );
  const [authoritySubtext, setAuthoritySubtext] = useState(
    authConfig.accountsAuthoritySubtext || 'Biley Academy Treasury'
  );
  const [collectedByName, setCollectedByName] = useState(
    deposit?.collectedBy || authConfig.defaultCollectedBy || 'Accounts Dept - S. Mukherjee'
  );
  const [sealText, setSealText] = useState(
    authConfig.sealVerificationText || 'PAID'
  );

  if (!deposit || !student) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleSaveAuth = () => {
    if (onUpdateAuthConfig) {
      onUpdateAuthConfig({
        ...authConfig,
        accountsSignatoryName: signatoryName,
        accountsSignatoryDesignation: signatoryDesignation,
        accountsAuthoritySubtext: authoritySubtext,
        defaultCollectedBy: collectedByName,
        sealVerificationText: sealText,
      });
    }
    setIsEditingAuth(false);
  };

  return (
    <div id="receipt-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div id="receipt-modal-card" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Header Actions (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Official Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingAuth(!isEditingAuth)}
              id="edit-receipt-auth-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                isEditingAuth
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Edit Authorized Signatory Name, Designation and Collector"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingAuth ? 'Done Editing' : 'Edit Authorization'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              id="print-receipt-btn"
              title="Click to print or select 'Save as PDF' in the destination dropdown"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-75"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Preparing Print...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>Print / Save PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              id="close-receipt-btn"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authorization Inline Edit Toolbar (Hidden in Print) */}
        {isEditingAuth && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 print:hidden animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                Customize Authorization Name & Signature Lines
              </span>
              <button
                onClick={handleSaveAuth}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Settings</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Authorized Signatory Name:
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-md font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Signatory Designation:
                </label>
                <input
                  type="text"
                  value={signatoryDesignation}
                  onChange={(e) => setSignatoryDesignation(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-md font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Collected By Tag:
                </label>
                <input
                  type="text"
                  value={collectedByName}
                  onChange={(e) => setCollectedByName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-md font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Printable Receipt Body */}
        <div id="printable-receipt-content" className="p-8 bg-white text-slate-800 font-sans">
          {/* Institute Watermark & Header */}
          <div className="border-b-2 border-emerald-800/20 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                      {authConfig.sealInstitutionName || 'BILEY ACADEMY'}
                    </h1>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Est. 2018
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Center for Secondary & Higher Secondary Academic Excellence (Class 5 to 12)
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> 42/1 Academy Avenue, Kolkata 700029</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> +91 98301 00000</span>
                  </p>
                </div>
              </div>

              {/* Receipt Pill */}
              <div className="text-right">
                <span className="inline-block border-2 border-emerald-600 bg-emerald-50 text-emerald-800 font-bold text-xs uppercase px-3 py-1 rounded-md tracking-wider">
                  FEE DEPOSIT RECEIPT
                </span>
                <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                  No: {deposit.receiptNo}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Date: {deposit.depositDate}
                </p>
              </div>
            </div>
          </div>

          {/* Student & Payment Summary Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
            <div>
              <p className="text-slate-500 font-medium uppercase text-[10px]">Student Details</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{student.name}</p>
              <p className="text-slate-600 mt-0.5"><span className="font-semibold">Student ID:</span> {student.id}</p>
              <p className="text-slate-600 mt-0.5"><span className="font-semibold">Roll No:</span> {student.rollNo}</p>
              <p className="text-slate-600 mt-0.5"><span className="font-semibold">Class / Stream:</span> Class {student.classLevel} ({student.stream})</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium uppercase text-[10px]">Guardian & Batch Info</p>
              <p className="font-semibold text-slate-800 mt-0.5">{student.guardianName} ({student.guardianRelation})</p>
              <p className="text-slate-600 mt-0.5"><span className="font-semibold">Contact:</span> {student.contactNumber}</p>
              <p className="text-slate-600 mt-0.5"><span className="font-semibold">Batch:</span> {student.batch}</p>
              <p className="text-slate-600 mt-0.5"><span className="font-semibold">Payment Mode:</span> {deposit.paymentMode}</p>
            </div>
          </div>

          {/* Table of Fee Particulars */}
          <table className="w-full text-xs text-left mb-6 border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Fee Particulars / Description</th>
                <th className="py-2.5 px-4">Coverage Period</th>
                <th className="py-2.5 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              <tr>
                <td className="py-3 px-4 text-slate-500 font-mono">01</td>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {deposit.feeHead}
                  {deposit.remarks && (
                    <span className="block text-[11px] font-normal text-slate-500 mt-0.5">{deposit.remarks}</span>
                  )}
                  {deposit.transactionRef && (
                    <span className="block font-mono text-[10px] text-emerald-700 mt-0.5">Ref / Txn ID: {deposit.transactionRef}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {deposit.monthsCovered && deposit.monthsCovered.length > 0
                    ? deposit.monthsCovered.join(', ')
                    : 'Current Academic Session'}
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">
                  {formatCurrency(deposit.amountPaid)}
                </td>
              </tr>
              {deposit.discountApplied && deposit.discountApplied > 0 ? (
                <tr className="bg-emerald-50/50">
                  <td className="py-2 px-4 text-emerald-700 font-mono">-</td>
                  <td colSpan={2} className="py-2 px-4 text-emerald-800 font-medium italic">
                    Scholarship / Merit Concession Applied
                  </td>
                  <td className="py-2 px-4 text-right text-emerald-700 font-semibold">
                    - {formatCurrency(deposit.discountApplied)}
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right uppercase text-[11px] text-slate-700">
                  Net Amount Received:
                </td>
                <td className="py-3 px-4 text-right text-base text-emerald-700">
                  {formatCurrency(deposit.amountPaid)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Stamp & Authorized Signature Footer */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200 mt-8">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-700/60 flex items-center justify-center p-1 text-center rotate-[-8deg] select-none opacity-85">
                <div className="border border-emerald-700/40 rounded-full w-full h-full flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-tight">
                    {authConfig.sealInstitutionName || 'BILEY ACADEMY'}
                  </span>
                  <span className="text-[10px] font-black text-emerald-900 tracking-wider">
                    {sealText}
                  </span>
                  <span className="text-[7px] text-emerald-700 font-mono">{deposit.depositDate}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 max-w-[220px]">
                <p>Receipt generated electronically.</p>
                <p className="font-semibold text-slate-700">Collected by: {collectedByName}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="w-40 border-b border-slate-400 mb-1 ml-auto"></div>
              <p className="text-xs font-bold text-slate-900">
                {signatoryName}
              </p>
              <p className="text-[10px] font-semibold text-slate-700">
                {signatoryDesignation}
              </p>
              <p className="text-[9px] text-slate-500">
                {authoritySubtext}
              </p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-6 pt-3 border-t border-slate-100">
            * This is an official computer-generated fee acknowledgement receipt. Please preserve for academic records.
          </div>
        </div>

      </div>
    </div>
  );
};
