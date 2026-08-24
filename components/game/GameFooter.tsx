'use client';

import { useGameStore } from '../../game/store';
import { GameView } from '../../game/types';

const tabs: { view: GameView; label: string; icon: string }[] = [
  { view: 'village', label: 'القرية', icon: '🏘️' },
  { view: 'attack', label: 'الهجوم', icon: '⚔️' },
  { view: 'troops', label: 'الجيش', icon: '🗡️' },
  { view: 'shop', label: 'المتجر', icon: '🛒' },
];

export default function GameFooter() {
  const currentView = useGameStore((s) => s.currentView);
  const setView = useGameStore((s) => s.setView);
  const troops = useGameStore((s) => s.troops);
  
  const totalTroops = Object.values(troops).reduce((a, b) => a + b, 0);

  return (
    <footer className="absolute bottom-4 left-4 right-4 bg-[#5C3D2E]/95 backdrop-blur-md border-4 border-[#8D5A38] rounded-3xl flex justify-around p-3 z-[45] shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)]">
      {tabs.map((tab) => (
        <button
          key={tab.view}
          onClick={() => setView(tab.view)}
          className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
            currentView === tab.view ? 'bg-[#C88B5B] text-[#3e2615] scale-110 shadow-inner' : 'text-[#D6A477] hover:bg-[#8D5A38]'
          }`}
        >
          <span className="text-xl mb-1">{tab.icon}</span>
          <span className="text-[10px] font-bold">{tab.label}</span>
          {tab.view === 'troops' && totalTroops > 0 && (
            <span className="absolute top-0 right-2 w-5 h-5 bg-red-500 border border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalTroops}
            </span>
          )}
        </button>
      ))}
    </footer>
  );
}