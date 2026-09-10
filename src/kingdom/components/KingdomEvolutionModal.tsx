import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  X,
} from 'lucide-react';
import { KingdomLearningState } from '../types/learning';
import { useUserStore } from '@/store/userStore';
import { useReviewStore } from '@/store/reviewStore';

interface KingdomEvolutionModalProps {
  kingdomState: KingdomLearningState;
  onClose: () => void;
  onOpenReview?: () => void;
}

interface StageDefinition {
  stage: number;
  titleAr: string;
  titleEn: string;
  icon: string;
  descAr: string;
  descEn: string;
  requiredLp: number;
  requiredLessonsHint: string;
  unlocksAr: string[];
}

const STAGES: StageDefinition[] = [
  {
    stage: 0,
    titleAr: 'برج الاستطلاع المنعزل',
    titleEn: 'Lone Sentry Tower',
    icon: '🏹',
    descAr: 'بطل وحيد يحرس برجاً حجرياً وسط الطبيعة البرية. البداية المتواضعة لرحلة التعلم.',
    descEn: 'One lone hero defending a solitary outpost in the wilderness.',
    requiredLp: 0,
    requiredLessonsHint: 'مرحلة البداية',
    unlocksAr: ['برج استطلاع حجري', 'بطل حارس وحيد', 'طبيعة برية نقية'],
  },
  {
    stage: 1,
    titleAr: 'المخيم الأول والمأوى الخشبي',
    titleEn: 'Pioneer Camp & Shelter',
    icon: '🏕️',
    descAr: 'كوخ قروي دافئ، موقد نار يضيء الساحة، ودخان هادئ يتصاعد من المدخنة مع أول قروي.',
    descEn: 'A cozy wooden shelter, warm campfire, and early settlers.',
    requiredLp: 100,
    requiredLessonsHint: 'درس واحد أو 5 كلمات',
    unlocksAr: ['كوخ ريفي دافئ', 'موقد نار الساحة', 'دخان المداخن المتصاعد', 'أول قروي متجول'],
  },
  {
    stage: 2,
    titleAr: 'المزرعة والريف الذهبي',
    titleEn: 'Homestead Farm',
    icon: '🌾',
    descAr: 'حقول قمح ذهبية ناضجة ومستودع حبوب، مزارعون يحصدون الخير ومصابيح ريفية تضيء الطرقات.',
    descEn: 'Lush golden wheat fields, granary barn, and farming life.',
    requiredLp: 300,
    requiredLessonsHint: '3 دروس أو 15 كلمة',
    unlocksAr: ['مزارع قمح ذهبية', 'مستودع الحبوب الريفي', 'مزارعون يجمعون المحصول', 'مصابيح الطرقات الليلية'],
  },
  {
    stage: 3,
    titleAr: 'البلدة الحرفية العامرة',
    titleEn: 'Thriving Village',
    icon: '🪵',
    descAr: 'ورشات نجارة ومناجم حجارة، حرفيون وعمال يطورون مباني القرية، وفارسان لحماية السكان.',
    descEn: 'Lumber workshops, stone quarries, and active craftsmen.',
    requiredLp: 600,
    requiredLessonsHint: '6 دروس أو 30 كلمة',
    unlocksAr: ['ورشة الحطابين والمناجم', 'عمال يجمعون الموارد', 'تعبيد الطرق بالحجارة', 'فارسان لحماية البوابة'],
  },
  {
    stage: 4,
    titleAr: 'المقاطعة المحصنة وسوق التجارة',
    titleEn: 'Fortified Township',
    icon: '🏰',
    descAr: 'سوق تجاري بمظلات ملونة، أسوار حجرية منيعة وأبراج مراقبة متعددة تحمي قريتك العامرة.',
    descEn: 'Stone walls, watchtowers, and a bustling merchant market.',
    requiredLp: 1200,
    requiredLessonsHint: '12 درساً أو 60 كلمة',
    unlocksAr: ['سوق تجاري بمظلات ملونة', 'أبراج دفاعية متعددة', 'أسوار حجرية منيعة', '4 فرسان حراس'],
  },
  {
    stage: 5,
    titleAr: 'قلعة الحكمة الإمبراطورية',
    titleEn: 'Royal Arcane Citadel',
    icon: '👑',
    descAr: 'إمبراطورية رخامية كبرى مشعة ببلورات الحكمة، أعلام ملكية ترفرف، وفيلق كامل من الأبطال.',
    descEn: 'A majestic empire glowing with arcane crystals, grand knights, and ultimate knowledge.',
    requiredLp: 2000,
    requiredLessonsHint: '20+ درساً أو 100 كلمة',
    unlocksAr: ['قلعة رخامية إمبراطورية', 'بلورة الحكمة المشعة', '6 أبطال وفرسان ملكيون', 'سكان وقرويون في كل مكان'],
  },
];

