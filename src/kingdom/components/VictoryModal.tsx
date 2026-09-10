import confetti from 'canvas-confetti';
import React, { useEffect } from 'react';
import { GameEngine } from '../engine/gameEngine';

interface VictoryModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ engine, onClose }) => {
  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const completedWaveNumber = engine.currentWave - 1;

  return (
    <div id="victory-modal-overlay" className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 items-center text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Crown Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/40 mb-3 animate-bounce">
          👑
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">Wave {completedWaveNumber} Repelled!</h2>
        <p className="text-xs text-amber-300 font-semibold uppercase tracking-widest mt-1">The Realm Stands Victorious</p>

        {/* Victory Bounty Overview */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 my-4 flex flex-col gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Treasury Spoils Awarded</span>
          <div className="flex flex-wrap items-center justify-center gap-3 font-extrabold text-sm">
            <span className="px-3 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800">
              🪙 +{50 + completedWaveNumber * 30} Coins
            </span>
            <span className="px-3 py-1 rounded-xl bg-sky-950/80 text-sky-300 border border-sky-800">
              💎 +{3 + completedWaveNumber * 2} Gems
            </span>
            <span className="px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              🪵 +{30 + completedWaveNumber * 10} Timber
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/30 transition-transform"
        >
          Fortify &amp; Prepare Next Wave
        </button>
      </div>
    </div>
  );
};
