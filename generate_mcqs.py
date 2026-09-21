import os
import sys
import time
import re
import random
import threading
import concurrent.futures
import httpx
from google import genai
from google.genai import types

# Ensure immediate UTF-8 line-buffered output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. Provide Gemini API keys (supports comma-separated list of keys for multi-project rotation)
raw_keys = os.environ.get("GEMINI_API_KEYS", os.environ.get("GEMINI_API_KEY", ""))
API_KEYS = [k.strip() for k in raw_keys.split(",") if k.strip()]
clients = [
    genai.Client(api_key=key)
    for key in API_KEYS
]
client = clients[0]

client_cycle = 0
cycle_lock = threading.Lock()

def get_client_for_thread():
    global client_cycle
    with cycle_lock:
        c = clients[client_cycle % len(clients)]
        client_cycle += 1
        return c

# Directory structure
DIR_EN = "bible_mcqs_english"
DIR_TA = "bible_mcqs_tamil"
os.makedirs(DIR_EN, exist_ok=True)
os.makedirs(DIR_TA, exist_ok=True)

# Active supported models in priority rotation order (fastest first, no invalid models)
MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash"
]

# Complete 66 Books of the Bible with Chapter Counts and Tamil Names
BIBLE_BOOKS = [
    # Old Testament (பழைய ஏற்பாடு)
    ("Genesis", "ஆதியாகமம்", 50),
    ("Exodus", "யாத்திராகமம்", 40),
    ("Leviticus", "லேவியராகமம்", 27),
    ("Numbers", "எண்ணாகமம்", 36),
    ("Deuteronomy", "உபாகமம்", 34),
    ("Joshua", "யோசுவா", 24),
    ("Judges", "நியாயாதிபதிகள்", 21),
    ("Ruth", "ரூத்", 4),
    ("1 Samuel", "1 சாமுவேல்", 31),
    ("2 Samuel", "2 சாமுவேல்", 24),
    ("1 Kings", "1 இராஜாக்கள்", 22),
    ("2 Kings", "2 இராஜாக்கள்", 25),
    ("1 Chronicles", "1 நாளாகமம்", 29),
    ("2 Chronicles", "2 நாளாகமம்", 36),
    ("Ezra", "எஸ்றா", 10),
    ("Nehemiah", "நெகேமியா", 13),
    ("Esther", "எஸ்தர்", 10),
    ("Job", "யோபு", 42),
    ("Psalms", "சங்கீதம்", 150),
    ("Proverbs", "நீதிமொழிகள்", 31),
    ("Ecclesiastes", "பிரசங்கி", 12),
    ("Song of Solomon", "உன்னதப்பாட்டு", 8),
    ("Isaiah", "ஏசாயா", 66),
    ("Jeremiah", "எரேமியா", 52),
    ("Lamentations", "புலம்பல்", 5),
    ("Ezekiel", "எசேக்கியேல்", 48),
    ("Daniel", "தானியேல்", 12),
    ("Hosea", "ஓசியா", 14),
    ("Joel", "யோவேல்", 3),
    ("Amos", "ஆமோஸ்", 9),
    ("Obadiah", "ஒபதியா", 1),
    ("Jonah", "யோனா", 4),
    ("Micah", "மீகா", 7),
    ("Nahum", "நாகூம்", 3),
    ("Habakkuk", "ஆபகூக்", 3),
    ("Zephaniah", "செப்பனியா", 3),
    ("Haggai", "ஆகாய்", 2),
    ("Zechariah", "சகரியா", 14),
    ("Malachi", "மல்கியா", 4),
    # New Testament (புதிய ஏற்பாடு)
    ("Matthew", "மத்தேயு", 28),
    ("Mark", "மாற்கு", 16),
    ("Luke", "லூக்கா", 24),
    ("John", "யோவான்", 21),
    ("Acts", "அப்போஸ்தலர் நடபடிகள்", 28),
    ("Romans", "ரோமர்", 16),
    ("1 Corinthians", "1 கொரிந்தியர்", 16),
    ("2 Corinthians", "2 கொரிந்தியர்", 13),
    ("Galatians", "கலாத்தியர்", 6),
    ("Ephesians", "எபேசியர்", 6),
    ("Philippians", "பிலிப்பியர்", 4),
    ("Colossians", "கொலோசெயர்", 4),
    ("1 Thessalonians", "1 தெசலோனிக்கேயர்", 5),
    ("2 Thessalonians", "2 தெசலோனிக்கேயர்", 3),
    ("1 Timothy", "1 தீமோத்தேயு", 6),
    ("2 Timothy", "2 தீமோத்தேயு", 4),
    ("Titus", "தீத்து", 3),
    ("Philemon", "பிலேமோன்", 1),
    ("Hebrews", "எபிரெயர்", 13),
    ("James", "யாக்கோபு", 5),
    ("1 Peter", "1 பேதுரு", 5),
    ("2 Peter", "2 பேதுரு", 3),
    ("1 John", "1 யோவான்", 5),
    ("2 John", "2 யோவான்", 1),
    ("3 John", "3 யோவான்", 1),
    ("Jude", "யூதா", 1),
    ("Revelation", "வெளிப்படுத்தின விசேஷம்", 22),
]

