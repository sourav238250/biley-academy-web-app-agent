import { AdminUser, AdminRole, NavigationTab } from '../types';

export type Permission =
  | 'STUDENT_ADMISSION_WRITE'
  | 'STUDENT_DELETE'
  | 'SUBJECT_DISTRIBUTION_WRITE'
  | 'FACULTY_ALLOCATION_WRITE'
  | 'TIMETABLE_MANAGE'
  | 'ATTENDANCE_MARK'
  | 'EXAMINATION_SCHEDULE_WRITE'
  | 'RESULTS_MARKS_ENTRY'
  | 'FEE_COLLECTION_WRITE'
  | 'FEES_COLLECT_DEPOSIT'
  | 'FEES_MANAGE_STRUCTURE'
  | 'FEE_TRANSACTION_DELETE'
  | 'FINANCIAL_REPORTS_VIEW'
  | 'DISBURSEMENT_CREATE'
  | 'DISBURSEMENT_APPROVE'
  | 'DISBURSEMENT_DELETE'
  | 'DISBURSEMENT_VIEW'
  | 'RESTRICTIONS_MANAGE'
  | 'QUESTION_BANK_MANAGE'
  | 'ASSIGNMENT_CREATE'
  | 'ADMIN_SETTINGS_RESET'
  | 'DATABASE_BACKUP_RESTORE';

