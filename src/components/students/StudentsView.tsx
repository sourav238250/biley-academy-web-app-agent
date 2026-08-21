import React, { useState } from 'react';
import {
  Student,
  Subject,
  ClassLevel,
  StreamType,
  BatchShift,
  Gender,
  FeeDeposit,
  ExamResult,
  AdminUser,
  AttendanceRecord,
  Faculty,
} from '../../types';
import {
  CLASS_LEVELS,
  STREAMS_FOR_CLASS,
  DEFAULT_FEE_STRUCTURE,
  computeStudentFeeSummary,
  computeStudentAttendanceSummary,
  getAvailableSubjectsForStudent,
  getEnrolledSubjectsForStudent,
  getStudentCoachingMode,
  getAttendanceStatusBadge,
  formatCurrency,
  generateStudentId,
} from '../../utils/academicUtils';
import { evaluateSectionAuthorization, hasPermission } from '../../utils/auth';
import { SectionAuthHeader } from '../common/SectionAuthHeader';
import { RestrictionBanner } from '../common/RestrictionBanner';
import confetti from 'canvas-confetti';
import {
  UserPlus,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CalendarCheck,
  CreditCard,
  Eye,
  IdCard,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  MapPin,
  Lock,
  BookOpen,
  Check,
  CheckSquare,
  Layers,
  Tag,
  Clock,
  HelpCircle,
  XCircle,
} from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  subjects?: Subject[];
  faculty?: Faculty[];
  deposits: FeeDeposit[];
  results?: ExamResult[];
  attendance?: AttendanceRecord[];
  authConfig?: import('../../types').InstitutionalAuthorizationConfig;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenFeeDepositModal?: (studentId: string) => void;
  onDepositFee?: (studentId: string) => void;
  onOpenIdCardModal?: (student: Student) => void;
  onViewIdCard?: (student: Student) => void;
  isAdmissionModalOpen: boolean;
  setIsAdmissionModalOpen: (open: boolean) => void;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
  onOpenAuthSettings?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  subjects = [],
  faculty = [],
  deposits,
  results = [],
  attendance = [],
  authConfig,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onOpenFeeDepositModal,
  onDepositFee,
  onOpenIdCardModal,
  onViewIdCard,
  isAdmissionModalOpen,
  setIsAdmissionModalOpen,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
  onOpenAuthSettings,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'students');
  const canCollectFee = hasPermission(currentAdmin, 'FEE_COLLECTION_WRITE');
  const canDeleteStudent = hasPermission(currentAdmin, 'STUDENT_DELETE');
  const isAdmissionLocked = authConfig?.isAdmissionLocked || false;
  const canAdmitStudent = auth.canWrite && hasPermission(currentAdmin, 'STUDENT_ADMISSION_WRITE') && !isAdmissionLocked;
  const triggerFeeDeposit = onOpenFeeDepositModal || onDepositFee || (() => {});
  const triggerIdCard = onOpenIdCardModal || onViewIdCard || (() => {});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>('all');
  const [selectedEnrollmentMode, setSelectedEnrollmentMode] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Selected student for Profile View modal
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State for Admission / Edit
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    classLevel: '10',
    stream: 'General',
    batch: 'Evening Batch (4:00 PM - 7:30 PM)',
    gender: 'Male',
    dob: '2010-01-01',
    admissionDate: new Date().toISOString().split('T')[0],
    guardianName: '',
    guardianRelation: 'Father',
    contactNumber: '',
    email: '',
    address: '',
    previousSchool: '',
    previousScorePercentage: 85,
    scholarshipPercent: 0,
    status: 'Active',
    bloodGroup: 'O+',
    emergencyContact: '',
    notes: '',
    enrolledSubjectIds: [],
    enrollmentType: 'All Subjects Combo',
  });

  // Helper to get available subjects for the form's active class & stream
  const formAvailableSubjects = getAvailableSubjectsForStudent(
    (formData.classLevel as ClassLevel) || '10',
    formData.stream || 'General',
    subjects
  );

  const handleOpenAdmission = () => {
    setEditingStudent(null);
    const initialClass: ClassLevel = '10';
    const initialStream: StreamType = 'General';
    const available = getAvailableSubjectsForStudent(initialClass, initialStream, subjects);
    
    setFormData({
      name: '',
      classLevel: initialClass,
      stream: initialStream,
      batch: 'Evening Batch (4:00 PM - 7:30 PM)',
      gender: 'Male',
      dob: '2010-01-01',
      admissionDate: new Date().toISOString().split('T')[0],
      guardianName: '',
      guardianRelation: 'Father',
      contactNumber: '',
      email: '',
      address: '',
      previousSchool: '',
      previousScorePercentage: 85,
      scholarshipPercent: 0,
      status: 'Active',
      bloodGroup: 'O+',
      emergencyContact: '',
      notes: '',
      enrolledSubjectIds: available.map((s) => s.id),
      enrollmentType: 'All Subjects Combo',
    });
    setIsAdmissionModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    const available = getAvailableSubjectsForStudent(student.classLevel, student.stream, subjects);
    const enrolledIds = student.enrolledSubjectIds && student.enrolledSubjectIds.length > 0
      ? student.enrolledSubjectIds
      : available.map((s) => s.id);
    
    let mode: 'Single Subject' | 'Multiple Subjects' | 'All Subjects Combo' = student.enrollmentType || 'All Subjects Combo';
    if (!student.enrollmentType) {
      if (enrolledIds.length === 1) mode = 'Single Subject';
      else if (enrolledIds.length < available.length) mode = 'Multiple Subjects';
      else mode = 'All Subjects Combo';
    }

    setFormData({
      ...student,
      enrolledSubjectIds: enrolledIds,
      enrollmentType: mode,
    });
    setIsAdmissionModalOpen(true);
  };

  // Toggle subject selection in form
  const handleToggleSubject = (subjectId: string) => {
    const current = formData.enrolledSubjectIds || [];
    let updated: string[];
    
    if (formData.enrollmentType === 'Single Subject') {
      // In single subject mode, selecting sets exactly that 1 subject
      updated = [subjectId];
    } else {
      // Multiple or Custom mode
      if (current.includes(subjectId)) {
        if (current.length <= 1) {
          alert('A student must be enrolled in at least one subject.');
          return;
        }
        updated = current.filter((id) => id !== subjectId);
      } else {
        updated = [...current, subjectId];
      }
    }

    const available = getAvailableSubjectsForStudent(
      (formData.classLevel as ClassLevel) || '10',
      formData.stream || 'General',
      subjects
    );

    let derivedMode = formData.enrollmentType;
    if (updated.length === 1 && derivedMode !== 'Single Subject') {
      derivedMode = 'Single Subject';
    } else if (updated.length > 1 && updated.length < available.length) {
      derivedMode = 'Multiple Subjects';
    } else if (updated.length === available.length) {
      derivedMode = 'All Subjects Combo';
    }

    setFormData({
      ...formData,
      enrolledSubjectIds: updated,
      enrollmentType: derivedMode,
    });
  };

  // Set enrollment preset mode
  const handleSetEnrollmentMode = (mode: 'Single Subject' | 'Multiple Subjects' | 'All Subjects Combo') => {
    const available = getAvailableSubjectsForStudent(
      (formData.classLevel as ClassLevel) || '10',
      formData.stream || 'General',
      subjects
    );

    if (mode === 'All Subjects Combo') {
      setFormData({
        ...formData,
        enrollmentType: 'All Subjects Combo',
        enrolledSubjectIds: available.map((s) => s.id),
      });
    } else if (mode === 'Single Subject') {
      const firstSubjectId = formData.enrolledSubjectIds && formData.enrolledSubjectIds.length > 0
        ? formData.enrolledSubjectIds[0]
        : (available[0]?.id || '');
      setFormData({
        ...formData,
        enrollmentType: 'Single Subject',
        enrolledSubjectIds: firstSubjectId ? [firstSubjectId] : [],
      });
    } else {
      // Multiple Subjects
      const current = formData.enrolledSubjectIds || [];
      const updated = current.length > 1 ? current : available.slice(0, Math.min(3, available.length)).map((s) => s.id);
      setFormData({
        ...formData,
        enrollmentType: 'Multiple Subjects',
        enrolledSubjectIds: updated,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contactNumber || !formData.guardianName) {
      alert('Please fill in all mandatory fields (Name, Guardian Name, Contact Number).');
      return;
    }

    const available = getAvailableSubjectsForStudent(
      (formData.classLevel as ClassLevel) || '10',
      formData.stream || 'General',
      subjects
    );

    const enrolled = formData.enrolledSubjectIds && formData.enrolledSubjectIds.length > 0
      ? formData.enrolledSubjectIds
      : available.map((s) => s.id);

    let finalMode = formData.enrollmentType;
    if (enrolled.length === 1) finalMode = 'Single Subject';
    else if (enrolled.length < available.length) finalMode = 'Multiple Subjects';
    else finalMode = 'All Subjects Combo';

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        ...(formData as Student),
        enrolledSubjectIds: enrolled,
        enrollmentType: finalMode,
      };
      onUpdateStudent(updated);
      setIsAdmissionModalOpen(false);
      setEditingStudent(null);
      if (viewingStudent?.id === updated.id) {
        setViewingStudent(updated);
      }
    } else {
      const newId = generateStudentId(formData.classLevel as ClassLevel, students.length);
      const rollSuffix = String(
        students.filter((s) => s.classLevel === formData.classLevel).length + 1
      ).padStart(2, '0');
      const rollPrefix = formData.classLevel === '11' || formData.classLevel === '12' 
        ? `${formData.classLevel}-${formData.stream?.substring(0, 3).toUpperCase()}` 
        : `${formData.classLevel}-GEN`;

      const newStudent: Student = {
        id: newId,
        rollNo: `${rollPrefix}-${rollSuffix}`,
        name: formData.name || '',
        classLevel: formData.classLevel as ClassLevel,
        stream: (formData.stream as StreamType) || 'General',
        batch: (formData.batch as BatchShift) || 'Evening Batch (4:00 PM - 7:30 PM)',
        gender: (formData.gender as Gender) || 'Male',
        dob: formData.dob || '2010-01-01',
        admissionDate: formData.admissionDate || new Date().toISOString().split('T')[0],
        guardianName: formData.guardianName || '',
        guardianRelation: (formData.guardianRelation as any) || 'Father',
        contactNumber: formData.contactNumber || '',
        alternateNumber: formData.alternateNumber,
        email: formData.email || '',
        address: formData.address || '',
        previousSchool: formData.previousSchool,
        previousScorePercentage: Number(formData.previousScorePercentage) || 0,
        scholarshipPercent: Number(formData.scholarshipPercent) || 0,
        status: 'Active',
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact,
        notes: formData.notes,
        enrolledSubjectIds: enrolled,
        enrollmentType: finalMode,
      };

      onAddStudent(newStudent);
      setIsAdmissionModalOpen(false);

      // Trigger Confetti Celebration for New Admission
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  // Filter logic
  const filteredStudents = students.filter((st) => {
    const feeSummary = computeStudentFeeSummary(st, deposits, DEFAULT_FEE_STRUCTURE, subjects);
    const coachingMode = getStudentCoachingMode(st, subjects);
    const enrolledSubs = getEnrolledSubjectsForStudent(st, subjects);

    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.contactNumber.includes(searchQuery) ||
      st.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrolledSubs.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = selectedClass === 'all' || st.classLevel === selectedClass;
    const matchesStream = selectedStream === 'all' || st.stream === selectedStream;
    const matchesFee =
      selectedFeeStatus === 'all' ||
      (selectedFeeStatus === 'Paid' && feeSummary.feeStatus === 'Paid') ||
      (selectedFeeStatus === 'Pending' && feeSummary.dueAmount > 0);

    const matchesEnrollmentMode =
      selectedEnrollmentMode === 'all' || coachingMode === selectedEnrollmentMode;

    const matchesSubject =
      selectedSubjectFilter === 'all' ||
      enrolledSubs.some((s) => s.name.toLowerCase() === selectedSubjectFilter.toLowerCase() || s.code.toLowerCase() === selectedSubjectFilter.toLowerCase());

    return matchesSearch && matchesClass && matchesStream && matchesFee && matchesEnrollmentMode && matchesSubject;
  });

  return (
    <div className="space-y-6">
      
      {/* Section Authorization Unit Status Banner */}
      <SectionAuthHeader
        currentAdmin={currentAdmin || null}
        sectionTab="students"
        onOpenAdminLogin={onOpenAdminLogin || (() => {})}
        onOpenPermissionsMatrix={onOpenPermissionsMatrix}
      />

      {/* Institutional Policy Restriction Banner (if Admission locked) */}
      <RestrictionBanner
        type="admission"
        authConfig={authConfig}
        currentAdmin={currentAdmin}
        onOpenSettings={onOpenAuthSettings}
      />

      {/* Header & New Admission Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-amber-500" />
              Student Admissions & Coaching Directory
            </h2>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Single & Multi-Subject Coaching
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enroll students for single subject specializations, multi-subject packages, or complete all-subject combos across classes 1 to 12.
          </p>
        </div>
        
        {isAdmissionLocked ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold shrink-0">
            <Lock className="w-4 h-4 text-rose-600" />
            <span>Admissions Restricted by Policy</span>
          </div>
        ) : auth.canWrite ? (
          <button
            onClick={handleOpenAdmission}
            id="student-admission-modal-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            Register New Student
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Admissions Locked ({currentAdmin?.role || 'Guest'})</span>
          </div>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, roll no, phone, or enrolled subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Coaching Mode Filter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedEnrollmentMode}
              onChange={(e) => setSelectedEnrollmentMode(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            >
              <option value="all">All Coaching Modes</option>
              <option value="Single Subject">🎯 Single Subject Coaching</option>
              <option value="Multiple Subjects">📚 Multiple Subjects</option>
              <option value="All Subjects Combo">🌟 All Subjects Combo</option>
            </select>

            {/* Fee Filter */}
            <select
              value={selectedFeeStatus}
              onChange={(e) => setSelectedFeeStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Fee Status</option>
              <option value="Paid">Fully Paid</option>
              <option value="Pending">Dues Pending</option>
            </select>

            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Streams</option>
              <option value="General">General (Class 1-10)</option>
              <option value="Science">Science (Class 11-12)</option>
              <option value="Commerce">Commerce (Class 11-12)</option>
              <option value="Arts">Arts (Class 11-12)</option>
            </select>
          </div>
        </div>

        {/* Class Filter Chips (5 to 12) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Class:
          </span>
          <button
            onClick={() => setSelectedClass('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedClass === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Classes ({students.length})
          </button>
          {CLASS_LEVELS.map((cls) => {
            const count = students.filter((s) => s.classLevel === cls).length;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
      </div>

      {/* Student Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Student Records ({filteredStudents.length} Found)
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing students enrolled in single, multiple, or full combo coaching packages
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
              🎯 Single Subject: {students.filter((s) => getStudentCoachingMode(s, subjects) === 'Single Subject').length}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
              📚 Multi-Subject: {students.filter((s) => getStudentCoachingMode(s, subjects) === 'Multiple Subjects').length}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
              🌟 Full Combo: {students.filter((s) => getStudentCoachingMode(s, subjects) === 'All Subjects Combo').length}
            </span>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No students found matching your criteria. Try adjusting your search filters or register a new student.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Class & Stream</th>
                  <th className="py-3 px-4">Enrolled Coaching Subjects</th>
                  <th className="py-3 px-4">Roll No & Batch</th>
                  <th className="py-3 px-4">Fee Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const feeSummary = computeStudentFeeSummary(student, deposits, DEFAULT_FEE_STRUCTURE, subjects);
                  const isPaid = feeSummary.dueAmount === 0;
                  const coachingMode = getStudentCoachingMode(student, subjects);
                  const enrolledSubs = getEnrolledSubjectsForStudent(student, subjects);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span
                              onClick={() => setViewingStudent(student)}
                              className="font-bold text-slate-900 text-sm hover:text-emerald-700 cursor-pointer block"
                            >
                              {student.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">{student.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Class & Stream */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Class {student.classLevel}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">{student.stream}</span>
                      </td>

                      {/* Enrolled Coaching Subjects */}
                      <td className="py-3.5 px-4">
                        {coachingMode === 'Single Subject' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-[11px] rounded-lg shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                              🎯 Single: {enrolledSubs[0]?.name || 'Special Subject'}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {enrolledSubs[0]?.code} • ₹{feeSummary.monthlyTuitionFee}/mo
                            </span>
                          </div>
                        )}

                        {coachingMode === 'Multiple Subjects' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] rounded">
                                📚 {enrolledSubs.length} Subjects:
                              </span>
                              {enrolledSubs.map((s) => (
                                <span
                                  key={s.id}
                                  className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                  title={s.name}
                                >
                                  {s.code.split('-')[0]}
                                </span>
                              ))}
                            </div>
                            <span className="block text-[10px] text-slate-500">
                              Multi-Subject Coaching (₹{feeSummary.monthlyTuitionFee}/mo)
                            </span>
                          </div>
                        )}

                        {coachingMode === 'All Subjects Combo' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 font-bold text-[10px] rounded border border-slate-300">
                              🌟 All Subjects ({enrolledSubs.length})
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              Full Curriculum Package (₹{feeSummary.monthlyTuitionFee}/mo)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Roll & Batch */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-slate-700">{student.rollNo}</span>
                        <span className="block text-[10px] text-slate-500 truncate max-w-[150px]">
                          {student.batch.split('(')[0]}
                        </span>
                      </td>

                      {/* Fee Balance */}
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Fully Paid
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3" /> Due: {formatCurrency(feeSummary.dueAmount)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingStudent(student)}
                            title="View Full Profile"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerIdCard(student)}
                            title="Generate Student ID Card"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>
                          {canCollectFee && (
                            <button
                              onClick={() => triggerFeeDeposit(student.id)}
                              title="Record Fee Deposit"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          {auth.canWrite && (
                            <button
                              onClick={() => handleOpenEdit(student)}
                              title="Edit Student & Subjects"
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteStudent && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${student.name} from Biley Academy records?`)) {
                                  onDeleteStudent(student.id);
                                }
                              }}
                              title="Delete Student Record"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Admission / Edit Registration Modal */}
      {isAdmissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingStudent ? 'Edit Student Registration & Coaching Enrollment' : 'New Student Admission & Coaching Registration'}
                </h3>
              </div>
              <button
                onClick={() => setIsAdmissionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs font-sans">
              
              {/* 1. Academic & Stream Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" /> 1. Academic Class & Batch
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sourav Mukherjee"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Class Level *
                    </label>
                    <select
                      value={formData.classLevel || '10'}
                      onChange={(e) => {
                        const newClass = e.target.value as ClassLevel;
                        const validStreams = STREAMS_FOR_CLASS[newClass];
                        const streamToSet = validStreams.includes(formData.stream || '')
                          ? (formData.stream as StreamType)
                          : (validStreams[0] as StreamType);
                        
                        const newAvail = getAvailableSubjectsForStudent(newClass, streamToSet, subjects);
                        
                        setFormData({
                          ...formData,
                          classLevel: newClass,
                          stream: streamToSet,
                          enrolledSubjectIds: newAvail.map((s) => s.id),
                          enrollmentType: 'All Subjects Combo',
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
                    <label className="block text-slate-700 font-semibold mb-1">
                      Stream / Track *
                    </label>
                    <select
                      value={formData.stream || 'General'}
                      onChange={(e) => {
                        const newStream = e.target.value as StreamType;
                        const newAvail = getAvailableSubjectsForStudent(
                          (formData.classLevel as ClassLevel) || '10',
                          newStream,
                          subjects
                        );
                        setFormData({
                          ...formData,
                          stream: newStream,
                          enrolledSubjectIds: newAvail.map((s) => s.id),
                          enrollmentType: 'All Subjects Combo',
                        });
                      }}
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
                    <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                      <span>Batch & Time Slot *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Editable Time Range</span>
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={
                          ['Morning Batch (6:30 AM - 9:00 AM)', 'Evening Batch (4:00 PM - 7:30 PM)', 'Weekend Intensive (Sat-Sun)'].includes(formData.batch || '')
                            ? formData.batch
                            : 'CUSTOM'
                        }
                        onChange={(e) => {
                          if (e.target.value !== 'CUSTOM') {
                            setFormData({ ...formData, batch: e.target.value as BatchShift });
                          }
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                      >
                        <option value="Morning Batch (6:30 AM - 9:00 AM)">Morning Batch (6:30 AM - 9:00 AM)</option>
                        <option value="Evening Batch (4:00 PM - 7:30 PM)">Evening Batch (4:00 PM - 7:30 PM)</option>
                        <option value="Weekend Intensive (Sat-Sun)">Weekend Intensive (Sat-Sun)</option>
                        <option value="CUSTOM">Custom Time Slot...</option>
                      </select>

                      <input
                        type="text"
                        placeholder="e.g. 05:00 PM - 07:00 PM (Daily) or Custom Slot"
                        value={formData.batch || ''}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value as BatchShift })}
                        className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                    <select
                      value={formData.gender || 'Male'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob || '2010-01-01'}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Coaching Subject Enrollment (Single Subject vs Multiple Subjects) */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" /> 2. Coaching Subject Enrollment
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Students may enroll for single subject coaching, multiple selected subjects, or full combo.
                    </p>
                  </div>

                  {/* Enrollment Mode Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSetEnrollmentMode('Single Subject')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        formData.enrollmentType === 'Single Subject'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🎯 Single Subject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetEnrollmentMode('Multiple Subjects')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        formData.enrollmentType === 'Multiple Subjects'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📚 Multi-Subject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetEnrollmentMode('All Subjects Combo')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        formData.enrollmentType === 'All Subjects Combo'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🌟 All Subjects
                    </button>
                  </div>
                </div>

                {/* Available Subjects Selection Grid */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {formAvailableSubjects.map((sub) => {
                      const isSelected = formData.enrolledSubjectIds?.includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleToggleSubject(sub.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-400'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{sub.name}</span>
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                                {sub.code}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {sub.weeklyHours} hours/week coaching
                            </p>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-300 bg-white text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fee Calculation Live Preview Box */}
                  {(() => {
                    const tempStudent: Student = {
                      ...(formData as Student),
                      id: 'TEMP',
                      rollNo: 'TEMP',
                      enrolledSubjectIds: formData.enrolledSubjectIds || [],
                      scholarshipPercent: Number(formData.scholarshipPercent) || 0,
                    };
                    const summary = computeStudentFeeSummary(tempStudent, [], DEFAULT_FEE_STRUCTURE, subjects);
                    const enrolledCount = formData.enrolledSubjectIds?.length || 0;

                    return (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Coaching Enrollment Summary: {enrolledCount} Subject(s) Selected
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {formData.enrollmentType === 'Single Subject'
                              ? 'Targeted Single Subject Coaching Specialization'
                              : formData.enrollmentType === 'Multiple Subjects'
                              ? 'Custom Multi-Subject Coaching Package'
                              : 'Complete Comprehensive Curriculum Coaching Package'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Tuition</span>
                            <span className="text-sm font-black text-slate-900">
                              {formatCurrency(summary.monthlyTuitionFee)}/mo
                            </span>
                          </div>
                          <div className="h-6 w-px bg-slate-200"></div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Payable</span>
                            <span className="text-sm font-black text-emerald-700">
                              {formatCurrency(summary.netPayable)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 3. Guardian & Contact Info */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> 3. Guardian & Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra Mukherjee"
                      value={formData.guardianName || ''}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Relation</label>
                    <select
                      value={formData.guardianRelation || 'Father'}
                      onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Primary Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98301 XXXXX"
                      value={formData.contactNumber || ''}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Full residential street, area, city, pincode"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Previous Record & Scholarship */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> 4. Previous Background & Scholarship
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Previous School / Board</label>
                    <input
                      type="text"
                      placeholder="e.g. South Point / CBSE"
                      value={formData.previousSchool || ''}
                      onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Previous Exam Score (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.previousScorePercentage || 85}
                      onChange={(e) => setFormData({ ...formData, previousScorePercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Merit Scholarship Discount (%)
                    </label>
                    <select
                      value={formData.scholarshipPercent || 0}
                      onChange={(e) => setFormData({ ...formData, scholarshipPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      <option value={0}>0% (Standard Fee)</option>
                      <option value={10}>10% Merit Concession</option>
                      <option value={15}>15% Rank Holder</option>
                      <option value={20}>20% Excellence Award</option>
                      <option value={25}>25% Top Tier Scholar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-student-btn"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {editingStudent ? 'Save Updates' : 'Confirm Admission & Generate ID'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Viewing Student Profile Drawer Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-base shadow-xs">
                  {viewingStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base">{viewingStudent.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {viewingStudent.id} • Roll: {viewingStudent.rollNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerIdCard(viewingStudent)}
                  className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <IdCard className="w-4 h-4" /> ID Card
                </button>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Key Stats Bar */}
              {(() => {
                const feeSummary = computeStudentFeeSummary(viewingStudent, deposits, DEFAULT_FEE_STRUCTURE, subjects);
                const studentResults = results.filter((r) => r.studentId === viewingStudent.id);
                const coachingMode = getStudentCoachingMode(viewingStudent, subjects);
                const enrolledSubs = getEnrolledSubjectsForStudent(viewingStudent, subjects);
                const attSummary = computeStudentAttendanceSummary(viewingStudent, attendance, subjects, faculty);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Class & Coaching</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">Class {viewingStudent.classLevel}</p>
                      <p className="text-[10px] font-bold text-indigo-700 mt-0.5 truncate">{coachingMode}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold">Fees Paid ({formatCurrency(feeSummary.monthlyTuitionFee)}/mo)</span>
                      <p className="text-sm font-bold text-emerald-900 mt-0.5">{formatCurrency(feeSummary.totalPaid)}</p>
                      <p className="text-[10px] text-emerald-700">Due: {formatCurrency(feeSummary.dueAmount)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <span className="text-[10px] text-amber-800 uppercase font-bold">Enrolled Subjects</span>
                      <p className="text-sm font-bold text-amber-900 mt-0.5">{enrolledSubs.length} Subject(s)</p>
                      <p className="text-[10px] text-amber-700">{studentResults.length} Exams Logged</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <span className="text-[10px] text-blue-800 uppercase font-bold">Attendance Track</span>
                      <p className="text-sm font-bold text-blue-950 mt-0.5">
                        {attSummary.totalClasses > 0 ? `${attSummary.attendancePercentage}%` : '100%'}
                      </p>
                      <p className="text-[10px] text-blue-700 font-semibold">
                        {attSummary.totalClasses > 0 ? `${attSummary.presentCount}/${attSummary.totalClasses} Lectures` : 'New Admission'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Attendance Track & Subject-Wise Summary (The New Attendance Feature) */}
              {(() => {
                const attSummary = computeStudentAttendanceSummary(viewingStudent, attendance, subjects, faculty);
                const isShortage = attSummary.totalClasses > 0 && attSummary.attendancePercentage < 75;

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                        <CalendarCheck className="w-4 h-4 text-emerald-600" />
                        Daily Attendance & Syllabus Track Summary
                      </h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          attSummary.totalClasses === 0
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : isShortage
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {attSummary.totalClasses === 0
                          ? 'No Sessions Recorded Yet'
                          : isShortage
                          ? '⚠️ Attendance Shortage (<75%)'
                          : '✓ Regular Attendance (≥75%)'}
                      </span>
                    </div>

                    {/* Aggregate stats and bar */}
                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">Overall Attendance Rate</span>
                        <span className="font-bold text-slate-900">{attSummary.attendancePercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            attSummary.attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${attSummary.attendancePercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Total Lectures: <strong>{attSummary.totalClasses}</strong></span>
                        <span className="text-emerald-700 font-bold">Present: {attSummary.presentCount}</span>
                        <span className="text-rose-700 font-bold">Absent: {attSummary.absentCount}</span>
                        <span className="text-amber-700 font-bold">Late: {attSummary.lateCount}</span>
                        <span className="text-blue-700 font-bold">Excused: {attSummary.excusedCount}</span>
                      </div>
                    </div>

                    {/* Subject-wise breakdown table */}
                    {attSummary.subjectWise.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Subject-Wise Breakdown</span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <thead className="bg-slate-100/70 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                              <tr>
                                <th className="py-2 px-3">Subject</th>
                                <th className="py-2 px-3">Faculty Mentor</th>
                                <th className="py-2 px-3 text-center">Attended</th>
                                <th className="py-2 px-3 text-center">Attendance %</th>
                                <th className="py-2 px-3">Progress</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {attSummary.subjectWise.map((stat) => (
                                <tr key={stat.subjectId} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-bold text-slate-900">{stat.subjectName}</td>
                                  <td className="py-2 px-3 text-slate-500 text-[10px]">{stat.facultyName}</td>
                                  <td className="py-2 px-3 text-center text-slate-700 font-semibold">
                                    {stat.presentCount} / {stat.totalClasses}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        stat.percentage >= 75
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-rose-50 text-rose-700'
                                      }`}
                                    >
                                      {stat.percentage}%
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full ${
                                          stat.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${stat.percentage}%` }}
                                      ></div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Enrolled Subjects with full details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Enrolled Coaching Subjects
                  </h4>
                  {auth.canWrite && (
                    <button
                      onClick={() => {
                        const st = viewingStudent;
                        setViewingStudent(null);
                        handleOpenEdit(st);
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Change Subjects
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {getEnrolledSubjectsForStudent(viewingStudent, subjects).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{sub.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{sub.code} • {sub.weeklyHours} hrs/week</p>
                        {sub.textbook && (
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[200px]">{sub.textbook}</p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal & Guardian Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Contact & Personal Profile</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><span className="text-slate-400">Guardian:</span> <strong>{viewingStudent.guardianName}</strong> ({viewingStudent.guardianRelation})</p>
                  <p><span className="text-slate-400">Phone:</span> <strong>{viewingStudent.contactNumber}</strong></p>
                  <p><span className="text-slate-400">Email:</span> {viewingStudent.email || 'N/A'}</p>
                  <p><span className="text-slate-400">Batch:</span> {viewingStudent.batch}</p>
                  <p><span className="text-slate-400">Date of Birth:</span> {viewingStudent.dob}</p>
                  <p><span className="text-slate-400">Admission Date:</span> {viewingStudent.admissionDate}</p>
                  <p><span className="text-slate-400">Address:</span> {viewingStudent.address || 'N/A'}</p>
                  <p><span className="text-slate-400">Scholarship:</span> <strong className="text-amber-700">{viewingStudent.scholarshipPercent}% Concession</strong></p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {auth.canWrite ? (
                  <button
                    onClick={() => {
                      const st = viewingStudent;
                      setViewingStudent(null);
                      handleOpenEdit(st);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Info & Subjects
                  </button>
                ) : <div />}
                
                {canCollectFee && (
                  <button
                    onClick={() => {
                      const sId = viewingStudent.id;
                      setViewingStudent(null);
                      triggerFeeDeposit(sId);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Record Fee Deposit
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
