import React, { useState, useEffect, useCallback } from 'react';
import { Home, BookOpen, Bookmark, Award } from 'lucide-react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { BooksScreen } from './components/BooksScreen';
import { ChaptersScreen } from './components/ChaptersScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { BookmarkScreen } from './components/BookmarkScreen';
import { StatsScreen } from './components/StatsScreen';
import type { BibleBook, CategoryId, LanguageMode, Question, UserStats } from './types/quiz';
import { ALL_BIBLE_BOOKS } from './data/bibleBooks';
import { 
  CATEGORIES, 
  ALL_QUESTIONS_POOL, 
  getQuestionsForBookAsync, 
  loadQuestionsForBook, 
  shuffleQuestionOptions 
} from './data/bibleQuestions';
import { 
  loadUserStats, 
  updateStatsAfterGame, 
  saveUserStats, 
  getInitialStats, 
  setAppLanguage 
} from './utils/storage';
import { sounds } from './utils/audio';

type Screen = 'home' | 'books' | 'chapters' | 'quiz' | 'result' | 'bookmarks' | 'stats';

export const App: React.FC = () => {
  // Navigation stack for true step-by-step back navigation
  const [screenStack, setScreenStack] = useState<Screen[]>(['home']);
  const currentScreen = screenStack[screenStack.length - 1];

  const [stats, setStats] = useState<UserStats>(loadUserStats());
  const [isSoundOn, setIsSoundOn] = useState<boolean>(sounds.isSoundEnabled);
  const [language, setLanguage] = useState<LanguageMode>(stats.language || 'both');

  // Filter for Books screen
  const [booksInitialFilter, setBooksInitialFilter] = useState<'all' | 'old' | 'new'>('all');

  // Selected Book for Chapters screen (default Genesis)
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(
    ALL_BIBLE_BOOKS.find((b) => b.id === 'genesis') || ALL_BIBLE_BOOKS[0]
  );

  // Drilldown hierarchy state for Bookmarks/Saved screen (Book -> Chapter -> Questions)
  const [savedBookKey, setSavedBookKey] = useState<string | null>(null);
  const [savedChapterNum, setSavedChapterNum] = useState<number | null>(null);

  // Active quiz session state
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [activeQuizTitle, setActiveQuizTitle] = useState<string>('');
  const [isGenesisSession, setIsGenesisSession] = useState<boolean>(false);
  
  // Last completed quiz results
  const [lastScore, setLastScore] = useState(0);
  const [lastCorrectCount, setLastCorrectCount] = useState(0);
  const [lastHighestStreak, setLastHighestStreak] = useState(0);
  const [lastAnswers, setLastAnswers] = useState<{ question: Question; selectedIndex: number; isCorrect: boolean }[]>([]);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<string[]>([]);

  const isEn = language === 'en';

  useEffect(() => {
    setStats(loadUserStats());
  }, [currentScreen]);

  useEffect(() => {
    const handleBookmarkChange = () => setStats(loadUserStats());
    window.addEventListener('quizmanna_bookmarks_changed', handleBookmarkChange);
    return () => window.removeEventListener('quizmanna_bookmarks_changed', handleBookmarkChange);
  }, []);

  const pushScreen = (screen: Screen) => {
    try {
      window.history.pushState({ screen }, '');
    } catch {
      // Safe fallback
    }
    setScreenStack((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      return [...prev, screen];
    });
  };

  const popScreen = () => {
    sounds.playTick();
    setScreenStack((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  };

  // Step-by-step back handler coordinating all screens and drilldown levels
  const handleBack = useCallback((): boolean => {
    sounds.playTick();

    // 1. Inside Saved Screen drilldown
    if (currentScreen === 'bookmarks') {
      if (savedChapterNum !== null) {
        // Step back from Questions to Chapters
        setSavedChapterNum(null);
        return true;
      }
      if (savedBookKey !== null) {
        // Step back from Chapters to Books list
        setSavedBookKey(null);
        return true;
      }
    }

    // 2. Inside Result screen for chapter quiz
    if (currentScreen === 'result') {
      if (selectedBook) {
        // Return directly to the chapters list of this book
        setScreenStack((prev) => {
          const chIdx = prev.lastIndexOf('chapters');
          if (chIdx !== -1) return prev.slice(0, chIdx + 1);
          return ['home', 'books', 'chapters'];
        });
        return true;
      }
    }

    // 3. Normal screen stack popping (e.g. quiz -> chapters -> books -> home)
    if (screenStack.length > 1) {
      popScreen();
      return true;
    }

    // Already at root home screen
    return false;
  }, [currentScreen, savedBookKey, savedChapterNum, selectedBook, screenStack.length]);

  // Expose back handler to Android native layer via window.__quizMannaHandleBack
  useEffect(() => {
    (window as any).__quizMannaHandleBack = handleBack;
    return () => {
      delete (window as any).__quizMannaHandleBack;
    };
  }, [handleBack]);

  // Synchronize browser and hardware back navigation
  useEffect(() => {
    const handlePopState = () => {
      handleBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBack]);

  const navigateToTab = (tab: Screen) => {
    sounds.playTick();
    if (tab === 'bookmarks') {
      setSavedBookKey(null);
      setSavedChapterNum(null);
    }
    if (tab === 'home') {
      setScreenStack(['home']);
    } else {
      setScreenStack(['home', tab]);
    }
  };

  const handleToggleSound = () => {
    const newState = sounds.toggleSound();
    setIsSoundOn(newState);
  };

  const handleChangeLanguage = (newLang: LanguageMode) => {
    setLanguage(newLang);
    setAppLanguage(newLang);
  };

  // Redirection when clicking Old Testament or New Testament from Home
  const handleOpenBooksWithFilter = (testament: 'old' | 'new') => {
    setBooksInitialFilter(testament);
    pushScreen('books');
  };

  // When a book is selected in BooksScreen
  const handleSelectBook = (book: BibleBook) => {
    setSelectedBook(book);
    loadQuestionsForBook(book.id); // Prefetch immediately in background
    pushScreen('chapters');
  };

  // Launch Category Quiz (e.g. Miracles, Kings & Prophets, Verse Match, Daily)
  const handleStartCategoryQuiz = (categoryId: CategoryId) => {
    setIsGenesisSession(false);
    let pool: Question[] = [];
    let title = '';

    if (categoryId === 'daily_challenge') {
      pool = [...ALL_QUESTIONS_POOL].sort(() => 0.5 - Math.random()).slice(0, 15);
      title = isEn ? 'Daily Scripture Challenge (15 Questions)' : 'இன்றைய வேத சவால் (15 வினாக்கள்)';
    } else {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      title = isEn ? cat?.titleEn || 'Bible Quiz' : cat?.title || 'வேத வினாடி வினா';
      pool = ALL_QUESTIONS_POOL.filter((q) => q.categoryId === categoryId);
      pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 15);
    }

    if (pool.length > 0) {
      const randomizedQuestions = pool.map(shuffleQuestionOptions);
      setQuizQuestions(randomizedQuestions);
      setActiveQuizTitle(title);
      pushScreen('quiz');
    }
  };

  // Launch 10-Question Quick Play Blitz
  const handleStartQuickPlay = () => {
    setIsGenesisSession(false);
    const shuffled = [...ALL_QUESTIONS_POOL].sort(() => 0.5 - Math.random()).slice(0, 10);
    const randomizedQuestions = shuffled.map(shuffleQuestionOptions);
    setQuizQuestions(randomizedQuestions);
    setActiveQuizTitle(isEn ? '10 Questions Blitz' : '10 வினாக்கள் விரைவு சவால்');
    pushScreen('quiz');
  };

  // Launch Quiz for a specific Bible Chapter (supporting any of the 66 Bible books)
  const handleStartChapterQuiz = async (chapter: number, bookIdParam?: string) => {
    const book = (bookIdParam ? ALL_BIBLE_BOOKS.find((b) => b.id === bookIdParam) : selectedBook) || ALL_BIBLE_BOOKS.find((b) => b.id === 'genesis') || ALL_BIBLE_BOOKS[0];
    setIsGenesisSession(book.id === 'genesis');
    const questions = await getQuestionsForBookAsync(book.id, chapter);
    const title = isEn
      ? `${book.englishTitle} - Chapter ${chapter}`
      : `${book.title} - அதிகாரம் ${chapter}`;

    setQuizQuestions(questions);
    setActiveQuizTitle(title);
    pushScreen('quiz');
  };

  // Launch Full Book Quiz (Mixed 25 questions from any of the 66 books)
  const handleStartFullBookQuiz = async () => {
    const book = selectedBook || ALL_BIBLE_BOOKS.find((b) => b.id === 'genesis') || ALL_BIBLE_BOOKS[0];
    setIsGenesisSession(book.id === 'genesis');
    const questions = await getQuestionsForBookAsync(book.id);
    const title = isEn
      ? `${book.englishTitle} Quiz`
      : `${book.title} வினாடி வினா`;

    setQuizQuestions(questions);
    setActiveQuizTitle(title);
    pushScreen('quiz');
  };

  // Practice Bookmarked Questions
  const handlePracticeBookmarks = (questions: Question[]) => {
    setIsGenesisSession(false);
    const randomized = questions.map(shuffleQuestionOptions);
    setQuizQuestions(randomized);
    setActiveQuizTitle(isEn ? 'Saved Questions Practice' : 'சேமித்த வினாக்கள் பயிற்சி');
    pushScreen('quiz');
  };

  // Handle Quiz Completion
  const handleFinishQuiz = (
    score: number,
    correctCount: number,
    streakAchieved: number,
    answers: { question: Question; selectedIndex: number; isCorrect: boolean }[]
  ) => {
    const { stats: updatedStats, newlyUnlockedBadges: newBadges } = updateStatsAfterGame(
      score,
      correctCount,
      streakAchieved,
      isGenesisSession
    );

    setStats(updatedStats);
    setLastScore(score);
    setLastCorrectCount(correctCount);
    setLastHighestStreak(streakAchieved);
    setLastAnswers(answers);
    setNewlyUnlockedBadges(newBadges);
    pushScreen('result');
  };

  const handleResetStats = () => {
    const reset = getInitialStats();
    reset.language = language;
    saveUserStats(reset);
    setStats(reset);
  };

  // Calculate Header Title accurately per screen and drilldown level
  const getHeaderTitle = () => {
    if (currentScreen === 'home') {
      return 'QuizManna';
    }
    if (currentScreen === 'quiz') {
      return activeQuizTitle;
    }
    if (currentScreen === 'chapters') {
      const active = selectedBook || ALL_BIBLE_BOOKS.find((b) => b.id === 'genesis') || ALL_BIBLE_BOOKS[0];
      return isEn ? active.englishTitle : active.title;
    }
    if (currentScreen === 'books') {
      return isEn ? '66 Bible Books' : '66 வேத நூல்கள்';
    }
    if (currentScreen === 'bookmarks') {
      if (savedChapterNum !== null) {
        const bookMeta = ALL_BIBLE_BOOKS.find((b) => b.id === savedBookKey);
        const name = isEn ? bookMeta?.englishTitle || 'Genesis' : bookMeta?.title || 'ஆதியாகமம்';
        return `${name} - ${isEn ? 'Ch ' : 'அதி '}${savedChapterNum}`;
      }
      if (savedBookKey !== null) {
        const bookMeta = ALL_BIBLE_BOOKS.find((b) => b.id === savedBookKey);
        const name = isEn ? bookMeta?.englishTitle || 'Genesis' : bookMeta?.title || 'ஆதியாகமம்';
        return `${name} - ${isEn ? 'Chapters' : 'அதிகாரங்கள்'}`;
      }
      return isEn ? 'Saved Questions' : 'சேமித்தவை';
    }
    if (currentScreen === 'stats') {
      return isEn ? 'Achievements' : 'சாதனைகள்';
    }
    return isEn ? 'Quiz Results' : 'முடிவுகள்';
  };

  // Show Header back arrow whenever not at the root home, or when inside bookmark drilldown
  const showHeaderBack =
    screenStack.length > 1 ||
    (currentScreen === 'bookmarks' && (savedBookKey !== null || savedChapterNum !== null));

  const activeBook = selectedBook || ALL_BIBLE_BOOKS.find((b) => b.id === 'genesis') || ALL_BIBLE_BOOKS[0];

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden bg-[#080B11] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* Top Header with Step-by-Step Back Navigation */}
      <Header
        title={getHeaderTitle()}
        showBack={showHeaderBack}
        onBack={handleBack}
        isSoundOn={isSoundOn}
        onToggleSound={handleToggleSound}
        language={language}
        onChangeLanguage={handleChangeLanguage}
      />

      {/* Main Content Area - Scrollable between header and bottom nav */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative flex flex-col">
        {currentScreen === 'home' && (
          <HomeScreen
            stats={stats}
            language={language}
            onSelectCategory={handleStartCategoryQuiz}
            onQuickPlay={handleStartQuickPlay}
            onOpenBooksWithFilter={handleOpenBooksWithFilter}
            onOpenBookmarks={() => pushScreen('bookmarks')}
            onOpenStats={() => pushScreen('stats')}
          />
        )}

        {currentScreen === 'books' && (
          <BooksScreen
            language={language}
            initialFilter={booksInitialFilter}
            onSelectBook={handleSelectBook}
            onGoHome={() => setScreenStack(['home'])}
          />
        )}

        {currentScreen === 'chapters' && (
          <ChaptersScreen
            book={activeBook}
            language={language}
            onSelectChapterQuiz={handleStartChapterQuiz}
            onSelectFullBookQuiz={handleStartFullBookQuiz}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'quiz' && (
          <QuizScreen
            questions={quizQuestions}
            categoryTitle={activeQuizTitle}
            language={language}
            onFinishQuiz={handleFinishQuiz}
            onExit={handleBack}
          />
        )}

        {currentScreen === 'result' && (
          <ResultScreen
            score={lastScore}
            correctCount={lastCorrectCount}
            totalQuestions={quizQuestions.length}
            highestStreak={lastHighestStreak}
            answers={lastAnswers}
            newlyUnlockedBadges={newlyUnlockedBadges}
            language={language}
            onPlayAgain={() => {
              setQuizQuestions([...quizQuestions].map(shuffleQuestionOptions));
              popScreen();
              pushScreen('quiz');
            }}
            onBackToChapters={
              selectedBook
                ? () => {
                    setScreenStack((prev) => {
                      const chIdx = prev.lastIndexOf('chapters');
                      if (chIdx !== -1) return prev.slice(0, chIdx + 1);
                      return ['home', 'books', 'chapters'];
                    });
                  }
                : undefined
            }
            onGoHome={() => setScreenStack(['home'])}
          />
        )}

        {currentScreen === 'bookmarks' && (
          <BookmarkScreen
            language={language}
            selectedBookKey={savedBookKey}
            onSelectBookKey={setSavedBookKey}
            selectedChapterNum={savedChapterNum}
            onSelectChapterNum={setSavedChapterNum}
            onPracticeSaved={handlePracticeBookmarks}
            onStartChapterQuiz={(bookId, ch) => {
              const book = ALL_BIBLE_BOOKS.find((b) => b.id === bookId) || ALL_BIBLE_BOOKS[0];
              setSelectedBook(book);
              handleStartChapterQuiz(ch);
            }}
          />
        )}

        {currentScreen === 'stats' && (
          <StatsScreen
            stats={stats}
            language={language}
            onResetStats={handleResetStats}
            onGoHome={() => setScreenStack(['home'])}
          />
        )}
      </main>

      {/* UNIFORM Bottom Navigation Bar - Perfectly even layout */}
      {currentScreen !== 'quiz' && (
        <nav className="shrink-0 z-40 w-full bg-[#080B11]/98 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 safe-area-bottom shadow-2xl">
          <div className="max-w-md mx-auto grid grid-cols-4 gap-1 items-center">
            {/* 1. Home */}
            <button
              onClick={() => navigateToTab('home')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                currentScreen === 'home'
                  ? 'bg-amber-500/15 text-amber-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300 font-medium'
              }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-[11px] tracking-tight">{isEn ? 'Home' : 'முகப்பு'}</span>
            </button>

            {/* 2. 66 Bible Books */}
            <button
              onClick={() => {
                setBooksInitialFilter('all');
                navigateToTab('books');
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                currentScreen === 'books' || currentScreen === 'chapters'
                  ? 'bg-amber-500/15 text-amber-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300 font-medium'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-1" />
              <span className="text-[11px] tracking-tight">{isEn ? 'Books (66)' : 'நூல்கள்'}</span>
            </button>

            {/* 3. Saved / Bookmarks */}
            <button
              onClick={() => navigateToTab('bookmarks')}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                currentScreen === 'bookmarks'
                  ? 'bg-indigo-500/15 text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300 font-medium'
              }`}
            >
              <div className="relative">
                <Bookmark className="w-5 h-5 mb-1" />
                {stats.savedQuestionIds.length > 0 && (
                  <span className="absolute -top-1 -right-2.5 px-1 min-w-[14px] h-3.5 rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {stats.savedQuestionIds.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight">{isEn ? 'Saved' : 'சேமித்தவை'}</span>
            </button>

            {/* 4. Achievements / Stats */}
            <button
              onClick={() => navigateToTab('stats')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                currentScreen === 'stats'
                  ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300 font-medium'
              }`}
            >
              <Award className="w-5 h-5 mb-1" />
              <span className="text-[11px] tracking-tight">{isEn ? 'Badges' : 'சாதனைகள்'}</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;

