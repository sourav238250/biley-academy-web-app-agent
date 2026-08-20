import React, { useState, useEffect } from 'react';
import {
  AssignmentSet,
  AssignmentType,
  ClassLevel,
  CustomAssignmentQuestion,
  DifficultyLevel,
  QuestionBankItem,
  QuestionType,
  StreamType,
  Subject,
} from '../../types';
import { CLASS_LEVELS } from '../../utils/academicUtils';
import {
  X,
  FileCheck,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle2,
  Search,
  BookOpen,
  HelpCircle,
  Tag,
  Upload,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: AssignmentSet) => void;
  editingAssignment?: AssignmentSet | null;
  questionBank: QuestionBankItem[];
  subjects: Subject[];
  defaultClass?: ClassLevel;
  defaultSubjectId?: string;
  preselectedQuestionIds?: string[];
}

const ASSIGNMENT_TYPES: AssignmentType[] = [
  'Assignment',
  'Practice Question Set',
  'Daily Practice Paper (DPP)',
  'Sample Paper',
  'Homework',
];

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAssignment,
  questionBank,
  subjects,
  defaultClass = '10',
  defaultSubjectId,
  preselectedQuestionIds = [],
}) => {
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<AssignmentType>('Assignment');
  const [classLevel, setClassLevel] = useState<ClassLevel>(defaultClass);
  const [stream, setStream] = useState<StreamType>('General');
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || '');
  const [chapter, setChapter] = useState<string>('');
  const [timeAllowedMinutes, setTimeAllowedMinutes] = useState<number>(45);
  const [dueDate, setDueDate] = useState<string>('');
  const [instructions, setInstructions] = useState<string>(
    '1. Attempt all questions systematically.\n2. Write clear derivations and state formula units.\n3. Submit before the target due date.'
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'Mixed'>('Medium');
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomAssignmentQuestion[]>([]);
  const [createdBy, setCreatedBy] = useState<string>('Faculty Lead');
  const [status, setStatus] = useState<'Published' | 'Draft' | 'Archived'>('Published');

  // File upload attachment state
  const [attachmentFileName, setAttachmentFileName] = useState<string | undefined>(undefined);
  const [attachmentFileType, setAttachmentFileType] = useState<string | undefined>(undefined);
  const [attachmentData, setAttachmentData] = useState<string | undefined>(undefined);
  const [attachmentSize, setAttachmentSize] = useState<string | undefined>(undefined);

  // Bank Question Picker search state inside modal
  const [bankSearch, setBankSearch] = useState<string>('');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState<string>('ALL');

  const filteredSubjects = subjects.filter((s) => s.classLevel === classLevel);

  useEffect(() => {
    if (editingAssignment) {
      setTitle(editingAssignment.title);
      setType(editingAssignment.type);
      setClassLevel(editingAssignment.classLevel);
      setStream(editingAssignment.stream);
      setSubjectId(editingAssignment.subjectId);
      setChapter(editingAssignment.chapter);
      setTimeAllowedMinutes(editingAssignment.timeAllowedMinutes || 45);
      setDueDate(editingAssignment.dueDate || '');
      setInstructions(editingAssignment.instructions || '');
      setDifficulty(editingAssignment.difficulty || 'Medium');
      setTopicTags(editingAssignment.topicTags || []);
      setSelectedQuestionIds(editingAssignment.questionIds || []);
      setCustomQuestions(editingAssignment.customQuestions || []);
      setCreatedBy(editingAssignment.createdBy || 'Faculty Lead');
      setStatus(editingAssignment.status || 'Published');
      setAttachmentFileName(editingAssignment.attachmentFileName);
      setAttachmentFileType(editingAssignment.attachmentFileType);
      setAttachmentData(editingAssignment.attachmentData);
      setAttachmentSize(editingAssignment.attachmentSize);
    } else {
      setTitle('');
      setType('Assignment');
      setClassLevel(defaultClass);
      const sub = filteredSubjects[0];
      setSubjectId(defaultSubjectId || (sub ? sub.id : ''));
      setChapter('');
      setTimeAllowedMinutes(45);
      // default due date: 7 days from now
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().slice(0, 10));
      setInstructions(
        '1. Attempt all questions systematically.\n2. Write clear derivations and state formula units.\n3. Submit before the target due date.'
      );
      setDifficulty('Medium');
      setTopicTags([]);
      setSelectedQuestionIds(preselectedQuestionIds || []);
      setCustomQuestions([]);
      setCreatedBy('Academic Faculty Lead');
      setStatus('Published');
      setAttachmentFileName(undefined);
      setAttachmentFileType(undefined);
      setAttachmentData(undefined);
      setAttachmentSize(undefined);
    }
  }, [editingAssignment, isOpen, defaultClass, defaultSubjectId, preselectedQuestionIds]);

  // Questions matching this class and subject in the Question Bank
  const availableBankQuestions = questionBank.filter((q) => {
    if (q.classLevel !== classLevel) return false;
    if (subjectId && q.subjectId !== subjectId) return false;
    if (bankDifficultyFilter !== 'ALL' && q.difficulty !== bankDifficultyFilter) return false;
    if (bankSearch) {
      const qText = `${q.questionText} ${q.chapterName} ${q.code} ${q.topicTags.join(' ')}`.toLowerCase();
      if (!qText.includes(bankSearch.toLowerCase())) return false;
    }
    return true;
  });

  // Calculate live total marks from selected bank questions + custom questions
  const totalBankMarks = selectedQuestionIds.reduce((acc, qid) => {
    const found = questionBank.find((q) => q.id === qid);
    return acc + (found ? found.marks : 0);
  }, 0);

  const totalCustomMarks = customQuestions.reduce((acc, cq) => acc + (cq.marks || 0), 0);
  const calculatedTotalMarks = totalBankMarks + totalCustomMarks || 25;

  const handleToggleQuestionId = (qid: string) => {
    if (selectedQuestionIds.includes(qid)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qid));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qid]);
    }
  };

  const handleAddTag = () => {
    const text = tagInput.trim();
    if (text && !topicTags.includes(text)) {
      setTopicTags([...topicTags, text]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTopicTags(topicTags.filter((t) => t !== tagToRemove));
  };

  // Add Custom Question on the fly
  const handleAddCustomQuestion = () => {
    const newCustomQ: CustomAssignmentQuestion = {
      id: `CQ-${Date.now()}`,
      questionText: '',
      questionType: 'Short Answer',
      difficulty: 'Medium',
      marks: 3,
      correctAnswer: '',
      answerExplanation: '',
      topicTags: [],
    };
    setCustomQuestions([...customQuestions, newCustomQ]);
  };

  const handleUpdateCustomQuestion = (index: number, field: keyof CustomAssignmentQuestion, value: any) => {
    const updated = [...customQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setCustomQuestions(updated);
  };

  const handleRemoveCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  // File Attachment Upload Handler (Base64 file reader)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB for LocalStorage safety)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentFileName(file.name);
      setAttachmentFileType(file.type || 'application/octet-stream');
      setAttachmentData(reader.result as string);
      setAttachmentSize((file.size / 1024).toFixed(1) + ' KB');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentFileName(undefined);
    setAttachmentFileType(undefined);
    setAttachmentData(undefined);
    setAttachmentSize(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentSubject = subjects.find((s) => s.id === subjectId) || {
      id: subjectId,
      name: 'General Subject',
      stream: 'General',
    };

    const finalAssignment: AssignmentSet = {
      id: editingAssignment?.id || `ASG-${Date.now().toString().slice(-6)}`,
      title: title.trim() || `Class ${classLevel} ${currentSubject.name} - ${type}`,
      type,
      classLevel,
      stream: Number(classLevel) >= 11 ? (currentSubject.stream || stream) : 'General',
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      chapter: chapter.trim() || 'Comprehensive Curriculum',
      totalMarks: calculatedTotalMarks,
      timeAllowedMinutes: Number(timeAllowedMinutes) || 45,
      dueDate: dueDate || undefined,
      instructions: instructions.trim(),
      difficulty,
      topicTags: topicTags.length > 0 ? topicTags : ['Academic Assignment'],
      questionIds: selectedQuestionIds,
      customQuestions: customQuestions.filter((cq) => cq.questionText.trim().length > 0),
      attachmentFileName,
      attachmentFileType,
      attachmentData,
      attachmentSize,
      uploadedAt: attachmentFileName ? new Date().toISOString().slice(0, 10) : undefined,
      createdBy: createdBy.trim() || 'Faculty Lead',
      createdAt: editingAssignment?.createdAt || new Date().toISOString().slice(0, 10),
      status,
      submissionCount: editingAssignment?.submissionCount || 0,
    };

    onSave(finalAssignment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editingAssignment ? 'Edit Assignment / Question Set' : 'Create New Assignment & Question Set'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Pick questions from the Question Bank, attach documents, and configure printable test sets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-sans max-h-[80vh] overflow-y-auto">
          
          {/* Row 1: Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Assignment Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chemical Kinetics & Rate Laws Practice Drill 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Set Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssignmentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold bg-white"
              >
                {ASSIGNMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Class, Subject, Chapter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Class Level *</label>
              <select
                value={classLevel}
                onChange={(e) => {
                  const newClass = e.target.value as ClassLevel;
                  setClassLevel(newClass);
                  const subList = subjects.filter((s) => s.classLevel === newClass);
                  if (subList.length > 0) setSubjectId(subList[0].id);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold bg-white"
              >
                {CLASS_LEVELS.map((cls) => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Subject *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold bg-white"
              >
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Chapter / Unit *</label>
              <input
                type="text"
                required
                placeholder="e.g. Electrostatics, Trigonometry"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Row 3: Total Marks & Time & Due Date & Overall Difficulty */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Total Marks</label>
              <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-black text-emerald-700 text-sm flex items-center justify-between">
                <span>{calculatedTotalMarks}</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto calc</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Time (Mins)</label>
              <input
                type="number"
                min="10"
                max="240"
                step="5"
                value={timeAllowedMinutes}
                onChange={(e) => setTimeAllowedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Set Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Mixed">Mixed (All levels)</option>
              </select>
            </div>
          </div>

          {/* Topic Tags */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Topic Tags</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Press Enter to add</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Kinetics, Rate Law, Integrated Rate Equations..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-800 text-amber-300 font-bold rounded-lg cursor-pointer"
              >
                + Add
              </button>
            </div>
            {topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {topicTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-bold text-[10px]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* QUESTION BANK PICKER SECTION */}
          <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Select Questions from Question Bank ({selectedQuestionIds.length} Selected)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Showing questions for Class {classLevel} ({filteredSubjects.find((s) => s.id === subjectId)?.name || 'Subject'})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter questions..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] w-36 focus:outline-none"
                />
                <select
                  value={bankDifficultyFilter}
                  onChange={(e) => setBankDifficultyFilter(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold"
                >
                  <option value="ALL">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Bank Questions Scrollable List */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-lg p-2 bg-white">
              {availableBankQuestions.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No question bank items found matching Class {classLevel} and current filters.
                </div>
              ) : (
                availableBankQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleToggleQuestionId(q.id)}
                      className={`p-2.5 rounded-lg border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-300'
                          : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div
                        className="mt-0.5 accent-amber-600 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {q.code} • {q.chapterName}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {q.difficulty}
                            </span>
                            <span className="font-bold text-emerald-700 text-[11px]">
                              [{q.marks}M]
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">
                          {q.questionText}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CUSTOM QUESTIONS BUILDER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Custom Set-Specific Questions ({customQuestions.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddCustomQuestion}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Question</span>
              </button>
            </div>

            {customQuestions.map((cq, idx) => (
              <div key={cq.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-xs">Custom Question {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={cq.difficulty}
                      onChange={(e) => handleUpdateCustomQuestion(idx, 'difficulty', e.target.value)}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-bold"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-500">Marks:</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={cq.marks}
                        onChange={(e) => handleUpdateCustomQuestion(idx, 'marks', Number(e.target.value))}
                        className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-bold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCustomQuestion(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Enter custom question statement..."
                  value={cq.questionText}
                  onChange={(e) => handleUpdateCustomQuestion(idx, 'questionText', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />

                <input
                  type="text"
                  placeholder="Optional correct answer / solution note..."
                  value={cq.correctAnswer || ''}
                  onChange={(e) => handleUpdateCustomQuestion(idx, 'correctAnswer', e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px]"
                />
              </div>
            ))}
          </div>

          {/* FILE ATTACHMENT UPLOAD SECTION */}
          <div className="space-y-2 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/70">
            <label className="block text-blue-950 font-bold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-700" />
                <span>Upload / Store Printable Assignment Document (PDF, Word, or Image)</span>
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">Supports persistent local storage</span>
            </label>

            {attachmentFileName ? (
              <div className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 text-xs truncate">{attachmentFileName}</p>
                    <p className="text-[10px] text-slate-400">
                      {attachmentSize || 'Uploaded file'} • {attachmentFileType}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded text-xs font-bold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-blue-300 hover:border-blue-500 rounded-lg cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-800">
                    Click to upload PDF / Document / Scanned Worksheet
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* General Instructions */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">General Instructions (Printed on Top)</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-xs"
            />
          </div>

          {/* Faculty Author & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Prepared By</label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Publish Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
              >
                <option value="Published">Published (Available for Students)</option>
                <option value="Draft">Draft (Faculty Only)</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-assignment-modal-btn"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{editingAssignment ? 'Update Assignment Set' : 'Save & Publish Assignment'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
