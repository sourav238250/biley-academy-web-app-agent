import React, { useState, useEffect } from 'react';
import { InstitutionalAuthorizationConfig, AdminUser } from '../../types';
import { DEFAULT_AUTHORIZATION_CONFIG } from '../../utils/storage';
import {
  ShieldCheck,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Building2,
  FileCheck2,
  Award,
  CreditCard,
  UserCheck,
  Stamp,
  Edit3,
} from 'lucide-react';

interface AuthorizationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authConfig: InstitutionalAuthorizationConfig;
  onSaveAuthConfig: (config: InstitutionalAuthorizationConfig) => void;
  currentAdmin?: AdminUser | null;
  onUpdateCurrentAdmin?: (admin: AdminUser) => void;
  defaultTab?: 'all' | 'restrictions' | 'treasury' | 'accounts' | 'academic' | 'exams' | 'profile';
}

export const AuthorizationSettingsModal: React.FC<AuthorizationSettingsModalProps> = ({
  isOpen,
  onClose,
  authConfig,
  onSaveAuthConfig,
  currentAdmin,
  onUpdateCurrentAdmin,
  defaultTab = 'all',
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'restrictions' | 'treasury' | 'accounts' | 'academic' | 'exams' | 'profile'>(defaultTab);
  const [formData, setFormData] = useState<InstitutionalAuthorizationConfig>(authConfig || DEFAULT_AUTHORIZATION_CONFIG);
  
  // Profile state for active staff
  const [adminName, setAdminName] = useState(currentAdmin?.name || 'Dr. Birendra Nath Biley');
  const [adminDesignation, setAdminDesignation] = useState(currentAdmin?.designation || 'Director & Founder');
  const [adminEmail, setAdminEmail] = useState(currentAdmin?.email || 'director@bileyacademy.edu');

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (authConfig) {
      setFormData(authConfig);
    }
  }, [authConfig]);

  useEffect(() => {
    if (currentAdmin) {
      setAdminName(currentAdmin.name);
      setAdminDesignation(currentAdmin.designation);
      setAdminEmail(currentAdmin.email);
    }
  }, [currentAdmin]);

  useEffect(() => {
    setActiveCategory(defaultTab);
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof InstitutionalAuthorizationConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all authorization names, restrictions, and signatories to default academy configuration?')) {
      setFormData(DEFAULT_AUTHORIZATION_CONFIG);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAuthConfig(formData);

    // If current admin updated, also update admin user
    if (currentAdmin && onUpdateCurrentAdmin) {
      onUpdateCurrentAdmin({
        ...currentAdmin,
        name: adminName.trim() || currentAdmin.name,
        designation: adminDesignation.trim() || currentAdmin.designation,
        email: adminEmail.trim() || currentAdmin.email,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div
      id="authorization-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="authorization-settings-modal"
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  ERP Governance & Authorization
                </span>
                <span className="text-[10px] font-mono text-slate-400">Institutional Authority</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Policy Restrictions & Signatory Controls
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-authorization-settings-btn"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-amber-300 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>All Controls</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('restrictions')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'restrictions'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-300" />
            <span>Admissions & Fee Restrictions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('treasury')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'treasury'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
            <span>Disbursement & Profit Targets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('accounts')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'accounts'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fee Receipts & Treasury</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('academic')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'academic'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-300" />
            <span>Report Cards & Director</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('exams')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'exams'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-purple-300" />
            <span>Question Papers & DPPs</span>
          </button>

          {currentAdmin && (
            <button
              type="button"
              onClick={() => setActiveCategory('profile')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeCategory === 'profile'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-200" />
              <span>Active Admin Profile</span>
            </button>
          )}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          
          {/* SECTION: Institutional Policy Restrictions (New Admission & Fee Deposit) */}
          {(activeCategory === 'all' || activeCategory === 'restrictions') && (
            <div className="bg-rose-50/80 border-2 border-rose-200 rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-700" />
                  <div>
                    <h3 className="font-black text-rose-950 text-sm">
                      Institutional Restrictions & Governance Locks
                    </h3>
                    <p className="text-[11px] text-rose-700">
                      Enable or disable operational restrictions for student admissions and fee collections.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-rose-200 text-rose-900 rounded-lg font-bold text-[10px] uppercase">
                  Director Authority
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Restriction 1: New Admission Lock */}
                <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Restrict New Student Admission</span>
                      <span className="text-[11px] text-slate-500">Temporarily freeze new student registrations</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAdmissionLocked || false}
                        onChange={(e) => handleChange('isAdmissionLocked', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>

                  {formData.isAdmissionLocked && (
                    <div className="pt-2 border-t border-rose-100">
                      <label className="block text-slate-700 font-bold mb-1">
                        Admission Freeze Reason / Directive
                      </label>
                      <input
                        type="text"
                        value={formData.admissionLockReason || ''}
                        onChange={(e) => handleChange('admissionLockReason', e.target.value)}
                        placeholder="e.g. Session Batch Capacity Reached (Director Order #BA-2026-DIR-08)"
                        className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>

                {/* Restriction 2: Fee Deposit Lock */}
                <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Restrict Fee Deposit Collections</span>
                      <span className="text-[11px] text-slate-500">Lock cashier fee payments & new receipts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeeDepositLocked || false}
                        onChange={(e) => handleChange('isFeeDepositLocked', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>

                  {formData.isFeeDepositLocked && (
                    <div className="pt-2 border-t border-rose-100">
                      <label className="block text-slate-700 font-bold mb-1">
                        Fee Deposit Freeze Reason / Audit Window
                      </label>
                      <input
                        type="text"
                        value={formData.feeDepositLockReason || ''}
                        onChange={(e) => handleChange('feeDepositLockReason', e.target.value)}
                        placeholder="e.g. Annual CA Financial Audit in Progress — Treasury Locked until Monday"
                        className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* SECTION: Disbursements & Profit Reserve Settings */}
          {(activeCategory === 'all' || activeCategory === 'treasury') && (
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-700" />
                  <div>
                    <h3 className="font-black text-indigo-950 text-sm">
                      Treasury Disbursement Budget & Minimum Profit Reserves
                    </h3>
                    <p className="text-[11px] text-indigo-700">
                      Set institutional budget caps and minimum profit headroom for ledger disbursements.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-200 text-indigo-900 rounded-lg font-bold text-[10px] uppercase">
                  P&L Parameters
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-indigo-200">
                  <label className="block text-slate-700 font-bold mb-1">
                    Monthly Disbursement Budget Cap (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={formData.monthlyDisbursementBudgetCap || 350000}
                    onChange={(e) => handleChange('monthlyDisbursementBudgetCap', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Alert threshold when cumulative monthly disbursements across ledgers exceed this value.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-indigo-200">
                  <label className="block text-slate-700 font-bold mb-1">
                    Minimum Target Profit Reserve (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={formData.minimumProfitReserveTarget || 100000}
                    onChange={(e) => handleChange('minimumProfitReserveTarget', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Guaranteed profit buffer that must remain protected before approving non-essential asset purchases.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Active Admin Profile Section */}
          {(activeCategory === 'all' || activeCategory === 'profile') && currentAdmin && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Active Staff Session Authorization ({currentAdmin.role})
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded font-bold text-[10px]">
                  Logged-in User
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Authorized Staff Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. Birendra Nath Biley"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Official Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    placeholder="e.g. Director & Founder"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Official Institutional Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. director@bileyacademy.edu"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Accounts & Fee Receipt Signatories */}
          {(activeCategory === 'all' || activeCategory === 'accounts') && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Fee Receipts & Accounts Authorization
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                  Receipts & Dues
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Authorized Accounts Signatory Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountsSignatoryName}
                    onChange={(e) => handleChange('accountsSignatoryName', e.target.value)}
                    placeholder="e.g. S. Mukherjee"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Printed on student fee deposit receipts.</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Signatory Designation / Line 1 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountsSignatoryDesignation}
                    onChange={(e) => handleChange('accountsSignatoryDesignation', e.target.value)}
                    placeholder="e.g. Authorized Accounts Signatory / Chief Accounts Officer"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Title displayed beneath the signature line.</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Treasury / Department Subtext
                  </label>
                  <input
                    type="text"
                    value={formData.accountsAuthoritySubtext}
                    onChange={(e) => handleChange('accountsAuthoritySubtext', e.target.value)}
                    placeholder="e.g. Biley Academy Treasury"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Default Fee Collector Tag
                  </label>
                  <input
                    type="text"
                    value={formData.defaultCollectedBy}
                    onChange={(e) => handleChange('defaultCollectedBy', e.target.value)}
                    placeholder="e.g. Accounts Dept - S. Mukherjee"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Academic Evaluation & Report Cards */}
          {(activeCategory === 'all' || activeCategory === 'academic') && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-700" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Academic Director & Report Card Signatories
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                  Report Cards & Transcripts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Academic Director / Board Authority Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.directorName}
                    onChange={(e) => handleChange('directorName', e.target.value)}
                    placeholder="e.g. Dr. Birendra Nath Biley"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Primary authority signature on term report cards.</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Director Designation & Subtext
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.directorDesignation}
                      onChange={(e) => handleChange('directorDesignation', e.target.value)}
                      placeholder="e.g. Academic Director"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={formData.directorAuthoritySubtext}
                      onChange={(e) => handleChange('directorAuthoritySubtext', e.target.value)}
                      placeholder="e.g. Biley Academy Board"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Class Mentor / Faculty Signatory Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.classMentorDefaultName}
                    onChange={(e) => handleChange('classMentorDefaultName', e.target.value)}
                    placeholder="e.g. Prof. Ananya Sen"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Class Mentor Designation
                  </label>
                  <input
                    type="text"
                    value={formData.classMentorDefaultDesignation}
                    onChange={(e) => handleChange('classMentorDefaultDesignation', e.target.value)}
                    placeholder="e.g. Class Mentor / Faculty In-Charge"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Question Bank, Examination Papers & DPPs */}
          {(activeCategory === 'all' || activeCategory === 'exams') && (
            <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-purple-700" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Question Papers, DPPs & Examination Cell Authorization
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                  PDF Question Sets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Controller of Examinations Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.examControllerName}
                    onChange={(e) => handleChange('examControllerName', e.target.value)}
                    placeholder="e.g. Dr. Debabrata Roy"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Controller Designation
                  </label>
                  <input
                    type="text"
                    value={formData.examControllerDesignation}
                    onChange={(e) => handleChange('examControllerDesignation', e.target.value)}
                    placeholder="e.g. Controller of Examinations"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Prepared By Faculty Name
                  </label>
                  <input
                    type="text"
                    value={formData.preparedByFacultyName}
                    onChange={(e) => handleChange('preparedByFacultyName', e.target.value)}
                    placeholder="e.g. Dr. Anirban Mukherjee"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Faculty Designation
                  </label>
                  <input
                    type="text"
                    value={formData.preparedByDesignation}
                    onChange={(e) => handleChange('preparedByDesignation', e.target.value)}
                    placeholder="e.g. Senior Faculty Specialist"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Stamp & Seal Text */}
          {(activeCategory === 'all' || activeCategory === 'accounts' || activeCategory === 'academic') && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-slate-700" />
                <h3 className="font-black text-slate-900 text-sm">
                  Official Stamp & Verification Seal Customization
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Institution Seal Header Text
                  </label>
                  <input
                    type="text"
                    value={formData.sealInstitutionName}
                    onChange={(e) => handleChange('sealInstitutionName', e.target.value)}
                    placeholder="e.g. BILEY ACADEMY"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Seal Verification Text
                  </label>
                  <input
                    type="text"
                    value={formData.sealVerificationText}
                    onChange={(e) => handleChange('sealVerificationText', e.target.value)}
                    placeholder="e.g. AUTHORIZED & VERIFIED"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              {/* Live Seal & Signature Preview */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider">
                  Live Official Stamp & Signature Preview
                </p>
                <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  {/* Seal */}
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-700/70 flex flex-col items-center justify-center p-1 text-center rotate-[-6deg] select-none">
                    <span className="text-[7px] font-bold text-emerald-800 uppercase tracking-tight">
                      {formData.sealInstitutionName || 'BILEY ACADEMY'}
                    </span>
                    <span className="text-[9px] font-black text-emerald-950 tracking-wider">
                      {formData.sealVerificationText || 'PAID'}
                    </span>
                    <span className="text-[6px] text-emerald-700 font-mono">OFFICIAL SEAL</span>
                  </div>

                  {/* Accounts Signatory */}
                  <div className="text-center sm:text-right">
                    <div className="w-36 border-b border-slate-400 mb-1 mx-auto sm:ml-auto sm:mr-0"></div>
                    <p className="text-xs font-bold text-slate-900">
                      {formData.accountsSignatoryName || 'Authorized Signatory'}
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium">
                      {formData.accountsSignatoryDesignation || 'Chief Accounts Officer'}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {formData.accountsAuthoritySubtext || 'Biley Academy Treasury'}
                    </p>
                  </div>

                  {/* Director Signatory */}
                  <div className="text-center sm:text-right">
                    <div className="w-36 border-b border-slate-400 mb-1 mx-auto sm:ml-auto sm:mr-0"></div>
                    <p className="text-xs font-bold text-slate-900">
                      {formData.directorName || 'Academic Director'}
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium">
                      {formData.directorDesignation || 'Academic Director'}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {formData.directorAuthoritySubtext || 'Biley Academy Board'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="save-authorization-settings-btn"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Save & Apply Authorization Names</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
