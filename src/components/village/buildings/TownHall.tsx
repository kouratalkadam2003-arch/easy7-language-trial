import { motion } from 'motion/react'
import type { Building } from '@/store/villageStore'

interface Props {
  building: Building
  cellSize: number
}

// In a real app we'd load the generated 3D image, but here we'll use a placeholder or the actual image URL
const TOWN_HALL_IMG = "https://lh3.googleusercontent.com/aida/ADBb0uguJvmcxbatyD6YkM6OnHlfDIKtW_VHFSTOfIsT0rpeXKkOvSt3UKHQhQavr-sn1o32AlY2iWE5s8zC95z2bOQ9PG_bXU-vL3QJSQVhoM_8ko0HCQ7pcVOYg18zEGkVoBzLuGhPICzk5CCUXYbfwTRV6d2Jy47vegyxoz6aBJcMVvISqN9DREicuRzB2rNA2EjfEnE7iabnpm7cwGfAlD7EhMfK0mu9RUiJQlhXKmQl9KPwNt2-wa4lQ4M"

export function TownHall({ building, cellSize }: Props) {
  const w = building.width * cellSize * 1.5
  const h = building.height * cellSize * 2.5

  return (
    <motion.div
      className="relative flex flex-col items-center justify-end cursor-pointer hover:brightness-110 transition-all drop-shadow-2xl"
      style={{ width: w, height: h }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute top-0 bg-black/60 text-white font-label-sm px-2 py-0.5 rounded-md backdrop-blur-sm shadow-md border border-white/10 z-30 pointer-events-none">
        Lv {building.level}
      </div>
      <img src={TOWN_HALL_IMG} alt="Town Hall" className="w-full h-full object-contain object-bottom pointer-events-none" />
    </motion.div>
  )
}
