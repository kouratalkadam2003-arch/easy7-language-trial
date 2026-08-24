export type WordEntry = {
  en: string
  ar: string
  /** Arabic phonetic pronunciation */
  pron: string
}

/** Dictionary of English words used in the story — key is lowercase word */
export const DICTIONARY: Record<string, WordEntry> = {
  you: { en: 'you', ar: 'أنتَ / أنتِ', pron: 'يُو' },
  are: { en: 'are', ar: 'تكون', pron: 'آر' },
  stronger: { en: 'stronger', ar: 'أقوى', pron: 'سترونغَر' },
  now: { en: 'now', ar: 'الآن', pron: 'ناو' },
  come: { en: 'come', ar: 'تعالَ', pron: 'كَم' },
  with: { en: 'with', ar: 'مع', pron: 'وِذ' },
  me: { en: 'me', ar: 'أنا (مفعول)', pron: 'مِي' },
  to: { en: 'to', ar: 'إلى', pron: 'تُو' },
  the: { en: 'the', ar: 'الـ (أداة تعريف)', pron: 'ذَ' },
  village: { en: 'village', ar: 'قرية', pron: 'فيلِج' },
  we: { en: 'we', ar: 'نحن', pron: 'وِي' },
  need: { en: 'need', ar: 'نحتاج', pron: 'نِيد' },
  bread: { en: 'bread', ar: 'خبز', pron: 'برِد' },
  see: { en: 'see', ar: 'يرى', pron: 'سِي' },
  baker: { en: 'baker', ar: 'خبّاز', pron: 'بيكَر' },
  there: { en: 'there', ar: 'هناك', pron: 'ذير' },
  go: { en: 'go', ar: 'اذهب', pron: 'غو' },
  buy: { en: 'buy', ar: 'يشتري', pron: 'باي' },
  speak: { en: 'speak', ar: 'يتكلم', pron: 'سبِيك' },
  english: { en: 'English', ar: 'الإنجليزية', pron: 'إنغلِش' },
  can: { en: 'can', ar: 'يستطيع', pron: 'كان' },
  do: { en: 'do', ar: 'يفعل', pron: 'دُو' },
  it: { en: 'it', ar: 'هو / هي (لغير العاقل)', pron: 'إت' },
  i: { en: 'I', ar: 'أنا', pron: 'آي' },
  will: { en: 'will', ar: 'سوف', pron: 'وِل' },
  watch: { en: 'watch', ar: 'يراقب', pron: 'وُتش' },
  good: { en: 'good', ar: 'جيد', pron: 'غُود' },
  morning: { en: 'morning', ar: 'صباح', pron: 'مورنِنغ' },
  remember: { en: 'remember', ar: 'تذكّر', pron: 'رِمِمبَر' },
  want: { en: 'want', ar: 'يريد', pron: 'وُنت' },
  please: { en: 'please', ar: 'من فضلك', pron: 'بلِيز' },
  mistakes: { en: 'mistakes', ar: 'أخطاء', pron: 'مِستيكس' },
  okay: { en: 'okay', ar: 'حسناً / لا بأس', pron: 'أوكي' },
  kind: { en: 'kind', ar: 'لطيف', pron: 'كايند' },
  just: { en: 'just', ar: 'فقط', pron: 'جَست' },
  try: { en: 'try', ar: 'حاوِل', pron: 'تراي' },
  welcome: { en: 'welcome', ar: 'أهلاً بك', pron: 'وِلكَم' },
  young: { en: 'young', ar: 'شاب / صغير', pron: 'يانغ' },
  man: { en: 'man', ar: 'رجل', pron: 'مان' },
  fine: { en: 'fine', ar: 'جميل / بخير', pron: 'فاين' },
  yes: { en: 'yes', ar: 'نعم', pron: 'يِس' },
  what: { en: 'what', ar: 'ماذا', pron: 'وُت' },
  get: { en: 'get', ar: 'يحصل على', pron: 'غِت' },
  for: { en: 'for', ar: 'لأجل', pron: 'فور' },
  today: { en: 'today', ar: 'اليوم', pron: 'تُدَي' },
  two: { en: 'two', ar: 'اثنان', pron: 'تُو' },
  loaves: { en: 'loaves', ar: 'أرغفة', pron: 'لوفز' },
  that: { en: 'that', ar: 'ذلك', pron: 'ذات' },
  be: { en: 'be', ar: 'يكون', pron: 'بِي' },
  three: { en: 'three', ar: 'ثلاثة', pron: 'ثرِي' },
  coins: { en: 'coins', ar: 'عملات معدنية', pron: 'كوينز' },
  anything: { en: 'anything', ar: 'أي شيء', pron: 'إنيثِنغ' },
  else: { en: 'else', ar: 'آخر / غير ذلك', pron: 'إلس' },
  friend: { en: 'friend', ar: 'صديق', pron: 'فرِند' },
  here: { en: 'here', ar: 'هنا', pron: 'هِير' },
  thank: { en: 'thank', ar: 'يشكر', pron: 'ثانك' },
  no: { en: 'no', ar: 'لا', pron: 'نو' },
  goodbye: { en: 'goodbye', ar: 'وداعاً', pron: 'غُودباي' },
  name: { en: 'name', ar: 'اسم', pron: 'نيم' },
  my: { en: 'my', ar: 'خاصتي (لي)', pron: 'ماي' },
  is: { en: 'is', ar: 'يكون', pron: 'إز' },
  stay: { en: 'stay', ar: 'ابقَ', pron: 'ستَي' },
  safe: { en: 'safe', ar: 'آمِن', pron: 'سيف' },
  hungry: { en: 'hungry', ar: 'جائع', pron: 'هَنغري' },
  thirsty: { en: 'thirsty', ar: 'عطشان', pron: 'ثيرستي' },
  talk: { en: 'talk', ar: 'تحدّث', pron: 'توك' },
  water: { en: 'water', ar: 'ماء', pron: 'ووتَر' },
  sleep: { en: 'sleep', ar: 'ينام', pron: 'سلِيب' },
  where: { en: 'where', ar: 'أين', pron: 'وير' },
  am: { en: 'am', ar: 'أكون (للمتكلم)', pron: 'آم' },
  your: { en: 'your', ar: 'خاصتك (لك)', pron: 'يور' },
  face: { en: 'face', ar: 'وجه', pron: 'فيس' },
  white: { en: 'white', ar: 'أبيض / شاحب', pron: 'وايت' },
  who: { en: 'who', ar: 'مَن', pron: 'هُو' },
  poster: { en: 'poster', ar: 'ملصق', pron: 'بوستَر' },
  on: { en: 'on', ar: 'على', pron: 'أون' },
  did: { en: 'did', ar: 'فعلتَ (ماضي)', pron: 'دِد' },
  like: { en: 'like', ar: 'مِثل', pron: 'لايك' },
  real: { en: 'real', ar: 'حقيقي', pron: 'رِيَل' },
  villager: { en: 'villager', ar: 'قروي', pron: 'فيلِجَر' },
  spoke: { en: 'spoke', ar: 'تكلمتَ (ماضي)', pron: 'سبوك' },
  back: { en: 'back', ar: 'عودة / خلف', pron: 'باك' },
  soon: { en: 'soon', ar: 'قريباً', pron: 'سُون' },
  inside: { en: 'inside', ar: 'في الداخل', pron: 'إنسايد' },
  fish: { en: 'fish', ar: 'سمك', pron: 'فِش' },
  milk: { en: 'milk', ar: 'حليب', pron: 'مِلك' },
  night: { en: 'night', ar: 'ليل', pron: 'نايت' },
  evening: { en: 'evening', ar: 'مساء', pron: 'إيفنِنغ' },
}

