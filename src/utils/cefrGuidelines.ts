/**
 * CEFR Level Guidelines & Calibration Engine for Easy7
 * Calibrates AI Radio and Voice Chat speech to strictly match the learner's level (A0 to C2).
 */

export interface CEFRLevelInfo {
  code: 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  nameAr: string;
  nameEn: string;
  badge: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const ALL_CEFR_LEVELS: CEFRLevelInfo[] = [
  {
    code: 'A0',
    nameAr: 'من الصفر المطلق',
    nameEn: 'Absolute Beginner',
    badge: '🌱 A0',
    descriptionAr: 'لا يعرف التحدث مطلقاً — كلمات أحادية وعبارات قصيرة جداً (1-3 كلمات) ببطء شديد وتكرار مستمر',
    descriptionEn: 'Absolute zero — single words & ultra-short 1-3 word phrases, very slow and supportive'
  },
  {
    code: 'A1',
    nameAr: 'مبتدئ أساسي',
    nameEn: 'Elementary Beginner',
    badge: '🌿 A1',
    descriptionAr: 'جمل بسيطة جداً وقصيرة (3-5 كلمات)، زمن الحاضر الأساسي، مفردات الحياة اليومية الشائعة',
    descriptionEn: 'Very short simple sentences (3-5 words), basic present tense, foundational vocabulary'
  },
  {
    code: 'A2',
    nameAr: 'ابتدائي / فوق المبتدئ',
    nameEn: 'High Beginner',
    badge: '🌳 A2',
    descriptionAr: 'حوارات يومية بسيطة ومباشرة (5-8 كلمات)، الماضي والحاضر البسيط، التسوق والهوايات',
    descriptionEn: 'Simple direct conversations (5-8 words), basic past & present, daily routines'
  },
  {
    code: 'B1',
    nameAr: 'متوسط',
    nameEn: 'Intermediate',
    badge: '⭐ B1',
    descriptionAr: 'حوارات متصلة وتعبير عن الآراء والخطط، مفردات متنوعة وسرعة تحدث طبيعية ومعتدلة',
    descriptionEn: 'Connected natural sentences, expressing opinions and plans, standard speed'
  },
  {
    code: 'B2',
    nameAr: 'فوق المتوسط',
    nameEn: 'Upper Intermediate',
    badge: '🌟 B2',
    descriptionAr: 'طلاقة وتعبيرات غنية ومصطلحات شائعة، مناقشات أعمق وسرعة طبيعية حية',
    descriptionEn: 'Fluent and rich vocabulary, common idioms, natural native conversational speed'
  },
  {
    code: 'C1',
    nameAr: 'متقدم',
    nameEn: 'Advanced',
    badge: '🏆 C1',
    descriptionAr: 'مفردات راقية وتعبيرات دقيقة وسرعة متحدث أصلي مع حس الفكاهة والنقاش الواسع',
    descriptionEn: 'Sophisticated vocabulary, nuanced expressions, witty banter, full native speed'
  },
  {
    code: 'C2',
    nameAr: 'إتقان تام (مستوى المتحدث الأصلي)',
    nameEn: 'Mastery / Native',
    badge: '👑 C2',
    descriptionAr: 'بلاغة كاملة، أمثال وتراكيب متقدمة ومصطلحات تخصصية وفلسفية بسلاسة تامة',
    descriptionEn: 'Complete native mastery with effortless nuance, advanced idioms, and deep debate'
  }
];

export function getCEFRPromptGuidelines(level: string = 'A1', langName: string = 'English'): string {
  const norm = (level || 'A1').toUpperCase().trim();

  switch (norm) {
    case 'A0':
      return `
======================================================================
CRITICAL PROFICIENCY RESTRICTION: CEFR LEVEL A0 (ABSOLUTE ZERO BEGINNER)
======================================================================
THE LEARNER CANNOT SPEAK OR UNDERSTAND COMPLEX SENTENCES. YOU MUST:
1. USE ONLY 1 TO 3 WORD PHRASES OR SINGLE WORDS (e.g. "Hello!", "Good morning!", "Yes!", "Thank you!").
2. NEVER speak full complex sentences. Max sentence length: 4 words.
3. Speak extremely slowly, clearly, softly, and encouragingly.
4. Heavy repetition: Repeat core greeting words and basic nouns frequently.
5. Use joyful and simple gestures/tone so the learner feels zero intimidation.
`;

    case 'A1':
      return `
======================================================================
CRITICAL PROFICIENCY RESTRICTION: CEFR LEVEL A1 (ELEMENTARY BEGINNER)
======================================================================
THE LEARNER HAS MINIMAL VOCABULARY. YOU MUST:
1. Keep every utterance short and simple: strictly 3 to 5 words max.
2. Use ONLY basic present tense and foundational everyday vocabulary (names, colors, numbers, greetings, basic food).
3. Speak slowly, enunciate each syllable clearly.
4. Avoid any idioms, compound subordinate clauses, or fast colloquialisms.
`;

    case 'A2':
      return `
======================================================================
CRITICAL PROFICIENCY RESTRICTION: CEFR LEVEL A2 (HIGH BEGINNER / ELEMENTARY)
======================================================================
THE LEARNER CAN UNDERSTAND BASIC DIRECT SENTENCES. YOU MUST:
1. Keep sentences straightforward: 5 to 8 words per sentence.
2. Discuss daily life topics: shopping, family, weather, hobbies, basic feelings.
3. Use simple past, present, and future ("I went", "I like", "I will go").
4. Clear and friendly pronunciation at a gentle, comfortable pace.
`;

    case 'B1':
      return `
======================================================================
CRITICAL PROFICIENCY RESTRICTION: CEFR LEVEL B1 (INTERMEDIATE)
======================================================================
THE LEARNER HAS GENERAL CONVERSATIONAL COMPETENCE. YOU MUST:
1. Use connected conversational sentences (8 to 14 words).
2. Express opinions, reasons, plans, and short stories.
3. Use standard natural conversational speed and varied daily vocabulary.
4. Ask engaging open-ended questions.
`;

    case 'B2':
      return `
======================================================================
CRITICAL PROFICIENCY RESTRICTION: CEFR LEVEL B2 (UPPER INTERMEDIATE)
======================================================================
THE LEARNER IS CONVERSATIONALLY FLUENT. YOU MUST:
1. Speak at full natural conversational speed with varied intonation.
2. Use rich vocabulary, common idioms, phrasal verbs, and expressive adjectives.
3. Discuss abstract ideas, opinions, pros & cons, and humor.
`;

    case 'C1':
      return `
======================================================================
CRITICAL PROFICIENCY RESTRICTION: CEFR LEVEL C1 (ADVANCED)
======================================================================
THE LEARNER HAS HIGH PROFICIENCY. YOU MUST:
1. Use sophisticated vocabulary, subtle nuances, cultural references, and witty humor.
2. Speak with natural native speed, colloquial rhythm, and dynamic phrasing.
3. Engage in thoughtful banter and deeper discussion.
`;

    case 'C2':
      return `
======================================================================
CRITICAL PROFICIENCY RESTRICTION: CEFR LEVEL C2 (NATIVE-LEVEL MASTERY)
======================================================================
THE LEARNER HAS COMPLETE MASTERY. YOU MUST:
1. Speak with full native eloquence, rich idioms, precision, and effortless humor.
2. No vocabulary or grammatical restrictions whatsoever. Full intellectual depth.
`;

    default:
      return `
======================================================================
CEFR LEVEL: ${level}
======================================================================
Calibrate all vocabulary, sentence length, and grammatical complexity strictly to CEFR ${level}.
`;
  }
}
