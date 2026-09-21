import React, { useState } from 'react';
import { BookOpen, Search, ChevronRight, X } from 'lucide-react';
import { ALL_BIBLE_BOOKS } from '../data/bibleBooks';
import type { BibleBook, LanguageMode } from '../types/quiz';
import { sounds } from '../utils/audio';

interface BooksScreenProps {
  language: LanguageMode;
  initialFilter?: 'all' | 'old' | 'new';
  onSelectBook: (book: BibleBook) => void;
  onGoHome: () => void;
}

export const BooksScreen: React.FC<BooksScreenProps> = ({
  language,
  initialFilter = 'all',
  onSelectBook,
}) => {
  const [filter, setFilter] = useState<'all' | 'old' | 'new'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  const isEn = language === 'en';
  const isBoth = language === 'both';

  const filteredBooks = ALL_BIBLE_BOOKS.filter((book) => {
    if (filter === 'old' && book.testament !== 'old') return false;
    if (filter === 'new' && book.testament !== 'new') return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.englishTitle.toLowerCase().includes(query) ||
      book.group.toLowerCase().includes(query) ||
      book.groupEn.toLowerCase().includes(query)
    );
  });

  const handleBookClick = (book: BibleBook) => {
    sounds.playTick();
    onSelectBook(book);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-md mx-auto w-full space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>{isEn ? '66 Bible Books' : '66 வேதாகம நூல்கள்'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEn
              ? '39 Old Testament & 27 New Testament Books'
              : 'பழைய ஏற்பாடு (39) மற்றும் புதிய ஏற்பாடு (27)'}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isEn ? 'Search books (e.g. Genesis, Psalms...)' : 'ஆகமங்களைத் தேடுங்கள் (எ.கா. ஆதியாகமம், யோவான்...)'}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            sounds.playTick();
            setFilter('all');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-900/70 border-slate-800 text-slate-400'
          }`}
        >
          {isEn ? 'All (66)' : 'அனைத்தும் (66)'}
        </button>

        <button
          onClick={() => {
            sounds.playTick();
            setFilter('old');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filter === 'old'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-900/70 border-slate-800 text-slate-400'
          }`}
        >
          {isEn ? 'Old Test. (39)' : 'பழைய ஏ. (39)'}
        </button>

        <button
          onClick={() => {
            sounds.playTick();
            setFilter('new');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filter === 'new'
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-900/70 border-slate-800 text-slate-400'
          }`}
        >
          {isEn ? 'New Test. (27)' : 'புதிய ஏ. (27)'}
        </button>
      </div>

      {/* Books List Grid */}
      <div className="space-y-2.5">
        {filteredBooks.map((book) => {
          const isOld = book.testament === 'old';

          return (
            <button
              key={book.id}
              onClick={() => handleBookClick(book)}
              className="w-full text-left p-3.5 rounded-2xl border bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 transition-all duration-200 active:scale-[0.99] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isOld
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                      : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  {book.order}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {isEn ? book.englishTitle : book.title}
                    </h3>
                    {(isBoth || !isEn) && (
                      <span className="text-xs text-slate-400 font-medium">
                        {isEn ? book.title : book.englishTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{isEn ? book.groupEn : book.group}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
