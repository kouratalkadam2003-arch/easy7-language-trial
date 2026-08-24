
export enum Type {
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT"
}
import { Language, Station, Topic } from './types';

// Constants for replacement in templates
const TARGET_LANGUAGE_VAR = "{TARGET_LANGUAGE_NAME}";
const NATIVE_LANGUAGE_VAR = "{NATIVE_LANGUAGE_NAME}";
const TRANSLATED_STORY_TEXT = "{TRANSLATED_STORY_TEXT}";
const JSON_OUTPUT_RULE = "Return valid JSON.";

// Note: this file is NOT imported by the SPA (Vite only builds from src/).
// Kept for backward compat with root-level scripts. Use src/constants.ts in React code.
export const LIVE_API_MODEL = 'gemini-3.1-flash-live-preview';
export const TEXT_MODEL = 'gemini-3.6-flash';
export const TTS_MODEL = 'gemini-3.1-flash-tts-preview';

export const ALL_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', englishName: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ja', name: '日本語', englishName: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', englishName: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', englishName: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', englishName: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Deutsch', englishName: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', englishName: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export const TARGET_LANGUAGES = ALL_LANGUAGES.filter(l => l.code !== 'ar');

// --- 30 DAYS / 10 STATIONS CURRICULUM ---
export const CEFR_CURRICULUM: Record<string, Record<string, { stationName: string; topics: import("./types").Topic[] }>> = {
  'A1': {
    Station1: {
      stationName: "المحطة 1: الهوية",
      topics: [
        { id: 'A1_s1_d1', title: 'اسمي (My name)' },
        { id: 'A1_s1_d2', title: 'من أين (Where from)' },
        { id: 'A1_s1_d3', title: 'عمري (My age)' },
        { id: 'A1_s1_d4', title: 'تحية (Greeting)' },
        { id: 'A1_s1_d5', title: 'مرحبا / وداعاً' },
        { id: 'A1_s1_d6', title: 'كيف حالك؟' },
        { id: 'A1_s1_d7', title: 'مراجعة شاملة (1-6)' },
      ]
    },
    Station2: {
      stationName: "المحطة 2: البيئة المحيطة",
      topics: [
        { id: 'A1_s2_d8', title: 'بيتي (My home)' },
        { id: 'A1_s2_d9', title: 'غرفة (Room)' },
        { id: 'A1_s2_d10', title: 'طعام (Food)' },
        { id: 'A1_s2_d11', title: 'أريد (I want)' },
        { id: 'A1_s2_d12', title: 'لا أريد (I don\'t want)' },
        { id: 'A1_s2_d13', title: 'ماء / قهوة' },
        { id: 'A1_s2_d14', title: 'مراجعة شاملة (8-13)' },
      ]
    },
    Station3: {
      stationName: "المحطة 3: المدرسة والعمل",
      topics: [
        { id: 'A1_s3_d15', title: 'عمل (Work/Job)' },
        { id: 'A1_s3_d16', title: 'طالب (Student)' },
        { id: 'A1_s3_d17', title: 'أستاذ (Teacher)' },
        { id: 'A1_s3_d18', title: 'كتاب (Book)' },
        { id: 'A1_s3_d19', title: 'مكتب (Office/Desk)' },
        { id: 'A1_s3_d20', title: 'يوم (Day)' },
        { id: 'A1_s3_d21', title: 'مراجعة شاملة (15-20)' },
      ]
    },
    Station4: {
      stationName: "المحطة 4: الاحتياجات الحيوية",
      topics: [
        { id: 'A1_s4_d22', title: 'جوعان (Hungry)' },
        { id: 'A1_s4_d23', title: 'كم؟ (How much?)' },
        { id: 'A1_s4_d24', title: 'فاتورة (Bill)' },
        { id: 'A1_s4_d25', title: 'مريض (Sick)' },
        { id: 'A1_s4_d26', title: 'دكتور (Doctor)' },
        { id: 'A1_s4_d27', title: 'مساعدة (Help)' },
        { id: 'A1_s4_d28', title: 'مراجعة شاملة (22-27)' },
      ]
    },
    Station5: {
      stationName: "المحطة 5: الختام",
      topics: [
        { id: 'A1_s5_d29', title: 'أحب / أكره' },
        { id: 'A1_s5_d30', title: 'امتحان المستوى (A1)' },
      ]
    },
  },
  'A2': {
    Station1: {
      stationName: "المحطة 1: الروابط الاجتماعية",
      topics: [
        { id: 'A2_s1_d1', title: 'تعرفت على (I met)' },
        { id: 'A2_s1_d2', title: 'طفولتي (My childhood)' },
        { id: 'A2_s1_d3', title: 'الطقس (Weather)' },
        { id: 'A2_s1_d4', title: 'أصدقائي (My friends)' },
        { id: 'A2_s1_d5', title: 'نظيف / فوضى' },
        { id: 'A2_s1_d6', title: 'رياضة (Sport)' },
        { id: 'A2_s1_d7', title: 'مراجعة شاملة (1-6)' },
      ]
    },
    Station2: {
      stationName: "المحطة 2: نمط العيش",
      topics: [
        { id: 'A2_s2_d8', title: 'روتيني (My routine)' },
        { id: 'A2_s2_d9', title: 'أستيقظ (I wake up)' },
        { id: 'A2_s2_d10', title: 'متأخر (Late)' },
        { id: 'A2_s2_d11', title: 'تعبان (Tired)' },
        { id: 'A2_s2_d12', title: 'استرحت (I rested)' },
        { id: 'A2_s2_d13', title: 'أكل صحي (Healthy food)' },
        { id: 'A2_s2_d14', title: 'مراجعة شاملة (8-13)' },
      ]
    },
    Station3: {
      stationName: "المحطة 3: العمل والدراسة",
      topics: [
        { id: 'A2_s3_d15', title: 'زميل (Colleague)' },
        { id: 'A2_s3_d16', title: 'مشروع (Project)' },
        { id: 'A2_s3_d17', title: 'موعد (Appointment)' },
        { id: 'A2_s3_d18', title: 'ضغط (Pressure)' },
        { id: 'A2_s3_d19', title: 'نجحت (I succeeded)' },
        { id: 'A2_s3_d20', title: 'فشلت (I failed)' },
        { id: 'A2_s3_d21', title: 'مراجعة شاملة (15-20)' },
      ]
    },
    Station4: {
      stationName: "المحطة 4: الاستكشاف",
      topics: [
        { id: 'A2_s4_d22', title: 'سافرت (I traveled)' },
        { id: 'A2_s4_d23', title: 'فندق (Hotel)' },
        { id: 'A2_s4_d24', title: 'ضايع (Lost)' },
        { id: 'A2_s4_d25', title: 'خريطة (Map)' },
        { id: 'A2_s4_d26', title: 'جار (Neighbor)' },
        { id: 'A2_s4_d27', title: 'سوق (Market)' },
        { id: 'A2_s4_d28', title: 'مراجعة شاملة (22-27)' },
      ]
    },
    Station5: {
      stationName: "المحطة 5: الختام",
      topics: [
        { id: 'A2_s5_d29', title: 'رأيي (My opinion)' },
        { id: 'A2_s5_d30', title: 'امتحان المستوى (A2)' },
      ]
    },
  },
  'B1': {
    Station1: {
      stationName: "المحطة 1: الهوية والقيم",
      topics: [
        { id: 'B1_s1_d1', title: 'قيمة (Value)' },
        { id: 'B1_s1_d2', title: 'طموح (Ambition)' },
        { id: 'B1_s1_d3', title: 'بيئة (Environment)' },
        { id: 'B1_s1_d4', title: 'ثقافة (Culture)' },
        { id: 'B1_s1_d5', title: 'توازن (Balance)' },
        { id: 'B1_s1_d6', title: 'فريق (Team)' },
        { id: 'B1_s1_d7', title: 'مراجعة شاملة (1-6)' },
      ]
    },
    Station2: {
      stationName: "المحطة 2: المسار المهني",
      topics: [
        { id: 'B1_s2_d8', title: 'مهارة (Skill)' },
        { id: 'B1_s2_d9', title: 'مقابلة (Interview)' },
        { id: 'B1_s2_d10', title: 'ترقية (Promotion)' },
        { id: 'B1_s2_d11', title: 'استقلت (I resigned)' },
        { id: 'B1_s2_d12', title: 'مسؤولية (Responsibility)' },
        { id: 'B1_s2_d13', title: 'حل (Solution)' },
        { id: 'B1_s2_d14', title: 'مراجعة شاملة (8-13)' },
      ]
    },
    Station3: {
      stationName: "المحطة 3: المجتمع والعلاقات",
      topics: [
        { id: 'B1_s3_d15', title: 'جيل (Generation)' },
        { id: 'B1_s3_d16', title: 'تطوع (Volunteering)' },
        { id: 'B1_s3_d17', title: 'ثقة (Trust)' },
        { id: 'B1_s3_d18', title: 'خيانة (Betrayal)' },
        { id: 'B1_s3_d19', title: 'انتقاد (Criticism)' },
        { id: 'B1_s3_d20', title: 'حل النزاع (Conflict resolution)' },
        { id: 'B1_s3_d21', title: 'مراجعة شاملة (15-20)' },
      ]
    },
    Station4: {
      stationName: "المحطة 4: الإعلام والتقنية",
      topics: [
        { id: 'B1_s4_d22', title: 'ذكاء اصطناعي (AI)' },
        { id: 'B1_s4_d23', title: 'خوارزمية (Algorithm)' },
        { id: 'B1_s4_d24', title: 'خصوصية (Privacy)' },
        { id: 'B1_s4_d25', title: 'وسائل التواصل (Social media)' },
        { id: 'B1_s4_d26', title: 'إدمان (Addiction)' },
        { id: 'B1_s4_d27', title: 'توفير (Saving)' },
        { id: 'B1_s4_d28', title: 'مراجعة شاملة (22-27)' },
      ]
    },
    Station5: {
      stationName: "المحطة 5: الختام",
      topics: [
        { id: 'B1_s5_d29', title: 'نصيحة (Advice)' },
        { id: 'B1_s5_d30', title: 'امتحان المستوى (B1)' },
      ]
    },
  },
  'B2': {
    Station1: {
      stationName: "المحطة 1: سيكولوجيا التواصل",
      topics: [
        { id: 'B2_s1_d1', title: 'انطباع أول (First impression)' },
        { id: 'B2_s1_d2', title: 'ذكاء عاطفي (Emotional intelligence)' },
        { id: 'B2_s1_d3', title: 'تغير مناخي (Climate change)' },
        { id: 'B2_s1_d4', title: 'نجاح (Success)' },
        { id: 'B2_s1_d5', title: 'إبداع (Creativity)' },
        { id: 'B2_s1_d6', title: 'جماهير (Crowds/Fans)' },
        { id: 'B2_s1_d7', title: 'مراجعة شاملة (1-6)' },
      ]
    },
    Station2: {
      stationName: "المحطة 2: ريادة الأعمال",
      topics: [
        { id: 'B2_s2_d8', title: 'شركة ناشئة (Startup)' },
        { id: 'B2_s2_d9', title: 'أخلاقيات (Ethics)' },
        { id: 'B2_s2_d10', title: 'قيادة (Leadership)' },
        { id: 'B2_s2_d11', title: 'فساد (Corruption)' },
        { id: 'B2_s2_d12', title: 'استدامة (Sustainability)' },
        { id: 'B2_s2_d13', title: 'منافسة (Competition)' },
        { id: 'B2_s2_d14', title: 'مراجعة شاملة (8-13)' },
      ]
    },
    Station3: {
      stationName: "المحطة 3: العلم والصحة",
      topics: [
        { id: 'B2_s3_d15', title: 'طب بديل (Alternative medicine)' },
        { id: 'B2_s3_d16', title: 'صناعة أدوية (Pharma)' },
        { id: 'B2_s3_d17', title: 'صحة نفسية (Mental health)' },
        { id: 'B2_s3_d18', title: 'جينات (Genetics)' },
        { id: 'B2_s3_d19', title: 'وباء (Epidemic)' },
        { id: 'B2_s3_d20', title: 'أزمة (Crisis)' },
        { id: 'B2_s3_d21', title: 'مراجعة شاملة (15-20)' },
      ]
    },
    Station4: {
      stationName: "المحطة 4: الاقتصاد والمجتمع",
      topics: [
        { id: 'B2_s4_d22', title: 'عولمة (Globalization)' },
        { id: 'B2_s4_d23', title: 'ضريبة (Tax)' },
        { id: 'B2_s4_d24', title: 'عملة مشفرة (Crypto)' },
        { id: 'B2_s4_d25', title: 'هجرة (Immigration)' },
        { id: 'B2_s4_d26', title: 'عدالة اجتماعية (Social justice)' },
        { id: 'B2_s4_d27', title: 'نزاع عمالي (Labor dispute)' },
        { id: 'B2_s4_d28', title: 'مراجعة شاملة (22-27)' },
      ]
    },
    Station5: {
      stationName: "المحطة 5: الختام",
      topics: [
        { id: 'B2_s5_d29', title: 'إقناع (Persuasion)' },
        { id: 'B2_s5_d30', title: 'امتحان المستوى (B2)' },
      ]
    },
  },
  'C1': {
    Station1: {
      stationName: "المحطة 1: اللغة كأداة",
      topics: [
        { id: 'C1_s1_d1', title: 'هوية ثقافية (Cultural identity)' },
        { id: 'C1_s1_d2', title: 'سخرية (Sarcasm/Irony)' },
        { id: 'C1_s1_d3', title: 'نزاع جيوسياسي (Geopolitical conflict)' },
        { id: 'C1_s1_d4', title: 'ابتكار (Innovation)' },
        { id: 'C1_s1_d5', title: 'تركيز عميق (Deep focus)' },
        { id: 'C1_s1_d6', title: 'رياضة ودبلوماسية (Sport & diplomacy)' },
        { id: 'C1_s1_d7', title: 'مراجعة شاملة (1-6)' },
      ]
    },
    Station2: {
      stationName: "المحطة 2: المؤسسات والأنظمة",
      topics: [
        { id: 'C1_s2_d8', title: 'حوكمة (Governance)' },
        { id: 'C1_s2_d9', title: 'منظومة تعليمية (Education system)' },
        { id: 'C1_s2_d10', title: 'تفاوض (Negotiation)' },
        { id: 'C1_s2_d11', title: 'شفافية (Transparency)' },
        { id: 'C1_s2_d12', title: 'فلسفة التعليم (Education philosophy)' },
        { id: 'C1_s2_d13', title: 'نزاع (Conflict)' },
        { id: 'C1_s2_d14', title: 'مراجعة شاملة (8-13)' },
      ]
    },
    Station3: {
      stationName: "المحطة 3: الإعلام والوعي",
      topics: [
        { id: 'C1_s3_d15', title: 'خطاب سياسي (Political speech)' },
        { id: 'C1_s3_d16', title: 'دعاية (Propaganda)' },
        { id: 'C1_s3_d17', title: 'وعي زائف (False consciousness)' },
        { id: 'C1_s3_d18', title: 'رأي عام (Public opinion)' },
        { id: 'C1_s3_d19', title: 'صحافة (Journalism)' },
        { id: 'C1_s3_d20', title: 'رقابة (Censorship)' },
        { id: 'C1_s3_d21', title: 'مراجعة شاملة (15-20)' },
      ]
    },
    Station4: {
      stationName: "المحطة 4: الفن والنقد",
      topics: [
        { id: 'C1_s4_d22', title: 'نقد فني (Art critique)' },
        { id: 'C1_s4_d23', title: 'رمزية (Symbolism)' },
        { id: 'C1_s4_d24', title: 'أدب رحلات (Travel literature)' },
        { id: 'C1_s4_d25', title: 'رأسمالية (Capitalism)' },
        { id: 'C1_s4_d26', title: 'بورصة (Stock market)' },
        { id: 'C1_s4_d27', title: 'ملكية فكرية (Intellectual property)' },
        { id: 'C1_s4_d28', title: 'مراجعة شاملة (22-27)' },
      ]
    },
    Station5: {
      stationName: "المحطة 5: الختام",
      topics: [
        { id: 'C1_s5_d29', title: 'خطابة (Public speaking)' },
        { id: 'C1_s5_d30', title: 'امتحان المستوى (C1)' },
      ]
    },
  },
  'C2': {
    Station1: {
      stationName: "المحطة 1: اللغة والفكر",
      topics: [
        { id: 'C2_s1_d1', title: 'هوية فكرية (Intellectual identity)' },
        { id: 'C2_s1_d2', title: 'ذكاء لغوي (Linguistic intelligence)' },
        { id: 'C2_s1_d3', title: 'مفارقة (Paradox)' },
        { id: 'C2_s1_d4', title: 'هواية وجودية (Existential hobby)' },
        { id: 'C2_s1_d5', title: 'إنتاجية (Productivity)' },
        { id: 'C2_s1_d6', title: 'تنافسية (Competitiveness)' },
        { id: 'C2_s1_d7', title: 'مراجعة شاملة (1-6)' },
      ]
    },
    Station2: {
      stationName: "المحطة 2: الفكر المؤسسي",
      topics: [
        { id: 'C2_s2_d8', title: 'ذكاء اصطناعي فائق (AGI)' },
        { id: 'C2_s2_d9', title: 'بحث أكاديمي (Academic research)' },
        { id: 'C2_s2_d10', title: 'قيادة كلية (Macro leadership)' },
        { id: 'C2_s2_d11', title: 'ابتكار المعرفة (Knowledge innovation)' },
        { id: 'C2_s2_d12', title: 'منهجية (Methodology)' },
        { id: 'C2_s2_d13', title: 'استراتيجية كبرى (Grand strategy)' },
        { id: 'C2_s2_d14', title: 'مراجعة شاملة (8-13)' },
      ]
    },
    Station3: {
      stationName: "المحطة 3: الأخلاق والبيولوجيا",
      topics: [
        { id: 'C2_s3_d15', title: 'تلاعب جيني (Genetic manipulation)' },
        { id: 'C2_s3_d16', title: 'سياسة صحية (Health policy)' },
        { id: 'C2_s3_d17', title: 'سيكولوجيا الخوف (Psychology of fear)' },
        { id: 'C2_s3_d18', title: 'أمن غذائي (Food security)' },
        { id: 'C2_s3_d19', title: 'وباء عالمي (Global pandemic)' },
        { id: 'C2_s3_d20', title: 'أخلاقيات طبية (Medical ethics)' },
        { id: 'C2_s3_d21', title: 'مراجعة شاملة (15-20)' },
      ]
    },
    Station4: {
      stationName: "المحطة 4: ما وراء الإنسانية",
      topics: [
        { id: 'C2_s4_d22', title: 'فضاء سيبراني (Cyberspace ethics)' },
        { id: 'C2_s4_d23', title: 'وعي جماعي (Collective consciousness)' },
        { id: 'C2_s4_d24', title: 'نقد سينمائي معمق (Deep film critique)' },
        { id: 'C2_s4_d25', title: 'استهلاك (Consumption)' },
        { id: 'C2_s4_d26', title: 'جيوسياسة مالية (Financial geopolitics)' },
        { id: 'C2_s4_d27', title: 'قانون تجاري دولي (International trade law)' },
        { id: 'C2_s4_d28', title: 'مراجعة شاملة (22-27)' },
      ]
    },
    Station5: {
      stationName: "المحطة 5: الختام",
      topics: [
        { id: 'C2_s5_d29', title: 'مناظرة (Debate)' },
        { id: 'C2_s5_d30', title: 'امتحان المستوى (C2)' },
      ]
    },
  },
};

