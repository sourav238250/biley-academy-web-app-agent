import React, { useState, useEffect } from 'react';
import {
  NavigationTab,
  Student,
  Faculty,
  Subject,
  Exam,
  ExamResult,
  FeeDeposit,
  PaymentDisbursement,
  TimetableSlot,
  AttendanceRecord,
  AdminUser,
  QuestionBankItem,
  AssignmentSet,
  InstitutionalAuthorizationConfig,
} from './types';
import {
  loadInitialState,
  saveToStorage,
  resetToInitialMockData,
  loadFromStorage,
  saveItemToStorage,
  AppStateData,
  DEFAULT_AUTHORIZATION_CONFIG,
} from './utils/storage';

// Layout components
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';

// Auth components
import { AdminLoginModal, DEMO_ADMIN_ACCOUNTS } from './components/auth/AdminLoginModal';
import { PermissionsMatrixModal } from './components/common/PermissionsMatrixModal';
import { AuthorizationSettingsModal } from './components/common/AuthorizationSettingsModal';

// View modules
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { SubjectsView } from './components/subjects/SubjectsView';
import { FacultyView } from './components/faculty/FacultyView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { QuestionBankView } from './components/question-bank/QuestionBankView';
import { ExamsView } from './components/exams/ExamsView';
import { ResultsView } from './components/results/ResultsView';
import { FeesView } from './components/fees/FeesView';
import { DisbursementsView } from './components/disbursements/DisbursementsView';
import { StudentPortalView } from './components/student-portal/StudentPortalView';

