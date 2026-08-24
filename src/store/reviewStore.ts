import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReviewCard {
  id: string
  native: string
  translation: string
  pronunciation?: string
  tier: 'core' | 'medium' | 'secondary'
  addedAt: number
  nextReviewAt: number
  intervalMinutes: number // How long to wait until the next review
}

interface ReviewState {
  cards: ReviewCard[]
  addCards: (newCards: ReviewCard[]) => void
  updateCardReview: (id: string, newIntervalMinutes: number) => void
  removeCard: (id: string) => void
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      cards: [],
      addCards: (newCards) => set((state) => {
        // Prevent duplicates based on the native text
        const existingTexts = new Set(state.cards.map(c => c.native.trim().toLowerCase()))
        const uniqueNew = newCards.filter(c => !existingTexts.has(c.native.trim().toLowerCase()))
        return { cards: [...state.cards, ...uniqueNew] }
      }),
      updateCardReview: (id, newIntervalMinutes) => set((state) => ({
        cards: state.cards.map(c => 
          c.id === id 
            ? { ...c, intervalMinutes: newIntervalMinutes, nextReviewAt: Date.now() + newIntervalMinutes * 60 * 1000 }
            : c
        )
      })),
      removeCard: (id) => set((state) => ({
        cards: state.cards.filter(c => c.id !== id)
      })),
    }),
    {
      name: 'lingo-review-store',
    }
  )
)
