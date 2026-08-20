import React, { useState } from 'react';
import { AssignmentSet, QuestionBankItem } from '../../types';
import { downloadAssignmentPDF, PDFExportOptions } from '../../utils/pdfGenerator';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  FileText,
  Settings,
  Eye,
  BookOpen,
  Tag,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentSet;
  allQuestions: QuestionBankItem[];
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  assignment,
  allQuestions,
}) => {
  const [includeAnswers, setIncludeAnswers] = useState<boolean>(false);
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(false);
  const [includeMarkingScheme, setIncludeMarkingScheme] = useState<boolean>(true);
  const [includeStudentHeader, setIncludeStudentHeader] = useState<boolean>(true);

  if (!isOpen) return null;

  const linkedQuestions = assignment.questionIds
    .map((qid) => allQuestions.find((q) => q.id === qid))
    .filter(Boolean) as QuestionBankItem[];

  const customQuestions = assignment.customQuestions || [];

  const handleDownloadPDF = () => {
    const opts: PDFExportOptions = {
      includeAnswers,
      includeExplanations,
      includeMarkingScheme,
      includeStudentHeader,
    };
    downloadAssignmentPDF(assignment, allQuestions, opts);
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Control Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Formatted PDF & Print Layout Generator
              </h3>
              <p className="text-[11px] text-slate-300">
                {assignment.title} • Class {assignment.classLevel} ({assignment.subjectName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              id="download-assignment-pdf-btn"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Formatted PDF</span>
            </button>

            <button
              onClick={handlePrintBrowser}
              id="print-assignment-btn"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Customizer Bar */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF Print Configuration:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeStudentHeader}
                onChange={(e) => setIncludeStudentHeader(e.target.checked)}
                className="accent-slate-900 rounded"
              />
              <span>Student Details Header</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeMarkingScheme}
                onChange={(e) => setIncludeMarkingScheme(e.target.checked)}
                className="accent-slate-900 rounded"
              />
              <span>Show Question Marks</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-emerald-800">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={(e) => setIncludeAnswers(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span>Append Answer Key</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-blue-800">
              <input
                type="checkbox"
                checked={includeExplanations}
                onChange={(e) => {
                  setIncludeExplanations(e.target.checked);
                  if (e.target.checked) setIncludeAnswers(true);
                }}
                className="accent-blue-600 rounded"
              />
              <span>Detailed Step Solutions</span>
            </label>
          </div>
        </div>

        {/* Printable Paper Preview (Matches Real Printed Page) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-200/60 font-sans">
          
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-8 sm:p-10 border border-slate-300 text-slate-900 text-xs space-y-6 print:p-0 print:shadow-none print:border-none print:max-w-full">
            
            {/* Academy Official Letterhead Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-lg text-center space-y-1">
              <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                BILEY ACADEMY OF ADVANCED STUDIES
              </div>
              <div className="text-xs text-slate-200 font-medium">
                Standardized Secondary & Senior Secondary Coaching Curriculum (Classes 1 to 12)
              </div>
              <div className="text-[10px] text-slate-400 italic">
                Official Examination & Curriculum Assessment Material • Academic Session 2026-27
              </div>
            </div>

            {/* Test Metadata Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-950">{assignment.title}</h2>
                <p className="text-slate-600 font-semibold text-[11px]">
                  Class: <strong className="text-slate-900 font-bold">{assignment.classLevel} ({assignment.stream})</strong> • Subject: <strong className="text-slate-900 font-bold">{assignment.subjectName}</strong> • Type: <strong className="text-slate-900 font-bold">{assignment.type}</strong>
                </p>
                <p className="text-slate-500 text-[10px]">
                  Chapter / Unit: {assignment.chapter || 'All Chapters'}
                </p>
                {assignment.topicTags && assignment.topicTags.length > 0 && (
                  <p className="text-blue-700 text-[10px] font-bold">
                    Topics: {assignment.topicTags.join(' • ')}
                  </p>
                )}
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 space-y-1 shrink-0">
                <div className="text-sm font-black text-slate-900">
                  Max Marks: <span className="text-emerald-700">{assignment.totalMarks}</span>
                </div>
                {assignment.timeAllowedMinutes && (
                  <div className="text-slate-600 text-[11px]">
                    Time: <strong>{assignment.timeAllowedMinutes} Mins</strong>
                  </div>
                )}
                {assignment.dueDate && (
                  <div className="text-slate-500 text-[10px]">
                    Due Date: {assignment.dueDate}
                  </div>
                )}
                <div className="text-[10px] text-slate-400">
                  Difficulty: <strong>{assignment.difficulty}</strong>
                </div>
              </div>
            </div>

            {/* Student Info Blanks (if enabled) */}
            {includeStudentHeader && (
              <div className="p-3 border border-dashed border-slate-300 rounded-lg flex flex-wrap items-center justify-between gap-4 font-semibold text-slate-700 text-[11px]">
                <div>Student Name: _____________________________________</div>
                <div>Roll No: ________________</div>
                <div>Date: _________</div>
                <div>Score: ____ / {assignment.totalMarks}</div>
              </div>
            )}

            {/* General Instructions */}
            {assignment.instructions && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  General Instructions:
                </div>
                <div className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed">
                  {assignment.instructions}
                </div>
              </div>
            )}

            <div className="border-t-2 border-slate-900 pt-4 space-y-5">
              
              {/* Linked Bank Questions */}
              {linkedQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-2 pb-4 border-b border-slate-100 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-slate-950 text-sm">Q{idx + 1}.</span>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold mb-0.5">
                          [{q.questionType} • {q.difficulty}{q.topicTags?.length ? ` • ${q.topicTags.join(', ')}` : ''}]
                        </div>
                        <p className="text-slate-900 font-medium text-xs sm:text-[13px] leading-relaxed">
                          {q.questionText}
                        </p>
                      </div>
                    </div>

                    {includeMarkingScheme && (
                      <span className="text-xs font-bold text-emerald-700 shrink-0">
                        [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                      </span>
                    )}
                  </div>

                  {/* MCQ Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Answer Key (if enabled) */}
                  {includeAnswers && q.correctAnswer && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900">
                      <strong>Answer:</strong> {q.correctAnswer}
                    </div>
                  )}
                </div>
              ))}

              {/* Custom Questions */}
              {customQuestions.map((cq, idx) => (
                <div key={cq.id} className="space-y-2 pb-4 border-b border-slate-100 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-slate-950 text-sm">
                        Q{linkedQuestions.length + idx + 1}.
                      </span>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold mb-0.5">
                          [{cq.questionType} • {cq.difficulty}]
                        </div>
                        <p className="text-slate-900 font-medium text-xs sm:text-[13px] leading-relaxed">
                          {cq.questionText}
                        </p>
                      </div>
                    </div>

                    {includeMarkingScheme && (
                      <span className="text-xs font-bold text-emerald-700 shrink-0">
                        [{cq.marks} Mark{cq.marks > 1 ? 's' : ''}]
                      </span>
                    )}
                  </div>

                  {includeAnswers && cq.correctAnswer && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900">
                      <strong>Answer:</strong> {cq.correctAnswer}
                    </div>
                  )}
                </div>
              ))}

            </div>

            {/* Answer Key & Explanations Section at the Bottom */}
            {(includeAnswers || includeExplanations) && (
              <div className="pt-6 border-t-2 border-dashed border-slate-300 space-y-4">
                <div className="p-3 bg-slate-900 text-amber-300 rounded-lg text-center font-black text-xs uppercase tracking-wider">
                  Official Solutions & Step-by-Step Model Answers
                </div>

                <div className="space-y-4">
                  {linkedQuestions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>Solution Q{idx + 1} ({q.questionType})</span>
                        {q.correctAnswer && (
                          <span className="text-emerald-700 text-[11px]">Key: {q.correctAnswer}</span>
                        )}
                      </div>
                      {q.answerExplanation ? (
                        <p className="text-slate-700 whitespace-pre-line text-[11px] leading-relaxed">
                          {q.answerExplanation}
                        </p>
                      ) : (
                        <p className="text-slate-400 italic text-[10px]">Direct answer without step notes.</p>
                      )}
                    </div>
                  ))}

                  {customQuestions.map((cq, idx) => (
                    <div key={cq.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>Solution Q{linkedQuestions.length + idx + 1}</span>
                        {cq.correctAnswer && (
                          <span className="text-emerald-700 text-[11px]">Key: {cq.correctAnswer}</span>
                        )}
                      </div>
                      {cq.answerExplanation && (
                        <p className="text-slate-700 whitespace-pre-line text-[11px] leading-relaxed">
                          {cq.answerExplanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-slate-400 text-[10px] pt-6 border-t border-slate-200">
              Generated via Biley Academy Question Bank & Assessment Engine • All Rights Reserved
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-300">
            Total <strong>{linkedQuestions.length + customQuestions.length} Questions</strong> • <strong>{assignment.totalMarks} Marks</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Formatted PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
