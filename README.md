# QuizManna (வேத வினாடி வினா) 📖✨

QuizManna is a complete, bilingual (Tamil & English) Holy Bible Quiz application built with React 19, TypeScript, Tailwind CSS, and Capacitor for Android & Web.

![QuizManna Logo](public/logo.png)

## ✨ Key Features

- **All 66 Bible Books**:
  - Full Old Testament (39 books) & New Testament (27 books).
  - All 1,189 chapters with over 31,000+ chapter-by-chapter multiple-choice questions.
  - Efficient code-splitting per book for instant loading (< 100ms) with zero UI freezing.
- **Dedicated Categories**:
  - **Miracles & Parables** (`miracles_parables`): Wonders performed by Jesus and the prophets.
  - **Kings & Prophets** (`prophets_kings`): Historical accounts of King David, Solomon, Elijah, Daniel, and more.
  - **Scripture Challenge** (`verse_match`): Identification of foundational Bible verses and citations.
- **15-Question Daily Bible Challenge**:
  - Curated daily mixed question sessions for regular Scripture study.
- **Full Bookmark & Save Persistence**:
  - Bookmark questions across all 66 books during quizzes.
  - Practice saved questions anytime, filter by chapter, or practice all saved questions at once.
- **Bilingual Support**:
  - Toggle seamlessly between Tamil only, English only, or Both (Tamil + English).
- **Sound & Haptics**:
  - Audio cues for correct answers, mistakes, ticks, and victory fanfare.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Mobile Runtime**: Capacitor 8 (Android)
- **Icons**: Lucide React
- **CI/CD**: GitHub Actions (Automatic Android APK build on push)

---

## 🚀 Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

### Production Web Build

```bash
npm run build
```

### Sync Capacitor Android

```bash
npx cap sync android
```

---

## 🤖 GitHub Actions CI/CD (Android APK)

The repository includes a ready-to-run GitHub Actions workflow (`.github/workflows/build-apk.yml`) that automatically compiles the Android debug APK on every push to `main` or via manual trigger (`workflow_dispatch`).

### Pushing to your GitHub Repository

To connect this local repo to your GitHub account:

```bash
# 1. Create a new empty repository on GitHub named 'QuizManna' (or any name)
# 2. Add the remote URL:
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 3. Push your code:
git branch -M main
git push -u origin main
```

Once pushed, navigate to the **Actions** tab on your GitHub repository to watch the APK build automatically and download the generated `QuizManna-debug-apk` artifact!
