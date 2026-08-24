'use client';

import { useGameStore } from '../../game/store';
import { BUILDING_DEFS } from '../../game/constants';

export default function GameHeader() {
  const gold = useGameStore((s) => s.gold);
  const elixir = useGameStore((s) => s.elixir);
  const gems = useGameStore((s) => s.gems);
  const trophies = useGameStore((s) => s.trophies);
  const playerName = useGameStore((s) => s.playerName);
  const playerLevel = useGameStore((s) => s.playerLevel);
  const currentView = useGameStore((s) => s.currentView);

  return (
    <header className="game-header">
      <div className="flex items-center gap-2">
        <div className="player-info">
          <span className="text-yellow-300 font-bold text-sm">{playerName}</span>
          <span className="text-yellow-200/70 text-xs">Lv.{playerLevel}</span>
        </div>
        <div className="trophy-badge">
          <span>🏆</span>
          <span className="text-white text-xs font-bold">{trophies}</span>
        </div>
      </div>
      
      <div className="resources-bar">
        <div className="resource-item">
          <span className="text-lg">🪙</span>
          <span className="text-yellow-300 text-xs font-bold">{Math.floor(gold).toLocaleString()}</span>
        </div>
        <div className="resource-item">
          <span className="text-lg">💧</span>
          <span className="text-purple-300 text-xs font-bold">{Math.floor(elixir).toLocaleString()}</span>
        </div>
        <div className="resource-item">
          <span className="text-lg">💎</span>
          <span className="text-cyan-300 text-xs font-bold">{gems}</span>
        </div>
      </div>

      {currentView === 'attack' && (
        <div className="attack-header">
          <AttackTimer />
        </div>
      )}
    </header>
  );
}

function AttackTimer() {
  const timeRemaining = useGameStore((s) => s.attack.timeRemaining);
  const stars = useGameStore((s) => s.attack.stars);
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  return (
    <div className="flex items-center gap-3">
      <div className="stars-display">
        {[1, 2, 3].map((s) => (
          <span key={s} className={s <= stars ? 'star-active' : 'star-inactive'}>⭐</span>
        ))}
      </div>
      <div className="timer">
        <span className={`text-lg font-mono font-bold ${timeRemaining < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}