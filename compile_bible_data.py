import os
import re
import json
from pathlib import Path

# Complete Bible Books metadata matching src/data/bibleBooks.ts
BIBLE_BOOKS = [
    # Old Testament (39)
    ("genesis", "Genesis", "ஆதியாகமம்", "old", 50, "01_genesis"),
    ("exodus", "Exodus", "யாத்திராகமம்", "old", 40, "02_exodus"),
    ("leviticus", "Leviticus", "லேவியராகமம்", "old", 27, "03_leviticus"),
    ("numbers", "Numbers", "எண்ணாகமம்", "old", 36, "04_numbers"),
    ("deuteronomy", "Deuteronomy", "உபாகமம்", "old", 34, "05_deuteronomy"),
    ("joshua", "Joshua", "யோசுவா", "old", 24, "06_joshua"),
    ("judges", "Judges", "நியாயாதிபதிகள்", "old", 21, "07_judges"),
    ("ruth", "Ruth", "ரூத்", "old", 4, "08_ruth"),
    ("1samuel", "1 Samuel", "1 சாமுவேல்", "old", 31, "09_1_samuel"),
    ("2samuel", "2 Samuel", "2 சாமுவேல்", "old", 24, "10_2_samuel"),
    ("1kings", "1 Kings", "1 ராஜாக்கள்", "old", 22, "11_1_kings"),
    ("2kings", "2 Kings", "2 ராஜாக்கள்", "old", 25, "12_2_kings"),
    ("1chronicles", "1 Chronicles", "1 நாளாகமம்", "old", 29, "13_1_chronicles"),
    ("2chronicles", "2 Chronicles", "2 நாளாகமம்", "old", 36, "14_2_chronicles"),
    ("ezra", "Ezra", "எஸ்றா", "old", 10, "15_ezra"),
    ("nehemiah", "Nehemiah", "நெகேமியா", "old", 13, "16_nehemiah"),
    ("esther", "Esther", "எஸ்தர்", "old", 10, "17_esther"),
    ("job", "Job", "யோபு", "old", 42, "18_job"),
    ("psalms", "Psalms", "சங்கீதம்", "old", 150, "19_psalms"),
    ("proverbs", "Proverbs", "நீதிமொழிகள்", "old", 31, "20_proverbs"),
    ("ecclesiastes", "Ecclesiastes", "பிரசங்கி", "old", 12, "21_ecclesiastes"),
    ("songofsolomon", "Song of Solomon", "உன்னதப்பாட்டு", "old", 8, "22_song_of_solomon"),
    ("isaiah", "Isaiah", "ஏசாயா", "old", 66, "23_isaiah"),
    ("jeremiah", "Jeremiah", "எரேமியா", "old", 52, "24_jeremiah"),
    ("lamentations", "Lamentations", "புலம்பல்", "old", 5, "25_lamentations"),
    ("ezekiel", "Ezekiel", "எசேக்கியேல்", "old", 48, "26_ezekiel"),
    ("daniel", "Daniel", "தானியேல்", "old", 12, "27_daniel"),
    ("hosea", "Hosea", "ஓசியா", "old", 14, "28_hosea"),
    ("joel", "Joel", "யோவேல்", "old", 3, "29_joel"),
    ("amos", "Amos", "ஆமோஸ்", "old", 9, "30_amos"),
    ("obadiah", "Obadiah", "ஒபதியா", "old", 1, "31_obadiah"),
    ("jonah", "Jonah", "யோனா", "old", 4, "32_jonah"),
    ("micah", "Micah", "மீகா", "old", 7, "33_micah"),
    ("nahum", "Nahum", "நாகூம்", "old", 3, "34_nahum"),
    ("habakkuk", "Habakkuk", "ஆபகூக்", "old", 3, "35_habakkuk"),
    ("zephaniah", "Zephaniah", "செப்பனியா", "old", 3, "36_zephaniah"),
    ("haggai", "Haggai", "ஆகாய்", "old", 2, "37_haggai"),
    ("zechariah", "Zechariah", "சகரியா", "old", 14, "38_zechariah"),
    ("malachi", "Malachi", "மல்கியா", "old", 4, "39_malachi"),
    # New Testament (27)
    ("matthew", "Matthew", "மத்தேயு", "new", 28, "40_matthew"),
    ("mark", "Mark", "மாற்கு", "new", 16, "41_mark"),
    ("luke", "Luke", "லூக்கா", "new", 24, "42_luke"),
    ("john", "John", "யோவான்", "new", 21, "43_john"),
    ("acts", "Acts", "அப்போஸ்தலர் நடபடிகள்", "new", 28, "44_acts"),
    ("romans", "Romans", "ரோமர்", "new", 16, "45_romans"),
    ("1corinthians", "1 Corinthians", "1 கொரிந்தியர்", "new", 16, "46_1_corinthians"),
    ("2corinthians", "2 Corinthians", "2 கொரிந்தியர்", "new", 13, "47_2_corinthians"),
    ("galatians", "Galatians", "கலாத்தியர்", "new", 6, "48_galatians"),
    ("ephesians", "Ephesians", "எபேசியர்", "new", 6, "49_ephesians"),
    ("philippians", "Philippians", "பிலிப்பியர்", "new", 4, "50_philippians"),
    ("colossians", "Colossians", "கொலோசெயர்", "new", 4, "51_colossians"),
    ("1thessalonians", "1 Thessalonians", "1 தெசலோனிக்கேயர்", "new", 5, "52_1_thessalonians"),
    ("2thessalonians", "2 Thessalonians", "2 தெசலோனிக்கேயர்", "new", 3, "53_2_thessalonians"),
    ("1timothy", "1 Timothy", "1 தீமோத்தேயு", "new", 6, "54_1_timothy"),
    ("2timothy", "2 Timothy", "2 தீமோத்தேயு", "new", 4, "55_2_timothy"),
    ("titus", "Titus", "தீத்து", "new", 3, "56_titus"),
    ("philemon", "Philemon", "பிலேமோன்", "new", 1, "57_philemon"),
    ("hebrews", "Hebrews", "எபிரெயர்", "new", 13, "58_hebrews"),
    ("james", "James", "யாக்கோபு", "new", 5, "59_james"),
    ("1peter", "1 Peter", "1 பேதுரு", "new", 5, "60_1_peter"),
    ("2peter", "2 Peter", "2 பேதுரு", "new", 3, "61_2_peter"),
    ("1john", "1 John", "1 யோவான்", "new", 5, "62_1_john"),
    ("2john", "2 John", "2 யோவான்", "new", 1, "63_2_john"),
    ("3john", "3 John", "3 யோவான்", "new", 1, "64_3_john"),
    ("jude", "Jude", "யூதா", "new", 1, "65_jude"),
    ("revelation", "Revelation", "வெளிப்படுத்தின விசேஷம்", "new", 22, "66_revelation"),
]

