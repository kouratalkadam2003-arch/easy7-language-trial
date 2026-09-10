/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BuildMenuModal } from './components/BuildMenuModal';
import { CurriculumBrowserModal } from './components/CurriculumBrowserModal';
import { DefenseWaveModal } from './components/DefenseWaveModal';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MarketModal } from './components/MarketModal';
import { MiniMapModal } from './components/MiniMapModal';
import { ProgressAnalyticsModal } from './components/ProgressAnalyticsModal';
import { QuestModal } from './components/QuestModal';
import { ReviewDeckModal } from './components/ReviewDeckModal';
import { SettingsModal } from './components/SettingsModal';
import { UpgradeModal } from './components/UpgradeModal';
import { VictoryModal } from './components/VictoryModal';
import { KingdomEvolutionModal } from './components/KingdomEvolutionModal';
import { VillageRaidReviewOverlay } from './components/VillageRaidReviewOverlay';
import { WorkerModal } from './components/WorkerModal';
import { GameEngine } from './engine/gameEngine';
import { globalSpacedRepetition } from './engine/spacedRepetition';
import { useReviewStore } from '@/store/reviewStore';
import { useFarmStore } from '@/store/farmStore';
import { useUserStore } from '@/store/userStore';

type ActiveModal =
  | 'review'
  | 'curriculum'
  | 'defense'
  | 'analytics'
  | 'build'
  | 'workers'
  | 'upgrades'
  | 'market'
  | 'quests'
  | 'minimap'
  | 'settings'
  | null;

export interface KingdomAppProps {
  onBackToApp?: () => void;
  initialMode?: 'normal' | 'defense_review';
}

