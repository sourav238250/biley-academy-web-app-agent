import React, { useState } from 'react';
import { Exam, Subject, ClassLevel, StreamType, ExamType, AdminUser } from '../../types';
import { CLASS_LEVELS, STREAMS_FOR_CLASS } from '../../utils/academicUtils';
import { evaluateSectionAuthorization, hasPermission } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import {
  FileCheck2,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Award,
  Layers,
  Edit2,
  Trash2,
  X,
  FileText,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface ExamsViewProps {
  exams: Exam[];
  subjects: Subject[];
  onAddExam: (exam: Exam) => void;
  onUpdateExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onNavigateToResults: (examId: string) => void;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  subjects,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onNavigateToResults,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'exams');
  const canManageExams = auth.canWrite && hasPermission(currentAdmin, 'EXAM_CREATE_SCHEDULE');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Exam>>({
    title: '',
    examType: 'Unit Test 1',
    classLevel: '10',
    stream: 'General',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    academicYear: '2025-2026',
    status: 'Upcoming',
    subjectsSchedule: [],
  });

  const handleOpenAdd = () => {
    setEditingExam(null);
    const defaultClassSubs = subjects.filter((s) => s.classLevel === '10' && s.stream === 'General');
    const defaultSchedule = defaultClassSubs.slice(0, 4).map((sub, i) => ({
      subjectId: sub.id,
      subjectName: sub.name,
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
      time: '10:00 AM - 01:00 PM',
      maxMarks: 80,
      passMarks: 27,
      roomNo: 'Room 201',
    }));

    setFormData({
      title: 'Class 10 Unit Test Assessment',
      examType: 'Unit Test 1',
      classLevel: '10',
      stream: 'General',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      academicYear: '2025-2026',
      status: 'Upcoming',
      subjectsSchedule: defaultSchedule,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData(exam);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please provide an exam title.');
      return;
    }

    if (editingExam) {
      const updated: Exam = {
        ...editingExam,
        ...(formData as Exam),
      };
      onUpdateExam(updated);
    } else {
      const newExam: Exam = {
        id: `EX-${new Date().getFullYear()}-${String(exams.length + 1).padStart(2, '0')}`,
        title: formData.title || '',
        examType: (formData.examType as ExamType) || 'Unit Test 1',
        classLevel: (formData.classLevel as ClassLevel) || '10',
        stream: (formData.stream as StreamType) || 'General',
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        endDate: formData.endDate || new Date().toISOString().split('T')[0],
        academicYear: formData.academicYear || '2025-2026',
        status: formData.status || 'Upcoming',
        subjectsSchedule: formData.subjectsSchedule || [],
      };
      onAddExam(newExam);
    }
    setIsAddModalOpen(false);
  };

  const filteredExams = exams.filter((ex) => {
    return selectedClassFilter === 'all' || ex.classLevel === selectedClassFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Section Authorization Unit Status Banner */}
      <SectionAuthHeader
        currentAdmin={currentAdmin || null}
        sectionTab="exams"
        onOpenAdminLogin={onOpenAdminLogin || (() => {})}
        onOpenPermissionsMatrix={onOpenPermissionsMatrix}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-blue-600" />
            Examinations & Assessment Schedules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit tests, mock pre-boards, term assessments, max marks, passing criteria & room invigilation.
          </p>
        </div>
        
        {canManageExams ? (
          <button
            onClick={handleOpenAdd}
            id="schedule-exam-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Schedule Examination
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Scheduling Restricted</span>
          </div>
        )}
      </div>

      {/* Class Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filter Class:</span>
        <button
          onClick={() => setSelectedClassFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedClassFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Exams ({exams.length})
        </button>
        {CLASS_LEVELS.map((cls) => {
          const count = exams.filter((e) => e.classLevel === cls).length;
          return (
            <button
              key={cls}
              onClick={() => setSelectedClassFilter(cls)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedClassFilter === cls
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Class {cls} ({count})
            </button>
          );
        })}
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {filteredExams.map((exam) => {
          const isPublished = exam.status === 'Results Published';

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-slate-900 text-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Class {exam.classLevel} ({exam.stream})
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {exam.examType}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isPublished
                          ? 'bg-emerald-100 text-emerald-800'
                          : exam.status === 'Ongoing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {exam.startDate} to {exam.endDate}
                    </span>
                    <span>Session: {exam.academicYear}</span>
                  </p>
                </div>

                {/* Right side CTA actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToResults(exam.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    {isPublished ? 'View Results & Report Cards' : 'Enter / Grade Marks'}
                  </button>
                  {canManageExams && (
                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Edit Exam"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canManageExams && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete exam record ${exam.title}?`)) {
                          onDeleteExam(exam.id);
                        }
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Schedule Papers */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Scheduled Papers & Marking Scheme ({exam.subjectsSchedule.length} Subjects)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {exam.subjectsSchedule.map((paper, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{paper.subjectName}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">Paper {idx + 1}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {paper.date}
                      </p>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {paper.time}
                      </p>
                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">
                          Max: {paper.maxMarks} (Pass: {paper.passMarks})
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {paper.roomNo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Schedule / Edit Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingExam ? 'Edit Examination Schedule' : 'Schedule New Examination'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 12 Pre-Board Assessment 2026"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Exam Type</label>
                  <select
                    value={formData.examType || 'Unit Test 1'}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value as ExamType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Unit Test 1">Unit Test 1</option>
                    <option value="Mid-Term Exam">Mid-Term Exam</option>
                    <option value="Unit Test 2">Unit Test 2</option>
                    <option value="Pre-Board Exam">Pre-Board Exam</option>
                    <option value="Annual Final Exam">Annual Final Exam</option>
                    <option value="Weekly Assessment">Weekly Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Class Level *</label>
                  <select
                    value={formData.classLevel || '10'}
                    onChange={(e) => {
                      const newCls = e.target.value as ClassLevel;
                      const validStreams = STREAMS_FOR_CLASS[newCls];
                      setFormData({
                        ...formData,
                        classLevel: newCls,
                        stream: validStreams[0] as StreamType,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {CLASS_LEVELS.map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stream</label>
                  <select
                    value={formData.stream || 'General'}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value as StreamType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {STREAMS_FOR_CLASS[(formData.classLevel as ClassLevel) || '10'].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status || 'Upcoming'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Results Published">Results Published</option>
                  </select>
                </div>
              </div>

              {/* Subject Papers & Time Slots Editor */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-900 font-bold">
                    Paper Schedule & Time Slots ({formData.subjectsSchedule?.length || 0} Papers)
                  </label>
                  <span className="text-[10px] text-slate-500">Edit timings, date, marks, and room per paper</span>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {formData.subjectsSchedule?.map((paper, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{paper.subjectName}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">Paper {idx + 1}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Exam Date</label>
                          <input
                            type="date"
                            value={paper.date}
                            onChange={(e) => {
                              const updatedSched = [...(formData.subjectsSchedule || [])];
                              updatedSched[idx] = { ...updatedSched[idx], date: e.target.value };
                              setFormData({ ...formData, subjectsSchedule: updatedSched });
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Time Slot *</label>
                          <input
                            type="text"
                            value={paper.time}
                            placeholder="e.g. 10:00 AM - 01:00 PM"
                            onChange={(e) => {
                              const updatedSched = [...(formData.subjectsSchedule || [])];
                              updatedSched[idx] = { ...updatedSched[idx], time: e.target.value };
                              setFormData({ ...formData, subjectsSchedule: updatedSched });
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Max (Pass) Marks</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="10"
                              max="100"
                              value={paper.maxMarks}
                              onChange={(e) => {
                                const updatedSched = [...(formData.subjectsSchedule || [])];
                                updatedSched[idx] = { ...updatedSched[idx], maxMarks: Number(e.target.value) };
                                setFormData({ ...formData, subjectsSchedule: updatedSched });
                              }}
                              className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                              placeholder="Max"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={paper.passMarks}
                              onChange={(e) => {
                                const updatedSched = [...(formData.subjectsSchedule || [])];
                                updatedSched[idx] = { ...updatedSched[idx], passMarks: Number(e.target.value) };
                                setFormData({ ...formData, subjectsSchedule: updatedSched });
                              }}
                              className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                              placeholder="Pass"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Room / Hall</label>
                          <input
                            type="text"
                            value={paper.roomNo}
                            placeholder="Hall A"
                            onChange={(e) => {
                              const updatedSched = [...(formData.subjectsSchedule || [])];
                              updatedSched[idx] = { ...updatedSched[idx], roomNo: e.target.value };
                              setFormData({ ...formData, subjectsSchedule: updatedSched });
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  {editingExam ? 'Save Changes' : 'Create Examination'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
