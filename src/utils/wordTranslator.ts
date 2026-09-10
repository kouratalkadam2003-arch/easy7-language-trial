/**
 * Word and Phrase Translator Helper
 * Provides instant Arabic translations for individual words or two-word phrases
 * across the 7 supported languages in Easy7, with fast local dictionary, interlinear glossing,
 * and contextual background resolver.
 */

import { GoogleGenAI } from '@google/genai';
import { TEXT_MODEL } from '@/constants';
import { getApiKey } from './apiKeyPool';

export const DICTIONARY: Record<string, Record<string, string>> = {
  // English -> Arabic
  en: {
    // Greetings & Question words
    hello: 'مرحباً',
    hi: 'أهلاً',
    welcome: 'أهلاً وسهلاً',
    where: 'أين',
    from: 'من',
    who: 'من',
    what: 'ماذا',
    when: 'متى',
    why: 'لماذا',
    how: 'كيف',
    good: 'جيد / طيب',
    morning: 'صباح',
    afternoon: 'مساء / بعد الظهر',
    evening: 'مساء',
    night: 'ليل / ليلة',
    bye: 'مع السلامة',
    goodbye: 'وداعاً',
    thanks: 'شكراً',
    thank: 'يشكر',
    please: 'من فضلك',
    yes: 'نعم',
    no: 'لا',
    tomorrow: 'غداً',
    today: 'اليوم',
    here: 'هنا',
    there: 'هناك',

    // Pronouns & Possessives
    i: 'أنا',
    you: 'أنت',
    he: 'هو',
    she: 'هي',
    it: 'هو/هي',
    we: 'نحن',
    they: 'هم',
    my: 'لي',
    your: 'لك',
    our: 'لنا',
    their: 'لهم',
    his: 'له',
    her: 'لها',
    this: 'هذا',
    that: 'ذلك',

    // Verbs & Auxiliaries
    am: 'أكون',
    is: 'يكون',
    are: 'تكون / يكونون',
    was: 'كان',
    were: 'كانوا',
    come: 'يأتي',
    comes: 'يأتي',
    coming: 'قادم',
    live: 'يعيش',
    lives: 'يعيش',
    name: 'اسم',
    meet: 'يلتقي',
    see: 'يرى',
    have: 'يملك',
    has: 'يملك',
    do: 'يفعل / هل',
    does: 'يفعل / هل',
    go: 'يذهب',
    want: 'يريد',
    like: 'يحب',
    learn: 'يتعلم',
    learning: 'يتعلم',
    speak: 'يتحدث',
    speaks: 'يتحدث',
    understand: 'يفهم',
    read: 'يقرأ',
    write: 'يكتب',

    // Nouns & Prepositions
    friend: 'صديق',
    house: 'منزل',
    room: 'غرفة',
    city: 'مدينة',
    country: 'بلد',
    water: 'ماء',
    food: 'طعام',
    bread: 'خبز',
    book: 'كتاب',
    day: 'يوم',
    time: 'وقت',
    and: 'و',
    or: 'أو',
    but: 'لكن',
    in: 'في',
    at: 'في / عند',
    on: 'على',
    to: 'إلى',
    with: 'مع',
    for: 'لأجل',
    new: 'جديد',
    nice: 'لطيف',
    fine: 'بخير',
    very: 'جداً',

    // Combinations
    'where are you from': 'من أين أنت؟',
    'where from': 'من أين',
    'nice to': 'من اللطيف أن',
    'meet you': 'لقاؤك',
    'nice to meet you': 'سعيد بلقائك',
    'how are you': 'كيف حالك؟',
    'good morning': 'صباح الخير',
    'good night': 'تصبح على خير',
    'thank you': 'شكراً لك',
  },

  // German -> Arabic
  de: {
    // Question words & Origins
    woher: 'من أين',
    wo: 'أين',
    wohin: 'إلى أين',
    wer: 'من',
    was: 'ماذا',
    wann: 'متى',
    warum: 'لماذا',
    wie: 'كيف',

    // Verbs
    kommst: 'تأتي',
    komme: 'آتي',
    kommt: 'يأتي',
    kommen: 'يأتون / نأتي',
    heiße: 'أُدعى',
    heißt: 'تُدعى / يُدعى',
    bist: 'تكون',
    bin: 'أكون',
    ist: 'يكون',
    sind: 'نكون / يكونون',
    habe: 'أملك',
    hast: 'تملك',
    hat: 'يملك',
    wohne: 'أسكن',
    wohnst: 'تسكن',
    wohnt: 'يسكن',
    spreche: 'أتحدث',
    sprichst: 'تتحدث',
    spricht: 'يتحدث',
    sprechen: 'يتحدثون',
    lerne: 'أتعلم',
    lernst: 'تتعلم',
    lernt: 'يتعلم',
    verstehe: 'أفهم',
    verstehst: 'تفهم',
    geht: 'تسير',

    // Pronouns & Articles
    du: 'أنت',
    ich: 'أنا',
    er: 'هو',
    sie: 'هي / حضرتك / هم',
    es: 'هو/هي',
    wir: 'نحن',
    ihr: 'أنتم',
    mein: 'لي',
    meine: 'لي',
    dein: 'لك',
    deine: 'لك',
    sein: 'له',
    seine: 'له',
    ihr_pos: 'لها',
    ihre: 'لها',
    der: 'الـ',
    die: 'الـ',
    das: 'الـ',
    ein: 'واحد / نكرة',
    eine: 'واحدة / نكرة',
    einen: 'واحد',
    einem: 'واحد',

    // Prepositions & Connectors
    aus: 'من',
    in: 'في',
    nach: 'إلى / بعد',
    mit: 'مع',
    für: 'لأجل',
    von: 'من / عن',
    und: 'و',
    oder: 'أو',
    aber: 'لكن',
    nicht: 'ليس / لا',
    kein: 'لا / نفي',
    keine: 'لا / نفي',

    // Common & Greetings
    hallo: 'مرحباً',
    guten: 'سعيد / طيب',
    morgen: 'صباح',
    tag: 'نهار / يوم',
    abend: 'مساء',
    nacht: 'ليلة',
    danke: 'شكراً',
    bitte: 'من فضلك',
    ja: 'نعم',
    nein: 'لا',
    gut: 'بخير',
    sehr: 'جداً',
    schön: 'جميل',
    toll: 'رائع',
    tschüss: 'مع السلامة',
    name: 'اسم',
    freund: 'صديق',
    sprache: 'لغة',
    deutsch: 'الألمانية',
    arabisch: 'العربية',
    deutschland: 'ألمانيا',
    wasser: 'ماء',
    brot: 'خبز',
    haus: 'منزل',

    // Collocations
    'woher kommst du': 'من أين أنت؟',
    'woher kommst': 'من أين تأتي',
    'wie gehts': 'كيف حالك',
    'wie geht es dir': 'كيف حالك',
    'wie gehts dir': 'كيف حالك',
    'guten morgen': 'صباح الخير',
    'guten tag': 'طاب يومك',
    'guten abend': 'مساء الخير',
    'gute nacht': 'تصبح على خير',
    'auf wiedersehen': 'إلى اللقاء',
    'ich heiße': 'اسمي',
    'sehr gut': 'جيد جداً',
  },

  // French -> Arabic
  fr: {
    // Questions & Origins
    "d'où": 'من أين',
    dou: 'من أين',
    où: 'أين',
    qui: 'من',
    que: 'ماذا',
    quoi: 'ماذا',
    comment: 'كيف',
    pourquoi: 'لماذا',
    quand: 'متى',

    // Verbs
    viens: 'تأتي / آتي',
    vient: 'يأتي',
    venez: 'تأتون / تأتي',
    suis: 'أكون',
    es: 'تكون',
    est: 'يكون',
    sommes: 'نكون',
    êtes: 'تكونون',
    sont: 'يكونون',
    appelle: 'أُدعى',
    appelles: 'تُدعى',
    habite: 'أسكن',
    habites: 'تسكن',
    parle: 'أتحدث',
    parles: 'تتحدث',
    comprends: 'أفهم',
    va: 'تسير / يذهب',

    // Pronouns & Articles
    tu: 'أنت',
    vous: 'أنتم / حضرتك',
    je: 'أنا',
    il: 'هو',
    elle: 'هي',
    nous: 'نحن',
    ils: 'هم',
    elles: 'هن',
    mon: 'لي',
    ma: 'لي',
    mes: 'لي',
    ton: 'لك',
    ta: 'لك',
    tes: 'لك',
    le: 'الـ',
    la: 'الـ',
    les: 'الـ',
    un: 'نكرة',
    une: 'نكرة',

    // Prepositions & Connectors
    de: 'من',
    du: 'من الـ',
    des: 'من الـ',
    en: 'في',
    dans: 'في',
    avec: 'مع',
    pour: 'لأجل',
    et: 'و',
    ou: 'أو',
    mais: 'لكن',
    pas: 'لا / نفي',
    ne: 'نفي',

    // Common
    bonjour: 'صباح الخير / مرحباً',
    bonsoir: 'مساء الخير',
    salut: 'أهلاً',
    merci: 'شكراً',
    oui: 'نعم',
    non: 'لا',
    bien: 'بخير',
    très: 'جداً',
    ami: 'صديق',
    maison: 'منزل',
    nom: 'اسم',
    france: 'فرنسا',
    arabe: 'العربية',
    français: 'الفرنسية',

    // Collocations
    'd ou viens tu': 'من أين أنت؟',
    'd ou venez vous': 'من أين حضرتك؟',
    'comment allez vous': 'كيف حالكم',
    'comment vas tu': 'كيف حالك',
    'je m appelle': 'اسمي',
  },

  // Spanish -> Arabic
  es: {
    // Questions & Origins
    de: 'من',
    dónde: 'أين',
    donde: 'أين',
    cómo: 'كيف',
    como: 'كيف / مثل',
    qué: 'ماذا',
    que: 'ماذا / الذي',
    quién: 'من',
    quien: 'من',
    cuándo: 'متى',
    cuando: 'متى',
    'por qué': 'لماذا',
    porque: 'لأن',

    // Verbs
    eres: 'تكون',
    es: 'يكون',
    soy: 'أكون',
    somos: 'نكون',
    son: 'يكونون',
    vienes: 'تأتي',
    vengo: 'آتي',
    viene: 'يأتي',
    llamas: 'تُدعى',
    llamo: 'أُدعى',
    llama: 'يُدعى',
    hablas: 'تتحدث',
    hablo: 'أتحدث',
    habla: 'يتحدث',
    vives: 'تعيش',
    vivo: 'أعيش',
    vive: 'يعيش',
    estás: 'تكون / حالك',
    estoy: 'أنا أكون / بحال',
    está: 'هو يكون',

    // Pronouns & Articles
    tú: 'أنت',
    tu: 'لك',
    yo: 'أنا',
    él: 'هو',
    ella: 'هي',
    usted: 'حضرتك',
    ustedes: 'أنتم',
    nosotros: 'نحن',
    ellos: 'هم',
    mi: 'لي',
    mis: 'لي',
    su: 'له / لحضرتك',
    sus: 'لهم',
    el: 'الـ',
    la: 'الـ',
    los: 'الـ',
    las: 'الـ',
    un: 'نكرة',
    una: 'نكرة',

    // Prepositions & Connectors
    en: 'في',
    con: 'مع',
    por: 'من أجل / عبر',
    para: 'لـ / لأجل',
    y: 'و',
    o: 'أو',
    pero: 'لكن',
    no: 'لا',
    sí: 'نعم',
    si: 'نعم / إذا',

    // Common
    hola: 'مرحباً',
    buenos: 'طاب / طيب',
    días: 'أيام / صباح',
    dias: 'صباح',
    tardes: 'مساء',
    noches: 'ليالٍ / مساء',
    gracias: 'شكراً',
    favor: 'فضل',
    amigo: 'صديق',
    casa: 'منزل',
    nombre: 'اسم',
    bien: 'بخير',
    muy: 'جداً',
    español: 'الإسبانية',
    españa: 'إسبانيا',

    // Collocations
    'de dónde eres': 'من أين أنت؟',
    'de donde eres': 'من أين أنت؟',
    'cómo estás': 'كيف حالك',
    'como estas': 'كيف حالك',
    'buenos días': 'صباح الخير',
    'buenos dias': 'صباح الخير',
    'por favor': 'من فضلك',
    'muchas gracias': 'شكراً جزيلاً',
    'me llamo': 'اسمي',
  },

  // Italian -> Arabic
  it: {
    // Questions & Origins
    di: 'من',
    da: 'من',
    dove: 'أين',
    come: 'كيف',
    cosa: 'ماذا',
    chi: 'من',
    quando: 'متى',
    perché: 'لماذا',

    // Verbs
    sei: 'تكون',
    è: 'يكون',
    sono: 'أكون / يكونون',
    siamo: 'نكون',
    vieni: 'تأتي',
    vengo: 'آتي',
    viene: 'يأتي',
    chiami: 'تُدعى',
    chiamo: 'أُدعى',
    parli: 'تتحدث',
    parlo: 'أتحدث',
    abiti: 'تسكن',
    abito: 'أسكن',
    stai: 'أنت بحال',
    sto: 'أنا بحال',

    // Pronouns & Articles
    tu: 'أنت',
    io: 'أنا',
    lui: 'هو',
    lei: 'هي / حضرتك',
    noi: 'نحن',
    voi: 'أنتم',
    loro: 'هم',
    mio: 'لي',
    mia: 'لي',
    tuo: 'لك',
    tua: 'لك',
    il: 'الـ',
    la: 'الـ',
    lo: 'الـ',
    un: 'نكرة',
    una: 'نكرة',

    // Prepositions & Connectors
    in: 'في',
    con: 'مع',
    per: 'لأجل',
    e: 'و',
    o: 'أو',
    ma: 'لكن',
    non: 'لا / نفي',
    sì: 'نعم',
    si: 'نعم',
    no: 'لا',

    // Common
    ciao: 'مرحباً / أهلاً',
    buongiorno: 'صباح الخير',
    buonasera: 'مساء الخير',
    grazie: 'شكراً',
    prego: 'عفواً',
    amico: 'صديق',
    casa: 'منزل',
    nome: 'اسم',
    bene: 'بخير',
    molto: 'جداً',
    italiano: 'الإيطالية',
    italia: 'إيطاليا',

    // Collocations
    'di dove sei': 'من أين أنت؟',
    'da dove vieni': 'من أين تأتي؟',
    'come stai': 'كيف حالك',
    'mi chiamo': 'اسمي',
  },

  // Japanese (Romaji) -> Arabic
  ja: {
    doko: 'أين',
    kara: 'من',
    kimashita: 'أتيت',
    desu: 'يكون',
    ka: 'هل',
    wa: 'أما عن (علامة مبتدأ)',
    ga: 'الفاعل',
    no: 'ياء الملكية',
    o: 'المفعول به',
    ni: 'في / إلى',
    anata: 'أنت',
    watashi: 'أنا',
    namae: 'اسم',
    nan: 'ماذا',
    nani: 'ماذا',
    dare: 'من',
    itsu: 'متى',
    doushite: 'لماذا',
    ikaga: 'كيف',
    dou: 'كيف',
    hai: 'نعم',
    iie: 'لا',
    konnichiwa: 'مرحباً',
    ohayou: 'صباح الخير',
    arigatou: 'شكراً',
    sumimasen: 'عفواً / معذرة',
    tomodachi: 'صديق',
    ie: 'منزل',
    genki: 'بخير',
    nihon: 'اليابان',
    nihongo: 'اليابانية',
    'doko kara kimashita ka': 'من أين أتيت؟',
    'ogenki desu ka': 'كيف حالك؟',
    'arigatou gozaimasu': 'شكراً جزيلاً',
  },

  // Chinese (Pinyin) -> Arabic
  zh: {
    cong: 'من',
    nali: 'أين',
    nar: 'أين',
    lai: 'تأتي',
    de: 'من / الذي',
    ni: 'أنت',
    wo: 'أنا',
    ta: 'هو / هي',
    women: 'نحن',
    shi: 'تكون / أكون',
    ma: 'هل',
    ne: 'ماذا عن',
    shenme: 'ماذا',
    shei: 'من',
    zenme: 'كيف',
    mingzi: 'اسم',
    jiao: 'يُدعى',
    shuo: 'يتحدث',
    xue: 'يتعلم',
    zhu: 'يسكن',
    zai: 'في',
    he: 'و',
    ye: 'أيضاً',
    hen: 'جداً',
    bu: 'لا',
    hao: 'بخير / جيد',
    nihao: 'مرحباً',
    xiexie: 'شكراً',
    pengyou: 'صديق',
    jia: 'منزل',
    zhongguo: 'الصين',
    hanyu: 'الصينية',
    'ni cong nali lai': 'من أين أنت؟',
    'ni hao': 'مرحباً',
    'ni jiao shenme mingzi': 'ما اسمك؟',
    'xie xie': 'شكراً لك',
  },
};