// Fallback export to not break existing imports right away, defaults to A1
export const TOPICS = CEFR_CURRICULUM['A1'];

const createStationsData = (): Station[] => {
    const stations: Station[] = [];
    let dayCounter = 1;
    (Object.values(TOPICS)).forEach(stationInfo => {
        stations.push({
            stationName: stationInfo.stationName,
            arabicStationName: stationInfo.stationName,
            days: stationInfo.topics.map(topic => ({
                dayNumber: dayCounter++,
                title: topic.title,
                arabicTitle: topic.title
            }))
        });
    });
    return stations;
};

export const STATIONS_DATA: Station[] = createStationsData();

// --- MAP COORDINATES (Bottom to Top) ---
// Generated to create a winding "S" path with good spacing
// 30 Levels (3 per station) + Gaps for Gates
export const LEVEL_COORDINATES = [
    // Station 1 (Bottom)
    { x: 600, y: 5800 }, // Day 1
    { x: 400, y: 5650 }, // Day 2
    { x: 250, y: 5500 }, // Day 3
    
    // Station 2
    { x: 250, y: 5150 }, // Day 4
    { x: 450, y: 5000 }, // Day 5
    { x: 750, y: 4900 }, // Day 6

    // Station 3
    { x: 950, y: 4600 }, // Day 7
    { x: 800, y: 4450 }, // Day 8
    { x: 600, y: 4350 }, // Day 9

    // Station 4
    { x: 300, y: 4050 }, // Day 10
    { x: 200, y: 3900 }, // Day 11
    { x: 350, y: 3750 }, // Day 12

    // Station 5
    { x: 600, y: 3450 }, // Day 13
    { x: 850, y: 3350 }, // Day 14
    { x: 950, y: 3200 }, // Day 15

    // Station 6
    { x: 800, y: 2900 }, // Day 16
    { x: 550, y: 2800 }, // Day 17
    { x: 300, y: 2700 }, // Day 18

    // Station 7
    { x: 200, y: 2400 }, // Day 19
    { x: 400, y: 2250 }, // Day 20
    { x: 700, y: 2150 }, // Day 21

    // Station 8
    { x: 900, y: 1850 }, // Day 22
    { x: 800, y: 1700 }, // Day 23
    { x: 550, y: 1600 }, // Day 24

    // Station 9
    { x: 300, y: 1300 }, // Day 25
    { x: 250, y: 1150 }, // Day 26
    { x: 450, y: 1000 }, // Day 27

    // Station 10 (Top)
    { x: 700, y: 700 }, // Day 28
    { x: 900, y: 550 }, // Day 29
    { x: 600, y: 350 }, // Day 30 (Finish)
];

