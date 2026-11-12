import { Student, StudentProgress } from '../types';

export const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'std_101',
    name: 'يوسف أحمد المنصوري',
    classGroup: 'عاشر 1',
    nationalId: '10982341',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'std_102',
    name: 'سارة خالد الدوسري',
    classGroup: 'عاشر 1',
    nationalId: '10982342',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'std_103',
    name: 'عمر فهد العتيبي',
    classGroup: 'عاشر 1',
    nationalId: '10982343',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'std_104',
    name: 'فاطمة محمود الحربي',
    classGroup: 'عاشر 2',
    nationalId: '10982344',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'std_105',
    name: 'زيد طارق الشمري',
    classGroup: 'عاشر 2',
    nationalId: '10982345',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'std_106',
    name: 'ليلى إبراهيم السعيد',
    classGroup: 'عاشر 2',
    nationalId: '10982346',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'std_107',
    name: 'نور حسن القحطاني',
    classGroup: 'عاشر 3',
    nationalId: '10982347',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'std_108',
    name: 'عبدالله سامي الزهراني',
    classGroup: 'عاشر 3',
    nationalId: '10982348',
    createdAt: Date.now() - 86400000 * 1,
  },
];

export const INITIAL_PROGRESS_MAP: Record<string, StudentProgress> = {
  std_101: {
    studentId: 'std_101',
    completedLessons: ['lesson_structure', 'lesson_classes'],
    attempts: [
      { questionId: 'q_struct_1', selectedAnswer: 1, isCorrect: true, timestamp: Date.now() - 3600000 * 20 },
      { questionId: 'q_struct_2', selectedAnswer: 2, isCorrect: true, timestamp: Date.now() - 3600000 * 19 },
      { questionId: 'q_class_1', selectedAnswer: 0, isCorrect: true, timestamp: Date.now() - 3600000 * 18 },
      { questionId: 'q_class_2', selectedAnswer: 1, isCorrect: true, timestamp: Date.now() - 3600000 * 15 },
      { questionId: 'q_mask_3', selectedAnswer: 0, isCorrect: false, timestamp: Date.now() - 3600000 * 10 },
      { questionId: 'q_mask_5', selectedAnswer: 0, isCorrect: false, timestamp: Date.now() - 3600000 * 8 },
    ],
    mistakeQuestionIds: ['q_mask_3', 'q_mask_5'],
    masteredMistakeIds: [],
    totalScore: 40,
    earnedBadges: ['first_step', 'class_master'],
  },
  std_102: {
    studentId: 'std_102',
    completedLessons: ['lesson_structure', 'lesson_classes', 'lesson_subnet', 'lesson_private_public'],
    attempts: [
      { questionId: 'q_struct_1', selectedAnswer: 1, isCorrect: true, timestamp: Date.now() - 3600000 * 24 },
      { questionId: 'q_class_1', selectedAnswer: 0, isCorrect: true, timestamp: Date.now() - 3600000 * 22 },
      { questionId: 'q_mask_1', selectedAnswer: 2, isCorrect: true, timestamp: Date.now() - 3600000 * 18 },
      { questionId: 'q_priv_2', selectedAnswer: 2, isCorrect: true, timestamp: Date.now() - 3600000 * 12 },
      { questionId: 'q_spec_1', selectedAnswer: 0, isCorrect: true, timestamp: Date.now() - 3600000 * 6 },
    ],
    mistakeQuestionIds: [],
    masteredMistakeIds: ['q_priv_3'],
    totalScore: 95,
    earnedBadges: ['first_step', 'class_master', 'mask_expert', 'private_guardian', 'genius_architect'],
  },
  std_103: {
    studentId: 'std_103',
    completedLessons: ['lesson_structure'],
    attempts: [
      { questionId: 'q_struct_1', selectedAnswer: 1, isCorrect: true, timestamp: Date.now() - 3600000 * 5 },
      { questionId: 'q_struct_4', selectedAnswer: 0, isCorrect: false, timestamp: Date.now() - 3600000 * 4 },
      { questionId: 'q_class_2', selectedAnswer: 2, isCorrect: false, timestamp: Date.now() - 3600000 * 2 },
    ],
    mistakeQuestionIds: ['q_struct_4', 'q_class_2'],
    masteredMistakeIds: [],
    totalScore: 15,
    earnedBadges: ['first_step'],
  },
};
