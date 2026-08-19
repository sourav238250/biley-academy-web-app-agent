import {
  AttendanceRecord,
  AttendanceStatus,
  ClassLevel,
  ExamResult,
  Faculty,
  FeeDeposit,
  FeeHeadType,
  FeeStructure,
  Student,
  StudentAttendanceSummary,
  StudentFeeSummary,
  Subject,
  SubjectAttendanceStat,
} from '../types';

export const CLASS_LEVELS: ClassLevel[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const STANDARD_SUBJECT_NAMES = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Computer Application',
  'English',
] as const;

export type StandardSubjectName = (typeof STANDARD_SUBJECT_NAMES)[number];

export const STANDARD_SUBJECT_CODES: Record<StandardSubjectName, string> = {
  'Mathematics': 'MTH',
  'Physics': 'PHY',
  'Chemistry': 'CHM',
  'Biology': 'BIO',
  'Computer Science': 'CS',
  'Computer Application': 'CA',
  'English': 'ENG',
};

export const STREAMS_FOR_CLASS: Record<ClassLevel, string[]> = {
  '1': ['General'],
  '2': ['General'],
  '3': ['General'],
  '4': ['General'],
  '5': ['General'],
  '6': ['General'],
  '7': ['General'],
  '8': ['General'],
  '9': ['General'],
  '10': ['General'],
  '11': ['Science', 'Commerce', 'Arts', 'General'],
  '12': ['Science', 'Commerce', 'Arts', 'General'],
};