// Gates placed visually between the 5 stations
export const STAGE_GATE_COORDINATES = [
    { x: 875, y: 4525, stationIndex: 2 }, // After D7
    { x: 900, y: 3275, stationIndex: 3 }, // After D14
    { x: 800, y: 2000, stationIndex: 4 }, // After D21
    { x: 800, y: 625, stationIndex: 5 }, // After D28
    { x: 600, y: 150, stationIndex: -1, levelName: "🏆 النهاية!" }, // After D30
];

export const MAP_BACKGROUND_IMAGE_PROMPT = "A colorful, whimsical map for a language learning adventure game. Top down view. Winding path through diverse landscapes: forests, mountains, deserts, cities. Cartoon style, vibrant colors, vector art style.";

export interface TeacherPersona {
    name: string;
    voiceName: string;
    personality: string;
    colors: {
        head: string;
        body: string;
        limbs: string;
        blush: string;
    };
    accessory?: 'beret' | 'headband' | 'antenna' | 'crown' | 'glasses' | 'sunglasses';
}

export const TEACHER_PERSONAS: Record<string, TeacherPersona> = {
    'en': { 
        name: 'Mr. James', 
        voiceName: 'Puck', 
        personality: 'Professional, clear, encouraging.',
        colors: { head: '#ffdbac', body: '#1e3a8a', limbs: '#000000', blush: '#ffb7b2' }, // British Suit
        accessory: 'glasses'
    },
    'ja': { 
        name: 'Yuki-Sensei', 
        voiceName: 'Kore', 
        personality: 'Polite, cheerful, patient.',
        colors: { head: '#1e293b', body: '#f472b6', limbs: '#fbcfe8', blush: '#fda4af' }, // Pink/White Kimono vibe
        accessory: 'headband' // Can represent a hair accessory
    },
    'zh': { 
        name: 'Li-Laoshi', 
        voiceName: 'Fenrir', // Deep voice for Chinese
        personality: 'Wise, calm, structured.',
        colors: { head: '#1e293b', body: '#dc2626', limbs: '#fcd34d', blush: '#fca5a5' }, // Red/Gold Cheongsam vibe
        accessory: 'antenna' // Can represent a hair pin
    },
    'es': { 
        name: 'Señora Maria', 
        voiceName: 'Puck', // Strong voice for Spanish
        personality: 'Warm, passionate, expressive.',
        colors: { head: '#451a03', body: '#ef4444', limbs: '#000000', blush: '#fca5a5' }, // Flamenco Red/Black vibe
        accessory: 'headband' // Rose in hair vibe
    },
    'fr': { 
        name: 'Mme Sophie', 
        voiceName: 'Kore', // Soft voice for French
        personality: 'Elegant, precise, artistic.',
        colors: { head: '#78350f', body: '#1e293b', limbs: '#e2e8f0', blush: '#fbcfe8' }, // Striped shirt / chic dark blazer vibe
        accessory: 'beret'
    },
    'de': { 
        name: 'Herr Schmidt', 
        voiceName: 'Fenrir', // Strong voice for German
        personality: 'Organized, direct, helpful.',
        colors: { head: '#fef08a', body: '#14532d', limbs: '#854d0e', blush: '#e5e5e5' }, // Trachten/Lederhosen Green/Brown vibe
        accessory: 'glasses'
    },
    'it': { 
        name: 'Signor Rossi', 
        voiceName: 'Puck', 
        personality: 'Friendly, animated, enthusiastic.',
        colors: { head: '#451a03', body: '#ffffff', limbs: '#16a34a', blush: '#fca5a5' }, // White shirt, green/red accents
        accessory: 'sunglasses' // Stylish Italian look
    },
    'ar': { 
        name: 'Murshid (Guide)', 
        voiceName: 'Zephyr', // Clear voice for Arabic
        personality: 'Welcoming, supportive, wise.',
        colors: { head: '#1e293b', body: '#ffffff', limbs: '#ffffff', blush: '#fda4af' }, // White Thobe vibe
        accessory: 'headband' // Agal vibe
    },
    'guide': { 
        name: 'Rushdi', 
        voiceName: 'Zephyr', 
        personality: 'Helpful guide for the app.',
        colors: { head: '#1e293b', body: '#111827', limbs: '#000000', blush: 'transparent' }, 
        accessory: 'sunglasses'
    }
};

