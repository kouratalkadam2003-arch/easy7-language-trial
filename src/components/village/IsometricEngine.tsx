import React, { useRef, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useVillageStore } from '@/store/villageStore'
import { TownHall } from './buildings/TownHall'
import { ArmyCamp } from './buildings/ArmyCamp'
import { ResourceMine } from './buildings/ResourceMine'
import { FarmPlot } from './buildings/FarmPlot'

export const TILE_W = 80
export const TILE_H = 40

export function IsometricEngine() {
  const { buildings, gridSize } = useVillageStore()
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [zoom, setZoom] = useState(1)

  // Calculate total map dimensions in isometric space
  // The map is a diamond. Its width is grid * TILE_W. Its height is grid * TILE_H.
  const mapIsoWidth = gridSize * TILE_W
  const mapIsoHeight = gridSize * TILE_H

  // The origin (0,0) in grid coordinates corresponds to the top point of the diamond.
  // We offset it so the map is roughly centered in its container.
  const originX = mapIsoWidth / 2
  const originY = 50 

  // Create a grid array for rendering the floor tiles (Edit Mode or Base layer)
  const gridCells = useMemo(() => {
    const cells = []
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        cells.push({ x, y })
      }
    }
    return cells
  }, [gridSize])

  // Helper to project 2D grid to Isometric Screen Space
  const projectIso = (x: number, y: number) => {
    return {
      screenX: originX + (x - y) * (TILE_W / 2),
      screenY: originY + (x + y) * (TILE_H / 2)
    }
  }

  // Sort buildings by depth (gridX + gridY) so closer buildings render on top
  const sortedBuildings = [...buildings].sort((a, b) => {
    // For large buildings, we use their center or base for sorting.
    // For simplicity, x + y determines depth in isometric view.
    return (a.x + a.y) - (b.x + b.y)
  })

  return (
    <div 
      className="w-full h-full overflow-hidden relative bg-[#4a752c]" // Classic dark grass green
      ref={constraintsRef}
      style={{ touchAction: 'none' }}
    >
      {/* Zoom Controls Overlay */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        <button 
          onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
          className="w-10 h-10 bg-white/90 rounded-full shadow-lg font-black text-xl text-slate-700 active:scale-95 transition-transform border border-slate-300"
        >
          +
        </button>
        <button 
          onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
          className="w-10 h-10 bg-white/90 rounded-full shadow-lg font-black text-xl text-slate-700 active:scale-95 transition-transform border border-slate-300"
        >
          -
        </button>
      </div>

      {/* Edit Mode Toggle */}
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

      {/* The Draggable Game Camera */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={true}
        className="absolute origin-center"
        style={{
          width: mapIsoWidth,
          height: mapIsoHeight + 200, // Extra padding for tall buildings
          // Start slightly centered
          left: `calc(50% - ${mapIsoWidth/2}px)`,
          top: `calc(50% - ${mapIsoHeight/2}px)`,
          scale: zoom
        }}
      >
        {/* Isometric Floor Grid */}
        <div className="absolute inset-0 pointer-events-none">
          {gridCells.map(cell => {
            const { screenX, screenY } = projectIso(cell.x, cell.y)
            return (
              <div
                key={`${cell.x}-${cell.y}`}
                className="absolute border-t border-l border-white/10"
                style={{
                  left: screenX,
                  top: screenY,
                  width: TILE_W,
                  height: TILE_W,
                  // CSS trick to draw a diamond tile using transforms, but only for the floor layer!
                  transform: `translate(-50%, 0) rotateZ(45deg) scaleY(0.5)`,
                  transformOrigin: 'top left',
                  backgroundColor: isEditing ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                }}
              />
            )
          })}
        </div>

        {/* Isometric Buildings */}
        {sortedBuildings.map(building => {
          const { screenX, screenY } = projectIso(building.x, building.y)
          
          let BuildingComponent
          switch (building.type) {
            case 'townhall':
              BuildingComponent = <TownHall building={building} cellSize={TILE_W} />
              break
            case 'armycamp':
              BuildingComponent = <ArmyCamp building={building} cellSize={TILE_W} />
              break
            case 'mine':
              BuildingComponent = <ResourceMine building={building} cellSize={TILE_W} />
              break
            case 'farmplot':
              BuildingComponent = <FarmPlot building={building} cellSize={TILE_W} />
              break
            default:
              return null
          }

          return (
            <div
              key={building.id}
              className="absolute"
              style={{
                // Anchor the building base to the center of the grid tile
                left: screenX,
                top: screenY,
                // Shift so the bottom-center of the image is at the grid coordinate
                transform: 'translate(-50%, -100%)',
                // The actual component is drawn flat (2D) but placed on iso coordinates!
                // Z-index ensures correct depth sorting
                zIndex: building.x + building.y,
              }}
            >
              {BuildingComponent}
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
