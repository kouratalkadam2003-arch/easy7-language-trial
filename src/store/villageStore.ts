import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BuildingType = 'townhall' | 'mine' | 'armycamp' | 'wall' | 'farmplot'

export interface Building {
  id: string
  type: BuildingType
  x: number // Grid X coordinate
  y: number // Grid Y coordinate
  width: number // Size in grid cells
  height: number
  level: number
  lastCollected?: number // Timestamp for resource buildings
  plantedWordId?: string // ID of the flashcard planted
  plantedAt?: number
  readyAt?: number // Timestamp when the word is ready to harvest (SRS)
}

interface VillageState {
  gridSize: number // The size of the grid, e.g., 20x20
  buildings: Building[]
  addBuilding: (building: Omit<Building, 'id'>) => void
  moveBuilding: (id: string, newX: number, newY: number) => void
  upgradeBuilding: (id: string) => void
  collectResources: (id: string) => void
  plantCrop: (id: string, wordId: string, durationMs: number) => void
  harvestCrop: (id: string) => void
}

export const useVillageStore = create<VillageState>()(
  persist(
    (set) => ({
      gridSize: 20,
      buildings: [
        { id: 'th1', type: 'townhall', x: 8, y: 8, width: 4, height: 4, level: 1 },
        { id: 'm1', type: 'mine', x: 4, y: 8, width: 3, height: 3, level: 1, lastCollected: Date.now() },
        { id: 'ac1', type: 'armycamp', x: 13, y: 8, width: 3, height: 3, level: 1 },
        { id: 'fp1', type: 'farmplot', x: 8, y: 13, width: 2, height: 2, level: 1 },
        { id: 'fp2', type: 'farmplot', x: 10, y: 13, width: 2, height: 2, level: 1 }
      ],
      addBuilding: (building) => set((state) => ({
        buildings: [...state.buildings, { ...building, id: Math.random().toString(36).substr(2, 9) }]
      })),
      moveBuilding: (id, newX, newY) => set((state) => ({
        buildings: state.buildings.map(b => b.id === id ? { ...b, x: newX, y: newY } : b)
      })),
      upgradeBuilding: (id) => set((state) => ({
        buildings: state.buildings.map(b => b.id === id ? { ...b, level: b.level + 1 } : b)
      })),
      collectResources: (id) => set((state) => ({
        buildings: state.buildings.map(b => b.id === id ? { ...b, lastCollected: Date.now() } : b)
      })),
      plantCrop: (id, wordId, durationMs) => set((state) => ({
        buildings: state.buildings.map(b => b.id === id ? { 
          ...b, 
          plantedWordId: wordId, 
          plantedAt: Date.now(), 
          readyAt: Date.now() + durationMs 
        } : b)
      })),
      harvestCrop: (id) => set((state) => ({
        buildings: state.buildings.map(b => b.id === id ? { 
          ...b, 
          plantedWordId: undefined, 
          plantedAt: undefined, 
          readyAt: undefined 
        } : b)
      }))
    }),
    {
      name: 'village-storage',
    }
  )
)
