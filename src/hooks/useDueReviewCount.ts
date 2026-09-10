import { useState, useEffect, useMemo } from 'react';
import { useReviewStore, isErroneousEnglishCard } from '@/store/reviewStore';
import { useUserStore } from '@/store/userStore';
import { globalSpacedRepetition } from '@/kingdom/engine/spacedRepetition';

/**
 * Custom hook that returns the exact count of review items currently due
 * for the learner's active target language.
 */
export function useDueReviewCount(): number {
  const cards = useReviewStore((s) => s.cards);
  const targetLanguage = useUserStore((s) => s.targetLanguage);
  const [, setTick] = useState(0);

  // Force re-check every 30 seconds so newly due cards are reflected immediately
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const dueCount = useMemo(() => {
    const now = Date.now();
    const activeLang = (
      targetLanguage ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('target_lang') || localStorage.getItem('easy7_target_language')
        : '') ||
      'de'
    ).toLowerCase();

    // 1. Cards due in ReviewStore
    const dueInStore = cards.filter((c) => {
      if (!c.language || c.language.toLowerCase() !== activeLang) return false;
      if (activeLang === 'de' && isErroneousEnglishCard(c.native)) return false;
      return c.nextReviewAt <= now;
    }).length;

    // 2. Items due in Kingdom Spaced Repetition
    let dueInKingdom = 0;
    try {
      const queue = globalSpacedRepetition.getDueReviewQueue();
      dueInKingdom = queue.filter(
        (item) => !(activeLang === 'de' && isErroneousEnglishCard(item.primaryText))
      ).length;
    } catch (_) {}

    return Math.max(dueInStore, dueInKingdom);
  }, [cards, targetLanguage]);

  return dueCount;
}