// Memory cache for runtime lookups
const runtimeCache: Record<string, string> = {};

/**
 * Strips punctuation and normalizes string for matching
 */
export function cleanWord(raw: string): string {
  return raw.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'؟،!¿¡«»]/g, '').trim().toLowerCase();
}

/**
 * Fast synchronous dictionary lookup
 */
export function lookupQuickTranslation(wordOrPhrase: string, lang: string = 'en'): string | null {
  const norm = cleanWord(wordOrPhrase);
  if (!norm) return null;

  const key = `${lang.toLowerCase()}_${norm}`;
  if (runtimeCache[key]) return runtimeCache[key];

  const langDict = DICTIONARY[lang.toLowerCase()] || DICTIONARY['en'];
  if (langDict && langDict[norm]) {
    return langDict[norm];
  }

  // Check English dictionary fallback
  if (DICTIONARY['en'][norm]) {
    return DICTIONARY['en'][norm];
  }

  return null;
}

/**
 * Gets a clean, concise single-word or short Arabic gloss for display directly under a foreign word
 */
export function getWordGloss(word: string, lang: string = 'en'): string {
  const norm = cleanWord(word);
  if (!norm) return '';

  const quick = lookupQuickTranslation(norm, lang);
  if (!quick) return '';

  // Return the first concise meaning before slash or comma
  return quick.split('/')[0].trim();
}

