import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { useUserStore } from '@/store/userStore'
import { Sun, Moon, Globe, LogOut, Check, Sparkles, Award } from 'lucide-react'
import { TARGET_LANGUAGES } from '@/components/layout/LanguageSelectModal'
import { ALL_CEFR_LEVELS } from '@/utils/cefrGuidelines'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { uiLang, setUiLang, targetLanguage, setTargetLanguage, currentLevel, setCurrentLevel, theme, setTheme, logout } = useUserStore()
  const isAr = uiLang === 'ar'

  const handleLogout = () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من تسجيل الخروج والعودة لشاشة البداية؟' : 'Are you sure you want to log out?')) {
      logout()
      navigate('/')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-black">{isAr ? '⚙️ الإعدادات' : '⚙️ Settings'}</h1>

      {/* Target Learning Language Selection */}
      <SurfaceCard className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base">{isAr ? 'لغة التعلم المستهدفة' : 'Target Learning Language'}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? 'اختر اللغة التي تود دراستها الآن' : 'Choose the language you are currently learning'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {TARGET_LANGUAGES.map((lang) => {
            const isSelected = targetLanguage === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => setTargetLanguage(lang.code)}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer text-start ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm ring-2 ring-blue-500/20 font-black'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{lang.flag}</span>
                  <div>
                    <div className="text-xs">{isAr ? lang.name : lang.nameEn}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{lang.nativeName}</div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 stroke-[3]" />
                )}
              </button>
            )
          })}
        </div>
      </SurfaceCard>

      {/* CEFR Level Selection (A0 to C2) */}
      <SurfaceCard className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base">{isAr ? 'مستوى صعوبة الذكاء الاصطناعي (CEFR)' : 'AI Proficiency Level (CEFR)'}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? 'يحدد مستوى كلام ومفردات سارة وخالد وليث' : 'Sets Sarah, Khalid, and Laith conversation difficulty'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1">
          {ALL_CEFR_LEVELS.map((lvl) => {
            const isSelected = (currentLevel || 'A1').toUpperCase() === lvl.code
            return (
              <button
                key={lvl.code}
                onClick={() => setCurrentLevel(lvl.code)}
                className={`flex items-start justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer text-start ${
                  isSelected
                    ? 'bg-amber-50/90 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-500/20 font-black'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-1 rounded-xl bg-slate-100 text-slate-800 font-black text-xs shadow-xs border border-slate-200 shrink-0">
                    {lvl.badge}
                  </span>
                  <div>
                    <div className="font-black text-xs sm:text-sm text-slate-900">
                      {isAr ? lvl.nameAr : lvl.nameEn}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                      {isAr ? lvl.descriptionAr : lvl.descriptionEn}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-amber-600 stroke-[3] shrink-0 mt-1" />
                )}
              </button>
            )
          })}
        </div>
      </SurfaceCard>

      {/* General Settings Card */}
      <SurfaceCard className="space-y-4">
        {/* Theme */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="font-bold">{isAr ? 'المظهر' : 'Theme'}</span>
          </div>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-muted hover:bg-muted/80 transition-colors"
          >
            {theme === 'light' ? (isAr ? '🌙 داكن' : '🌙 Dark') : (isAr ? '☀️ فاتح' : '☀️ Light')}
          </button>
        </div>

        {/* UI Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" />
            <span className="font-bold">{isAr ? 'لغة واجهة التطبيق' : 'UI Language'}</span>
          </div>
          <button
            onClick={() => setUiLang(uiLang === 'ar' ? 'en' : 'ar')}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-muted hover:bg-muted/80 transition-colors"
          >
            {uiLang === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </SurfaceCard>

      {/* Logout Card */}
      <SurfaceCard className="space-y-3 border-red-100 bg-red-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-700">
            <LogOut className="w-5 h-5" />
            <div>
              <div className="font-black text-sm">{isAr ? 'تسجيل الخروج' : 'Log Out'}</div>
              <div className="text-xs text-red-500/80">{isAr ? 'الخروج والعودة لشاشة البداية' : 'Log out and return to welcome page'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all shadow-md shadow-red-600/20 cursor-pointer"
          >
            {isAr ? 'تسجيل الخروج' : 'Log Out'}
          </button>
        </div>
      </SurfaceCard>
    </div>
  )
}