// Printable and detail modals
import { ReceiptModal } from './components/common/ReceiptModal';
import { ReportCardModal } from './components/common/ReportCardModal';
import { IdCardModal } from './components/common/IdCardModal';
import { DisbursementVoucherModal } from './components/disbursements/DisbursementVoucherModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Admin Auth State
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    return loadFromStorage<AdminUser | null>(
      'biley_academy_admin_user_v1',
      DEMO_ADMIN_ACCOUNTS[0].user
    );
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isPermissionsMatrixOpen, setIsPermissionsMatrixOpen] = useState(false);

  // Application Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [deposits, setDeposits] = useState<FeeDeposit[]>([]);
  const [disbursements, setDisbursements] = useState<PaymentDisbursement[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSet[]>([]);
  const [authConfig, setAuthConfig] = useState<InstitutionalAuthorizationConfig>(DEFAULT_AUTHORIZATION_CONFIG);
  const [isAuthorizationSettingsOpen, setIsAuthorizationSettingsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal display states
  const [selectedReceiptDeposit, setSelectedReceiptDeposit] = useState<FeeDeposit | null>(null);
  const [selectedVoucherDisbursement, setSelectedVoucherDisbursement] = useState<PaymentDisbursement | null>(null);
  const [selectedReportCardResult, setSelectedReportCardResult] = useState<ExamResult | null>(null);
  const [selectedIdCardStudent, setSelectedIdCardStudent] = useState<Student | null>(null);
  
  // Quick Action modal trigger flags
  const [isNewAdmissionModalOpen, setIsNewAdmissionModalOpen] = useState(false);
  const [isFeeDepositModalOpen, setIsFeeDepositModalOpen] = useState(false);
  const [targetStudentForFee, setTargetStudentForFee] = useState<string | undefined>(undefined);
  const [targetExamForResults, setTargetExamForResults] = useState<string | undefined>(undefined);
  const [targetFeesTab, setTargetFeesTab] = useState<'deposits' | 'dues' | 'structure'>('deposits');

  const handleNavigateToFeeStructure = () => {
    setTargetFeesTab('structure');
    setActiveTab('fees');
  };

  // Initial Load from LocalStorage
  useEffect(() => {
    const data = loadInitialState();
    setStudents(data.students);
    setFaculty(data.faculty);
    setSubjects(data.subjects);
    setExams(data.exams);
    setResults(data.results);
    setDeposits(data.deposits);
    setDisbursements(data.disbursements || []);
    setTimetable(data.timetable);
    setAttendance(data.attendance || []);
    setQuestionBank(data.questionBank || []);
    setAssignments(data.assignments || []);
    setAuthConfig(data.authConfig || DEFAULT_AUTHORIZATION_CONFIG);
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage on State Mutation
  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage({
      students,
      faculty,
      subjects,
      exams,
      results,
      deposits,
      disbursements,
      timetable,
      attendance,
      questionBank,
      assignments,
      authConfig,
    });
  }, [students, faculty, subjects, exams, results, deposits, disbursements, timetable, attendance, questionBank, assignments, authConfig, isLoaded]);

  // Authorization Config Handler
  const handleSaveAuthConfig = (newConfig: InstitutionalAuthorizationConfig) => {
    setAuthConfig(newConfig);
    saveItemToStorage('biley_academy_auth_config_v1', newConfig);
  };

  // Disbursements Handlers
  const handleAddDisbursement = (disbursement: PaymentDisbursement) => {
    setDisbursements((prev) => [disbursement, ...prev]);
  };

  const handleUpdateDisbursement = (updated: PaymentDisbursement) => {
    setDisbursements((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeleteDisbursement = (disbursementId: string) => {
    setDisbursements((prev) => prev.filter((d) => d.id !== disbursementId));
  };

  // Students Handlers
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // Question Bank Handlers
  const handleSaveQuestion = (question: QuestionBankItem) => {
    setQuestionBank((prev) => {
      const idx = prev.findIndex((q) => q.id === question.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = question;
        return next;
      }
      return [question, ...prev];
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionBank((prev) => prev.filter((q) => q.id !== questionId));
  };

  // Assignment Handlers
  const handleSaveAssignment = (assignment: AssignmentSet) => {
    setAssignments((prev) => {
      const idx = prev.findIndex((a) => a.id === assignment.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = assignment;
        return next;
      }
      return [assignment, ...prev];
    });
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  // Subjects Handlers
  const handleAddSubject = (newSubject: Subject) => {
    setSubjects((prev) => [...prev, newSubject]);
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === updatedSubject.id ? updatedSubject : s))
    );
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  // Faculty Handlers
  const handleAddFaculty = (newFaculty: Faculty) => {
    setFaculty((prev) => [...prev, newFaculty]);
  };

  const handleUpdateFaculty = (updatedFaculty: Faculty) => {
    setFaculty((prev) =>
      prev.map((f) => (f.id === updatedFaculty.id ? updatedFaculty : f))
    );
  };

  const handleDeleteFaculty = (facultyId: string) => {
    setFaculty((prev) => prev.filter((f) => f.id !== facultyId));
  };

  // Timetable Handlers
  const handleAddTimetableSlot = (slot: TimetableSlot) => {
    setTimetable((prev) => [...prev, slot]);
  };

  const handleUpdateTimetableSlot = (updatedSlot: TimetableSlot) => {
    setTimetable((prev) =>
      prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s))
    );
  };

  const handleDeleteTimetableSlot = (slotId: string) => {
    setTimetable((prev) => prev.filter((s) => s.id !== slotId));
  };

  // Exams Handlers
  const handleAddExam = (newExam: Exam) => {
    setExams((prev) => [newExam, ...prev]);
  };

  const handleUpdateExam = (updatedExam: Exam) => {
    setExams((prev) =>
      prev.map((e) => (e.id === updatedExam.id ? updatedExam : e))
    );
  };

  const handleDeleteExam = (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
  };

  // Results Handlers
  const handleAddOrUpdateResult = (result: ExamResult) => {
    setResults((prev) => {
      const exists = prev.some((r) => r.id === result.id);
      if (exists) {
        return prev.map((r) => (r.id === result.id ? result : r));
      }
      return [result, ...prev];
    });
  };

  const handleDeleteResult = (resultId: string) => {
    setResults((prev) => prev.filter((r) => r.id !== resultId));
  };

  // Fee Deposits Handlers
  const handleAddDeposit = (deposit: FeeDeposit) => {
    setDeposits((prev) => [deposit, ...prev]);
  };

  const handleDeleteDeposit = (depositId: string) => {
    setDeposits((prev) => prev.filter((d) => d.id !== depositId));
  };

  // Attendance Handlers
  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendance((prev) => {
      const next = [...prev];
      newRecords.forEach((record) => {
        const index = next.findIndex((r) => r.id === record.id);
        if (index >= 0) {
          next[index] = record;
        } else {
          next.push(record);
        }
      });
      return next;
    });
  };

  // Cross-Navigation Shortcuts
  const handleQuickNewAdmission = () => {
    setActiveTab('students');
    setIsNewAdmissionModalOpen(true);
  };

  const handleQuickFeeDeposit = (studentId?: string) => {
    setTargetStudentForFee(studentId);
    setActiveTab('fees');
    setIsFeeDepositModalOpen(true);
  };

  const handleNavigateToExamResults = (examId: string) => {
    setTargetExamForResults(examId);
    setActiveTab('results');
  };

  const handleLoginSuccess = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    saveItemToStorage('biley_academy_admin_user_v1', admin);
    setIsAdminLoginModalOpen(false);
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('biley_academy_admin_user_v1');
    setActiveTab('student-portal');
  };

  const handleResetData = () => {
    if (confirm('Reset Biley Academy database to default demo data? All custom additions will be refreshed.')) {
      const initial = resetToInitialMockData();
      setStudents(initial.students);
      setFaculty(initial.faculty);
      setSubjects(initial.subjects);
      setExams(initial.exams);
      setResults(initial.results);
      setDeposits(initial.deposits);
      setTimetable(initial.timetable);
      setAttendance(initial.attendance || []);
      setQuestionBank(initial.questionBank || []);
      setAssignments(initial.assignments || []);
    }
  };

  const handleRestoreData = (restoredData: AppStateData) => {
    setStudents(restoredData.students);
    setFaculty(restoredData.faculty);
    setSubjects(restoredData.subjects);
    setExams(restoredData.exams);
    setResults(restoredData.results);
    setDeposits(restoredData.deposits);
    setTimetable(restoredData.timetable);
    setAttendance(restoredData.attendance || []);
    setQuestionBank(restoredData.questionBank || []);
    setAssignments(restoredData.assignments || []);
    saveToStorage(restoredData);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-amber-400 font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-sm tracking-wide text-white">Loading Biley Academy ERP System...</p>
        </div>
      </div>
    );
  }

  // Selected student for Report card
  const reportCardStudent = selectedReportCardResult
    ? students.find((s) => s.id === selectedReportCardResult.studentId)
    : null;
  const reportCardExam = selectedReportCardResult
    ? exams.find((e) => e.id === selectedReportCardResult.examId)
    : null;

  // Selected student for Fee Receipt
  const receiptStudent = selectedReceiptDeposit
    ? students.find((s) => s.id === selectedReceiptDeposit.studentId)
    : null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col antialiased selection:bg-amber-400 selection:text-slate-950">
      
      {/* Top Brand Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewAdmission={handleQuickNewAdmission}
        onOpenFeeDeposit={() => handleQuickFeeDeposit()}
        onResetData={handleResetData}
        totalStudents={students.length}
        totalFaculty={faculty.length}
        currentAdmin={currentAdmin}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
        onOpenAuthorizationSettings={() => setIsAuthorizationSettingsOpen(true)}
      />

      {/* Main Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        facultyCount={faculty.length}
        examCount={exams.length}
        resultsCount={results.length}
        feeDepositsCount={deposits.length}
        disbursementsCount={disbursements.length}
        attendanceRecordsCount={attendance.length}
        questionBankCount={questionBank.length}
        assignmentCount={assignments.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            faculty={faculty}
            subjects={subjects}
            exams={exams}
            results={results}
            deposits={deposits}
            disbursements={disbursements}
            timetable={timetable}
            attendance={attendance}
            onNavigateTab={setActiveTab}
            onNavigate={setActiveTab}
            onOpenAdmissionModal={handleQuickNewAdmission}
            onOpenFeeDepositModal={handleQuickFeeDeposit}
            onNavigateToFeeStructure={handleNavigateToFeeStructure}
            onViewReceipt={(dep) => setSelectedReceiptDeposit(dep)}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
            onRestoreData={handleRestoreData}
            onResetData={handleResetData}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            subjects={subjects}
            deposits={deposits}
            results={results}
            authConfig={authConfig}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onViewIdCard={(st) => setSelectedIdCardStudent(st)}
            onDepositFee={(stId) => handleQuickFeeDeposit(stId)}
            isAdmissionModalOpen={isNewAdmissionModalOpen}
            setIsAdmissionModalOpen={setIsNewAdmissionModalOpen}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
            onOpenAuthSettings={() => setIsAuthorizationSettingsOpen(true)}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsView
            subjects={subjects}
            faculty={faculty}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
          />
        )}

        {activeTab === 'faculty' && (
          <FacultyView
            faculty={faculty}
            subjects={subjects}
            timetable={timetable}
            onAddFaculty={handleAddFaculty}
            onUpdateFaculty={handleUpdateFaculty}
            onDeleteFaculty={handleDeleteFaculty}
            onAddTimetableSlot={handleAddTimetableSlot}
            onUpdateTimetableSlot={handleUpdateTimetableSlot}
            onDeleteTimetableSlot={handleDeleteTimetableSlot}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            students={students}
            subjects={subjects}
            faculty={faculty}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
          />
        )}

        {activeTab === 'question-bank' && (
          <QuestionBankView
            questionBank={questionBank}
            assignments={assignments}
            subjects={subjects}
            faculty={faculty}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onSaveAssignment={handleSaveAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
          />
        )}

        {activeTab === 'exams' && (
          <ExamsView
            exams={exams}
            subjects={subjects}
            onAddExam={handleAddExam}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={handleDeleteExam}
            onNavigateToResults={handleNavigateToExamResults}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
          />
        )}

        {activeTab === 'results' && (
          <ResultsView
            exams={exams}
            results={results}
            students={students}
            subjects={subjects}
            onAddOrUpdateResult={handleAddOrUpdateResult}
            onDeleteResult={handleDeleteResult}
            onViewReportCard={(res) => setSelectedReportCardResult(res)}
            initialSelectedExamId={targetExamForResults}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
            onOpenAuthorizationSettings={() => setIsAuthorizationSettingsOpen(true)}
          />
        )}

        {activeTab === 'fees' && (
          <FeesView
            students={students}
            deposits={deposits}
            authConfig={authConfig}
            onAddDeposit={handleAddDeposit}
            onDeleteDeposit={handleDeleteDeposit}
            onViewReceipt={(dep) => setSelectedReceiptDeposit(dep)}
            isDepositModalOpen={isFeeDepositModalOpen}
            setIsDepositModalOpen={setIsFeeDepositModalOpen}
            preselectedStudentId={targetStudentForFee}
            initialActiveTab={targetFeesTab}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
            onOpenAuthorizationSettings={() => setIsAuthorizationSettingsOpen(true)}
          />
        )}

        {activeTab === 'disbursements' && (
          <DisbursementsView
            disbursements={disbursements}
            deposits={deposits}
            students={students}
            authConfig={authConfig}
            onAddDisbursement={handleAddDisbursement}
            onUpdateDisbursement={handleUpdateDisbursement}
            onDeleteDisbursement={handleDeleteDisbursement}
            onViewVoucher={(disb) => setSelectedVoucherDisbursement(disb)}
            currentAdmin={currentAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
            onOpenAuthorizationSettings={() => setIsAuthorizationSettingsOpen(true)}
          />
        )}

        {activeTab === 'student-portal' && (
          <StudentPortalView
            students={students}
            subjects={subjects}
            faculty={faculty}
            exams={exams}
            results={results}
            deposits={deposits}
            timetable={timetable}
            attendance={attendance}
            assignments={assignments}
            questionBank={questionBank}
            onOpenFeeDepositModal={(stId) => handleQuickFeeDeposit(stId)}
            onViewReceipt={(dep) => setSelectedReceiptDeposit(dep)}
            onViewReportCard={(res) => setSelectedReportCardResult(res)}
            onOpenIdCardModal={(st) => setSelectedIdCardStudent(st)}
          />
        )}

      </main>

      {/* Global Modals for Printing & Detail Generation */}
      {selectedReceiptDeposit && receiptStudent && (
        <ReceiptModal
          deposit={selectedReceiptDeposit}
          student={receiptStudent}
          authConfig={authConfig}
          onUpdateAuthConfig={handleSaveAuthConfig}
          onClose={() => setSelectedReceiptDeposit(null)}
        />
      )}

      {selectedVoucherDisbursement && (
        <DisbursementVoucherModal
          disbursement={selectedVoucherDisbursement}
          authConfig={authConfig}
          onUpdateAuthConfig={handleSaveAuthConfig}
          onClose={() => setSelectedVoucherDisbursement(null)}
        />
      )}

      {selectedReportCardResult && reportCardStudent && reportCardExam && (
        <ReportCardModal
          result={selectedReportCardResult}
          student={reportCardStudent}
          exam={reportCardExam}
          authConfig={authConfig}
          onUpdateAuthConfig={handleSaveAuthConfig}
          onClose={() => setSelectedReportCardResult(null)}
        />
      )}

      {selectedIdCardStudent && (
        <IdCardModal
          student={selectedIdCardStudent}
          onClose={() => setSelectedIdCardStudent(null)}
        />
      )}

      {/* Institutional Authorization & Signatory Configuration Modal */}
      <AuthorizationSettingsModal
        isOpen={isAuthorizationSettingsOpen}
        onClose={() => setIsAuthorizationSettingsOpen(false)}
        authConfig={authConfig}
        onSaveAuthConfig={handleSaveAuthConfig}
        currentAdmin={currentAdmin}
        onUpdateCurrentAdmin={(admin) => {
          setCurrentAdmin(admin);
          saveItemToStorage('biley_academy_admin_user_v1', admin);
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Role-Based Permissions & Access Matrix Modal */}
      <PermissionsMatrixModal
        isOpen={isPermissionsMatrixOpen}
        onClose={() => setIsPermissionsMatrixOpen(false)}
        currentAdmin={currentAdmin}
        onSelectRole={handleLoginSuccess}
      />

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-12 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Biley Academy ERP</span>
            <span>•</span>
            <span>Classes 5 to 12 Premier Coaching Management</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Admissions • Subjects • Faculty • Exams • Results • Fees</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-700 underline cursor-pointer"
              title="Reset initial demo data"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
