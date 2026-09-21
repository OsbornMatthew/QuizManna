export type Difficulty = 'easy' | 'medium' | 'hard';
export type LanguageMode = 'ta' | 'en' | 'both';

export type CategoryId = 
  | 'old_testament'
  | 'new_testament'
  | 'gospels'
  | 'miracles_parables'
  | 'prophets_kings'
  | 'verse_match'
  | 'daily_challenge'
  | 'all_books';

export interface Question {
  id: string;
  categoryId?: CategoryId;
  bookId?: string;
  chapter?: number;
  verseNum?: number;
  question: string; // Tamil
  questionEn: string; // English
  options: [string, string, string, string]; // Tamil
  optionsEn: [string, string, string, string]; // English
  correctAnswer: number; // 0..3
  correctAnswerEn?: number; // 0..3 (defaults to correctAnswer if same)
  reference: string; // Tamil e.g. "ஆதியாகமம் 1:1"
  referenceEn: string; // English e.g. "Genesis 1:1"
  explanation: string;
  explanationEn: string;
  difficulty: Difficulty;
}

export interface Category {
  id: CategoryId;
  title: string; // Tamil
  titleEn: string; // English
  subtitle: string; // Tamil
  subtitleEn: string; // English
  englishTitle: string;
  iconName: string;
  gradient: string;
  borderColor: string;
  textColor: string;
}

export interface BibleBook {
  id: string;
  title: string; // Tamil
  englishTitle: string;
  testament: 'old' | 'new';
  group: string; // e.g. நியாயப்பிரமாணம் / Law
  groupEn: string;
  chapters: number;
  order: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  selectedOption: number | null;
  isAnswered: boolean;
  score: number;
  streak: number;
  lifelines: {
    fiftyFifty: boolean;
    extraTime: boolean;
    skip: boolean;
  };
  eliminatedOptions: number[];
  timeLeft: number;
  userAnswers: {
    question: Question;
    selectedIndex: number;
    isCorrect: boolean;
  }[];
}

export interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  totalCorrect: number;
  highestStreak: number;
  currentStreak: number;
  lastPlayedDate?: string;
  savedQuestionIds: string[];
  language: LanguageMode;
  badges: Badge[];
}

export interface Badge {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  unlocked: boolean;
}