def clean_tamil_text(text: str) -> str:
    """Strips Hebrew, Greek, and other stray non-Tamil foreign scripts from Tamil output."""
    if not text:
        return text
    text = re.sub(r'[\u0590-\u05FF\u0600-\u06FF\u0370-\u03FF]', '', text)
    text = text.replace('சீனாப் வாந்தர', 'சீனாய் வனாந்தர').replace('சீனாப் வனாந்தர', 'சீனாய் வனாந்தர').replace('சீனாப் מדவாந்தர', 'சீனாய் வனாந்தர')
    return text

def shuffle_and_balance_mcqs(content: str, is_tamil: bool = False) -> str:
    ans_label = r'(?:விடை|Answer)'
    pattern = re.compile(
        r'(\[[^\]]+\]\s*\n.+?\n)'
        r'\(A\)\s*([^\n]+)\n'
        r'\(B\)\s*([^\n]+)\n'
        r'\(C\)\s*([^\n]+)\n'
        r'\(D\)\s*([^\n]+)\n'
        rf'({ans_label}:\s*\(([ABCD])\)\s*([^\n]*))',
        re.DOTALL
    )
    
    def repl(m):
        header = m.group(1)
        opts = [m.group(2).strip(), m.group(3).strip(), m.group(4).strip(), m.group(5).strip()]
        ans_letter = m.group(7).upper()
        ans_text = m.group(8).strip()
        
        correct_text = None
        if ans_text:
            for opt in opts:
                if ans_text.lower() == opt.lower() or opt.lower() in ans_text.lower() or ans_text.lower() in opt.lower():
                    correct_text = opt
                    break
        
        if not correct_text:
            orig_idx = ord(ans_letter) - ord('A')
            if 0 <= orig_idx < len(opts):
                correct_text = opts[orig_idx]
            else:
                return m.group(0)
        
        shuffled = list(opts)
        random.shuffle(shuffled)
        new_idx = shuffled.index(correct_text)
        new_letter = chr(ord('A') + new_idx)
        prefix = 'விடை' if is_tamil else 'Answer'
        return f'{header}(A) {shuffled[0]}\n(B) {shuffled[1]}\n(C) {shuffled[2]}\n(D) {shuffled[3]}\n{prefix}: ({new_letter}) {correct_text}'

    return pattern.sub(repl, content)

def call_gemini(prompt: str, retries: int = 2) -> str:
    """Calls Gemini with 8192 max_output_tokens, balanced clients and priority models."""
    config_fast = types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=8192,
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    )
    config_fallback = types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=8192
    )

    primary_c = get_client_for_thread()
    ordered_clients = [primary_c] + [c for c in clients if c != primary_c]

    for c in ordered_clients:
        for model_name in MODELS:
            for attempt in range(1, retries + 1):
                try:
                    try:
                        response = c.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=config_fast,
                        )
                    except Exception as cfg_err:
                        err_str = str(cfg_err).lower()
                        if "thinking" in err_str or "invalid_argument" in err_str or "400" in err_str:
                            response = c.models.generate_content(
                                model=model_name,
                                contents=prompt,
                                config=config_fallback,
                            )
                        else:
                            raise cfg_err

                    if response and response.text:
                        return response.text.strip()
                except Exception as e:
                    err = str(e)
                    if "404" in err or "NOT_FOUND" in err or "400" in err or "INVALID_ARGUMENT" in err:
                        break
                    if "RESOURCE_EXHAUSTED" in err or "quota" in err.lower() or "429" in err:
                        break
                    if "503" in err or "UNAVAILABLE" in err:
                        time.sleep(attempt * 1.5)
                        continue
                    time.sleep(attempt * 1.0)
    return ""

