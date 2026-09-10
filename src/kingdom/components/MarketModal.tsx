import React from 'react';
import { soundManager } from '../audio/soundManager';
import { GameEngine } from '../engine/gameEngine';

interface MarketModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({ engine, onClose }) => {
  const handleTrade = (giveType: 'wood' | 'stone' | 'food' | 'coins', giveAmt: number, getAmt: number, isGem: boolean = false) => {
    if (engine.resources[giveType] < giveAmt) return;

    engine.resources[giveType] -= giveAmt;
    if (isGem) {
      engine.resources.gems += getAmt;
    } else if (giveType === 'coins') {
      // Buying raw goods
      // Check which good we are buying
      engine.addResource('stone', getAmt);
    } else {
      // Selling raw goods for coins
      engine.resources.coins += getAmt;
    }

    soundManager.playCoin();
    engine.particles.emitSparks(engine.hero.x, engine.hero.y, 10, '#F59E0B');
  };

  const handleBuyWood = () => {
    if (engine.resources.coins < 25) return;
    if (engine.resources.wood >= engine.storageCapacity.wood) return;
    engine.resources.coins -= 25;
    engine.addResource('wood', 20);
    soundManager.playCoin();
  };

  const handleBuyStone = () => {
    if (engine.resources.coins < 30) return;
    if (engine.resources.stone >= engine.storageCapacity.stone) return;
    engine.resources.coins -= 30;
    engine.addResource('stone', 20);
    soundManager.playCoin();
  };

  return (
    <div id="market-modal-overlay" className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Merchant Bazaar &amp; Exchange</h2>
              <p className="text-xs text-slate-400">Trade surplus materials for currency and precious royal gemstones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Balances Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/40 border-b border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Your Treasury:</span>
          <div className="flex items-center gap-3 font-bold">
            <span className="text-amber-400">🪙 {engine.resources.coins} Coins</span>
            <span className="text-sky-400">💎 {engine.resources.gems} Gems</span>
          </div>
        </div>

        {/* Trade Offers */}
        <div className="p-6 flex flex-col gap-3 overflow-y-auto max-h-[65vh]">
          {/* Sell Wood */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪵</span>
              <div>
                <h4 className="font-bold text-sm text-white">Sell 20 Timber</h4>
                <span className="text-xs text-amber-400 font-semibold">Yield: 🪙 +15 Coins</span>
              </div>
            </div>
            <button
              onClick={() => handleTrade('wood', 20, 15)}
              disabled={engine.resources.wood < 20}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform ${
                engine.resources.wood >= 20
                  ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Sell (20 🪵)
            </button>
          </div>

          {/* Sell Stone */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪨</span>
              <div>
                <h4 className="font-bold text-sm text-white">Sell 20 Stone</h4>
                <span className="text-xs text-amber-400 font-semibold">Yield: 🪙 +20 Coins</span>
              </div>
            </div>
            <button
              onClick={() => handleTrade('stone', 20, 20)}
              disabled={engine.resources.stone < 20}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform ${
                engine.resources.stone >= 20
                  ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Sell (20 🪨)
            </button>
          </div>

          {/* Sell Food */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌾</span>
              <div>
                <h4 className="font-bold text-sm text-white">Sell 20 Food</h4>
                <span className="text-xs text-amber-400 font-semibold">Yield: 🪙 +15 Coins</span>
              </div>
            </div>
            <button
              onClick={() => handleTrade('food', 20, 15)}
              disabled={engine.resources.food < 20}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform ${
                engine.resources.food >= 20
                  ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Sell (20 🌾)
            </button>
          </div>

          {/* Buy Timber */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h4 className="font-bold text-sm text-white">Purchase 20 Timber</h4>
                <span className="text-xs text-slate-400 font-semibold">Cost: 🪙 25 Coins</span>
              </div>
            </div>
            <button
              onClick={handleBuyWood}
              disabled={engine.resources.coins < 25 || engine.resources.wood >= engine.storageCapacity.wood}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform ${
                engine.resources.coins >= 25 && engine.resources.wood < engine.storageCapacity.wood
                  ? 'bg-slate-700 hover:bg-slate-600 active:scale-95 text-white border border-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Buy (25 🪙)
            </button>
          </div>

          {/* Buy Stone */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧱</span>
              <div>
                <h4 className="font-bold text-sm text-white">Purchase 20 Stone</h4>
                <span className="text-xs text-slate-400 font-semibold">Cost: 🪙 30 Coins</span>
              </div>
            </div>
            <button
              onClick={handleBuyStone}
              disabled={engine.resources.coins < 30 || engine.resources.stone >= engine.storageCapacity.stone}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform ${
                engine.resources.coins >= 30 && engine.resources.stone < engine.storageCapacity.stone
                  ? 'bg-slate-700 hover:bg-slate-600 active:scale-95 text-white border border-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Buy (30 🪙)
            </button>
          </div>

          {/* Exchange for Gems */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-950/40 border border-sky-800/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <h4 className="font-bold text-sm text-sky-200">Exchange for Royal Gems</h4>
                <span className="text-xs text-sky-300 font-semibold">Yield: 💎 +2 Gems (Cost: 🪙 100 Coins)</span>
              </div>
            </div>
            <button
              onClick={() => handleTrade('coins', 100, 2, true)}
              disabled={engine.resources.coins < 100}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform ${
                engine.resources.coins >= 100
                  ? 'bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Exchange
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
