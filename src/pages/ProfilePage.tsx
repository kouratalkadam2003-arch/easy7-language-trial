import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { useUserStore } from '@/store/userStore'
import { Flame, Diamond, Heart, Trophy, Globe, LogOut, Award } from 'lucide-react'
import { LanguageSelectModal, TARGET_LANGUAGES } from '@/components/layout/LanguageSelectModal'
import { ALL_CEFR_LEVELS } from '@/utils/cefrGuidelines'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { uiLang, targetLanguage, currentLevel, hearts, gems, streak, logout } = useUserStore()
  const [isLangModalOpen, setIsLangModalOpen] = useState(false)
  const isAr = uiLang === 'ar'

  const currentTarget = TARGET_LANGUAGES.find(l => l.code === targetLanguage) || TARGET_LANGUAGES[0]
  const currentLvlInfo = ALL_CEFR_LEVELS.find(l => l.code === (currentLevel || 'A1').toUpperCase()) || ALL_CEFR_LEVELS[1]

  const stats = [
    { icon: Flame, value: streak, label: isAr ? 'أيام متتالية' : 'Day Streak', color: '#FF9600' },
    { icon: Diamond, value: gems, label: isAr ? 'جواهر' : 'Gems', color: '#2CC0D0' },
    { icon: Heart, value: hearts, label: isAr ? 'قلوب' : 'Hearts', color: '#FF4B4B' },
    { icon: Trophy, value: 0, label: isAr ? 'دروس مكتملة' : 'Lessons Done', color: '#FFC800' },
  ]

  const handleLogout = () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to log out?')) {
      logout()
      navigate('/')
    }
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Avatar & Target Language */}
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-5xl mb-3 shadow-md border-2 border-white">
            👤
          </div>
          <h1 className="text-2xl font-black text-slate-900">{isAr ? 'المتعلم الشجاع' : 'Brave Learner'}</h1>
          <p className="text-sm text-slate-500 font-bold">{isAr ? `مستوى ${currentLvlInfo.code} — ${currentLvlInfo.nameAr}` : `Level ${currentLvlInfo.code} — ${currentLvlInfo.nameEn}`}</p>

          {/* Active Target Language & Level Badge */}
          <div className="inline-flex items-center gap-2 mt-3 p-1.5 px-4 rounded-full bg-blue-50 border border-blue-200 shadow-xs">
            <span className="text-xl">{currentTarget.flag}</span>
            <span className="text-xs font-black text-blue-900">{isAr ? `${currentTarget.name} (${currentLvlInfo.code})` : `${currentTarget.nameEn} (${currentLvlInfo.code})`}</span>
            <button
              onClick={() => setIsLangModalOpen(true)}
              className="text-xs text-blue-600 underline font-black hover:text-blue-800 cursor-pointer ml-1"
            >
              {isAr ? 'تغيير اللغة أو المستوى' : 'Change Language / Level'}
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <SurfaceCard key={i} className="text-center">
              <s.icon className="w-6 h-6 mx-auto mb-1" style={{ color: s.color }} />
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground font-bold">{s.label}</div>
            </SurfaceCard>
          ))}
        </div>

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200 font-black hover:bg-red-100 active:scale-98 transition-all cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>{isAr ? 'تسجيل الخروج والعودة للبداية' : 'Log Out & Return to Welcome'}</span>
        </button>
      </div>

      <LanguageSelectModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  )
}
