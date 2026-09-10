import React, { useState, useEffect, useMemo } from 'react';
import { Volume2, Zap, Flame, Shield, X, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameEngine } from '../engine/gameEngine';
import { globalSpacedRepetition } from '../engine/spacedRepetition';
import { useReviewStore, ReviewCard } from '@/store/reviewStore';
import { useFarmStore } from '@/store/farmStore';
import { useUserStore } from '@/store/userStore';
import { speak, bcp47 } from '@/lib/tts';

interface VillageRaidReviewOverlayProps {
  engine: GameEngine;
  onClose: () => void;
}

interface QuizItem {
  cardId: string;
  native: string;
  translation: string;
  pronunciation?: string;
  options: string[];
}

const STARTER_CARDS_BY_LANG: Record<string, Array<{ id: string; native: string; translation: string; tier: string; pronunciation?: string }>> = {
  de: [
    { id: 'start_de_1', native: 'Hallo', translation: 'مرحباً', tier: 'core' },
    { id: 'start_de_2', native: 'Danke', translation: 'شكراً', tier: 'core' },
    { id: 'start_de_3', native: 'Guten Morgen', translation: 'صباح الخير', tier: 'core' },
    { id: 'start_de_4', native: 'Auf Wiedersehen', translation: 'إلى اللقاء', tier: 'core' },
  ],
  fr: [
    { id: 'start_fr_1', native: 'Bonjour', translation: 'مرحباً', tier: 'core' },
    { id: 'start_fr_2', native: 'Merci', translation: 'شكراً', tier: 'core' },
    { id: 'start_fr_3', native: 'Bonsoir', translation: 'مساء الخير', tier: 'core' },
    { id: 'start_fr_4', native: 'Au revoir', translation: 'إلى اللقاء', tier: 'core' },
  ],
  es: [
    { id: 'start_es_1', native: 'Hola', translation: 'مرحباً', tier: 'core' },
    { id: 'start_es_2', native: 'Gracias', translation: 'شكراً', tier: 'core' },
    { id: 'start_es_3', native: 'Buenos días', translation: 'صباح الخير', tier: 'core' },
    { id: 'start_es_4', native: 'Adiós', translation: 'إلى اللقاء', tier: 'core' },
  ],
  it: [
    { id: 'start_it_1', native: 'Ciao', translation: 'مرحباً', tier: 'core' },
    { id: 'start_it_2', native: 'Grazie', translation: 'شكراً', tier: 'core' },
    { id: 'start_it_3', native: 'Buongiorno', translation: 'صباح الخير', tier: 'core' },
    { id: 'start_it_4', native: 'Arrivederci', translation: 'إلى اللقاء', tier: 'core' },
  ],
  ja: [
    { id: 'start_ja_1', native: 'Konnichiwa', translation: 'مرحباً', tier: 'core' },
    { id: 'start_ja_2', native: 'Arigatou', translation: 'شكراً', tier: 'core' },
    { id: 'start_ja_3', native: 'Ohayou', translation: 'صباح الخير', tier: 'core' },
    { id: 'start_ja_4', native: 'Sayounara', translation: 'إلى اللقاء', tier: 'core' },
  ],
  zh: [
    { id: 'start_zh_1', native: 'Ni hao', translation: 'مرحباً', tier: 'core' },
    { id: 'start_zh_2', native: 'Xie xie', translation: 'شكراً', tier: 'core' },
    { id: 'start_zh_3', native: 'Zao shang hao', translation: 'صباح الخير', tier: 'core' },
    { id: 'start_zh_4', native: 'Zai jian', translation: 'إلى اللقاء', tier: 'core' },
  ],
  en: [
    { id: 'start_en_1', native: 'Hello', translation: 'مرحباً', tier: 'core' },
    { id: 'start_en_2', native: 'Thank you', translation: 'شكراً', tier: 'core' },
    { id: 'start_en_3', native: 'Good morning', translation: 'صباح الخير', tier: 'core' },
    { id: 'start_en_4', native: 'Goodbye', translation: 'إلى اللقاء', tier: 'core' },
  ],
};

