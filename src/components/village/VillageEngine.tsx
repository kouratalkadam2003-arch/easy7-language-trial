import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useVillageStore } from '@/store/villageStore'
import { TownHall } from './buildings/TownHall'
import { ArmyCamp } from './buildings/ArmyCamp'
import { ResourceMine } from './buildings/ResourceMine'
import { DraggableBuildingWrapper } from './DraggableBuildingWrapper'

export function VillageEngine() {
  const { buildings, gridSize } = useVillageStore()
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Size of each grid cell in pixels
  const CELL_SIZE = 40
  const mapWidth = gridSize * CELL_SIZE
  const mapHeight = gridSize * CELL_SIZE

  return (
    <div 
      className="w-full h-full overflow-hidden relative bg-[#7ea73d]" 
      ref={constraintsRef}
      style={{ touchAction: 'none' }}
    >
      {/* 
        The draggable map canvas. 
        We use Framer Motion's drag constraints to bound it to the screen. 
      */}
      <motion.div
        drag={!isEditing} // Only pan the map if we are not dragging buildings
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="absolute origin-center"
        style={{
          width: mapWidth,
          height: mapHeight,
          // Start slightly centered
          left: `calc(50% - ${mapWidth/2}px)`,
          top: `calc(50% - ${mapHeight/2}px)`,
        }}
      >
        {/* Grid Background */}
        <div 
          className={`absolute inset-0 pointer-events-none transition-opacity ${isEditing ? 'opacity-40' : 'opacity-10'}`}
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
          }}
        />

        {/* Render Buildings */}
        {buildings.map(building => {
          let BuildingComponent
          switch (building.type) {
            case 'townhall':
              BuildingComponent = <TownHall building={building} cellSize={CELL_SIZE} />
              break
            case 'armycamp':
              BuildingComponent = <ArmyCamp building={building} cellSize={CELL_SIZE} />
              break
            case 'mine':
              BuildingComponent = <ResourceMine building={building} cellSize={CELL_SIZE} />
              break
            default:
              return null
          }

          return (
            <DraggableBuildingWrapper 
              key={building.id} 
              building={building} 
              cellSize={CELL_SIZE} 
              isEditing={isEditing}
            >
              {BuildingComponent}
            </DraggableBuildingWrapper>
          )
        })}
      </motion.div>

      {/* Edit Mode Toggle UI */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-full font-bold shadow-lg transition-all ${
            isEditing 
            ? 'bg-amber-500 text-white border-2 border-amber-300 animate-pulse' 
            : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          {isEditing ? '✅ Save Layout' : '✏️ Edit Layout'}
        </button>
      </div>
    </div>
  )
}
