'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../game/store';
import { BUILDING_DEFS, GRID_ROWS, GRID_COLS, CELL_SIZE, getBuildingCost, getProductionRate } from '../../game/constants';
import { BuildingType, Position } from '../../game/types';
import BuildingInfoPanel from './BuildingInfoPanel';
import RepairQuizModal from './RepairQuizModal';

export default function VillageGrid() {
  const buildings = useGameStore((s) => s.buildings);
  const selectedBuildingType = useGameStore((s) => s.selectedBuildingType);
  const selectedBuildingId = useGameStore((s) => s.selectedBuildingId);
  const placeBuilding = useGameStore((s) => s.placeBuilding);
  const setSelectedBuildingType = useGameStore((s) => s.setSelectedBuildingType);
  const setSelectedBuildingId = useGameStore((s) => s.setSelectedBuildingId);
  const collectResources = useGameStore((s) => s.collectResources);
  const updateResources = useGameStore((s) => s.updateResources);

  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [canPlace, setCanPlace] = useState(false);
  const [repairBuildingId, setRepairBuildingId] = useState<string | null>(null);

  // Resource tick
  useEffect(() => {
    const interval = setInterval(() => {
      updateResources();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateResources]);

  const checkPlacement = useCallback(
    (pos: Position): boolean => {
      if (!selectedBuildingType) return false;
      const def = BUILDING_DEFS[selectedBuildingType];
      if (!def) return false;
      const size = def.size;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cr = pos.row + r;
          const cc = pos.col + c;
          if (cr < 0 || cr >= GRID_ROWS || cc < 0 || cc >= GRID_COLS) return false;
          const occupied = buildings.some((b) => {
            const bs = BUILDING_DEFS[b.type].size;
            return cr >= b.position.row && cr < b.position.row + bs && cc >= b.position.col && cc < b.position.col + bs;
          });
          if (occupied) return false;
        }
      }
      return true;
    },
    [selectedBuildingType, buildings]
  );

  useEffect(() => {
    if (hoveredCell && selectedBuildingType) {
      setCanPlace(checkPlacement(hoveredCell));
    }
  }, [hoveredCell, selectedBuildingType, checkPlacement]);

  const handleCellClick = (row: number, col: number) => {
    if (selectedBuildingType) {
      const pos = { row, col };
      if (checkPlacement(pos)) {
        placeBuilding(selectedBuildingType, pos);
      }
      return;
    }

    const clicked = buildings.find((b) => {
      const s = BUILDING_DEFS[b.type].size;
      return row >= b.position.row && row < b.position.row + s && col >= b.position.col && col < b.position.col + s;
    });

    if (clicked) {
      // Check if it's a producer - collect on click
      const def = BUILDING_DEFS[clicked.type];
      if (def.productionRate && clicked.storedAmount > 5) {
        collectResources(clicked.id);
      }
      setSelectedBuildingId(clicked.id);
    } else {
      setSelectedBuildingId(null);
    }
  };

  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedBuildingType || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + gridRef.current.scrollLeft;
    const y = e.clientY - rect.top + gridRef.current.scrollTop;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      setHoveredCell({ row, col });
    }
  };

  const selectedBuilding = selectedBuildingId ? buildings.find((b) => b.id === selectedBuildingId) : null;

  return (
    <div className="village-container">
      <div className="village-grid-wrapper">
        {selectedBuildingType && (
          <div className="placement-hint">
            <span>اضغط على الشبكة لوضع {BUILDING_DEFS[selectedBuildingType].nameAr}</span>
            <button onClick={() => setSelectedBuildingType(null)} className="cancel-btn">
              ✕ إلغاء
            </button>
          </div>
        )}
        <div
          ref={gridRef}
          className="village-grid"
          onMouseMove={handleGridMouseMove}
          onMouseLeave={() => setHoveredCell(null)}
        >
          {/* Grid lines */}
          <svg className="grid-lines" width={GRID_COLS * CELL_SIZE} height={GRID_ROWS * CELL_SIZE}>
            {Array.from({ length: GRID_ROWS + 1 }).map((_, r) => (
              <line key={`h${r}`} x1={0} y1={r * CELL_SIZE} x2={GRID_COLS * CELL_SIZE} y2={r * CELL_SIZE} stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
            ))}
            {Array.from({ length: GRID_COLS + 1 }).map((_, c) => (
              <line key={`v${c}`} x1={c * CELL_SIZE} y1={0} x2={c * CELL_SIZE} y2={GRID_ROWS * CELL_SIZE} stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
            ))}
          </svg>

          {/* Hover preview */}
          {hoveredCell && selectedBuildingType && (
            <div
              className={`placement-preview ${canPlace ? 'valid' : 'invalid'}`}
              style={{
                left: hoveredCell.col * CELL_SIZE,
                top: hoveredCell.row * CELL_SIZE,
                width: BUILDING_DEFS[selectedBuildingType].size * CELL_SIZE,
                height: BUILDING_DEFS[selectedBuildingType].size * CELL_SIZE,
              }}
            >
              <span className="preview-icon">{BUILDING_DEFS[selectedBuildingType].icon}</span>
            </div>
          )}

          {/* Buildings */}
          {buildings.map((b) => {
            const def = BUILDING_DEFS[b.type];
            if (!def) return null;
            return (
              <div
                key={b.id}
                className={`building-cell ${b.isBuilding ? 'building' : ''} ${selectedBuildingId === b.id ? 'selected' : ''}`}
                style={{
                  left: b.position.col * CELL_SIZE,
                  top: b.position.row * CELL_SIZE,
                  width: def.size * CELL_SIZE,
                  height: def.size * CELL_SIZE,
                  backgroundColor: b.isBuilding ? 'rgba(0,0,0,0.5)' : 'rgba(92, 58, 33, 0.6)',
                  borderColor: selectedBuildingId === b.id ? '#f1c40f' : 'rgba(92, 58, 33, 0.8)',
                  backdropFilter: 'blur(2px)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCellClick(b.position.row, b.position.col);
                }}
              >
                <span className="building-icon">{def.icon}</span>
                <span className="building-level">Lv.{b.level}</span>
                
                {/* Visual Drought & Decay Indicators */}
                {b.waterLevel !== undefined && b.waterLevel < 60 && (
                  <div className="absolute top-0.5 right-0.5 bg-blue-900/90 text-cyan-200 rounded-lg px-1 py-0.5 text-[8px] font-mono font-bold flex items-center gap-0.5 border border-blue-500 shadow-sm leading-none select-none">
                    🌵 {Math.floor(b.waterLevel)}%
                  </div>
                )}
                {b.decayLevel !== undefined && b.decayLevel > 40 && (
                  <div className="absolute top-0.5 left-0.5 bg-amber-900/95 text-amber-200 rounded-lg px-1 py-0.5 text-[8px] font-mono font-bold flex items-center gap-0.5 border border-amber-600 shadow-sm leading-none select-none animate-pulse">
                    🏚️ {Math.floor(b.decayLevel)}%
                  </div>
                )}

                {def.productionRate && b.storedAmount > 5 && (
                  <div className="resource-bubble">
                    {def.productionType === 'gold' ? '🪙' : '💧'}{Math.floor(b.storedAmount)}
                  </div>
                )}
                {b.isBuilding && b.buildEndTime && (
                  <div className="build-progress">
                    <div
                      className="build-progress-bar"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((b.buildEndTime - Date.now()) / (b.buildEndTime - (b.buildStartTime || Date.now()))) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Click target layer */}
          <div className="grid-click-layer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor(x / CELL_SIZE);
            const row = Math.floor(y / CELL_SIZE);
            if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
              handleCellClick(row, col);
            }
          }} />
        </div>
      </div>

      {/* Building Info Panel */}
      {selectedBuilding && (
        <BuildingInfoPanel 
          building={selectedBuilding} 
          onRepairQuizTrigger={(id) => setRepairBuildingId(id)}
        />
      )}

      {/* Repair Quiz Modal */}
      {repairBuildingId && (
        <RepairQuizModal 
          buildingId={repairBuildingId}
          onClose={() => {
            setRepairBuildingId(null);
            setSelectedBuildingId(null);
          }}
        />
      )}
    </div>
  );
}