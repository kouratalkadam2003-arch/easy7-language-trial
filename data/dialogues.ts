export interface DialogueLine {
  native: string;
  translation: string;
  pronunciation?: string;
  character?: string;
}

export interface LessonDialogue {
  day: number;
  title: string;
  titleAr: string;
  lines: DialogueLine[];
  vocabulary: { word: string; meaning: string; example: string }[];
}

export const DIALOGUES: LessonDialogue[] = [
  {
    day: 1,
    title: "First Meeting",
    titleAr: "اللقاء الأول",
    lines: [
      { native: "Hello!", translation: "!مرحباً", pronunciation: "هالو", character: "eli" },
      { native: "My name is Sarah.", translation: "اسمي سارة.", pronunciation: "ماي نايم إز سارة", character: "eli" },
      { native: "What is your name?", translation: "ما اسمك؟", pronunciation: "وات إز يور نايم؟", character: "eli" },
      { native: "Nice to meet you.", translation: "تشرفت بمعرفتك.", pronunciation: "نايس تو ميت يو", character: "eli" },
      { native: "How are you?", translation: "كيف حالك؟", pronunciation: "هاو آر يو؟", character: "eli" },
      { native: "I am fine, thank you.", translation: "أنا بخير، شكراً.", pronunciation: "آ آم فاين،ثانك يو", character: "eli" },
    ],
    vocabulary: [
      { word: "Hello", meaning: "مرحباً", example: "Hello, how are you?" },
      { word: "Name", meaning: "اسم", example: "What is your name?" },
      { word: "Fine", meaning: "بخير", example: "I am fine" },
    ]
  },
  {
    day: 2,
    title: "Daily Routine",
    titleAr: "روتين يومي",
    lines: [
      { native: "I wake up at 7 AM.", translation: "أستيقظ الساعة 7 صباحاً.", pronunciation: "آي ويك أب آت سفن إيه إم", character: "eli" },
      { native: "I eat breakfast.", translation: "آكل الفطور.", pronunciation: "آي إت بريكفاست", character: "eli" },
      { native: "I go to school.", translation: "أذهب إلى المدرسة.", pronunciation: "آي تو تو سكول", character: "eli" },
      { native: "I study English.", translation: "أدرس الإنجليزية.", pronunciation: "آي ستادي إنجليش", character: "eli" },
      { native: "I am hungry.", translation: "أنا جائع.", pronunciation: "آ آم هانجري", character: "tom" },
      { native: "Let's eat together!", translation: "يا نأكل معاً!", pronunciation: "ليتس إيت توغيذر", character: "tom" },
    ],
    vocabulary: [
      { word: "Wake up", meaning: "يستيقظ", example: "I wake up at 7 AM" },
      { word: "Breakfast", meaning: "فطور", example: "I eat breakfast" },
      { word: "School", meaning: "مدرسة", example: "I go to school" },
    ]
  },
  {
    day: 3,
    title: "At the Market",
    titleAr: "في السوق",
    lines: [
      { native: "How much is this?", translation: "كم ثمن هذا؟", pronunciation: "هاو ماش إز ذيس؟", character: "eli" },
      { native: "I want to buy this.", translation: "أريد شراء هذا.", pronunciation: "آي وانت تو باي ذيس", character: "eli" },
      { native: "It is expensive.", translation: "إنه غالي.", pronunciation: "إت إز إكسبنسف", character: "tom" },
      { native: "Can you make it cheaper?", translation: "هل يمكنك أن تجعله أرخص؟", pronunciation: "كن يو ميك إت تشيبر؟", character: "tom" },
      { native: "I have money.", translation: "لدي أموال.", pronunciation: "آي هاف موني", character: "eli" },
      { native: "Thank you very much!", translation: "شكراً جزيلاً!", pronunciation: "ثانك يو فيري ماش!", character: "eli" },
    ],
    vocabulary: [
      { word: "How much", meaning: "كم", example: "How much is this?" },
      { word: "Expensive", meaning: "غالي", example: "It is expensive" },
      { word: "Buy", meaning: "يشتري", example: "I want to buy this" },
    ]
  },
];

export function getDialogueForDay(day: number): LessonDialogue | undefined {
  return DIALOGUES.find(d => d.day === day);
}

export function getAllDialogues(): LessonDialogue[] {
  return DIALOGUES;
}
