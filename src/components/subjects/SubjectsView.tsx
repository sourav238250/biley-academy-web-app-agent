import React, { useState } from 'react';
import { Subject, Faculty, ClassLevel, StreamType, AdminUser } from '../../types';
import { CLASS_LEVELS, STREAMS_FOR_CLASS, STANDARD_SUBJECT_NAMES, STANDARD_SUBJECT_CODES, StandardSubjectName } from '../../utils/academicUtils';
import { evaluateSectionAuthorization } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  User,
  Clock,
  CheckCircle,
  Layers,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';

interface SubjectsViewProps {
  subjects: Subject[];
  faculty: Faculty[];
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  faculty,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'subjects');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState<Partial<Subject>>({
    name: '',
    code: '',
    classLevel: '10',
    stream: 'General',
    weeklyHours: 4,
    facultyId: '',
    totalChapters: 12,
    completedChapters: 6,
    textbook: '',
    description: '',
  });

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      classLevel: '10',
      stream: 'General',
      weeklyHours: 4,
      facultyId: faculty[0]?.id || '',
      totalChapters: 12,
      completedChapters: 6,
      textbook: '',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData(subject);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Please provide subject name and code.');
      return;
    }

    if (editingSubject) {
      const updated: Subject = {
        ...editingSubject,
        ...(formData as Subject),
      };
      onUpdateSubject(updated);
    } else {
      const newSubject: Subject = {
        id: `SUB-${formData.classLevel}-${formData.code?.toUpperCase().replace(/\s+/g, '')}`,
        code: formData.code || '',
        name: formData.name || '',
        classLevel: (formData.classLevel as ClassLevel) || '10',
        stream: (formData.stream as StreamType) || 'General',
        weeklyHours: Number(formData.weeklyHours) || 3,
        facultyId: formData.facultyId,
        totalChapters: Number(formData.totalChapters) || 10,
        completedChapters: Number(formData.completedChapters) || 0,
        textbook: formData.textbook,
        description: formData.description,
      };
      onAddSubject(newSubject);
    }
    setIsAddModalOpen(false);
  };

  const filteredSubjects = subjects.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.textbook && sub.textbook.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = selectedClass === 'all' || sub.classLevel === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Calculate total weekly hours across curriculum
  const totalWeeklyHours = subjects.reduce((sum, s) => sum + s.weeklyHours, 0);

  return (
    <div className="space-y-6">
      
      {/* Section Authorization Unit Status Banner */}
      <SectionAuthHeader
        currentAdmin={currentAdmin || null}
        sectionTab="subjects"
        onOpenAdminLogin={onOpenAdminLogin || (() => {})}
        onOpenPermissionsMatrix={onOpenPermissionsMatrix}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Subject Distribution & Curriculum Mapping
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Class 1 to 12 academic subject allocation, syllabus modules, weekly periods, and assigned mentors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 font-semibold px-3 py-2 rounded-xl border border-emerald-200">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>{totalWeeklyHours} Total Teaching Hours/Wk</span>
          </div>
          
          {auth.canWrite ? (
            <button
              onClick={handleOpenAdd}
              id="add-subject-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Add Subject
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Curriculum Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Class Level Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Class selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <button
              onClick={() => setSelectedClass('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedClass === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Classes ({subjects.length})
            </button>
            {CLASS_LEVELS.map((cls) => {
              const count = subjects.filter((s) => s.classLevel === cls).length;
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedClass === cls
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Class {cls} ({count})
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subject or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredSubjects.map((sub) => {
          const assignedTeacher = faculty.find((f) => f.id === sub.facultyId);
          const progressPercent = sub.totalChapters
            ? Math.round(((sub.completedChapters || 0) / sub.totalChapters) * 100)
            : 0;

          return (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        Class {sub.classLevel}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {sub.stream}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{sub.name}</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                    {sub.code}
                  </span>
                </div>

                {/* Faculty Assigned */}
                <div className="my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-xs">
                      {assignedTeacher ? assignedTeacher.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Lead Mentor</p>
                      <p className="font-bold text-slate-800 truncate max-w-[140px]">
                        {assignedTeacher ? assignedTeacher.name : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {sub.weeklyHours} hrs/wk
                    </span>
                  </div>
                </div>

                {/* Syllabus Progress */}
                {sub.totalChapters ? (
                  <div className="space-y-1.5 my-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Syllabus Covered</span>
                      <span className="font-bold text-slate-800">
                        {sub.completedChapters} / {sub.totalChapters} Chapters ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progressPercent >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                ) : null}

                {/* Textbook Ref */}
                {sub.textbook && (
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                    <strong className="text-slate-700">Course Book:</strong> {sub.textbook}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-slate-400">{sub.id}</span>
                {auth.canWrite && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${sub.name} from curriculum?`)) {
                          onDeleteSubject(sub.id);
                        }
                      }}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingSubject ? 'Edit Subject Details' : 'Add New Curriculum Subject'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Standard Subject *</label>
                  <span className="text-[10px] text-slate-400 font-medium">Classes 1 to 12</span>
                </div>
                <select
                  value={formData.name || ''}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const code = STANDARD_SUBJECT_CODES[selected as StandardSubjectName] || '';
                    const classPadded = String(formData.classLevel || '10').padStart(2, '0');
                    setFormData({
                      ...formData,
                      name: selected,
                      code: code ? `${code}-${classPadded}` : formData.code,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium text-slate-900"
                >
                  <option value="">-- Choose Standard Subject --</option>
                  {STANDARD_SUBJECT_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject Name / Custom Specialization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PHY-12"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase font-mono"
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stream Track</label>
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

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Weekly Teaching Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formData.weeklyHours || 4}
                    onChange={(e) => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Faculty Mentor</label>
                <select
                  value={formData.facultyId || ''}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="">-- Select Faculty --</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.qualification})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Chapters</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={formData.totalChapters || 12}
                    onChange={(e) => setFormData({ ...formData, totalChapters: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Completed Chapters</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalChapters || 40}
                    value={formData.completedChapters || 0}
                    onChange={(e) => setFormData({ ...formData, completedChapters: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Recommended Course Textbook</label>
                <input
                  type="text"
                  placeholder="e.g. NCERT, RD Sharma, HC Verma"
                  value={formData.textbook || ''}
                  onChange={(e) => setFormData({ ...formData, textbook: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
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
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
