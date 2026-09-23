import React, { useEffect } from 'react';
import { BookOpen, Play, ArrowLeft } from 'lucide-react';
import type { BibleBook, LanguageMode } from '../types/quiz';
import { loadQuestionsForBook } from '../data/bibleQuestions';
import { sounds } from '../utils/audio';

interface ChaptersScreenProps {
  book: BibleBook;
  language: LanguageMode;
  onSelectChapterQuiz: (chapter: number) => void;
  onSelectFullBookQuiz: () => void;
  onBack: () => void;
}

export const ChaptersScreen: React.FC<ChaptersScreenProps> = ({
  book,
  language,
  onSelectChapterQuiz,
  onSelectFullBookQuiz,
  onBack,
}) => {
  const isEn = language === 'en';
  const isBoth = language === 'both';

  // Automatically pre-load this book's questions so clicking any chapter is instant
  useEffect(() => {
    if (book?.id) {
      loadQuestionsForBook(book.id);
    }
  }, [book?.id]);

  return (
    <div className="flex-1 pb-6 px-4 pt-3 max-w-md mx-auto w-full space-y-4">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => {
            sounds.playTick();
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs text-amber-400 font-bold hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEn ? '← Back to 66 Books' : '← வேத நூல்களுக்கு திரும்ப'}</span>
        </button>
      </div>

      {/* Book Title Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-4 shadow-xl shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {isEn ? book.englishTitle : book.title}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              {isBoth || !isEn ? book.englishTitle : book.title} • {book.chapters} {isEn ? 'Chapters' : 'அதிகாரங்கள்'}
            </p>
            <span className="text-[11px] text-amber-400 font-semibold">
              {isEn ? 'Select a chapter to practice verse questions' : 'வசன வினாக்களுக்கு அதிகாரத்தைத் தேர்ந்தெடுக்கவும்'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Play: Full Book Mixed Quiz */}
      <button
        onClick={() => {
          sounds.playTick();
          onSelectFullBookQuiz();
        }}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
      >
        <Play className="w-4 h-4 fill-slate-950" />
        <span>
          {isEn
            ? `Play Full ${book.englishTitle} Mixed Quiz (25 Questions)`
            : `முழு ${book.title} கலவை வினாடி வினா (25 வினாக்கள்)`}
        </span>
      </button>

      {/* Chapters Grid Header */}
      <div className="pt-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {isEn ? 'All Chapters:' : 'அனைத்து அதிகாரங்கள்:'}
        </h3>

        {/* 5-Column Grid of Chapters */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chNum) => (
            <button
              key={chNum}
              onClick={() => {
                sounds.playTick();
                onSelectChapterQuiz(chNum);
              }}
              className="py-3 px-1 rounded-xl bg-slate-900/90 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/40 text-slate-100 hover:text-amber-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer shadow-md shadow-black/20"
            >
              <span className="text-[10px] text-slate-500 font-medium">
                {isEn ? 'Ch' : 'அதி'}
              </span>
              <span className="text-sm font-black text-amber-400/90">{chNum}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
