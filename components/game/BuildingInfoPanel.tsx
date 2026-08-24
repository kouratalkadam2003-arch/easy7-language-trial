'use client';

import { useGameStore } from '../../game/store';
import { BUILDING_DEFS, getBuildingCost, getBuildingMaxHP, getBuildingMaxStorage, getProductionRate } from '../../game/constants';
import { Building } from '../../game/types';

interface Props {
  building: Building;
  onRepairQuizTrigger?: (id: string) => void;
}

export default function BuildingInfoPanel({ building, onRepairQuizTrigger }: Props) {
  const def = BUILDING_DEFS[building.type];
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding);
  const removeBuilding = useGameStore((s) => s.removeBuilding);
  const setSelectedBuildingId = useGameStore((s) => s.setSelectedBuildingId);
  const gold = useGameStore((s) => s.gold);
  const elixir = useGameStore((s) => s.elixir);
  const isCollector = building.type === 'gold_mine' || building.type === 'elixir_collector';

  if (!def) return null;

  const nextLevel = building.level + 1;
  const upgradeCost = nextLevel <= def.maxLevel ? getBuildingCost(building.type, nextLevel) : 0;
  const canAfford = def.costType === 'gold' ? gold >= upgradeCost : elixir >= upgradeCost;
  const isMaxLevel = building.level >= def.maxLevel;
  const nextHP = nextLevel <= def.maxLevel ? getBuildingMaxHP(building.type, nextLevel) : 0;
  const nextStorage = nextLevel <= def.maxLevel ? getBuildingMaxStorage(building.type, nextLevel) : 0;
  const currentRate = def.productionRate ? getProductionRate(building.type, building.level) : 0;
  const nextRate = def.productionRate && nextLevel <= def.maxLevel ? getProductionRate(building.type, nextLevel) : 0;

  return (
    <div className="building-info-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{def.icon}</span>
          <div>
            <h3 className="text-white font-bold text-sm">{def.nameAr}</h3>
            <p className="text-yellow-200/70 text-xs">{def.description}</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedBuildingId(null)}
          className="text-white/50 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>

      <div className="info-stats">
        <div className="stat-row">
          <span className="text-white/60 text-xs">المستوى</span>
          <span className="text-yellow-300 text-xs font-bold">Lv.{building.level}</span>
        </div>
        <div className="stat-row">
          <span className="text-white/60 text-xs">القوة</span>
          <span className="text-green-300 text-xs">{building.hitpoints}/{building.maxHitpoints}</span>
        </div>
        {def.attackDamage && (
          <div className="stat-row">
            <span className="text-white/60 text-xs">الضرر</span>
            <span className="text-red-300 text-xs">{Math.floor(def.attackDamage * (1 + (building.level - 1) * 0.15))}</span>
          </div>
        )}
        {def.attackRange && (
          <div className="stat-row">
            <span className="text-white/60 text-xs">المدى</span>
            <span className="text-blue-300 text-xs">{def.attackRange}</span>
          </div>
        )}
        {currentRate > 0 && (
          <div className="stat-row">
            <span className="text-white/60 text-xs">الإنتاج/دقيقة</span>
            <span className="text-yellow-300 text-xs">{Math.floor(currentRate)}</span>
          </div>
        )}
        {def.maxStorage > 0 && (
          <div className="stat-row">
            <span className="text-white/60 text-xs">التخزين</span>
            <span className="text-purple-300 text-xs">{getBuildingMaxStorage(building.type, building.level)}</span>
          </div>
        )}
        {building.isBuilding && building.buildEndTime && (
          <div className="stat-row">
            <span className="text-white/60 text-xs">وقت البناء</span>
            <span className="text-orange-300 text-xs animate-pulse">جاري البناء...</span>
          </div>
        )}
      </div>

      <div className="info-actions">
        {isCollector && (building.waterLevel ?? 100) < 100 && onRepairQuizTrigger && (
          <button
            className="action-btn flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold py-1 px-3 rounded-xl border-b-2 border-blue-900 active:border-b-0 text-xs gap-0.5"
            onClick={() => onRepairQuizTrigger(building.id)}
          >
            <span>💦 ريّ ومراجعة</span>
            <span className="text-[10px] text-blue-100 font-mono">الرطوبة: {Math.floor(building.waterLevel ?? 100)}%</span>
          </button>
        )}

        {!isCollector && building.type !== 'wall' && (building.decayLevel ?? 0) > 0 && onRepairQuizTrigger && (
          <button
            className="action-btn flex flex-col items-center justify-center bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold py-1 px-3 rounded-xl border-b-2 border-amber-900 active:border-b-0 text-xs gap-0.5"
            onClick={() => onRepairQuizTrigger(building.id)}
          >
            <span>🛠️ صيانة ومراجعة</span>
            <span className="text-[10px] text-amber-100 font-mono">التصدع: {Math.floor(building.decayLevel ?? 0)}%</span>
          </button>
        )}

        {!isMaxLevel && !building.isBuilding && (
          <button
            className={`action-btn upgrade-btn ${!canAfford ? 'disabled' : ''}`}
            onClick={() => upgradeBuilding(building.id)}
            disabled={!canAfford}
          >
            <span>⬆️ ترقية</span>
            <span className="text-xs">
              {def.costType === 'gold' ? '🪙' : '💧'}{upgradeCost.toLocaleString()}
            </span>
          </button>
        )}

        {isMaxLevel && (
          <div className="max-level-badge">🌟 أقصى مستوى</div>
        )}

        {building.type !== 'town_hall' && (
          <button
            className="action-btn delete-btn"
            onClick={() => {
              removeBuilding(building.id);
            }}
          >
            🗑️ حذف
          </button>
        )}
      </div>

      {/* Upgrade preview */}
      {!isMaxLevel && (
        <div className="upgrade-preview">
          <span className="text-white/50 text-xs">المستوى التالي ({nextLevel}):</span>
          <div className="flex gap-3 mt-1">
            <span className="text-green-400 text-xs">+{nextHP - building.maxHitpoints} قوة</span>
            {nextStorage > building.maxStorage && (
              <span className="text-purple-400 text-xs">+{nextStorage - getBuildingMaxStorage(building.type, building.level)} تخزين</span>
            )}
            {nextRate > currentRate && (
              <span className="text-yellow-400 text-xs">+{Math.floor(nextRate - currentRate)} إنتاج</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}