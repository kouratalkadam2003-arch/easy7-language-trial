import React from 'react';
import { GameEngine } from '../engine/gameEngine';
import { globalSpacedRepetition } from '../engine/spacedRepetition';
import { Shield, BookOpen, Sparkles, Swords } from 'lucide-react';

interface TouchControlsProps {
  engine: GameEngine;
  onOpenBuildMenu?: () => void;
  onOpenReview?: () => void;
  onOpenCurriculum?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  engine,
  onOpenBuildMenu,
  onOpenReview,
  onOpenCurriculum,
}) => {
  const kingdomState = globalSpacedRepetition.getKingdomState();
  const dueReviews = kingdomState.dueItemsCount ?? 0;
  const currentStage = kingdomState.developmentStage ?? 0;
  const warriorCount = engine.warriors.length;

  const handleContextClick = () => {
    if (engine.nearbyPlot && onOpenBuildMenu) {
      engine.selectedPlotId = engine.nearbyPlot.id;
      engine.selectedBuilding = engine.nearbyPlot.building;
      onOpenBuildMenu();
    } else {
      engine.interact();
    }
  };

  return (
    <div
      id="touch-controls-container"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center gap-2 select-none max-w-lg w-full px-4"
    >
      {/* Contextual Interaction Button if near a building/plot */}
      {engine.nearbyPlot && (
        <button
          id="btn-context-action"
          onClick={handleContextClick}
          className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold shadow-lg shadow-amber-500/20 border border-amber-300 animate-pulse transition-transform"
        >
          <span className="text-lg">🏰</span>
          <span className="text-xs uppercase tracking-wider">
            {engine.nearbyPlot.building ? 'Inspect Building' : 'Develop Plot'}
          </span>
        </button>
      )}

      {/* Autonomous Defense & Learning Quick Action Dock */}
      <div className="pointer-events-auto flex items-center gap-2.5 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-2xl">
        {/* Garrison Status Tag */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/40 text-slate-300 text-xs font-semibold">
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {warriorCount} {warriorCount === 1 ? 'Warrior' : 'Warriors'}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">
            {engine.isThreatDetected ? '• Engaged' : '• Guarding'}
          </span>
        </div>

        {/* Primary Learning CTA */}
        {dueReviews > 0 ? (
          <button
            id="quick-review-cta"
            onClick={onOpenReview}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/30 border border-amber-300 transition"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Review {dueReviews} Due (Rally Garrison)</span>
          </button>
        ) : (
          <button
            id="quick-curriculum-cta"
            onClick={onOpenCurriculum}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs border border-slate-600/60 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Study Curriculum (Stage {currentStage})</span>
          </button>
        )}
      </div>
    </div>
  );
};
