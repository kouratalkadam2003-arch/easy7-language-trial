import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SeedState = 'seed' | 'sprout' | 'tree'

export interface SeedData {
  id: string
  word: string
  translation: string
  state: SeedState
  nextReviewDate: number
}

export interface BuildingData {
  id: string
  level: number
  nameAr: string
  nameEn: string
}

interface FarmState {
  resources: {
    gold: number
    wood: number
    gem: number
    energy: number
  }
  buildings: Record<string, BuildingData>
  seeds: Record<string, SeedData>
  
  // Actions
  addResources: (gold: number, wood: number, gem: number) => void
  spendResources: (gold: number, wood: number, gem: number) => boolean
  addEnergy: (amount: number) => void
  spendEnergy: (amount: number) => boolean
  upgradeBuilding: (buildingId: string, nameAr: string, nameEn: string) => boolean
  plantSeed: (vocab: { id: string, word: string, translation: string }) => void
  waterSeed: (seedId: string) => void
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      resources: {
        gold: 0,
        wood: 0,
        gem: 0,
        energy: 100, // Start with some energy
      },
      buildings: {
        hut: { id: 'hut', level: 1, nameAr: 'الكوخ', nameEn: 'Hut' },
        fence: { id: 'fence', level: 0, nameAr: 'السور', nameEn: 'Fence' },
        farm: { id: 'farm', level: 0, nameAr: 'حقل الزراعة', nameEn: 'Farm Field' },
        market: { id: 'market', level: 0, nameAr: 'السوق', nameEn: 'Market' },
      },
      seeds: {},

      addResources: (gold, wood, gem) => set((state) => ({
        resources: {
          ...state.resources,
          gold: state.resources.gold + gold,
          wood: state.resources.wood + wood,
          gem: state.resources.gem + gem,
        }
      })),

      spendResources: (gold, wood, gem) => {
        const state = get()
        if (state.resources.gold >= gold && state.resources.wood >= wood && state.resources.gem >= gem) {
          set((s) => ({
            resources: {
              ...s.resources,
              gold: s.resources.gold - gold,
              wood: s.resources.wood - wood,
              gem: s.resources.gem - gem,
            }
          }))
          return true
        }
        return false
      },

      addEnergy: (amount) => set((state) => ({
        resources: {
          ...state.resources,
          energy: Math.min(100, state.resources.energy + amount) // Cap at 100
        }
      })),

      spendEnergy: (amount) => {
        const state = get()
        if (state.resources.energy >= amount) {
          set((s) => ({
            resources: {
              ...s.resources,
              energy: s.resources.energy - amount
            }
          }))
          return true
        }
        return false
      },

      upgradeBuilding: (id, nameAr, nameEn) => {
        const state = get()
        const building = state.buildings[id] || { id, level: 0, nameAr, nameEn }
        
        // Simple cost formula based on next level
        const costGold = (building.level + 1) * 50
        const costWood = (building.level + 1) * 20

        if (state.spendResources(costGold, costWood, 0)) {
          set((s) => ({
            buildings: {
              ...s.buildings,
              [id]: { ...building, level: building.level + 1 }
            }
          }))
          return true
        }
        return false
      },

      plantSeed: (vocab) => set((state) => {
        // If already planted, ignore
        if (state.seeds[vocab.id]) return state

        return {
          seeds: {
            ...state.seeds,
            [vocab.id]: {
              id: vocab.id,
              word: vocab.word,
              translation: vocab.translation,
              state: 'seed',
              nextReviewDate: Date.now() + 86400000 // tomorrow
            }
          }
        }
      }),

      waterSeed: (seedId) => set((state) => {
        const seed = state.seeds[seedId]
        if (!seed) return state

        let nextState = seed.state
        if (seed.state === 'seed') nextState = 'sprout'
        else if (seed.state === 'sprout') nextState = 'tree'

        return {
          seeds: {
            ...state.seeds,
            [seedId]: {
              ...seed,
              state: nextState,
              nextReviewDate: Date.now() + 86400000 * 2 // +2 days
            }
          }
        }
      }),
    }),
    {
      name: 'easy7-farm-storage',
    }
  )
)
