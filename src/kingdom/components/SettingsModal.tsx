import React, { useState } from 'react';
import { soundManager } from '../audio/soundManager';
import { GameEngine } from '../engine/gameEngine';

interface SettingsModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ engine, onClose }) => {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [muted, setMuted] = useState(soundManager.isSoundMuted());

  const handleSave = () => {
    engine.saveGame();
    setSaveStatus('Progress saved to local storage!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundManager.setMuted(next);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to restart your kingdom? All buildings and resources will reset.')) {
      engine.resetGame();
    }
  };

  return (
    <div id="settings-modal-overlay" className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Kingdom Settings &amp; Guide</h2>
              <p className="text-xs text-slate-400">Audio controls, save options, and keybindings reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Audio Controls */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="font-bold text-white text-sm">Audio &amp; Synthesized Sound</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Procedural Sound Effects (Web Audio API)</span>
              <button
                onClick={handleToggleMute}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors ${
                  muted ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {muted ? '🔇 Muted' : '🔊 Sound Enabled'}
              </button>
            </div>
          </div>

          {/* Controls Reference */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
            <h3 className="font-bold text-white text-sm">Keyboard &amp; Touch Controls</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Move Hero</span>
                <span className="font-bold text-amber-300">W A S D / Arrows</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Sword Strike</span>
                <span className="font-bold text-amber-300">Space / Click</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Swift Dash</span>
                <span className="font-bold text-amber-300">Shift</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Interact / Chop</span>
                <span className="font-bold text-amber-300">E or F / Tap</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              📱 Mobile: Use the bottom-left virtual joystick for 360° movement and bottom-right buttons for combat and gathering.
            </p>
          </div>

          {/* Save & Reset Actions */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>💾</span>
              <span>Data & Reset Management / إدارة البيانات والتصفير</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="btn-save-progress"
                onClick={handleSave}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>💾 Save Progress</span>
                <span className="text-[10px] text-blue-200">(حفظ التقدم)</span>
              </button>

              <button
                id="btn-reset-game-confirm"
                onClick={handleReset}
                className="py-3 px-4 rounded-2xl bg-rose-950/90 hover:bg-rose-900 active:scale-95 text-rose-200 border border-rose-700 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                <span className="text-base group-hover:rotate-180 transition-transform duration-300">🔄</span>
                <span>تصفير اللعبة</span>
                <span className="text-[10px] text-rose-300 font-mono">(Reset All)</span>
              </button>
            </div>
            {saveStatus && <p className="text-xs text-center text-emerald-400 font-semibold animate-bounce">{saveStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
