import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useFarmStore } from './farmStore'
import { globalSpacedRepetition } from '@/kingdom/engine/spacedRepetition'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewCard {
  id: string
  native: string
  translation: string
  pronunciation?: string
  tier: 'core' | 'medium' | 'secondary'
  addedAt: number
  nextReviewAt: number
  intervalMinutes: number // How long to wait until the next review
  language?: string // 'en', 'de', 'fr', 'es', 'it', 'ja', 'zh'
  // SM-2 Spaced Repetition parameters
  easeFactor?: number // Default 2.5 (range: 1.3 to 3.0)
  repetitionCount?: number // Number of successful consecutive reviews
  streak?: number // Current consecutive successful review streak
  lapsesCount?: number // Times forgotten
  lastReviewedAt?: number
}

export function formatIntervalMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`
  if (minutes < 1440) {
    const hours = Math.round(minutes / 60)
    return hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : `${hours} ساعات`
  }
  const days = Math.round(minutes / 1440)
  if (days === 1) return 'يوم'
  if (days === 2) return 'يومين'
  if (days in [3, 4, 5, 6, 7, 8, 9, 10]) return `${days} أيام`
  if (days < 30) return `${days} يوماً`
  const months = Math.round(days / 30)
  return months === 1 ? 'شهر' : `${months} أشهر`
}

export function calculateNextReview(card: ReviewCard, rating: ReviewRating): {
  newIntervalMinutes: number
  newEaseFactor: number
  newRepetitionCount: number
  newStreak: number
  newLapsesCount: number
} {
  const currentEase = card.easeFactor ?? 2.5
  const currentReps = card.repetitionCount ?? 0
  const currentStreak = card.streak ?? 0
  const currentInterval = card.intervalMinutes || 1440

  let newIntervalMinutes = 1440
  let newEaseFactor = currentEase
  let newRepetitionCount = currentReps
  let newStreak = currentStreak
  let newLapsesCount = card.lapsesCount ?? 0

  switch (rating) {
    case 'again':
      newIntervalMinutes = 10 // Review again in 10 minutes
      newEaseFactor = Math.max(1.3, currentEase - 0.20)
      newRepetitionCount = 0
      newStreak = 0
      newLapsesCount += 1
      break

    case 'hard':
      newStreak = currentStreak + 1
      newRepetitionCount = currentReps + 1
      newEaseFactor = Math.max(1.3, currentEase - 0.15)
      newIntervalMinutes = currentReps === 0 ? 720 : Math.max(720, Math.round(currentInterval * 1.2)) // 12h or 1.2x
      break

    case 'good':
      newStreak = currentStreak + 1
      newRepetitionCount = currentReps + 1
      if (newRepetitionCount === 1) {
        newIntervalMinutes = 1440 // 1 day
      } else if (newRepetitionCount === 2) {
        newIntervalMinutes = 4320 // 3 days
      } else {
        newIntervalMinutes = Math.round(currentInterval * newEaseFactor)
      }
      break

    case 'easy':
      newStreak = currentStreak + 1
      newRepetitionCount = currentReps + 1
      newEaseFactor = Math.min(3.0, currentEase + 0.15)
      if (newRepetitionCount === 1) {
        newIntervalMinutes = 4320 // 3 days
      } else if (newRepetitionCount === 2) {
        newIntervalMinutes = 10080 // 7 days
      } else {
        newIntervalMinutes = Math.round(currentInterval * newEaseFactor * 1.3)
      }
      break
  }

  return {
    newIntervalMinutes,
    newEaseFactor,
    newRepetitionCount,
    newStreak,
    newLapsesCount,
  }
}

export function isErroneousEnglishCard(nativeText: string): boolean {
  if (!nativeText) return false;
  const t = nativeText.trim().toLowerCase();

  // If text contains German umlauts or ß, it is definitely German, not English
  if (/[äöüß]/.test(t)) return false;

  // English phrases that should never be labeled as German
  const englishPhrases = [
    'hello',
    'my name is',
    'nice to meet you',
    'is this our',
    'this is our',
    'new room',
    'our room',
    'i am new here',
    'welcome to',
    'thank you',
    'see you tomorrow',
    'my friend',
    'good morning',
    'good afternoon',
    'good evening',
    'good night',
    'how are you',
    'what is your',
    'where are you',
    'i live in',
    'see you later',
    'see you soon',
    'excuse me',
    'you are welcome',
    'pleased to meet you',
    'have a nice day',
    'welcome to the',
  ];

  if (englishPhrases.some((phrase) => t.includes(phrase))) {
    return true;
  }

  // Tokenize into clean lowercase words
  const words = t.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'؛،؟]/g, ' ').split(/\s+/).filter(Boolean);

  const englishTokens = new Set([
    'the', 'this', 'that', 'these', 'those', 'is', 'are', 'am', 'was', 'were',
    'you', 'your', 'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her',
    'my', 'me', 'mine', 'hello', 'room', 'company', 'friend', 'friends',
    'morning', 'evening', 'afternoon', 'night', 'tomorrow', 'today', 'yesterday',
    'welcome', 'meet', 'nice', 'good', 'thank', 'thanks', 'please', 'help',
    'what', 'where', 'when', 'why', 'who', 'how', 'here', 'there'
  ]);

  const germanTokens = new Set([
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'und', 'oder', 'aber',
    'nicht', 'kein', 'keine', 'keinen', 'ein', 'eine', 'einen', 'einem',
    'der', 'die', 'das', 'dem', 'den', 'des', 'ist', 'sind', 'war', 'waren',
    'haben', 'hat', 'hatte', 'hallo', 'danke', 'bitte', 'tschüss', 'guten',
    'morgen', 'abend', 'wie', 'geht', 'zimmer', 'freund', 'freundin'
  ]);

  let englishCount = 0;
  let germanCount = 0;

  for (const w of words) {
    if (englishTokens.has(w)) englishCount++;
    if (germanTokens.has(w)) germanCount++;
  }

  if (englishCount >= 2 && englishCount > germanCount) {
    return true;
  }

  return false;
}

export function previewIntervalText(card: ReviewCard, rating: ReviewRating): string {
  const result = calculateNextReview(card, rating)
  return formatIntervalMinutes(result.newIntervalMinutes)
}

interface ReviewState {
  cards: ReviewCard[]
  addCards: (newCards: ReviewCard[]) => void
  purgeErroneousCards: () => void
  updateCardReview: (id: string, newIntervalMinutes: number) => void
  recordCardReview: (id: string, rating: ReviewRating) => { gold: number; wood: number; gem: number }
  removeCard: (id: string) => void
  getVitalityScore: () => number // 0.35 to 1.0 based on overdue ratio
  getCardsForLanguage: (lang?: string) => ReviewCard[]
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: [],

      purgeErroneousCards: () => set((state) => {
        const cleaned = state.cards.filter((c) => {
          const cardLang = (c.language || '').toLowerCase();
          // Eradicate any card marked as German that is actually an English sentence!
          if ((cardLang === 'de' || !cardLang) && isErroneousEnglishCard(c.native)) {
            return false;
          }
          return true;
        });
        return { cards: cleaned };
      }),

      addCards: (newCards) => set((state) => {
        let currentLang = '';
        if (typeof window !== 'undefined') {
          currentLang = (localStorage.getItem('target_lang') || localStorage.getItem('easy7_target_language') || '').toLowerCase();
          if (!currentLang) {
            try {
              const rawUser = localStorage.getItem('lingo-user-store');
              if (rawUser) {
                const parsed = JSON.parse(rawUser);
                currentLang = (parsed?.state?.targetLanguage || '').toLowerCase();
              }
            } catch (_) {}
          }
        }
        currentLang = currentLang || 'de';

        const existingMap = new Map(state.cards.map(c => [`${(c.language || currentLang).toLowerCase()}_${c.native.trim().toLowerCase()}`, c]));
        const updatedList = [...state.cards];

        for (const card of newCards) {
          const cardLang = (card.language || currentLang).toLowerCase();
          // Never accept English phrases into the German deck!
          if (cardLang === 'de' && isErroneousEnglishCard(card.native)) {
            continue;
          }

          const key = `${cardLang}_${card.native.trim().toLowerCase()}`;
          if (!existingMap.has(key)) {
            updatedList.push({
              ...card,
              language: cardLang,
              easeFactor: card.easeFactor ?? 2.5,
              repetitionCount: card.repetitionCount ?? 0,
              streak: card.streak ?? 0,
              lapsesCount: card.lapsesCount ?? 0,
            });
            existingMap.set(key, card);
          }
        }

        return { cards: updatedList };
      }),

      getCardsForLanguage: (lang) => {
        let target = (lang || '').toLowerCase();
        if (!target && typeof window !== 'undefined') {
          target = (localStorage.getItem('target_lang') || localStorage.getItem('easy7_target_language') || '').toLowerCase();
          if (!target) {
            try {
              const rawUser = localStorage.getItem('lingo-user-store');
              if (rawUser) {
                const parsed = JSON.parse(rawUser);
                target = (parsed?.state?.targetLanguage || '').toLowerCase();
              }
            } catch (_) {}
          }
        }
        target = target || 'de';
        return get().cards.filter((c) => c.language && c.language.toLowerCase() === target);
      },

      updateCardReview: (id, newIntervalMinutes) => set((state) => ({
        cards: state.cards.map(c => 
          c.id === id 
            ? { 
                ...c, 
                intervalMinutes: newIntervalMinutes, 
                nextReviewAt: Date.now() + newIntervalMinutes * 60 * 1000,
                lastReviewedAt: Date.now(),
              } 
            : c
        )
      })),

      recordCardReview: (id, rating) => {
        const card = get().cards.find(c => c.id === id)
        if (!card) return { gold: 0, wood: 0, gem: 0 }

        const {
          newIntervalMinutes,
          newEaseFactor,
          newRepetitionCount,
          newStreak,
          newLapsesCount,
        } = calculateNextReview(card, rating)

        const now = Date.now()
        set((state) => ({
          cards: state.cards.map(c => 
            c.id === id 
              ? {
                  ...c,
                  intervalMinutes: newIntervalMinutes,
                  nextReviewAt: now + newIntervalMinutes * 60 * 1000,
                  easeFactor: newEaseFactor,
                  repetitionCount: newRepetitionCount,
                  streak: newStreak,
                  lapsesCount: newLapsesCount,
                  lastReviewedAt: now,
                }
              : c
          )
        }))

        // Calculate Kingdom Rewards
        const reward = {
          gold: rating === 'easy' ? 35 : rating === 'good' ? 20 : rating === 'hard' ? 10 : 5,
          wood: rating === 'easy' ? 25 : rating === 'good' ? 15 : rating === 'hard' ? 5 : 0,
          gem: rating === 'easy' ? 1 : 0,
        }

        // Deliver reward to farm / kingdom store
        useFarmStore.getState().addResources(reward.gold, reward.wood, reward.gem)

        // Directly modify Kingdom Architect engine and memory state
        try {
          const ratingNum: 1 | 2 | 3 | 4 = rating === 'again' ? 1 : rating === 'hard' ? 2 : rating === 'good' ? 3 : 4
          // Ensure item is registered in spaced repetition
          if (!globalSpacedRepetition.getItemById(card.id)) {
            globalSpacedRepetition.addIndividualItem({
              id: card.id,
              subject: 'Easy7',
              sourceLevelId: 'Easy7 Curriculum',
              sourceUnitId: card.tier || 'Vocabulary',
              sourceLessonId: 'Lesson',
              primaryText: card.native,
              secondaryText: card.translation,
              contextOrNotes: card.pronunciation,
              categoryTag: 'Vocabulary',
            })
          }
          globalSpacedRepetition.recordReview(card.id, ratingNum)
        } catch (_) {}

        // Modify Kingdom Architect save file in localStorage so village immediately reflects rewards
        try {
          const saveRaw = localStorage.getItem('realm_of_defense_save')
          if (saveRaw) {
            const saveState = JSON.parse(saveRaw)
            if (saveState && saveState.resources) {
              saveState.resources.coins = (saveState.resources.coins || 0) + reward.gold
              saveState.resources.wood = (saveState.resources.wood || 0) + reward.wood
              saveState.resources.gems = (saveState.resources.gems || 0) + reward.gem
              localStorage.setItem('realm_of_defense_save', JSON.stringify(saveState))
            }
          }
        } catch (_) {}

        return reward
      },

      removeCard: (id) => set((state) => ({
        cards: state.cards.filter(c => c.id !== id)
      })),

      getVitalityScore: () => {
        const allCards = get().cards
        if (allCards.length === 0) return 1.0
        const now = Date.now()
        const overdue = allCards.filter(c => now - c.nextReviewAt > 24 * 60 * 60 * 1000).length
        const ratio = overdue / allCards.length
        return Math.max(0.35, Number((1.0 - ratio * 0.65).toFixed(2)))
      }
    }),
    {
      name: 'lingo-review-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.purgeErroneousCards();
        }
      },
    }
  )
)