def get_english_prompt(book_en: str, chapter: int) -> str:
    return f"""
You are a precise Bible scholar. Generate a verse-by-verse multiple-choice question (MCQ) for EVERY verse in {book_en} Chapter {chapter}.

CRITICAL RULES:
1. One question per verse. Do not skip any verses from verse 1 to the final verse.
2. 4 choices (A, B, C, D) and the correct answer.
3. STRICT BIBLICAL ACCURACY: The indicated correct answer must be 100% true and factual according to the text of {book_en} Chapter {chapter}.
4. EQUAL OPTION LENGTH & CONCISENESS (CRITICAL):
   - All 4 choices (A, B, C, D) must be concise and of very similar length (1 to 6 words or short phrases).
   - NEVER make the correct answer a long explanatory sentence or quote while distractors are short words.
   - Distractors (wrong choices) must be plausible and match the exact length and style of the correct answer.
5. Plain English text output only. No introductory or concluding remarks.

Format strictly:
[{book_en} {chapter}:Verse_Number]
Question text?
(A) Choice 1
(B) Choice 2
(C) Choice 3
(D) Choice 4
Answer: (Letter) Choice text
"""

def get_tamil_prompt(book_ta: str, chapter: int) -> str:
    return f"""
நீ ஒரு தமிழ் வேதாகம அறிஞர். {book_ta} அதிகாரம் {chapter}-ல் உள்ள ஒவ்வொரு வசனத்திற்கும் (Verse 1 முதல் இறுதி வசனம் வரை) ஒரு பலவுரி வினாவை (MCQ) உருவாக்கவும்.

கட்டாய விதிகள்:
1. ஒவ்வொரு வசனத்திற்கும் கட்டாயம் ஒரு வினா இருக்க வேண்டும். எந்த வசனத்தையும் தவிர்க்கக் கூடாது (Verse-by-Verse for all verses).
2. நான்கு விடைகள் (A, B, C, D) மற்றும் சரியான விடை.
3. வேதாகம உண்மைத்தன்மை: குறிப்பிடப்படும் சரியான விடை பரிசுத்த வேதாகம வசனத்தின்படி (BSI Tamil Bible) 100% உண்மையானதாகவும் துல்லியமானதாகவும் இருக்க வேண்டும்.
4. பெயர்கள் முழுமையாக தமிழில் இருக்க வேண்டும் (Names in Tamil):
   - மனிதர்கள், இடங்கள், கோத்திரங்களின் பெயர்கள் அனைத்தும் முழுமையாக பரிசுத்த வேதாகமத் தமிழில் (BSI Tamil Bible) மட்டுமே இருக்க வேண்டும் (எ.கா: ரூபன், சிமியோன், லேவி, யூதா, இசக்கார், செபுலோன், மனாசே, எப்பிராயீம், பென்யமீன், தாண், ஆசேர், நப்தலி, மோசே, ஆரோன், எலெயாசார்).
   - எக்காரணத்தைக்கொண்டும் ஆங்கில எழுத்துக்களையோ (Reuben, Simeon போன்றவை) பிற மொழி எழுத்துக்களையோ பயன்படுத்தக் கூடாது.
5. சமமான விடை நீளம் மற்றும் சுருக்கம் (Equal Option Length - மிக முக்கியம்):
   - நான்கு தெரிவுகளும் (A, B, C, D) ஒரே அளவிலான சுருக்கமான நீளத்திலும் (1 முதல் 6 வார்த்தைகள்) அமைப்பிலும் இருக்க வேண்டும்.
   - சரியான விடை மட்டும் நீண்ட வாக்கியமாகவும், மற்ற தெரிவுகள் மிகக் குறுகியதாகவும் இருக்கவே கூடாது.
   - தவறான தெரிவுகளும் (Distractors) நம்பத்தகுந்ததாகவும், சரியான தெரிவின் அதே அளவு நீளத்திலும் இருக்க வேண்டும்.
6. எந்த ஒரு அறிமுக உரையும் தேவையில்லை.

வடிவம்:
[{book_ta} {chapter}:வசனம்_எண்]
கேள்வி வாக்கியம்?
(A) விடை 1
(B) விடை 2
(C) விடை 3
(D) விடை 4
விடை: (சரியான எழுத்து) விடை உரை
"""

