import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, ShoppingBag, ShieldAlert } from 'lucide-react'
import { IsometricEngine } from '@/components/village/IsometricEngine'
import GoblinFightGame from '@/screens/ZombieFightGame'
import { useArmyStore } from '@/store/armyStore'
import { useUserStore } from '@/store/userStore'
import { useFarmStore } from '@/store/farmStore'

export default function VillagePage() {
  const navigate = useNavigate()
  const [showBattle, setShowBattle] = useState(false)
  const troops = useArmyStore(s => s.troops)
  const { uiLang } = useUserStore()
  const { resources } = useFarmStore()
  const isAr = uiLang === 'ar'

  return (
    <div className="min-h-dvh flex flex-col bg-slate-900">
      {/* Main Content Area: Isometric Engine */}
      <div className="flex-1 w-full relative overflow-hidden">
        {/* Full-bleed isometric map container */}
        <div className="absolute inset-0 w-full h-full">
          <IsometricEngine />
        </div>

        {/* --- GAME UI OVERLAY --- */}

        {/* Top Left: Profile & Level */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-slate-900/40 backdrop-blur-sm pr-4 rounded-full border border-white/20">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-2 border-yellow-400 font-black text-xl text-white shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            7
          </div>
          <div className="flex flex-col text-white">
            <span className="font-bold text-sm leading-tight text-yellow-400">{isAr ? 'ليث' : 'Laith'}</span>
            <div className="w-20 h-2 bg-slate-900/60 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-blue-400 w-1/2" />
            </div>
          </div>
        </div>

        {/* Top Right: Resources */}
        <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
          {/* Energy */}
          <div className="flex justify-end items-center">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/20 text-white font-bold px-3 py-1 pr-8 rounded-full relative shadow-lg">
              {resources.energy} / 100
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-2xl drop-shadow-md">
                ⚡
              </div>
            </div>
          </div>
          {/* Gems/Gold */}
          <div className="flex justify-end items-center mt-1">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/20 text-white font-bold px-3 py-1 pr-8 rounded-full relative shadow-lg">
              {resources.gem}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-2xl drop-shadow-md">
                💎
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Attack/Defend */}
        <div className="absolute bottom-6 left-6 z-40">
          <button 
            onClick={() => setShowBattle(true)}
            className="w-20 h-20 bg-gradient-to-b from-red-500 to-red-700 rounded-full border-4 border-yellow-400 shadow-[0_4px_20px_rgba(220,38,38,0.6)] flex flex-col items-center justify-center active:scale-95 transition-transform"
          >
            <ShieldAlert className="w-8 h-8 text-white mb-1" />
            <span className="text-[10px] font-black text-white uppercase">{isAr ? 'هجوم' : 'Attack'}</span>
          </button>
        </div>

        {/* Bottom Right: Shop */}
        <div className="absolute bottom-6 right-6 z-40">
          <button 
            className="w-16 h-16 bg-gradient-to-b from-slate-100 to-slate-300 rounded-2xl border-2 border-slate-400 shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center active:scale-95 transition-transform"
          >
            <ShoppingBag className="w-6 h-6 text-slate-700 mb-1" />
            <span className="text-[9px] font-black text-slate-800 uppercase">{isAr ? 'المتجر' : 'Shop'}</span>
          </button>
        </div>
        
        {/* The Battle Overlay */}
        {showBattle && (
          <div className="absolute inset-0 z-50 bg-slate-900">
            <GoblinFightGame 
              flashcards={troops} 
              onClose={() => setShowBattle(false)} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

