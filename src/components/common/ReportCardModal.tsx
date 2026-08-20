import React, { useState } from 'react';
import { Exam, ExamResult, Student, InstitutionalAuthorizationConfig } from '../../types';
import { DEFAULT_AUTHORIZATION_CONFIG } from '../../utils/storage';
import {
  Printer,
  X,
  Award,
  GraduationCap,
  MapPin,
  Phone,
  CheckCircle2,
  Loader2,
  Edit3,
  Check,
} from 'lucide-react';

interface ReportCardModalProps {
  result: ExamResult | null;
  student: Student | null;
  exam: Exam | null;
  onClose: () => void;
  authConfig?: InstitutionalAuthorizationConfig;
  onUpdateAuthConfig?: (config: InstitutionalAuthorizationConfig) => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  result,
  student,
  exam,
  onClose,
  authConfig = DEFAULT_AUTHORIZATION_CONFIG,
  onUpdateAuthConfig,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditingAuth, setIsEditingAuth] = useState(false);

  // Editable signatory fields
  const [mentorName, setMentorName] = useState(
    authConfig.classMentorDefaultName || 'Prof. Ananya Sen'
  );
  const [mentorDesignation, setMentorDesignation] = useState(
    authConfig.classMentorDefaultDesignation || 'Class Mentor & Faculty In-Charge'
  );
  const [directorName, setDirectorName] = useState(
    authConfig.directorName || 'Dr. Birendra Nath Biley'
  );
  const [directorDesignation, setDirectorDesignation] = useState(
    authConfig.directorDesignation || 'Academic Director'
  );
  const [directorSubtext, setDirectorSubtext] = useState(
    authConfig.directorAuthoritySubtext || 'Biley Academy Board'
  );
  const [sealName, setSealName] = useState(
    authConfig.sealInstitutionName || 'BILEY ACADEMY'
  );

  if (!result || !student || !exam) return null;

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
        classMentorDefaultName: mentorName,
        classMentorDefaultDesignation: mentorDesignation,
        directorName,
        directorDesignation,
        directorAuthoritySubtext: directorSubtext,
        sealInstitutionName: sealName,
      });
    }
    setIsEditingAuth(false);
  };

  return (
    <div id="report-card-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div id="report-card-modal-card" className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Header Actions (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">Official Academic Performance Card</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingAuth(!isEditingAuth)}
              id="edit-report-auth-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                isEditingAuth
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Edit Mentor & Director Signatory Names"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingAuth ? 'Done Editing' : 'Edit Authorization'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              id="print-report-card-btn"
              title="Click to print or select 'Save as PDF' in the destination dropdown"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-75"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Preparing Report...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-amber-200" />
                  <span>Print / Save PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              id="close-report-card-btn"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authorization Inline Edit Toolbar */}
        {isEditingAuth && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 print:hidden animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                Customize Report Card Signatories & Authorization
              </span>
              <button
                onClick={handleSaveAuth}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Settings</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  Class Mentor Name & Title:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    placeholder="Mentor Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-md font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                  <input
                    type="text"
                    value={mentorDesignation}
                    onChange={(e) => setMentorDesignation(e.target.value)}
                    placeholder="Designation"
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  Academic Director Name & Subtext:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="Director Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-md font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                  <input
                    type="text"
                    value={directorSubtext}
                    onChange={(e) => setDirectorSubtext(e.target.value)}
                    placeholder="Board / Authority"
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printable Report Card Content */}
        <div id="printable-report-card-content" className="p-8 bg-white text-slate-800 font-sans">
          
          {/* Top Academy Banner */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center relative">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  {sealName}
                </h1>
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">
                  Academic Progress & Evaluation Report (Class 5 - 12)
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-4 mt-2">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> 42/1 Academy Avenue, Kolkata</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> +91 98301 00000</span>
              <span className="font-semibold text-slate-700">Affiliation / Session: {exam.academicYear}</span>
            </p>
            
            <div className="mt-3 inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded-full text-xs font-bold text-slate-800">
              {exam.title} ({exam.examType})
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] font-semibold">Candidate Name</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{student.name}</p>
              <p className="text-slate-600 mt-1"><span className="font-semibold">Student ID:</span> {student.id}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[10px] font-semibold">Class & Stream</p>
              <p className="font-bold text-slate-800 mt-0.5">Class {student.classLevel} - {student.stream}</p>
              <p className="text-slate-600 mt-1"><span className="font-semibold">Roll Number:</span> {student.rollNo}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[10px] font-semibold">Attendance & Batch</p>
              <p className="font-bold text-emerald-700 mt-0.5">{result.attendancePercentage}% Attendance</p>
              <p className="text-slate-600 mt-1"><span className="font-semibold">Shift:</span> {student.batch.split('(')[0]}</p>
            </div>
          </div>

          {/* Marks Table */}
          <table className="w-full text-xs text-left mb-6 border border-slate-300 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Subject / Paper</th>
                <th className="py-2.5 px-3 text-center">Max Marks</th>
                <th className="py-2.5 px-3 text-center">Pass Marks</th>
                <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                <th className="py-2.5 px-3 text-center">Percentage</th>
                <th className="py-2.5 px-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {result.scores.map((sc, i) => {
                const subPct = Math.round((sc.marksObtained / sc.maxMarks) * 100);
                const isPassed = sc.marksObtained >= sc.passMarks;
                return (
                  <tr key={sc.subjectId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{sc.subjectName}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{sc.maxMarks}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{sc.passMarks}</td>
                    <td className={`py-2.5 px-3 text-center font-bold ${isPassed ? 'text-slate-900' : 'text-rose-600'}`}>
                      {sc.marksObtained}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{subPct}%</td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{sc.remarks || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="py-3 px-3 uppercase text-[11px] text-slate-800">
                  GRAND TOTAL / AGGREGATE
                </td>
                <td className="py-3 px-3 text-center text-slate-800">{result.totalMaxMarks}</td>
                <td className="py-3 px-3 text-center text-slate-500">-</td>
                <td className="py-3 px-3 text-center text-emerald-800 text-sm">{result.totalMarksObtained}</td>
                <td className="py-3 px-3 text-center text-emerald-800 text-sm">{result.percentage}%</td>
                <td className="py-3 px-3 text-slate-800">Grade: <span className="text-amber-700 text-sm font-black">{result.grade}</span></td>
              </tr>
            </tfoot>
          </table>

          {/* Summary Metric Badges */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-800">Result Status</p>
              <p className="text-base font-black text-emerald-900 mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {result.status}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
              <p className="text-[10px] uppercase font-bold text-amber-800">Class Rank</p>
              <p className="text-base font-black text-amber-900 mt-0.5">
                {result.rankInClass ? `#${result.rankInClass}` : 'Top Rank'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <p className="text-[10px] uppercase font-bold text-blue-800">Overall Grade</p>
              <p className="text-base font-black text-blue-900 mt-0.5">{result.grade}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
              <p className="text-[10px] uppercase font-bold text-purple-800">Total Score</p>
              <p className="text-base font-black text-purple-900 mt-0.5">
                {result.totalMarksObtained} / {result.totalMaxMarks}
              </p>
            </div>
          </div>

          {/* Teacher's Overall Evaluation */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-8">
            <p className="text-[10px] uppercase font-bold text-slate-500">Academic Mentor's Remarks:</p>
            <p className="text-slate-800 italic mt-1 font-serif text-sm">
              "{result.overallRemarks}"
            </p>
          </div>

          {/* Signature & Seal Footer */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="text-xs font-bold text-slate-800">{mentorName}</p>
              <p className="text-[9px] text-slate-500">{mentorDesignation}</p>
            </div>

            <div className="w-20 h-20 rounded-full border-2 border-double border-slate-700 flex flex-col items-center justify-center p-1 text-center select-none opacity-80 rotate-3">
              <span className="text-[7px] font-bold uppercase tracking-tight text-slate-700">{sealName}</span>
              <span className="text-[9px] font-black text-slate-900">VERIFIED</span>
              <span className="text-[7px] text-slate-500 font-mono">{result.publishedDate}</span>
            </div>

            <div className="text-center">
              <div className="w-40 border-b border-slate-400 mb-1"></div>
              <p className="text-xs font-bold text-slate-800">{directorName}</p>
              <p className="text-[10px] font-semibold text-slate-700">{directorDesignation}</p>
              <p className="text-[9px] text-slate-500">{directorSubtext}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
