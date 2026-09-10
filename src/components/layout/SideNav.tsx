import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { BookOpen, Home, Sparkles, User, Settings, Trophy, Globe, LogOut, Castle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/userStore"
import { useDueReviewCount } from "@/hooks/useDueReviewCount"
import { LanguageSelectModal, TARGET_LANGUAGES } from "./LanguageSelectModal"

export function SideNav() {
  const navigate = useNavigate()
  const { uiLang, targetLanguage, logout } = useUserStore()
  const [isLangModalOpen, setIsLangModalOpen] = useState(false)
  const dueCount = useDueReviewCount()

  const isAr = uiLang === 'ar'
  const currentTarget = TARGET_LANGUAGES.find(l => l.code === targetLanguage) || TARGET_LANGUAGES[0]

  const links = [
    { to: "/learn", icon: BookOpen, label: isAr ? "تعلم" : "Learn" },
    { to: "/", icon: Home, label: isAr ? "الرئيسية" : "Home" },
    { to: "/review", icon: Sparkles, label: isAr ? "مراجعة" : "Review" },
    { to: "/village", icon: Castle, label: isAr ? "المملكة" : "Kingdom" },
    { to: "/leaderboard", icon: Trophy, label: isAr ? "صدارة" : "Leaderboard" },
    { to: "/profile", icon: User, label: isAr ? "ملفي" : "Profile" },
  ]

  const handleLogout = () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من تسجيل الخروج والعودة للبداية؟' : 'Are you sure you want to log out and return to start?')) {
      logout()
      navigate('/')
    }
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-e border-white/40 bg-white/80 backdrop-blur-xl p-4 shadow-2xl text-slate-800">
        <div className="flex items-center justify-center py-5 mb-2">
          <h1 className="text-2xl font-black text-blue-600 tracking-tighter drop-shadow-sm flex items-center gap-2">
            <span>🦊</span>
            <span>Easy7</span>
          </h1>
        </div>

        {/* Learning Language Quick Card */}
        <button
          onClick={() => setIsLangModalOpen(true)}
          className="flex items-center justify-between p-3 mb-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 hover:bg-blue-100/80 transition-all cursor-pointer shadow-xs text-start"
          title={isAr ? 'تغيير لغة التعلم' : 'Change Learning Language'}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentTarget.flag}</span>
            <div>
              <div className="text-xs font-black text-blue-900">
                {isAr ? currentTarget.name : currentTarget.nameEn}
              </div>
              <div className="text-[10px] text-blue-600 font-bold">
                {isAr ? 'انقر للتغيير' : 'Click to change'}
              </div>
            </div>
          </div>
          <Globe className="w-4 h-4 text-blue-500" />
        </button>

        <nav className="flex-1 flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-base",
                    isActive
                      ? "bg-white text-blue-600 shadow-md border border-white/50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-white/50"
                  )
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{link.label}</span>
                {(link.to === '/review' || link.to === '/village') && dueCount > 0 && (
                  <span className="ms-auto bg-rose-600 text-white text-[11px] font-black rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-md animate-pulse">
                    {dueCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto pt-3 border-t border-slate-200 flex flex-col gap-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-base",
                isActive
                  ? "bg-white text-blue-600 shadow-md border border-white/50"
                  : "text-slate-600 hover:text-blue-600 hover:bg-white/50"
              )
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-base text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      <LanguageSelectModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  )
}
