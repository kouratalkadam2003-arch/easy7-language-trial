/**
 * جسر المزرعة ← SRS. يرسم حالة المزرعة من نفس بيانات cardStore.
 *
 * يحلّ محل: farmStore.ts المستقل (نظام INTERVAL_BASE ثالث متضارب).
 * المزرعة الآن مرآة SM-2: كل بطاقة = شجرة، نموها = reps، خطرها = التأخّر.
 *
 * منحنى النسيان ← مشاكل المزرعة:
 *   - جفاف   : بطاقة متأخرة 24+ ساعة  → water -5%/بطاقة
 *   - عاصفة  : متأخرة 48+ ساعة       → شجرة تذبل مرحلة
 *   - هجوم عفاريت : متأخرة 72+ ساعة  → مراجعة 5 بطاقات للدفاع
 *   - درع    : بعد صد هجوم          → حماية 24 ساعة
 *
 * نمو الشجرة (مرآة reps):
 *   reps 0       → Seed 🌱
 *   reps 1-2     → Seedling 🌿
 *   reps 3-4     → Small Tree 🌳
 *   reps 5-6     → Mature Tree 🌲
 *   reps 7+      → Crystal 💎 (محفوظ للأبد)
 */

import { useCardStore, type Flashcard, type LangStr } from "./cardStore";
import { DAY_MS } from "./srs";

/** مراحل نمو الشجرة (مرآة reps). */
export type TreeStage = "seed" | "seedling" | "small" | "mature" | "crystal";

export interface TreeStageMeta {
  key: TreeStage;
  emoji: string;
  label: string;
  minReps: number;
}

/** جدول نمو الشجرة حسب reps — مطابق للخطة 4.2. */
export const TREE_STAGES: TreeStageMeta[] = [
  { key: "seed", emoji: "🌱", label: "بذرة", minReps: 0 },
  { key: "seedling", emoji: "🌿", label: "شتلة", minReps: 1 },
  { key: "small", emoji: "🌳", label: "شجرة صغيرة", minReps: 3 },
  { key: "mature", emoji: "🌲", label: "شجرة ناضجة", minReps: 5 },
  { key: "crystal", emoji: "💎", label: "كريستال (محفوظ للأبد)", minReps: 7 },
];

/** يحوّل reps → مرحلة شجرة. */
export function treeStageForReps(reps: number): TreeStageMeta {
  let stage = TREE_STAGES[0];
  for (const s of TREE_STAGES) {
    if (reps >= s.minReps) stage = s;
  }
  return stage;
}

/** مستوى تهديد لبطاقة واحدة حسب تأخّرها. */
export type ThreatLevel = "safe" | "drought" | "storm" | "goblinAttack";

export interface FarmThreat {
  level: ThreatLevel;
  labelAr: string;
  icon: string;
  /** ساعات التأخير الدنيا لهذا المستوى. */
  minHoursLate: number;
}

/** مستويات التهديد حسب ساعات التأخّر — مطابق للخطة 4.1. */
export const FARM_THREATS: FarmThreat[] = [
  { level: "safe", labelAr: "سليم", icon: "💧", minHoursLate: 0 },
  { level: "drought", labelAr: "جفاف", icon: "🏜️", minHoursLate: 24 },
  { level: "storm", labelAr: "عاصفة", icon: "🌪️", minHoursLate: 48 },
  { level: "goblinAttack", labelAr: "هجوم عفاريت", icon: "👹", minHoursLate: 72 },
];

/** يحسب مستوى التهديد لبطاقة حسب تأخّرها عن موعد المراجعة. */
export function threatForCard(card: Flashcard, now: number = Date.now()): FarmThreat {
  const hoursLate = (now - card.dueAt) / (1000 * 60 * 60);
  let threat = FARM_THREATS[0];
  for (const t of FARM_THREATS) {
    if (hoursLate >= t.minHoursLate) threat = t;
  }
  return threat;
}

/** شجرة واحدة في المزرعة = بطاقة SRS + حالة بصرية. */
export interface FarmTree {
  card: Flashcard;
  stage: TreeStageMeta;
  threat: FarmThreat;
  hoursLate: number;
  /** مذبولة؟ (تأخّر 48+ ساعة = تذبل مرحلة). */
  withered: boolean;
}

/** لقطة كاملة للمزرعة لِلّغة معيّنة. */
export interface FarmSnapshot {
  trees: FarmTree[];
  totalTrees: number;
  crystalCount: number;
  droughtCount: number;
  stormCount: number;
  goblinAttackCount: number;
  /** هل يوجد هجوم عفاريت قائم؟ (يستلزم دفاع المتعلم). */
  underAttack: boolean;
  /** عدد البطاقات للدفاع ضد هجوم العفاريت (5 كحد أقصى حسب الخطة). */
  goblinDefenseCards: number;
  /** نسبة صحة المزرعة الإجمالية (0-100). */
  health: number;
  /** متوسط reps (مؤشر نضج المزرعة). */
  avgReps: number;
}

const HOUR_MS = 60 * 60 * 1000;
const GOBLIN_DEFENSE_MAX = 5;

