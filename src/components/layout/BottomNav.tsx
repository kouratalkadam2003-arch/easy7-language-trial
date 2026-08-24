import { NavLink } from "react-router-dom"
import { Home, Shield, Droplets, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const links = [
    { to: "/learn", icon: Home, label: "تعلم" },
    { to: "/village", icon: Shield, label: "القرية" },
    { to: "/farm", icon: Droplets, label: "المزرعة" },
    { to: "/leaderboard", icon: Trophy, label: "صدارة" },
    { to: "/profile", icon: User, label: "حسابي" },
  ]

  return (
    <div
      className="fixed bottom-0 start-0 end-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="flex items-center justify-around h-14 sm:h-16 max-w-md mx-auto px-1 sm:px-2">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full gap-0.5 sm:gap-1 transition-all text-[9px] sm:text-[10px]",
                  isActive
                    ? "text-[#1CB0F6] scale-110 font-bold"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-xl"
                )
              }
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="leading-none truncate max-w-[60px]">{link.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
