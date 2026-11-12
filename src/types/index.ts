export type IPClass = 'A' | 'B' | 'C' | 'D' | 'E';

export type AddressType = 'Public' | 'Private' | 'Loopback' | 'APIPA' | 'Network' | 'Broadcast' | 'Reserved';

export interface Student {
  id: string;
  name: string;
  classGroup: string; // e.g. "عاشر 1", "عاشر 2"
  nationalId?: string; // رقم الهوية أو رقم القيد
  createdAt: number;
}

export interface QuestionAttempt {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timestamp: number;
  timeSpentSeconds?: number;
}

export interface StudentProgress {
  studentId: string;
  completedLessons: string[]; // lesson IDs
  attempts: QuestionAttempt[];
  mistakeQuestionIds: string[]; // questions currently in mistake bank (not yet mastered)
  masteredMistakeIds: string[]; // questions previously wrong that have been mastered in mistake training
  totalScore: number;
  earnedBadges: string[];
}

export interface IPAnalysisResult {
  ip: string;
  binary: string[];
  octets: number[];
  detectedClass: IPClass;
  defaultSubnetMask: string;
  cidr: number;
  networkAddress: string;
  hostAddress: string;
  broadcastAddress: string;
  addressType: AddressType;
  isPrivate: boolean;
  explanationAr: string;
}

export interface Question {
  id: string;
  topicId: 'structure' | 'classes' | 'subnet' | 'net_host' | 'private_public' | 'special';
  difficulty: 'easy' | 'medium' | 'hard';
  questionAr: string;
  optionsAr: string[];
  correctAnswer: number;
  explanationAr: string;
  relatedIp?: string;
  encouragementAr?: string;
}

export interface LessonSection {
  id: string;
  titleAr: string;
  contentAr: string[];
  keyPointsAr: string[];
  interactiveIp?: string;
  suggested3DMode?: 'octets' | 'topology' | 'packets';
  sampleQuestion: Question;
}

export interface Lesson {
  id: string;
  titleAr: string;
  shortDescAr: string;
  iconName: string;
  sections: LessonSection[];
}

export interface Badge {
  id: string;
  titleAr: string;
  descAr: string;
  icon: string;
  color: string;
}

export type ActiveTab = 'learn' | 'quiz' | 'mistakes' | '3dlab' | 'teacher';
