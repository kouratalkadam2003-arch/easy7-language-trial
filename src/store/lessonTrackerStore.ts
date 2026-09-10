import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useReviewStore, ReviewCard, isErroneousEnglishCard } from './reviewStore';

export interface PhraseTrackerRecord {
  native: string;
  translation: string;
  pronunciation?: string;
  language?: string;
  // Stage: Knife Hit
  knifeHitAttempts: number;
  knifeHitMistakes: number;
  knifeHitPassed: boolean;
  // Stage: Zombie Fight
  zombieFightDefeats: number;
  zombieFightMistakes: number;
  // Stage: Reading
  readingListened: boolean;
  readingRepeated: boolean;
  // Stage: Real Roleplay
  roleplaySpoken: boolean;
  roleplayLifelineUsed: boolean;
  // Dynamic Trajectory
  trajectory?: 'conquered' | 'mastered' | 'struggled' | 'steady';
  srsClassification?: 'easy' | 'medium' | 'hard';
  reviewIntervalMinutes?: number;
  diagnosticNote?: string;
}

export interface MasterEvaluationResult {
  accuracyScore: number;
  conqueredPhrases: PhraseTrackerRecord[];   // تعثر في الألعاب ولكن أتقنها في المحادثة
  masteredPhrases: PhraseTrackerRecord[];    // متقنة تماماً من البداية
  needsReviewPhrases: PhraseTrackerRecord[]; // واجه فيها صعوبة مستمرة ومجدولة في المراجعة
  totalPhrases: number;
  srsCardsAddedCount: number;
  coachPersonalMessage: string;
}

interface LessonTrackerState {
  records: Record<string, PhraseTrackerRecord>; // key is normalized native text
  initLessonPhrases: (dialogue: Array<{ native: string; translation: string; pronunciation?: string }>, lessonLanguage?: string) => void;
  recordKnifeHit: (phraseText: string, isCorrect: boolean) => void;
  recordZombieFight: (phraseText: string, isCorrect: boolean) => void;
  recordReading: (phraseText: string, repeated?: boolean) => void;
  recordRoleplay: (phraseText: string, neededLifeline: boolean, isSpoken?: boolean) => void;
  generateMasterEvaluation: (fallbackLang?: string) => MasterEvaluationResult;
  resetTracker: () => void;
}

