import React, { useState, useEffect } from 'react';
import {
  ClassLevel,
  DifficultyLevel,
  Faculty,
  QuestionBankItem,
  QuestionType,
  StreamType,
  Subject,
} from '../../types';
import { CLASS_LEVELS } from '../../utils/academicUtils';
import {
  X,
  BookOpen,
  Tag,
  HelpCircle,
  CheckCircle2,
  ListPlus,
  Trash2,
  Sparkles,
  Award,
} from 'lucide-react';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: QuestionBankItem) => void;
  editingQuestion?: QuestionBankItem | null;
  subjects: Subject[];
  faculty: Faculty[];
  defaultClass?: ClassLevel;
  defaultSubjectId?: string;
}

const QUESTION_TYPES: QuestionType[] = [
  'Multiple Choice (MCQ)',
  'Short Answer',
  'Long Answer',
  'Numerical / Problem',
  'Fill in the Blanks',
  'True / False',
];

const DIFFICULTY_LEVELS: { level: DifficultyLevel; label: string; color: string }[] = [
  { level: 'Easy', label: 'Easy (Fundamental)', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
  { level: 'Medium', label: 'Medium (Standard)', color: 'border-amber-500 bg-amber-50 text-amber-800' },
  { level: 'Hard', label: 'Hard (Advanced / HOTS)', color: 'border-rose-500 bg-rose-50 text-rose-800' },
];

const COMMON_TAG_SUGGESTIONS = [
  'Trigonometry',
  'Calculus',
  'Algebra',
  'Coordinate Geometry',
  'Mechanics',
  'Electrostatics',
  'Optics',
  'Thermodynamics',
  'Organic Chemistry',
  'Chemical Kinetics',
  'Partnership',
  'Goodwill',
  'Macroeconomics',
  'National Income',
  'Cell Biology',
  'Genetics',
  'Computer Science',
  'Python',
  'Grammar',
  'Derivations',
  'Numericals',
  'Board PYQ',
  'Exemplar',
];

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingQuestion,
  subjects,
  faculty,
  defaultClass = '10',
  defaultSubjectId,
}) => {
  const [classLevel, setClassLevel] = useState<ClassLevel>(defaultClass);
  const [stream, setStream] = useState<StreamType>('General');
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || '');
  const [chapterName, setChapterName] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [questionType, setQuestionType] = useState<QuestionType>('Short Answer');
  const [questionText, setQuestionText] = useState<string>('');
  const [marks, setMarks] = useState<number>(3);
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['A) ', 'B) ', 'C) ', 'D) ']);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [answerExplanation, setAnswerExplanation] = useState<string>('');
  const [authorFacultyName, setAuthorFacultyName] = useState<string>('');
  const [sourceOrYear, setSourceOrYear] = useState<string>('CBSE Board Question');

  // Filter subjects for chosen class
  const filteredSubjects = subjects.filter((s) => s.classLevel === classLevel);

  useEffect(() => {
    if (editingQuestion) {
      setClassLevel(editingQuestion.classLevel);
      setStream(editingQuestion.stream);
      setSubjectId(editingQuestion.subjectId);
      setChapterName(editingQuestion.chapterName);
      setDifficulty(editingQuestion.difficulty);
      setQuestionType(editingQuestion.questionType);
      setQuestionText(editingQuestion.questionText);
      setMarks(editingQuestion.marks);
      setTopicTags(editingQuestion.topicTags || []);
      setOptions(editingQuestion.options && editingQuestion.options.length > 0 ? editingQuestion.options : ['A) ', 'B) ', 'C) ', 'D) ']);
      setCorrectAnswer(editingQuestion.correctAnswer || '');
      setAnswerExplanation(editingQuestion.answerExplanation || '');
      setAuthorFacultyName(editingQuestion.authorFacultyName || '');
      setSourceOrYear(editingQuestion.sourceOrYear || '');
    } else {
      setClassLevel(defaultClass);
      const sub = filteredSubjects[0];
      setSubjectId(defaultSubjectId || (sub ? sub.id : ''));
      setChapterName('');
      setDifficulty('Medium');
      setQuestionType('Short Answer');
      setQuestionText('');
      setMarks(3);
      setTopicTags([]);
      setTagInput('');
      setOptions(['A) ', 'B) ', 'C) ', 'D) ']);
      setCorrectAnswer('');
      setAnswerExplanation('');
      setAuthorFacultyName(faculty[0]?.name || 'Academic Faculty Lead');
      setSourceOrYear('Biley Question Bank');
    }
  }, [editingQuestion, isOpen, defaultClass, defaultSubjectId]);

  // Adjust default marks when question type changes
  const handleQuestionTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    if (type === 'Multiple Choice (MCQ)') {
      setMarks(1);
    } else if (type === 'Short Answer') {
      setMarks(3);
    } else if (type === 'Long Answer') {
      setMarks(5);
    } else if (type === 'Numerical / Problem') {
      setMarks(4);
    } else if (type === 'Fill in the Blanks' || type === 'True / False') {
      setMarks(1);
    }
  };

  const handleAddTag = (tagToAdd?: string) => {
    const text = (tagToAdd || tagInput).trim();
    if (text && !topicTags.includes(text)) {
      setTopicTags([...topicTags, text]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTopicTags(topicTags.filter((t) => t !== tagToRemove));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentSubject = subjects.find((s) => s.id === subjectId) || {
      id: subjectId,
      name: 'General Subject',
      stream: 'General',
    };

    const finalQuestion: QuestionBankItem = {
      id: editingQuestion?.id || `QB-${classLevel}-${Date.now().toString().slice(-6)}`,
      code: editingQuestion?.code || `QB-${classLevel}-${(currentSubject.name || 'SUB').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      classLevel,
      stream: Number(classLevel) >= 11 ? (currentSubject.stream || stream) : 'General',
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      chapterName: chapterName.trim() || 'General Unit',
      topicTags: topicTags.length > 0 ? topicTags : ['Core Concept'],
      difficulty,
      questionType,
      questionText: questionText.trim(),
      options: questionType === 'Multiple Choice (MCQ)' ? options : undefined,
      correctAnswer: correctAnswer.trim() || undefined,
      answerExplanation: answerExplanation.trim() || undefined,
      marks: Number(marks) || 1,
      authorFacultyName: authorFacultyName.trim() || undefined,
      sourceOrYear: sourceOrYear.trim() || undefined,
      createdAt: editingQuestion?.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    onSave(finalQuestion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editingQuestion ? 'Edit Question Bank Item' : 'Add New Question to Bank'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Class, subject, difficulty level, topic tags, and step-by-step model solution
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-sans max-h-[80vh] overflow-y-auto">
          
          {/* Row 1: Class, Subject, Chapter */}
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
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))
                ) : (
                  <option value="">No subjects found for Class {classLevel}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Chapter / Unit *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chemical Kinetics, Trigonometry"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Difficulty Level & Question Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            
            {/* Difficulty Level Selection */}
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 flex items-center justify-between">
                <span>Difficulty Level *</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  difficulty === 'Easy'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : difficulty === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {difficulty}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_LEVELS.map((diff) => (
                  <button
                    key={diff.level}
                    type="button"
                    onClick={() => setDifficulty(diff.level)}
                    className={`py-2 px-1 text-center font-bold text-xs rounded-lg border transition-all cursor-pointer ${
                      difficulty === diff.level
                        ? diff.color + ' shadow-xs ring-2 ring-slate-900/10'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {diff.level}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Type & Marks */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Question Type *</label>
                <select
                  value={questionType}
                  onChange={(e) => handleQuestionTypeChange(e.target.value as QuestionType)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold bg-white text-xs"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Marks *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                />
              </div>
            </div>

          </div>

          {/* Row 3: Topic Tags Input & Tag Chips */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Topic Tags (for granular filtering & search)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Press Enter or click suggestions to add
              </span>
            </label>

            {/* Tag input row */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type tag name (e.g. Optics, Derivations, Ray Diagrams)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg cursor-pointer flex items-center gap-1"
              >
                <span>Add Tag</span>
              </button>
            </div>

            {/* Selected Tags Chips */}
            {topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {topicTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-bold text-[11px]"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-500 hover:text-blue-900 rounded-full cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div className="flex flex-wrap items-center gap-1 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Suggestions:</span>
              {COMMON_TAG_SUGGESTIONS.slice(0, 8).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddTag(sug)}
                  disabled={topicTags.includes(sug)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-default"
                >
                  +{sug}
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Question Text */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Question Statement / Problem *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter the complete question statement here with numerical values, equations, or scenario details..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
            />
          </div>

          {/* MCQ Options if Multiple Choice */}
          {questionType === 'Multiple Choice (MCQ)' && (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
              <label className="block text-blue-950 font-bold text-xs">
                MCQ Options (4 Choices)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 w-5 text-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 5: Correct Answer Key */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Correct Answer / Final Key
            </label>
            <input
              type="text"
              placeholder="e.g. Option B) 120 N   or   x = 5, y = -2"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Row 6: Detailed Step-by-Step Model Solution / Explanation */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
              <span>Model Answer & Step-by-Step Solution (For Faculty & Students)</span>
              <span className="text-[10px] text-slate-400 font-normal">Shown in Answer Key / PDF</span>
            </label>
            <textarea
              rows={4}
              placeholder="Provide complete derivation steps, formula applications, working notes, and explanations..."
              value={answerExplanation}
              onChange={(e) => setAnswerExplanation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
            />
          </div>

          {/* Row 7: Faculty Author & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Author / Faculty</label>
              <input
                type="text"
                placeholder="e.g. Prof. Sangeeta Sharma"
                value={authorFacultyName}
                onChange={(e) => setAuthorFacultyName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Source / Exam Year</label>
              <input
                type="text"
                placeholder="e.g. CBSE 2024, Exemplar, Advanced Mock"
                value={sourceOrYear}
                onChange={(e) => setSourceOrYear(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
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
              id="save-question-modal-btn"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{editingQuestion ? 'Update Question' : 'Save to Question Bank'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
