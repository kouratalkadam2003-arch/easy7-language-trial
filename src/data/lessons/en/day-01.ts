import type { Lesson } from "../types";

const lesson: Lesson = {
  day: 1,
  lang: "en",
  cefr: "A1",
  storyArc: "standalone",
  title: "أول لقاء — ليث وإيلي",
  dialogue: [
    { character: "Laith",   native: "Hello! My name is Laith.",      pronunciation: "هيلو، ماي نيم إز ليث",       translation: "مرحباً! اسمي ليث.", tier: "core" },
    { character: "Elly",  native: "Hello Laith! My name is Elly.",pronunciation: "هيلو ليث، ماي نيم إز إيلي",  translation: "مرحباً ليث! اسمي إيلي.",     tier: "core" },
    { character: "Laith",   native: "Nice to meet you.",            pronunciation: "نايس تو ميت يو",            translation: "تشرفت بلقائك.",                  tier: "core" },
    { character: "Elly",  native: "Nice to meet you too.",        pronunciation: "نايس تو ميت يو تو",         translation: "وأنا تشرفت أيضاً.",              tier: "core" },
    { character: "Laith",   native: "Where are you from?",          pronunciation: "وير آر يو فروم؟",           translation: "من أين أنتِ؟",          tier: "medium" },
    { character: "Elly",  native: "I am from the village.",             pronunciation: "آي أم فروم ذا فيليج",         translation: "أنا من القرية.",                    tier: "core" },
    { character: "Laith",   native: "I am from far away.",           pronunciation: "آي أم فروم فار أواي",        translation: "أنا من مكان بعيد.",                   tier: "medium" },
    { character: "Elly",  native: "See you later!",               pronunciation: "سي يو ليتر",                translation: "أراك لاحقاً!",                   tier: "secondary" },
  ],
};

export default lesson;
