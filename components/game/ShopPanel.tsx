'use client';

import { useState } from 'react';
import { useGameStore } from '../../game/store';
import { BUILDING_DEFS } from '../../game/constants';
import { BuildingType } from '../../game/types';

type ShopCategory = 'all' | 'resources' | 'military' | 'defense' | 'decoration';

const categories: { key: ShopCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'الكل', icon: '📋' },
  { key: 'resources', label: 'الموارد', icon: '💰' },
  { key: 'military', label: 'عسكري', icon: '⚔️' },
  { key: 'defense', label: 'دفاع', icon: '🛡️' },
  { key: 'decoration', label: 'أخرى', icon: '🌿' },
];

function getCategory(type: string): ShopCategory {
  if (['gold_mine', 'elixir_collector', 'gold_storage', 'elixir_storage'].includes(type)) return 'resources';
  if (['barracks', 'army_camp'].includes(type)) return 'military';
  if (['cannon', 'archer_tower', 'wizard_tower', 'wall'].includes(type)) return 'defense';
  return 'decoration';
}

export default function ShopPanel() {
  const gold = useGameStore((s) => s.gold);
  const elixir = useGameStore((s) => s.elixir);
  const setSelectedBuildingType = useGameStore((s) => s.setSelectedBuildingType);
  const currentView = useGameStore((s) => s.currentView);
  const setView = useGameStore((s) => s.setView);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all');

  if (currentView !== 'shop') return null;

  const buildingEntries = Object.values(BUILDING_DEFS).filter((d) => d.type !== 'town_hall');
  const filtered = activeCategory === 'all' ? buildingEntries : buildingEntries.filter((d) => getCategory(d.type) === activeCategory);

  const handleSelect = (type: BuildingType) => {
    setSelectedBuildingType(type);
    setView('village');
  };

  return (
    <div className="shop-panel">
      <h2 className="shop-title">🛒 المتجر</h2>

      <div className="shop-categories">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {filtered.map((def) => {
          const canAfford = def.costType === 'gold' ? gold >= def.cost : elixir >= def.cost;
          return (
            <button
              key={def.type}
              className={`shop-item ${canAfford ? '' : 'locked'}`}
              onClick={() => canAfford && handleSelect(def.type as BuildingType)}
            >
              <div className="shop-item-icon" style={{ backgroundColor: `${def.color}33`, borderColor: `${def.color}88` }}>
                <span className="text-2xl">{def.icon}</span>
              </div>
              <div className="shop-item-info">
                <span className="shop-item-name">{def.nameAr}</span>
                <span className="shop-item-desc">{def.description}</span>
              </div>
              <div className="shop-item-cost">
                <span>{def.costType === 'gold' ? '🪙' : '💧'}</span>
                <span>{def.cost.toLocaleString()}</span>
              </div>
              <div className="shop-item-meta">
                <span className="text-xs text-white/40">الحجم: {def.size}x{def.size}</span>
                {def.productionRate && (
                  <span className="text-xs text-yellow-400/60">
                    +{def.productionRate}/د {def.productionType === 'gold' ? '🪙' : '💧'}
                  </span>
                )}
                {def.attackDamage && (
                  <span className="text-xs text-red-400/60">💥 {def.attackDamage} ضرر</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}