export const FIXED_CHARACTERS: Record<string, { A: { name: string, voice: string }, B: { name: string, voice: string } }> = {
    'en': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
    'ja': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
    'fr': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
    'es': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
    'de': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
    'it': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
    'zh': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
    'ar': { A: { name: 'Eli', voice: 'Kore' }, B: { name: 'Laith', voice: 'Fenrir' } },
};

export const VOICE_POOLS = {
    male: ['Puck', 'Fenrir', 'Charon', 'Zephyr'],
    female: ['Kore', 'Aoede']
};

export const CREATOR_PERSONA = `You are a lesson creator.
Target: {TARGET_LANGUAGE_NAME}.
User: {NATIVE_LANGUAGE_NAME}.`;

export const TEXT_READING_SYSTEM_PROMPT_TEMPLATE = `
You are a linguistic assistant in a multilingual educational app structured as an interactive story.
Your task is to create a story dialogue for Lesson {LESSON_NUMBER}: "{TOPIC_TITLE}".
Level: {PROFICIENCY_LEVEL}.
Length: 7-10 turns.

**STORY CONTEXT:**
The main characters are Laith (ليث) - a 22-year-old traveler/learner, and Eli (إيلي) - a 20-year-old local girl who lives in a humble hut with a small farm plot, a few chickens, and an old goat. Eli is teaching Laith the language and how to survive/trade in this village.
This dialogue should reflect the topic (e.g., if it's "Greetings", they are meeting people in the village market, or if it's "Shopping", Eli is showing Laith how to buy things).

**GOLDEN RULES FOR TEXT-TO-SPEECH (TTS):**
1. **Separation of Display vs Speech:**
   - \`originalText\`: The text displayed to the learner. Can use Pinyin (CN) or Romaji (JP) for beginners.
   - \`nativeScriptText\`: The text sent to the TTS engine. MUST be the native script.
2. **Language Specifics:**
   - **Chinese (zh):** \`nativeScriptText\` MUST be Hanzi (汉字) ONLY.
   - **Japanese (ja):** \`nativeScriptText\` MUST be Kanji/Kana ONLY.
   - **Others:** \`nativeScriptText\` usually equals \`originalText\`.
3. **No Romanization in TTS:** The \`nativeScriptText\` MUST NOT contain Pinyin or Romaji.

**FORMAT RULES:**
1. Use distinct speaker names (e.g., "Eli", "Laith", or a shopkeeper).
2. Write EACH turn on a new line.
3. Strict format: "SpeakerName: The spoken text."
4. Adapt to {TARGET_LANGUAGE_NAME} culture.

Previous Context:
{STORY_SO_FAR_CONTEXT}

Output JSON:
- originalText: Display text (Script format).
- nativeScriptText: TTS text (Native Script ONLY, Script format).
- translatedText: Arabic translation in script format ("الاسم: النص").
- wordList: Array of { word, native_script, translation }.
- grammarTip: { title, tip } (Arabic).
`;

