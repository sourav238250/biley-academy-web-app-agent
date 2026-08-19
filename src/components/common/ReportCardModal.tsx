import React, { useState } from 'react';
import { Exam, ExamResult, Student } from '../../types';
import { Printer, X, Award, GraduationCap, MapPin, Phone, CheckCircle2, Loader2 } from 'lucide-react';

interface ReportCardModalProps {
  result: ExamResult | null;
  student: Student | null;
  exam: Exam | null;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ result, student, exam, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!result || !student || !exam) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
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
          <div className="flex items-center gap-3">
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

        {/* Printable Report Card Content */}
        <div id="printable-report-card-content" className="p-8 bg-white text-slate-800 font-sans">
          
          {/* Top Academy Banner */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center relative">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">BILEY ACADEMY</h1>
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
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="text-[11px] font-bold text-slate-800">Class Mentor</p>
              <p className="text-[9px] text-slate-500">Faculty In-Charge</p>
            </div>

            <div className="w-20 h-20 rounded-full border-2 border-double border-slate-700 flex flex-col items-center justify-center p-1 text-center select-none opacity-80 rotate-3">
              <span className="text-[7px] font-bold uppercase tracking-tight text-slate-700">BILEY ACADEMY</span>
              <span className="text-[9px] font-black text-slate-900">VERIFIED</span>
              <span className="text-[7px] text-slate-500 font-mono">{result.publishedDate}</span>
            </div>

            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="text-[11px] font-bold text-slate-800">Academic Director</p>
              <p className="text-[9px] text-slate-500">Biley Academy Board</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
