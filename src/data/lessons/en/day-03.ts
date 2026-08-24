import type { Lesson } from "../types";

const lesson: Lesson = {
  day: 3,
  lang: "en",
  cefr: "A1",
  storyArc: "king-kitten",
  title: "بيت الملك",
  dialogue: [
    { character: "Kitten", native: "Where do you live?",         pronunciation: "وير دو يو ليڤ؟",          translation: "أين تسكن؟",                    tier: "core" },
    { character: "King",   native: "I live in a big castle.",    pronunciation: "آي ليڤ إن أ بيغ كاسل",     translation: "أسكن في قلعة كبيرة.",           tier: "core" },
    { character: "Kitten", native: "Is it far?",                 pronunciation: "إز إت فار؟",               translation: "هل هي بعيدة؟",                 tier: "core" },
    { character: "King",   native: "No, it is very close.",      pronunciation: "نو، إت إز فيري كلوز",      translation: "لا، هي قريبة جدًا.",            tier: "core" },
    { character: "Kitten", native: "Can I visit you?",           pronunciation: "كان آي ڤيزيت يو؟",         translation: "هل يمكنني زيارتك؟",             tier: "medium" },
    { character: "King",   native: "Of course, you are welcome.", pronunciation: "أوف كورس، يو آر ويلكم",   translation: "بالطبع، أهلًا وسهلًا.",         tier: "medium" },
    { character: "Kitten", native: "Thank you very much.",       pronunciation: "ثانك يو فيري ماتش",        translation: "شكرًا جزيلًا لك.",              tier: "secondary" },
  ],
};

export default lesson;