export const DEFAULT_FEE_STRUCTURE: Record<string, FeeStructure> = {
  '1-General': { classLevel: '1', stream: 'General', admissionFee: 1000, monthlyTuitionFee: 800, perSubjectMonthlyFee: 250, examFeePerTerm: 300, materialsFee: 500 },
  '2-General': { classLevel: '2', stream: 'General', admissionFee: 1000, monthlyTuitionFee: 900, perSubjectMonthlyFee: 280, examFeePerTerm: 300, materialsFee: 600 },
  '3-General': { classLevel: '3', stream: 'General', admissionFee: 1200, monthlyTuitionFee: 1000, perSubjectMonthlyFee: 300, examFeePerTerm: 350, materialsFee: 700 },
  '4-General': { classLevel: '4', stream: 'General', admissionFee: 1200, monthlyTuitionFee: 1100, perSubjectMonthlyFee: 320, examFeePerTerm: 350, materialsFee: 750 },
  '5-General': { classLevel: '5', stream: 'General', admissionFee: 1500, monthlyTuitionFee: 1200, perSubjectMonthlyFee: 350, examFeePerTerm: 400, materialsFee: 800 },
  '6-General': { classLevel: '6', stream: 'General', admissionFee: 1500, monthlyTuitionFee: 1400, perSubjectMonthlyFee: 380, examFeePerTerm: 400, materialsFee: 900 },
  '7-General': { classLevel: '7', stream: 'General', admissionFee: 1800, monthlyTuitionFee: 1600, perSubjectMonthlyFee: 420, examFeePerTerm: 500, materialsFee: 1000 },
  '8-General': { classLevel: '8', stream: 'General', admissionFee: 1800, monthlyTuitionFee: 1800, perSubjectMonthlyFee: 480, examFeePerTerm: 500, materialsFee: 1200 },
  '9-General': { classLevel: '9', stream: 'General', admissionFee: 2500, monthlyTuitionFee: 2400, perSubjectMonthlyFee: 600, examFeePerTerm: 800, materialsFee: 1800 },
  '10-General': { classLevel: '10', stream: 'General', admissionFee: 3000, monthlyTuitionFee: 2800, perSubjectMonthlyFee: 700, examFeePerTerm: 1000, materialsFee: 2200 },
  '11-Science': { classLevel: '11', stream: 'Science', admissionFee: 4000, monthlyTuitionFee: 3800, perSubjectMonthlyFee: 900, examFeePerTerm: 1200, materialsFee: 3500 },
  '11-Commerce': { classLevel: '11', stream: 'Commerce', admissionFee: 3500, monthlyTuitionFee: 3200, perSubjectMonthlyFee: 800, examFeePerTerm: 1000, materialsFee: 2500 },
  '11-Arts': { classLevel: '11', stream: 'Arts', admissionFee: 3000, monthlyTuitionFee: 2800, perSubjectMonthlyFee: 700, examFeePerTerm: 1000, materialsFee: 2000 },
  '11-General': { classLevel: '11', stream: 'General', admissionFee: 3500, monthlyTuitionFee: 3000, perSubjectMonthlyFee: 750, examFeePerTerm: 1000, materialsFee: 2200 },
  '12-Science': { classLevel: '12', stream: 'Science', admissionFee: 4500, monthlyTuitionFee: 4200, perSubjectMonthlyFee: 1000, examFeePerTerm: 1500, materialsFee: 4000 },
  '12-Commerce': { classLevel: '12', stream: 'Commerce', admissionFee: 4000, monthlyTuitionFee: 3500, perSubjectMonthlyFee: 850, examFeePerTerm: 1200, materialsFee: 2800 },
  '12-Arts': { classLevel: '12', stream: 'Arts', admissionFee: 3500, monthlyTuitionFee: 3000, perSubjectMonthlyFee: 750, examFeePerTerm: 1200, materialsFee: 2200 },
  '12-General': { classLevel: '12', stream: 'General', admissionFee: 4000, monthlyTuitionFee: 3500, perSubjectMonthlyFee: 850, examFeePerTerm: 1200, materialsFee: 2800 },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateGrade(percentage: number): { grade: string; remarks: string; gpa: number } {
  if (percentage >= 91) return { grade: 'A1', remarks: 'Outstanding Academic Performance', gpa: 10.0 };
  if (percentage >= 81) return { grade: 'A2', remarks: 'Excellent Mastery & Understanding', gpa: 9.0 };
  if (percentage >= 71) return { grade: 'B1', remarks: 'Very Good Academic Standard', gpa: 8.0 };
  if (percentage >= 61) return { grade: 'B2', remarks: 'Good Competence, Keep Aiming Higher', gpa: 7.0 };
  if (percentage >= 51) return { grade: 'C1', remarks: 'Satisfactory, Regular Practice Needed', gpa: 6.0 };
  if (percentage >= 41) return { grade: 'C2', remarks: 'Average Performance, Focus on Fundamentals', gpa: 5.0 };
  if (percentage >= 33) return { grade: 'D', remarks: 'Passing Standard, Intensive Support Recommended', gpa: 4.0 };
  return { grade: 'E', remarks: 'Needs Immediate Remedial Coaching', gpa: 0.0 };
}

/**
 * Returns all curriculum subjects available for a student's class and stream.
 */
export function getAvailableSubjectsForStudent(
  classLevel: ClassLevel,
  stream: string,
  subjects: Subject[]
): Subject[] {
  return subjects.filter(
    (s) => s.classLevel === classLevel && (s.stream === 'General' || s.stream === stream)
  );
}

/**
 * Returns the exact list of subjects a student is enrolled in for coaching.
 * If enrolledSubjectIds is not specified or empty, assumes all available subjects for class & stream.
 */
export function getEnrolledSubjectsForStudent(student: Student, subjects: Subject[]): Subject[] {
  const available = getAvailableSubjectsForStudent(student.classLevel, student.stream, subjects);
  if (student.enrolledSubjectIds && student.enrolledSubjectIds.length > 0) {
    const enrolled = available.filter((s) => student.enrolledSubjectIds!.includes(s.id));
    return enrolled.length > 0 ? enrolled : available;
  }
  return available;
}

/**
 * Determines whether a student is taking Single Subject, Multiple Subjects, or All Subjects Combo.
 */
export function getStudentCoachingMode(
  student: Student,
  subjects?: Subject[]
): 'Single Subject' | 'Multiple Subjects' | 'All Subjects Combo' {
  if (subjects && subjects.length > 0) {
    const available = getAvailableSubjectsForStudent(student.classLevel, student.stream, subjects);
    const enrolled = getEnrolledSubjectsForStudent(student, subjects);
    if (enrolled.length === 1) return 'Single Subject';
    if (enrolled.length > 1 && enrolled.length < available.length) return 'Multiple Subjects';
    return 'All Subjects Combo';
  }

  const count = student.enrolledSubjectIds ? student.enrolledSubjectIds.length : 0;
  if (count === 1) return 'Single Subject';
  if (count > 1 && count <= 4) return 'Multiple Subjects';
  return 'All Subjects Combo';
}

export function computeStudentFeeSummary(
  student: Student,
  deposits: FeeDeposit[],
  feeStructures: Record<string, FeeStructure> = DEFAULT_FEE_STRUCTURE,
  subjects?: Subject[]
): StudentFeeSummary {
  const key = `${student.classLevel}-${student.stream}`;
  const structure = feeStructures[key] || DEFAULT_FEE_STRUCTURE['10-General'];

  // Determine enrolled subject count & coaching mode
  let enrolledCount = 6;
  let totalAvailableCount = 6;
  let coachingMode: 'Single Subject' | 'Multiple Subjects' | 'All Subjects Combo' = 'All Subjects Combo';

  if (subjects && subjects.length > 0) {
    const available = getAvailableSubjectsForStudent(student.classLevel, student.stream, subjects);
    totalAvailableCount = Math.max(available.length, 1);
    const enrolled = getEnrolledSubjectsForStudent(student, subjects);
    enrolledCount = enrolled.length;
    coachingMode = getStudentCoachingMode(student, subjects);
  } else if (student.enrolledSubjectIds && student.enrolledSubjectIds.length > 0) {
    enrolledCount = student.enrolledSubjectIds.length;
    if (enrolledCount === 1) {
      coachingMode = 'Single Subject';
    } else if (enrolledCount < 6) {
      coachingMode = 'Multiple Subjects';
    } else {
      coachingMode = 'All Subjects Combo';
    }
  }

  // Monthly Tuition calculation based on coaching enrollment
  const perSubRate = structure.perSubjectMonthlyFee || Math.round(structure.monthlyTuitionFee / totalAvailableCount);
  let effectiveMonthlyTuition: number;

  if (coachingMode === 'Single Subject') {
    effectiveMonthlyTuition = perSubRate;
  } else if (coachingMode === 'Multiple Subjects') {
    // Multi-subject rate capped at full bundle
    effectiveMonthlyTuition = Math.min(structure.monthlyTuitionFee, enrolledCount * perSubRate);
  } else {
    // Full package combo
    effectiveMonthlyTuition = structure.monthlyTuitionFee;
  }

  // Materials & Lab fee: full package or proportional for single/multi subjects
  const effectiveMaterialsFee = coachingMode === 'All Subjects Combo'
    ? structure.materialsFee
    : Math.round(structure.materialsFee * (enrolledCount / totalAvailableCount));

  // Base calculation for 1 Academic Year (12 months tuition + admission + 2 exam terms + materials)
  const grossAnnual =
    structure.admissionFee +
    effectiveMonthlyTuition * 12 +
    structure.examFeePerTerm * 2 +
    effectiveMaterialsFee;

  const scholarshipDiscount = Math.round((grossAnnual * (student.scholarshipPercent || 0)) / 100);
  const netPayable = grossAnnual - scholarshipDiscount;

  const studentDeposits = deposits.filter((d) => d.studentId === student.id);
  const totalPaid = studentDeposits.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const dueAmount = Math.max(0, netPayable - totalPaid);

  let feeStatus: 'Paid' | 'Partial' | 'Overdue' | 'Due Soon' = 'Paid';
  if (dueAmount === 0) {
    feeStatus = 'Paid';
  } else if (totalPaid === 0) {
    feeStatus = 'Overdue';
  } else {
    feeStatus = 'Partial';
  }

  const lastPayment = studentDeposits.sort(
    (a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime()
  )[0];

  return {
    studentId: student.id,
    totalAnnualFee: grossAnnual,
    totalDiscount: scholarshipDiscount,
    netPayable,
    totalPaid,
    dueAmount,
    feeStatus,
    lastPaymentDate: lastPayment ? lastPayment.depositDate : undefined,
    monthlyTuitionFee: effectiveMonthlyTuition,
    enrolledSubjectCount: enrolledCount,
    coachingMode,
  };
}

export function generateStudentId(classLevel: ClassLevel, existingCount: number): string {
  const currentYear = new Date().getFullYear();
  const sequence = String(existingCount + 1).padStart(3, '0');
  const classPadded = String(classLevel).padStart(2, '0');
  return `BA-${currentYear}-${classPadded}${sequence}`;
}

export function generateReceiptNumber(existingCount: number): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `REC-${currentYear}-${String(existingCount + 1).padStart(3, '0')}-${randomSuffix}`;
}

export function assignRanksToResults(results: ExamResult[]): ExamResult[] {
  // Sort descending by percentage
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  return sorted.map((res, index) => ({
    ...res,
    rankInClass: index + 1,
  }));
}

/**
 * Returns students who are enrolled in a specific subject.
 * Checks both individual subject enrollments and full-combo students in that class/stream.
 */
export function getStudentsEnrolledInSubject(
  subjectId: string,
  students: Student[],
  subjects: Subject[]
): Student[] {
  const targetSubject = subjects.find((s) => s.id === subjectId);
  if (!targetSubject) return [];

  return students.filter((student) => {
    if (student.status !== 'Active') return false;
    if (student.classLevel !== targetSubject.classLevel) return false;

    // Check explicit enrolled subjects array
    if (student.enrolledSubjectIds && student.enrolledSubjectIds.length > 0) {
      return student.enrolledSubjectIds.includes(subjectId);
    }

    // If no explicit array or All Subjects Combo, check matching class & stream
    if (student.enrollmentType === 'All Subjects Combo' || !student.enrollmentType) {
      if (['11', '12'].includes(student.classLevel)) {
        return student.stream === targetSubject.stream;
      }
      return true;
    }

    return false;
  });
}

/**
 * Calculates complete student attendance statistics overall and subject-by-subject.
 */
export function computeStudentAttendanceSummary(
  student: Student,
  attendanceRecords: AttendanceRecord[],
  subjects: Subject[],
  facultyList?: Faculty[]
): StudentAttendanceSummary {
  // Filter all attendance records for this student
  const studentRecords = attendanceRecords
    .filter((r) => r.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalClasses = studentRecords.length;
  const presentCount = studentRecords.filter((r) => r.status === 'Present').length;
  const absentCount = studentRecords.filter((r) => r.status === 'Absent').length;
  const lateCount = studentRecords.filter((r) => r.status === 'Late').length;
  const excusedCount = studentRecords.filter((r) => r.status === 'Excused').length;

  // Effective presence (Present + Excused + 0.5 * Late) or standard Present + Late
  const effectivePresent = presentCount + lateCount + excusedCount;
  const attendancePercentage = totalClasses > 0 ? Math.round((effectivePresent / totalClasses) * 100) : 100;

  let status: 'Excellent' | 'Good' | 'Average' | 'Critical Shortage' = 'Good';
  if (attendancePercentage >= 90) {
    status = 'Excellent';
  } else if (attendancePercentage >= 75) {
    status = 'Good';
  } else if (attendancePercentage >= 65) {
    status = 'Average';
  } else {
    status = 'Critical Shortage';
  }

  // Calculate subject-wise breakdown for enrolled subjects
  const enrolledSubs = getEnrolledSubjectsForStudent(student, subjects);
  const subjectWise: SubjectAttendanceStat[] = enrolledSubs.map((sub) => {
    const subRecords = studentRecords.filter((r) => r.subjectId === sub.id);
    const subTotal = subRecords.length;
    const subPresent = subRecords.filter((r) => r.status === 'Present').length;
    const subAbsent = subRecords.filter((r) => r.status === 'Absent').length;
    const subLate = subRecords.filter((r) => r.status === 'Late').length;
    const subExcused = subRecords.filter((r) => r.status === 'Excused').length;

    const subEffective = subPresent + subLate + subExcused;
    const subPercentage = subTotal > 0 ? Math.round((subEffective / subTotal) * 100) : 100;
    const assignedFaculty = facultyList?.find((f) => f.id === sub.facultyId);

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      facultyName: assignedFaculty ? assignedFaculty.name : undefined,
      totalClasses: subTotal,
      presentCount: subPresent,
      absentCount: subAbsent,
      lateCount: subLate,
      excusedCount: subExcused,
      percentage: subPercentage,
    };
  });

  return {
    studentId: student.id,
    totalClasses,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendancePercentage,
    status,
    subjectWise,
    recentLogs: studentRecords.slice(0, 15),
  };
}

export function getAttendanceStatusBadge(status: AttendanceStatus): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status) {
    case 'Present':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Present',
      };
    case 'Absent':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        label: 'Absent',
      };
    case 'Late':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Late',
      };
    case 'Excused':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'Excused Leave',
      };
  }
}