/**
 * يحسب لقطة المزرعة الكاملة من بيانات cardStore — لا تخزين ثالث.
 * كل شجرة تنبض من نفس SRS.
 */
export function computeFarm(lang: LangStr, now: number = Date.now()): FarmSnapshot {
  const store = useCardStore.getState();
  // نأخذ كل البطاقات للّغة (المزرعة = كل ما تعلّمه المتعلم، المستحقة وغيرها).
  const allCards = Object.values(store.cards).filter((c) => c.lang === lang);

  const trees: FarmTree[] = allCards.map((card) => {
    const hoursLate = Math.max(0, (now - card.dueAt) / HOUR_MS);
    const stage = treeStageForReps(card.reps);
    const threat = threatForCard(card, now);
    // تذبل مرحلة إذا تأخّرت 48+ ساعة (ما لم تكن كريستال — محفوظة للأبد).
    const withered =
      hoursLate >= 48 && stage.key !== "crystal";
    return { card, stage, threat, hoursLate, withered };
  });

  const crystalCount = trees.filter((t) => t.stage.key === "crystal").length;
  const droughtCount = trees.filter(
    (t) => t.threat.level === "drought" && t.stage.key !== "crystal"
  ).length;
  const stormCount = trees.filter(
    (t) => t.threat.level === "storm" && t.stage.key !== "crystal"
  ).length;
  const goblinAttackCount = trees.filter(
    (t) => t.threat.level === "goblinAttack" && t.stage.key !== "crystal"
  ).length;

  const underAttack = goblinAttackCount > 0;
  // للدفاع: نطلب مراجعة حتى 5 بطاقات متأخرة 72+ ساعة.
  const goblinDefenseCards = Math.min(GOBLIN_DEFENSE_MAX, goblinAttackCount);

  // الصحة الإجمالية: ابدأ من 100، اخصم 5% لكل بطاقة مهدّدة (جفاف فأكثر).
  const threatened =
    droughtCount + stormCount + goblinAttackCount;
  const health = Math.max(0, 100 - threatened * 5);

  const totalReps = allCards.reduce((sum, c) => sum + c.reps, 0);
  const avgReps = allCards.length > 0 ? totalReps / allCards.length : 0;

  return {
    trees: trees.sort((a, b) => b.hoursLate - a.hoursLate), // الأكثر تأخّرًا أولًا
    totalTrees: allCards.length,
    crystalCount,
    droughtCount,
    stormCount,
    goblinAttackCount,
    underAttack,
    goblinDefenseCards,
    health,
    avgReps,
  };
}

/**
 * الإشعار القصصي الذكي المشتق من حالة المزرعة (يحلّ محل استفتاء 10ث).
 * أولوية: critical (72h) > high (48h) > medium (24h) > low (إنجاز).
 *
 * في الوضع قصة: شخصيات (درغم/إيلي/سارة/توم).
 * في الوضع عادي: نصوص محايدة ("مزرعتك تحتاجك").
 */
export type NotificationPriority = "critical" | "high" | "medium" | "low";

export interface FarmNotification {
  priority: NotificationPriority;
  /** في وضع القصة: اسم الشخصية. في وضع عادي: نص محايد. */
  speaker: string;
  message: string;
  cta: string;
  threat?: ThreatLevel;
}

/** يولّد إشعار المزرعة الأول حسب الأولوية + الوضع. */
export function topFarmNotification(
  lang: LangStr,
  now: number = Date.now()
): FarmNotification | null {
  const farm = computeFarm(lang, now);
  const mode = useCardStore.getState().mode;
  const story = mode === "story";

  if (farm.underAttack) {
    return {
      priority: "critical",
      speaker: story ? "درغم 😈" : "تنبيه",
      message: story
        ? "هجوم العفاريت! دافع عن مزرعتك!"
        : `هجوم على مزرعتك! ${farm.goblinAttackCount} شجرة في خطر.`,
      cta: "دافع الآن",
      threat: "goblinAttack",
    };
  }
  if (farm.stormCount > 0) {
    return {
      priority: "high",
      speaker: story ? "إيلي 👩‍🌾" : "تنبيه",
      message: story
        ? "رياح الجفاف تضرب القرية! شجرة تذبل."
        : `${farm.stormCount} شجرة معرّضة للعاصفة.`,
      cta: "راجع الآن",
      threat: "storm",
    };
  }
  if (farm.droughtCount > 0) {
    return {
      priority: "medium",
      speaker: story ? "إيلي 👩‍🌾" : "تذكير",
      message: story
        ? "مزرعتك تنتظرك، تحتاج ماءً."
        : `${farm.droughtCount} شجرة تحتاج مراجعة.`,
      cta: "شاهد",
      threat: "drought",
    };
  }
  if (farm.crystalCount > 0) {
    return {
      priority: "low",
      speaker: story ? "سارة 👩‍🏫" : "إنجاز",
      message: story
        ? `أحسنت! ${farm.crystalCount} شجرة كريستال محفوظة للأبد!`
        : `لديك ${farm.crystalCount} شجرة كريستال!`,
      cta: "تابع",
    };
  }
  return null;
}