export const MEMORY_DRILL_PROMPT_TEMPLATE = `
Source Text:
"{STORY_TEXT}"

Task: Create a memory drill for **EVERY SINGLE SENTENCE/PHRASE** in the source text above.

**CRITICAL RULES:**
1. **EXACT MATCH:** The 'originalSentence' MUST be an exact copy of a line from the source text. DO NOT invent new sentences.
2. **ONE SENTENCE PER DRILL.** You must NOT combine multiple sentences into one drill item.
3. **ITERATE SEQUENTIALLY:** Go through the dialogue line by line.
4. **FULL COVERAGE:** Do not skip any line.

This creates the 3-Way Memory System: Repetition (Shadowing), Imagination (Visualization), Change (Substitution).

{JP_CH_RULE_PLACEHOLDER}

For each drill object:
- originalSentence: EXACT sentence from the "Source Text". DO NOT makeup new sentences.
- translation: Arabic translation.
- arabicPronunciation: The phonetic pronunciation of 'originalSentence' written using Arabic letters.
- nativeScript: {TARGET_LANGUAGE_NAME} native script.
- visualizationPrompt: A **Scenario-Based** prompt in **Arabic (العربية)**.
  - Structure: "تخيل أنك [موقف]. تحتاج أن تقول..."
- contextualCue: A specific phrase in {TARGET_LANGUAGE_NAME} that the OTHER person says **immediately before** the 'originalSentence'.
  - It must logically PROMPT the user to say the 'originalSentence'.
- emoji: A single expressive emoji.
- substitutions: **3 to 6** distinct variations.
  - Keep the sentence structure but change ONE key element.
`;