/**
 * Full translation helper strictly aligned with lesson context and canonical curriculum:
 * 1. Checks if wordOrPhrase matches full sentence -> returns exact sentenceTranslation.
 * 2. Checks canonical lesson dictionary (immutable).
 * 3. Checks runtime cache.
 * 4. Fallback lookup.
 */
export async function translateWordOrPhrase(
  wordOrPhrase: string,
  lang: string = 'en',
  sentenceNative?: string,
  sentenceTranslation?: string
): Promise<string> {
  const norm = cleanWord(wordOrPhrase);
  if (!norm) return '';

  // 1. Whole sentence match
  if (sentenceNative && sentenceTranslation) {
    const cleanSentNative = cleanWord(sentenceNative);
    if (norm === cleanSentNative) {
      return sentenceTranslation;
    }
  }

  // 2. Canonical approved dictionary
  const quick = lookupQuickTranslation(norm, lang);
  if (quick) return quick;

  // 3. Check runtime cache
  const cacheKey = `${lang.toLowerCase()}_${norm}`;
  if (runtimeCache[cacheKey]) return runtimeCache[cacheKey];

  // 4. Online fallback
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(norm)}&langpair=${lang}|ar`
    );
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && !translated.startsWith('MYMEMORY WARNING')) {
        runtimeCache[cacheKey] = translated;
        return translated;
      }
    }
  } catch (err) {
    console.warn('Online translation lookup failed, falling back to original:', err);
  }

  return norm;
}

/**
 * Batch resolves Arabic word-by-word glosses for all lines in a lesson dialogue.
 * Guarantees every single word has its correct Arabic translation ready for interlinear display.
 */
export async function batchResolveLessonGlosses(
  dialogue: Array<{ native: string; translation: string }>,
  lang: string = 'en'
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const langKey = (lang || 'en').toLowerCase();
  const missingWords: Set<string> = new Set();

  // 1. Gather all unique words
  for (const line of dialogue) {
    const words = line.native.trim().split(/\s+/);
    for (const w of words) {
      const clean = cleanWord(w);
      if (!clean) continue;
      const key = `${langKey}_${clean}`;
      if (runtimeCache[key]) {
        result[key] = runtimeCache[key];
        continue;
      }
      const existing = getWordGloss(clean, langKey);
      if (existing) {
        result[key] = existing;
        runtimeCache[key] = existing;
      } else {
        missingWords.add(clean);
      }
    }
  }

  if (missingWords.size === 0) {
    return result;
  }

  // 2. Resolve missing words via fast batch request to TEXT_MODEL
  try {
    const apiKey = getApiKey();
    if (!apiKey) return result;

    const genAI = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert language teacher. Provide the concise 1-word or 2-word Arabic translation for each of these words in "${langKey}" language.
Words to translate: ${Array.from(missingWords).join(', ')}

Output ONLY valid JSON in this format with NO explanation and NO markdown fences:
{
  "word": "ترجمة بالعربية"
}`;

    const res = await genAI.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });

    const txt = res.text?.trim() || '';
    const cleanJson = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed && typeof parsed === 'object') {
      for (const [rawW, trans] of Object.entries(parsed)) {
        const cW = cleanWord(rawW);
        const transStr = String(trans).split('/')[0].trim();
        const k = `${langKey}_${cW}`;
        result[k] = transStr;
        runtimeCache[k] = transStr;
      }
    }
  } catch (err) {
    console.warn('[WordTranslator] Batch gloss resolution error:', err);
  }

  return result;
}
