import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Flame,
  Shield,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  Bell,
  Heart,
  TrendingUp,
  X,
} from 'lucide-react';
import { SpacedRepetitionEngine } from '../engine/spacedRepetition';

interface ProgressAnalyticsModalProps {
  engine: SpacedRepetitionEngine;
  onClose: () => void;
}

export const ProgressAnalyticsModal: React.FC<ProgressAnalyticsModalProps> = ({
  engine,
  onClose,
}) => {
  const kingdom = engine.getKingdomState();
  const allItems = engine.getAllItems();

  const stateCounts = {
    new: allItems.filter((i) => i.state === 'new').length,
    learning: allItems.filter((i) => i.state === 'learning').length,
    reviewing: allItems.filter((i) => i.state === 'reviewing').length,
    mastered: allItems.filter((i) => i.state === 'mastered').length,
  };

  const tierNames = [
    '',
    'Tier I: Solitary Campfire',
    'Tier II: Pioneer Homestead',
    'Tier III: Thriving Hamlet',
    'Tier IV: Fortified Township',
    'Tier V: Royal Arcane Citadel',
  ];

  return (
    <div
      id="progress-analytics-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Knowledge & Realm Analytics
              </h2>
              <p className="text-xs text-slate-400">
                Visual representation of your memory stability and kingdom evolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Active Streak
              </div>
              <div className="text-2xl font-black text-orange-400 mt-2">
                {kingdom.streakDays} <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Realm Vitality
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-2">
                {Math.round(kingdom.vitalityScore * 100)}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                Mastered
              </div>
              <div className="text-2xl font-black text-purple-300 mt-2">
                {kingdom.totalItemsMastered} <span className="text-xs font-normal text-slate-400">Items</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Due Today
              </div>
              <div className="text-2xl font-black text-amber-300 mt-2">
                {kingdom.dueItemsCount} <span className="text-xs font-normal text-slate-400">Cards</span>
              </div>
            </div>
          </div>

          {/* Kingdom Evolution Stage */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-950/60 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Kingdom Progression Stage
                </span>
                <h3 className="text-lg font-extrabold text-slate-100">
                  Stage {kingdom.developmentStage ?? 0}: {kingdom.stageName}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">{kingdom.stageDescription}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg">
                S{kingdom.developmentStage ?? 0}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Learning Points (LP)</span>
                <span className="text-amber-400">{kingdom.learningPoints || 0} / {kingdom.learningPointsToNextStage || 1500} LP</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, ((kingdom.learningPoints || 0) / (kingdom.learningPointsToNextStage || 1500)) * 100))}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              The entire kingdom begins with one lone tower and expands organically through your real study and spaced-repetition memory retention.
            </p>
          </div>

          {/* Spaced-Repetition Memory Distribution */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Memory Stability Distribution
            </h4>

            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">New</div>
                <div className="text-lg font-bold text-slate-200 mt-1">{stateCounts.new}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-xs text-orange-400">Learning</div>
                <div className="text-lg font-bold text-orange-300 mt-1">{stateCounts.learning}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-xs text-blue-400">Reviewing</div>
                <div className="text-lg font-bold text-blue-300 mt-1">{stateCounts.reviewing}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-xs text-emerald-400">Mastered</div>
                <div className="text-lg font-bold text-emerald-300 mt-1">{stateCounts.mastered}</div>
              </div>
            </div>
          </div>

          {/* Tower Defense Spire Stats */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Stationary Spire Defense Power (Scaled by Knowledge)
            </h4>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Attack Power</div>
                <div className="text-base font-bold text-purple-300 mt-0.5">
                  {kingdom.heroStats.power} DPS
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Attack Speed</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {kingdom.heroStats.fireRate}/s
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Spire Shields</div>
                <div className="text-base font-bold text-emerald-300 mt-0.5">
                  {kingdom.heroStats.spireHealth} HP
                </div>
              </div>
            </div>

            {kingdom.heroStats.unlockedRunes.length > 0 && (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlocked Runes:</span>
                <span className="font-semibold text-amber-300">
                  {kingdom.heroStats.unlockedRunes.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Smart Notification Simulation */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Smart Notification Dispatch Preview
            </h4>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              {kingdom.dueItemsCount > 0 ? (
                <>
                  <span className="font-bold text-amber-400">📱 System Alert: </span>
                  &quot;{kingdom.dueItemsCount} memories are ready for review (~
                  {Math.max(1, Math.round(kingdom.dueItemsCount * 0.5))} mins). Your kingdom is waiting for today’s review.&quot;
                </>
              ) : (
                <>
                  <span className="font-bold text-emerald-400">📱 System Alert: </span>
                  &quot;All memories are currently reinforced. Next review scheduled according to retention curve.&quot;
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
