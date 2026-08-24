import type { Lesson } from "../types";

const lesson: Lesson = {
  day: 4,
  lang: "en",
  cefr: "A1",
  storyArc: "king-kitten",
  title: "في المطبخ",
  dialogue: [
    { character: "King",   native: "Are you hungry?",            pronunciation: "آر يو هَنغري؟",             translation: "هل أنتِ جائعة؟",                tier: "core" },
    { character: "Kitten", native: "Yes, I am very hungry.",     pronunciation: "يس، آي أم فيري هَنغري",     translation: "نعم، أنا جائعة جدًا.",           tier: "core" },
    { character: "King",   native: "What do you want to eat?",   pronunciation: "وات دو يو وانت تو إيت؟",   translation: "ماذا تريدين أن تأكلي؟",         tier: "core" },
    { character: "Kitten", native: "I want some fish, please.",  pronunciation: "آي وانت سَم فيش، بليز",     translation: "أريد بعض السمك من فضلك.",       tier: "core" },
    { character: "King",   native: "Here you are.",              pronunciation: "هير يو آر",                translation: "تفضّلي.",                       tier: "medium" },
    { character: "Kitten", native: "This is delicious!",         pronunciation: "ذيس إز ديليشَس",           translation: "هذا لذيذ!",                     tier: "medium" },
    { character: "King",   native: "I am glad you like it.",     pronunciation: "آي أم غلاد يو لايك إت",    translation: "يسعدني أنكِ أحببتِه.",           tier: "secondary" },
  ],
};

export default lesson;