export const MESSENGER_CHAT_PROMPT_TEMPLATE = `
You are Eli (إيلي), a 20-year-old local girl helping Laith (ليث) (the user) learn the language.
Target Language: {TARGET_LANGUAGE_NAME}. User's Native Language: {NATIVE_LANGUAGE_NAME}.
User Level: {PROFICIENCY_LEVEL}.
Scenario/Topic: {SCENARIO_DESCRIPTION}.

Task: Start the conversation. Write EXACTLY ONE message to the user, asking a simple question to get them talking about what happened today (the lesson topic) or about village life.
The conversation MUST use vocabulary from the context.
Return it as an array with ONE message where speaker is "A" (Eli).
`;

export const REVIEW_CARD_CREATION_PROMPT_TEMPLATE = `
**Task:** Convert the provided story text into Anki flashcards.
**CRITICAL:** You must create a separate flashcard for **EVERY SINGLE SENTENCE** in the "Source ${TARGET_LANGUAGE_VAR}" text.
**STRICT RULE:** Coverage must be 100% of the sentences in the text (Expect at least 10 cards). Do not miss any sentence.

**Source ${TARGET_LANGUAGE_VAR}:**
{STORY_TEXT}

**Translation:**
{TRANSLATED_STORY_TEXT}

**Source Native Script:**
{NATIVE_STORY_TEXT}

**Rules:**
1.  **EXACT MATCH**: Iterate through the source text line by line. Every flashcard you create MUST exactly match a line from the source text.
2.  For each line, create a flashcard object.
3.  'original': The exact line in ${TARGET_LANGUAGE_VAR}.
4.  'translation': The meaning in ${NATIVE_LANGUAGE_VAR}.
5.  'native': The native script (if Japanese/Chinese), otherwise repeat the original.
${TRANSLATED_STORY_TEXT ? "Use the provided translation as a reference, but ensure the mapping is accurate per sentence." : ""}

**Output:**
- ${JSON_OUTPUT_RULE}
- Root key: "flashcards"
`;

