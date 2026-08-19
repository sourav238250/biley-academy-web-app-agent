import React, { useState } from 'react';
import { Student } from '../../types';
import { Printer, X, GraduationCap, Phone, MapPin, QrCode, Loader2 } from 'lucide-react';

interface IdCardModalProps {
  student: Student | null;
  onClose: () => void;
}

export const IdCardModal: React.FC<IdCardModalProps> = ({ student, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!student) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  return (
    <div id="id-card-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-xs">
      <div id="id-card-modal-card" className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:m-0 print:border-none print:shadow-none">
        
        {/* Modal Action Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <span className="font-semibold text-xs flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            Official Student ID Card
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              id="print-id-card-btn"
              title="Click to print or select 'Save as PDF' in the destination dropdown"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-75"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              id="close-id-card-btn"
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ID Card Front */}
        <div className="p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white font-sans relative overflow-hidden">
          {/* Decorative background curves */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl"></div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white">BILEY ACADEMY</h2>
                <p className="text-[9px] text-amber-300 font-semibold uppercase tracking-wider">
                  STUDENT IDENTITY CARD
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              2025 - 2026
            </span>
          </div>

          {/* Body Profile */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-24 h-28 rounded-xl bg-slate-800 border-2 border-amber-400/80 flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-inner">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-amber-300 mb-1 border border-slate-600">
                {student.name.charAt(0)}
              </div>
              <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-400">
                {student.status}
              </span>
            </div>

            <div className="text-xs space-y-1">
              <h3 className="text-sm font-bold text-white tracking-tight">{student.name}</h3>
              <p className="text-slate-300 font-mono text-[11px]"><span className="text-slate-400">ID:</span> {student.id}</p>
              <p className="text-slate-300"><span className="text-slate-400">Class:</span> <span className="font-semibold text-amber-300">Class {student.classLevel}</span> ({student.stream})</p>
              <p className="text-slate-300"><span className="text-slate-400">Roll:</span> {student.rollNo}</p>
              <p className="text-slate-300"><span className="text-slate-400">Guardian:</span> {student.guardianName}</p>
              <p className="text-slate-300"><span className="text-slate-400">Blood Group:</span> {student.bloodGroup || 'N/A'}</p>
            </div>
          </div>

          {/* Footer Bar with barcode/QR simulation */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
            <div>
              <p className="text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-amber-400" />
                {student.contactNumber}
              </p>
              <p className="text-slate-500 text-[9px] mt-0.5">Emergency: {student.emergencyContact || '+91 98301 00000'}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded text-slate-300">
              <QrCode className="w-5 h-5 text-amber-300" />
              <span className="font-mono text-[9px]">AUTH-VERIFIED</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
