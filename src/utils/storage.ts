import { INITIAL_BADGES, ALL_QUESTIONS_POOL } from '../data/bibleQuestions';
import type { LanguageMode, Question, UserStats } from '../types/quiz';

const STATS_KEY = 'quizmanna_stats_v1';
const LEGACY_STATS_KEY = 'tamil_bible_quiz_stats_v2';
const SAVED_QUESTIONS_KEY = 'quizmanna_saved_questions_v1';

export function getSavedQuestionsMap(): Record<string, Question> {
  try {
    const raw = localStorage.getItem(SAVED_QUESTIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveQuestionsMap(map: Record<string, Question>): void {
  try {
    localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota issues
  }
}

export function getInitialStats(): UserStats {
  return {
    totalScore: 0,
    gamesPlayed: 0,
    totalCorrect: 0,
    highestStreak: 0,
    currentStreak: 0,
    savedQuestionIds: [],
    language: 'both', // default bilingual
    badges: INITIAL_BADGES,
  };
}

export function loadUserStats(): UserStats {
  try {
    let raw = localStorage.getItem(STATS_KEY);
    let isLegacy = false;
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STATS_KEY);
      isLegacy = true;
    }
    if (!raw) return getInitialStats();

    const parsed = JSON.parse(raw);
    let savedIds: string[] = Array.isArray(parsed.savedQuestionIds) ? parsed.savedQuestionIds : [];

    // Filter out old hardcoded dummy placeholder IDs if saved questions store is empty
    const savedMap = getSavedQuestionsMap();
    if (Object.keys(savedMap).length === 0) {
      // If legacy had only the 3 dummy genesis IDs, clear them so user has clean slate
      if (
        savedIds.length === 3 &&
        savedIds.includes('gen_1_1') &&
        savedIds.includes('gen_1_2') &&
        savedIds.includes('gen_1_3')
      ) {
        savedIds = [];
      }
    }

    const stats: UserStats = {
      ...getInitialStats(),
      ...parsed,
      savedQuestionIds: savedIds,
      language: parsed.language || 'both',
      badges: INITIAL_BADGES.map((badge) => ({
        ...badge,
        unlocked:
          parsed.badges?.find((b: { id: string; unlocked: boolean }) => b.id === badge.id)?.unlocked || false,
      })),
    };

    if (isLegacy) {
      saveUserStats(stats);
    }
    return stats;
  } catch {
    return getInitialStats();
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore quota issues
  }
}

export function setAppLanguage(lang: LanguageMode): void {
  const current = loadUserStats();
  current.language = lang;
  saveUserStats(current);
}

export function updateStatsAfterGame(
  score: number,
  correctCount: number,
  streakAchieved: number,
  isGenesisGame: boolean = false
): { stats: UserStats; newlyUnlockedBadges: string[] } {
  const current = loadUserStats();
  const newlyUnlocked: string[] = [];

  const updated: UserStats = {
    ...current,
    totalScore: current.totalScore + score,
    gamesPlayed: current.gamesPlayed + 1,
    totalCorrect: current.totalCorrect + correctCount,
    highestStreak: Math.max(current.highestStreak, streakAchieved),
    currentStreak: streakAchieved,
    lastPlayedDate: new Date().toISOString().split('T')[0],
  };

  // Evaluate badge unlocks
  updated.badges = updated.badges.map((badge) => {
    if (badge.unlocked) return badge;

    let unlock = false;
    if (badge.id === 'first_win' && updated.gamesPlayed >= 1) unlock = true;
    if (badge.id === 'streak_5' && updated.highestStreak >= 5) unlock = true;
    if (badge.id === 'bible_scholar' && updated.totalScore >= 100) unlock = true;
    if (badge.id === 'master_wisdom' && streakAchieved >= 5 && score >= 50) unlock = true;
    if (badge.id === 'genesis_explorer' && isGenesisGame) unlock = true;

    if (unlock) {
      newlyUnlocked.push(badge.title);
      return { ...badge, unlocked: true };
    }
    return badge;
  });

  saveUserStats(updated);
  return { stats: updated, newlyUnlockedBadges: newlyUnlocked };
}

export function toggleBookmarkQuestion(questionOrId: Question | string): boolean {
  const stats = loadUserStats();
  const map = getSavedQuestionsMap();

  const id = typeof questionOrId === 'string' ? questionOrId : questionOrId.id;
  const isCurrentlySaved = stats.savedQuestionIds.includes(id) || !!map[id];

  let isNowSaved = false;

  if (isCurrentlySaved) {
    // Remove
    stats.savedQuestionIds = stats.savedQuestionIds.filter((item) => item !== id);
    delete map[id];
    isNowSaved = false;
  } else {
    // Add
    stats.savedQuestionIds.push(id);
    if (typeof questionOrId !== 'string') {
      map[id] = questionOrId;
    } else {
      const fallback = ALL_QUESTIONS_POOL.find((q) => q.id === id);
      if (fallback) {
        map[id] = fallback;
      }
    }
    isNowSaved = true;
  }

  saveQuestionsMap(map);
  saveUserStats(stats);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('quizmanna_bookmarks_changed', { detail: { id, isNowSaved } }));
  }

  return isNowSaved;
}

export function removeBookmarkedQuestion(questionId: string): void {
  const stats = loadUserStats();
  const map = getSavedQuestionsMap();

  stats.savedQuestionIds = stats.savedQuestionIds.filter((item) => item !== questionId);
  delete map[questionId];

  saveQuestionsMap(map);
  saveUserStats(stats);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('quizmanna_bookmarks_changed', { detail: { id: questionId, isNowSaved: false } }));
  }
}

export function isQuestionBookmarked(questionId: string): boolean {
  const stats = loadUserStats();
  const map = getSavedQuestionsMap();
  return stats.savedQuestionIds.includes(questionId) || !!map[questionId];
}

export function getBookmarkedQuestions(): Question[] {
  const stats = loadUserStats();
  const map = getSavedQuestionsMap();

  const result: Question[] = [];
  const seenIds = new Set<string>();

  // First collect questions in stats.savedQuestionIds order
  for (const id of stats.savedQuestionIds) {
    if (seenIds.has(id)) continue;
    if (map[id]) {
      result.push(map[id]);
      seenIds.add(id);
    } else {
      const fallback = ALL_QUESTIONS_POOL.find((q) => q.id === id);
      if (fallback) {
        result.push(fallback);
        map[id] = fallback; // sync cache
        seenIds.add(id);
      }
    }
  }

  // Also include any questions in map that might have missed savedQuestionIds sync
  for (const [id, q] of Object.entries(map)) {
    if (!seenIds.has(id)) {
      result.push(q);
      seenIds.add(id);
      stats.savedQuestionIds.push(id);
    }
  }

  return result;
}