export default function App({ onBackToApp, initialMode = 'normal' }: KingdomAppProps = {}) {
  const engineRef = useRef<GameEngine | null>(null);
  const [, setTick] = useState(0);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isVillageRaidActive, setIsVillageRaidActive] = useState(initialMode === 'defense_review');
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [reviewItemId, setReviewItemId] = useState<string | null>(null);
  const [kingdomLearningState, setKingdomLearningState] = useState(
    globalSpacedRepetition.getKingdomState()
  );

  // Initialize GameEngine instance once
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  const engine = engineRef.current;

  // Sync spaced repetition engine state to React
  const refreshLearningState = () => {
    globalSpacedRepetition.updateKingdomMetrics();
    const updated = globalSpacedRepetition.getKingdomState();
    setKingdomLearningState(updated);

    // Sync knowledge resources into GameEngine bank
    if (engine) {
      engine.resources.wood += 5;
      engine.resources.stone += 5;
      engine.resources.coins += 10;
      engine.hero.damage = Math.round(updated.heroStats.power);
      engine.hero.rangedDamage = Math.round(updated.heroStats.power);
    }
  };

  const targetLangFromStore = useUserStore((s) => s.targetLanguage);
  const targetLanguage = (targetLangFromStore || (typeof window !== 'undefined' ? (localStorage.getItem('target_lang') || localStorage.getItem('easy7_target_language')) : '') || 'de').toLowerCase();

  useEffect(() => {
    // Switch kingdom engine to current active target language and purge erroneous cards!
    globalSpacedRepetition.setLanguage(targetLanguage);
    globalSpacedRepetition.purgeErroneousItems();
    if (engine) {
      engine.setLanguage(targetLanguage);
    }

    // Synchronize Easy7 completed lessons, cards, and streak into Kingdom engine!
    const { completedLessons = [], streak = 0 } = useUserStore.getState();
    const easyCards = useReviewStore.getState().getCardsForLanguage(targetLanguage);

    globalSpacedRepetition.syncWithEasy7Progress({
      completedLessons,
      cards: easyCards || [],
      streak,
    });
    refreshLearningState();

    if (easyCards && easyCards.length > 0) {
      for (const card of easyCards) {
        if (!globalSpacedRepetition.getItemById(card.id)) {
          globalSpacedRepetition.addIndividualItem({
            id: card.id,
            subject: `Easy7 (${targetLanguage.toUpperCase()})`,
            sourceLevelId: 'Easy7 Curriculum',
            sourceUnitId: card.tier || 'Vocabulary',
            sourceLessonId: 'Lesson',
            primaryText: card.native,
            secondaryText: card.translation,
            contextOrNotes: card.pronunciation,
            categoryTag: 'Vocabulary',
          });
        }
      }
      refreshLearningState();
    }
  }, [targetLanguage]);

  useEffect(() => {
    // Sync Easy7 Farm Store resources to Kingdom engine if available
    const farmRes = useFarmStore.getState().resources;
    if (farmRes && engine) {
      if (farmRes.gold > 0 && engine.resources.coins < farmRes.gold) {
        engine.resources.coins = farmRes.gold;
      }
      if (farmRes.wood > 0 && engine.resources.wood < farmRes.wood) {
        engine.resources.wood = farmRes.wood;
      }
      if (farmRes.gem > 0 && engine.resources.gems < farmRes.gem) {
        engine.resources.gems = farmRes.gem;
      }
    }

    // Subscribe to engine state updates for HUD/Modals
    const unsubscribe = engine.subscribe(() => {
      setTick((t) => (t + 1) % 1000000);
    });

    // Start Game Loop
    engine.start();

    return () => {
      unsubscribe();
      engine.stop();
    };
  }, [engine]);

  // Handle Direct Plot Click
  const handlePlotSelect = (_plotId: string) => {
    setActiveModal('build');
  };

  return (
    <div id="game-container" className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 select-none font-sans">
      {/* 2D Canvas Layer */}
      <GameCanvas
        engine={engine}
        onPlotSelect={handlePlotSelect}
        onOpenReview={(itemId) => {
          setReviewItemId(itemId || null);
          setActiveModal('review');
        }}
        onOpenCurriculum={() => setActiveModal('curriculum')}
      />

      {/* Top HUD & Educational Spaced-Repetition Overlay */}
      <HUD
        engine={engine}
        kingdomState={kingdomLearningState}
        onOpenReview={() => {
          setReviewItemId(null);
          setActiveModal('review');
        }}
        onOpenCurriculum={() => setActiveModal('curriculum')}
        onOpenDefense={() => setIsVillageRaidActive(true)}
        onOpenAnalytics={() => setActiveModal('analytics')}
        onOpenEvolution={() => setIsEvolutionModalOpen(true)}
        onOpenBuild={() => setActiveModal('build')}
        onOpenWorkers={() => setActiveModal('workers')}
        onOpenUpgrades={() => setActiveModal('upgrades')}
        onOpenMarket={() => setActiveModal('market')}
        onOpenMiniMap={() => setActiveModal('minimap')}
        onOpenSettings={() => setActiveModal('settings')}
        onOpenQuests={() => setActiveModal('quests')}
        onBackToApp={onBackToApp}
      />

      {/* Educational Spaced-Repetition Review Deck */}
      {activeModal === 'review' && (
        <ReviewDeckModal
          engine={globalSpacedRepetition}
          initialItemId={reviewItemId ?? undefined}
          onClose={() => {
            setActiveModal(null);
            setReviewItemId(null);
            refreshLearningState();
          }}
          onReviewCompleted={() => {
            refreshLearningState();
            setIsVillageRaidActive(true);
          }}
        />
      )}

      {/* Hierarchical Curriculum & Single-Item Knowledge Base */}
      {activeModal === 'curriculum' && (
        <CurriculumBrowserModal
          engine={globalSpacedRepetition}
          onClose={() => {
            setActiveModal(null);
            refreshLearningState();
          }}
          onItemAdded={refreshLearningState}
        />
      )}

      {/* Real-time Stationary Spire Defense Mode (Videos 2-4) */}
      {activeModal === 'defense' && (
        <DefenseWaveModal
          engine={globalSpacedRepetition}
          onClose={() => {
            setActiveModal(null);
            refreshLearningState();
          }}
        />
      )}

      {/* Progress & Memory Analytics */}
      {activeModal === 'analytics' && (
        <ProgressAnalyticsModal
          engine={globalSpacedRepetition}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Traditional Kingdom Builder Modals */}
      {activeModal === 'build' && <BuildMenuModal engine={engine} onClose={() => setActiveModal(null)} />}

      {activeModal === 'workers' && <WorkerModal engine={engine} onClose={() => setActiveModal(null)} />}

      {activeModal === 'upgrades' && <UpgradeModal engine={engine} onClose={() => setActiveModal(null)} />}

      {activeModal === 'market' && <MarketModal engine={engine} onClose={() => setActiveModal(null)} />}

      {activeModal === 'quests' && <QuestModal engine={engine} onClose={() => setActiveModal(null)} />}

      {activeModal === 'minimap' && <MiniMapModal engine={engine} onClose={() => setActiveModal(null)} />}

      {activeModal === 'settings' && <SettingsModal engine={engine} onClose={() => setActiveModal(null)} />}

      {/* Victory Banner / Modal when Wave is Cleared */}
      {engine.showVictoryModal && (
        <VictoryModal
          engine={engine}
          onClose={() => {
            engine.showVictoryModal = false;
            setTick((t) => t + 1);
          }}
        />
      )}

      {/* Real-time Village Raid & Review Combat Overlay (User Requested Exact Village Map) */}
      {isVillageRaidActive && (
        <VillageRaidReviewOverlay
          engine={engine}
          onClose={() => {
            setIsVillageRaidActive(false);
            if (initialMode === 'defense_review') {
              onBackToApp?.();
            }
          }}
        />
      )}

      {/* Kingdom Evolution & Growth Roadmap Modal */}
      {isEvolutionModalOpen && (
        <KingdomEvolutionModal
          kingdomState={kingdomLearningState}
          onClose={() => setIsEvolutionModalOpen(false)}
          onOpenReview={() => {
            setIsEvolutionModalOpen(false);
            setIsVillageRaidActive(true);
          }}
        />
      )}

      {/* Stage Promotion Celebration Popup */}
      {engine.showPromotionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 text-center shadow-2xl text-white space-y-4" dir="rtl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-4xl animate-bounce">
              👑
            </div>
            <h2 className="text-2xl font-black text-amber-400">
              ترقية المملكة الكبرى!
            </h2>
            <p className="text-sm font-bold text-white">
              تطورت قريتك إلى:{' '}
              <span className="text-amber-300 font-black">
                {kingdomLearningState.stageNameAr || kingdomLearningState.stageName}
              </span>
            </p>
            <p className="text-xs text-slate-300">
              بفضل دراستك وقراءتك المستمرة تم تشييد مبانٍ جديدة وظهور قرويين وفرسان لحماية أرضك!
            </p>
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 text-xs font-mono font-bold text-amber-300 flex justify-around">
              <span>🪙 +100 Gold</span>
              <span>🪵 +80 Wood</span>
              <span>💎 +5 Gems</span>
            </div>
            <button
              onClick={() => {
                engine.showPromotionModal = false;
                setIsEvolutionModalOpen(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              عرض ما تم فتحه في المملكة 🏰
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