export interface RoleConfig {
  role: AdminRole;
  title: string;
  badgeColor: string;
  description: string;
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<AdminRole, RoleConfig> = {
  'Super Admin / Director': {
    role: 'Super Admin / Director',
    title: 'Director & Full Institute Authority',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Unrestricted master access across admissions, faculty, curriculum, examinations, attendance, question bank, fee collections, ledger disbursements, and profit allocations.',
    permissions: [
      'STUDENT_ADMISSION_WRITE',
      'STUDENT_DELETE',
      'SUBJECT_DISTRIBUTION_WRITE',
      'FACULTY_ALLOCATION_WRITE',
      'TIMETABLE_MANAGE',
      'ATTENDANCE_MARK',
      'EXAMINATION_SCHEDULE_WRITE',
      'RESULTS_MARKS_ENTRY',
      'FEE_COLLECTION_WRITE',
      'FEES_COLLECT_DEPOSIT',
      'FEES_MANAGE_STRUCTURE',
      'FEE_TRANSACTION_DELETE',
      'FINANCIAL_REPORTS_VIEW',
      'DISBURSEMENT_CREATE',
      'DISBURSEMENT_APPROVE',
      'DISBURSEMENT_DELETE',
      'DISBURSEMENT_VIEW',
      'RESTRICTIONS_MANAGE',
      'QUESTION_BANK_MANAGE',
      'ASSIGNMENT_CREATE',
      'ADMIN_SETTINGS_RESET',
      'DATABASE_BACKUP_RESTORE',
    ],
  },
  'Academic Administrator': {
    role: 'Academic Administrator',
    title: 'Academic Affairs & Admissions Dean',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Authorized for student admissions, subject curriculum, attendance administration, question bank, examination scheduling, and marks evaluation.',
    permissions: [
      'STUDENT_ADMISSION_WRITE',
      'SUBJECT_DISTRIBUTION_WRITE',
      'FACULTY_ALLOCATION_WRITE',
      'TIMETABLE_MANAGE',
      'ATTENDANCE_MARK',
      'EXAMINATION_SCHEDULE_WRITE',
      'RESULTS_MARKS_ENTRY',
      'FINANCIAL_REPORTS_VIEW',
      'DISBURSEMENT_VIEW',
      'QUESTION_BANK_MANAGE',
      'ASSIGNMENT_CREATE',
      'DATABASE_BACKUP_RESTORE',
    ],
  },
  'Accounts & Cashier': {
    role: 'Accounts & Cashier',
    title: 'Treasury & Fee Cashier',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Authorized for fee collection deposits, official receipts, disbursement payments across ledgers, and profit & loss accounting.',
    permissions: [
      'FEE_COLLECTION_WRITE',
      'FEES_COLLECT_DEPOSIT',
      'FEES_MANAGE_STRUCTURE',
      'FEE_TRANSACTION_DELETE',
      'FINANCIAL_REPORTS_VIEW',
      'DISBURSEMENT_CREATE',
      'DISBURSEMENT_VIEW',
      'DATABASE_BACKUP_RESTORE',
    ],
  },
  'Faculty Mentor': {
    role: 'Faculty Mentor',
    title: 'Senior Faculty & Exam Evaluator',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Authorized for daily student attendance marking, weekly lecture timetables, question authoring, assignment creation, and exam result marks scoring.',
    permissions: [
      'TIMETABLE_MANAGE',
      'ATTENDANCE_MARK',
      'RESULTS_MARKS_ENTRY',
      'QUESTION_BANK_MANAGE',
      'ASSIGNMENT_CREATE',
    ],
  },
};

/**
 * Checks if a user possesses a specific permission
 */
export function hasPermission(user: AdminUser | null, permission: Permission | string): boolean {
  if (!user) return false;
  const roleConfig = ROLE_DEFINITIONS[user.role];
  if (!roleConfig) return false;
  
  // Normalization aliases
  if (permission === 'FEES_COLLECT_DEPOSIT' && roleConfig.permissions.includes('FEE_COLLECTION_WRITE')) {
    return true;
  }
  if (permission === 'FEE_COLLECTION_WRITE' && roleConfig.permissions.includes('FEES_COLLECT_DEPOSIT')) {
    return true;
  }

  return roleConfig.permissions.includes(permission as Permission);
}

/**
 * Evaluates section-level access and editing rights
 */
export function evaluateSectionAuthorization(
  user: AdminUser | null,
  sectionTab: NavigationTab
): {
  isAllowed: boolean;
  canWrite: boolean;
  roleTitle: string;
  badgeLabel: string;
  badgeStyle: string;
  notice?: string;
  requiredRole?: string;
} {
  if (sectionTab === 'student-portal') {
    return {
      isAllowed: true,
      canWrite: false,
      roleTitle: user ? user.role : 'Student / Parent Guest',
      badgeLabel: 'Public Self-Service Portal',
      badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }

  if (!user) {
    return {
      isAllowed: false,
      canWrite: false,
      roleTitle: 'Unauthenticated Guest',
      badgeLabel: 'Authentication Required',
      badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
      notice: 'Please sign in with staff credentials to access administrative ERP sections.',
      requiredRole: 'Staff / Admin',
    };
  }

  const role = user.role;

  switch (sectionTab) {
    case 'dashboard':
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: `${role} View`,
        badgeStyle: ROLE_DEFINITIONS[role].badgeColor,
      };

    case 'students':
      if (role === 'Accounts & Cashier' || role === 'Faculty Mentor') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Read-Only Directory View',
          badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
          notice: `Your role (${role}) has view-only access to Student Records. New admissions require Academic Administrator or Director authorization.`,
          requiredRole: 'Academic Administrator / Director',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: 'Full Admission Authority',
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };

    case 'subjects':
      if (role === 'Accounts & Cashier') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Read-Only Curriculum View',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
          notice: 'Subject distribution and syllabus edits require Academic Administrator or Director role.',
          requiredRole: 'Academic Administrator / Director',
        };
      }
      if (role === 'Faculty Mentor') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Faculty Curriculum View',
          badgeStyle: 'bg-blue-50 text-blue-700 border-blue-300',
          notice: 'You are viewing mapped subjects. Creating or removing subjects is reserved for Academic Dean.',
          requiredRole: 'Academic Administrator',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: 'Curriculum Master Control',
        badgeStyle: 'bg-purple-50 text-purple-800 border-purple-300',
      };

    case 'faculty':
      if (role === 'Accounts & Cashier') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Staff Directory View',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
          notice: 'Faculty onboarding and timetable adjustments require Academic Administrator or Faculty Mentor permissions.',
          requiredRole: 'Academic Administrator',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: role === 'Faculty Mentor' ? 'Timetable Management' : 'Full Faculty Management',
        badgeStyle: 'bg-blue-50 text-blue-800 border-blue-300',
      };

    case 'attendance':
      if (role === 'Accounts & Cashier') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Attendance Register (Read-Only)',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
          notice: 'Attendance marking is reserved for assigned Faculty Mentors and Academic Administrators.',
          requiredRole: 'Faculty Mentor / Academic Admin',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: role === 'Faculty Mentor' ? 'Faculty Daily Attendance' : 'Attendance Master Controller',
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };

    case 'question-bank':
      if (role === 'Accounts & Cashier') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Question Bank (Read-Only)',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
          notice: 'Question authoring and assignment creation are reserved for Faculty Mentors and Academic Administrators.',
          requiredRole: 'Faculty Mentor / Academic Admin',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: 'Question Authoring & Assignment Authority',
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
      };

    case 'exams':
      if (role === 'Accounts & Cashier') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Exam Schedule (Read-Only)',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
          notice: 'Exam scheduling requires Academic Administrator or Director permissions.',
          requiredRole: 'Academic Administrator',
        };
      }
      return {
        isAllowed: true,
        canWrite: role !== 'Faculty Mentor',
        roleTitle: role,
        badgeLabel: role === 'Faculty Mentor' ? 'Exam Invigilation View' : 'Exam Controller Authority',
        badgeStyle: 'bg-blue-50 text-blue-800 border-blue-300',
        notice: role === 'Faculty Mentor' ? 'Faculty Mentors can evaluate marks in Results tab, while Exam dates are set by Academic Head.' : undefined,
      };

    case 'results':
      if (role === 'Accounts & Cashier') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Academic Scorecards (Read-Only)',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
          notice: 'Marks evaluation is restricted to Academic Heads and Faculty Mentors.',
          requiredRole: 'Academic Administrator / Faculty Mentor',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: 'Evaluation & Marks Entry Authorized',
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };

    case 'fees':
      if (role === 'Faculty Mentor') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Fee Registry (Restricted - Read Only)',
          badgeStyle: 'bg-rose-50 text-rose-800 border-rose-300',
          notice: 'Fee collection deposits and receipts are strictly restricted to the Accounts & Cashier department.',
          requiredRole: 'Accounts & Cashier / Director',
        };
      }
      if (role === 'Academic Administrator') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Fee Ledgers (Auditor View)',
          badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
          notice: 'Academic Administrator can review fee status and dues, while fee transactions must be deposited by Cashier.',
          requiredRole: 'Accounts & Cashier',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: 'Fee Collection & Treasury Authorized',
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };

    case 'disbursements':
      if (role === 'Faculty Mentor') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Disbursements & P&L (Restricted - Read Only)',
          badgeStyle: 'bg-rose-50 text-rose-800 border-rose-300',
          notice: 'Payment disbursements against profit and institutional ledgers require Accounts or Director authority.',
          requiredRole: 'Accounts & Cashier / Director',
        };
      }
      if (role === 'Academic Administrator') {
        return {
          isAllowed: true,
          canWrite: false,
          roleTitle: role,
          badgeLabel: 'Ledgers & Profit Auditor View',
          badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
          notice: 'Academic Dean can view financial ledger disbursements and profit margins. Authorizing payments requires Accounts Cashier or Director.',
          requiredRole: 'Accounts & Cashier / Director',
        };
      }
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: 'Ledger Disbursements & Profit Allocation Authorized',
        badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      };

    default:
      return {
        isAllowed: true,
        canWrite: true,
        roleTitle: role,
        badgeLabel: 'Authorized',
        badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
      };
  }
}
