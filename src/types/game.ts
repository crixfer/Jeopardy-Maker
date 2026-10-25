export interface Question {
  id: string;
  points: number;
  question: string;
  answer: string;
  hint?: string;
  type?: 'standard' | 'multiple_choice' | 'true_false' | 'daily_double';
  options?: string[]; // For multiple choice
  answered?: boolean;
  answeredByTeamId?: string;
  isDailyDouble?: boolean;
}

export interface Category {
  id: string;
  title: string;
  color?: string; // Optional accent color
  questions: Question[];
}

export interface Game {
  id: string;
  title: string;
  description: string;
  creatorId?: string;
  isPublic?: boolean;
  categories: Category[];
  tieBreakerQuestions?: TieBreakerQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  avatarId: string;
  color: string;
  score: number;
  streak: number;
  isConnected?: boolean;
  lastBuzzedAt?: number;
}

export interface ActiveQuestionState {
  categoryId: string;
  categoryTitle: string;
  questionId: string;
  questionIndex: number;
  points: number;
  question: string;
  answer: string;
  hint?: string;
  type?: string;
  options?: string[];
  isDailyDouble?: boolean;
  revealedAnswer?: boolean;
  timerDuration: number; // in seconds, e.g. 30
  remainingSeconds: number;
  isPaused: boolean;
  openedAt: number;
}

export interface BuzzerQueueItem {
  teamId: string;
  teamName: string;
  avatarId: string;
  buzzedAt: number;
}

export interface GameSession {
  id: string;
  pin: string;
  gameId: string;
  gameTitle: string;
  hostId: string;
  status: 'lobby' | 'active' | 'question_open' | 'question_buzzed' | 'question_revealed' | 'finished';
  categories: Category[];
  teams: Record<string, Team>;
  activeQuestion?: ActiveQuestionState | null;
  buzzedTeam?: BuzzerQueueItem | null;
  buzzerQueue?: BuzzerQueueItem[];
  attemptedTeamIds?: string[]; // Teams that have already attempted this question
  answeredQuestionIds: string[];
  tieBreakerQuestions?: TieBreakerQuestion[];
  lastAction?: string; // For sound triggers in clients: 'buzz', 'correct', 'wrong', 'timeup'
  lastActionTimestamp?: number;
  defaultTimerSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  teamName: string;
  avatarId: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  highestScore: number;
  lastPlayedAt: string;
}

export interface TieBreakerQuestion {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

export interface TieBreakerState {
  active: boolean;
  tiedTeamIds: string[];
  currentQuestionIndex: number;
  questions: TieBreakerQuestion[];
  winnerTeamId?: string | null;
  tieBreakerScores: Record<string, number>; // Dedicated tie-break points only (does not inflate leaderboard totalScore)
}
