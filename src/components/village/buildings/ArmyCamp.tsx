import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import type { Building } from '@/store/villageStore'
import { useArmyStore } from '@/store/armyStore'

interface Props {
  building: Building
  cellSize: number
}

// Using the generated 3D army camp image or a placeholder
const ARMY_CAMP_IMG = "https://lh3.googleusercontent.com/aida/ADBb0uiZyn2gbHK22RksplWhQawwM04yeJPZr4De0480d_wsl3V3Tj2ukEHJIX0D5pfnuMXfBVzUffn9Qz933-AKmNEHrtTyH59OSn0qN5KLBs4RTTmnQeeoWbWUsob9qPQQBRc4PakH0UDNMxm3MrLo2xMxm97jOD1Ie4WgiELzFuDhWHCI5o6jG_UvdD7q6yfNc46t9js1eWT9F79Hl3Y1t_dQTl3gTpZxGTejKmlj4D7BipKdnExl3E3cCfc"

export function ArmyCamp({ building, cellSize }: Props) {
  const troops = useArmyStore(s => s.troops)
  
  // Create an animated position state for each troop
  const [troopPositions, setTroopPositions] = useState(() => 
    troops.slice(0, 5).map(t => ({ // Cap visual troops to 5 so it's not overcrowded
      id: t.id, 
      word: t.prompt, 
      x: 20 + Math.random() * 60, 
      y: 30 + Math.random() * 50 
    }))
  )

  useEffect(() => {
    // Sync if troops change
    setTroopPositions(prev => {
      const currentIds = prev.map(p => p.id)
      const newTroops = troops.slice(0, 5).filter(t => !currentIds.includes(t.id))
      return [
        ...prev,
        ...newTroops.map(t => ({ id: t.id, word: t.prompt, x: 20 + Math.random() * 60, y: 30 + Math.random() * 50 }))
      ]
    })
  }, [troops])

  useEffect(() => {
    const interval = setInterval(() => {
      setTroopPositions(prev => prev.map(t => ({
        ...t,
        x: Math.max(10, Math.min(80, t.x + (Math.random() - 0.5) * 15)),
        y: Math.max(20, Math.min(80, t.y + (Math.random() - 0.5) * 15)),
      })))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const w = building.width * cellSize * 1.5
  const h = building.height * cellSize * 2.5

  return (
    <motion.div
      className="relative flex flex-col items-center justify-end cursor-pointer drop-shadow-xl"
      style={{ width: w, height: h }}
      whileTap={{ scale: 0.95 }}
    >
      <img src={ARMY_CAMP_IMG} alt="Army Camp" className="w-full h-full object-contain object-bottom opacity-90 pointer-events-none" />
      
      {/* Animated Troops overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {troopPositions.map(troop => (
          <motion.div
            key={troop.id}
            animate={{ left: `${troop.x}%`, top: `${troop.y}%` }}
            transition={{ type: "spring", stiffness: 30, damping: 10 }}
            className="absolute flex flex-col items-center"
          >
            {/* The text flag the soldier holds */}
            <div className="bg-white px-1.5 py-0.5 rounded shadow text-[10px] font-bold text-slate-800 -translate-y-4 whitespace-nowrap">
              {troop.word}
            </div>
            {/* The little soldier icon */}
            <div className="w-3 h-4 bg-slate-700 rounded-sm">
              <div className="w-3 h-3 bg-slate-300 rounded-full -translate-y-2 border border-slate-700" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