DIR_EN = Path("bible_mcqs_english")
DIR_TA = Path("bible_mcqs_tamil")
OUTPUT_DIR = Path("src/data/books")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def parse_mcqs_file(filepath: Path, is_tamil: bool = False):
    """Extracts questions keyed by (chapter, verse)."""
    if not filepath.exists():
        return {}

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    ans_kw = r'(?:விடை|Answer)'
    pattern = re.compile(
        r'\[([^\]]+)\]\s*\n'
        r'([^\n]+)\n'
        r'\(A\)\s*([^\n]+)\n'
        r'\(B\)\s*([^\n]+)\n'
        r'\(C\)\s*([^\n]+)\n'
        r'\(D\)\s*([^\n]+)\n'
        rf'{ans_kw}:\s*\(([ABCD])\)\s*([^\n]*)'
    )

    items = {}
    for m in pattern.finditer(content):
        ref_str = m.group(1).strip()
        q_text = m.group(2).strip()
        opts = [m.group(3).strip(), m.group(4).strip(), m.group(5).strip(), m.group(6).strip()]
        ans_char = m.group(7).strip().upper()
        ans_text = m.group(8).strip()

        cv_m = re.search(r'(\d+)\s*[:.]\s*(\d+)', ref_str)
        if cv_m:
            ch = int(cv_m.group(1))
            vs = int(cv_m.group(2))
            correct_idx = ord(ans_char) - ord('A')
            if 0 <= correct_idx <= 3:
                items[(ch, vs)] = {
                    "ref": ref_str,
                    "question": q_text,
                    "options": opts,
                    "correctAnswer": correct_idx,
                    "ans_text": ans_text
                }
    return items

