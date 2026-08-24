'use client';

import { useGameStore } from '../../game/store';
import { TROOP_DEFS } from '../../game/constants';
import { TroopType } from '../../game/types';

export default function TroopPanel() {
  const troops = useGameStore((s) => s.troops);
  const elixir = useGameStore((s) => s.elixir);
  const maxTroopCapacity = useGameStore((s) => s.maxTroopCapacity);
  const trainTroop = useGameStore((s) => s.trainTroop);
  const currentView = useGameStore((s) => s.currentView);

  if (currentView !== 'troops') return null;

  const totalTroops = Object.values(troops).reduce((a, b) => a + b, 0);
  const totalHousing = Object.entries(troops).reduce((a, [type, count]) => {
    return a + count * TROOP_DEFS[type].housingSpace;
  }, 0);

  return (
    <div className="troop-panel">
      <h2 className="shop-title">🗡️ الجيش</h2>

      <div className="troop-capacity-bar">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white/60 text-xs">السعة: {totalHousing}/{maxTroopCapacity}</span>
          <span className="text-white/60 text-xs">الجنود: {totalTroops}</span>
        </div>
        <div className="capacity-bar-bg">
          <div
            className="capacity-bar-fill"
            style={{ width: `${(totalHousing / maxTroopCapacity) * 100}%` }}
          />
        </div>
      </div>

      <div className="troops-grid">
        {Object.values(TROOP_DEFS).map((def) => {
          const count = troops[def.type as TroopType];
          const canAfford = elixir >= def.cost;
          const canTrain = totalHousing + def.housingSpace <= maxTroopCapacity;

          return (
            <div
              key={def.type}
              className={`troop-card ${!canAfford || !canTrain ? 'locked' : ''}`}
            >
              <div className="troop-card-icon" style={{ backgroundColor: `${def.color}22`, borderColor: `${def.color}66` }}>
                <span className="text-3xl">{def.icon}</span>
                {count > 0 && <span className="troop-count-badge">{count}</span>}
              </div>
              <div className="troop-card-info">
                <h4 className="text-white font-bold text-sm">{def.nameAr}</h4>
                <div className="troop-stats">
                  <span className="text-red-300 text-xs">💥 {def.damage}</span>
                  <span className="text-green-300 text-xs">❤️ {def.hitpoints}</span>
                  <span className="text-blue-300 text-xs">⚡ {def.speed}</span>
                  <span className="text-purple-300 text-xs">🎯 {def.range}</span>
                </div>
                <div className="troop-meta">
                  <span className="text-xs text-white/40">المساحة: {def.housingSpace}</span>
                  <span className="text-xs text-white/40">المدة: {def.trainingTime}ث</span>
                </div>
              </div>
              <button
                className={`train-btn ${canAfford && canTrain ? '' : 'disabled'}`}
                onClick={() => trainTroop(def.type as TroopType)}
                disabled={!canAfford || !canTrain}
              >
                <span className="text-sm font-bold">تدريب</span>
                <span className="text-xs">💧{def.cost}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}