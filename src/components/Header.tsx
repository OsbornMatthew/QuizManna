import React from 'react';
import { Volume2, VolumeX, ArrowLeft, Languages } from 'lucide-react';
import type { LanguageMode } from '../types/quiz';
import { sounds } from '../utils/audio';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  score?: number;
  streak?: number;
  isSoundOn: boolean;
  onToggleSound: () => void;
  language: LanguageMode;
  onChangeLanguage: (lang: LanguageMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'QuizManna',
  subtitle,
  showBack = false,
  onBack,
  score,
  streak,
  isSoundOn,
  onToggleSound,
  language,
  onChangeLanguage,
}) => {
  const cycleLanguage = () => {
    sounds.playTick();
    if (language === 'both') onChangeLanguage('ta');
    else if (language === 'ta') onChangeLanguage('en');
    else onChangeLanguage('both');
  };

  const getLanguageLabel = () => {
    if (language === 'ta') return 'தமிழ்';
    if (language === 'en') return 'English';
    return 'இருமொழி (Both)';
  };

  return (
    <header className="shrink-0 z-40 w-full bg-[#080B11]/98 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 safe-area-top shadow-lg shadow-black/40">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button
              onClick={() => {
                sounds.playTick();
                onBack?.();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 active:scale-95 transition-all border border-slate-800 cursor-pointer"
              aria-label="பின்செல்"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <img 
              src="/logo.png" 
              alt="QuizManna" 
              className="w-10 h-10 rounded-xl object-cover border border-amber-500/30 shadow-md shadow-black/40" 
            />
          )}

          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              {title}
            </h1>
            {subtitle && subtitle !== title && (
              <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1.5">
          {streak !== undefined && streak > 1 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold animate-pulse">
              <span>🔥</span>
              <span>x{streak}</span>
            </div>
          )}

          {score !== undefined && (
            <div className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              ★ {score}
            </div>
          )}

          {/* Language Switcher Pill */}
          <button
            onClick={cycleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
            title="மொழியை மாற்று (Change Language)"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] tracking-tight">{getLanguageLabel()}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sounds.playTick();
              onToggleSound();
            }}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
            aria-label={isSoundOn ? 'ஒலியை முடக்கு' : 'ஒலியை இயக்கு'}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
