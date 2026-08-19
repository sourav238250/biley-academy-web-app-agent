import {
  AttendanceRecord,
  Faculty,
  Student,
  Subject,
  Exam,
  ExamResult,
  FeeDeposit,
  TimetableSlot,
} from '../types';
import {
  INITIAL_ATTENDANCE,
  INITIAL_FACULTY,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_EXAMS,
  INITIAL_RESULTS,
  INITIAL_DEPOSITS,
  INITIAL_TIMETABLE,
} from '../data/initialData';

export interface AppStateData {
  students: Student[];
  faculty: Faculty[];
  subjects: Subject[];
  exams: Exam[];
  results: ExamResult[];
  deposits: FeeDeposit[];
  timetable: TimetableSlot[];
  attendance: AttendanceRecord[];
}

const STORAGE_KEYS = {
  STUDENTS: 'biley_academy_students_v1',
  FACULTY: 'biley_academy_faculty_v1',
  SUBJECTS: 'biley_academy_subjects_v1',
  EXAMS: 'biley_academy_exams_v1',
  RESULTS: 'biley_academy_results_v1',
  DEPOSITS: 'biley_academy_deposits_v1',
  TIMETABLE: 'biley_academy_timetable_v1',
  ATTENDANCE: 'biley_academy_attendance_v1',
};

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return fallback;
  }
}

export function saveItemToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export function loadInitialState(): AppStateData {
  return {
    students: loadFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS),
    faculty: loadFromStorage<Faculty[]>(STORAGE_KEYS.FACULTY, INITIAL_FACULTY),
    subjects: loadFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS),
    exams: loadFromStorage<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS),
    results: loadFromStorage<ExamResult[]>(STORAGE_KEYS.RESULTS, INITIAL_RESULTS),
    deposits: loadFromStorage<FeeDeposit[]>(STORAGE_KEYS.DEPOSITS, INITIAL_DEPOSITS),
    timetable: loadFromStorage<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE),
    attendance: loadFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
  };
}

export function saveToStorage(data: AppStateData): void {
  saveItemToStorage(STORAGE_KEYS.STUDENTS, data.students);
  saveItemToStorage(STORAGE_KEYS.FACULTY, data.faculty);
  saveItemToStorage(STORAGE_KEYS.SUBJECTS, data.subjects);
  saveItemToStorage(STORAGE_KEYS.EXAMS, data.exams);
  saveItemToStorage(STORAGE_KEYS.RESULTS, data.results);
  saveItemToStorage(STORAGE_KEYS.DEPOSITS, data.deposits);
  saveItemToStorage(STORAGE_KEYS.TIMETABLE, data.timetable);
  saveItemToStorage(STORAGE_KEYS.ATTENDANCE, data.attendance);
}

export function resetToInitialMockData(): AppStateData {
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.FACULTY);
  localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  localStorage.removeItem(STORAGE_KEYS.EXAMS);
  localStorage.removeItem(STORAGE_KEYS.RESULTS);
  localStorage.removeItem(STORAGE_KEYS.DEPOSITS);
  localStorage.removeItem(STORAGE_KEYS.TIMETABLE);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  return {
    students: INITIAL_STUDENTS,
    faculty: INITIAL_FACULTY,
    subjects: INITIAL_SUBJECTS,
    exams: INITIAL_EXAMS,
    results: INITIAL_RESULTS,
    deposits: INITIAL_DEPOSITS,
    timetable: INITIAL_TIMETABLE,
    attendance: INITIAL_ATTENDANCE,
  };
}

export interface BackupPayload {
  version: string;
  institution: string;
  curriculum: string;
  exportTimestamp: string;
  exportDateFormatted: string;
  counts: {
    students: number;
    faculty: number;
    subjects: number;
    exams: number;
    results: number;
    deposits: number;
    timetable: number;
    attendance: number;
  };
  data: AppStateData;
}

export function exportDatabaseBackup(data: AppStateData): { filename: string; sizeKb: string } {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const dateFormatted = now.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const payload: BackupPayload = {
    version: '2.1.0',
    institution: 'Biley Academy ERP System',
    curriculum: 'Standardized Classes 1 to 12 (Math, Physics, Chemistry, Biology, CS, CA, English)',
    exportTimestamp: now.toISOString(),
    exportDateFormatted: dateFormatted,
    counts: {
      students: data.students.length,
      faculty: data.faculty.length,
      subjects: data.subjects.length,
      exams: data.exams.length,
      results: data.results.length,
      deposits: data.deposits.length,
      timetable: data.timetable.length,
      attendance: (data.attendance || []).length,
    },
    data,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const filename = `biley_academy_db_backup_${now.toISOString().slice(0, 10)}_${now.getHours()}${now.getMinutes().toString().padStart(2, '0')}.json`;
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const sizeKb = (new Blob([jsonString]).size / 1024).toFixed(1);
  return { filename, sizeKb };
}

export function parseDatabaseBackup(jsonString: string): AppStateData {
  const parsed = JSON.parse(jsonString);
  // Support both wrapped payload and direct AppStateData object
  const stateData: AppStateData = parsed.data ? parsed.data : parsed;

  if (
    !Array.isArray(stateData.students) ||
    !Array.isArray(stateData.faculty) ||
    !Array.isArray(stateData.subjects) ||
    !Array.isArray(stateData.exams) ||
    !Array.isArray(stateData.results) ||
    !Array.isArray(stateData.deposits) ||
    !Array.isArray(stateData.timetable)
  ) {
    throw new Error('Invalid database backup structure. Required entities are missing.');
  }

  // Ensure attendance array exists
  if (!Array.isArray(stateData.attendance)) {
    stateData.attendance = [];
  }

  return stateData;
}

export function getEstimatedStorageUsage(): string {
  try {
    let totalLength = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const val = localStorage.getItem(key);
      if (val) totalLength += val.length;
    }
    return (totalLength / 1024).toFixed(1) + ' KB';
  } catch {
    return '0.0 KB';
  }
}

export { STORAGE_KEYS };
