import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Flashcard } from '../types/remix_types'

interface ArmyState {
  troops: Flashcard[]
  addTroops: (newTroops: Flashcard[]) => void
  clearTroops: () => void
}

export const useArmyStore = create<ArmyState>()(
  persist(
    (set) => ({
      // Provide some initial dummy troops to show off the camp immediately
      troops: [
        { id: '1', prompt: 'el perro', correctAnswer: 'the dog', options: ['the dog', 'the cat', 'the bird', 'the fish'] },
        { id: '2', prompt: 'la casa', correctAnswer: 'the house', options: ['the house', 'the building', 'the room', 'the door'] },
        { id: '3', prompt: 'el gato', correctAnswer: 'the cat', options: ['the dog', 'the cat', 'the bird', 'the fish'] },
      ] as Flashcard[],
      addTroops: (newTroops) => set((state) => {
        // Merge without duplicates (using prompt as unique key for simplicity)
        const existingPrompts = new Set(state.troops.map(t => t.prompt))
        const uniqueNew = newTroops.filter(t => !existingPrompts.has(t.prompt))
        return { troops: [...state.troops, ...uniqueNew] }
      }),
      clearTroops: () => set({ troops: [] })
    }),
    {
      name: 'laith-army-storage',
    }
  )
)
