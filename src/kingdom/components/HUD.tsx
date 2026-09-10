import React, { useState } from 'react';
import {
  Sparkles,
  GraduationCap,
  Swords,
  BarChart3,
  Flame,
  Heart,
  Hammer,
  Users,
  TrendingUp,
  Map,
  Settings,
  Scroll,
  Coins,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Compass,
  ArrowLeft,
  Pin,
} from 'lucide-react';
import { GameEngine } from '../engine/gameEngine';
import { KingdomLearningState } from '../types/learning';
import { soundManager } from '../audio/soundManager';
import { useUserStore } from '@/store/userStore';
import { useReviewStore } from '@/store/reviewStore';
import { globalSpacedRepetition } from '../engine/spacedRepetition';
import { speak, bcp47 } from '@/lib/tts';
import { TARGET_LANGUAGES } from '@/components/layout/LanguageSelectModal';

interface HUDProps {
  engine: GameEngine;
  kingdomState: KingdomLearningState;
  onOpenReview: () => void;
  onOpenCurriculum: () => void;
  onOpenDefense: () => void;
  onOpenAnalytics: () => void;
  onOpenEvolution?: () => void;
  onOpenBuild: () => void;
  onOpenWorkers: () => void;
  onOpenUpgrades: () => void;
  onOpenMarket: () => void;
  onOpenMiniMap: () => void;
  onOpenSettings: () => void;
  onOpenQuests: () => void;
  onBackToApp?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  kingdomState,
  onOpenReview,
  onOpenCurriculum,
  onOpenDefense,
  onOpenAnalytics,
  onOpenEvolution,
  onOpenBuild,
  onOpenWorkers,
  onOpenUpgrades,
  onOpenMarket,
  onOpenMiniMap,
  onOpenSettings,
  onOpenQuests,
  onBackToApp,
}) => {
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isSoundMuted());
  const targetLanguage = useUserStore((s) => s.targetLanguage) || 'en';
  const currentLangMeta = TARGET_LANGUAGES.find((l) => l.code === targetLanguage) || {
    flag: '🇬🇧',
    name: 'الإنجليزية',
    nameEn: 'English',
  };

  const isOverdue = kingdomState.dueItemsCount > 0;
  const resources = engine.resources;

  const { cards } = useReviewStore();
  const langKey = (targetLanguage || 'en').toLowerCase();

  const dueCards = React.useMemo(() => {
    const langCards = cards.filter((c) => !c.language || c.language.toLowerCase() === langKey);
    const now = Date.now();
    const due = langCards.filter((c) => c.nextReviewAt <= now);
    if (due.length > 0) {
      return due.map((c) => ({
        id: c.id,
        native: c.native,
        translation: c.translation,
        pronunciation: c.pronunciation,
      }));
    }

    const queue = globalSpacedRepetition.getDueReviewQueue();
    if (queue.length > 0) {
      return queue.map((q) => ({
        id: q.id,
        native: q.primaryText,
        translation: q.secondaryText,
        pronunciation: q.contextOrNotes,
      }));
    }

    if (kingdomState.dueItemsCount > 0) {
      const starters: Record<string, Array<{ id: string; native: string; translation: string }>> = {
        de: [
          { id: 's_de_1', native: 'Hallo', translation: 'مرحباً' },
          { id: 's_de_2', native: 'Danke', translation: 'شكراً' },
          { id: 's_de_3', native: 'Guten Morgen', translation: 'صباح الخير' },
        ],
        fr: [
          { id: 's_fr_1', native: 'Bonjour', translation: 'مرحباً' },
          { id: 's_fr_2', native: 'Merci', translation: 'شكراً' },
          { id: 's_fr_3', native: 'Bonsoir', translation: 'مساء الخير' },
        ],
        es: [
          { id: 's_es_1', native: 'Hola', translation: 'مرحباً' },
          { id: 's_es_2', native: 'Gracias', translation: 'شكراً' },
          { id: 's_es_3', native: 'Buenos días', translation: 'صباح الخير' },
        ],
        it: [
          { id: 's_it_1', native: 'Ciao', translation: 'مرحباً' },
          { id: 's_it_2', native: 'Grazie', translation: 'شكراً' },
          { id: 's_it_3', native: 'Buongiorno', translation: 'صباح الخير' },
        ],
        ja: [
          { id: 's_ja_1', native: 'Konnichiwa', translation: 'مرحباً' },
          { id: 's_ja_2', native: 'Arigatou', translation: 'شكراً' },
          { id: 's_ja_3', native: 'Ohayou', translation: 'صباح الخير' },
        ],
        zh: [
          { id: 's_zh_1', native: 'Ni hao', translation: 'مرحباً' },
          { id: 's_zh_2', native: 'Xie xie', translation: 'شكراً' },
          { id: 's_zh_3', native: 'Zao shang hao', translation: 'صباح الخير' },
        ],
        en: [
          { id: 's_en_1', native: 'Hello', translation: 'مرحباً' },
          { id: 's_en_2', native: 'Thank you', translation: 'شكراً' },
          { id: 's_en_3', native: 'Good morning', translation: 'صباح الخير' },
        ],
      };
      return starters[langKey] || starters.en;
    }

    return [];
  }, [cards, langKey, kingdomState.dueItemsCount]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    soundManager.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  return (
    <>
      {/* Top Header - Streamlined, World-Dominant & Non-intrusive */}
      <header 
        className="fixed top-0 left-0 right-0 z-30 pointer-events-none p-3 flex justify-between items-start"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >
        {/* Top Left: Back to App + Kingdom Stage & Learning Progression Pill */}
        <div className="flex items-center gap-2">
          {onBackToApp && (
            <button
              id="btn-hud-back-easy7"
              onClick={onBackToApp}
              className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-amber-500/40 shadow-xl transition-all duration-200 text-slate-200 hover:text-white font-bold text-xs cursor-pointer"
              title="العودة لتطبيق Easy7"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Easy7</span>
            </button>
          )}
          <button
            id="kingdom-status-capsule"
            onClick={onOpenEvolution || onOpenAnalytics}
            className="pointer-events-auto group flex items-center gap-2.5 bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/50 hover:border-amber-500/50 shadow-xl transition-all duration-200 text-left cursor-pointer"
            title="انقر لعرض مسار نمو وتطور القرية والمملكة"
          >
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold text-xs shadow-inner">
              M{kingdomState.developmentStage ?? 0}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <span>{currentLangMeta.flag}</span>
                  <span>مملكة {currentLangMeta.name}</span>
                </span>
                <span>{kingdomState.stageNameAr || kingdomState.stageName || `المرحلة ${kingdomState.developmentStage ?? 0}`}</span>
                <span className="text-[10px] text-amber-400/90 font-mono font-medium">
                  • {kingdomState.learningPoints || 0} LP
                </span>
              </div>
              {/* District & Phrase Capacity Progress */}
              <div className="flex items-center gap-1 text-[10px] text-sky-300 font-medium">
                <span>🗺️ {kingdomState.districtNameAr || 'وادي البدايات'}</span>
                <span className="text-slate-400 font-mono">
                  ({kingdomState.districtMasteredCount || 0}/{kingdomState.districtCapacity || 12} عبارة)
                </span>
              </div>
            {/* Vitality Bar */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <Heart
                className={`w-3 h-3 ${
                  kingdomState.vitalityScore < 0.7 ? 'text-amber-400 animate-pulse' : 'text-rose-400'
                }`}
              />
              <div className="w-16 bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    kingdomState.vitalityScore < 0.7 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(8, kingdomState.vitalityScore * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {Math.round(kingdomState.vitalityScore * 100)}% Vitality
              </span>
            </div>
          </div>
        </button>
        </div>

        {/* Top Right: Compact Resources & Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Resources Capsule */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 shadow-xl text-xs font-semibold text-slate-200">
            <span title="Autonomous Castle Warriors" className="text-rose-400 flex items-center gap-1 font-bold">
              ⚔️ {engine.warriors.length}
            </span>
            <span title="Wood" className="hover:scale-105 transition-transform">🪵 {resources.wood}</span>
            <span title="Stone" className="hover:scale-105 transition-transform">🪨 {resources.stone}</span>
            <span title="Food" className="hover:scale-105 transition-transform">🌾 {resources.food}</span>
            <span title="Coins" className="text-yellow-400 hover:scale-105 transition-transform">🪙 {resources.coins}</span>
            <span title="Gems" className="text-sky-400 hover:scale-105 transition-transform">💎 {resources.gems}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-full bg-slate-950/80 hover:bg-slate-900/90 backdrop-blur-md border border-slate-700/50 text-slate-300 hover:text-white shadow-xl transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Progressive Disclosure: Realm Management Toggle */}
          <button
            id="toggle-tools-drawer-btn"
            onClick={() => setShowToolsDrawer(!showToolsDrawer)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-semibold shadow-xl transition ${
              showToolsDrawer
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/80 hover:bg-slate-900 border-slate-700/50 text-slate-300 hover:text-white'
            }`}
            title="Expand Realm Management Dock"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manage</span>
            {showToolsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>



      {/* Progressive Disclosure Dock (Expands only when user wants deeper realm management) */}
      {showToolsDrawer && (
        <div className="fixed top-14 right-3 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-700/70 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-48 text-xs font-medium">
            <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
              Realm Systems
            </div>

            <button
              onClick={() => {
                onOpenBuild();
                setShowToolsDrawer(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition text-left"
            >
              <Hammer className="w-4 h-4 text-amber-400" />
              <span>Construction</span>
            </button>

            <button
              onClick={() => {
                onOpenWorkers();
                setShowToolsDrawer(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition text-left"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Guild Workers ({engine.workers.length})</span>
            </button>

            <button
              onClick={() => {
                onOpenUpgrades();
                setShowToolsDrawer(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition text-left"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Kingdom Tech</span>
            </button>

            <button
              onClick={() => {
                onOpenMarket();
                setShowToolsDrawer(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition text-left"
            >
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>Merchant Market</span>
            </button>

            <button
              onClick={() => {
                onOpenQuests();
                setShowToolsDrawer(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition text-left"
            >
              <Scroll className="w-4 h-4 text-purple-400" />
              <span>Realm Quests</span>
            </button>

            <button
              onClick={() => {
                onOpenMiniMap();
                setShowToolsDrawer(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition text-left"
            >
              <Map className="w-4 h-4 text-cyan-400" />
              <span>World Map</span>
            </button>

            <button
              onClick={() => {
                onOpenDefense();
                setShowToolsDrawer(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-purple-950/60 text-purple-300 transition text-left"
            >
              <Swords className="w-4 h-4 text-purple-400" />
              <span>Spire Defense</span>
            </button>

            <div className="w-full h-px bg-slate-800 my-0.5" />

            <button
              onClick={() => {
                onOpenSettings();
                setShowToolsDrawer(false);
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-300 hover:text-white transition text-left"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">⚙️</span>
            </button>

            <button
              id="btn-hud-reset-game"
              onClick={() => {
                setShowToolsDrawer(false);
                if (window.confirm('هل أنت تأكد من تصفير وإعادة تشغيل اللعبة؟ سيعود كل شيء إلى الحالة الإبتدائية.\nAre you sure you want to reset the entire kingdom and start from scratch?')) {
                  engine.resetGame();
                }
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/40 transition text-left font-bold"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">🔄</span>
                <span>تصفير اللعبة</span>
              </div>
              <span className="text-[9px] text-rose-400 font-mono uppercase">Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Center Action Pill: Clean, High-Craft "LEARN / REVIEW" Interface */}
      <footer 
        className="fixed bottom-5 left-0 right-0 z-30 pointer-events-none flex flex-col items-center gap-2 px-4"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Contextual Plot Interaction Button if near a building/plot */}
        {engine.nearbyPlot && (
          <button
            id="btn-context-action"
            onClick={() => {
              engine.selectedPlotId = engine.nearbyPlot?.id || null;
              engine.selectedBuilding = engine.nearbyPlot?.building || null;
              onOpenBuild();
            }}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 border border-amber-300 animate-pulse transition-transform"
          >
            <span className="text-base">🏰</span>
            <span className="uppercase tracking-wider">
              {engine.nearbyPlot.building ? 'Inspect Building' : 'Develop Plot'}
            </span>
          </button>
        )}

        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl p-1.5 rounded-full border border-slate-700/60 shadow-2xl ring-1 ring-white/10">
          {/* Autonomous Garrison Tag */}
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
            title="Autonomous Castle Army"
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {engine.warriors.length} {engine.warriors.length === 1 ? 'Warrior' : 'Warriors'}
            </span>
            <span className={`text-[10px] font-mono ${engine.isThreatDetected ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {engine.isThreatDetected ? '• Engaged' : '• Guarding'}
            </span>
          </div>

          {/* Primary Action Button: Review Due vs Learn New */}
          {isOverdue ? (
            <button
              id="primary-review-action-pill"
              onClick={onOpenReview}
              className="group relative flex items-center gap-2.5 px-5 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900" />
              </span>
              <Sparkles className="w-4 h-4 text-slate-950 fill-current group-hover:rotate-12 transition-transform" />
              <span>Review Memories ({kingdomState.dueItemsCount})</span>
            </button>
          ) : (
            <button
              id="primary-learn-action-pill"
              onClick={onOpenCurriculum}
              className="group flex items-center gap-2.5 px-5 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <GraduationCap className="w-4 h-4 text-sky-200 group-hover:-translate-y-0.5 transition-transform" />
              <span>Learn New Material</span>
            </button>
          )}

          {/* Curriculum Explorer Alternative Button */}
          <button
            id="browse-curriculum-quick-btn"
            onClick={onOpenCurriculum}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
            title="Browse Complete Curriculum & Lessons"
          >
            <Compass className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Curriculum</span>
          </button>

          {/* Memory Progress Analytics */}
          <button
            id="memory-analytics-quick-btn"
            onClick={onOpenAnalytics}
            className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition"
            title="Spaced Repetition & Retention Stats"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </>
  );
};
