import React from 'react';
import { GameEngine } from '../engine/gameEngine';

interface QuestModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ engine, onClose }) => {
  return (
    <div id="quest-modal-overlay" className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Royal Decrees &amp; Quests</h2>
              <p className="text-xs text-slate-400">Complete kingdom milestones to earn valuable treasury bounties</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quests List */}
        <div className="p-6 flex flex-col gap-3 overflow-y-auto max-h-[70vh]">
          {engine.quests.map((quest, idx) => {
            const isActive = idx === engine.activeQuestIndex && !quest.isCompleted;
            const progress = Math.min(100, (quest.currentAmount / quest.targetAmount) * 100);

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
                  quest.isCompleted
                    ? 'bg-slate-950/50 border-emerald-900/50 opacity-75'
                    : isActive
                      ? 'bg-slate-800/90 border-amber-500/70 shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-slate-900/50 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{quest.isCompleted ? '✅' : isActive ? '⭐' : '🔒'}</span>
                    <div>
                      <h4 className={`font-bold text-sm ${quest.isCompleted ? 'text-emerald-300 line-through' : 'text-white'}`}>
                        {quest.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{quest.description}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      quest.isCompleted
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : isActive
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {quest.isCompleted ? 'Completed' : isActive ? 'Active' : 'Locked'}
                  </span>
                </div>

                {/* Progress Bar (If active) */}
                {isActive && (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div style={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all" />
                    </div>
                    <span className="text-xs font-bold text-amber-300 whitespace-nowrap">
                      {Math.min(quest.targetAmount, quest.currentAmount)} / {quest.targetAmount}
                    </span>
                  </div>
                )}

                {/* Reward display */}
                <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Bounty:</span>
                  {Object.entries(quest.reward).map(([res, amt]) => (
                    <span key={res} className="font-semibold text-amber-300">
                      {res === 'coins' ? '🪙' : res === 'gems' ? '💎' : res === 'wood' ? '🪵' : res === 'stone' ? '🪨' : '🌾'} +{amt}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