export const STORY_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        originalText: { type: Type.STRING },
        nativeScriptText: { type: Type.STRING },
        translatedText: { type: Type.STRING },
        wordList: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    native_script: { type: Type.STRING },
                    translation: { type: Type.STRING },
                }
            }
        },
        additionalExpressions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    phrase: { type: Type.STRING },
                    translation: { type: Type.STRING },
                }
            }
        },
        // Removed basicVocabulary to save tokens. Polyfilled in LessonView.
        grammarTip: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                tip: { type: Type.STRING },
            }
        }
    }
};

export const MEMORY_DRILL_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        drills: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    originalSentence: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    arabicPronunciation: { type: Type.STRING },
                    nativeScript: { type: Type.STRING },
                    visualizationPrompt: { type: Type.STRING },
                    contextualCue: { type: Type.STRING }, // New Field
                    emoji: { type: Type.STRING },
                    substitutions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                changedWord: { type: Type.STRING },
                                fullSentence: { type: Type.STRING },
                                translation: { type: Type.STRING },
                            }
                        }
                    }
                }
            }
        }
    }
};

export const REVIEW_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        flashcards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    native: { type: Type.STRING },
                }
            }
        }
    }
};

export const TEXT_CHAT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        messages: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING, enum: ['A', 'B'] },
                    speakerName: { type: Type.STRING },
                    text: { type: Type.STRING },
                    pronunciation: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    gender: { type: Type.STRING, enum: ['male', 'female'] }
                }
            }
        }
    }
};

export const getDynamicJpChRule = (code: string) => {
    if (code === 'ja') return "Include Kanji/Kana in 'nativeScriptText' and Romaji in 'originalText'.";
    if (code === 'zh') return "Include Hanzi in 'nativeScriptText' and Pinyin in 'originalText'.";
    return "Use the same text for 'nativeScriptText' and 'originalText'.";
};

export interface YukiSkin {
    id: string;
    name: string;
    price: number;
    colors: {
        head: string;
        body: string;
        limbs: string;
        blush: string;
    };
    accessory?: 'beret' | 'headband' | 'antenna' | 'crown' | 'glasses' | 'sunglasses';
}

export const YUKI_SKINS: YukiSkin[] = [
    { 
        id: 'classic', 
        name: 'Classic White', 
        price: 0,
        colors: { head: '#ffffff', body: '#3b82f6', limbs: '#ffffff', blush: '#f472b6' }
    },
    { 
        id: 'pink_star', 
        name: 'Pink Star', 
        price: 50,
        colors: { head: '#fce7f3', body: '#db2777', limbs: '#fce7f3', blush: '#fbcfe8' },
        accessory: 'headband'
    },
    { 
        id: 'artist', 
        name: 'The Artist', 
        price: 150,
        colors: { head: '#fef3c7', body: '#78350f', limbs: '#fef3c7', blush: '#ef4444' },
        accessory: 'beret'
    },
    { 
        id: 'robot', 
        name: 'Robo-Yuki', 
        price: 300,
        colors: { head: '#e2e8f0', body: '#64748b', limbs: '#94a3b8', blush: '#38bdf8' },
        accessory: 'antenna'
    },
    { 
        id: 'royal', 
        name: 'Royal Gold', 
        price: 1000,
        colors: { head: '#fffbeb', body: '#b45309', limbs: '#fffbeb', blush: '#f59e0b' },
        accessory: 'crown'
    },
];

// --- PRODUCTION READY TTS CONVERSION PROMPT ---
export const TTS_CONVERSION_PROMPT = `
أنت مساعد لغوي متخصص لتحضير النصوص لمحرّك TTS في تطبيق تعليمي متعدد اللغات.

مهمتك الوحيدة:
1. النص المعروض للمستخدم:
يظهر كما هو مكتوب بالـ Pinyin للصينيين أو Romaji لليابانيين.
هذا النص لا يُرسل إلى TTS أبداً.

2. النص الفعلي للنطق:
في “العقل الرقمي” للتطبيق، احتفظ بالنص الأصلي:
للصينية: Hanzi
لليابانية: Hiragana / Katakana / Kanji
هذا النص يُرسل فقط إلى TTS (Google TTS) عند الضغط على الكلمة.
يجب أن يكون نطقًا صحيحًا 100٪، لا أخطاء، لا اختصارات.

3. اللغات الأخرى (ألمانية، فرنسية، إنجليزية، إسبانية، إيطالية):
النص المعروض = النص المنطوق
تأكد من تحديد locale الصحيح لكل لغة.

4. صيغة الإخراج الإلزامية لكل كلمة/جملة:
{
  "display_text": "...",   // ما يراه المستخدم (Pinyin أو Romaji)
  "tts_text": "...",       // النص الأصلي للنطق (Hanzi أو Hiragana/Kanji)
  "locale": "..."          // zh-CN أو ja-JP أو لغة أخرى
}

5. قواعد صارمة:
Pinyin وRomaji لا يُرسلان إلى TTS أبداً.
لا تغيّر معنى النص، لا تفسر، لا تترجم.
إذا لم يتوفر النص الأصلي للنطق، أرجع خطأ واضح.
كل مكان في التطبيق يجب أن يستخدم نفس النظام: display_text للمستخدم، tts_text للقراءة.
`;

