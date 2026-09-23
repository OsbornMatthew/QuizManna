import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Bookmark, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  HelpCircle, 
  Clock, 
  SkipForward 
} from 'lucide-react';
import type { LanguageMode, Question } from '../types/quiz';
import { sounds } from '../utils/audio';
import { isQuestionBookmarked, toggleBookmarkQuestion } from '../utils/storage';

interface QuizScreenProps {
  questions: Question[];
  categoryTitle: string;
  language: LanguageMode;
  onFinishQuiz: (
    score: number,
    correctCount: number,
    streakAchieved: number,
    answers: { question: Question; selectedIndex: number; isCorrect: boolean }[]
  ) => void;
  onExit?: () => void;
}

const QUESTION_TIME_LIMIT = 20;

export const QuizScreen: React.FC<QuizScreenProps> = ({
  questions,
  categoryTitle,
  language,
  onFinishQuiz,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Lifelines
  const [usedFiftyFifty, setUsedFiftyFifty] = useState(false);
  const [usedExtraTime, setUsedExtraTime] = useState(false);
  const [usedSkip, setUsedSkip] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);

  // User responses history
  const [answers, setAnswers] = useState<{
    question: Question;
    selectedIndex: number;
    isCorrect: boolean;
  }[]>([]);

  const currentQuestion = questions[currentIndex];
  const timerRef = useRef<any>(null);

  const isEn = language === 'en';
  const isBoth = language === 'both';

  // In English mode, if optionsEn has different order, use correctAnswerEn
  const activeCorrectAnswer = isEn && currentQuestion?.correctAnswerEn !== undefined
    ? currentQuestion.correctAnswerEn
    : currentQuestion?.correctAnswer ?? 0;

  // Synchronize state when question changes
  useEffect(() => {
    if (currentQuestion) {
      setIsBookmarked(isQuestionBookmarked(currentQuestion.id));
      setEliminatedOptions([]);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(QUESTION_TIME_LIMIT);
    }
  }, [currentIndex, currentQuestion]);

  // Countdown timer
  useEffect(() => {
    if (isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        if (prev <= 6) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered]);

  const handleTimeOut = () => {
    if (isAnswered) return;
    sounds.playWrong();
    setIsAnswered(true);
    setSelectedOption(-1);
    setCurrentStreak(0);

    setAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion,
        selectedIndex: -1,
        isCorrect: false,
      },
    ]);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || eliminatedOptions.includes(idx)) return;

    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === activeCorrectAnswer;

    if (isCorrect) {
      sounds.playCorrect();
      const pointsEarned = 10 + Math.max(0, timeLeft);
      setScore((prev: number) => prev + pointsEarned);
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > highestStreak) {
        setHighestStreak(newStreak);
      }
    } else {
      sounds.playWrong();
      setCurrentStreak(0);
    }

    setAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion,
        selectedIndex: idx,
        isCorrect,
      },
    ]);
  };

  const handleNextQuestion = () => {
    sounds.playTick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev: number) => prev + 1);
    } else {
      const correctCount = answers.filter((a) => a.isCorrect).length + (selectedOption === activeCorrectAnswer ? 1 : 0);
      onFinishQuiz(score, correctCount, Math.max(highestStreak, currentStreak), answers);
    }
  };

  // Lifeline: 50-50
  const handleFiftyFifty = () => {
    if (usedFiftyFifty || isAnswered) return;
    sounds.playLifeline();
    setUsedFiftyFifty(true);

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== activeCorrectAnswer);
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    setEliminatedOptions(shuffled.slice(0, 2));
  };

  // Lifeline: +15 seconds
  const handleExtraTime = () => {
    if (usedExtraTime || isAnswered) return;
    sounds.playLifeline();
    setUsedExtraTime(true);
    setTimeLeft((prev: number) => prev + 15);
  };

  // Lifeline: Skip
  const handleSkip = () => {
    if (usedSkip || isAnswered) return;
    sounds.playLifeline();
    setUsedSkip(true);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev: number) => prev + 1);
    } else {
      handleNextQuestion();
    }
  };

  const handleBookmarkToggle = () => {
    sounds.playTick();
    const newState = toggleBookmarkQuestion(currentQuestion);
    setIsBookmarked(newState);
  };

  if (!currentQuestion) return null;

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex + 1 === questions.length;

  return (
    <div className="flex-1 pb-6 px-4 pt-3 max-w-md mx-auto w-full space-y-4">
      {/* Quiz Top Exit Navigation */}
      {onExit && (
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
          <button
            onClick={() => {
              sounds.playTick();
              onExit();
            }}
            className="flex items-center gap-1.5 text-xs text-amber-400/90 hover:text-amber-300 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEn ? '← Back to Chapters' : '← அதிகாரங்களுக்கு திரும்ப'}</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[180px]">
            {categoryTitle}
          </span>
        </div>
      )}

      {/* Top Meta Bar: Progress & Timer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span>
              {isEn ? 'Question' : 'கேள்வி'} {currentIndex + 1} / {questions.length}
            </span>
            {currentStreak > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-bold border border-orange-500/30">
                🔥 x{currentStreak}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span className={`font-mono text-sm font-bold ${timeLeft <= 5 ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Animated Progress Track */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Lifelines Bar */}
      <div className="flex items-center justify-center gap-3 py-1">
        <button
          onClick={handleFiftyFifty}
          disabled={usedFiftyFifty || isAnswered}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            usedFiftyFifty
              ? 'opacity-40 bg-slate-900 border-slate-800 text-slate-600'
              : 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/10 active:scale-95'
          }`}
          title="50:50 - Remove 2 wrong options"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>50:50</span>
        </button>

        <button
          onClick={handleExtraTime}
          disabled={usedExtraTime || isAnswered}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            usedExtraTime
              ? 'opacity-40 bg-slate-900 border-slate-800 text-slate-600'
              : 'bg-slate-900/90 hover:bg-slate-800 border-indigo-500/30 text-indigo-400 shadow-sm shadow-indigo-500/10 active:scale-95'
          }`}
          title="+15s Extra Time"
        >
          <Timer className="w-3.5 h-3.5" />
          <span>+15s</span>
        </button>

        <button
          onClick={handleSkip}
          disabled={usedSkip || isAnswered}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            usedSkip
              ? 'opacity-40 bg-slate-900 border-slate-800 text-slate-600'
              : 'bg-slate-900/90 hover:bg-slate-800 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10 active:scale-95'
          }`}
          title="Skip Question"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>{isEn ? 'Skip' : 'தவிர்'}</span>
        </button>
      </div>

      {/* Main Question Card */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800 p-5 shadow-xl shadow-black/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700/60">
            {categoryTitle}
          </span>
          <button
            onClick={handleBookmarkToggle}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            aria-label="Bookmark"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Primary Language Question */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
          {isEn ? currentQuestion.questionEn : currentQuestion.question}
        </h3>

        {/* Secondary Bilingual Question */}
        {isBoth && (
          <p className="text-xs sm:text-sm text-slate-300 italic font-medium pt-1 border-t border-slate-800/80">
            {currentQuestion.questionEn}
          </p>
        )}
      </div>

      {/* 4 Options Grid */}
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((idx) => {
          const isEliminated = eliminatedOptions.includes(idx);
          const isCorrectAnswer = idx === activeCorrectAnswer;
          const isUserPick = selectedOption === idx;

          let btnStyles = 'bg-slate-900/70 border-slate-800 text-slate-200 hover:border-slate-700';

          if (isAnswered) {
            if (isCorrectAnswer) {
              btnStyles = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 glow-green';
            } else if (isUserPick) {
              btnStyles = 'bg-rose-950/70 border-rose-500 text-rose-100 glow-red';
            } else {
              btnStyles = 'opacity-40 bg-slate-950 border-slate-900 text-slate-600';
            }
          } else if (isEliminated) {
            btnStyles = 'opacity-20 pointer-events-none line-through bg-slate-950 border-slate-900 text-slate-600';
          }

          const optionLabels = ['A', 'B', 'C', 'D'];
          const optTa = currentQuestion.options[idx];
          const optEn = currentQuestion.optionsEn?.[idx] || optTa;

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered || isEliminated}
              className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm transition-all duration-200 flex items-center justify-between active:scale-[0.99] cursor-pointer ${btnStyles}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center border shrink-0 ${
                  isAnswered && isCorrectAnswer
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : isAnswered && isUserPick
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}>
                  {optionLabels[idx]}
                </span>
                <div>
                  <p className="leading-snug">
                    {isEn ? optEn : optTa}
                  </p>
                  {isBoth && optEn !== optTa && (
                    <p className="text-xs text-slate-400 italic mt-0.5">
                      {optEn}
                    </p>
                  )}
                </div>
              </div>

              {isAnswered && isCorrectAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
              )}
              {isAnswered && isUserPick && !isCorrectAnswer && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Scripture Reference Reveal */}
      {isAnswered && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-indigo-500/10 border border-amber-500/30 p-4 shadow-lg space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <BookOpen className="w-4 h-4" />
            <span>
              {isEn ? 'Scripture Citation: ' : 'வேத ஆதாரம்: '}
              {isEn ? currentQuestion.referenceEn : currentQuestion.reference}
              {isBoth && ` • ${currentQuestion.referenceEn}`}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {isEn ? currentQuestion.explanationEn : currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Next Question Floating Button */}
      {isAnswered && (
        <div className="pt-2">
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <span>
              {isLastQuestion
                ? (isEn ? 'See Results' : 'முடிவுகளைக் காண்க')
                : (isEn ? 'Next Question' : 'அடுத்த கேள்வி')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