export type SwapDrill = {
  /** Arabic instruction: what to change */
  promptAr: string
  /** the base sentence shown */
  base: string
  /** the word in base to replace (highlighted) */
  target: string
  /** the correct replacement word */
  replacement: string
  /** example result */
  result: string
}

export type TrainingSentence = {
  en: string
  ar: string
  /** Arabic imagined situation where the player must produce this sentence */
  imagineAr: string
  /** keywords for checking the answer (lowercase, any match passes) */
  accepts: string[]
  swap: SwapDrill
}

export type TrainingSet = {
  id: string
  /** Elly's opening line for the night training */
  introEn: string
  introAr: string
  sentences: TrainingSentence[]
  outroEn: string
  outroAr: string
}

/** Night 1: after chapter 1 — reviewing survival phrases before the village trip */
export const NIGHT_TRAINING_1: TrainingSet = {
  id: 'night1',
  introEn: '"Before we go to the village tomorrow... let\'s practice, Laith. Words saved your life once. They will again."',
  introAr: 'تشعل إيلي الفانوس وتفرد ورقة على الطاولة. الليلة، ستتدرب على جمل اليوم.',
  sentences: [
    {
      en: 'My name is Laith',
      ar: 'اسمي ليث',
      imagineAr: 'تخيّل: غريب في الطريق يسألك "?What\'s your name". ماذا تقول؟',
      accepts: ['my name is'],
      swap: {
        promptAr: 'الآن بدّل: عرّف عن إيلي بدلاً من نفسك. استبدل "Laith" واجعلها "Elly" وغيّر "My" إلى "Her".',
        base: 'My name is Laith',
        target: 'Laith',
        replacement: 'elly',
        result: 'Her name is Elly',
      },
    },
    {
      en: 'Water, please',
      ar: 'ماء، من فضلك',
      imagineAr: 'تخيّل: أنت عطشان بعد يوم طويل، وإيلي تقف بجانب الجرّة. ماذا تطلب؟',
      accepts: ['water'],
      swap: {
        promptAr: 'الآن بدّل: اطلب الخبز بدلاً من الماء.',
        base: 'Water, please',
        target: 'Water',
        replacement: 'bread',
        result: 'Bread, please',
      },
    },
    {
      en: 'Thank you, Elly',
      ar: 'شكراً لك يا إيلي',
      imagineAr: 'تخيّل: أنقذتك فتاة من الغرق واعتنت بك ثلاثة أيام. ماذا تقول لها؟',
      accepts: ['thank you', 'thank'],
      swap: {
        promptAr: 'الآن بدّل: اشكر الخباز بدلاً من إيلي — قل "Thank you, baker".',
        base: 'Thank you, Elly',
        target: 'Elly',
        replacement: 'baker',
        result: 'Thank you, baker',
      },
    },
  ],
  outroEn: '"Perfect, Laith! Tomorrow, the village will hear you speak. Now sleep."',
  outroAr: 'تطفئ إيلي الفانوس. غداً... القرية.',
}

