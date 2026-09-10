import React, { useState } from 'react';
import { BUILDING_BLUEPRINTS } from '../engine/blueprints';
import { GameEngine } from '../engine/gameEngine';
import { BuildingType, ResourceType } from '../types/game';

interface BuildMenuModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const BuildMenuModal: React.FC<BuildMenuModalProps> = ({ engine, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'village' | 'production' | 'defense'>('all');
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType>('house');

  const selectedPlot = engine.world.buildingPlots.find((p) => p.id === engine.selectedPlotId);
  const existingBuilding = selectedPlot?.building;

  const blueprints = Object.values(BUILDING_BLUEPRINTS).filter((bp) => {
    if (selectedCategory === 'all') return true;
    return bp.category === selectedCategory;
  });

  const activeBp = BUILDING_BLUEPRINTS[selectedBuildingType];
  const canAfford = activeBp ? engine.canAfford(activeBp.cost) : false;

  // Handle construction on selected plot or first available plot
  const handleBuild = () => {
    let targetPlotId = engine.selectedPlotId;

    if (!targetPlotId || existingBuilding) {
      // Find first empty plot matching category
      const emptyPlot = engine.world.buildingPlots.find(
        (p) => !p.building && (!p.allowedCategories || p.allowedCategories.includes(activeBp.category))
      );
      if (emptyPlot) {
        targetPlotId = emptyPlot.id;
      }
    }

    if (targetPlotId) {
      const success = engine.constructBuilding(targetPlotId, selectedBuildingType);
      if (success) {
        onClose();
      }
    }
  };

  const handleUpgradeExisting = () => {
    if (existingBuilding) {
      const success = engine.upgradeBuilding(existingBuilding);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div id="build-modal-overlay" className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔨</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Kingdom Architecture &amp; Defenses</h2>
              <p className="text-xs text-slate-400">
                {existingBuilding ? `Selected Plot: ${existingBuilding.type.toUpperCase()}` : 'Select a structure to erect in the realm'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Existing Building Management (If user clicked a built plot) */}
        {existingBuilding && (
          <div className="px-6 py-4 bg-blue-950/40 border-b border-blue-800/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{BUILDING_BLUEPRINTS[existingBuilding.type]?.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">{BUILDING_BLUEPRINTS[existingBuilding.type]?.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                    Level {existingBuilding.level}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Health: {Math.round(existingBuilding.health)} / {existingBuilding.maxHealth}
                </p>
              </div>
            </div>

            <button
              onClick={handleUpgradeExisting}
              disabled={existingBuilding.level >= (BUILDING_BLUEPRINTS[existingBuilding.type]?.maxLevel || 1)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:bg-slate-700 disabled:text-slate-500 transition-transform shadow-lg shadow-amber-500/20"
            >
              Upgrade Structure (Lvl {existingBuilding.level + 1})
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-slate-800 overflow-x-auto">
          {(['all', 'village', 'production', 'defense'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedCategory === cat ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto">
          {/* Blueprint List */}
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {blueprints.map((bp) => {
              const isSelected = selectedBuildingType === bp.type;
              const affordable = engine.canAfford(bp.cost);

              return (
                <div
                  key={bp.type}
                  onClick={() => setSelectedBuildingType(bp.type)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/80 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bp.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{bp.name}</h4>
                      <span className="text-[11px] text-slate-400 capitalize">{bp.category}</span>
                    </div>
                  </div>

                  {/* Cost Badges */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {Object.entries(bp.cost).map(([res, amt]) => (
                      <span
                        key={res}
                        className={`px-1.5 py-0.5 rounded-md font-semibold text-[11px] ${
                          engine.resources[res as ResourceType] >= (amt || 0)
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-red-950/80 text-red-400 border border-red-800'
                        }`}
                      >
                        {res === 'wood' ? '🪵' : res === 'stone' ? '🪨' : res === 'food' ? '🌾' : res === 'coins' ? '🪙' : '💎'} {amt}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blueprint Details & Build Confirmation */}
          {activeBp && (
            <div className="flex flex-col justify-between bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-slate-900 rounded-xl border border-slate-700">{activeBp.icon}</span>
                  <div>
                    <h3 className="font-bold text-white text-base">{activeBp.name}</h3>
                    <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">{activeBp.category}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{activeBp.description}</p>

                {/* Specific Stats */}
                <div className="flex flex-col gap-1.5 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Health:</span>
                    <span className="text-slate-200 font-bold">{activeBp.baseHealth} HP</span>
                  </div>
                  {activeBp.storageBonus && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage Capacity:</span>
                      <span className="text-emerald-400 font-bold">+{activeBp.storageBonus}</span>
                    </div>
                  )}
                  {activeBp.populationBonus && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Population:</span>
                      <span className="text-blue-400 font-bold">+{activeBp.populationBonus} Villagers</span>
                    </div>
                  )}
                  {activeBp.defenseStats && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Attack Damage:</span>
                        <span className="text-rose-400 font-bold">{activeBp.defenseStats.damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Range:</span>
                        <span className="text-slate-200 font-bold">{activeBp.defenseStats.range}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Attack Speed:</span>
                        <span className="text-slate-200 font-bold">{activeBp.defenseStats.attackSpeed} /sec</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-confirm-build"
                onClick={handleBuild}
                disabled={!canAfford}
                className={`mt-4 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xl transition-all ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Construct Structure' : 'Insufficient Resources'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
