import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "@/store/userStore"
import { Chip } from "@/components/ui/Chip"
import { Heart, Flame, Diamond, Globe, Bot, LogOut } from "lucide-react"
import { useYuki } from "../../../components/YukiGlobal"
import { LanguageSelectModal, TARGET_LANGUAGES } from "./LanguageSelectModal"

export function TopStatusBar() {
  const navigate = useNavigate()
  const { uiLang, setUiLang, targetLanguage, currentLevel, hearts, gems, streak, logout } = useUserStore()
  const { setShowShop, isLive } = useYuki()
  const [isLangModalOpen, setIsLangModalOpen] = useState(false)

  const isAr = uiLang === 'ar'
  const currentTarget = TARGET_LANGUAGES.find(l => l.code === targetLanguage) || TARGET_LANGUAGES[0]

  const handleLogout = () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من تسجيل الخروج والعودة للبداية؟' : 'Are you sure you want to log out and return to start?')) {
      logout()
      navigate('/')
    }
  }

  return (
    <>
      <header className="sticky top-3 z-40 flex items-center justify-between p-2 sm:p-2.5 px-3 sm:px-4 bg-white/95 backdrop-blur-xl border border-slate-200/90 max-w-2xl mx-auto rounded-full shadow-md transition-all duration-300">
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Target Learning Language & Level Switcher Chip */}
          <button 
            onClick={() => setIsLangModalOpen(true)}
            className="hover:opacity-90 active:scale-95 transition-all touch-target cursor-pointer"
            title={isAr ? 'تغيير لغة ومستوى التعلم (A0-C2)' : 'Change Learning Language & Level (A0-C2)'}
          >
            <Chip className="bg-blue-50 border-blue-200 text-blue-800 font-extrabold shadow-xs hover:bg-blue-100/80 text-xs sm:text-sm" icon={<span className="text-base sm:text-lg">{currentTarget.flag}</span>}>
              <span>{isAr ? currentTarget.name : currentTarget.nameEn}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300/60 ml-1">{currentLevel || 'A1'}</span>
            </Chip>
          </button>

          {/* Yuki Sensei Quick Trigger */}
          <button
            onClick={() => setShowShop(true)}
            title="متجر شخصيات وأزياء يوكي سنسي"
            className="hidden sm:flex hover:opacity-90 active:scale-95 transition-all touch-target cursor-pointer"
          >
            <Chip className="bg-white border-slate-200 text-blue-700 font-bold shadow-xs hover:bg-blue-50 text-xs" icon={<Bot className={`w-3.5 h-3.5 ${isLive ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />}>
              {isAr ? 'يوكي 🤖' : 'Yuki 🤖'}
            </Chip>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Chip variant="streak" className="bg-white border-slate-200 text-slate-800 font-bold shadow-xs px-2 sm:px-3 text-xs sm:text-sm" icon={<Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-current" />}>
            {streak}
          </Chip>
          <Chip variant="gem" className="bg-white border-slate-200 text-slate-800 font-bold shadow-xs px-2 sm:px-3 text-xs sm:text-sm" icon={<Diamond className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 fill-current" />}>
            {gems}
          </Chip>
          <Chip variant="heart" className="bg-white border-slate-200 text-slate-800 font-bold shadow-xs px-2 sm:px-3 text-xs sm:text-sm" icon={<Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 fill-current" />}>
            {hearts}
          </Chip>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={isAr ? 'تسجيل الخروج والعودة للبداية' : 'Log out & return to start'}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 active:scale-95 text-slate-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </header>

      {/* Language Selection Modal */}
      <LanguageSelectModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  )
}
