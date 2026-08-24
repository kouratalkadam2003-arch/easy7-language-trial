export interface Language {
  code: string;
  name?: string;
  englishName: string;
  nativeName: string;
  flag?: string;
}

export interface Topic {
  id: string;
  title: string;
}

export interface DialogueLine {
  speaker: string;
  native: string;
  translation: string;
  romaji?: string;
  ar?: string;
}

export interface RadioTurn {
  speaker: string;
  text: string;
  translation?: string;
  nativeScript?: string;
  // RADIO_SCHEMA declares this as a string enum, not a number.
  laughterLevel?: 'none' | 'giggle' | 'hearty' | 'hysterical';
}

export interface RadioContentType {
  turns: RadioTurn[];
}

export interface StoryContentType {
  dialog: any[];
  basicVocabulary?: any[];
  grammarTip?: any;
}

export interface TextChatContentType {
  messages: TextChatMessage[];
}

export interface TextChatMessage {
  id: string;
  speaker: 'A' | 'B' | string;
  speakerName: string;
  text: string;
  translation?: string;
  pronunciation?: string;
  gender?: string;
}

export interface Flashcard {
  id: string;
  originalText?: string;
  translation?: string;
  status?: string;
  romanization?: string;
  tier?: string;
  prompt?: string;
  correctAnswer?: string;
  options?: string[];
}

export interface Station {
  id?: string;
  name?: string;
  stationName?: string;
  arabicStationName?: string;
  host?: string;
  genre?: string;
  topics?: Topic[];
  days?: Array<{
    dayNumber: number;
    title: string;
    arabicTitle: string;
  }>;
}

export interface UserData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  language?: string;
  level?: string;
  streak?: number;
  xp?: number;
  gems?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface WordData {
  translation: string;
  native?: string | null;
  transliteration?: string;
  audio?: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'bot' | 'A' | 'B' | string;
  text: string;
  isFinal?: boolean;
  translation?: string;
}

export interface ImageGenerationItem {
  prompt: string;
  caption: string;
}

export interface AssistantMessage {
  id?: string;
  speaker: 'user' | 'model' | 'bot';
  text: string;
}

export interface AssistantContextData {
  language: Language;
  dayNumber: number;
  topic: Topic;
  level: string;
  story: {
    translatedText: string;
    grammarTip: {
      title: string;
      tip: string;
    };
  };
}

export interface LessonExportData {
  language: Language;
  topic: Topic;
  story: {
    originalText: string;
    translatedText?: string;
    additionalExpressions?: Array<{ phrase: string; translation: string }>;
  };
}

export interface SubstitutionVariation {
  changedWord: string;
  fullSentence: string;
  translation: string;
}
