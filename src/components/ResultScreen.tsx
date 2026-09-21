import React, { useEffect } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Home, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Award 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { LanguageMode, Question } from '../types/quiz';
import { sounds } from '../utils/audio';

interface ResultScreenProps {
  score: number;
  correctCount: number;
  totalQuestions: number;
  highestStreak: number;
  answers: { question: Question; selectedIndex: number; isCorrect: boolean }[];
  newlyUnlockedBadges: string[];
  language: LanguageMode;
  onPlayAgain: () => void;
  onBackToChapters?: () => void;
  onGoHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  score,
  correctCount,
  totalQuestions,
  highestStreak,
  answers,
  newlyUnlockedBadges,
  language,
  onPlayAgain,
  onBackToChapters,
  onGoHome,
}) => {
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const isEn = language === 'en';

  useEffect(() => {
    sounds.playVictory();

    if (percentage >= 50) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#6366F1', '#10B981', '#EC4899'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [percentage]);

  let biblicalMessage = {
    title: isEn ? 'Good Effort!' : 'சிறப்பான முயற்சி!',
    verse: isEn ? 'Search the scriptures... (John 5:39)' : 'வேத வாக்கியங்களை ஆராய்ந்து பாருங்கள்... (யோவான் 5:39)',
    color: 'text-amber-400',
  };

  if (percentage >= 90) {
    biblicalMessage = {
      title: isEn ? 'Glorious Victory! Outstanding Wisdom!' : 'மகிமையான வெற்றி! அற்புத அறிவு!',
      verse: isEn ? 'Well done, good and faithful servant! (Matthew 25:21)' : 'நல்லது, உண்மையும் உத்தமமுமான ஊழியக்காரனே! (மத்தேயு 25:21)',
      color: 'text-emerald-400',
    };
  } else if (percentage >= 60) {
    biblicalMessage = {
      title: isEn ? 'Well Played! Keep Growing!' : 'நன்றாக விளையாடினீர்கள்!',
      verse: isEn ? 'In all your ways acknowledge Him... (Proverbs 3:6)' : 'உன் வழிகளிலெல்லாம் அவரை நினைத்துக்கொள்... (நீதிமொழிகள் 3:6)',
      color: 'text-indigo-400',
    };
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-md mx-auto w-full space-y-4">
      {/* Top Victory Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 text-center shadow-2xl shadow-black/60">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
          <Trophy className="w-8 h-8 text-slate-950" />
        </div>

        <span className={`text-xs font-bold uppercase tracking-wider ${biblicalMessage.color}`}>
          {biblicalMessage.title}
        </span>

        <h2 className="text-3xl font-black text-white mt-1">
          {percentage}% {isEn ? 'Score' : 'மதிப்பெண்'}
        </h2>

        <p className="text-xs text-slate-300 italic mt-1.5 px-2">
          "{biblicalMessage.verse}"
        </p>

        {/* Unlocked Badges Announcement */}
        {newlyUnlockedBadges.length > 0 && (
          <div className="mt-3.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              {isEn ? 'New Badge Unlocked: ' : 'புதிய பட்டம் திறக்கப்பட்டது: '}
              {newlyUnlockedBadges.join(', ')}
            </span>
          </div>
        )}

        {/* Score Grid Details */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-950/60">
            <span className="text-[11px] text-slate-400">{isEn ? 'Points' : 'புள்ளிகள்'}</span>
            <p className="text-base font-bold text-amber-400">+{score}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60">
            <span className="text-[11px] text-slate-400">{isEn ? 'Correct' : 'சரியானவை'}</span>
            <p className="text-base font-bold text-emerald-400">{correctCount}/{totalQuestions}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60">
            <span className="text-[11px] text-slate-400">{isEn ? 'Streak' : 'தொடர் வெற்றி'}</span>
            <p className="text-base font-bold text-orange-400">🔥 {highestStreak}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {onBackToChapters && (
          <button
            onClick={() => {
              sounds.playTick();
              onBackToChapters();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isEn ? 'Back to Chapters' : 'அதிகாரங்களுக்கு திரும்ப'}</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              sounds.playTick();
              onPlayAgain();
            }}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isEn ? 'Play Again' : 'மீண்டும் விளையாடு'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playTick();
              onGoHome();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{isEn ? 'Home' : 'முகப்பு'}</span>
          </button>
        </div>
      </div>

      {/* Answer Review Section */}
      <div className="space-y-2.5 pt-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>{isEn ? 'Answer Review' : 'விடைகளின் மறுபார்வை'}</span>
          <span className="text-xs font-normal text-slate-400">({answers.length})</span>
        </h3>

        <div className="space-y-2.5">
          {answers.map((item, idx) => {
            const isCorrect = item.isCorrect;
            const qText = isEn ? item.question.questionEn : item.question.question;
            const options = isEn && item.question.optionsEn ? item.question.optionsEn : item.question.options;
            const correctAnsIdx = isEn && item.question.correctAnswerEn !== undefined
              ? item.question.correctAnswerEn
              : item.question.correctAnswer;

            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-200 leading-snug">
                    {idx + 1}. {qText}
                  </span>
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  {!isCorrect && item.selectedIndex >= 0 && (
                    <p className="text-rose-300 font-medium">
                      {isEn ? 'Your answer: ' : 'உங்கள் விடை: '}
                      {options[item.selectedIndex]}
                    </p>
                  )}
                  <p className="text-emerald-400 font-medium">
                    {isEn ? 'Correct answer: ' : 'சரியான விடை: '}
                    {options[correctAnsIdx]}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {isEn ? 'Citation: ' : 'வேத ஆதாரம்: '}
                    {isEn ? item.question.referenceEn : item.question.reference}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
