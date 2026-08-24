import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  uiLang: 'ar' | 'en'
  theme: 'light' | 'dark'
  hearts: number
  gems: number
  streak: number
  gameMode: 'story' | 'normal'
  targetLanguage: string
  currentLevel: string
  isOnboarded: boolean
  completedLessons: string[]
  setUiLang: (lang: 'ar' | 'en') => void
  setTheme: (theme: 'light' | 'dark') => void
  addGems: (amount: number) => void
  removeHearts: (amount: number) => void
  setGameMode: (mode: 'story' | 'normal') => void
  setTargetLanguage: (lang: string) => void
  setCurrentLevel: (level: string) => void
  completeOnboarding: () => void
  completeLesson: (id: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      uiLang: 'ar',
      theme: 'light',
      hearts: 5,
      gems: 120,
      streak: 4,
      gameMode: 'story',
      targetLanguage: 'en',
      currentLevel: 'A1',
      isOnboarded: false,
      completedLessons: [],
      setUiLang: (lang) => set({ uiLang: lang }),
      setTheme: (theme) => set({ theme }),
      addGems: (amount) => set((state) => ({ gems: state.gems + amount })),
      removeHearts: (amount) => set((state) => ({ hearts: Math.max(0, state.hearts - amount) })),
      setGameMode: (mode) => set({ gameMode: mode }),
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      setCurrentLevel: (level) => set({ currentLevel: level }),
      completeOnboarding: () => set({ isOnboarded: true }),
      completeLesson: (id) => set((state) => ({ 
        completedLessons: state.completedLessons.includes(id) 
          ? state.completedLessons 
          : [...state.completedLessons, id] 
      })),
      logout: () => set({ isOnboarded: false }),
    }),
    {
      name: 'lingo-user-store',
    }
  )
)
