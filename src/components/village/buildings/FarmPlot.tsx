import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import type { Building } from '@/store/villageStore'
import { useVillageStore } from '@/store/villageStore'
import { useArmyStore } from '@/store/armyStore'

interface Props {
  building: Building
  cellSize: number
}

// Simple isometric dirt patch using CSS polygons
const DIRT_PATCH = (
  <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-md">
    <polygon points="50,0 100,25 50,50 0,25" fill="#5c4033" stroke="#3e2723" strokeWidth="2" />
    <path d="M 20 25 L 80 25 M 30 30 L 70 30 M 40 35 L 60 35" stroke="#3e2723" strokeWidth="1" opacity="0.5" />
  </svg>
)

export function FarmPlot({ building, cellSize }: Props) {
  const { plantCrop, harvestCrop } = useVillageStore()
  const troops = useArmyStore(s => s.troops)
  
  const [now, setNow] = useState(Date.now())
  
  // Timer to check crop readiness
  useEffect(() => {
    if (!building.readyAt) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [building.readyAt])

  const w = building.width * cellSize * 1.5
  const h = building.height * cellSize * 1.5

  const isEmpty = !building.plantedWordId
  const isReady = !isEmpty && building.readyAt && now >= building.readyAt
  const progress = !isEmpty && building.plantedAt && building.readyAt 
    ? Math.min(100, ((now - building.plantedAt) / (building.readyAt - building.plantedAt)) * 100)
    : 0

  const handleClick = () => {
    if (isEmpty) {
      // Pick a random word from the army store to plant (for demo)
      if (troops.length === 0) {
        alert("You need to learn some words first!")
        return
      }
      const randomWord = troops[Math.floor(Math.random() * troops.length)]
      // Plant for 10 seconds for demo purposes
      plantCrop(building.id, randomWord.id, 10000)
    } else if (isReady) {
      // Harvest the crop (In a real app, this would open a flashcard quiz modal)
      // If they get it right -> harvestCrop() + add gold
      alert(`Harvesting word! (Pretend you just passed an SRS review)`)
      harvestCrop(building.id)
      // Here we would also add gold to the farmStore
    }
  }

  return (
    <motion.div
      className="relative flex flex-col items-center justify-end cursor-pointer"
      style={{ width: w, height: h }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
    >
      <div className="absolute inset-0 flex items-end justify-center pb-4">
        {DIRT_PATCH}
      </div>

      {/* Floating State Indicators */}
      <div className="absolute top-0 flex flex-col items-center z-30 pointer-events-none">
        {isEmpty && (
          <div className="bg-white/90 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow border border-slate-200">
            🌱 Plant
          </div>
        )}
        
        {!isEmpty && !isReady && (
          <div className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full shadow border border-amber-300">
            Growing {Math.floor(progress)}%
          </div>
        )}

        {isReady && (
          <motion.div 
            initial={{ y: 0 }}
            animate={{ y: -5 }}
            transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
            className="bg-green-500 text-white text-[12px] font-bold px-2 py-1 rounded-full shadow-lg border border-white"
          >
            🌾 Harvest!
          </motion.div>
        )}
      </div>

      {/* The Crop Visual */}
      {!isEmpty && (
        <div 
          className="absolute bottom-6 text-4xl pointer-events-none transition-all duration-1000"
          style={{ 
            opacity: isReady ? 1 : 0.6,
            transform: `scale(${isReady ? 1 : 0.5 + (progress / 100) * 0.5})`
          }}
        >
          {isReady ? '🌻' : '🌱'}
        </div>
      )}
    </motion.div>
  )
}
