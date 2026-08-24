// Types for LINGO_STORY_LESSON_V1 documents served from /story_lessons

export interface StoryPhrase {
  phraseId: string
  text: string
  englishReference?: string
  arabicTranslation: string
  pronunciation?: string
  classification: 'core' | 'idiom' | 'support' | string
  communicativeFunction?: string
  storyFirstUse?: string
  transferContexts?: string[]
  reviewPriority?: string
}

export interface StoryLine {
  lineId?: string
  speakerId?: string
  targetText?: string
  englishReference?: string
  arabicTranslation?: string
  pronunciation?: string
  narrationArabic?: string
  phraseIds?: string[]
  teachingExposure?: string
}

export interface GuidedActivity {
  activityType: 'listen_and_point' | 'echo_then_hide' | 'meaning_match' | 'context_change' | 'argument_rebuild' | string
  phraseIds: string[]
  hintFade?: string
}

export interface ProofTask {
  mode?: string
  requiredFunctions?: string[]
  disallowDirectAnswerOptions?: boolean
  minimumResponseIdeas?: number
}

export interface StoryScene {
  sceneId: string
  kind: 'narrative' | 'learning' | 'guided_practice' | 'transfer' | 'radio' | 'proof'
  isLearningInput?: boolean
  localizationMode?: string
  purposeArabic?: string
  lines?: StoryLine[]
  activities?: GuidedActivity[]
  promptArabic?: string
  requiredPhraseIds?: string[]
  setupArabic?: string
  task?: ProofTask
  beforeAfter?: { beforeArabic?: string; afterArabic?: string }
  successWorldConsequence?: string
  retryPolicy?: string
  optional?: boolean
  spoilerSafe?: boolean
}

export interface StoryLessonMetadata {
  lessonId: string
  languageCode: string
  languageNameArabic?: string
  cefrLevel: string
  chapterId: string
  dayNumber: number
  lessonTitle?: string
  englishTitle: string
  arabicTitle: string
}

export interface StoryLessonDoc {
  type: 'LINGO_STORY_LESSON_V1'
  schemaVersion?: number | string
  metadata: StoryLessonMetadata
  curriculum: {
    languageObjectiveArabic: string
    realLifeTransferArabic?: string
    successCapabilityArabic?: string
  }
  story: {
    storyContextArabic: string
    storyMissionArabic: string
    setting?: unknown
    charactersPresent?: unknown
    narrativeOutcomeArabic?: string
  }
  scenes: StoryScene[]
  phraseBank: StoryPhrase[]
  learningData?: {
    inputPlan?: { listenFirst?: boolean; supports?: string[]; supportFadePlan?: string }
    memorization?: { knifeHit?: unknown; zombieFight?: unknown }
    smartReview?: { introducePhraseIds?: string[]; dueInDays?: number[]; inStoryReviewHookArabic?: string }
  }
  continuity?: {
    previousLessonId?: string | null
    nextLessonId?: string | null
    nextLessonHookArabic?: string
  }
}
