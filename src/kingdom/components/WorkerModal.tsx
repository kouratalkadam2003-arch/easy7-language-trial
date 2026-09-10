import React, { useState } from 'react';
import { GameEngine } from '../engine/gameEngine';
import { WorkerJob } from '../types/game';

interface WorkerModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const WorkerModal: React.FC<WorkerModalProps> = ({ engine, onClose }) => {
  const [selectedRecruitJob, setSelectedRecruitJob] = useState<WorkerJob>('lumberjack');
  const recruitCost = { food: 25, coins: 20 };
  const canAfford = engine.canAfford(recruitCost);
  const isPopMaxed = engine.population.current >= engine.population.max;

  const handleRecruit = () => {
    if (canAfford && !isPopMaxed) {
      engine.recruitWorker(selectedRecruitJob);
    }
  };

  return (
    <div id="worker-modal-overlay" className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Worker Guild &amp; Automation</h2>
              <p className="text-xs text-slate-400">
                Kingdom Population: <span className="text-amber-400 font-bold">{engine.population.current}</span> /{' '}
                <span className="text-white font-bold">{engine.population.max}</span> (Build Cottages to expand)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Recruitment Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Recruit New Villager</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Cost:</span>
                <span className="px-2 py-0.5 rounded-md bg-green-950 text-green-300 border border-green-800 font-bold">🌾 25 Food</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 font-bold">🪙 20 Coins</span>
              </div>
            </div>

            {/* Job Selection Chips */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'lumberjack', label: 'Lumberjack', icon: '🪓', desc: 'Gathers Timber' },
                  { id: 'miner', label: 'Miner', icon: '⛏️', desc: 'Mines Stone' },
                  { id: 'farmer', label: 'Farmer', icon: '🌾', desc: 'Harvests Food' },
                ] as const
              ).map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedRecruitJob(job.id)}
                  className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                    selectedRecruitJob === job.id
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl mb-1">{job.icon}</span>
                  <span className="text-xs font-bold">{job.label}</span>
                  <span className="text-[10px] text-slate-400">{job.desc}</span>
                </button>
              ))}
            </div>

            <button
              id="btn-recruit-worker"
              onClick={handleRecruit}
              disabled={!canAfford || isPopMaxed}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                !isPopMaxed && canAfford
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isPopMaxed ? 'Population Cap Reached (Build Cottages)' : canAfford ? 'Recruit Villager' : 'Insufficient Food / Coins'}
            </button>
          </div>

          {/* Active Workers List */}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-white text-sm flex items-center justify-between">
              <span>Active Citizens in the Field</span>
              <span className="text-xs text-slate-400 font-normal">{engine.workers.length} Working</span>
            </h3>

            {engine.workers.length === 0 ? (
              <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No active workers yet. Recruit your first lumberjack or miner to automate resource collection!
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {engine.workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-1.5 bg-slate-900 rounded-xl">
                        {worker.job === 'lumberjack' ? '🪓' : worker.job === 'miner' ? '⛏️' : '🌾'}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{worker.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span className="capitalize text-amber-400 font-medium">{worker.job}</span>
                          <span>•</span>
                          <span className="text-[11px] text-slate-400">
                            {worker.state === 'idle'
                              ? 'Searching for node'
                              : worker.state === 'walking_to_node'
                                ? 'Traveling to site'
                                : worker.state === 'working'
                                  ? 'Harvesting...'
                                  : `Returning (${worker.carriedResource.amount} ${worker.carriedResource.type})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Job Reassignment */}
                    <div className="flex items-center gap-1">
                      {(['lumberjack', 'miner', 'farmer'] as const).map((job) => (
                        <button
                          key={job}
                          onClick={() => engine.changeWorkerJob(worker.id, job)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                            worker.job === job ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {job === 'lumberjack' ? '🪓' : job === 'miner' ? '⛏️' : '🌾'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
