'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../game/store';
import { BUILDING_DEFS, TROOP_DEFS, GRID_ROWS, GRID_COLS, CELL_SIZE, ATTACK_DURATION } from '../../game/constants';
import { TroopType, AttackTroop, EnemyBuilding } from '../../game/types';

export default function AttackView() {
  const attack = useGameStore((s) => s.attack);
  const troops = useGameStore((s) => s.troops);
  const deployTroop = useGameStore((s) => s.deployTroop);
  const endAttack = useGameStore((s) => s.endAttack);
  const currentView = useGameStore((s) => s.currentView);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const troopPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Initialize troop positions
  useEffect(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    attack.troops.forEach((t) => {
      posMap.set(t.id, { ...t.position });
    });
    troopPosRef.current = posMap;
  }, []);

  // Timer
  useEffect(() => {
    if (currentView !== 'attack') return;
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      if (state.attack.timeRemaining <= 0) {
        endAttack();
        return;
      }
      useGameStore.setState({
        attack: { ...state.attack, timeRemaining: state.attack.timeRemaining - 1 },
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, endAttack]);

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentView !== 'attack') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = useGameStore.getState();
    const now = Date.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    canvas.width = GRID_COLS * CELL_SIZE;
    canvas.height = GRID_ROWS * CELL_SIZE;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grass background with subtle pattern
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(canvas.width, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, canvas.height);
      ctx.stroke();
    }

    // Draw enemy buildings
    state.attack.enemyBuildings.forEach((b) => {
      if (b.currentHitpoints <= 0) return;
      const def = BUILDING_DEFS[b.type];
      if (!def) return;

      const x = b.position.col * CELL_SIZE;
      const y = b.position.row * CELL_SIZE;
      const w = def.size * CELL_SIZE;
      const h = def.size * CELL_SIZE;

      // Building base
      const hpRatio = b.currentHitpoints / b.maxHitpoints;
      ctx.fillStyle = `${def.color}${Math.floor(hpRatio * 60 + 20).toString(16).padStart(2, '0')}`;
      ctx.strokeStyle = `${def.color}88`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

      // Icon
      ctx.font = `${Math.min(w, h) * 0.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, x + w / 2, y + h / 2);

      // HP bar
      if (def.type !== 'wall') {
        const barW = w - 4;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x + 2, y - 6, barW, 4);
        ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(x + 2, y - 6, barW * hpRatio, 4);
      }
    });

    // Move and draw troops
    const updatedTroops = state.attack.troops.map((troop) => {
      if (troop.isDead) return troop;

      let pos = troopPosRef.current.get(troop.id) || { ...troop.position };
      const def = TROOP_DEFS[troop.type];

      // Find nearest alive enemy building
      let nearest: EnemyBuilding | null = null;
      let nearestDist = Infinity;
      state.attack.enemyBuildings.forEach((b) => {
        if (b.currentHitpoints <= 0) return;
        const bDef = BUILDING_DEFS[b.type];
        if (!bDef) return;
        const bx = (b.position.col + bDef.size / 2) * CELL_SIZE;
        const by = (b.position.row + bDef.size / 2) * CELL_SIZE;
        const dist = Math.sqrt((pos.x - bx) ** 2 + (pos.y - by) ** 2);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = b;
        }
      });

      if (!nearest) return troop;

      const targetDef = BUILDING_DEFS[nearest.type];
      if (!targetDef) return troop;
      const tx = (nearest.position.col + targetDef.size / 2) * CELL_SIZE;
      const ty = (nearest.position.row + targetDef.size / 2) * CELL_SIZE;

      const dist = Math.sqrt((pos.x - tx) ** 2 + (pos.y - ty) ** 2);
      const attackRange = def.range * CELL_SIZE;

      if (dist > attackRange) {
        // Move toward target
        const dx = tx - pos.x;
        const dy = ty - pos.y;
        const moveSpeed = def.speed * CELL_SIZE * 0.5 * dt;
        pos = {
          x: pos.x + (dx / dist) * Math.min(moveSpeed, dist),
          y: pos.y + (dy / dist) * Math.min(moveSpeed, dist),
        };
      }

      troopPosRef.current.set(troop.id, pos);

      // Draw troop
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, pos.x, pos.y);

      // Troop HP bar
      const hpRatio = troop.hitpoints / troop.maxHitpoints;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(pos.x - 10, pos.y - 16, 20, 3);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : '#ef4444';
      ctx.fillRect(pos.x - 10, pos.y - 16, 20 * hpRatio, 3);

      return troop;
    });

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'attack') {
      lastTimeRef.current = Date.now();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentView, gameLoop]);

  // Attack processing - damage buildings
  useEffect(() => {
    if (currentView !== 'attack') return;
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      let goldLooted = 0;
      let elixirLooted = 0;
      let destroyedBuildings = state.attack.destroyedBuildings;

      const updatedEnemyBuildings = state.attack.enemyBuildings.map((b) => {
        if (b.currentHitpoints <= 0) return b;

        let totalDamage = 0;
        state.attack.troops.forEach((troop) => {
          if (troop.isDead) return;
          const pos = troopPosRef.current.get(troop.id) || troop.position;
          const tDef = BUILDING_DEFS[b.type];
          if (!tDef) return;
          const bx = (b.position.col + tDef.size / 2) * CELL_SIZE;
          const by = (b.position.row + tDef.size / 2) * CELL_SIZE;
          const dist = Math.sqrt((pos.x - bx) ** 2 + (pos.y - by) ** 2);
          const attackRange = TROOP_DEFS[troop.type].range * CELL_SIZE;
          if (dist <= attackRange) {
            totalDamage += TROOP_DEFS[troop.type].damage * 0.3;
          }
        });

        const newHP = b.currentHitpoints - totalDamage;
        if (newHP <= 0 && b.currentHitpoints > 0) {
          destroyedBuildings++;
          const prodDef = BUILDING_DEFS[b.type];
          if (prodDef?.productionType === 'gold' || b.type === 'gold_storage') {
            goldLooted += Math.floor(Math.random() * 200 + 100);
          } else if (prodDef?.productionType === 'elixir' || b.type === 'elixir_storage') {
            elixirLooted += Math.floor(Math.random() * 200 + 100);
          } else {
            goldLooted += Math.floor(Math.random() * 100 + 50);
          }
        }

        return { ...b, currentHitpoints: Math.max(0, newHP) };
      });

      // Stars calculation
      const townHall = updatedEnemyBuildings.find((b) => b.type === 'town_hall');
      let stars = state.attack.stars;
      const destroyPercent = destroyedBuildings / state.attack.totalBuildings;
      if (destroyPercent >= 0.5) stars = Math.max(stars, 1);
      if (townHall && townHall.currentHitpoints <= 0) stars = Math.max(stars, 2);
      if (destroyPercent >= 1) stars = 3;

      useGameStore.setState({
        attack: {
          ...state.attack,
          enemyBuildings: updatedEnemyBuildings,
          destroyedBuildings,
          stars,
          goldLooted: state.attack.goldLooted + goldLooted,
          elixirLooted: state.attack.elixirLooted + elixirLooted,
        },
      });
    }, 500);
    return () => clearInterval(interval);
  }, [currentView]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Only allow deploying in bottom area
    if (y > GRID_ROWS * CELL_SIZE * 0.8) {
      const availableTypes = Object.entries(troops).filter(([, count]) => count > 0) as [TroopType, number][];
      if (availableTypes.length > 0) {
        const [type] = availableTypes[0];
        deployTroop(type, x, y);
      }
    }
  };

  if (currentView !== 'attack') return null;

  const totalTroops = Object.values(troops).reduce((a, b) => a + b, 0);
  const lootPercent = Math.floor((attack.destroyedBuildings / Math.max(1, attack.totalBuildings)) * 100);

  return (
    <div className="attack-container">
      <div className="attack-top-bar">
        <div className="loot-info">
          <span>🪙 +{attack.goldLooted}</span>
          <span>💧 +{attack.elixirLooted}</span>
          <span>📊 {lootPercent}% تدمير</span>
        </div>
        <button className="end-attack-btn" onClick={endAttack}>
          إنهاء المعركة
        </button>
      </div>

      <div className="attack-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="attack-canvas"
          onClick={handleCanvasClick}
        />
        <div className="deploy-zone-hint">
          اضغط هنا لنشر الجنود ⬇️
        </div>
      </div>

      {/* Troop deployment bar */}
      <div className="deploy-bar">
        <div className="deploy-bar-inner">
          {Object.entries(troops).filter(([, c]) => c > 0).map(([type, count]) => {
            const def = TROOP_DEFS[type];
            return (
              <div key={type} className="deploy-troop-slot">
                <span className="text-xl">{def.icon}</span>
                <span className="text-white text-xs font-bold">x{count}</span>
              </div>
            );
          })}
          {totalTroops === 0 && (
            <span className="text-white/40 text-sm">لا يوجد جنود - اذهب لتدريب الجيش أولاً</span>
          )}
        </div>
      </div>
    </div>
  );
}