export const KingdomEvolutionModal: React.FC<KingdomEvolutionModalProps> = ({
  kingdomState,
  onClose,
  onOpenReview,
}) => {
  const { completedLessons = [] } = useUserStore();
  const { cards = [] } = useReviewStore();

  const currentStage = kingdomState.developmentStage ?? 0;
  const currentLp = kingdomState.learningPoints || 0;
  const targetLp = kingdomState.learningPointsToNextStage || 2000;
  const progressPercent = Math.min(100, Math.round((currentLp / targetLp) * 100));

  const activeStageDef = STAGES[currentStage] || STAGES[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 text-white shadow-2xl shadow-black/80 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header with Close */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-3xl shadow-inner">
              {activeStageDef.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  المرحلة {currentStage} من 5
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentLp} نقطة ازدهار
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {activeStageDef.titleAr}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Prosperity Card */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 rounded-2xl p-4 border border-slate-800 shadow-inner space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">مؤشر ازدهار ونمو المملكة:</span>
            <span className="font-mono font-black text-amber-400">
              {currentLp} / {targetLp} LP ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Metrics contributing to growth */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">دروس مكتملة</span>
              <span className="text-sm font-black text-emerald-400">{completedLessons.length}</span>
            </div>
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">كلمات محفوظة</span>
              <span className="text-sm font-black text-blue-400">{cards.length}</span>
            </div>
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">استقرار الذاكرة</span>
              <span className="text-sm font-black text-amber-400">
                {Math.round((kingdomState.vitalityScore || 1) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* 6 Evolution Stages Roadmap */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>مسار نمو وتطور القرية عبر رحلتك التعليمية:</span>
          </h3>

          <div className="space-y-2.5">
            {STAGES.map((st) => {
              const isPassed = currentStage > st.stage;
              const isCurrent = currentStage === st.stage;
              const isLocked = currentStage < st.stage;

              let cardBg = 'bg-slate-950/60 border-slate-800/80 text-slate-400';
              if (isCurrent) {
                cardBg = 'bg-amber-500/10 border-amber-500/80 text-slate-100 ring-2 ring-amber-500/20 shadow-lg';
              } else if (isPassed) {
                cardBg = 'bg-slate-900/80 border-emerald-500/40 text-slate-200';
              }

              return (
                <div
                  key={st.stage}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${cardBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl shrink-0">{st.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">
                          {st.titleAr}
                        </span>
                        {isPassed && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> تم البناء
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-amber-400 animate-pulse bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                            المرحلة الحالية 📍
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> قادمة
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{st.descAr}</p>

                      {/* Unlocks pills */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {st.unlocksAr.map((u, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300 font-medium"
                          >
                            + {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[11px] font-mono text-amber-400/90 block font-bold">
                      {st.requiredLessonsHint}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          {onOpenReview && (
            <button
              onClick={() => {
                onClose();
                onOpenReview();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>مراجعة العبارات لترقية قريتك الآن</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition"
          >
            إغلاق ومتابعة التجول
          </button>
        </div>
      </motion.div>
    </div>
  );
};
