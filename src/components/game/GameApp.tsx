
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../game/store';
import GameHeader from './GameHeader';
import GameFooter from './GameFooter';
import VillageGrid from './VillageGrid';
import ShopPanel from './ShopPanel';
import TroopPanel from './TroopPanel';
import AttackView from './AttackView';

// Easy7Language Gamification Components
import StoryIntro from './StoryIntro';
import StoryDialog from './StoryDialog';
import LanguagePortal from './LanguagePortal';
import AlertsPanel from './AlertsPanel';

export default function GameApp() {
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

  const [showLanguagePortal, setShowLanguagePortal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;
  const isShieldActive = shieldExpiresAt > Date.now();

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

      <GameHeader />
      
      {/* Floating Gamified Actions Bar (Visible during village view) */}
      {currentView === 'village' && !isIntroActive && (
        <div className="absolute top-20 right-4 z-35 flex flex-col gap-2" dir="rtl">
          {/* Learning Portal Trigger */}
          <button
            onClick={() => setShowLanguagePortal(true)}
            className="flex items-center gap-1.5 py-2 px-3 bg-gradient-to-r from-[#8FAF7E] to-[#6c915a] hover:from-[#9bc18a] text-white font-bold text-xs rounded-xl shadow-lg border-b-2 border-[#5c774f] active:border-b-0 active:translate-y-0.5 transition-all animate-bounce"
          >
            <span>📚</span> بوابة التعليم
          </button>

          {/* Mail/Alerts Box */}
          <button
            onClick={() => setShowAlerts(true)}
            className="flex items-center gap-1.5 py-2 px-3 bg-[#C4603A] hover:bg-[#d16f49] text-white font-bold text-xs rounded-xl shadow-lg border-b-2 border-[#8e3f22] active:border-b-0 active:translate-y-0.5 transition-all relative"
          >
            <span>✉️</span> البريد والرسائل
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-600 border border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Streak indicator badge */}
          <div className="flex items-center gap-1 py-1.5 px-2.5 bg-[#F5E6C8]/90 border border-[#C4603A]/30 text-[#5C3D2E] font-bold text-[10px] rounded-lg shadow-sm">
            <span>🔥</span> سلسلة الأيام: {streak}
          </div>

          {/* Shield status tag */}
          <div className={`py-1 px-2 text-[9px] font-bold rounded-lg text-center shadow-sm ${isShieldActive ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {getShieldText()}
          </div>
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

      <GameFooter />

      {/* --- Overlays & Modals --- */}
      {isIntroActive && <StoryIntro />}
      {activeDialog && <StoryDialog />}
      {showLanguagePortal && <LanguagePortal onClose={() => setShowLanguagePortal(false)} />}
      {showAlerts && <AlertsPanel onClose={() => setShowAlerts(false)} />}
    </div>
  );
}