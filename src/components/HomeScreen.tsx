import React from 'react';
import { 
  Scroll, 
  BookOpen, 
  Sparkles, 
  Crown, 
  Quote, 
  Flame, 
  Play, 
  Bookmark, 
  Award, 
  ChevronRight, 
  HeartHandshake
} from 'lucide-react';
import { CATEGORIES } from '../data/bibleQuestions';
import type { CategoryId, LanguageMode, UserStats } from '../types/quiz';
import { sounds } from '../utils/audio';

interface HomeScreenProps {
  stats: UserStats;
  language: LanguageMode;
  onSelectCategory: (categoryId: CategoryId) => void;
  onQuickPlay: () => void;
  onOpenBooksWithFilter: (testament: 'old' | 'new') => void;
  onOpenBookmarks: () => void;
  onOpenStats: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Scroll,
  BookOpen,
  Sparkles,
  Crown,
  Quote,
  Flame,
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  language,
  onSelectCategory,
  onQuickPlay,
  onOpenBooksWithFilter,
  onOpenBookmarks,
  onOpenStats,
}) => {
  const isEn = language === 'en';
  const isBoth = language === 'both';

  // Bilingual Scripture of the Day
  const dailyVerses = [
    {
      textTa: 'உம்முடைய வசனம் என் கால்களுக்குத் தீபமும், என் பாதைக்கு வெளிச்சமுமாயிருக்கிறது.',
      textEn: 'Your word is a lamp to my feet and a light to my path.',
      refTa: 'சங்கீதம் 119:105',
      refEn: 'Psalm 119:105',
    },
    {
      textTa: 'என்னை பெலப்படுத்துகிற கிறிஸ்துவினாலே எல்லாவற்றையுஞ்செய்ய எனக்குப் பெலனுண்டு.',
      textEn: 'I can do all things through Christ who strengthens me.',
      refTa: 'பிலிப்பியர் 4:13',
      refEn: 'Philippians 4:13',
    },
    {
      textTa: 'கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான் தாழ்ச்சியடையேன்.',
      textEn: 'The Lord is my shepherd; I shall not want.',
      refTa: 'சங்கீதம் 23:1',
      refEn: 'Psalm 23:1',
    },
    {
      textTa: 'உன் வழிகளிலெல்லாம் அவரை நினைத்துக்கொள்; அப்பொழுது அவர் உன் பாதைகளைச் செவ்வைப்படுத்துவார்.',
      textEn: 'In all your ways acknowledge Him, and He will make your paths straight.',
      refTa: 'நீதிமொழிகள் 3:6',
      refEn: 'Proverbs 3:6',
    },
  ];

  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const daily = dailyVerses[dayOfYear % dailyVerses.length];

  return (
    <div className="flex-1 pb-6 px-4 pt-4 max-w-md mx-auto w-full space-y-4">
      {/* Daily Scripture Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-indigo-950/60 border border-amber-500/30 p-4 shadow-xl shadow-black/40">
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
              {isEn ? 'Scripture of the Day' : 'இன்றைய வேத வசனம்'}
            </span>
            <p className="text-sm font-semibold text-slate-100 leading-relaxed mt-1">
              "{isEn ? daily.textEn : daily.textTa}"
            </p>
            {isBoth && (
              <p className="text-xs text-slate-400 font-medium italic mt-0.5">
                "{daily.textEn}"
              </p>
            )}
            <p className="text-xs text-amber-400 font-bold mt-1.5 flex items-center gap-1">
              <span>—</span> {isEn ? daily.refEn : daily.refTa}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Play CTA Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/90 via-indigo-800/80 to-purple-900/90 border border-indigo-400/30 p-4 shadow-xl shadow-indigo-950/50">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[11px] font-semibold backdrop-blur-md mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{isEn ? 'Quick Blitz' : 'விரைவு ஆட்டம்'}</span>
            </div>
            <h2 className="text-lg font-extrabold text-white">
              {isEn ? '10 Random Questions' : '10 வினாக்கள் சவால்'}
            </h2>
            <p className="text-xs text-indigo-200/90 mt-0.5 max-w-[210px]">
              {isEn ? 'Mixed questions from all scriptures!' : 'அனைத்து பகுதிகளிலிருந்தும் கலவை வினாக்கள்!'}
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playTick();
              onQuickPlay();
            }}
            className="w-12 h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="விளையாடு"
          >
            <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Stats Glance Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            {isEn ? 'Total Points' : 'மொத்த புள்ளிகள்'}
          </span>
          <p className="text-base font-extrabold text-amber-400 mt-0.5">{stats.totalScore}</p>
        </div>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            {isEn ? 'Best Streak' : 'தொடர் வெற்றி'}
          </span>
          <p className="text-base font-extrabold text-orange-400 mt-0.5 flex items-center justify-center gap-1">
            <span>🔥</span> {stats.highestStreak}
          </p>
        </div>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            {isEn ? 'Correct' : 'சரியானவை'}
          </span>
          <p className="text-base font-extrabold text-emerald-400 mt-0.5">{stats.totalCorrect}</p>
        </div>
      </div>

      {/* Categories Heading */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>{isEn ? 'Bible Quiz Categories' : 'வேதப் பிரிவுகள்'}</span>
          <span className="text-xs font-normal text-slate-400">({CATEGORIES.length})</span>
        </h3>
        <button
          onClick={() => {
            sounds.playTick();
            onOpenBookmarks();
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 cursor-pointer"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{isEn ? 'Saved' : 'சேமித்தவை'} ({stats.savedQuestionIds.length})</span>
        </button>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.iconName] || BookOpen;

          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playTick();
                if (cat.id === 'old_testament') {
                  onOpenBooksWithFilter('old');
                } else if (cat.id === 'new_testament') {
                  onOpenBooksWithFilter('new');
                } else {
                  onSelectCategory(cat.id);
                }
              }}
              className={`w-full text-left rounded-2xl bg-gradient-to-r ${cat.gradient} border ${cat.borderColor} p-3.5 transition-all duration-200 active:scale-[0.98] group relative overflow-hidden shadow-lg shadow-black/30 cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center ${cat.textColor} shadow-inner group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                      {isEn ? cat.titleEn : cat.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {isEn ? cat.subtitleEn : cat.subtitle}
                    </p>
                    {isBoth && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        {isEn ? cat.title : cat.titleEn}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-all shrink-0 ml-2">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Badges Shelf Button */}
      <button
        onClick={() => {
          sounds.playTick();
          onOpenStats();
        }}
        className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-3.5 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-200">
              {isEn ? 'Achievements & Titles' : 'சாதனைகளும் பட்டங்களும்'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {stats.badges.filter(b => b.unlocked).length} / {stats.badges.length} {isEn ? 'Badges Unlocked' : 'பட்டங்கள் திறக்கப்பட்டுள்ளன'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
};
