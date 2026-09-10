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
  userName: string
  userJob: string
  userGoal: string
  completedLessons: string[]
  setUiLang: (lang: 'ar' | 'en') => void
  setTheme: (theme: 'light' | 'dark') => void
  addGems: (amount: number) => void
  removeHearts: (amount: number) => void
  setGameMode: (mode: 'story' | 'normal') => void
  setTargetLanguage: (lang: string) => void
  setCurrentLevel: (level: string) => void
  setUserProfile: (profile: { userName?: string; userJob?: string; userGoal?: string }) => void
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
      userName: '',
      userJob: '',
      userGoal: '',
      completedLessons: [],
      setUiLang: (lang) => set({ uiLang: lang }),
      setTheme: (theme) => set({ theme }),
      addGems: (amount) => set((state) => ({ gems: state.gems + amount })),
      removeHearts: (amount) => set((state) => ({ hearts: Math.max(0, state.hearts - amount) })),
      setGameMode: (mode) => set({ gameMode: mode }),
      setTargetLanguage: (lang) => {
        const cleanLang = (lang || 'en').toLowerCase();
        if (typeof window !== 'undefined') {
          localStorage.setItem('target_lang', cleanLang);
          localStorage.setItem('easy7_target_language', cleanLang);
          try {
            window.dispatchEvent(new CustomEvent('easy7:language_changed', { detail: cleanLang }));
          } catch (_) {}
        }
        set({ targetLanguage: cleanLang });
      },
      setCurrentLevel: (level) => set({ currentLevel: level }),
      setUserProfile: (profile) => set((state) => ({
        userName: profile.userName !== undefined ? profile.userName : state.userName,
        userJob: profile.userJob !== undefined ? profile.userJob : state.userJob,
        userGoal: profile.userGoal !== undefined ? profile.userGoal : state.userGoal,
      })),
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