/** Night 2: after the wanted poster — nervous review before the truth */
export const NIGHT_TRAINING_2: TrainingSet = {
  id: 'night2',
  introEn: '"Laith... your hands are shaking. Sit. Let\'s practice — words will calm you. Then... you tell me everything."',
  introAr: 'عدتما إلى الكوخ قبل الغروب. إيلي قلقة، لكنها تصر على التدريب الليلي قبل أن تسمع الحقيقة.',
  sentences: [
    {
      en: 'Good morning',
      ar: 'صباح الخير',
      imagineAr: 'تخيّل: تدخل السوق صباحاً ويبتسم لك الخباز. بمَ تحيّيه؟',
      accepts: ['good morning'],
      swap: {
        promptAr: 'الآن بدّل: حيِّ أحدهم في المساء بدلاً من الصباح — استبدل "morning" بـ "evening".',
        base: 'Good morning',
        target: 'morning',
        replacement: 'evening',
        result: 'Good evening',
      },
    },
    {
      en: 'I want bread, please',
      ar: 'أريد خبزاً، من فضلك',
      imagineAr: 'تخيّل: تقف أمام بائع وجائع جداً. كيف تطلب الخبز بأدب؟',
      accepts: ['want bread', 'bread, please', 'bread please'],
      swap: {
        promptAr: 'الآن بدّل: اطلب السمك بدلاً من الخبز — استبدل "bread" بـ "fish".',
        base: 'I want bread, please',
        target: 'bread',
        replacement: 'fish',
        result: 'I want fish, please',
      },
    },
    {
      en: 'Here you are',
      ar: 'تفضّل (عند إعطاء شيء)',
      imagineAr: 'تخيّل: الخباز طلب ثلاث عملات وأنت تمدّ يدك بها. ماذا تقول؟',
      accepts: ['here you are', 'here you go'],
      swap: {
        promptAr: 'الآن بدّل: أعطِ إيلي الخبز وقل "Here is the bread".',
        base: 'Here you are',
        target: 'you are',
        replacement: 'bread',
        result: 'Here is the bread',
      },
    },
    {
      en: 'No, thank you. Goodbye!',
      ar: 'لا، شكراً. وداعاً!',
      imagineAr: 'تخيّل: البائع يسألك "?Anything else" وأنت انتهيت. كيف ترفض بأدب وتودّعه؟',
      accepts: ['no, thank', 'no thank', 'goodbye'],
      swap: {
        promptAr: 'الآن بدّل: وافق بدلاً من الرفض — قل "Yes, please" بدلاً من "No, thank you".',
        base: 'No, thank you. Goodbye!',
        target: 'No, thank you',
        replacement: 'yes',
        result: 'Yes, please!',
      },
    },
  ],
  outroEn: '"You learn so fast... Now, Laith. The poster. Tell me the truth."',
  outroAr: 'تطوي إيلي الورقة ببطء وتنظر في عينيك. حان وقت الحقيقة.',
}
