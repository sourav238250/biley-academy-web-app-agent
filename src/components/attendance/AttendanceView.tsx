import React, { useState, useMemo, useEffect } from 'react';
import {
  AttendanceRecord,
  AttendanceStatus,
  ClassLevel,
  Faculty,
  Student,
  Subject,
  AdminUser,
} from '../../types';
import {
  computeStudentAttendanceSummary,
  getStudentsEnrolledInSubject,
  getAttendanceStatusBadge,
  CLASS_LEVELS,
} from '../../utils/academicUtils';
import { evaluateSectionAuthorization } from '../../utils/auth';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  Save,
  AlertTriangle,
  FileText,
  Printer,
  Search,
  Filter,
  Check,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Send,
  Lock,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

interface AttendanceViewProps {
  students: Student[];
  subjects: Subject[];
  faculty: Faculty[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  currentAdmin: AdminUser | null;
  onOpenAdminLogin?: () => void;
  onOpenPermissionsMatrix?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  subjects,
  faculty,
  attendance,
  onSaveAttendance,
  currentAdmin,
  onOpenAdminLogin,
  onOpenPermissionsMatrix,
}) => {
  const auth = evaluateSectionAuthorization(currentAdmin, 'attendance');

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'mark' | 'register' | 'defaulters'>('mark');

  // Today's date string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  // Faculty filtering logic: if logged in as a Faculty Mentor, find matching faculty record
  const loggedInFaculty = useMemo(() => {
    if (!currentAdmin) return null;
    if (currentAdmin.role === 'Faculty Mentor') {
      return faculty.find(
        (f) =>
          f.name.toLowerCase().includes(currentAdmin.name.toLowerCase()) ||
          f.email.toLowerCase() === currentAdmin.email.toLowerCase()
      ) || faculty[0] || null;
    }
    return null;
  }, [currentAdmin, faculty]);

  // Marker form states
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(() => {
    return loggedInFaculty ? loggedInFaculty.id : (faculty[0]?.id || 'ALL');
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Available subjects for the selected faculty
  const availableSubjects = useMemo(() => {
    if (selectedFacultyId === 'ALL') {
      return subjects;
    }
    return subjects.filter((s) => s.facultyId === selectedFacultyId);
  }, [subjects, selectedFacultyId]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return availableSubjects[0]?.id || (subjects[0]?.id || '');
  });

  // When available subjects change, ensure valid selection
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!availableSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableSubjects[0].id);
      }
    }
  }, [availableSubjects, selectedSubjectId]);

  // Selected subject object
  const currentSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  // Enrolled students for this subject
  const enrolledStudents = useMemo(() => {
    if (!selectedSubjectId) return [];
    return getStudentsEnrolledInSubject(selectedSubjectId, students, subjects);
  }, [selectedSubjectId, students, subjects]);

  // Lesson & Topic state
  const [topicCovered, setTopicCovered] = useState<string>('');
  const [classRemarks, setClassRemarks] = useState<string>('');

  // Daily attendance draft map: { [studentId]: { status: AttendanceStatus, remarks: string } }
  const [rosterDraft, setRosterDraft] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Load existing attendance for this (date, subject) combination if already recorded
  useEffect(() => {
    if (!selectedSubjectId || !selectedDate) return;

    const existingRecords = attendance.filter(
      (r) => r.subjectId === selectedSubjectId && r.date === selectedDate
    );

    const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    // First check existing records
    existingRecords.forEach((rec) => {
      initialMap[rec.studentId] = {
        status: rec.status,
        remarks: rec.remarks || '',
      };
    });

    // If there was an existing record with topic covered, set it
    if (existingRecords.length > 0 && existingRecords[0].topicCovered) {
      setTopicCovered(existingRecords[0].topicCovered);
    } else {
      setTopicCovered('');
    }

    // For any enrolled student not in existing records, default to 'Present'
    enrolledStudents.forEach((st) => {
      if (!initialMap[st.id]) {
        initialMap[st.id] = {
          status: 'Present',
          remarks: '',
        };
      }
    });

    setRosterDraft(initialMap);
  }, [selectedSubjectId, selectedDate, enrolledStudents, attendance]);

  // Quick batch status setters
  const handleSetAllStatus = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    enrolledStudents.forEach((st) => {
      updated[st.id] = {
        status,
        remarks: rosterDraft[st.id]?.remarks || '',
      };
    });
    setRosterDraft(updated);
  };

  const handleStudentStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRosterDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status,
      },
    }));
  };

  const handleStudentRemarkChange = (studentId: string, remarks: string) => {
    setRosterDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Present' }),
        remarks,
      },
    }));
  };

  // Save current daily attendance
  const handleSaveDailyAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.canWrite) {
      alert('Your current role does not have permission to modify attendance records.');
      return;
    }

    if (!currentSubject) {
      alert('Please select a subject to record attendance.');
      return;
    }

    if (enrolledStudents.length === 0) {
      alert('No students are enrolled in this subject to mark attendance.');
      return;
    }

    const timestamp = new Date().toISOString();
    const newRecords: AttendanceRecord[] = enrolledStudents.map((st) => {
      const draft = rosterDraft[st.id] || { status: 'Present', remarks: '' };
      return {
        id: `ATT-${selectedDate.replace(/-/g, '')}-${currentSubject.id}-${st.id}`,
        studentId: st.id,
        subjectId: currentSubject.id,
        classLevel: currentSubject.classLevel,
        date: selectedDate,
        status: draft.status,
        facultyId: currentSubject.facultyId || selectedFacultyId,
        topicCovered: topicCovered.trim() || undefined,
        remarks: draft.remarks.trim() || (classRemarks.trim() ? classRemarks.trim() : undefined),
        recordedAt: timestamp,
      };
    });

    onSaveAttendance(newRecords);
    setSaveSuccessMessage(`Attendance successfully recorded for ${enrolledStudents.length} student(s) on ${selectedDate}!`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  // Register view state
  const [registerClassLevel, setRegisterClassLevel] = useState<ClassLevel>('10');
  const [registerSubjectId, setRegisterSubjectId] = useState<string>('');

  const registerSubjects = useMemo(() => {
    return subjects.filter((s) => s.classLevel === registerClassLevel);
  }, [subjects, registerClassLevel]);

  useEffect(() => {
    if (registerSubjects.length > 0) {
      setRegisterSubjectId(registerSubjects[0].id);
    } else {
      setRegisterSubjectId('');
    }
  }, [registerSubjects]);

  // Unique session dates recorded for register subject
  const registerDates = useMemo(() => {
    if (!registerSubjectId) return [];
    const datesSet = new Set<string>();
    attendance
      .filter((r) => r.subjectId === registerSubjectId)
      .forEach((r) => datesSet.add(r.date));
    return Array.from(datesSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [registerSubjectId, attendance]);

  const registerStudents = useMemo(() => {
    if (!registerSubjectId) return [];
    return getStudentsEnrolledInSubject(registerSubjectId, students, subjects);
  }, [registerSubjectId, students, subjects]);

  // Defaulters Analytics
  const [shortageFilterClass, setShortageFilterClass] = useState<string>('ALL');
  const [parentAlertSuccess, setParentAlertSuccess] = useState<string | null>(null);

  const studentSummaries = useMemo(() => {
    return students
      .filter((s) => s.status === 'Active')
      .map((st) => {
        const summary = computeStudentAttendanceSummary(st, attendance, subjects, faculty);
        return {
          student: st,
          summary,
        };
      })
      .filter(({ student, summary }) => {
        if (shortageFilterClass !== 'ALL' && student.classLevel !== shortageFilterClass) return false;
        return summary.totalClasses > 0;
      });
  }, [students, attendance, subjects, faculty, shortageFilterClass]);

  const defaultersList = useMemo(() => {
    return studentSummaries.filter(({ summary }) => summary.attendancePercentage < 75);
  }, [studentSummaries]);

  // Stats for the current marker draft
  const draftStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    enrolledStudents.forEach((st) => {
      const status = rosterDraft[st.id]?.status || 'Present';
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Late') late++;
      else if (status === 'Excused') excused++;
    });

    const total = enrolledStudents.length;
    const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [enrolledStudents, rosterDraft]);

  const handleSendParentAlert = (studentName: string, phone: string, percentage: number) => {
    setParentAlertSuccess(`Low Attendance SMS Alert dispatched to guardian of ${studentName} (${phone}) - Current Attendance: ${percentage}%.`);
    setTimeout(() => {
      setParentAlertSuccess(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Daily Attendance & Subject Register
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Classes 1 to 12
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Faculty-led subject attendance marking, daily lesson syllabus log & shortage monitoring
              </p>
            </div>
          </div>
        </div>

        {/* RBAC Badge and Mode Switches */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${auth.badgeStyle}`}>
            {auth.badgeLabel}
          </span>
          {currentAdmin && (
            <span className="text-xs text-slate-500 font-medium">
              Signed in: <strong className="text-slate-800">{currentAdmin.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Role Notice if read-only */}
      {auth.notice && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{auth.notice}</p>
          </div>
          {onOpenAdminLogin && (
            <button
              onClick={onOpenAdminLogin}
              className="text-xs text-amber-800 font-bold underline hover:text-amber-950 cursor-pointer"
            >
              Switch Role
            </button>
          )}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveSubTab('mark')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'mark'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-emerald-600" />
          <span>Daily Subject Marker</span>
        </button>

        <button
          onClick={() => setActiveSubTab('register')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'register'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Subject Attendance Register</span>
        </button>

        <button
          onClick={() => setActiveSubTab('defaulters')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'defaulters'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Shortage Alerts & Defaulters ({defaultersList.length})</span>
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {saveSuccessMessage}
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {parentAlertSuccess && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <Send className="w-4 h-4 text-blue-600" />
            {parentAlertSuccess}
          </div>
          <button
            onClick={() => setParentAlertSuccess(null)}
            className="text-blue-700 hover:text-blue-950 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: DAILY ATTENDANCE MARKER (CORE FUNCTIONALITY)      */}
      {/* ========================================================= */}
      {activeSubTab === 'mark' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Faculty, Subject & Date Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Faculty Mentor Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  1. Faculty Mentor
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="ALL">All Faculty Mentors</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  2. Subject & Class Level
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {availableSubjects.map((sub) => {
                    const count = getStudentsEnrolledInSubject(sub.id, students, subjects).length;
                    return (
                      <option key={sub.id} value={sub.id}>
                        Class {sub.classLevel} - {sub.name} ({sub.code}) • {count} Enrolled
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date Selector with Today / Yesterday shortcuts */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  3. Lecture Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer ${
                      selectedDate === todayStr
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Today
                  </button>
                </div>
              </div>

            </div>

            {/* Subject Summary Bar & Topic covered input */}
            {currentSubject && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-3.5 rounded-xl border">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Topic & Syllabus Covered in This Lecture
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 5: Newton's Laws of Motion - Friction & Inclined Plane numerical problems"
                    value={topicCovered}
                    onChange={(e) => setTopicCovered(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Faculty Remarks / Homework
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Homework: Practice Ex 5.2"
                    value={classRemarks}
                    onChange={(e) => setClassRemarks(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Roster Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Header & Quick Action Buttons */}
            <div className="px-5 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Enrolled Students Roster ({enrolledStudents.length} Students)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentSubject?.name} • Class {currentSubject?.classLevel} • {selectedDate}
                </p>
              </div>

              {/* Bulk mark buttons */}
              {auth.canWrite && enrolledStudents.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAllStatus('Present')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllStatus('Absent')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Mark All Absent
                  </button>
                </div>
              )}
            </div>

            {/* Quick Live Stats Pill Bar */}
            {enrolledStudents.length > 0 && (
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-600">
                    Enrolled: <strong className="text-slate-900">{draftStats.total}</strong>
                  </span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present: <strong>{draftStats.present}</strong>
                  </span>
                  <span className="font-semibold text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Absent: <strong>{draftStats.absent}</strong>
                  </span>
                  <span className="font-semibold text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Late: <strong>{draftStats.late}</strong>
                  </span>
                  <span className="font-semibold text-blue-700 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Excused: <strong>{draftStats.excused}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-bold uppercase">Attendance Rate:</span>
                  <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        draftStats.rate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${draftStats.rate}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-xs text-slate-900">{draftStats.rate}%</span>
                </div>
              </div>
            )}

            {/* Empty State if no students enrolled */}
            {enrolledStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Students Enrolled in this Subject</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are currently no active students enrolled in <strong>{currentSubject?.name} (Class {currentSubject?.classLevel})</strong>.
                  You can enroll students in Single Subject or Combo coaching from the Student Admissions module.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveDailyAttendance}>
                
                {/* Students Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Student Name & Roll</th>
                        <th className="py-3 px-4">Class & Coaching Mode</th>
                        <th className="py-3 px-4">Subject Attendance Track</th>
                        <th className="py-3 px-4 text-center">Daily Status (Mark)</th>
                        <th className="py-3 px-4">Remarks / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrolledStudents.map((student) => {
                        const currentStatus = rosterDraft[student.id]?.status || 'Present';
                        const currentStudentRemark = rosterDraft[student.id]?.remarks || '';

                        // Overall student attendance stat for this subject
                        const studentSummary = computeStudentAttendanceSummary(
                          student,
                          attendance,
                          subjects,
                          faculty
                        );
                        const subjectStat = studentSummary.subjectWise.find(
                          (sw) => sw.subjectId === currentSubject?.id
                        );

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                            
                            {/* Student Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{student.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {student.rollNo} • {student.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Class & Coaching Mode */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">Class {student.classLevel}</span>
                              <span className="block text-[10px] text-indigo-700 font-bold">
                                {student.enrollmentType || 'All Subjects Combo'}
                              </span>
                            </td>

                            {/* Cumulative Attendance in this subject */}
                            <td className="py-3 px-4">
                              {subjectStat ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[11px] font-bold ${
                                        subjectStat.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'
                                      }`}
                                    >
                                      {subjectStat.percentage}%
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      ({subjectStat.presentCount}/{subjectStat.totalClasses} classes)
                                    </span>
                                  </div>
                                  <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        subjectStat.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${subjectStat.percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">First class</span>
                              )}
                            </td>

                            {/* 4-Way Status Toggle Buttons */}
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mx-auto border border-slate-200">
                                
                                {/* Present */}
                                <button
                                  type="button"
                                  disabled={!auth.canWrite}
                                  onClick={() => handleStudentStatusChange(student.id, 'Present')}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
                                  }`}
                                >
                                  <Check className="w-3 h-3" /> Present
                                </button>

                                {/* Absent */}
                                <button
                                  type="button"
                                  disabled={!auth.canWrite}
                                  onClick={() => handleStudentStatusChange(student.id, 'Absent')}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-rose-700 hover:bg-white/60'
                                  }`}
                                >
                                  <XCircle className="w-3 h-3" /> Absent
                                </button>

                                {/* Late */}
                                <button
                                  type="button"
                                  disabled={!auth.canWrite}
                                  onClick={() => handleStudentStatusChange(student.id, 'Late')}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'Late'
                                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                                      : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" /> Late
                                </button>

                                {/* Excused */}
                                <button
                                  type="button"
                                  disabled={!auth.canWrite}
                                  onClick={() => handleStudentStatusChange(student.id, 'Excused')}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'Excused'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
                                  }`}
                                >
                                  <HelpCircle className="w-3 h-3" /> Excused
                                </button>

                              </div>
                            </td>

                            {/* Remarks */}
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                disabled={!auth.canWrite}
                                placeholder="Student specific note..."
                                value={currentStudentRemark}
                                onChange={(e) => handleStudentRemarkChange(student.id, e.target.value)}
                                className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                              />
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Save Button Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Marking attendance for <strong className="text-slate-900">{enrolledStudents.length} students</strong> on <strong>{selectedDate}</strong>.
                  </div>

                  {auth.canWrite ? (
                    <button
                      type="submit"
                      id="save-attendance-btn"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                    >
                      <Save className="w-4 h-4" /> Save Attendance & Lesson Log
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Read-Only Mode (Sign in as Faculty Mentor or Admin to submit)
                    </span>
                  )}
                </div>

              </form>
            )}

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SUBJECT ATTENDANCE REGISTER / MONTHLY MATRIX       */}
      {/* ========================================================= */}
      {activeSubTab === 'register' && (
        <div className="space-y-6">
          
          {/* Register Selector Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              
              {/* Class Level */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Class Level</label>
                <select
                  value={registerClassLevel}
                  onChange={(e) => setRegisterClassLevel(e.target.value as ClassLevel)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none bg-white"
                >
                  {CLASS_LEVELS.map((cl) => (
                    <option key={cl} value={cl}>Class {cl}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
                <select
                  value={registerSubjectId}
                  onChange={(e) => setRegisterSubjectId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none bg-white"
                >
                  {registerSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Attendance Register
              </button>
            </div>
          </div>

          {/* Matrix Register Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Monthly Attendance Matrix
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {subjects.find((s) => s.id === registerSubjectId)?.name || 'Subject'} • Class {registerClassLevel} • {registerDates.length} Lecture Days Recorded
                </p>
              </div>
            </div>

            {registerDates.length === 0 || registerStudents.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">No lecture logs found for this subject</p>
                <p className="text-[11px] text-slate-400">Mark daily attendance in the 'Daily Subject Marker' tab to populate this register.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 sticky left-0 bg-slate-100 z-10">Student</th>
                      <th className="py-3 px-3">Roll</th>
                      {registerDates.map((date) => (
                        <th key={date} className="py-3 px-2 text-center whitespace-nowrap">
                          {date.slice(5)}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center">Total Present</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registerStudents.map((st) => {
                      let presentCount = 0;
                      let totalLogged = 0;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80">
                          
                          <td className="py-2.5 px-4 font-bold text-slate-900 sticky left-0 bg-white shadow-xs">
                            {st.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                            {st.rollNo}
                          </td>

                          {registerDates.map((date) => {
                            const rec = attendance.find(
                              (r) => r.subjectId === registerSubjectId && r.date === date && r.studentId === st.id
                            );

                            if (!rec) {
                              return (
                                <td key={date} className="py-2.5 px-2 text-center text-slate-300">
                                  -
                                </td>
                              );
                            }

                            totalLogged++;
                            if (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'Excused') {
                              presentCount++;
                            }

                            const badge = getAttendanceStatusBadge(rec.status);

                            return (
                              <td key={date} className="py-2.5 px-2 text-center">
                                <span
                                  title={`${rec.status}${rec.topicCovered ? ` - ${rec.topicCovered}` : ''}`}
                                  className={`inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold border text-center ${badge.bg} ${badge.text} ${badge.border}`}
                                >
                                  {rec.status.charAt(0)}
                                </span>
                              </td>
                            );
                          })}

                          <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                            {presentCount} / {totalLogged}
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            {totalLogged > 0 ? (
                              (() => {
                                const pct = Math.round((presentCount / totalLogged) * 100);
                                return (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      pct >= 75
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-slate-400 text-[10px]">N/A</span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DEFAULTERS & LOW ATTENDANCE SHORTAGE ALERTS        */}
      {/* ========================================================= */}
      {activeSubTab === 'defaulters' && (
        <div className="space-y-6">
          
          {/* Header & Filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Attendance Shortage & Exam Eligibility Monitor (&lt;75% Threshold)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students requiring minimum 75% attendance criteria under CBSE / State Board norms
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Filter Class:</label>
              <select
                value={shortageFilterClass}
                onChange={(e) => setShortageFilterClass(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
              >
                <option value="ALL">All Classes (1 to 12)</option>
                {CLASS_LEVELS.map((cl) => (
                  <option key={cl} value={cl}>Class {cl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Defaulter Cards Grid */}
          {defaultersList.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-950 text-sm">All Students Have Satisfactory Attendance!</h4>
              <p className="text-xs text-emerald-800">
                No active students currently fall below the 75% mandatory attendance threshold in the selected filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultersList.map(({ student, summary }) => (
                <div
                  key={student.id}
                  className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                        <p className="text-xs text-slate-500 font-mono">
                          Roll: {student.rollNo} • Class {student.classLevel}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                        {summary.attendancePercentage}% Attendance
                      </span>
                      <p className="text-[10px] text-rose-600 font-bold mt-1">Shortage Alert</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Attended: <strong>{summary.presentCount + summary.lateCount}</strong> / {summary.totalClasses} classes</span>
                      <span>Absent: <strong className="text-rose-600">{summary.absentCount}</strong></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${summary.attendancePercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Guardian contact & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Guardian Contact:</span>
                      <span className="font-bold text-slate-800">{student.guardianName} ({student.contactNumber})</span>
                    </div>

                    <button
                      onClick={() => handleSendParentAlert(student.name, student.contactNumber, summary.attendancePercentage)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3 text-amber-400" /> Send Alert SMS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
