import React from 'react';
import { Award, Zap, BookOpen, Crown, Target, Flame, RotateCcw, Scroll } from 'lucide-react';
import type { LanguageMode, UserStats } from '../types/quiz';
import { sounds } from '../utils/audio';

interface StatsScreenProps {
  stats: UserStats;
  language: LanguageMode;
  onResetStats: () => void;
  onGoHome: () => void;
}

const BADGE_ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Zap,
  BookOpen,
  Crown,
  Scroll,
};

export const StatsScreen: React.FC<StatsScreenProps> = ({
  stats,
  language,
  onResetStats,
  onGoHome,
}) => {
  const isEn = language === 'en';

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-md mx-auto w-full space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>{isEn ? 'Your Achievements & Stats' : 'உங்கள் சாதனைகள் & விவரங்கள்'}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isEn
            ? 'Track your biblical growth, accuracy, and earned titles'
            : 'உங்கள் வேத அறிவு வளர்ச்சி மற்றும் சாதனைகளின் தொகுப்பு'}
        </p>
      </div>

      {/* 4 Performance Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-1 shadow-lg shadow-black/30">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Crown className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 font-medium pt-1">
            {isEn ? 'Total Points' : 'மொத்த புள்ளிகள்'}
          </p>
          <p className="text-2xl font-black text-white">{stats.totalScore}</p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-1 shadow-lg shadow-black/30">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 font-medium pt-1">
            {isEn ? 'Highest Streak' : 'சிறந்த தொடர் வெற்றி'}
          </p>
          <p className="text-2xl font-black text-white">🔥 {stats.highestStreak}</p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-1 shadow-lg shadow-black/30">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 font-medium pt-1">
            {isEn ? 'Correct Answers' : 'சரியான பதில்கள்'}
          </p>
          <p className="text-2xl font-black text-white">{stats.totalCorrect}</p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-1 shadow-lg shadow-black/30">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 font-medium pt-1">
            {isEn ? 'Games Played' : 'விளையாடிய ஆட்டங்கள்'}
          </p>
          <p className="text-2xl font-black text-white">{stats.gamesPlayed}</p>
        </div>
      </div>

      {/* Badges Shelf */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>{isEn ? 'Biblical Badges' : 'வேத பட்டங்கள்'}</span>
          <span className="text-xs font-normal text-slate-400">
            ({stats.badges.filter((b) => b.unlocked).length} / {stats.badges.length})
          </span>
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {stats.badges.map((badge) => {
            const Icon = BADGE_ICON_MAP[badge.icon] || Award;
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  badge.unlocked
                    ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/30'
                    : 'opacity-50 bg-slate-950/60 border-slate-900'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    badge.unlocked
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold ${
                        badge.unlocked ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {isEn ? badge.titleEn : badge.title}
                    </h4>
                    {badge.unlocked && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                        {isEn ? 'Unlocked' : 'பெறப்பட்டது'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEn ? badge.descriptionEn : badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Stats Warning Option */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => {
            const msg = isEn
              ? 'Are you sure you want to reset all your stats?'
              : 'உங்கள் அனைத்து புள்ளிவிவரங்களையும் மீட்டமைக்க விரும்புகிறீர்களா?';
            if (window.confirm(msg)) {
              sounds.playTick();
              onResetStats();
            }
          }}
          className="text-xs text-rose-400/80 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isEn ? 'Reset Stats' : 'புள்ளிவிவரங்களை மீட்டமை'}</span>
        </button>

        <button
          onClick={() => {
            sounds.playTick();
            onGoHome();
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs cursor-pointer"
        >
          {isEn ? 'Go Home' : 'முகப்புக்கு செல்'}
        </button>
      </div>
    </div>
  );
};
