import type { Lesson } from "../types";

const lesson: Lesson = {
  day: 2,
  lang: "en",
  cefr: "A1",
  storyArc: "king-kitten",
  title: "كيف حالك؟",
  dialogue: [
    { character: "King",   native: "Good morning, Mimi.",        pronunciation: "غود مورنينغ، ميمي",     translation: "صباح الخير يا ميمي.",          tier: "core" },
    { character: "Kitten", native: "Good morning, Leo.",         pronunciation: "غود مورنينغ، ليو",       translation: "صباح الخير يا ليو.",           tier: "core" },
    { character: "King",   native: "How are you today?",         pronunciation: "هاو آر يو تو-داي؟",       translation: "كيف حالك اليوم؟",              tier: "core" },
    { character: "Kitten", native: "I am fine, thank you.",      pronunciation: "آي أم فاين، ثانك يو",     translation: "أنا بخير، شكرًا لك.",           tier: "core" },
    { character: "Kitten", native: "And you?",                   pronunciation: "آند يو؟",                  translation: "وأنت؟",                        tier: "core" },
    { character: "King",   native: "I am very well.",            pronunciation: "آي أم فيري ويل",           translation: "أنا بخير جدًا.",               tier: "medium" },
    { character: "King",   native: "The sun is beautiful today.", pronunciation: "ذا صَن إز بيوتيفول تو-داي", translation: "الشمس جميلة اليوم.",           tier: "secondary" },
  ],
};

export default lesson;
