import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HtmlLangSync } from '@/components/HtmlLangSync'
import { TopStatusBar } from '@/components/layout/TopStatusBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SideNav } from '@/components/layout/SideNav'

// Pages
import WelcomePage from '@/pages/WelcomePage'
import OnboardingPage from '@/pages/OnboardingPage'
import LearnPage from '@/pages/LearnPage'
import LessonPage from '@/pages/LessonPage'
import ReviewPage from '@/pages/ReviewPage'
import FarmPage from '@/pages/FarmPage'
import VillagePage from '@/pages/VillagePage'
import ShopPage from '@/pages/ShopPage'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import StoryPage from '@/pages/StoryPage'
import StoryLessonRunner from '@/story/StoryLessonRunner'
import { NotificationPermissionBanner } from '@/components/notifications/NotificationPermissionBanner'
import { notificationService } from '@/services/notificationService'

import { AdminTools } from '@/components/AdminTools'

// Routes where we hide navigation
const IMMERSIVE_ROUTES = ['/', '/onboarding', '/lesson', '/farm', '/village', '/story']

function AppShell() {
  const location = useLocation()
  const isImmersive = IMMERSIVE_ROUTES.some(r =>
    r === '/' ? location.pathname === '/' : location.pathname.startsWith(r)
  )

  React.useEffect(() => {
    notificationService.startHeartbeat()
  }, [])

  return (
    <>
      <AdminTools />
      <HtmlLangSync />

      {isImmersive ? (
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/farm" element={<FarmPage />} />
          <Route path="/village" element={<VillagePage />} />
          <Route path="/story" element={<StoryLessonRunner />} />
          <Route path="/story-cinematic" element={<StoryPage />} />
        </Routes>
      ) : (
        <div className="flex min-h-screen bg-[var(--background)]">
          <SideNav />
          <main 
            className="flex-1 pb-24 md:pb-0"
            style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <TopStatusBar />
            <NotificationPermissionBanner />
            <Routes>
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/quests" element={<div className="p-6 text-center"><h1 className="text-2xl font-black">🎯 المهام اليومية</h1><p className="text-muted-foreground mt-2">قريباً...</p></div>} />
              <Route path="/leaderboard" element={<div className="p-6 text-center"><h1 className="text-2xl font-black">🏆 لوحة الصدارة</h1><p className="text-muted-foreground mt-2">قريباً...</p></div>} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<LearnPage />} />
            </Routes>
            <BottomNav />
          </main>
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
