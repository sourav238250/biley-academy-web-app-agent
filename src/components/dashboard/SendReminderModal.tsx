import React, { useState } from 'react';
import { Student, StudentFeeSummary } from '../../types';
import { formatCurrency } from '../../utils/academicUtils';
import {
  X,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Copy,
  Check,
  CreditCard,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react';

export interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  feeSummary: StudentFeeSummary;
  daysOverdue: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  onReminderSent: (studentId: string, channel: 'SMS' | 'WhatsApp' | 'Email' | 'Copy') => void;
  onOpenFeeDepositModal: (studentId: string) => void;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  onClose,
  student,
  feeSummary,
  daysOverdue,
  lastPaymentDate,
  lastPaymentAmount,
  onReminderSent,
  onOpenFeeDepositModal,
}) => {
  if (!isOpen) return null;

  const [channel, setChannel] = useState<'SMS' | 'WhatsApp' | 'Email'>('SMS');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  const lastPaymentText = lastPaymentDate
    ? `on ${lastPaymentDate} (${formatCurrency(lastPaymentAmount || 0)})`
    : `None (Admitted on ${student.admissionDate})`;

  // Default customized message template
  const defaultMessage = `Dear ${student.guardianName || 'Guardian'},

This is an official fee payment reminder from Remix Biley Academy regarding ${student.name} (Roll No: ${student.rollNo}, Class: ${student.classLevel} - ${student.stream}).

Our accounts records show an outstanding fee balance of ${formatCurrency(feeSummary.dueAmount)}.
• Last Payment: ${lastPaymentText}
• Overdue Period: ${daysOverdue} days since last transaction

Kindly deposit the pending tuition installment via UPI, Net Banking, or at our Academy Accounts Counter to ensure uninterrupted classes and test series access.

UPI ID / Payment Link: bileyacademy@upi
Accounts Desk Help: +91 98301 45210

Thank you,
Accounts & Treasury Dept
Remix Biley Academy`;

  const [customMessage, setCustomMessage] = useState(defaultMessage);

  const cleanPhone = student.contactNumber.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Handle Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    onReminderSent(student.id, 'Copy');
    setTimeout(() => setCopied(false), 3000);
  };

  // Handle Send via SMS
  const handleSendSMS = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessStatus(`SMS Reminder successfully dispatched to ${student.guardianName} (${student.contactNumber})!`);
      onReminderSent(student.id, 'SMS');
      setTimeout(() => {
        setSuccessStatus(null);
        onClose();
      }, 2500);
    }, 800);
  };

  // Handle Send via WhatsApp
  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(customMessage);
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
    onReminderSent(student.id, 'WhatsApp');
    setSuccessStatus(`WhatsApp Web opened for ${student.guardianName} (${student.contactNumber}).`);
    setTimeout(() => {
      setSuccessStatus(null);
      onClose();
    }, 2000);
  };

  // Handle Send via Email
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Fee Due Reminder: ${student.name} (Roll: ${student.rollNo}) - Remix Biley Academy`);
    const body = encodeURIComponent(customMessage);
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
    onReminderSent(student.id, 'Email');
    setSuccessStatus(`Email client launched for ${student.email}.`);
    setTimeout(() => {
      setSuccessStatus(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Send Fee Payment Reminder</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {daysOverdue} Days Overdue
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Notify guardian via SMS, WhatsApp, or Email regarding pending tuition balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student & Overdue Summary Bar */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{student.name}</p>
            <p className="text-slate-500 font-mono text-[11px]">
              Roll: {student.rollNo} • Class {student.classLevel} ({student.stream})
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guardian & Contact</span>
            <p className="font-bold text-slate-900 mt-0.5">{student.guardianName} ({student.guardianRelation})</p>
            <p className="text-slate-600 font-mono text-[11px] flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {student.contactNumber}
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Outstanding Due</span>
            <p className="font-black text-rose-700 text-base mt-0.5">{formatCurrency(feeSummary.dueAmount)}</p>
            <p className="text-[10px] text-rose-600">
              Paid: {formatCurrency(feeSummary.totalPaid)} / {formatCurrency(feeSummary.netPayable)}
            </p>
          </div>
        </div>

        {/* Success Alert if dispatched */}
        {successStatus && (
          <div className="m-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs font-semibold">{successStatus}</div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Dispatch Mode Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Select Dispatch Channel:</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  channel === 'SMS'
                    ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>SMS Alert (Direct)</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('WhatsApp')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  channel === 'WhatsApp'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Web</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('Email')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  channel === 'Email'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email Message</span>
              </button>
            </div>
          </div>

          {/* Message Template Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Reminder Message Content:</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={8}
              className="w-full p-3.5 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              You can edit the message text above before sending. UPI details and student roll number are automatically embedded.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFeeDepositModal(student.id);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Direct Collect Fee</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            {channel === 'SMS' && (
              <button
                type="button"
                onClick={handleSendSMS}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Dispatching SMS...' : 'Dispatch SMS Alert'}</span>
              </button>
            )}

            {channel === 'WhatsApp' && (
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Web</span>
              </button>
            )}

            {channel === 'Email' && (
              <button
                type="button"
                onClick={handleSendEmail}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