function normalizeKey(text: string): string {
  return (text || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'؛،؟]/g, '');
}

export const useLessonTrackerStore = create<LessonTrackerState>()(
  persist(
    (set, get) => ({
      records: {},

      initLessonPhrases: (dialogue, lessonLanguage) => {
        set((state) => {
          const nextRecords = { ...state.records };
          dialogue.forEach((line) => {
            const key = normalizeKey(line.native);
            if (!nextRecords[key]) {
              nextRecords[key] = {
                native: line.native,
                translation: line.translation,
                pronunciation: line.pronunciation,
                language: lessonLanguage,
                knifeHitAttempts: 0,
                knifeHitMistakes: 0,
                knifeHitPassed: false,
                zombieFightDefeats: 0,
                zombieFightMistakes: 0,
                readingListened: false,
                readingRepeated: false,
                roleplaySpoken: false,
                roleplayLifelineUsed: false,
              };
            }
          });
          return { records: nextRecords };
        });
      },

      recordKnifeHit: (phraseText, isCorrect) => {
        if (!phraseText) return;
        const key = normalizeKey(phraseText);
        set((state) => {
          const existing = state.records[key] || {
            native: phraseText,
            translation: '',
            knifeHitAttempts: 0,
            knifeHitMistakes: 0,
            knifeHitPassed: false,
            zombieFightDefeats: 0,
            zombieFightMistakes: 0,
            readingListened: false,
            readingRepeated: false,
            roleplaySpoken: false,
            roleplayLifelineUsed: false,
          };

          return {
            records: {
              ...state.records,
              [key]: {
                ...existing,
                knifeHitAttempts: existing.knifeHitAttempts + 1,
                knifeHitMistakes: isCorrect ? existing.knifeHitMistakes : existing.knifeHitMistakes + 1,
                knifeHitPassed: isCorrect ? true : existing.knifeHitPassed,
              },
            },
          };
        });
      },

      recordZombieFight: (phraseText, isCorrect) => {
        if (!phraseText) return;
        const key = normalizeKey(phraseText);
        set((state) => {
          const existing = state.records[key] || {
            native: phraseText,
            translation: '',
            knifeHitAttempts: 0,
            knifeHitMistakes: 0,
            knifeHitPassed: false,
            zombieFightDefeats: 0,
            zombieFightMistakes: 0,
            readingListened: false,
            readingRepeated: false,
            roleplaySpoken: false,
            roleplayLifelineUsed: false,
          };

          return {
            records: {
              ...state.records,
              [key]: {
                ...existing,
                zombieFightDefeats: isCorrect ? existing.zombieFightDefeats + 1 : existing.zombieFightDefeats,
                zombieFightMistakes: isCorrect ? existing.zombieFightMistakes : existing.zombieFightMistakes + 1,
              },
            },
          };
        });
      },

      recordReading: (phraseText, repeated = false) => {
        if (!phraseText) return;
        const key = normalizeKey(phraseText);
        set((state) => {
          const existing = state.records[key] || {
            native: phraseText,
            translation: '',
            knifeHitAttempts: 0,
            knifeHitMistakes: 0,
            knifeHitPassed: false,
            zombieFightDefeats: 0,
            zombieFightMistakes: 0,
            readingListened: false,
            readingRepeated: false,
            roleplaySpoken: false,
            roleplayLifelineUsed: false,
          };

          return {
            records: {
              ...state.records,
              [key]: {
                ...existing,
                readingListened: true,
                readingRepeated: repeated || existing.readingRepeated,
              },
            },
          };
        });
      },

      recordRoleplay: (phraseText, neededLifeline, isSpoken = true) => {
        if (!phraseText) return;
        const key = normalizeKey(phraseText);
        set((state) => {
          const existing = state.records[key] || {
            native: phraseText,
            translation: '',
            knifeHitAttempts: 0,
            knifeHitMistakes: 0,
            knifeHitPassed: false,
            zombieFightDefeats: 0,
            zombieFightMistakes: 0,
            readingListened: false,
            readingRepeated: false,
            roleplaySpoken: false,
            roleplayLifelineUsed: false,
          };

          return {
            records: {
              ...state.records,
              [key]: {
                ...existing,
                roleplaySpoken: isSpoken || existing.roleplaySpoken,
                roleplayLifelineUsed: neededLifeline || existing.roleplayLifelineUsed,
              },
            },
          };
        });
      },

      generateMasterEvaluation: (fallbackLang?: string) => {
        const { records } = get();
        const list = Object.values(records);
        if (list.length === 0) {
          return {
            accuracyScore: 100,
            conqueredPhrases: [],
            masteredPhrases: [],
            needsReviewPhrases: [],
            totalPhrases: 0,
            srsCardsAddedCount: 0,
            coachPersonalMessage: 'أداء ممتاز في جميع المراحل!',
          };
        }

        const conquered: PhraseTrackerRecord[] = [];
        const mastered: PhraseTrackerRecord[] = [];
        const needsReview: PhraseTrackerRecord[] = [];
        const cardsToSchedule: ReviewCard[] = [];

        const targetLangFromStorage = typeof window !== 'undefined'
          ? (localStorage.getItem('target_lang') || localStorage.getItem('easy7_target_language') || '')
          : '';
        const defaultLang = (fallbackLang || targetLangFromStorage || 'en').toLowerCase();

        list.forEach((item) => {
          const hadGameMistake = item.knifeHitMistakes > 0 || item.zombieFightMistakes > 0;
          const hadGameSuccess = item.knifeHitPassed || item.zombieFightDefeats > 0;
          const passedInRoleplay = item.roleplaySpoken && !item.roleplayLifelineUsed;
          const usedLifelineInRoleplay = item.roleplayLifelineUsed;

          // 1. سيناريو التغلب والانتصار (Conquered)
          // واجه خطأ في الألعاب، لكنه تجاوز الصعوبة وأتقنها بصوته في المحادثة المباشرة!
          if (hadGameMistake && passedInRoleplay) {
            item.trajectory = 'conquered';
            item.srsClassification = 'medium';
            item.reviewIntervalMinutes = 1440; // 24 hours
            item.diagnosticNote = 'واجهت فيها صعوبة في ساحة الألعاب، ولكنك تغلبت عليها وأتقنتها بصوتك في المحادثة! 🌟';
            conquered.push(item);
          }
          // 2. سيناريو الإتقان التام (Mastered)
          // أتقنها في المحادثة بدون أخطاء، أو أنجزها في الألعاب والقراءة بدون أي خطأ
          else if (!hadGameMistake && !usedLifelineInRoleplay && (passedInRoleplay || hadGameSuccess || item.readingRepeated)) {
            item.trajectory = 'mastered';
            item.srsClassification = 'easy';
            item.reviewIntervalMinutes = 4320; // 3 days
            item.diagnosticNote = 'أتقنتها بامتياز وبدون أي تردد أو خطأ في جميع المراحل! 👑';
            mastered.push(item);
          }
          // 3. سيناريو الحاجة إلى التثبيت والمراجعة (Needs Review / Hard)
          else {
            item.trajectory = 'struggled';
            item.srsClassification = 'hard';
            item.reviewIntervalMinutes = 10; // 10 minutes (عاجل)
            item.diagnosticNote = usedLifelineInRoleplay
              ? 'احتاجت همسة مساعدة في المحادثة، تم إيداعها للمراجعة التلقائية لترسيخها.'
              : hadGameMistake
              ? 'تكررت الصعوبة في ساحة الألعاب، تم إيداعها بأعلى أولوية في مراجعتك الذكية.'
              : 'تمت جدولتها في المراجعة الذكية لترسيخها في الذاكرة طويلة المدى.';
            needsReview.push(item);
          }

          let cardLang = (item.language || defaultLang).toLowerCase();
          // Never allow English sentences to be saved under German (de)
          if (cardLang === 'de' && isErroneousEnglishCard(item.native)) {
            cardLang = 'en';
          }

          // Build ReviewCard for Spaced Repetition (SRS)
          cardsToSchedule.push({
            id: `srs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            native: item.native,
            translation: item.translation,
            pronunciation: item.pronunciation,
            tier: item.srsClassification === 'hard' ? 'core' : item.srsClassification === 'medium' ? 'medium' : 'secondary',
            addedAt: Date.now(),
            nextReviewAt: Date.now() + (item.reviewIntervalMinutes || 1440) * 60 * 1000,
            intervalMinutes: item.reviewIntervalMinutes || 1440,
            language: cardLang,
          });
        });

        // Add all cards into ReviewStore automatically in the background
        if (cardsToSchedule.length > 0) {
          useReviewStore.getState().addCards(cardsToSchedule);
        }

        const accuracyScore = Math.round(((mastered.length + conquered.length) / list.length) * 100);

        let coachPersonalMessage = '';
        if (conquered.length > 0) {
          coachPersonalMessage = `أروع ما في درسك اليوم هو إصرارك! استطعت التغلب على (${conquered.length}) عبارات كانت صعبة في الألعاب وأتقنتها بصوتك في المحادثة! 👏🔥`;
        } else if (accuracyScore >= 90) {
          coachPersonalMessage = 'أداء أسطوري استثنائي! ذاكرتك كانت حادة في كل مرحلة من السكين إلى المحادثة! 👑';
        } else {
          coachPersonalMessage = 'خطوة ممتازة اليوم! تم حفظ العبارات الصعبة تلقائياً في جدول مراجعتك الذكي لتثبيتها بهدوء. 🧠📦';
        }

        return {
          accuracyScore,
          conqueredPhrases: conquered,
          masteredPhrases: mastered,
          needsReviewPhrases: needsReview,
          totalPhrases: list.length,
          srsCardsAddedCount: cardsToSchedule.length,
          coachPersonalMessage,
        };
      },

      resetTracker: () => {
        set({ records: {} });
      },
    }),
    {
      name: 'lingo-lesson-tracker-store',
    }
  )
);
