import React, { useState } from 'react';
import { Exam, ExamResult, Student, Subject, StudentSubjectScore, AdminUser } from '../../types';
import { calculateGrade, assignRanksToResults } from '../../utils/academicUtils';
import { evaluateSectionAuthorization } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import confetti from 'canvas-confetti';
import {
  Award,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart2,
  GraduationCap,
  Sparkles,
  Edit2,
  Trash2,
  X,
  FileText,
  Lock,
} from 'lucide-react';

interface ResultsViewProps {
  exams: Exam[];
  results: ExamResult[];
  students: Student[];
  subjects: Subject[];
  onAddOrUpdateResult: (result: ExamResult) => void;
  onDeleteResult: (resultId: string) => void;
  onViewReportCard: (result: ExamResult) => void;
  initialSelectedExamId?: string;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  exams,
  results,
  students,
  subjects,
  onAddOrUpdateResult,
  onDeleteResult,
  onViewReportCard,
  initialSelectedExamId,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'results');
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialSelectedExamId || exams[0]?.id || ''
  );
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);

  // Selected student for marks entry
  const [entryStudentId, setEntryStudentId] = useState<string>('');
  const [entryScores, setEntryScores] = useState<Record<string, number>>({});
  const [entryRemarks, setEntryRemarks] = useState<Record<string, string>>({});
  const [attendancePct, setAttendancePct] = useState<number>(95);
  const [overallRemarks, setOverallRemarks] = useState<string>('Very satisfactory effort and consistency.');

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const examResults = results.filter((r) => r.examId === selectedExamId);
  const rankedResults = assignRanksToResults(examResults);

  // Filter students eligible for this exam (same class and stream)
  const eligibleStudents = currentExam
    ? students.filter(
        (s) =>
          s.classLevel === currentExam.classLevel &&
          (currentExam.stream === 'General' || s.stream === currentExam.stream)
      )
    : [];

  const handleOpenMarksEntry = (existingResult?: ExamResult) => {
    if (!currentExam) return;

    if (existingResult) {
      setEditingResultId(existingResult.id);
      setEntryStudentId(existingResult.studentId);
      const scoresMap: Record<string, number> = {};
      const remarksMap: Record<string, string> = {};
      existingResult.scores.forEach((sc) => {
        scoresMap[sc.subjectId] = sc.marksObtained;
        remarksMap[sc.subjectId] = sc.remarks || '';
      });
      setEntryScores(scoresMap);
      setEntryRemarks(remarksMap);
      setAttendancePct(existingResult.attendancePercentage);
      setOverallRemarks(existingResult.overallRemarks);
    } else {
      setEditingResultId(null);
      const unsubmittedStudent = eligibleStudents.find(
        (s) => !examResults.some((r) => r.studentId === s.id)
      );
      setEntryStudentId(unsubmittedStudent ? unsubmittedStudent.id : eligibleStudents[0]?.id || '');
      
      const defaultScores: Record<string, number> = {};
      const defaultRemarks: Record<string, string> = {};
      currentExam.subjectsSchedule.forEach((sch) => {
        defaultScores[sch.subjectId] = Math.round(sch.maxMarks * 0.85);
        defaultRemarks[sch.subjectId] = 'Good understanding';
      });
      setEntryScores(defaultScores);
      setEntryRemarks(defaultRemarks);
      setAttendancePct(96);
      setOverallRemarks('Consistent focus and rigorous concept practice.');
    }
    setIsEntryModalOpen(true);
  };

  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExam || !entryStudentId) {
      alert('Please select a student for evaluation.');
      return;
    }

    let totalObtained = 0;
    let totalMax = 0;
    let hasFailedAny = false;

    const scoresList: StudentSubjectScore[] = currentExam.subjectsSchedule.map((sch) => {
      const marks = Number(entryScores[sch.subjectId] ?? Math.round(sch.maxMarks * 0.5));
      totalObtained += marks;
      totalMax += sch.maxMarks;
      if (marks < sch.passMarks) {
        hasFailedAny = true;
      }
      return {
        subjectId: sch.subjectId,
        subjectName: sch.subjectName,
        marksObtained: marks,
        maxMarks: sch.maxMarks,
        passMarks: sch.passMarks,
        remarks: entryRemarks[sch.subjectId] || 'Satisfactory',
      };
    });

    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
    const gradeInfo = calculateGrade(percentage);

    const newResult: ExamResult = {
      id: editingResultId || `RES-${currentExam.classLevel}-${Date.now().toString().slice(-4)}`,
      examId: currentExam.id,
      studentId: entryStudentId,
      classLevel: currentExam.classLevel,
      scores: scoresList,
      totalMarksObtained: totalObtained,
      totalMaxMarks: totalMax,
      percentage,
      grade: gradeInfo.grade,
      status: hasFailedAny ? 'Failed' : 'Passed',
      attendancePercentage: attendancePct,
      overallRemarks: overallRemarks || gradeInfo.remarks,
      publishedDate: new Date().toISOString().split('T')[0],
    };

    onAddOrUpdateResult(newResult);
    setIsEntryModalOpen(false);

    if (percentage >= 90) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {}
    }
  };

  // Performance Statistics for this Exam
  const totalEvaluated = rankedResults.length;
  const avgPercentage =
    totalEvaluated > 0
      ? Number(
          (
            rankedResults.reduce((acc, r) => acc + r.percentage, 0) / totalEvaluated
          ).toFixed(1)
        )
      : 0;
  const highestScorer = rankedResults[0];
  const passedCount = rankedResults.filter((r) => r.status === 'Passed').length;
  const passRate = totalEvaluated > 0 ? Math.round((passedCount / totalEvaluated) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Section Authorization Unit Status Banner */}
      <SectionAuthHeader
        currentAdmin={currentAdmin || null}
        sectionTab="results"
        onOpenAdminLogin={onOpenAdminLogin || (() => {})}
        onOpenPermissionsMatrix={onOpenPermissionsMatrix}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Results & Academic Report Cards
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Marks entry portal, automated grading calculation, cohort ranking, and printable official report cards.
          </p>
        </div>

        {/* Exam Selection Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                Class {ex.classLevel} - {ex.title}
              </option>
            ))}
          </select>

          {auth.canWrite ? (
            <button
              onClick={() => handleOpenMarksEntry()}
              id="enter-marks-btn"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Enter Marks
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold whitespace-nowrap">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Evaluation Locked</span>
            </div>
          )}
        </div>
      </div>

      {currentExam ? (
        <>
          {/* Performance Summary Metrics for this Exam */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Evaluated</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {totalEvaluated} / {eligibleStudents.length} Students
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Class {currentExam.classLevel} {currentExam.stream}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch Average</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{avgPercentage}%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Overall cohort aggregate</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highest Score (Rank 1)</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {highestScorer ? `${highestScorer.percentage}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {highestScorer
                  ? students.find((s) => s.id === highestScorer.studentId)?.name
                  : 'Pending evaluation'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passing Rate</span>
              <p className="text-2xl font-black text-purple-700 mt-1">{passRate}%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{passedCount} Passed candidates</p>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {currentExam.title} Result Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Click 'Generate Report Card' to view and print official formatted academic transcript
                </p>
              </div>
            </div>

            {rankedResults.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No marks evaluated yet for this examination. Click "Enter Marks" to start grading students.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Rank & Student</th>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4 text-center">Score / Max</th>
                      <th className="py-3 px-4 text-center">Percentage</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankedResults.map((result) => {
                      const student = students.find((s) => s.id === result.studentId);
                      const isTopRank = result.rankInClass === 1;

                      return (
                        <tr key={result.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isTopRank
                                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                #{result.rankInClass}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 text-sm block">
                                  {student?.name || 'Unknown Candidate'}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">{student?.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {student?.rollNo}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                            {result.totalMarksObtained} / {result.totalMaxMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-sm text-slate-900">
                            {result.percentage}%
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
                              {result.grade}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                result.status === 'Passed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {result.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onViewReportCard(result)}
                                id={`report-card-${result.id}`}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Official Report Card
                              </button>
                              <button
                                onClick={() => handleOpenMarksEntry(result)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                                title="Edit Evaluation"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this marks evaluation?')) {
                                    onDeleteResult(result.id);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                                title="Delete Evaluation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Marks Entry Modal */}
      {isEntryModalOpen && currentExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingResultId ? 'Edit Student Evaluation' : 'Enter Student Exam Marks'}
                </h3>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMarks} className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              
              {/* Student Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select Candidate (Class {currentExam.classLevel}) *
                </label>
                <select
                  value={entryStudentId}
                  disabled={Boolean(editingResultId)}
                  onChange={(e) => setEntryStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="">-- Choose Student --</option>
                  {eligibleStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.rollNo} - {st.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Wise Marks Inputs */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                  Paper-Wise Marks Entry (Passing Marks Check)
                </h4>

                <div className="space-y-2">
                  {currentExam.subjectsSchedule.map((paper) => {
                    const enteredMarks = entryScores[paper.subjectId] ?? 0;
                    const isPass = enteredMarks >= paper.passMarks;

                    return (
                      <div
                        key={paper.subjectId}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 text-xs block">{paper.subjectName}</span>
                          <span className="text-[10px] text-slate-500">
                            Max: {paper.maxMarks} • Pass: {paper.passMarks}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <input
                              type="number"
                              min="0"
                              max={paper.maxMarks}
                              value={entryScores[paper.subjectId] ?? ''}
                              onChange={(e) =>
                                setEntryScores({
                                  ...entryScores,
                                  [paper.subjectId]: Number(e.target.value),
                                })
                              }
                              placeholder="Marks"
                              className={`w-full px-2 py-1.5 text-center font-bold text-xs border rounded-lg focus:outline-none ${
                                isPass
                                  ? 'border-slate-300 text-slate-900'
                                  : 'border-rose-300 text-rose-700 bg-rose-50'
                              }`}
                            />
                          </div>

                          <div className="w-36">
                            <input
                              type="text"
                              placeholder="Remarks"
                              value={entryRemarks[paper.subjectId] || ''}
                              onChange={(e) =>
                                setEntryRemarks({
                                  ...entryRemarks,
                                  [paper.subjectId]: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall remarks and attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Attendance Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attendancePct}
                    onChange={(e) => setAttendancePct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mentor's Overall Feedback</label>
                  <input
                    type="text"
                    value={overallRemarks}
                    onChange={(e) => setOverallRemarks(e.target.value)}
                    placeholder="e.g. Outstanding conceptual rigor and regular practice."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  Save & Compute Report Card
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
