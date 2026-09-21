import React, { useState, useEffect } from 'react';
import { Bookmark, BookOpen, Trash2, ArrowRight, ChevronRight, Layers, ArrowLeft, Play } from 'lucide-react';
import { getBookmarkedQuestions, removeBookmarkedQuestion } from '../utils/storage';
import { ALL_BIBLE_BOOKS } from '../data/bibleBooks';
import type { LanguageMode, Question } from '../types/quiz';
import { sounds } from '../utils/audio';

interface BookmarkScreenProps {
  language: LanguageMode;
  selectedBookKey: string | null;
  onSelectBookKey: (bookKey: string | null) => void;
  selectedChapterNum: number | null;
  onSelectChapterNum: (chapterNum: number | null) => void;
  onPracticeSaved: (questions: Question[]) => void;
  onStartChapterQuiz?: (bookId: string, chapter: number) => void;
}

export const BookmarkScreen: React.FC<BookmarkScreenProps> = ({
  language,
  selectedBookKey,
  onSelectBookKey,
  selectedChapterNum,
  onSelectChapterNum,
  onPracticeSaved,
  onStartChapterQuiz,
}) => {
  const [savedList, setSavedList] = useState<Question[]>(getBookmarkedQuestions());
  const isEn = language === 'en';

  useEffect(() => {
    const refresh = () => setSavedList(getBookmarkedQuestions());
    refresh();
    window.addEventListener('quizmanna_bookmarks_changed', refresh);
    return () => window.removeEventListener('quizmanna_bookmarks_changed', refresh);
  }, []);

  const handleRemove = (id: string) => {
    sounds.playTick();
    removeBookmarkedQuestion(id);
    setSavedList(getBookmarkedQuestions());
  };

  // Group saved questions by book and chapter
  const groupedData: Record<string, {
    bookTitle: string;
    bookTitleEn: string;
    chapters: Record<number, Question[]>;
    generalQuestions: Question[];
  }> = {};

  // Always initialize Genesis so it appears first as requested
  const genesisMeta = ALL_BIBLE_BOOKS.find(b => b.id === 'genesis')!;
  groupedData['genesis'] = {
    bookTitle: genesisMeta.title,
    bookTitleEn: genesisMeta.englishTitle,
    chapters: {},
    generalQuestions: [],
  };

  savedList.forEach((q) => {
    const bookId = q.bookId || 'genesis';
    const bookMeta = ALL_BIBLE_BOOKS.find(b => b.id === bookId);
    const bookTitle = bookMeta ? bookMeta.title : (q.categoryId === 'old_testament' ? 'பழைய ஏற்பாடு' : 'புதிய ஏற்பாடு');
    const bookTitleEn = bookMeta ? bookMeta.englishTitle : (q.categoryId === 'old_testament' ? 'Old Testament' : 'New Testament');

    if (!groupedData[bookId]) {
      groupedData[bookId] = {
        bookTitle,
        bookTitleEn,
        chapters: {},
        generalQuestions: [],
      };
    }

    if (q.chapter) {
      if (!groupedData[bookId].chapters[q.chapter]) {
        groupedData[bookId].chapters[q.chapter] = [];
      }
      groupedData[bookId].chapters[q.chapter].push(q);
    } else {
      groupedData[bookId].generalQuestions.push(q);
    }
  });

  const bookKeys = Object.keys(groupedData).filter((k) => {
    const group = groupedData[k];
    const count =
      Object.values(group.chapters).reduce((acc, list) => acc + list.length, 0) +
      group.generalQuestions.length;
    return count > 0 || (k === 'genesis' && savedList.length === 0);
  });

  // LEVEL 3: View Saved Questions inside a specific Chapter
  if (selectedBookKey && selectedChapterNum !== null) {
    const bookGroup = groupedData[selectedBookKey] || {
      bookTitle: isEn ? 'Genesis' : 'ஆதியாகமம்',
      bookTitleEn: 'Genesis',
      chapters: {},
      generalQuestions: [],
    };
    const chapterQuestions = bookGroup.chapters[selectedChapterNum] || [];

    return (
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-3 max-w-md mx-auto w-full space-y-4">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <button
            onClick={() => {
              sounds.playTick();
              onSelectChapterNum(null);
            }}
            className="flex items-center gap-1.5 text-xs text-amber-400 font-bold hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {isEn
                ? `← Back to ${bookGroup.bookTitleEn} Chapters`
                : `← ${bookGroup.bookTitle} அதிகாரங்களுக்கு திரும்ப`}
            </span>
          </button>

          {chapterQuestions.length > 0 && (
            <button
              onClick={() => {
                sounds.playTick();
                onPracticeSaved(chapterQuestions);
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{isEn ? 'Practice Chapter' : 'அதிகார பயிற்சி'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Chapter Header Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-slate-900 to-amber-500/15 border border-indigo-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isEn
                  ? `${bookGroup.bookTitleEn} - Chapter ${selectedChapterNum}`
                  : `${bookGroup.bookTitle} - அதிகாரம் ${selectedChapterNum}`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {chapterQuestions.length} {isEn ? 'saved questions' : 'சேமித்த வினாக்கள்'}
              </p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {chapterQuestions.length === 0 ? (
          <div className="py-12 text-center space-y-3 rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <Bookmark className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">
              {isEn
                ? `No saved questions in Chapter ${selectedChapterNum}`
                : `அதிகாரம் ${selectedChapterNum}-ல் சேமித்த கேள்விகள் எதுவும் இல்லை`}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {isEn
                ? 'Bookmark questions during quiz rounds. They will appear here.'
                : 'வினாடி வினா விளையாடும் போது கேள்விகளை புக்மார்க் செய்யுங்கள்.'}
            </p>
            {onStartChapterQuiz && (
              <button
                onClick={() => {
                  sounds.playTick();
                  onStartChapterQuiz(selectedBookKey, selectedChapterNum);
                }}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>
                  {isEn
                    ? `Play Chapter ${selectedChapterNum} Quiz`
                    : `அதிகாரம் ${selectedChapterNum} விளையாடு`}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {chapterQuestions.map((q, idx) => {
              const qText = isEn ? q.questionEn : q.question;
              const options = isEn && q.optionsEn ? q.optionsEn : q.options;
              const ansIdx = isEn && q.correctAnswerEn !== undefined ? q.correctAnswerEn : q.correctAnswer;
              const citation = isEn ? q.referenceEn : q.reference;
              const explanation = isEn ? q.explanationEn : q.explanation;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs shadow-lg shadow-black/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-100 leading-snug">
                      {idx + 1}. {qText}
                    </span>
                    <button
                      onClick={() => handleRemove(q.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 font-medium">
                    {isEn ? 'Correct Answer: ' : 'சரியான விடை: '}
                    <span className="font-bold">{options[ansIdx]}</span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{citation}</span>
                    </div>
                    {explanation && (
                      <p className="text-slate-400 leading-relaxed">{explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // LEVEL 2: View Chapters inside a specific Book (e.g. Genesis)
  if (selectedBookKey) {
    const bookGroup = groupedData[selectedBookKey] || {
      bookTitle: isEn ? 'Genesis' : 'ஆதியாகமம்',
      bookTitleEn: 'Genesis',
      chapters: {},
      generalQuestions: [],
    };

    // Chapters with saved questions
    const chaptersWithSaved = Object.keys(bookGroup.chapters || {})
      .map(Number)
      .sort((a, b) => a - b);

    const totalBookSaved = chaptersWithSaved.reduce((acc, ch) => acc + bookGroup.chapters[ch].length, 0)
      + bookGroup.generalQuestions.length;

    return (
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-3 max-w-md mx-auto w-full space-y-4">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <button
            onClick={() => {
              sounds.playTick();
              onSelectBookKey(null);
            }}
            className="flex items-center gap-1.5 text-xs text-amber-400 font-bold hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isEn ? '← Back to Saved Books' : '← சேமித்த நூல்களுக்கு திரும்ப'}</span>
          </button>

          {totalBookSaved > 0 && (
            <button
              onClick={() => {
                sounds.playTick();
                const allInBook: Question[] = [];
                chaptersWithSaved.forEach(ch => allInBook.push(...bookGroup.chapters[ch]));
                if (bookGroup.generalQuestions) allInBook.push(...bookGroup.generalQuestions);
                onPracticeSaved(allInBook);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{isEn ? 'Practice All' : 'நூல் பயிற்சி'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Book Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-950/40 border border-amber-500/30 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              {isEn ? bookGroup.bookTitleEn : bookGroup.bookTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {totalBookSaved} {isEn ? 'saved questions across chapters' : 'சேமித்த கேள்விகள்'}
            </p>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isEn ? 'Saved Chapters:' : 'கேள்விகள் சேமிக்கப்பட்டுள்ள அதிகாரங்கள்:'}
          </h3>

          {/* Shows ONLY chapters that have saved questions */}
          {chaptersWithSaved.length > 0 ? (
            <div className="space-y-2.5">
              {chaptersWithSaved.map((chNum) => {
                const count = bookGroup.chapters[chNum].length;
                return (
                  <button
                    key={chNum}
                    onClick={() => {
                      sounds.playTick();
                      onSelectChapterNum(chNum);
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] shadow-md shadow-black/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {chNum}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {isEn ? `Chapter ${chNum}` : `அதிகாரம் ${chNum}`}
                        </h4>
                        <p className="text-xs text-indigo-300 font-medium">
                          {count} {isEn ? (count === 1 ? 'question saved' : 'questions saved') : 'கேள்விகள் உள்ளன'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <span>{isEn ? 'View Questions' : 'வினாக்களைப் பார்'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Bookmark className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                {isEn
                  ? 'No questions saved yet in Genesis.'
                  : 'ஆதியாகமத்தில் இன்னும் கேள்விகள் எதுவும் சேமிக்கப்படவில்லை.'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isEn
                  ? 'Tap the bookmark icon 🔖 during a quiz to save questions here.'
                  : 'வினாடி வினாவின் போது 🔖 புக்மார்க் செய்தால் அவை இங்கே தோன்றும்.'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // LEVEL 1: View List of Books with Saved Questions (Genesis always first)
  const totalAllSaved = savedList.length;

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-md mx-auto w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400 fill-indigo-400" />
            <span>{isEn ? 'Saved Bible Questions' : 'சேமித்த வேத வினாக்கள்'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEn
              ? `Select Genesis or any book to view chapters (${totalAllSaved} saved)`
              : `அதிகாரங்களைப் பார்க்க ஆதியாகமம் அல்லது நூலைத் தேர்ந்தெடுக்கவும் (${totalAllSaved})`}
          </p>
        </div>

        {totalAllSaved > 0 && (
          <button
            onClick={() => {
              sounds.playTick();
              onPracticeSaved(savedList);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>{isEn ? 'Practice All' : 'அனைத்தும் பயிற்சி'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Books List: Genesis first */}
      <div className="space-y-2.5">
        {bookKeys.map((bookKey) => {
          const group = groupedData[bookKey];
          const chapterNumbers = Object.keys(group.chapters).map(Number);
          const totalCount = chapterNumbers.reduce((acc, ch) => acc + group.chapters[ch].length, 0) + group.generalQuestions.length;

          return (
            <button
              key={bookKey}
              onClick={() => {
                sounds.playTick();
                onSelectBookKey(bookKey);
              }}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isEn ? group.bookTitleEn : group.bookTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEn ? group.bookTitle : group.bookTitleEn} •{' '}
                    <span className="text-amber-400 font-semibold">{totalCount} {isEn ? 'saved' : 'கேள்விகள்'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                <span>{chapterNumbers.length} {isEn ? 'chapters' : 'அதிகாரங்கள்'}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