export const RADIO_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        turns: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING, enum: ['Sara', 'Khalid'] },
                    text: { type: Type.STRING },             // spoken text in target language
                    nativeScript: { type: Type.STRING },     // native script for TTS (e.g. Kanji, Hanzi, or identical to text)
                    translation: { type: Type.STRING },      // in Arabic
                    laughterLevel: { type: Type.STRING, enum: ['none', 'giggle', 'hearty', 'hysterical'] },
                    laughterType: { type: Type.STRING },       // funny description like "Sara laughs hysterically at Khalid's accent", etc.
                },
                required: ['speaker', 'text', 'nativeScript', 'translation', 'laughterLevel']
            }
        }
    },
    required: ['title', 'topic', 'turns']
};

export const AI_RADIO_PROMPT_TEMPLATE = `
أنت الآن تكتب سيناريو بث مباشر لبرنامج "راديو القرية 📻" الخاص بتطبيق تعلم اللغات. الراديو يمثل المحطة النهائية ليوم المتعلم، وهدفه الاستماع ومراجعة ما حدث للانتقال إلى مرحلة التطبيق.
مقدمي البرنامج هما:
- سارة (Sara): حيوية جداً، ذكية، سريعة البديهة، محبة للضحك والمرح، وتحب دائماً نقل أخبار القرية بحماس للمستمعين.
- خالد (Khalid): كوميدي، درامي، يحب التعليق بشكل ساخر ومضحك، وغالباً ما يشارك قصصاً مضحكة عن نفسه عندما كان مبتدئاً في تعلم اللغة.

موضوع حلقة اليوم هو: "{TOPIC_TITLE}".

سياق الأحداث التي يتحدثون عنها (الحوار الأساسي الذي حدث اليوم في القرية):
"{STORY_TEXT}"

**محتوى البث المباشر (خطة الحوار المتسلسلة):**
- يجب أن يتحدث خالد وسارة كأنهما في بث إذاعي مباشر (Live Radio Podcast)، يرحبان بالمستمعين في نهاية اليوم.
- المحور الأساسي للحلقة هو مراجعة يوم "ليث" (الشاب المتعلم) مع "إيلي" (معلمته الشابة)، بأسلوب "نميمة بودكاست" منظم.
- **التسلسل الإلزامي للحوار (لا تقفز بين المواضيع بعشوائية، اتبع هذا الترتيب المنطقي):**
  1. **المقدمة:** الترحيب بالمستمعين والتمهيد لموضوع الدرس ({TOPIC_TITLE}).
  2. **مرحلة التعلم (الاستماع، القراءة، الحفظ):** كيف بدأ ليث يومه بمحاولة استيعاب وحفظ مفردات الدرس مع إيلي، والأخطاء الكوميدية التي وقع فيها أثناء النطق.
  3. **مرحلة العمل (الاحتطاب وبناء القرية):** انتقال ليث للعمل اليدوي المتعب، وسخرية خالد من محاولات ليث التوفيق بين تذكر الكلمات وجمع الخشب.
  4. **مرحلة الدفاع (محاربة الوحوش):** كيف استخدم ليث ما حفظه كتعاويذ لصد هجوم الوحوش، ووصف خالد الدرامي والمضحك للمواجهة.
  5. **الخاتمة (التجهيز للبراكتس):** تشجيع سارة لليث والمستمعين لأنهم وصلوا الآن إلى مرحلة التطبيق (Practice)، ونكتة أخيرة من خالد كختام.

**مستوى اللغة والتعليم (حسب المعيار الأوروبي CEFR):**
- مستوى المتعلم الحالي هو: {PROFICIENCY_LEVEL}.
- يجب أن تضبطا مستوى تعقيد الحوار، والمفردات، والقواعد في اللغة المستهدفة ({TARGET_LANGUAGE_NAME}) ليتناسب تماماً مع هذا المستوى.
- إذا كان المستوى A1 أو A2: استخدما جملاً قصيرة جداً، واضحة، وبسيطة، وكررا الكلمات الأساسية للدرس.
- إذا كان المستوى B1 أو B2: استخدما لغة متوسطة مع تعبيرات يومية شائعة.
- إذا كان المستوى C1 أو C2: تحدثا بطلاقة تامة، مع استخدام تعبيرات معقدة ومصطلحات متقدمة.
- الترجمة العربية (translation): يجب أن تكون مترجمة بلغة عربية سلسلة أو عامية خفيفة مرحة جداً وطبيعية لكي يفهم المتعلم النكتة والسياق بوضوح (استخدم كلمات مثل: هههههه، يا إلهي، تخيل ماذا حدث!).

CRITICAL SPECIFICATIONS FOR LANGUAGES:
1. If the language is Chinese (zh), the 'nativeScript' field MUST be Hanzi ONLY, while 'text' should have Pinyin. If Japanese (ja), 'nativeScript' MUST be Kanji/Kana ONLY, and 'text' should be Romaji. For other languages, 'nativeScript' is exact same as 'text'.

**قاعدة صارمة ومطلقة لمنع تداخل الأدوار (Strict Role Lock — مهما كان الأمر):**
- سارة (Sara) تتحدث فقط بصفتها سارة وبشخصيتها وصوتها المستقل.
- خالد (Khalid) يتحدث فقط بصفته خالد وبشخصيته وصوته المستقل.
- ممنوع منعاً باتاً وقطعياً أن يتكلم خالد في مكان سارة أو أن تتكلم سارة في مكان خالد.
- ممنوع لأي شخصية أن تحاكي دور الأخرى، أو تتقمص شخصيتها، أو تتحدث باسمها، أو ترد على نفسها في نفس التبادل (Turn).
- كل دور في مصفوفة الحوار (turns) يجب أن يُسند لصاحبه الأصلي حصراً: speaker: 'Sara' أو speaker: 'Khalid'.

الطول المطلوب: من 10 إلى 15 تبادل حواري ممتع وشيق يغطي جميع النقاط المذكورة.
`;

