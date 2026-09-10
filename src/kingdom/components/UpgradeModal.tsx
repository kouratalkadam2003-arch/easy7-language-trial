import React, { useState } from 'react';
import { GameEngine } from '../engine/gameEngine';
import { ResourceType } from '../types/game';

interface UpgradeModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ engine, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hero' | 'economy' | 'defense'>('all');

  const filteredUpgrades = engine.upgrades.filter((u) => {
    if (activeTab === 'all') return true;
    return u.category === activeTab;
  });

  return (
    <div id="upgrade-modal-overlay" className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Royal Forge &amp; Technology</h2>
              <p className="text-xs text-slate-400">Enhance your Hero, boost worker productivity, and reinforce defenses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-slate-800">
          {(['all', 'hero', 'economy', 'defense'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Upgrades List */}
        <div className="p-6 flex flex-col gap-3 overflow-y-auto max-h-[65vh]">
          {filteredUpgrades.map((upgrade) => {
            const isMaxed = upgrade.level >= upgrade.maxLevel;

            // Calculate current cost
            const cost: Partial<Record<ResourceType, number>> = {};
            for (const [res, base] of Object.entries(upgrade.baseCost)) {
              if (base !== undefined) {
                cost[res as ResourceType] = Math.round(Number(base) * Math.pow(upgrade.costMultiplier, upgrade.level - 1));
              }
            }

            const canAfford = !isMaxed && engine.canAfford(cost);

            return (
              <div
                key={upgrade.id}
                className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-center text-xl">
                    {upgrade.category === 'hero' ? '⚔️' : upgrade.category === 'economy' ? '🌾' : '🏹'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{upgrade.name}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-700 text-amber-300 font-bold text-xs">
                        Lvl {upgrade.level}/{upgrade.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{upgrade.description}</p>
                    <span className="text-xs font-semibold text-emerald-400 mt-1 block">
                      Bonus: {upgrade.statBonusText(upgrade.level)}
                    </span>
                  </div>
                </div>

                {/* Cost & Upgrade Button */}
                <div className="flex flex-col items-end gap-2">
                  {!isMaxed && (
                    <div className="flex items-center gap-1.5 text-xs">
                      {Object.entries(cost).map(([res, amt]) => (
                        <span
                          key={res}
                          className={`px-1.5 py-0.5 rounded-md font-semibold text-[11px] ${
                            engine.resources[res as ResourceType] >= (amt || 0)
                              ? 'bg-slate-700 text-slate-200'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {res === 'wood' ? '🪵' : res === 'stone' ? '🪨' : res === 'food' ? '🌾' : res === 'coins' ? '🪙' : '💎'} {amt}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => engine.purchaseUpgrade(upgrade.id)}
                    disabled={isMaxed || !canAfford}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                      isMaxed
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isMaxed ? 'MAX LEVEL' : canAfford ? 'Forge Upgrade' : 'Insufficient Resources'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
