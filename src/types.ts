export type ClassLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export type StreamType = 'General' | 'Science' | 'Commerce' | 'Arts';

export type BatchShift = 'Morning Batch (6:30 AM - 9:00 AM)' | 'Evening Batch (4:00 PM - 7:30 PM)' | 'Weekend Intensive (Sat-Sun)';

export type Gender = 'Male' | 'Female' | 'Other';

export type FeeStatus = 'Paid' | 'Partial' | 'Overdue' | 'Due Soon';

export type PaymentMode = 'Cash' | 'UPI / GPay / PhonePe' | 'Net Banking' | 'Cheque' | 'Debit/Credit Card';

export type FeeHeadType = 'Tuition Fee' | 'Admission Fee' | 'Exam Fee' | 'Study Material & Lab Fee' | 'Annual Development Fee';

export type AdminRole =
  | 'Super Admin / Director'
  | 'Academic Administrator'
  | 'Accounts & Cashier'
  | 'Faculty Mentor';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  designation: string;
  lastLogin?: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'students'
  | 'subjects'
  | 'faculty'
  | 'attendance'
  | 'exams'
  | 'results'
  | 'fees'
  | 'student-portal';

export interface Student {
  id: string; // e.g. "BA-2026-0501"
  rollNo: string;
  name: string;
  avatarUrl?: string;
  classLevel: ClassLevel;
  stream: StreamType; // General for 5-10; Science/Commerce/Arts for 11-12
  batch: BatchShift;
  gender: Gender;
  dob: string;
  admissionDate: string;
  guardianName: string;
  guardianRelation: 'Father' | 'Mother' | 'Guardian';
  contactNumber: string;
  alternateNumber?: string;
  email: string;
  address: string;
  previousSchool?: string;
  previousScorePercentage?: number;
  scholarshipPercent: number; // e.g., 0%, 15%, 25%
  status: 'Active' | 'Inactive' | 'Passed Out';
  bloodGroup?: string;
  emergencyContact?: string;
  notes?: string;
  enrolledSubjectIds?: string[]; // Coaching subjects enrolled (Single subject e.g. Math, or multiple subjects)
  enrollmentType?: 'Single Subject' | 'Multiple Subjects' | 'All Subjects Combo';
}

export interface Subject {
  id: string; // e.g. "SUB-10-MATH"
  code: string;
  name: string;
  classLevel: ClassLevel;
  stream: StreamType;
  weeklyHours: number;
  facultyId?: string; // Assigned faculty ID
  description?: string;
  totalChapters?: number;
  completedChapters?: number;
  textbook?: string;
}

export interface Faculty {
  id: string; // e.g. "FAC-01"
  name: string;
  avatarUrl?: string;
  designation: 'Senior Faculty' | 'Subject Lead' | 'Assistant Faculty' | 'Guest Lecturer';
  qualification: string; // e.g. "M.Sc. Physics (IIT Kharagpur)", "M.Com, B.Ed"
  email: string;
  phone: string;
  joiningDate: string;
  experienceYears: number;
  assignedSubjectIds: string[]; // Subject IDs taught
  maxWeeklyHours: number;
  bio?: string;
}

export type ExamType = 'Unit Test 1' | 'Mid-Term Exam' | 'Unit Test 2' | 'Pre-Board Exam' | 'Annual Final Exam' | 'Weekly Assessment';

export interface Exam {
  id: string; // e.g. "EX-2026-01"
  title: string;
  examType: ExamType;
  classLevel: ClassLevel;
  stream: StreamType;
  startDate: string;
  endDate: string;
  academicYear: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Results Published';
  subjectsSchedule: {
    subjectId: string;
    subjectName: string;
    date: string;
    time: string;
    maxMarks: number;
    passMarks: number;
    roomNo: string;
  }[];
}

export interface StudentSubjectScore {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  passMarks: number;
  remarks?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  classLevel: ClassLevel;
  scores: StudentSubjectScore[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string; // A1, A2, B1, B2, C1, C2, D, E
  rankInClass?: number;
  status: 'Passed' | 'Failed' | 'Compartment';
  attendancePercentage: number;
  overallRemarks: string;
  publishedDate: string;
}

export interface FeeStructure {
  classLevel: ClassLevel;
  stream: StreamType;
  admissionFee: number;
  monthlyTuitionFee: number; // Full package rate for all subjects
  perSubjectMonthlyFee: number; // Rate per individual enrolled coaching subject
  examFeePerTerm: number;
  materialsFee: number;
}

export interface FeeDeposit {
  id: string; // Receipt number e.g. "REC-2026-8801"
  receiptNo: string;
  studentId: string;
  depositDate: string;
  amountPaid: number;
  feeHead: FeeHeadType;
  monthsCovered?: string[]; // e.g. ["April 2026", "May 2026"]
  paymentMode: PaymentMode;
  transactionRef?: string;
  collectedBy: string;
  remarks?: string;
  discountApplied?: number;
}

export interface StudentFeeSummary {
  studentId: string;
  totalAnnualFee: number;
  totalDiscount: number;
  netPayable: number;
  totalPaid: number;
  dueAmount: number;
  feeStatus: FeeStatus;
  lastPaymentDate?: string;
  monthlyTuitionFee: number;
  enrolledSubjectCount: number;
  coachingMode: 'Single Subject' | 'Multiple Subjects' | 'All Subjects Combo';
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: string; // e.g. "06:30 AM - 07:30 AM"
  classLevel: ClassLevel;
  stream: StreamType;
  batch: BatchShift;
  subjectId: string;
  facultyId: string;
  room: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string; // e.g. "ATT-2026-08-19-SUB-10-MATH-BA-2026-1001"
  studentId: string;
  subjectId: string;
  classLevel: ClassLevel;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  facultyId?: string;
  topicCovered?: string;
  remarks?: string;
  recordedAt?: string;
}

export interface SubjectAttendanceStat {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  facultyName?: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  percentage: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Critical Shortage';
  subjectWise: SubjectAttendanceStat[];
  recentLogs: AttendanceRecord[];
}

