import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../engine/gameEngine';

interface MiniMapModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const MiniMapModal: React.FC<MiniMapModalProps> = ({ engine, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderMap = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const scaleX = w / engine.world.width;
      const scaleY = h / engine.world.height;

      // 1. Background Grass
      ctx.fillStyle = '#22543d';
      ctx.fillRect(0, 0, w, h);

      // 2. River & Paths (Tile-based)
      const tileScaleX = w / engine.world.cols;
      const tileScaleY = h / engine.world.rows;
      for (let r = 0; r < engine.world.rows; r += 2) {
        for (let c = 0; c < engine.world.cols; c += 2) {
          const t = engine.world.tiles[r]?.[c];
          if (t?.type === 'water') {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(c * tileScaleX, r * tileScaleY, tileScaleX * 2, tileScaleY * 2);
          } else if (t?.type === 'dirt_path' || t?.type === 'stone_pavement') {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(c * tileScaleX, r * tileScaleY, tileScaleX * 2, tileScaleY * 2);
          }
        }
      }

      // 4. Resource Nodes
      for (const node of engine.world.resourceNodes) {
        if (!node.isDepleted) {
          ctx.fillStyle = node.resourceType === 'wood' ? '#15803d' : node.resourceType === 'stone' ? '#94a3b8' : '#eab308';
          ctx.beginPath();
          ctx.arc((node.x + node.width / 2) * scaleX, (node.y + node.height / 2) * scaleY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Buildings & Plots
      for (const plot of engine.world.buildingPlots) {
        if (plot.building) {
          ctx.fillStyle = plot.building.type.includes('tower') ? '#38bdf8' : '#fbbf24';
          ctx.fillRect(plot.x * scaleX, plot.y * scaleY, Math.max(4, plot.width * scaleX), Math.max(4, plot.height * scaleY));
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(plot.x * scaleX, plot.y * scaleY, plot.width * scaleX, plot.height * scaleY);
        }
      }

      // 6. Chests
      for (const chest of engine.world.chests) {
        if (!chest.isOpened) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc((chest.x + chest.width / 2) * scaleX, (chest.y + chest.height / 2) * scaleY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Invading Monsters (Red Blips)
      for (const enemy of engine.enemies) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc((enemy.x + enemy.width / 2) * scaleX, (enemy.y + enemy.height / 2) * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. Hero (Pulsing Gold / Cyan Blip)
      const hx = (engine.hero.x + engine.hero.width / 2) * scaleX;
      const hy = (engine.hero.y + engine.hero.height / 2) * scaleY;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(renderMap);
    };

    animId = requestAnimationFrame(renderMap);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [engine]);

  return (
    <div id="minimap-modal-overlay" className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Tactical Realm Map</h2>
              <p className="text-xs text-slate-400">Overview of buildings, defensive perimeter, resources, and threats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Map Canvas */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner bg-slate-950 w-full aspect-[7/5]">
            <canvas ref={canvasRef} width={560} height={400} className="w-full h-full block" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-cyan-400 border border-white" />
              <span>Hero Knight</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Buildings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-sky-400" />
              <span>Towers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span>Monsters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-600" />
              <span>Treasure Chest</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
