// نظام البطاقات والتقدم من تطبيق 90 يوم
// مُدمج مع نظام Easy7_Clean_App
import { SRSFields, Rating, initialSRS, schedule, isDue, difficultyOrder } from '../utils/srs';

export interface SavedCard extends SRSFields {
  id: string;
  day: number;
  lang: string;
  native: string;
  translation: string;
  pronunciation?: string;
  character?: string;
  addedAt: number;
}

export interface DialogueLine {
  native: string;
  translation: string;
  pronunciation?: string;
  character?: string;
}

const CARDS_KEY = "easy7.cards.v1";
const PROGRESS_KEY = "easy7.progress.v1";

interface Progress {
  completedDays: Record<string, number[]>;
  lastCompletedAt?: Record<string, number>;
  lastDailyReviewAt?: Record<string, number>;
  lessonState?: Record<string, Record<number, {
    read: boolean;
    immediateReview: boolean;
    dailyReviewDone: boolean;
    completedAt: number;
  }>>;
}

// --------- بطاقات ---------
function readCards(): SavedCard[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("cardStore: cards store corrupted, resetting");
      return [];
    }
    // نُبقي فقط السجلات ذات الحقول الأساسية.
    return parsed.filter(
      (c): c is SavedCard =>
        c && typeof c === "object" &&
        typeof c.id === "string" &&
        typeof c.native === "string" &&
        typeof c.translation === "string" &&
        typeof c.day === "number" &&
        typeof c.lang === "string",
    );
  } catch (e) {
    console.error("cardStore: failed to read cards", e);
    return [];
  }
}

function writeCards(cards: SavedCard[]) {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch (e) {
    // امتلأت الحصة أو الوضع الخاص — نُسجّل ولا نُسقط التطبيق.
    console.error("cardStore: failed to persist cards", e);
  }
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function cardId(day: number, lang: string, native: string) {
  return `${day}:${lang}:${hash(native)}`;
}

export function addLesson(day: number, lang: string, lines: DialogueLine[]): SavedCard[] {
  const existing = readCards();
  const existingIds = new Set(existing.map((c) => c.id));
  const now = Date.now();
  const added: SavedCard[] = [];

  for (const line of lines) {
    if (!line.native?.trim() || !line.translation?.trim()) continue;
    const id = cardId(day, lang, line.native);
    if (existingIds.has(id)) continue;
    const card: SavedCard = {
      id,
      day,
      lang,
      native: line.native,
      translation: line.translation,
      pronunciation: line.pronunciation,
      character: line.character,
      addedAt: now,
      ...initialSRS(now),
    };
    existing.push(card);
    added.push(card);
  }
  writeCards(existing);
  return added;
}

export function allCards(): SavedCard[] {
  return readCards();
}

export function dueCards(lang?: string, now: number = Date.now()): SavedCard[] {
  return readCards()
    .filter((c) => (!lang || c.lang === lang) && isDue(c, now))
    .sort(difficultyOrder);
}

export function cardsForLesson(day: number, lang: string): SavedCard[] {
  return readCards().filter((c) => c.day === day && c.lang === lang);
}

export function rateCard(id: string, rating: Rating): SavedCard | null {
  const cards = readCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ...cards[idx], ...schedule(cards[idx], rating) };
  cards[idx] = updated;
  writeCards(cards);
  return updated;
}

// --------- تقدم الدروس ---------
function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completedDays: {} };
    const parsed = JSON.parse(raw) as Progress | null;
    if (!parsed || typeof parsed !== "object") return { completedDays: {} };
    if (!parsed.completedDays || typeof parsed.completedDays !== "object") {
      parsed.completedDays = {};
    }
    return parsed;
  } catch (e) {
    console.error("cardStore: failed to read progress", e);
    return { completedDays: {} };
  }
}

function writeProgress(p: Progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch (e) {
    console.error("cardStore: failed to persist progress", e);
  }
}

export function markDayCompleted(lang: string, day: number) {
  const p = readProgress();
  const list = new Set(p.completedDays[lang] ?? []);
  list.add(day);
  p.completedDays[lang] = Array.from(list).sort((a, b) => a - b);
  p.lastCompletedAt = { ...(p.lastCompletedAt ?? {}), [lang]: Date.now() };
  const ls = { ...(p.lessonState ?? {}) };
  const forLang = { ...(ls[lang] ?? {}) };
  const prev = forLang[day] ?? { read: false, immediateReview: false, dailyReviewDone: false, completedAt: 0 };
  forLang[day] = { ...prev, read: true, completedAt: Date.now() };
  ls[lang] = forLang;
  p.lessonState = ls;
  writeProgress(p);
}