def get_completed_chapters(filepath: str, regex_pattern: str) -> set:
    if not os.path.exists(filepath):
        return set()
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            matches = re.findall(regex_pattern, content)
            return set(int(m) for m in matches)
    except Exception:
        return set()

def process_bible():
    print(f"=== Turbo Parallel Bible MCQ Generator (Multi-Key & Concurrency) ===", flush=True)
    file_lock = threading.Lock()
    
    for book_index, (book_en, book_ta, total_chapters) in enumerate(BIBLE_BOOKS, start=1):
        filename_clean = book_en.replace(" ", "_").lower()
        en_filepath = os.path.join(DIR_EN, f"{book_index:02d}_{filename_clean}_en.txt")
        ta_filepath = os.path.join(DIR_TA, f"{book_index:02d}_{filename_clean}_ta.txt")
        
        while True:
            with file_lock:
                completed_en = get_completed_chapters(en_filepath, rf"--- {re.escape(book_en.upper())} CHAPTER (\d+) ---")
                completed_ta = get_completed_chapters(ta_filepath, rf"--- {re.escape(book_ta)} அதிகாரம் (\d+) ---")
            
            all_chapters = set(range(1, total_chapters + 1))
            if completed_en >= all_chapters and completed_ta >= all_chapters:
                print(f"[{book_index}/66] {book_en} / {book_ta} ({total_chapters}/{total_chapters} chapters completed).", flush=True)
                break
                
            remaining_chapters = sorted([
                ch for ch in range(1, total_chapters + 1)
                if ch not in completed_en or ch not in completed_ta
            ])
            
            print(f"\n[{book_index}/66] Processing: {book_en} / {book_ta} ({len(remaining_chapters)} remaining of {total_chapters}) [Parallel x4]", flush=True)
            
            def handle_chapter(ch):
                need_en = ch not in completed_en
                need_ta = ch not in completed_ta
                t_ch_start = time.time()
                
                en_text = None
                ta_text = None
                
                if need_en:
                    raw_en = call_gemini(get_english_prompt(book_en, ch))
                    en_text = shuffle_and_balance_mcqs(raw_en, is_tamil=False) if raw_en else None

                if need_ta:
                    raw_ta = call_gemini(get_tamil_prompt(book_ta, ch))
                    ta_text = clean_tamil_text(shuffle_and_balance_mcqs(raw_ta, is_tamil=True)) if raw_ta else None
                
                with file_lock:
                    if en_text:
                        with open(en_filepath, "a", encoding="utf-8") as f_en:
                            f_en.write(f"\n--- {book_en.upper()} CHAPTER {ch} ---\n\n")
                            f_en.write(en_text + "\n\n")
                            f_en.flush()
                        completed_en.add(ch)
                    if ta_text:
                        with open(ta_filepath, "a", encoding="utf-8") as f_ta:
                            f_ta.write(f"\n--- {book_ta} அதிகாரம் {ch} ---\n\n")
                            f_ta.write(ta_text + "\n\n")
                            f_ta.flush()
                        completed_ta.add(ch)
                
                elapsed = time.time() - t_ch_start
                status = f"EN: {'OK' if (en_text or not need_en) else 'RETRY'}, TA: {'OK' if (ta_text or not need_ta) else 'RETRY'}"
                print(f" -> [{book_en}] Chapter {ch}/{total_chapters} ({status}) in {elapsed:.1f}s", flush=True)

            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ch_executor:
                futures = [ch_executor.submit(handle_chapter, ch) for ch in remaining_chapters]
                concurrent.futures.wait(futures)

            with file_lock:
                completed_en = get_completed_chapters(en_filepath, rf"--- {re.escape(book_en.upper())} CHAPTER (\d+) ---")
                completed_ta = get_completed_chapters(ta_filepath, rf"--- {re.escape(book_ta)} அதிகாரம் (\d+) ---")
            if completed_en >= all_chapters and completed_ta >= all_chapters:
                print(f"[{book_index}/66] {book_en} / {book_ta} [Completed!]", flush=True)
                break
            else:
                print(f"[{book_index}/66] Some chapters need retry, waiting 5s before repeating...", flush=True)
                time.sleep(5)

    print("\n All 66 books generated successfully into 'bible_mcqs_english/' and 'bible_mcqs_tamil/'!", flush=True)

if __name__ == "__main__":
    process_bible()
