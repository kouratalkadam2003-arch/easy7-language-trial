export interface LessonWord {
  word: string;
  meaning: string;
  hintAr: string;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  answer: string;
}

export interface Lesson {
  id: string;
  name: string;
  nameAr: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  descriptionAr: string;
  buildingType: string;
  words: LessonWord[];
  quizzes: LessonQuiz[];
}

export const GAME_LESSONS: Lesson[] = [
  {
    id: 'lesson_1',
    name: 'Greetings & Introductions',
    nameAr: 'التحيات والتعارف',
    level: 'A1',
    descriptionAr: 'تعلم كيف تحيي الآخرين بالإنجليزية وتعيد بناء دفاعات قريتك الأولى ضد هجمات ذئاب قارماز.',
    buildingType: 'cannon',
    words: [
      { word: 'Hello', meaning: 'مرحباً', hintAr: 'هلو - التحية الأساسية' },
      { word: 'Welcome', meaning: 'أهلاً بك', hintAr: 'ويلكم - للترحيب بالضيوف' },
      { word: 'Peace', meaning: 'سلام', hintAr: 'بيس - طمأنينة وأمان' },
      { word: 'Friend', meaning: 'صديق', hintAr: 'فريند - رفيقك في المعركة' },
      { word: 'Thank you', meaning: 'شكراً لك', hintAr: 'ثانك يو - للتعبير عن الامتنان' }
    ],
    quizzes: [
      { question: 'ما هو معنى كلمة "Welcome"؟', options: ['مرحباً', 'أهلاً بك', 'صديق', 'شكراً لك'], answer: 'أهلاً بك' },
      { question: 'تريد شكر زوجتك على مساعدتها، ماذا تقول؟', options: ['Hello', 'Peace', 'Thank you', 'Friend'], answer: 'Thank you' },
      { question: 'ما الكلمة الإنجليزية التي تعني "صديق"؟', options: ['Friend', 'Welcome', 'Hello', 'Peace'], answer: 'Friend' }
    ]
  },
  {
    id: 'lesson_2',
    name: 'Present Tense Verbs',
    nameAr: 'أفعال المضارع الحيوية',
    level: 'A2',
    descriptionAr: 'الأفعال الأساسية لتشغيل جامعات الإكسير السحري والحفاظ على تدفق الموارد.',
    buildingType: 'elixir_collector',
    words: [
      { word: 'Collect', meaning: 'يجمع', hintAr: 'كوليكت - لجمع الإكسير والذهب' },
      { word: 'Produce', meaning: 'ينتج', hintAr: 'بروديوس - لإنتاج الطاقة' },
      { word: 'Learn', meaning: 'يتعلم', hintAr: 'ليرن - سلاحك لاستعادة العرش' },
      { word: 'Protect', meaning: 'يحمي', hintAr: 'بروتيكت - حماية الأسوار والقرية' },
      { word: 'Grow', meaning: 'ينمو / يكبر', hintAr: 'جرو - نمو المحاصيل والقرية' }
    ],
    quizzes: [
      { question: 'ما معنى كلمة "Protect"؟', options: ['ينتج', 'يحمي', 'يتعلم', 'يجمع'], answer: 'يحمي' },
      { question: 'الكلمة التي نستخدمها لجمع الموارد هي:', options: ['Collect', 'Grow', 'Learn', 'Produce'], answer: 'Collect' },
      { question: 'ما معنى كلمة "Learn"؟', options: ['ينمو', 'ينتج', 'يتعلم', 'يجمع'], answer: 'يتعلم' }
    ]
  },
  {
    id: 'lesson_3',
    name: 'Numbers & Prices',
    nameAr: 'الأرقام والأسعار والذهب',
    level: 'A2',
    descriptionAr: 'تحكم في حسابات منجم الذهب وأسعار الترقيات في سوق القرية المالي.',
    buildingType: 'gold_mine',
    words: [
      { word: 'Gold', meaning: 'ذهب', hintAr: 'جولد - العملة الأساسية للبناء' },
      { word: 'Price', meaning: 'سعر', hintAr: 'برايس - تكلفة البناء أو الترقية' },
      { word: 'Thousand', meaning: 'ألف', hintAr: 'ثاوزند - للكميات الكبيرة من الموارد' },
      { word: 'Spend', meaning: 'ينفق', hintAr: 'سبيند - استخدام الذهب في التطوير' },
      { word: 'Cheap', meaning: 'رخيص', hintAr: 'شيب - تكلفة منخفضة' }
    ],
    quizzes: [
      { question: 'ما معنى كلمة "Gold" باللغة العربية؟', options: ['إكسير', 'ذهب', 'جوهرة', 'فضة'], answer: 'ذهب' },
      { question: 'إذا كان البناء يكلف مبلغاً قليلاً، فهو:', options: ['Cheap', 'Thousand', 'Spend', 'Price'], answer: 'Cheap' },
      { question: 'ما معنى كلمة "Spend"؟', options: ['يجمع', 'ينفق', 'ينتج', 'يحمي'], answer: 'ينفق' }
    ]
  },
  {
    id: 'lesson_4',
    name: 'Command Verbs',
    nameAr: 'أفعال الأمر العسكرية',
    level: 'B1',
    descriptionAr: 'درب جنودك في الثكنات باستخدام أوامر واضحة ومباشرة لتنفيذ تكتيكات الفوز.',
    buildingType: 'barracks',
    words: [
      { word: 'Attack', meaning: 'هاجم', hintAr: 'أتاك - بدء التقدم نحو الأعداء' },
      { word: 'Defend', meaning: 'دافع', hintAr: 'ديفيند - حماية بوابات القرية' },
      { word: 'March', meaning: 'تقدم / زحف', hintAr: 'مارتش - تحرك الجنود بانتظام' },
      { word: 'Halt', meaning: 'قف', hintAr: 'هالت - التوقف الفوري لتفادي الفخاخ' },
      { word: 'Retreat', meaning: 'تراجع', hintAr: 'ريتريت - الانسحاب التكتيكي لإعادة التموضع' }
    ],
    quizzes: [
      { question: 'ما هو المعنى الصحيح لكلمة "Attack"؟', options: ['تراجع', 'قف', 'دافع', 'هاجم'], answer: 'هاجم' },
      { question: 'أي من الكلمات التالية يعني "قف"؟', options: ['Halt', 'March', 'Defend', 'Retreat'], answer: 'Halt' },
      { question: 'ما معنى كلمة "Defend"؟', options: ['يهاجم', 'يدافع', 'يتراجع', 'يزحف'], answer: 'يدافع' }
    ]
  },
  {
    id: 'lesson_5',
    name: 'Home & Family',
    nameAr: 'المنزل والعائلة والعرش',
    level: 'A1',
    descriptionAr: 'مفردات الدفء وبناء مخازن الذهب الكبيرة والحفاظ على روابط القرية.',
    buildingType: 'gold_storage',
    words: [
      { word: 'Home', meaning: 'وطن / منزل', hintAr: 'هوم - قريتنا الآمنة' },
      { word: 'Family', meaning: 'عائلة', hintAr: 'فاميلي - عائلتنا الكبيرة في القرية' },
      { word: 'Brother', meaning: 'أخ', hintAr: 'براذر - خالد كأخ في السلاح' },
      { word: 'Sister', meaning: 'أخت', hintAr: 'سيستر - زوجتك كأخت ترشدنا' },
      { word: 'Safe', meaning: 'آمن', hintAr: 'سيف - حماية القرية تجعلنا آمنين' }
    ],
    quizzes: [
      { question: 'ما معنى كلمة "Home"؟', options: ['منزل / وطن', 'عائلة', 'آمن', 'سعر'], answer: 'منزل / وطن' },
      { question: 'ما الكلمة الإنجليزية التي تعني "آمن"؟', options: ['Safe', 'Sister', 'Home', 'Family'], answer: 'Safe' },
      { question: 'ما معنى كلمة "Brother"؟', options: ['أخ', 'أخت', 'صديق', 'زعيم'], answer: 'أخ' }
    ]
  },
  {
    id: 'lesson_6',
    name: 'Travel & Directions',
    nameAr: 'السفر والاتجاهات',
    level: 'B1',
    descriptionAr: 'وجه جنودك في معسكر الجيش نحو بوابات قلاع الأعداء والطرق السرية.',
    buildingType: 'army_camp',
    words: [
      { word: 'Bridge', meaning: 'جسر', hintAr: 'بريدج - للعبور فوق الأنهار السامة' },
      { word: 'Map', meaning: 'خريطة', hintAr: 'ماب - خريطة العالم لاستكشاف قلاع قارماز' },
      { word: 'Left', meaning: 'يسار', hintAr: 'ليفت - الالتفاف لتفادي المدافع' },
      { word: 'Right', meaning: 'يمين', hintAr: 'رايت - طريق هجوم رماة السهام' },
      { word: 'North', meaning: 'شمال', hintAr: 'نورث - اتجاه عاصمتنا المسلوبة' }
    ],
    quizzes: [
      { question: 'ما معنى كلمة "Bridge"؟', options: ['جدار', 'بوابة', 'جسر', 'خريطة'], answer: 'جسر' },
      { question: 'أي الكلمات تعني "خريطة" بالإنجليزية؟', options: ['Bridge', 'Map', 'North', 'Left'], answer: 'Map' },
      { question: 'ما معنى كلمة "Left"؟', options: ['يمين', 'يسار', 'شمال', 'جنوب'], answer: 'يسار' }
    ]
  },
  {
    id: 'lesson_7',
    name: 'Food & Drinks',
    nameAr: 'الطعام والشراب السحري',
    level: 'B2',
    descriptionAr: 'حافظ على تزويد رماة السهام والعمال بطاقة مستمرة عن طريق مخازن الإكسير.',
    buildingType: 'elixir_storage',
    words: [
      { word: 'Water', meaning: 'ماء', hintAr: 'ووتر - لري المزارع الجافة' },
      { word: 'Bread', meaning: 'خبز', hintAr: 'بريد - غذاء أساسي للجنود' },
      { word: 'Fruit', meaning: 'فاكهة', hintAr: 'فروت - طاقة من بساتين القرية' },
      { word: 'Sweet', meaning: 'حلو / عذب', hintAr: 'سويت - مذاق النصر' },
      { word: 'Hungry', meaning: 'جائع', hintAr: 'هانجري - الجنود الضعفاء قبل المراجعة' }
    ],
    quizzes: [
      { question: 'ما معنى كلمة "Hungry"؟', options: ['جائع', 'عطشان', 'شبعان', 'مريض'], answer: 'جائع' },
      { question: 'كلمة الإنجليزية للـ "خبز" هي:', options: ['Bread', 'Water', 'Fruit', 'Sweet'], answer: 'Bread' },
      { question: 'ما معنى كلمة "Water"؟', options: ['ماء', 'خبز', 'عصير', 'لبن'], answer: 'ماء' }
    ]
  },
  {
    id: 'lesson_8',
    name: 'Complex Grammar & Diplomacy',
    nameAr: 'الخطابة والسياسة المعقدة',
    level: 'C1',
    descriptionAr: 'تحدث بلغة الملوك من قاعة البلدة لتوحيد القبائل وإرهاب الخائن قارماز.',
    buildingType: 'town_hall',
    words: [
      { word: 'Throne', meaning: 'عرش', hintAr: 'ثرون - مقعد حكمك المسلوب' },
      { word: 'Kingdom', meaning: 'مملكة', hintAr: 'كينجدوم - إمبراطورية السلام التي سنستعيدها' },
      { word: 'Betray', meaning: 'يخون', hintAr: 'بيتري - فعل قارماز الشنيع' },
      { word: 'Victory', meaning: 'نصر / فوز', hintAr: 'فيكتوري - النتيجة الحتمية للمثابرة' },
      { word: 'Rule', meaning: 'يحكم / قانون', hintAr: 'رول - بسط العدالة في البلاد' }
    ],
    quizzes: [
      { question: 'ما المعنى العربي لكلمة "Betray"؟', options: ['يساعد', 'يخون', 'يحكم', 'ينتصر'], answer: 'يخون' },
      { question: 'العرش بالإنجليزية يسمى:', options: ['Throne', 'Kingdom', 'Victory', 'Rule'], answer: 'Throne' },
      { question: 'ما معنى كلمة "Victory"؟', options: ['خزوجتك', 'خيانة', 'نصر / فوز', 'سلام'], answer: 'نصر / فوز' }
    ]
  }
];
