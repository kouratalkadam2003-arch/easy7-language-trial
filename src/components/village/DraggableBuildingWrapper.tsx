import { useState, useEffect } from 'react'
import { motion, useMotionValue, useAnimation } from 'motion/react'
import { useVillageStore } from '@/store/villageStore'
import type { Building } from '@/store/villageStore'

interface Props {
  building: Building
  cellSize: number
  isEditing: boolean
  children: React.ReactNode
}

export function DraggableBuildingWrapper({ building, cellSize, isEditing, children }: Props) {
  const moveBuilding = useVillageStore(s => s.moveBuilding)
  const controls = useAnimation()
  
  // Controlled motion values for drag
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  return (
    <motion.div
      className="absolute"
      style={{
        left: building.x * cellSize,
        top: building.y * cellSize,
        width: building.width * cellSize,
        height: building.height * cellSize,
        x,
        y,
        zIndex: isEditing ? 50 : 10,
        // Optional: show border when editing
        border: isEditing ? '2px dashed rgba(255,255,255,0.8)' : 'none',
        backgroundColor: isEditing ? 'rgba(255,255,255,0.1)' : 'transparent',
      }}
      drag={isEditing}
      dragMomentum={false}
      onPointerDownCapture={(e) => {
        // Prevent map from panning when dragging a building
        if (isEditing) e.stopPropagation()
      }}
      onDragEnd={(e, info) => {
        if (!isEditing) return
        
        // Calculate grid snapped position
        const offsetX = info.offset.x
        const offsetY = info.offset.y
        
        const deltaCellsX = Math.round(offsetX / cellSize)
        const deltaCellsY = Math.round(offsetY / cellSize)
        
        const newX = building.x + deltaCellsX
        const newY = building.y + deltaCellsY

        // Reset the drag transform instantly
        x.set(0)
        y.set(0)

        // Update global store
        moveBuilding(building.id, newX, newY)
      }}
      animate={controls}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
    >
      {/* If we are editing, we add a little badge or overlay */}
      {isEditing && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-full shadow-lg pointer-events-none whitespace-nowrap z-50">
          Drag to Move
        </div>
      )}
      <div className={`w-full h-full ${isEditing ? 'opacity-80' : ''} pointer-events-none`}>
        {children}
      </div>
    </motion.div>
  )
}
