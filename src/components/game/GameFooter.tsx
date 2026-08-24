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
    <footer className="game-footer">
      {tabs.map((tab) => (
        <button
          key={tab.view}
          onClick={() => setView(tab.view)}
          className={`footer-tab ${currentView === tab.view ? 'active' : ''}`}
        >
          <span className="footer-tab-icon">{tab.icon}</span>
          <span className="footer-tab-label">{tab.label}</span>
          {tab.view === 'troops' && totalTroops > 0 && (
            <span className="troop-badge">{totalTroops}</span>
          )}
        </button>
      ))}
    </footer>
  );
}