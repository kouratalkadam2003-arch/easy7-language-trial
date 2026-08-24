'use client';

import { useGameStore } from '../../game/store';
import { BUILDING_DEFS } from '../../game/constants';

export default function GameHeader({ onClose }: { onClose?: () => void }) {
  const gold = useGameStore((s) => s.gold);
  const elixir = useGameStore((s) => s.elixir);
  const gems = useGameStore((s) => s.gems);
  const trophies = useGameStore((s) => s.trophies);
  const playerName = useGameStore((s) => s.playerName);
  const playerLevel = useGameStore((s) => s.playerLevel);
  const currentView = useGameStore((s) => s.currentView);

  return (
    <header className="game-header absolute top-0 left-0 right-0 z-50 flex-col items-stretch">
      <div className="flex justify-between items-start w-full">
        <div className="flex items-center gap-2">
          {onClose && (
              <button 
                onClick={onClose} 
                className="p-1.5 bg-[#8D5A38]/90 hover:bg-[#C88B5B] rounded-xl pointer-events-auto border-2 border-[#5C3D2E] shadow-md transition-all active:scale-95 flex items-center justify-center"
                title="عودة للخريطة"
              >
                <span className="text-[#FDF6E3] text-[10px] font-bold">&larr; خروج</span>
              </button>
          )}
          <div className="player-info pointer-events-auto">
            <span className="text-yellow-300 font-bold text-sm">{playerName}</span>
            <span className="text-yellow-200/70 text-xs">Lv.{playerLevel}</span>
          </div>
          <div className="trophy-badge pointer-events-auto">
            <span>🏆</span>
            <span className="text-white text-xs font-bold">{trophies}</span>
          </div>
        </div>
        
        <div className="resources-bar pointer-events-auto">
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