type LessonStateEntry = NonNullable<Progress["lessonState"]>[string][number];

function updateLessonState(lang: string, day: number, patch: Partial<LessonStateEntry>) {
  const p = readProgress();
  const ls = { ...(p.lessonState ?? {}) };
  const forLang = { ...(ls[lang] ?? {}) };
  const prev = forLang[day] ?? { read: false, immediateReview: false, dailyReviewDone: false, completedAt: 0 };
  forLang[day] = { ...prev, ...patch };
  ls[lang] = forLang;
  p.lessonState = ls;
  writeProgress(p);
}

export function markImmediateReviewDone(lang: string, day: number) {
  updateLessonState(lang, day, { immediateReview: true });
}

export function markDailyReviewDoneForLesson(lang: string, day: number) {
  updateLessonState(lang, day, { dailyReviewDone: true });
}

export function lessonStateOf(lang: string, day: number) {
  const p = readProgress();
  return (
    p.lessonState?.[lang]?.[day] ?? {
      read: false,
      immediateReview: false,
      dailyReviewDone: false,
      completedAt: 0,
    }
  );
}

export function isLessonFullyDone(lang: string, day: number): boolean {
  const s = lessonStateOf(lang, day);
  return s.read && s.immediateReview && s.dailyReviewDone;
}

// اليوم N مفتوح فقط إذا اكتملت الشروط الثلاثة للأيام startDay..N-1.
export function isDayUnlocked(lang: string, day: number, startDay: number = 1): boolean {
  if (day <= startDay) return true;
  for (let d = startDay; d < day; d++) {
    if (!isLessonFullyDone(lang, d)) return false;
  }
  return true;
}

// أول درس لم يُكمَل كليًا انطلاقًا من startDay.
export function nextUnlockedDay(lang: string, startDay: number = 1): number {
  let d = startDay;
  while (isDayUnlocked(lang, d, startDay)) {
    const s = lessonStateOf(lang, d);
    if (!s.read) return d;
    if (!isLessonFullyDone(lang, d)) return d;
    d++;
  }
  return d;
}

export function completedDays(lang: string): number[] {
  return readProgress().completedDays[lang] ?? [];
}

export function highestCompletedDay(lang: string): number {
  const days = completedDays(lang);
  return days.length ? Math.max(...days) : 0;
}

export function nextDayFor(lang: string): number {
  return highestCompletedDay(lang) + 1;
}

export function isDayCompleted(lang: string, day: number): boolean {
  return completedDays(lang).includes(day);
}

// هل أكمل المتعلم درسًا اليوم بالفعل؟ (تاريخ محلي)
export function completedLessonToday(lang: string): boolean {
  const p = readProgress();
  const ts = p.lastCompletedAt?.[lang];
  if (!ts) return false;
  const a = new Date(ts);
  const b = new Date();
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// عدد البطاقات المستحقة الموسومة "صعب" أو "نسيت" آخر مرة (لعرضها كتنبيه).
export function hardDueCount(lang: string, now: number = Date.now()): number {
  return dueCards(lang, now).filter(
    (c) => c.lastRating === "again" || c.lastRating === "hard"
  ).length;
}

// --------- المراجعة اليومية الإجبارية (لدرس الأمس) ---------

function isSameLocalDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

// بطاقات المراجعة اليومية = كل بطاقات آخر درس أكمله المتعلم.
export function dailyReviewCards(lang: string): SavedCard[] {
  const highest = highestCompletedDay(lang);
  if (highest === 0) return [];
  return cardsForLesson(highest, lang);
}

// هل نفّذ المتعلم المراجعة الإجبارية اليوم؟
export function dailyReviewDoneToday(lang: string): boolean {
  const p = readProgress();
  const ts = p.lastDailyReviewAt?.[lang];
  if (!ts) return false;
  return isSameLocalDay(ts, Date.now());
}

// شرط ظهور المراجعة الإجبارية: هناك درس مكتمل + لم يراجعه اليوم +
// لم يكن ذلك الدرس قد أُكمل اليوم نفسه (لأن المراجعة الأولى تحتسب).
export function needsDailyReview(lang: string): boolean {
  if (highestCompletedDay(lang) === 0) return false;
  if (dailyReviewDoneToday(lang)) return false;
  if (completedLessonToday(lang)) return false; // أكمل درسًا اليوم، فالمراجعة الفورية تحتسب
  return true;
}

export function markDailyReviewDone(lang: string) {
  const p = readProgress();
  p.lastDailyReviewAt = { ...(p.lastDailyReviewAt ?? {}), [lang]: Date.now() };
  writeProgress(p);
  const highest = highestCompletedDay(lang);
  if (highest > 0) markDailyReviewDoneForLesson(lang, highest);
}
