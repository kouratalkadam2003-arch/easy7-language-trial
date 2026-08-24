export type LangCode = "en" | "it" | "fr" | "es" | "de" | "ja" | "zh";
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Tier = "core" | "medium" | "secondary";
export type StoryArc = "king-kitten" | "eli-levi" | "standalone";

export interface DialogueLine {
  character: string;
  native: string;         // target-language sentence
  pronunciation: string;  // Arabic phonetic helper
  translation: string;    // Arabic translation
  tier: Tier;
  romaji?: string;
}

export interface Lesson {
  day: number;            // 1..90
  lang: LangCode;
  cefr: Cefr;
  title: string;          // Arabic title
  storyArc?: StoryArc;
  dialogue: DialogueLine[];
}