def compile_all_books():
    print(f"=== Compiling All 66 Bible Books into {OUTPUT_DIR} ===")
    total_compiled_questions = 0
    all_genesis_questions = []

    for book_idx, (book_id, book_en, book_ta, testament, total_chapters, file_prefix) in enumerate(BIBLE_BOOKS, start=1):
        en_path = DIR_EN / f"{file_prefix}_en.txt"
        ta_path = DIR_TA / f"{file_prefix}_ta.txt"

        en_dict = parse_mcqs_file(en_path, is_tamil=False)
        ta_dict = parse_mcqs_file(ta_path, is_tamil=True)

        all_keys = sorted(set(en_dict.keys()) | set(ta_dict.keys()), key=lambda k: (k[0], k[1]))

        book_questions = []
        for ch, vs in all_keys:
            en_item = en_dict.get((ch, vs))
            ta_item = ta_dict.get((ch, vs))

            # Build Tamil content
            if ta_item:
                q_ta = ta_item["question"]
                opts_ta = ta_item["options"]
                ans_ta = ta_item["correctAnswer"]
                ref_ta = ta_item["ref"]
            else:
                q_ta = en_item["question"]
                opts_ta = en_item["options"]
                ans_ta = en_item["correctAnswer"]
                ref_ta = f"{book_ta} {ch}:{vs}"

            # Build English content
            if en_item:
                q_en = en_item["question"]
                opts_en = en_item["options"]
                ans_en = en_item["correctAnswer"]
                ref_en = en_item["ref"]
            else:
                q_en = ta_item["question"]
                opts_en = ta_item["options"]
                ans_en = ta_item["correctAnswer"]
                ref_en = f"{book_en} {ch}:{vs}"

            q_id = f"{book_id[:4]}_{ch}_{vs}".lower()

            question_obj = {
                "id": q_id,
                "categoryId": "old_testament" if testament == "old" else "new_testament",
                "bookId": book_id,
                "chapter": ch,
                "verseNum": vs,
                "question": q_ta,
                "questionEn": q_en,
                "options": opts_ta,
                "optionsEn": opts_en,
                "correctAnswer": ans_ta,
                "correctAnswerEn": ans_en,
                "reference": ref_ta,
                "referenceEn": ref_en,
                "explanation": f"{book_ta} {ch} அதிகாரம்",
                "explanationEn": f"{book_en} Chapter {ch}",
                "difficulty": "medium"
            }
            book_questions.append(question_obj)

        out_file = OUTPUT_DIR / f"{book_id}.json"
        with open(out_file, "w", encoding="utf-8") as f_out:
            json.dump(book_questions, f_out, ensure_ascii=False, separators=(',', ':'))

        if book_id == "genesis":
            all_genesis_questions = book_questions

        total_compiled_questions += len(book_questions)
        print(f"[{book_idx:02d}/66] {book_en:18} -> {len(book_questions):4d} questions saved ({out_file.name})")

    # Also update genesisQuestions.json with complete 50-chapter dataset
    genesis_legacy_path = Path("src/data/genesisQuestions.json")
    with open(genesis_legacy_path, "w", encoding="utf-8") as f_gen:
        json.dump(all_genesis_questions, f_gen, ensure_ascii=False, separators=(',', ':'))
    print(f"\nUpdated {genesis_legacy_path} with all {len(all_genesis_questions)} Genesis questions.")

    print(f"\nSUCCESS! Total {total_compiled_questions:,} questions compiled across all 66 books into {OUTPUT_DIR}/")

if __name__ == "__main__":
    compile_all_books()
