import React, { useState, useMemo } from 'react';
import {
  AssignmentSet,
  ClassLevel,
  DifficultyLevel,
  Faculty,
  QuestionBankItem,
  QuestionType,
  Subject,
  AdminUser,
} from '../../types';
import { CLASS_LEVELS } from '../../utils/academicUtils';
import { evaluateSectionAuthorization, hasPermission } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import { QuestionModal } from './QuestionModal';
import { AssignmentModal } from './AssignmentModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { generateQuestionBankPDF } from '../../utils/pdfGenerator';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Tag,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Paperclip,
  Trash2,
  Edit,
  Share2,
  FileText,
  Sparkles,
  Layers,
  Award,
  Calendar,
  Clock,
  User,
  SlidersHorizontal,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface QuestionBankViewProps {
  questionBank: QuestionBankItem[];
  assignments: AssignmentSet[];
  subjects: Subject[];
  faculty: Faculty[];
  onSaveQuestion: (question: QuestionBankItem) => void;
  onDeleteQuestion: (questionId: string) => void;
  onSaveAssignment: (assignment: AssignmentSet) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  userRole?: 'ADMIN' | 'FACULTY' | 'STUDENT';
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
}

type ActiveSubTab = 'questions' | 'assignments';

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questionBank,
  assignments,
  subjects,
  faculty,
  onSaveQuestion,
  onDeleteQuestion,
  onSaveAssignment,
  onDeleteAssignment,
  userRole = 'ADMIN',
  currentAdmin = null,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  // Authorization evaluation
  const auth = evaluateSectionAuthorization(currentAdmin, 'question-bank');
  const canManageBank = auth.canWrite && hasPermission(currentAdmin, 'QUESTION_BANK_MANAGE');
  const canCreateAssignments = auth.canWrite && hasPermission(currentAdmin, 'ASSIGNMENT_CREATE');

  // Navigation & Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('questions');

  // Filters State
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('ALL');
  const [selectedTopicTag, setSelectedTopicTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Selection for quick Assignment generation
  const [selectedQuestionIdsForSet, setSelectedQuestionIdsForSet] = useState<string[]>([]);

  // Expanded cards state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  // Modals state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentSet | null>(null);

  const [printModalAssignment, setPrintModalAssignment] = useState<AssignmentSet | null>(null);

  // Extract all unique topic tags across the entire question bank for filtering
  const allUniqueTopicTags = useMemo(() => {
    const tags = new Set<string>();
    questionBank.forEach((q) => {
      if (q.topicTags) {
        q.topicTags.forEach((t) => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [questionBank]);

  // Unique subjects relevant to current class filter
  const relevantSubjects = useMemo(() => {
    if (selectedClass === 'ALL') {
      // Return distinct subject names
      const seen = new Set<string>();
      return subjects.filter((s) => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      });
    }
    return subjects.filter((s) => s.classLevel === selectedClass);
  }, [subjects, selectedClass]);

  // Filtered Questions list
  const filteredQuestions = useMemo(() => {
    return questionBank.filter((q) => {
      if (selectedClass !== 'ALL' && q.classLevel !== selectedClass) return false;
      if (selectedSubjectId !== 'ALL' && q.subjectId !== selectedSubjectId && q.subjectName !== selectedSubjectId) return false;
      if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) return false;
      if (selectedQuestionType !== 'ALL' && q.questionType !== selectedQuestionType) return false;
      if (selectedTopicTag !== 'ALL' && (!q.topicTags || !q.topicTags.includes(selectedTopicTag))) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullText = `${q.questionText} ${q.chapterName} ${q.code} ${q.subjectName} ${(q.topicTags || []).join(' ')} ${q.answerExplanation || ''} ${q.correctAnswer || ''}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      return true;
    });
  }, [questionBank, selectedClass, selectedSubjectId, selectedDifficulty, selectedQuestionType, selectedTopicTag, searchQuery]);

  // Filtered Assignments list
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (selectedClass !== 'ALL' && a.classLevel !== selectedClass) return false;
      if (selectedSubjectId !== 'ALL' && a.subjectId !== selectedSubjectId && a.subjectName !== selectedSubjectId) return false;
      if (selectedDifficulty !== 'ALL' && a.difficulty !== selectedDifficulty) return false;
      if (selectedTopicTag !== 'ALL' && (!a.topicTags || !a.topicTags.includes(selectedTopicTag))) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullText = `${a.title} ${a.chapter} ${a.subjectName} ${a.type} ${(a.topicTags || []).join(' ')} ${a.instructions}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      return true;
    });
  }, [assignments, selectedClass, selectedSubjectId, selectedDifficulty, selectedTopicTag, searchQuery]);

  // KPI calculations
  const totalQuestionsCount = questionBank.length;
  const easyQuestionsCount = questionBank.filter((q) => q.difficulty === 'Easy').length;
  const mediumQuestionsCount = questionBank.filter((q) => q.difficulty === 'Medium').length;
  const hardQuestionsCount = questionBank.filter((q) => q.difficulty === 'Hard').length;
  const totalAssignmentsCount = assignments.length;

  const handleOpenNewQuestionModal = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestionModal = (q: QuestionBankItem) => {
    setEditingQuestion(q);
    setIsQuestionModalOpen(true);
  };

  const handleOpenNewAssignmentModal = (preselectedIds: string[] = []) => {
    setEditingAssignment(null);
    setSelectedQuestionIdsForSet(preselectedIds);
    setIsAssignmentModalOpen(true);
  };

  const handleOpenEditAssignmentModal = (a: AssignmentSet) => {
    setEditingAssignment(a);
    setIsAssignmentModalOpen(true);
  };

  const handleToggleQuestionSelection = (id: string) => {
    if (selectedQuestionIdsForSet.includes(id)) {
      setSelectedQuestionIdsForSet(selectedQuestionIdsForSet.filter((qId) => qId !== id));
    } else {
      setSelectedQuestionIdsForSet([...selectedQuestionIdsForSet, id]);
    }
  };

  const handleSelectAllFilteredQuestions = () => {
    if (selectedQuestionIdsForSet.length === filteredQuestions.length) {
      setSelectedQuestionIdsForSet([]);
    } else {
      setSelectedQuestionIdsForSet(filteredQuestions.map((q) => q.id));
    }
  };

  const handleExportQuestionBankPDF = () => {
    const filterDesc = `Class: ${selectedClass}, Subject: ${selectedSubjectId === 'ALL' ? 'All' : selectedSubjectId}, Difficulty: ${selectedDifficulty}`;
    const doc = generateQuestionBankPDF(filteredQuestions, filterDesc, { includeAnswers: true });
    doc.save(`Biley_Academy_Question_Bank_Compilation_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const clearAllFilters = () => {
    setSelectedClass('ALL');
    setSelectedSubjectId('ALL');
    setSelectedDifficulty('ALL');
    setSelectedQuestionType('ALL');
    setSelectedTopicTag('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedClass !== 'ALL' ||
    selectedSubjectId !== 'ALL' ||
    selectedDifficulty !== 'ALL' ||
    selectedQuestionType !== 'ALL' ||
    selectedTopicTag !== 'ALL' ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      
      {/* Institutional Authorization Header */}
      <SectionAuthHeader
        auth={auth}
        currentAdmin={currentAdmin}
        onOpenAdminLogin={onOpenAdminLogin || (() => {})}
        onOpenPermissionsMatrix={onOpenPermissionsMatrix || (() => {})}
      />

      {/* Top Banner & KPI Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Main Branding Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full font-bold text-[10px] tracking-wider uppercase">
                Academic Repository
              </span>
              <span className="text-slate-400 text-xs">• Classes 1 to 12</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Question Bank & Assignment System
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              Curate categorized question-answer banks with difficulty levels, topic tags, and model solutions. Generate formatted PDF assignment sets and practice papers ready for printing.
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5">
            {canManageBank ? (
              <button
                onClick={handleOpenNewQuestionModal}
                id="add-question-btn"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question to Bank</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-400 text-xs rounded-xl flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Question Authoring Restricted</span>
              </div>
            )}

            {canCreateAssignments ? (
              <button
                onClick={() => handleOpenNewAssignmentModal([])}
                id="create-assignment-btn"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Create Assignment Set</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-400 text-xs rounded-xl flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Assignment Creation Restricted</span>
              </div>
            )}

            <button
              onClick={handleExportQuestionBankPDF}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Bank PDF</span>
            </button>
          </div>
        </div>

        {/* KPI: Difficulty Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Question Bank Volume</span>
              </span>
              <span className="text-slate-900 font-extrabold text-sm">{totalQuestionsCount}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Easy Level
                </span>
                <span className="font-bold text-slate-700">
                  {easyQuestionsCount} ({totalQuestionsCount > 0 ? Math.round((easyQuestionsCount / totalQuestionsCount) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-amber-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Medium Level
                </span>
                <span className="font-bold text-slate-700">
                  {mediumQuestionsCount} ({totalQuestionsCount > 0 ? Math.round((mediumQuestionsCount / totalQuestionsCount) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-rose-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Hard / HOTS
                </span>
                <span className="font-bold text-slate-700">
                  {hardQuestionsCount} ({totalQuestionsCount > 0 ? Math.round((hardQuestionsCount / totalQuestionsCount) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Filter by difficulty below</span>
            <span className="text-amber-600 font-semibold">{allUniqueTopicTags.length} Unique Tags</span>
          </div>
        </div>

        {/* KPI: Assignment Sets & Printable Materials */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Assignment & DPP Sets</span>
              </span>
              <span className="text-slate-900 font-extrabold text-sm">{totalAssignmentsCount}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Ready-to-print question sets with custom student headers, time limits, instructions, and optional answer keys.
            </p>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900">PDF Generator</span>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Storage format</span>
            <span className="font-semibold text-slate-600">Local & Cloud Persistent</span>
          </div>
        </div>

      </div>

      {/* Main Sub-Tab Switcher (Questions vs Assignment Sets) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('questions')}
            id="tab-question-bank"
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'questions'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Question-Answer Bank</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-extrabold">
              {filteredQuestions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('assignments')}
            id="tab-assignment-sets"
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'assignments'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Assignment & Question Sets</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-extrabold">
              {filteredAssignments.length}
            </span>
          </button>
        </div>

        {/* Selected Questions Action Banner (if any questions selected in question bank) */}
        {selectedQuestionIdsForSet.length > 0 && activeSubTab === 'questions' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3.5 py-1.5 rounded-xl animate-fade-in">
            <span className="text-xs font-bold text-amber-900">
              {selectedQuestionIdsForSet.length} Question{selectedQuestionIdsForSet.length > 1 ? 's' : ''} Selected
            </span>
            <button
              onClick={() => handleOpenNewAssignmentModal(selectedQuestionIdsForSet)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Set from Selected</span>
            </button>
            <button
              onClick={() => setSelectedQuestionIdsForSet([])}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* FILTER & SEARCH CONTROL CONSOLE */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4">
        
        {/* Row 1: Search bar and primary dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search query */}
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text, chapter, code, topic tags, model solution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs bg-slate-50/50"
            />
          </div>

          {/* Class Level Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubjectId('ALL');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold bg-white text-slate-800"
            >
              <option value="ALL">All Classes (1 - 12)</option>
              {CLASS_LEVELS.map((cls) => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold bg-white text-slate-800 truncate"
            >
              <option value="ALL">All Subjects</option>
              {relevantSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {selectedClass === 'ALL' ? `(Cls ${s.classLevel})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* DIFFICULTY LEVEL FILTER (Explicit User Requirement) */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              id="filter-difficulty-select"
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold bg-white ${
                selectedDifficulty === 'Easy'
                  ? 'border-emerald-400 text-emerald-800'
                  : selectedDifficulty === 'Medium'
                  ? 'border-amber-400 text-amber-800'
                  : selectedDifficulty === 'Hard'
                  ? 'border-rose-400 text-rose-800'
                  : 'border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">All Difficulty Levels</option>
              <option value="Easy">Easy (Fundamental)</option>
              <option value="Medium">Medium (Standard)</option>
              <option value="Hard">Hard (Advanced / HOTS)</option>
            </select>
          </div>

        </div>

        {/* Row 2: Secondary Filters: Topic Tags & Question Types & Active Tag Chips */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Topic Tag:</span>
            </span>

            <select
              value={selectedTopicTag}
              onChange={(e) => setSelectedTopicTag(e.target.value)}
              id="filter-topic-tags-select"
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800"
            >
              <option value="ALL">All Topic Tags ({allUniqueTopicTags.length})</option>
              {allUniqueTopicTags.map((tag) => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>

            {activeSubTab === 'questions' && (
              <>
                <span className="font-bold text-slate-500 ml-2">Type:</span>
                <select
                  value={selectedQuestionType}
                  onChange={(e) => setSelectedQuestionType(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="ALL">All Question Types</option>
                  <option value="Multiple Choice (MCQ)">MCQ</option>
                  <option value="Short Answer">Short Answer</option>
                  <option value="Long Answer">Long Answer</option>
                  <option value="Numerical / Problem">Numerical / Problem</option>
                  <option value="Fill in the Blanks">Fill in Blanks</option>
                  <option value="True / False">True / False</option>
                </select>
              </>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Quick Popular Topic Tags Chips */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-md">
            <span className="text-[10px] text-slate-400 font-bold shrink-0">Popular:</span>
            {allUniqueTopicTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTopicTag(selectedTopicTag === tag ? 'ALL' : tag)}
                className={`px-2 py-0.5 text-[10px] rounded-full font-bold transition-all cursor-pointer shrink-0 ${
                  selectedTopicTag === tag
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* =========================================================================
          SUB-TAB 1: QUESTION-ANSWER BANK LIST
         ========================================================================= */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={
                    filteredQuestions.length > 0 &&
                    selectedQuestionIdsForSet.length === filteredQuestions.length
                  }
                  onChange={handleSelectAllFilteredQuestions}
                  className="accent-amber-600 rounded cursor-pointer"
                />
                <span>Select All Filtered ({filteredQuestions.length})</span>
              </label>
              <span>•</span>
              <span>Showing {filteredQuestions.length} Questions</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Difficulty Legend:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                Easy
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                Medium
              </span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                Hard
              </span>
            </div>
          </div>

          {/* Question Cards List */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Questions Found</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                No question bank entries match your selected filters (Class, Subject, Difficulty, or Topic Tags). Try clearing filters or create a new question.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-slate-900 text-amber-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const isSelected = selectedQuestionIdsForSet.includes(q.id);
                const isExpanded = expandedQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Left: Checkbox + Code + Badges */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleQuestionSelection(q.id)}
                          className="mt-1 accent-amber-600 rounded cursor-pointer shrink-0"
                        />

                        <div className="space-y-2 flex-1 min-w-0">
                          
                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {q.code}
                            </span>

                            <span className="font-bold text-xs px-2.5 py-0.5 bg-slate-900 text-white rounded-md">
                              Class {q.classLevel}
                            </span>

                            <span className="font-bold text-xs px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-md">
                              {q.subjectName}
                            </span>

                            <span className="text-slate-400 text-xs">•</span>
                            <span className="font-medium text-slate-700 text-xs truncate max-w-xs">
                              {q.chapterName}
                            </span>

                            {/* DIFFICULTY BADGE (Explicit Feature) */}
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                                q.difficulty === 'Easy'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : q.difficulty === 'Medium'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {q.difficulty}
                            </span>

                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {q.questionType}
                            </span>

                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-auto">
                              {q.marks} Mark{q.marks > 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Question Statement */}
                          <p className="text-slate-900 text-xs sm:text-sm font-medium leading-relaxed pt-1">
                            {q.questionText}
                          </p>

                          {/* MCQ Options Display if available */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* TOPIC TAGS (Explicit Feature) */}
                          {q.topicTags && q.topicTags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-2">
                              <Tag className="w-3 h-3 text-blue-500 mr-0.5" />
                              {q.topicTags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => setSelectedTopicTag(tag)}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    selectedTopicTag === tag
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Expandable Model Solution & Answer Key */}
                          {isExpanded && (
                            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in text-xs">
                              
                              {q.correctAnswer && (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                                  <span className="font-bold text-emerald-900">Official Final Key:</span>
                                  <span className="font-black text-emerald-800">{q.correctAnswer}</span>
                                </div>
                              )}

                              {q.answerExplanation ? (
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-800 block">
                                    Step-by-Step Model Solution / Faculty Notes:
                                  </span>
                                  <p className="text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                                    {q.answerExplanation}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-slate-400 italic text-[11px]">
                                  No extended solution notes attached for this item.
                                </p>
                              )}

                              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                                <span>Author: <strong>{q.authorFacultyName || 'Academic Faculty'}</strong></span>
                                <span>Source: <strong>{q.sourceOrYear || 'Biley Academy Bank'}</strong></span>
                                <span>Updated: {q.updatedAt || q.createdAt}</span>
                              </div>

                            </div>
                          )}

                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title={isExpanded ? 'Collapse Solution' : 'View Model Solution'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {canManageBank && (
                          <button
                            onClick={() => handleOpenEditQuestionModal(q)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {canManageBank && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete question ${q.code}?`)) {
                                onDeleteQuestion(q.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: ASSIGNMENTS & DPP QUESTION SETS
         ========================================================================= */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Showing {filteredAssignments.length} Assignment & DPP Sets</span>
            <button
              onClick={() => handleOpenNewAssignmentModal([])}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Assignment Set</span>
            </button>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Assignment Sets Found</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                No assignment sets match the current filter criteria. Create your first practice paper, DPP, or homework set.
              </p>
              <button
                onClick={() => handleOpenNewAssignmentModal([])}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Create Assignment Set
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((a) => {
                const linkedQuestions = a.questionIds
                  .map((qid) => questionBank.find((q) => q.id === qid))
                  .filter(Boolean) as QuestionBankItem[];
                const customQuestions = a.customQuestions || [];
                const totalQuestionsInSet = linkedQuestions.length + customQuestions.length;

                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Header & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-slate-900 text-white font-bold rounded-md text-[10px]">
                            Class {a.classLevel}
                          </span>
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold rounded-md text-[10px]">
                            {a.subjectName}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                            {a.type}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          a.difficulty === 'Easy'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : a.difficulty === 'Medium'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : a.difficulty === 'Hard'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                        }`}>
                          {a.difficulty}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {a.title}
                      </h3>

                      <p className="text-slate-500 text-xs">
                        Chapter: <strong className="text-slate-700">{a.chapter}</strong>
                      </p>

                      {/* Topic tags chips */}
                      {a.topicTags && a.topicTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {a.topicTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-blue-50/70 text-blue-700 text-[10px] font-bold rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Total Marks</span>
                        <span className="font-black text-emerald-700 text-sm">{a.totalMarks}M</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Questions</span>
                        <span className="font-bold text-slate-800 text-sm">{totalQuestionsInSet}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Time Limit</span>
                        <span className="font-bold text-slate-800 text-sm">{a.timeAllowedMinutes || 45}m</span>
                      </div>
                    </div>

                    {/* Attached File Indicator */}
                    {a.attachmentFileName && (
                      <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-bold text-blue-950 truncate text-[11px]">
                            {a.attachmentFileName}
                          </span>
                        </div>
                        {a.attachmentData ? (
                          <a
                            href={a.attachmentData}
                            download={a.attachmentFileName}
                            className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 shrink-0"
                          >
                            Download File
                          </a>
                        ) : null}
                      </div>
                    )}

                    {/* Target Due Date & Creator */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: {a.dueDate || 'Open Submission'}</span>
                      </span>
                      <span>By: {a.createdBy || 'Faculty'}</span>
                    </div>

                    {/* Action Buttons: Formatted PDF & Print & Edit */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPrintModalAssignment(a)}
                        id={`print-pdf-btn-${a.id}`}
                        className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Download PDF / Print</span>
                      </button>

                      {canCreateAssignments && (
                        <button
                          onClick={() => handleOpenEditAssignmentModal(a)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                          title="Edit Assignment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {canCreateAssignments && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete assignment set "${a.title}"?`)) {
                              onDeleteAssignment(a.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      
      {/* 1. Add / Edit Question Modal */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSave={onSaveQuestion}
        editingQuestion={editingQuestion}
        subjects={subjects}
        faculty={faculty}
        defaultClass={selectedClass !== 'ALL' ? (selectedClass as ClassLevel) : '10'}
        defaultSubjectId={selectedSubjectId !== 'ALL' ? selectedSubjectId : undefined}
      />

      {/* 2. Create / Edit Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onSave={onSaveAssignment}
        editingAssignment={editingAssignment}
        questionBank={questionBank}
        subjects={subjects}
        defaultClass={selectedClass !== 'ALL' ? (selectedClass as ClassLevel) : '10'}
        defaultSubjectId={selectedSubjectId !== 'ALL' ? selectedSubjectId : undefined}
        preselectedQuestionIds={selectedQuestionIdsForSet}
      />

      {/* 3. Formatted PDF & Print Preview Modal */}
      {printModalAssignment && (
        <PrintPreviewModal
          isOpen={!!printModalAssignment}
          onClose={() => setPrintModalAssignment(null)}
          assignment={printModalAssignment}
          allQuestions={questionBank}
        />
      )}

    </div>
  );
};
