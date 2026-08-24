/**
 * Easy7Language — طبقة البيانات النقية (بلا React / بلا Next.js)
 * كتالوج العبارات المصنّفة ثلاثياً لفصول "مملكة الرمال".
 *
 * قواعد الـ tier (قابلة للتدقيق):
 * - core:      ضرورية لإكمال حبكة الفصل + كلماتها من الأكثر شيوعاً + تُعاد في ≥3 مشاهد
 * - medium:    مفيدة للفهم والإنتاج الحر، تُعاد في مشهدين
 * - secondary: نكهة سردية — فهم فقط (input)، لا يُطلب إنتاجها أبداً
 */

export type PhraseTier = 'core' | 'medium' | 'secondary'

export type Phrase = {
  id: string
  en: string
  ar: string
  tier: PhraseTier
  /** CEFR تقريبي */
  cefr: 'A1' | 'A2' | 'B1'
  chapterId: 1 | 2
  tags: string[]
}

export const PHRASES: Phrase[] = [
  // ---------- الفصل 1: الشاطئ والكوخ ----------
  {
    id: 'p-name',
    en: 'My name is Laith',
    ar: 'اسمي ليث',
    tier: 'core',
    cefr: 'A1',
    chapterId: 1,
    tags: ['introduction', 'survival'],
  },
  {
    id: 'p-water',
    en: 'Water, please',
    ar: 'ماء، من فضلك',
    tier: 'core',
    cefr: 'A1',
    chapterId: 1,
    tags: ['request', 'survival', 'food'],
  },
  {
    id: 'p-thanks-elly',
    en: 'Thank you, Elly',
    ar: 'شكراً لك يا إيلي',
    tier: 'core',
    cefr: 'A1',
    chapterId: 1,
    tags: ['politeness'],
  },
  {
    id: 'p-hungry',
    en: 'I am hungry',
    ar: 'أنا جائع',
    tier: 'medium',
    cefr: 'A1',
    chapterId: 1,
    tags: ['state', 'food'],
  },
  {
    id: 'p-where-am-i',
    en: 'Where am I?',
    ar: 'أين أنا؟',
    tier: 'medium',
    cefr: 'A1',
    chapterId: 1,
    tags: ['question'],
  },
  {
    id: 'p-safe-here',
    en: 'You are safe here',
    ar: 'أنت آمن هنا',
    tier: 'secondary',
    cefr: 'A2',
    chapterId: 1,
    tags: ['narrative'],
  },

  // ---------- الفصل 2: القرية والسوق ----------
  {
    id: 'p-good-morning',
    en: 'Good morning',
    ar: 'صباح الخير',
    tier: 'core',
    cefr: 'A1',
    chapterId: 2,
    tags: ['greeting', 'market'],
  },
  {
    id: 'p-want-bread',
    en: 'I want bread, please',
    ar: 'أريد خبزاً، من فضلك',
    tier: 'core',
    cefr: 'A1',
    chapterId: 2,
    tags: ['request', 'market', 'food'],
  },
  {
    id: 'p-here-you-are',
    en: 'Here you are',
    ar: 'تفضّل',
    tier: 'core',
    cefr: 'A1',
    chapterId: 2,
    tags: ['exchange', 'market'],
  },
  {
    id: 'p-no-thanks-bye',
    en: 'No, thank you. Goodbye!',
    ar: 'لا، شكراً. وداعاً!',
    tier: 'core',
    cefr: 'A1',
    chapterId: 2,
    tags: ['politeness', 'farewell', 'market'],
  },
  {
    id: 'p-how-much',
    en: 'How much is it?',
    ar: 'كم ثمنه؟',
    tier: 'medium',
    cefr: 'A1',
    chapterId: 2,
    tags: ['question', 'market'],
  },
  {
    id: 'p-anything-else',
    en: 'Anything else, friend?',
    ar: 'أي شيء آخر يا صديقي؟',
    tier: 'medium',
    cefr: 'A2',
    chapterId: 2,
    tags: ['market'],
  },
  {
    id: 'p-face-white',
    en: 'Your face is white',
    ar: 'وجهك شاحب',
    tier: 'secondary',
    cefr: 'A2',
    chapterId: 2,
    tags: ['narrative'],
  },
  {
    id: 'p-who-poster',
    en: 'Who is that man on the poster?',
    ar: 'من ذلك الرجل في الملصق؟',
    tier: 'secondary',
    cefr: 'B1',
    chapterId: 2,
    tags: ['narrative'],
  },
]

export function phrasesByChapter(chapterId: Phrase['chapterId']): Phrase[] {
  return PHRASES.filter((p) => p.chapterId === chapterId)
}

export function getPhrase(id: string): Phrase | undefined {
  return PHRASES.find((p) => p.id === id)
}
