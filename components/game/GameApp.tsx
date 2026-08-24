
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../game/store';
import GameHeader from './GameHeader';
import GameFooter from './GameFooter';
import VillageGrid from './VillageGrid';
import ShopPanel from './ShopPanel';
import TroopPanel from './TroopPanel';
import AttackView from './AttackView';

// Easy7Language Gamification Components
import StoryDialog from './StoryDialog';
import LanguagePortal from './LanguagePortal';
import AlertsPanel from './AlertsPanel';

export default function GameApp({ onStartArcade, onClose, onOpenMap, completedCount = 0 }: { onStartArcade?: (gameId: 'knifehit' | 'zombie' | 'lostlanguage') => void; onClose?: () => void; onOpenMap?: () => void; completedCount?: number }) {
  const initGame = useGameStore((s) => s.initGame);
  const buildings = useGameStore((s) => s.buildings);
  const currentView = useGameStore((s) => s.currentView);
  const selectedBuildingType = useGameStore((s) => s.selectedBuildingType);
  const updateResources = useGameStore((s) => s.updateResources);

  // Gamified States
  const isIntroActive = useGameStore((s) => s.isIntroActive);
  const activeDialog = useGameStore((s) => s.activeDialog);
  const shieldExpiresAt = useGameStore((s) => s.shieldExpiresAt);
  const streak = useGameStore((s) => s.streak);
  const alerts = useGameStore((s) => s.alerts);

  const [showAlerts, setShowAlerts] = useState(false);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;
  const isShieldActive = shieldExpiresAt > Date.now();
  const isAutoBuild = useGameStore((s) => s.isAutoBuild);
  const toggleAutoBuild = useGameStore((s) => s.toggleAutoBuild);

  useEffect(() => {
    if (buildings.length === 0) {
      initGame();
    }
  }, [buildings.length, initGame]);

  // Global resource tick
  useEffect(() => {
    const interval = setInterval(() => {
      updateResources();
    }, 5000);
    return () => clearInterval(interval);
  }, [updateResources]);

  // Calculated shield hours left
  const getShieldText = () => {
    if (!isShieldActive) return '🔴 لا يوجد درع حامٍ';
    const hoursLeft = Math.ceil((shieldExpiresAt - Date.now()) / (60 * 60 * 1000));
    return `🛡️ الدرع الذهبي فعال (${hoursLeft} س)`;
  };

  return (
    <div className="game-container relative overflow-hidden">
      {/* Golden Shield Dome Visual Effect overlay */}
      {isShieldActive && currentView === 'village' && (
        <div className="absolute inset-0 bg-yellow-400/5 pointer-events-none border-4 border-yellow-400/30 rounded-3xl z-30 animate-pulse flex items-center justify-center">
          <div className="w-11/12 h-5/6 border border-yellow-300/10 rounded-full shadow-[inset_0_0_50px_rgba(250,204,21,0.1)]" />
        </div>
      )}

      {/* Sandstorm warning atmosphere if Shield is Expired */}
      {!isShieldActive && currentView === 'village' && (
        <div className="absolute inset-0 bg-amber-900/5 pointer-events-none z-30 flex items-center justify-center">
          {/* Subtle dust overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent animate-pulse" />
        </div>
      )}

      <GameHeader onClose={onClose} />
      
      {/* Floating Gamified Actions Bar (Visible during village view) */}
      {currentView === 'village' && !isIntroActive && completedCount > 0 && (
        <div className="absolute top-20 right-4 z-35 flex flex-col gap-2" dir="rtl">
          {/* Mail/Alerts Box */}
          <button
            onClick={() => setShowAlerts(true)}
            className="btn-wood !py-2 !px-3 !text-xs !rounded-xl"
          >
            <span>✉️</span> البريد والرسائل
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-600 border border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>
          
          {/* Side Quests / Arcade Trigger */}
          <button
            onClick={() => {
                if (onStartArcade) {
                    const games = ['knifehit', 'zombie', 'lostlanguage'] as const;
                    const randomGame = games[Math.floor(Math.random() * games.length)];
                    onStartArcade(randomGame);
                }
            }}
            className="btn-emerald !py-2 !px-3 !text-xs !rounded-xl"
          >
            <span>🎯</span> ألعاب جانبية
          </button>

          {/* Streak indicator badge */}
          <div className="flex items-center gap-1 py-1.5 px-2.5 bg-[#F5E6C8]/90 border border-[#C4603A]/30 text-[#5C3D2E] font-bold text-[10px] rounded-lg shadow-sm">
            <span>🔥</span> سلسلة الأيام: {streak}
          </div>

          {/* Shield status tag */}
          <div className={`py-1 px-2 text-[9px] font-bold rounded-lg text-center shadow-sm ${isShieldActive ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {getShieldText()}
          </div>
          {/* Auto Build Toggle */}
          <button
            onClick={toggleAutoBuild}
            className={`py-1 px-2 text-[10px] font-bold rounded-lg text-center shadow-sm transition-all border ${isAutoBuild ? 'bg-[#8FAF7E]/90 text-white border-[#5c774f]' : 'bg-stone-700 text-stone-300 border-stone-500'}`}
          >
             {isAutoBuild ? '🤖 بناء تلقائي: مفعل' : '🛠️ بناء يدوي: مفعل'}
          </button>
        </div>
      )}

      {currentView === 'village' && !isIntroActive && (
        <div className="absolute bottom-24 left-4 z-35 flex flex-col items-start gap-4">
          {completedCount === 0 && (
            <div className="bg-[#fdf6e3] rounded-2xl p-4 shadow-xl border-4 border-[#8d5a38] relative w-64 animate-bounce-slight" dir="rtl">
              <div className="absolute -bottom-4 left-8 w-6 h-6 bg-[#fdf6e3] border-b-4 border-l-4 border-[#8d5a38] transform -rotate-45"></div>
              <p className="text-[#5c3d2e] font-bold text-sm leading-relaxed mb-1">
                  <span className="text-amber-600 font-black">إيلي:</span> مرحباً بك في أرضنا! الكوخ فارغ كما ترى. اضغط على اللوحة الخشبية لنبدأ العمل!
              </p>
            </div>
          )}
          <button
            onClick={() => onOpenMap?.()}
            className={`btn-wood !text-lg !px-8 !py-4 shadow-2xl ${completedCount === 0 ? 'animate-pulse ring-4 ring-amber-400 ring-offset-2' : ''}`}
            dir="rtl"
          >
            <span className="text-3xl">📜</span> لوحة المهام الخشبية
          </button>
        </div>
      )}

      <main className="game-main">
        {currentView === 'village' && <VillageGrid />}
        {currentView === 'shop' && <ShopPanel />}
        {currentView === 'troops' && <TroopPanel />}
        {currentView === 'attack' && <AttackView />}
      </main>

      {selectedBuildingType && currentView === 'village' && (
        <div className="placement-mode-bar">
          <span className="text-sm">
            📍 وضع: {selectedBuildingType === 'wall' ? '🧱 جدار' : selectedBuildingType === 'cannon' ? '💥 مدفع' : selectedBuildingType === 'archer_tower' ? '🏹 برج رماة' : selectedBuildingType}
          </span>
          <span className="text-xs text-white/50">اضغط على الشبكة أو عد للمتجر</span>
        </div>
      )}

      {completedCount > 0 && <GameFooter />}

      {/* --- Overlays & Modals --- */}
      {activeDialog && <StoryDialog onStartArcade={onStartArcade} />}
      

      {showAlerts && <AlertsPanel onClose={() => setShowAlerts(false)} />}
    </div>
  );
}