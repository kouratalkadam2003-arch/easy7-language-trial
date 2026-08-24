# AGENTS.md — دليل الوكلاء الذكيين العاملين على مشروع Easy7

> **آخر تحديث:** 2026-08-23 | **آخر commit مستقر:** `ddc5f30`
> **هذا الملف مكتوب لوكيل AI سيفتح هذا المشروع لأول مرة. اقرأه كاملاً قبل لمس أي شيء.**

---

## 1. هوية المشروع

- **الاسم:** Easy7 Languages (Easy7_Clean_Version)
- **ما هو:** تطبيق تعلم لغات تفاعلي (7 لغات × 6 مستويات CEFR) بوضعين: وضع عادي + وضع قصة سردية، مع راديو AI حي بمقدمين (سارة وخالد) وفويس شات مدعوم بـ Gemini Live API.
- **المالك:** Hithamboy (GitHub) — النشر على Netlify: https://easy7-language-app.netlify.app
- **المستودع:** https://github.com/Hithamboy/easy-7-language-version-1
- **التشغيل المحلي:** `localhost:3010` عبر `server.ts` (tsx + Express + Vite middleware + WebSocketServer غير مستخدم حالياً من الواجهة)

## 2. قواعد التنسيق الحرجة بين الوكلاء (اقرأها مرتين)

هذا المشروع يُطوَّر بواسطة **عدة وكلاء AI بالتوازي** (Hermes/Claude + Google Gemini + آخرون). القواعد التالية وُضعت بعد حوادث فعلية:

1. 🚫 **ممنوع نهائياً `git push --force`** — قد يمحو commits وكيل آخر يعمل بالتوازي.
2. ✅ **قبل كل push: نفّذ `git pull --rebase origin main` أولاً** — لا دفع أعمى أبداً.
3. 🔒 **ملكية المسارات:** لا تلمس ملفاً يعمل عليه وكيل آخر في نفس اللحظة. اسأل المستخدم إن لم تكن متأكداً.
4. 📝 **رسائل commit وصفية** تذكر *ماذا* و*لماذا* — هي وسيلة تواصلنا الوحيدة.
5. ⚠️ **ملفات قد يتزامن عليها أكثر من وكيل** (كن حذراً معها): `src/components/RadioStage.tsx`, `src/hooks/useLiveRadio.ts`, `src/components/VoiceChatStage.tsx`, `src/constants.ts`.
6. 📦 **مسارات ملكية Hermes (لا تُلمس دون تنسيق):** `public/lessons/`, `public/story_lessons/`, `src/story/`.
7. 📄 **ملفات التوثيق المرجعية:**
   - `SYSTEM_PROMPTS.md`: يحتوي على كافة البرومبتات الإنتاجية الجاهزة وقوالب الـ CEFR (A0 إلى C2).
   - `INCIDENTS.md`: يوثق المشاكل التاريخية وحلولها بالتفصيل.

## 3. خريطة البنية السريعة

```
Easy7_Clean_Version/
├── server.ts                  # سيرفر dev على 3010 (Express + Vite middleware)
├── public/
│   ├── lessons/               # 1260 درساً عادياً {lang}/{level}/day{N}.json (ملكية Hermes)
│   ├── story_lessons/         # 1260 درس قصة LINGO_STORY_LESSON_V1 (ملكية Hermes)
│   └── assets/ scenes/        # صور المشاهد وفيديوهات الأفاتار
├── src/
│   ├── pages/LessonPage.tsx       # صفحة الدرس العادي (7 مراحل) — تجلب من /lessons
│   ├── pages/LearnPage.tsx        # خريطة التعلم (30 محطة × 6 أيام) NORMAL_UNITS/STORY_UNITS
│   ├── data/curriculum/normalMap.ts + storyMap.ts  # أيام 1..180 → A1..C2
│   ├── data/lessons/              # سجل الدروس المدمجة (registry) + types
│   ├── story/                     # محرك وضع القصة: StoryLessonRunner + StoryLessonPlayer (ملكية Hermes)
│   ├── components/RadioStage.tsx      # الراديو (حي + قياسي)
│   ├── hooks/useLiveRadio.ts          # جلسات Gemini Live لسارة وخالد (جلستان منفصلتان)
│   ├── components/VoiceChatStage.tsx  # الفويس شات — اتصال مباشر بـ Gemini Live من المتصفح
│   ├── components/GlobalRadioScreen.tsx # توليد محتوى الراديو (TEXT_MODEL)
│   ├── constants.ts + src/constants.ts  # انتبه: نسختان! LIVE_API_MODEL/TEXT_MODEL/TTS_MODEL
│   └── utils/phonetics.ts             # تحويل Romaji/Pinyin → نطق عربي
└── dist/                      # بناء الإنتاج — هذا ما يُنشر على Netlify (~60MB)
```

## 4. مفاتيح تقنية لا تخطئ فيها

- **اليابانية تُعرض Romaji افتراضياً، والصينية Pinyin افتراضياً** — والنص الأصلي (Kanji/Hanzi) فقط عند طلب المستخدم بزر التبديل. هذه قاعدة product ثابتة في كل مراحل الدروس. لا "تصلحها" لتعرض الأصلي افتراضياً.
- **الترجمة العربية تبقى ظاهرة دائماً** + سطر "النطق بالأحرف العربية" (phonetics.ts).
- **مستوى المتعلم (CEFR) مربوط بالذكاء الاصطناعي (A0..C2)** — سارة وخالد وليث يتكلمون بنفس مستوى المستخدم بالضبط، مع قيود صارمة على المفردات وسرعة النطق وطول الجمل في `cefrGuidelines.ts`.
- **الأصوات الحالية (مهم جداً!):** في **الـ Live API** لا تعمل إلا `Kore` (أنثوي) و`Puck` (رجولي خشن) — تم التحقق بالتجربة: `Sulafat` و`Algenib` و`Aoede` **لا تُخرج صوتاً** في Live API (صامتة تماماً، مخصصة للـ TTS الثابت فقط). سارة = `Kore`، خالد = `Puck`.
- **الموديلات:** `gemini-3.1-flash-live-preview` للـ Live API فقط (WebSocket bidi) — **لا تستخدمه أبداً مع REST generateContent** (404 مضمون). للنصوص: `TEXT_MODEL` (`gemini-3.6-flash`). للصوت TTS: `gemini-3.1-flash-tts-preview`.
- **قفل الأدوار الصارم (Strict Role Lock):** ممنوع منعاً باتاً أن يتكلم خالد في مكان سارة أو سارة في مكان خالد في أي سيناريو (Live Radio أو النصي). كل مقدم يلتزم بصوته ودوره وشخصيته المستقلة فقط، ولا يجوز للمقدم محاكاة صوت الآخر أو الحديث باسمه في نفس التبادل الحواري.
- **كاش الدروس:** مفتاح IndexedDB يبدأ بـ `lesson_v2_` — ارفع الإصدار (`v3`) إذا عدّلت بنية JSON.

## 5. البيئة والأسرار

- `.env` محلي يحوي `VITE_GEMINI_API_KEY` (يبدأ بـ `AQ.` — مفتاح صالح مؤكد بالاختبار المباشر ضد Live API).
- GitHub Secrets مضبوطة: `VITE_GEMINI_API_KEY`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.
- النشر تلقائي: أي push على main → GitHub Actions (`.github/workflows/deploy.yml`) → build → Netlify.

## 6. مشاكل تاريخية حُلَّت (لا تكررها!)

انظر `INCIDENTS.md` للتفاصيل الكاملة.
