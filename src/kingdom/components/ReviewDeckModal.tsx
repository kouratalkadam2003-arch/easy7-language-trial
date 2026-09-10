import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  Zap,
  Volume2,
  X,
} from 'lucide-react';
import { LearningItemRecord, ReviewRating } from '../types/learning';
import { SpacedRepetitionEngine } from '../engine/spacedRepetition';
import { speakText } from '../audio/speech';
import { useReviewStore } from '@/store/reviewStore';
import { useFarmStore } from '@/store/farmStore';
import { cleanWord, getWordGloss } from '@/utils/wordTranslator';

interface ReviewDeckModalProps {
  engine: SpacedRepetitionEngine;
  onClose: () => void;
  onReviewCompleted?: () => void;
  initialItemId?: string;
}

export const ReviewDeckModal: React.FC<ReviewDeckModalProps> = ({
  engine,
  onClose,
  onReviewCompleted,
  initialItemId,
}) => {
  const [queue, setQueue] = useState<LearningItemRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<{
    reviewedCount: number;
    gainedTimber: number;
    gainedStone: number;
    gainedEssence: number;
    gainedGold: number;
  }>({
    reviewedCount: 0,
    gainedTimber: 0,
    gainedStone: 0,
    gainedEssence: 0,
    gainedGold: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let dueItems = [...engine.getDueReviewQueue()];
    if (dueItems.length === 0) {
      // If none due, allow practice of recent items or all active
      const allItems = engine.getAllItems();
      dueItems = allItems.slice(0, 10);
    }

    if (initialItemId) {
      const idx = dueItems.findIndex((it) => it.id === initialItemId);
      if (idx > 0) {
        const item = dueItems.splice(idx, 1)[0];
        dueItems.unshift(item);
      } else if (idx === -1) {
        const directItem = engine.getItemById(initialItemId);
        if (directItem) {
          dueItems.unshift(directItem);
        }
      }
    }

    setQueue(dueItems);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
  }, [engine, initialItemId]);

  // Keyboard shortcuts (Space = flip, 1/2/3/4 = rate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || queue.length === 0) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isComplete, currentIndex, queue]);

  const currentCard = queue[currentIndex];

  const handleRate = (rating: ReviewRating) => {
    if (!currentCard) return;

    const result = engine.recordReview(currentCard.id, rating);
    
    // Sync with Easy7 Review Store if item exists there
    const easyRatingMap: Record<number, 'again' | 'hard' | 'good' | 'easy'> = {
      1: 'again',
      2: 'hard',
      3: 'good',
      4: 'easy',
    };
    const easyCard = useReviewStore.getState().cards.find(c => c.id === currentCard.id);
    if (easyCard) {
      useReviewStore.getState().recordCardReview(currentCard.id, easyRatingMap[rating] || 'good');
    }
    // Sync gold & wood to Easy7 Farm Store
    useFarmStore.getState().addResources(
      result.resourceReward.gold,
      result.resourceReward.timber,
      rating === 4 ? 1 : 0
    );

    // Aggregate rewards
    setSessionResults((prev) => ({
      reviewedCount: prev.reviewedCount + 1,
      gainedTimber: prev.gainedTimber + result.resourceReward.timber,
      gainedStone: prev.gainedStone + result.resourceReward.stone,
      gainedEssence: prev.gainedEssence + result.resourceReward.essence,
      gainedGold: prev.gainedGold + result.resourceReward.gold,
    }));

    // Trigger mini burst
    if (rating >= 3) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.75 },
      });
    }

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (onReviewCompleted) {
        onReviewCompleted();
      }
    }
  };

  // Preview estimated next interval for rating buttons
  const getIntervalPreview = (rating: ReviewRating) => {
    if (!currentCard) return '1d';
    const cur = currentCard.intervalDays || 1;
    if (rating === 1) return '1d';
    if (rating === 2) return `${Math.max(1, Math.round(cur * 1.3))}d`;
    if (rating === 3) return `${Math.max(2, Math.round(cur * 2.2))}d`;
    if (rating === 4) return `${Math.max(4, Math.round(cur * 3.4))}d`;
    return '1d';
  };

  return (
    <div
      id="review-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Spaced Repetition Review
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {queue.length > 0 ? `${currentIndex + 1} / ${queue.length}` : '0 Items'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentCard?.subject ? `${currentCard.subject} • ${currentCard.categoryTag || 'Phrase'}` : 'Memory Deck'}
              </p>
            </div>
          </div>
          <button
            id="close-review-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col justify-center">
          {queue.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">All Memories Are Sharp!</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                No items are currently due for review. Your kingdom’s vitality is at full strength.
                Browse the curriculum to learn new phrases or concepts!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-semibold text-slate-950 transition"
              >
                Return to Realm
              </button>
            </div>
          ) : isComplete ? (
            /* Session Completed Screen */
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
                <Award className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-100">Review Session Complete!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  You reinforced <span className="text-amber-400 font-bold">{sessionResults.reviewedCount} memories</span>.
                  Your knowledge vitality has surged!
                </p>
              </div>

              {/* Resource Rewards Earned */}
              <div className="grid grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="text-center p-2 rounded-lg bg-amber-950/30 border border-amber-800/30">
                  <div className="text-xs text-amber-400 font-medium">Timber</div>
                  <div className="text-lg font-bold text-amber-300">+{sessionResults.gainedTimber}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <div className="text-xs text-slate-300 font-medium">Stone</div>
                  <div className="text-lg font-bold text-slate-200">+{sessionResults.gainedStone}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-950/30 border border-purple-800/30">
                  <div className="text-xs text-purple-400 font-medium">Essence</div>
                  <div className="text-lg font-bold text-purple-300">+{sessionResults.gainedEssence}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-950/30 border border-yellow-800/30">
                  <div className="text-xs text-yellow-400 font-medium">Gold</div>
                  <div className="text-lg font-bold text-yellow-300">+{sessionResults.gainedGold}</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition"
              >
                Claim Rewards & Continue
              </button>
            </div>
          ) : (
            /* Active Flashcard */
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                />
              </div>

              {/* The Card */}
              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                className={`relative min-h-[220px] p-6 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isFlipped
                    ? 'bg-slate-950/90 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Card Header Info */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    {currentCard.location
                      ? `📍 ${currentCard.location.buildingName} (${currentCard.location.boundEntityRole === 'farmer' ? '🌾 مزارع' : currentCard.location.boundEntityRole === 'lumberjack' ? '🪓 حطاب' : currentCard.location.boundEntityRole === 'miner' ? '⛏️ بنّاء' : currentCard.location.boundEntityRole === 'merchant' ? '🪙 تاجر' : currentCard.location.boundEntityRole === 'warrior' ? '⚔️ مقاتل' : '🏡 ساكن'})`
                      : currentCard.sourceLessonId || 'Learning Unit'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Stability: {currentCard.stability}d
                  </span>
                </div>

                {/* Card Primary Content (Front) */}
                <div className="text-center py-4 my-auto">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-wide font-sans">
                      {currentCard.primaryText}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard.primaryText, currentCard.subject);
                      }}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  {!isFlipped && (
                    <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" /> Tap card or press Space to reveal answer
                    </p>
                  )}
                </div>

                {/* Card Revealed Content (Back) */}
                <AnimatePresence>
                  {isFlipped && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="pt-4 border-t border-slate-800 space-y-3"
                    >
                      {/* Interlinear breakdown if card has multiple words */}
                      {currentCard.primaryText.trim().split(/\s+/).length > 1 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-2" dir="ltr">
                          {currentCard.primaryText.trim().split(/\s+/).map((word, wIdx) => {
                            const clean = cleanWord(word);
                            const gloss = getWordGloss(clean, (currentCard.subject || 'en').toLowerCase());
                            return (
                              <div key={wIdx} className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 shadow-xs">
                                <span className="text-xs sm:text-sm font-black text-slate-200">{word}</span>
                                <span className="text-[10px] sm:text-xs font-bold text-amber-400 mt-0.5" dir="rtl">
                                  {gloss || '...'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-300">
                          {currentCard.secondaryText}
                        </div>
                        {currentCard.contextOrNotes && (
                          <div className="text-xs text-slate-400 mt-1 italic max-w-md mx-auto">
                            💡 {currentCard.contextOrNotes}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Recall Rating Buttons (Only visible when flipped) */}
              <div className="min-h-[72px]">
                {isFlipped ? (
                  <div className="grid grid-cols-4 gap-2.5">
                    {/* 1: Again */}
                    <button
                      id="rate-again-btn"
                      onClick={() => handleRate(1)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-bold transition group"
                    >
                      <span className="text-xs text-red-400 font-mono">1 • Again</span>
                      <span className="text-sm font-extrabold">{getIntervalPreview(1)}</span>
                    </button>

                    {/* 2: Hard */}
                    <button
                      id="rate-hard-btn"
                      onClick={() => handleRate(2)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-950/40 hover:bg-orange-900/60 border border-orange-800/40 text-orange-300 font-bold transition group"
                    >
                      <span className="text-xs text-orange-400 font-mono">2 • Hard</span>
                      <span className="text-sm font-extrabold">{getIntervalPreview(2)}</span>
                    </button>

                    {/* 3: Good */}
                    <button
                      id="rate-good-btn"
                      onClick={() => handleRate(3)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 font-bold transition group"
                    >
                      <span className="text-xs text-emerald-400 font-mono">3 • Good</span>
                      <span className="text-sm font-extrabold">{getIntervalPreview(3)}</span>
                    </button>

                    {/* 4: Easy */}
                    <button
                      id="rate-easy-btn"
                      onClick={() => handleRate(4)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/40 text-sky-300 font-bold transition group"
                    >
                      <span className="text-xs text-sky-400 font-mono">4 • Easy</span>
                      <span className="text-sm font-extrabold">{getIntervalPreview(4)}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
                  >
                    Reveal Translation / Answer (Space)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
