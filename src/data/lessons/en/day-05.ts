import type { Lesson } from "../types";

const lesson: Lesson = {
  day: 5,
  lang: "en",
  cefr: "A1",
  storyArc: "king-kitten",
  title: "نزهة في الحديقة",
  dialogue: [
    { character: "King",   native: "Let's go to the garden.",      pronunciation: "ليتس غو تو ذا غاردن",        translation: "لنذهب إلى الحديقة.",          tier: "core" },
    { character: "Kitten", native: "Great idea! I love flowers.",  pronunciation: "غريت أيديا! آي لَڤ فلاورز",  translation: "فكرة رائعة! أحبّ الزهور.",     tier: "core" },
    { character: "King",   native: "Look at this red flower.",     pronunciation: "لُك آت ذيس ريد فلاور",       translation: "انظري إلى هذه الزهرة الحمراء.", tier: "core" },
    { character: "Kitten", native: "It is very pretty.",           pronunciation: "إت إز فيري بريتي",           translation: "هي جميلة جدًا.",               tier: "core" },
    { character: "King",   native: "The birds are singing.",       pronunciation: "ذا بيردز آر سينغينغ",        translation: "الطيور تُغرّد.",                tier: "medium" },
    { character: "Kitten", native: "I feel so happy here.",        pronunciation: "آي فيل سو هابي هير",         translation: "أشعر بسعادة كبيرة هنا.",       tier: "medium" },
    { character: "King",   native: "The garden is our peaceful place.", pronunciation: "ذا غاردن إز أور بيسفول بليس", translation: "الحديقة مكاننا الهادئ.",  tier: "secondary" },
  ],
};

export default lesson;
