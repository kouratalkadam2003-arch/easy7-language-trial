import { motion } from 'motion/react'
import type { Building } from '@/store/villageStore'
import { useVillageStore } from '@/store/villageStore'
import { useFarmStore } from '@/store/farmStore'

interface Props {
  building: Building
  cellSize: number
}

// In a real app we'd load the generated 3D image, but here we'll use a placeholder or the actual image URL
const MINE_IMG = "https://lh3.googleusercontent.com/aida/ADBb0uguJvmcxbatyD6YkM6OnHlfDIKtW_VHFSTOfIsT0rpeXKkOvSt3UKHQhQavr-sn1o32AlY2iWE5s8zC95z2bOQ9PG_bXU-vL3QJSQVhoM_8ko0HCQ7pcVOYg18zEGkVoBzLuGhPICzk5CCUXYbfwTRV6d2Jy47vegyxoz6aBJcMVvISqN9DREicuRzB2rNA2EjfEnE7iabnpm7cwGfAlD7EhMfK0mu9RUiJQlhXKmQl9KPwNt2-wa4lQ4M"

export function ResourceMine({ building, cellSize }: Props) {
  const collectResources = useVillageStore(s => s.collectResources)
  const { spendEnergy, addResources } = useFarmStore()

  const canCollect = building.lastCollected 
    ? Date.now() - building.lastCollected > 10000 
    : true
  const w = building.width * cellSize * 1.5
  const h = building.height * cellSize * 2.5

  const handleCollect = () => {
    if (!canCollect) return
    if (spendEnergy(10)) {
      collectResources(building.id)
      addResources(0, 0, 10) // Give 10 gems
    } else {
      alert("Not enough Energy! You need to study to earn energy.")
    }
  }

  return (
    <motion.div
      className="relative flex flex-col items-center justify-end cursor-pointer drop-shadow-xl"
      style={{ width: w, height: h }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCollect}
    >
      {canCollect && (
        <motion.div 
          initial={{ y: 0 }}
          animate={{ y: -10 }}
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          className="absolute top-0 bg-blue-500 text-white rounded-full p-1 border-2 border-white shadow-lg z-30 pointer-events-none"
        >
          💎
        </motion.div>
      )}
      <img src={MINE_IMG} alt="Mine" className="w-full h-full object-contain object-bottom pointer-events-none" />
    </motion.div>
  )
}
