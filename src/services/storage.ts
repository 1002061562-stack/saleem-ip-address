import { Student, StudentProgress, QuestionAttempt } from '../types';
import { DEFAULT_STUDENTS, INITIAL_PROGRESS_MAP } from '../data/defaultStudents';
import { ALL_QUESTIONS } from '../data/curriculum';

const STORAGE_KEY_STUDENTS = 'ip_lab_students_v1';
const STORAGE_KEY_PROGRESS = 'ip_lab_progress_v1';
const STORAGE_KEY_ACTIVE_STUDENT = 'ip_lab_active_student_v1';

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STUDENTS;
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export function saveStudents(students: Student[]) {
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
}

export function getActiveStudentId(): string {
  const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_STUDENT);
  const students = getStudents();
  if (saved && students.some(s => s.id === saved)) {
    return saved;
  }
  const fallback = students[0]?.id || 'std_101';
  localStorage.setItem(STORAGE_KEY_ACTIVE_STUDENT, fallback);
  return fallback;
}

export function setActiveStudentId(studentId: string) {
  localStorage.setItem(STORAGE_KEY_ACTIVE_STUDENT, studentId);
}

export function getAllProgress(): Record<string, StudentProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(INITIAL_PROGRESS_MAP));
      return INITIAL_PROGRESS_MAP;
    }
    return JSON.parse(raw) || INITIAL_PROGRESS_MAP;
  } catch {
    return INITIAL_PROGRESS_MAP;
  }
}

export function saveAllProgress(progressMap: Record<string, StudentProgress>) {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressMap));
}

export function getStudentProgress(studentId: string): StudentProgress {
  const all = getAllProgress();
  if (all[studentId]) {
    return all[studentId];
  }
  const fresh: StudentProgress = {
    studentId,
    completedLessons: [],
    attempts: [],
    mistakeQuestionIds: [],
    masteredMistakeIds: [],
    totalScore: 0,
    earnedBadges: [],
  };
  all[studentId] = fresh;
  saveAllProgress(all);
  return fresh;
}

export function recordQuestionAnswer(
  studentId: string,
  questionId: string,
  selectedAnswer: number,
  isCorrect: boolean,
  isMistakePractice: boolean = false
): { progress: StudentProgress; newlyEarnedBadges: string[]; newlyMastered: boolean } {
  const all = getAllProgress();
  const current = getStudentProgress(studentId);

  const attempt: QuestionAttempt = {
    questionId,
    selectedAnswer,
    isCorrect,
    timestamp: Date.now(),
  };

  const attempts = [...current.attempts, attempt];
  let mistakeQuestionIds = [...current.mistakeQuestionIds];
  let masteredMistakeIds = [...current.masteredMistakeIds];
  let newlyMastered = false;

  if (isCorrect) {
    if (isMistakePractice) {
      // If student successfully answered a mistake during remediation:
      if (mistakeQuestionIds.includes(questionId)) {
        mistakeQuestionIds = mistakeQuestionIds.filter(id => id !== questionId);
        if (!masteredMistakeIds.includes(questionId)) {
          masteredMistakeIds.push(questionId);
          newlyMastered = true;
        }
      }
    } else {
      // In normal quiz, if already in mistake list, remove if correct
      mistakeQuestionIds = mistakeQuestionIds.filter(id => id !== questionId);
    }
  } else {
    // If answered wrong, add to mistake list if not already present
    if (!mistakeQuestionIds.includes(questionId)) {
      mistakeQuestionIds.push(questionId);
    }
    // Also if it was previously considered mastered, it goes back to needs practice
    masteredMistakeIds = masteredMistakeIds.filter(id => id !== questionId);
  }

  // Calculate score: 10 points per correct answer, bonus 15 points per mastered mistake
  const totalCorrect = attempts.filter(a => a.isCorrect).length;
  const totalScore = totalCorrect * 10 + masteredMistakeIds.length * 15;

  // Check badges
  const earnedBadges = [...current.earnedBadges];
  const newlyEarnedBadges: string[] = [];

  const addBadge = (bId: string) => {
    if (!earnedBadges.includes(bId)) {
      earnedBadges.push(bId);
      newlyEarnedBadges.push(bId);
    }
  };

  if (totalCorrect >= 1) addBadge('first_step');

  const classQuestions = ALL_QUESTIONS.filter(q => q.topicId === 'classes').map(q => q.id);
  const correctClassAttempts = attempts.filter(a => classQuestions.includes(a.questionId) && a.isCorrect);
  if (correctClassAttempts.length >= 3) addBadge('class_master');

  const maskQuestions = ALL_QUESTIONS.filter(q => q.topicId === 'subnet' || q.topicId === 'net_host').map(q => q.id);
  const correctMaskAttempts = attempts.filter(a => maskQuestions.includes(a.questionId) && a.isCorrect);
  if (correctMaskAttempts.length >= 3) addBadge('mask_expert');

  const privQuestions = ALL_QUESTIONS.filter(q => q.topicId === 'private_public').map(q => q.id);
  const correctPrivAttempts = attempts.filter(a => privQuestions.includes(a.questionId) && a.isCorrect);
  if (correctPrivAttempts.length >= 3) addBadge('private_guardian');

  if (masteredMistakeIds.length >= 2 || (isMistakePractice && isCorrect)) {
    addBadge('mistake_crusher');
  }

  const updated: StudentProgress = {
    ...current,
    attempts,
    mistakeQuestionIds,
    masteredMistakeIds,
    totalScore,
    earnedBadges,
  };

  all[studentId] = updated;
  saveAllProgress(all);

  return { progress: updated, newlyEarnedBadges, newlyMastered };
}

export function completeLesson(studentId: string, lessonId: string) {
  const all = getAllProgress();
  const current = getStudentProgress(studentId);
  if (!current.completedLessons.includes(lessonId)) {
    current.completedLessons.push(lessonId);
    all[studentId] = current;
    saveAllProgress(all);
  }
}

export function resetStudentStats(studentId: string) {
  const all = getAllProgress();
  all[studentId] = {
    studentId,
    completedLessons: [],
    attempts: [],
    mistakeQuestionIds: [],
    masteredMistakeIds: [],
    totalScore: 0,
    earnedBadges: [],
  };
  saveAllProgress(all);
}