export const VillageRaidReviewOverlay: React.FC<VillageRaidReviewOverlayProps> = ({
  engine,
  onClose,
}) => {
  const { cards } = useReviewStore();
  const { addResources } = useFarmStore();
  const { targetLanguage, uiLang } = useUserStore();
  const isAr = uiLang === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isVictory, setIsVictory] = useState(false);
  const [activeEnemiesCount, setActiveEnemiesCount] = useState(engine.enemies.length);

  // Prepare cards: Due cards first, strictly for the selected target language
  const activeCards = useMemo(() => {
    const langKey = (targetLanguage || 'en').toLowerCase();
    const langCards = cards.filter(
      (c) => c.language && c.language.toLowerCase() === langKey
    );

    const now = Date.now();
    const due = langCards.filter((c) => c.nextReviewAt <= now);
    const pool = due.length > 0 ? due : langCards.length > 0 ? langCards : [];

    if (pool.length === 0) {
      return (STARTER_CARDS_BY_LANG[langKey] || STARTER_CARDS_BY_LANG.zh) as ReviewCard[];
    }
    return pool;
  }, [cards, targetLanguage]);

  // Current summon tier preview by answer price
  const currentSummonTier = useMemo(() => {
    const cycle = streak % 3;
    if (cycle === 0) return { icon: '⚔️', name: 'مقاتل بالسيف', cost: 30, type: 'swordsman' as const };
    if (cycle === 1) return { icon: '🏹', name: 'رامي سهام ملكي', cost: 60, type: 'archer' as const };
    return { icon: '🧙‍♂️', name: 'ساحر الصواعق', cost: 100, type: 'wizard' as const };
  }, [streak]);

  // Build Quiz Deck with 4 Multiple-Choice Options each
  const quizDeck: QuizItem[] = useMemo(() => {
    const allTranslations = Array.from(new Set(activeCards.map((c) => c.translation)));
    const defaultDistractors = ['مرحباً', 'شكراً', 'صباح الخير', 'إلى اللقاء', 'نعم', 'لا', 'من فضلك', 'كيف حالك'];

    return activeCards.map((card) => {
      const correct = card.translation;
      const otherChoices = allTranslations.filter((t) => t !== correct);
      const pool = otherChoices.length >= 3 ? otherChoices : defaultDistractors.filter((d) => d !== correct);

      // Pick 3 random distractors
      const shuffledDistractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correct, ...shuffledDistractors].sort(() => Math.random() - 0.5);

      return {
        cardId: card.id,
        native: card.native,
        translation: correct,
        pronunciation: card.pronunciation,
        options,
      };
    });
  }, [activeCards]);

  const currentItem = quizDeck[currentIndex];

  // Spawn invasion on mount: Clear field soldiers (starts with 0 soldiers) and spawn gradual wave
  useEffect(() => {
    engine.prepareForRaidReview();
    const dueCount = globalSpacedRepetition.getKingdomState().dueItemsCount || 0;
    const waveCount = Math.max(3, Math.min(8, dueCount > 0 ? dueCount : 4));
    engine.spawnZombieInvasion(waveCount);

    const interval = setInterval(() => {
      setActiveEnemiesCount(engine.enemies.filter((e) => e.health > 0).length);
    }, 400);

    return () => {
      clearInterval(interval);
      engine.endRaidReview();
    };
  }, [engine]);

  // Play word audio
  const handlePlayAudio = () => {
    if (currentItem) {
      speak(currentItem.native, bcp47(targetLanguage || 'en'));
    }
  };

  // Handle User Answer Choice
  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentItem) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isMatch = option.trim().toLowerCase() === currentItem.translation.trim().toLowerCase();

    if (isMatch) {
      // 1. Dispatch Defender from castle gate by answer price (Swordsman, Archer, or Wizard)!
      engine.dispatchWarriorCharge(currentSummonTier.type);
      engine.triggerRestorationPulse(false);

      const nextStreak = streak + 1;
      setStreak(nextStreak);

      // Record SM-2 review
      useReviewStore.getState().recordCardReview(currentItem.cardId, 'good');

      // Extra lightning burst on 3 streak
      if (nextStreak % 3 === 0) {
        engine.particles.addFloatingText('⚡ LIGHTNING FRENZY!', engine.world.width / 2, engine.world.height / 2 - 50, '#38BDF8', 22, undefined, true);
        engine.camera.triggerShake(6, 0.3);
      }

      // Check if more questions remain - 1600ms allows observing the warrior duel and defeat of the monster!
      setTimeout(() => {
        if (currentIndex + 1 < quizDeck.length) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedOption(null);
          setIsAnswered(false);
        } else {
          // Cleared review wave!
          setIsVictory(true);
          engine.triggerRestorationPulse(true);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          addResources(50, 30, 2);
        }
      }, 1600);
    } else {
      // Wrong answer: Zombies push closer, record again
      setStreak(0);
      engine.camera.triggerShake(8, 0.4);
      useReviewStore.getState().recordCardReview(currentItem.cardId, 'again');

      setTimeout(() => {
        if (currentIndex + 1 < quizDeck.length) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedOption(null);
          setIsAnswered(false);
        } else {
          setIsVictory(true);
          addResources(30, 15, 0);
        }
      }, 1200);
    }
  };

  // Keyboard shortcuts (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || isVictory || !currentItem) return;
      if (e.key === '1' && currentItem.options[0]) handleSelectOption(currentItem.options[0]);
      if (e.key === '2' && currentItem.options[1]) handleSelectOption(currentItem.options[1]);
      if (e.key === '3' && currentItem.options[2]) handleSelectOption(currentItem.options[2]);
      if (e.key === '4' && currentItem.options[3]) handleSelectOption(currentItem.options[3]);
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentItem, isAnswered, isVictory]);

  return (
    <>
      {/* Top Threat & Question Progress Bar */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/40 shadow-2xl text-xs font-bold text-slate-100">
        <div className="flex items-center gap-1.5 text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>🧟 {activeEnemiesCount} {isAr ? 'أعداء يقتربون' : 'zombies approaching'}</span>
        </div>

        <span className="text-slate-600">•</span>

        <div className="flex items-center gap-1 text-amber-300">
          <Shield className="w-3.5 h-3.5" />
          <span>{currentIndex + 1} / {quizDeck.length}</span>
        </div>

        {streak >= 2 && (
          <>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-amber-400 animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{streak} Streak!</span>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer mr-1"
          title="إنهاء المراجعة"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Floating Interactive 4-Choices MCQ Panel */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-3 select-none">
        <div className="bg-slate-950/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-3xl p-4 shadow-2xl shadow-black/80 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {currentItem && (
            <>
              {/* Question Banner */}
              <div className="flex items-center justify-between gap-3 bg-slate-900/80 rounded-2xl p-3 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                      {isAr ? 'أجب لاستدعاء المدافعين:' : 'Answer to summon defenders:'}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <span>{currentSummonTier.icon}</span>
                      <span>استدعاء: {currentSummonTier.name}</span>
                      <span className="text-amber-400 font-mono">({currentSummonTier.cost}🪙)</span>
                    </span>
                  </div>
                  <div className="text-xl font-black text-white tracking-wide mt-0.5" dir="ltr">
                    {currentItem.native}
                  </div>
                  {currentItem.pronunciation && (
                    <div className="text-xs text-slate-400 font-mono">
                      /{currentItem.pronunciation}/
                    </div>
                  )}
                </div>

                {/* Audio Button */}
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="w-10 h-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 flex items-center justify-center active:scale-95 transition cursor-pointer"
                  title="استماع"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* 4 Interactive Choice Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {currentItem.options.map((option, idx) => {
                  let btnStyle = 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 text-slate-100 hover:border-amber-500/50';

                  if (isAnswered) {
                    if (option === currentItem.translation) {
                      btnStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse';
                    } else if (option === selectedOption) {
                      btnStyle = 'bg-rose-600 border-rose-400 text-white';
                    } else {
                      btnStyle = 'bg-slate-900/40 border-slate-800/40 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(option)}
                      className={`p-3 rounded-xl border-2 font-bold text-xs transition-all duration-150 flex items-center justify-between active:scale-95 cursor-pointer text-right ${btnStyle}`}
                      dir="rtl"
                    >
                      <span className="truncate">{option}</span>
                      <span className="w-5 h-5 rounded-full bg-black/30 text-[10px] font-mono flex items-center justify-center text-slate-400 shrink-0 mr-1.5">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* VICTORY OVERLAY */}
      {isVictory && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 text-center shadow-2xl text-white space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 text-3xl animate-bounce">
              👑
            </div>
            <h2 className="text-2xl font-black text-amber-400">
              {isAr ? 'نصر ملحمي! أتممت صد الغارة' : 'Raid Repelled! Victory'}
            </h2>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'قاتل محاربوك ببسالة وأتممت مراجعة كافة العبارات بنجاح!'
                : 'Your warriors charged valiantly and all phrases were reviewed successfully!'}
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 flex items-center justify-around text-xs font-mono font-bold text-amber-300">
              <span>🪙 +50 Gold</span>
              <span>🪵 +30 Wood</span>
              <span>💎 +2 Gems</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              {isAr ? 'متابعة البناء والتعلم' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
