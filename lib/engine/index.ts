/**
 * lib/engine — القلب الموحّد للتطبيق.
 *
 * محرك SRS واحد + مسار درس واحد + بوابة ثلاثية + مزرعة مرآة.
 * كل التصديرات المُستخدمة عبر التطبيق تمرّ من هنا.
 *
 * يحلّ محل:
 *   - utils/srs.ts (الفواصل الثابتة الخاطئة)
 *   - lib/cardStore.ts (المستورد من المحرك القديم)
 *   - lib/learning/srs.ts + lib/learning/progress-store.ts
 *   - farmStore.ts (النظام الثالث المستقل)
 *
 * الترتيب المقصود للاستيراد الداخلي (عدم الدوران):
 *   tiers ← srs ← cardStore ← reviewGate ← lessonEngine
 *   cardStore ← farmBridge
 */

export * from "./tiers";
export * from "./srs";
export * from "./cardStore";
export * from "./reviewGate";
export * from "./lessonEngine";
export * from "./farmBridge";
