import React, { useState } from 'react';
import {
  Student,
  Subject,
  Faculty,
  Exam,
  ExamResult,
  FeeDeposit,
  TimetableSlot,
  AttendanceRecord,
} from '../../types';
import {
  formatCurrency,
  computeStudentFeeSummary,
  computeStudentAttendanceSummary,
  getEnrolledSubjectsForStudent,
  getStudentCoachingMode,
  getAttendanceStatusBadge,
  DEFAULT_FEE_STRUCTURE,
} from '../../utils/academicUtils';
import {
  GraduationCap,
  Award,
  CreditCard,
  Calendar,
  CalendarCheck,
  Clock,
  Printer,
  IdCard,
  BookOpen,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Check,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface StudentPortalViewProps {
  students: Student[];
  subjects: Subject[];
  faculty: Faculty[];
  exams: Exam[];
  results: ExamResult[];
  deposits: FeeDeposit[];
  timetable: TimetableSlot[];
  attendance?: AttendanceRecord[];
  onOpenFeeDepositModal: (studentId: string) => void;
  onViewReceipt: (deposit: FeeDeposit) => void;
  onViewReportCard: (result: ExamResult) => void;
  onOpenIdCardModal: (student: Student) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  students,
  subjects,
  faculty,
  exams,
  results,
  deposits,
  timetable,
  attendance = [],
  onOpenFeeDepositModal,
  onViewReceipt,
  onViewReportCard,
  onOpenIdCardModal,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [portalTab, setPortalTab] = useState<'overview' | 'academics' | 'attendance' | 'exams' | 'fees'>('overview');

  const student = students.find((s) => s.id === selectedStudentId) || students[0];

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">No students available in the academy database.</p>
      </div>
    );
  }

  const enrolledSubjects = getEnrolledSubjectsForStudent(student, subjects);
  const studentResults = results.filter((r) => r.studentId === student.id);
  const studentDeposits = deposits.filter((d) => d.studentId === student.id);
  const feeSummary = computeStudentFeeSummary(student, deposits, DEFAULT_FEE_STRUCTURE, subjects);
  const coachingMode = getStudentCoachingMode(student, subjects);
  const attendanceSummary = computeStudentAttendanceSummary(student, attendance, subjects, faculty);
  const studentAttendanceRecords = attendance.filter((a) => a.studentId === student.id);

  return (
    <div className="space-y-6">
      
      {/* Student Banner Card */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{student.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Class {student.classLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span>Roll No: <strong className="text-slate-200">{student.rollNo}</strong></span>
                <span>•</span>
                <span>Stream: <strong className="text-slate-200">{student.stream}</strong></span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{coachingMode}</span>
              </p>
            </div>
          </div>

          {/* Quick Student Switcher for Portal Demo */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Simulate Student Account
              </span>
            </div>
            <select
              value={student.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full md:w-64 px-3 py-1.5 text-xs bg-slate-900 border border-slate-600 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} (Class {st.classLevel} - {st.stream})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'My Academic Overview', icon: GraduationCap },
            { id: 'academics', label: `Enrolled Subjects (${enrolledSubjects.length})`, icon: BookOpen },
            { id: 'attendance', label: `Daily Attendance (${attendanceSummary.attendancePercentage}%)`, icon: CalendarCheck },
            { id: 'exams', label: `Exams & Report Cards (${studentResults.length})`, icon: Award },
            { id: 'fees', label: `Fees & Receipts (${studentDeposits.length})`, icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = portalTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPortalTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {portalTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Metrics & Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Class Batch & Slot</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{student.batch}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Fee Payment Status</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {feeSummary.dueAmount === 0 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Fully Paid
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Due: {formatCurrency(feeSummary.dueAmount)}
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500">Paid: {formatCurrency(feeSummary.totalPaid)}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Attendance Score</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {attendanceSummary.totalClasses > 0 ? `${attendanceSummary.attendancePercentage}%` : '100%'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {attendanceSummary.presentCount} / {attendanceSummary.totalClasses} Lectures
                </p>
              </div>
            </div>

            {/* Attendance Track Summary in Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  Daily Attendance Track
                </h3>
                <button
                  onClick={() => setPortalTab('attendance')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  View Details &rarr;
                </button>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${
                    attendanceSummary.attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${attendanceSummary.attendancePercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-900 font-semibold">
                  <span className="block text-[10px] uppercase font-bold text-emerald-700">Present</span>
                  {attendanceSummary.presentCount}
                </div>
                <div className="p-2 bg-rose-50 rounded-lg text-rose-900 font-semibold">
                  <span className="block text-[10px] uppercase font-bold text-rose-700">Absent</span>
                  {attendanceSummary.absentCount}
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-900 font-semibold">
                  <span className="block text-[10px] uppercase font-bold text-amber-700">Late</span>
                  {attendanceSummary.lateCount}
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-900 font-semibold">
                  <span className="block text-[10px] uppercase font-bold text-blue-700">Excused</span>
                  {attendanceSummary.excusedCount}
                </div>
              </div>
            </div>

            {/* Weekly Timetable Schedule */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                My Weekly Coaching Schedule
              </h3>

              {timetable.filter((t) => t.classLevel === student.classLevel).length === 0 ? (
                <p className="text-xs text-slate-400">No timetable slots scheduled for Class {student.classLevel} yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {timetable
                    .filter((t) => t.classLevel === student.classLevel)
                    .map((slot) => {
                      const sub = subjects.find((s) => s.id === slot.subjectId);
                      const fac = faculty.find((f) => f.id === slot.facultyId);
                      return (
                        <div
                          key={slot.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-indigo-700 block">{slot.day}</span>
                            <span className="font-semibold text-slate-900">{sub?.name || 'Class'}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{fac?.name || 'Staff'} • {slot.room}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                            {slot.timeSlot}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

          </div>

          {/* Student Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-20 h-20 rounded-full bg-slate-900 text-amber-400 font-bold text-2xl flex items-center justify-center mx-auto shadow-md mb-3">
                {student.name.charAt(0)}
              </div>
              <h3 className="font-bold text-slate-900 text-base">{student.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{student.id}</p>
              
              <button
                onClick={() => onOpenIdCardModal(student)}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                <IdCard className="w-3.5 h-3.5 text-amber-400" /> View Digital ID Card
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p><span className="text-slate-400">Guardian:</span> <strong>{student.guardianName}</strong></p>
              <p><span className="text-slate-400">Contact:</span> <strong>{student.contactNumber}</strong></p>
              <p><span className="text-slate-400">Email:</span> {student.email}</p>
              <p><span className="text-slate-400">Admission Date:</span> {student.admissionDate}</p>
              <p><span className="text-slate-400">Scholarship:</span> <strong className="text-amber-700">{student.scholarshipPercent}% Concession</strong></p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => onOpenFeeDepositModal(student.id)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Deposit Fee Installment
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Enrolled Subjects */}
      {portalTab === 'academics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledSubjects.map((sub) => {
            const assignedTeacher = faculty.find((f) => f.id === sub.facultyId);
            return (
              <div
                key={sub.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      {sub.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{sub.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{sub.weeklyHours}h/wk</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-300 font-bold flex items-center justify-center text-xs">
                    {assignedTeacher?.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Faculty Mentor</span>
                    <strong className="text-slate-800">{assignedTeacher?.name || 'Assigned Staff'}</strong>
                  </div>
                </div>

                {sub.textbook && (
                  <p className="text-[11px] text-slate-500">
                    <strong className="text-slate-700">Book:</strong> {sub.textbook}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Attendance Track & Lesson History */}
      {portalTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Subject-Wise Attendance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Faculty Mentor</th>
                    <th className="py-3 px-4 text-center">Lectures Attended</th>
                    <th className="py-3 px-4 text-center">Attendance Rate</th>
                    <th className="py-3 px-4">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceSummary.subjectWise.map((stat) => (
                    <tr key={stat.subjectId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{stat.subjectName}</td>
                      <td className="py-3 px-4 text-slate-500">{stat.facultyName}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800">
                        {stat.presentCount} / {stat.totalClasses}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            stat.percentage >= 75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {stat.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
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

          {/* Daily Lesson Log & History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Recent Lecture History & Topics Covered
            </h3>

            {studentAttendanceRecords.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No individual lecture logs recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {studentAttendanceRecords.map((rec) => {
                  const sub = subjects.find((s) => s.id === rec.subjectId);
                  const fac = faculty.find((f) => f.id === rec.facultyId);
                  const badge = getAttendanceStatusBadge(rec.status);

                  return (
                    <div key={rec.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{sub?.name || 'Class Session'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">• {rec.date}</span>
                        </div>
                        {rec.topicCovered && (
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            <strong className="text-slate-700">Topic:</strong> {rec.topicCovered}
                          </p>
                        )}
                        {rec.remarks && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Note: {rec.remarks}</p>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                        {rec.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Exams & Report Cards */}
      {portalTab === 'exams' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Examinations & Official Scorecards</h3>
            </div>

            {studentResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No exam results published for this student yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {studentResults.map((res) => {
                  const exam = exams.find((e) => e.id === res.examId);
                  return (
                    <div
                      key={res.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{exam?.examType || 'Term Test'}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{exam?.name || 'Evaluation Exam'}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Score: <strong className="text-slate-800">{res.totalMarksObtained} / {res.totalMaxMarks}</strong> ({res.percentage}%) • Grade: <span className="font-bold text-indigo-700">{res.grade}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => onViewReportCard(res)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" /> View / Print Report Card
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Fees & Receipts */}
      {portalTab === 'fees' && (
        <div className="space-y-6">
          
          {/* Fee Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Annual Tuition Payable</span>
              <p className="text-base font-bold text-slate-900 mt-1">{formatCurrency(feeSummary.netPayable)}</p>
              <p className="text-[10px] text-slate-500">Monthly: {formatCurrency(feeSummary.monthlyTuitionFee)}/mo</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Total Deposited</span>
              <p className="text-base font-bold text-emerald-700 mt-1">{formatCurrency(feeSummary.totalPaid)}</p>
              <p className="text-[10px] text-slate-500">{studentDeposits.length} Payment(s) Cleared</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-rose-600">Outstanding Due</span>
              <p className="text-base font-bold text-rose-700 mt-1">{formatCurrency(feeSummary.dueAmount)}</p>
              <p className="text-[10px] text-slate-500">Status: {feeSummary.paymentStatus}</p>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Official Money Receipts</h3>
              <button
                onClick={() => onOpenFeeDepositModal(student.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5" /> Deposit Fee
              </button>
            </div>

            {studentDeposits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No fee deposits logged yet for this student.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {studentDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        {dep.receiptNo}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{formatCurrency(dep.amount)}</h4>
                      <p className="text-xs text-slate-500">
                        Paid on {dep.depositDate} via {dep.paymentMode} • {dep.periodCovered}
                      </p>
                    </div>

                    <button
                      onClick={() => onViewReceipt(dep)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Official Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
