import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FastForward, Wrench } from 'lucide-react';
import { Flashcard } from '../types/remix_types';

// --- الثوابت وإعدادات اللعبة ---
const ARENA_WIDTH = 360;
const TOTAL_HEIGHT = 640;
const INFO_BAR_HEIGHT = 50;
const BUTTONS_BAR_HEIGHT = 220;
const ARENA_HEIGHT = TOTAL_HEIGHT - INFO_BAR_HEIGHT - BUTTONS_BAR_HEIGHT;
const GAME_SPEED = 50; // تحديث اللعبة كل 50 مللي ثانية

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// --- تعريف أنواع البيانات ---
interface CurrentQuestion {
  prompt: string;
  correctAnswer: string;
  options: string[];
  type?: 'mcq' | 'listen' | 'fill_blank' | 'scramble' | 'ordered_ar_en' | 'ordered_en_ar';
}

interface Goblin {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  isEating: boolean;
  angle: number;
  type?: 'goblin' | 'missile' | 'boss' | 'big_goblin' | 'speeder' | 'tank' | 'ghost' | 'healer';
  lastAttackTime?: number;
  spawnTime?: number;
  level?: number;
}

interface Defender {
  id: string;
  type: 'swordsman' | 'archer' | 'mage';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  lastActionTime: number;
  angle: number;
  level?: number;
  rockHits?: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  type: 'arrow' | 'magic' | 'anti_missile' | 'boss_sword' | 'rock';
}

// --- الرسومات (SVGs) ---
const Sword3D = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] overflow-visible`}>
    <path d="M95 50 L75 42 L25 42 L25 58 L75 58 Z" fill="url(#bladeGrad)" />
    <path d="M95 50 L25 50 L25 58 L75 58 Z" fill="url(#bladeHighlight)" />
    <rect x="20" y="25" width="10" height="50" rx="3" fill="#B8860B" />
    <rect x="25" y="25" width="5" height="50" rx="3" fill="#DAA520" />
    <rect x="-5" y="42" width="25" height="16" fill="#8B4513" />
    <circle cx="-5" cy="50" r="8" fill="#B8860B" />
    <circle cx="-3" cy="50" r="6" fill="#DAA520" />
    <defs>
      <linearGradient id="bladeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="bladeHighlight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>
  </svg>
);

const BowSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md overflow-visible`}>
    <path d="M20 20 L20 80" stroke="#cbd5e1" strokeWidth="2" fill="none" />
    <path d="M20 20 Q50 50 20 80" stroke="#8B4513" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M20 50 L80 50" stroke="#cbd5e1" strokeWidth="3" fill="none" />
    <polygon points="80,50 70,45 70,55" fill="#cbd5e1" />
    <line x1="20" y1="50" x2="30" y2="45" stroke="#f8fafc" strokeWidth="2" />
    <line x1="20" y1="50" x2="30" y2="55" stroke="#f8fafc" strokeWidth="2" />
  </svg>
);

const StaffSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] overflow-visible`}>
    <path d="M10 50 L80 50" stroke="#5c4033" strokeWidth="6" strokeLinecap="round" />
    <path d="M80 45 L85 50 L80 55 Z" fill="#DAA520" />
    <circle cx="90" cy="50" r="8" fill="#a855f7" className="animate-pulse" />
    <circle cx="90" cy="50" r="4" fill="#d8b4fe" />
  </svg>
);

const MissileSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-lg overflow-visible`}>
    <path d="M50 10 L60 30 L60 80 L50 90 L40 80 L40 30 Z" fill="#ef4444" />
    <path d="M40 80 L30 100 L50 90 L70 100 L60 80" fill="#f97316" />
    <circle cx="50" cy="40" r="5" fill="#fcd34d" />
  </svg>
);

const MonsterSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-lg overflow-visible`}>
    <circle cx="50" cy="50" r="35" fill="#065f46" />
    <circle cx="65" cy="35" r="5" fill="#ef4444" />
    <circle cx="65" cy="65" r="5" fill="#ef4444" />
    <circle cx="67" cy="35" r="2" fill="#fff" />
    <circle cx="67" cy="65" r="2" fill="#fff" />
    <path d="M75 45 Q85 50 75 55" stroke="#000" strokeWidth="3" fill="none" />
    <polygon points="75,45 85,42 78,48" fill="#fff" />
    <polygon points="75,55 85,58 78,52" fill="#fff" />
  </svg>
);

const SpeederSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-lg overflow-visible`}>
    <circle cx="50" cy="50" r="25" fill="#10b981" />
    <polygon points="10,30 30,50 10,70" fill="#34d399" opacity="0.7" />
    <polygon points="0,40 20,50 0,60" fill="#6ee7b7" opacity="0.5" />
    <circle cx="60" cy="40" r="4" fill="#facc15" />
    <circle cx="60" cy="60" r="4" fill="#facc15" />
  </svg>
);

const TankSVG = ({ className = "w-16 h-16" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-2xl overflow-visible`}>
    <rect x="20" y="20" width="60" height="60" rx="15" fill="#1f2937" />
    <circle cx="50" cy="50" r="20" fill="#374151" />
    <circle cx="70" cy="35" r="6" fill="#dc2626" />
    <circle cx="70" cy="65" r="6" fill="#dc2626" />
    <rect x="75" y="45" width="10" height="10" fill="#000" />
  </svg>
);

const GhostSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md overflow-visible`}>
    <path d="M30 80 Q 40 90 50 80 T 70 80 L 70 40 A 20 20 0 0 0 30 40 Z" fill="#e2e8f0" opacity="0.8" />
    <circle cx="60" cy="40" r="4" fill="#475569" />
    <circle cx="60" cy="55" r="4" fill="#475569" />
  </svg>
);

const HealerSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-lg overflow-visible`}>
    <circle cx="50" cy="50" r="30" fill="#059669" />
    <circle cx="65" cy="40" r="4" fill="#fff" />
    <circle cx="65" cy="60" r="4" fill="#fff" />
    <rect x="40" y="20" width="20" height="60" fill="#86efac" opacity="0.6" rx="5" />
    <rect x="20" y="40" width="60" height="20" fill="#86efac" opacity="0.6" rx="5" />
  </svg>
);

const GraveSVG = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md overflow-visible`}>
    <path d="M20 100 L20 40 Q50 10 80 40 L80 100 Z" fill="#64748b" />
    <path d="M40 50 L60 50 M50 40 L50 70" stroke="#cbd5e1" strokeWidth="4" />
    <polygon points="10,100 90,100 80,90 20,90" fill="#334155" />
  </svg>
);

const BigGoblinSVG = ({ className = "w-20 h-20" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-xl overflow-visible`}>
    <circle cx="50" cy="50" r="45" fill="#064e3b" />
    <circle cx="65" cy="30" r="6" fill="#f87171" />
    <circle cx="65" cy="70" r="6" fill="#f87171" />
    <path d="M75 40 Q90 50 75 60" stroke="#000" strokeWidth="4" fill="none" />
    {/* Rock on back */}
    <circle cx="20" cy="50" r="25" fill="#4b5563" />
    <circle cx="25" cy="40" r="8" fill="#6b7280" />
    <circle cx="15" cy="60" r="12" fill="#374151" />
  </svg>
);

const RockSVG = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md overflow-visible`}>
    <polygon points="50,10 80,30 90,60 70,90 30,85 10,60 20,20" fill="#4b5563" />
    <polygon points="40,20 70,35 80,60 60,80 30,75 20,50" fill="#6b7280" />
  </svg>
);

const BossSVG = ({ className = "w-32 h-32" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-2xl overflow-visible`}>
    <circle cx="50" cy="50" r="45" fill="#4c1d95" />
    <circle cx="35" cy="40" r="8" fill="#ef4444" />
    <circle cx="65" cy="40" r="8" fill="#ef4444" />
    <path d="M 30 70 Q 50 90 70 70" stroke="#fca5a5" strokeWidth="6" fill="none" />
    <path d="M 25 25 L 40 35 M 75 25 L 60 35" stroke="#1e1b4b" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const ArrowSVG = () => (
  <svg viewBox="0 0 50 10" className="w-6 h-2 overflow-visible">
    <line x1="0" y1="5" x2="40" y2="5" stroke="#e2e8f0" strokeWidth="2" />
    <polygon points="40,5 30,0 30,10" fill="#94a3b8" />
  </svg>
);

const MagicOrb = () => (
  <svg viewBox="0 0 20 20" className="w-6 h-6 animate-spin-slow">
    <circle cx="10" cy="10" r="8" fill="url(#orbGrad)" />
    <circle cx="10" cy="10" r="4" fill="#f3e8ff" />
    <defs>
      <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#d8b4fe" />
        <stop offset="100%" stopColor="#7e22ce" />
      </radialGradient>
    </defs>
  </svg>
);

// --- التطبيق الرئيسي ---
interface GoblinFightGameProps {
  flashcards?: Flashcard[];
  onClose?: () => void;
  /**
   * ترتيب ظهور العبارات:
   * - 'text' (افتراضي): ترتيب النص الأصلي كما ورد في الحوار (وضع الدرس).
   * - 'srs': ترتيب ذكي حسب منحنى النسيان (وضع المراجعة):
   *     Core→Medium→Secondary، ثم الأصعب أولًا (lapses↓, ease↑, due↑).
   *     يتطلّب حقول SRS على البطاقات؛ إن غابت يبقى ترتيب النص.
   */
  orderMode?: 'text' | 'srs';
}

/**
 * يرتب البطاقات حسب وضع الترتيب. في وضع الدرس نحافظ على ترتيب النص الأصلي.
 * في وضع المراجعة نرتّب ذكيًا حسب حقول SRS إن وُجدت على البطاقة.
 */
function orderCards(cards: Flashcard[], mode: 'text' | 'srs'): Flashcard[] {
  if (mode !== 'srs') return [...cards];
  const hasSrs = cards.some(
    (c) =>
      typeof (c as any).lapses === 'number' ||
      typeof (c as any).ease === 'number' ||
      typeof (c as any).dueAt === 'number' ||
      typeof (c as any).nextReviewTimestamp === 'number'
  );
  if (!hasSrs) return [...cards]; // لا حقول SRS → نُبقي ترتيب النص
  const tierOrder: Record<string, number> = { core: 0, medium: 1, secondary: 2 };
  return [...cards].sort((a, b) => {
    const ta = tierOrder[(a as any).tier] ?? 2;
    const tb = tierOrder[(b as any).tier] ?? 2;
    if (ta !== tb) return ta - tb; // Core أولاً
    const la = (a as any).lapses ?? 0;
    const lb = (b as any).lapses ?? 0;
    if (la !== lb) return lb - la; // الأكثر نسيانًا أولًا
    const ea = (a as any).ease ?? 2.5;
    const eb = (b as any).ease ?? 2.5;
    if (ea !== eb) return ea - eb; // ease أقل = أصعب
    const da = (a as any).dueAt ?? (a as any).nextReviewTimestamp ?? 0;
    const db = (b as any).dueAt ?? (b as any).nextReviewTimestamp ?? 0;
    return da - db; // الأقدم استحقاقًا
  });
}

export default function GoblinFightGame({ flashcards = [], onClose, orderMode = 'text' }: GoblinFightGameProps) {
  const [hasStartedStory, setHasStartedStory] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [defenders, setDefenders] = useState<Defender[]>([]);
  const [goblins, setGoblins] = useState<Goblin[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);

  const STATIC_QUESTION_BANK: Record<number, CurrentQuestion[]> = {
    1: [ // W1: MCQ
      { prompt: 'تفاحة', options: ['Apple', 'Banana', 'Orange', 'Grape'], correctAnswer: 'Apple', type: 'mcq' },
      { prompt: 'سيارة', options: ['Car', 'Bus', 'Train', 'Bike'], correctAnswer: 'Car', type: 'mcq' },
      { prompt: 'كتاب', options: ['Book', 'Pen', 'Paper', 'Desk'], correctAnswer: 'Book', type: 'mcq' },
      { prompt: 'شمس', options: ['Sun', 'Moon', 'Star', 'Sky'], correctAnswer: 'Sun', type: 'mcq' },
      { prompt: 'ماء', options: ['Water', 'Fire', 'Earth', 'Air'], correctAnswer: 'Water', type: 'mcq' }
    ],
    2: [ // W2: Listen
      { prompt: '🔊 Brother', options: ['أخ', 'أب', 'أم', 'أخت'], correctAnswer: 'أخ', type: 'listen' },
      { prompt: '🔊 Window', options: ['نافذة', 'باب', 'جدار', 'سقف'], correctAnswer: 'نافذة', type: 'listen' },
      { prompt: '🔊 Yellow', options: ['أصفر', 'أحمر', 'أزرق', 'أخضر'], correctAnswer: 'أصفر', type: 'listen' },
      { prompt: '🔊 Animal', options: ['حيوان', 'نبات', 'إنسان', 'جماد'], correctAnswer: 'حيوان', type: 'listen' },
      { prompt: '🔊 Happy', options: ['سعيد', 'حزين', 'غاضب', 'خائف'], correctAnswer: 'سعيد', type: 'listen' }
    ],
    3: [ // W3: Fill Blank
      { prompt: 'I ___ an apple', options: ['ate', 'run', 'sleep', 'blue'], correctAnswer: 'ate', type: 'fill_blank' },
      { prompt: 'The sky is ___', options: ['blue', 'red', 'green', 'yellow'], correctAnswer: 'blue', type: 'fill_blank' },
      { prompt: 'She ___ to school', options: ['goes', 'going', 'go', 'gone'], correctAnswer: 'goes', type: 'fill_blank' },
      { prompt: 'We ___ playing', options: ['are', 'is', 'am', 'be'], correctAnswer: 'are', type: 'fill_blank' },
      { prompt: 'He has a ___ dog', options: ['big', 'much', 'many', 'very'], correctAnswer: 'big', type: 'fill_blank' }
    ],
    4: [ // W4: Scramble (4 words)
      { prompt: 'الجو بارد جداً', options: ['It is very cold', 'It very cold is', 'Cold is very it', 'Very cold it is'], correctAnswer: 'It is very cold', type: 'scramble' },
      { prompt: 'أنا أحب القراءة', options: ['I like reading', 'I reading like', 'Like I reading', 'Reading like I'], correctAnswer: 'I like reading', type: 'scramble' },
      { prompt: 'هم يلعبون هناك', options: ['They play over there', 'Over there they play', 'They over there play', 'Play they over there'], correctAnswer: 'They play over there', type: 'scramble' },
      { prompt: 'القطة تنام الآن', options: ['The cat sleeps now', 'Now sleeps the cat', 'The cat now sleeps', 'Sleeps the cat now'], correctAnswer: 'The cat sleeps now', type: 'scramble' },
      { prompt: 'هذا كتابي الجديد', options: ['This is my book', 'This my book is', 'My book is this', 'Is this my book'], correctAnswer: 'This is my book', type: 'scramble' }
    ],
    5: [ // W5: MCQ Timer
      { prompt: 'Bird', options: ['طائر', 'كلب', 'قطة', 'سمكة'], correctAnswer: 'طائر', type: 'mcq' },
      { prompt: 'Tree', options: ['شجرة', 'وردة', 'حجر', 'جبل'], correctAnswer: 'شجرة', type: 'mcq' },
      { prompt: 'House', options: ['منزل', 'مدرسة', 'مستشفى', 'شارع'], correctAnswer: 'منزل', type: 'mcq' },
      { prompt: 'Friend', options: ['صديق', 'عدو', 'جار', 'أخ'], correctAnswer: 'صديق', type: 'mcq' },
      { prompt: 'Time', options: ['وقت', 'مكان', 'تاريخ', 'ساعة'], correctAnswer: 'وقت', type: 'mcq' }
    ],
    6: [ // W6: Ordered AR->EN
      { prompt: 'مرحبا، اسمي عمر', options: ['Hello, my name is Omar', 'Hi, I am Ali', 'My name is not Omar', 'Hello, Omar is here'], correctAnswer: 'Hello, my name is Omar', type: 'ordered_ar_en' },
      { prompt: 'عمري عشر سنوات', options: ['I am ten years old', 'I have ten years', 'Ten years is my age', 'I am years ten old'], correctAnswer: 'I am ten years old', type: 'ordered_ar_en' },
      { prompt: 'أحب التفاح', options: ['I like apples', 'I like bananas', 'Apples like me', 'I eat apples'], correctAnswer: 'I like apples', type: 'ordered_ar_en' },
      { prompt: 'أعيش في مدينة', options: ['I live in a city', 'I live in a town', 'A city lives in me', 'Living in a city'], correctAnswer: 'I live in a city', type: 'ordered_ar_en' },
      { prompt: 'لدي قطة بيضاء', options: ['I have a white cat', 'I have a black dog', 'A white cat has me', 'I see a white cat'], correctAnswer: 'I have a white cat', type: 'ordered_ar_en' }
    ],
    7: [ // W7: Ordered EN->AR
      { prompt: 'Hello, my name is Omar', options: ['مرحبا، اسمي عمر', 'أهلاً، أنا علي', 'اسمي ليس عمر', 'مرحبا، عمر هنا'], correctAnswer: 'مرحبا، اسمي عمر', type: 'ordered_en_ar' },
      { prompt: 'I am ten years old', options: ['عمري عشر سنوات', 'لدي عشر سنوات', 'عشر سنوات هو عمري', 'أنا سنوات عشر قديم'], correctAnswer: 'عمري عشر سنوات', type: 'ordered_en_ar' },
      { prompt: 'I like apples', options: ['أحب التفاح', 'أحب الموز', 'التفاح يحبني', 'آكل التفاح'], correctAnswer: 'أحب التفاح', type: 'ordered_en_ar' },
      { prompt: 'I live in a city', options: ['أعيش في مدينة', 'أعيش في بلدة', 'مدينة كبيرة تعيش فيّ', 'العيش في مدينة'], correctAnswer: 'أعيش في مدينة', type: 'ordered_en_ar' },
      { prompt: 'I have a white cat', options: ['لدي قطة بيضاء', 'لدي كلب أسود', 'قطة بيضاء تملكني', 'أرى قطة بيضاء'], correctAnswer: 'لدي قطة بيضاء', type: 'ordered_en_ar' }
    ],
    8: [ // W8: Horde + Listen
      { prompt: '🔊 Danger', options: ['خطر', 'أمان', 'خوف', 'سلام'], correctAnswer: 'خطر', type: 'listen' },
      { prompt: '🔊 Quickly', options: ['بسرعة', 'ببطء', 'بهدوء', 'قوة'], correctAnswer: 'بسرعة', type: 'listen' },
      { prompt: '🔊 Night', options: ['ليل', 'نهار', 'صباح', 'مساء'], correctAnswer: 'ليل', type: 'listen' },
      { prompt: '🔊 Sword', options: ['سيف', 'درع', 'رمح', 'سهم'], correctAnswer: 'سيف', type: 'listen' },
      { prompt: '🔊 Magic', options: ['سحر', 'علم', 'خيال', 'حقيقة'], correctAnswer: 'سحر', type: 'listen' }
    ],
    9: [ // W9: Sniper + Scramble (5 words)
      { prompt: 'القطة السوداء تنام على السرير', options: ['The black cat sleeps on the bed', 'On the bed sleeps the black cat', 'The black cat on the bed sleeps', 'Sleeps the black cat on the bed'], correctAnswer: 'The black cat sleeps on the bed', type: 'scramble' },
      { prompt: 'الرجل الطويل يقف قرب الباب', options: ['The tall man stands near the door', 'Near the door stands the tall man', 'The tall man near the door stands', 'Stands the tall man near the door'], correctAnswer: 'The tall man stands near the door', type: 'scramble' },
      { prompt: 'نحن نلعب كرة القدم كل يوم', options: ['We play football every single day', 'Every single day play football we', 'We every single day play football', 'Play football we every single day'], correctAnswer: 'We play football every single day', type: 'scramble' },
      { prompt: 'هي تقرأ كتابا في المكتبة', options: ['She is reading a book in the library', 'In the library she is reading a book', 'She reading a book in the library', 'Reading a book in the library she is'], correctAnswer: 'She is reading a book in the library', type: 'scramble' },
      { prompt: 'الشمس تشرق في الصباح الباكر', options: ['The sun rises in the early morning', 'In the early morning the sun rises', 'The sun in the early morning rises', 'Rises the sun in the early morning'], correctAnswer: 'The sun rises in the early morning', type: 'scramble' }
    ],
    10: [ // W10: Boss 1 (Scramble)
      { prompt: 'القائد العظيم لا يستسلم أبدا', options: ['The great leader never gives up', 'Never gives up the great leader', 'The great leader gives up never', 'Gives up never the great leader'], correctAnswer: 'The great leader never gives up', type: 'scramble' },
      { prompt: 'الضوء الساطع يملأ الغرفة الواسعة', options: ['The bright light fills the large room', 'Fills the large room the bright light', 'The bright light the large room fills', 'The large room fills the bright light'], correctAnswer: 'The bright light fills the large room', type: 'scramble' },
      { prompt: 'الأبطال الحقيقيون يظهرون وقت الشدة', options: ['Real heroes appear in hard times', 'In hard times appear real heroes', 'Real heroes in hard times appear', 'Appear real heroes in hard times'], correctAnswer: 'Real heroes appear in hard times', type: 'scramble' },
      { prompt: 'السيف القوي يقطع الفولاذ الصلب', options: ['The strong sword cuts solid steel', 'Cuts solid steel the strong sword', 'The strong sword solid steel cuts', 'Solid steel cuts the strong sword'], correctAnswer: 'The strong sword cuts solid steel', type: 'scramble' },
      { prompt: 'السحر القديم يحمي المملكة دائما', options: ['Ancient magic always protects the kingdom', 'Always protects the kingdom ancient magic', 'Ancient magic the kingdom protects always', 'Protects always the kingdom ancient magic'], correctAnswer: 'Ancient magic always protects the kingdom', type: 'scramble' }
    ]
  };

  const NEW_QUESTION_BANK = useMemo(() => {
    if (!flashcards || flashcards.length === 0) return STATIC_QUESTION_BANK;
    
    // نرتّب البطاقات حسب السياق: درس=ترتيب النص، مراجعة=ترتيب SRS الذكي.
    const ordered = orderCards(flashcards, orderMode);
    
    const bank: Record<number, CurrentQuestion[]> = {};
    for (let wave = 1; wave <= 10; wave++) {
      const qs = ordered.map(fc => {
        const options = [fc.originalText];
        const others = ordered.filter(f => f.id !== fc.id);
        // المشتّتات (الخيارات الخاطئة) نبقيها مرتبة بترتيب النص أيضًا في وضع الدرس،
        // ونشغل shuffle فقط للمشتّتات (لا للسؤال الصحيح) لإبقاء التحدي دون كسر ترتيب العرض.
        const distractors = orderMode === 'text' ? others.slice(0, 3) : shuffleArray(others).slice(0, 3);
        for (let i = 0; i < 3 && i < distractors.length; i++) {
          options.push(distractors[i].originalText);
        }
        
        // Fill remaining options if flashcards < 4
        while (options.length < 4) {
          options.push(options[Math.floor(Math.random() * options.length)] + " (alt)");
        }
        
        const type = (wave === 2 || wave === 8) ? 'listen' : 'mcq';
        const prompt = type === 'listen' ? `🔊 ${fc.originalText}` : fc.translation;
        
        return {
          prompt,
          correctAnswer: fc.originalText,
          options: shuffleArray(options),
          type
        } as CurrentQuestion;
      });
      // في وضع الدرس نُبقي ترتيب النص الأصلي (لا shuffle على مستوى الموجة).
      // في وضع المراجعة الترتيب الذكي دخل بالفعل عبر orderCards.
      bank[wave] = qs;
    }
    return bank;
  }, [flashcards, orderMode]);

const getWaveIndex = (c: number) => {
  if (c < 5) return 1;
  if (c < 10) return 2;
  if (c < 18) return 3;
  if (c < 23) return 4;
  if (c < 33) return 5;
  if (c < 38) return 6;
  if (c < 43) return 7;
  if (c < 51) return 8;
  if (c < 56) return 9;
  if (c < 63) return 10;
  return 11;
};

const generateQuestion = (corrects: number, mistakes?: CurrentQuestion[]): CurrentQuestion => {
  const waveIndex = getWaveIndex(corrects);
  
  const waveQuestionsList = NEW_QUESTION_BANK[waveIndex] || NEW_QUESTION_BANK[10];
  let q: CurrentQuestion;
  
  if (waveIndex === 11) {
     if (mistakes && mistakes.length > 0) {
       q = mistakes[Math.floor(Math.random() * mistakes.length)];
     } else {
       q = waveQuestionsList[corrects % waveQuestionsList.length];
     }
  } else {
     // Guarantee all phrases appear by cycling through them sequentially
     q = waveQuestionsList[corrects % waveQuestionsList.length];
  }
  
  return { ...q, options: shuffleArray(q.options) };
};

  useEffect(() => {
    setCurrentQuestion(generateQuestion(0));
  }, []);

  const [energy, setEnergy] = useState<number>(0);
  const [spawnCount, setSpawnCount] = useState<number>(0);
  const [bossPhase, setBossPhase] = useState<'none' | 'warning' | 'active' | 'final_warning' | 'final_boss'>('none');
  const [lives, setLives] = useState<number>(5);
  const [mistakes, setMistakes] = useState<CurrentQuestion[]>([]);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const [upgradeMenu, setUpgradeMenu] = useState<boolean>(false);
  const [explosion, setExplosion] = useState<boolean>(false);

  const [echoShield, setEchoShield] = useState<number>(0);
  const [inkBombActive, setInkBombActive] = useState<boolean>(false);
  const [chaosStorm, setChaosStorm] = useState<number>(0);
  const [narratorSeal, setNarratorSeal] = useState<number>(0);
  const [activePowerUpName, setActivePowerUpName] = useState<string | null>(null);

  const stateRef = useRef({ defenders, goblins, projectiles, streak, gameOver, correctCount, currentQuestion, energy, spawnCount, bossPhase, lives, mistakes, gameWon, upgradeMenu, echoShield, chaosStorm, narratorSeal, inkBombActive, activePowerUpName, hasStartedStory });
  
  useEffect(() => {
    stateRef.current = { defenders, goblins, projectiles, streak, gameOver, correctCount, currentQuestion, energy, spawnCount, bossPhase, lives, mistakes, gameWon, upgradeMenu, echoShield, chaosStorm, narratorSeal, inkBombActive, activePowerUpName, hasStartedStory };
  }, [defenders, goblins, projectiles, streak, gameOver, correctCount, currentQuestion, energy, spawnCount, bossPhase, lives, mistakes, gameWon, upgradeMenu, echoShield, chaosStorm, narratorSeal, inkBombActive, activePowerUpName, hasStartedStory]);

  const generateQuestionForFinalBoss = () => {
    const currentMistakes = stateRef.current.mistakes;
    if (currentMistakes.length > 0) {
      return currentMistakes[Math.floor(Math.random() * currentMistakes.length)];
    }
    // Fallback if no mistakes were made
    return generateQuestion(0);
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text.replace('🔊 ', ''));
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentQuestion && currentQuestion.type === 'listen') {
      playAudio(currentQuestion.prompt);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (correctCount === 56 && bossPhase === 'none') {
      setBossPhase('warning');
      setGoblins([]);
      setCurrentQuestion(null);
      
      setTimeout(() => {
        setBossPhase('active');
        setCurrentQuestion(generateQuestion(56));
        setGoblins([
           { id: 'boss1', x: ARENA_WIDTH / 2, y: 150, hp: 7000, maxHp: 7000, speed: 0.1, isEating: false, angle: 180, type: 'boss' }
        ]);
      }, 4000);
    } else if (correctCount === 63 && bossPhase === 'active') {
      setBossPhase('final_warning');
      setGoblins([]);
      setCurrentQuestion(null);
      
      setTimeout(() => {
        setBossPhase('final_boss');
        setCurrentQuestion(generateQuestionForFinalBoss());
      }, 4000);
    }
  }, [correctCount, bossPhase]);

  // حلقة اللعبة الأساسية
  useEffect(() => {
    if (stateRef.current.gameOver) return;

    const gameLoop = setInterval(() => {
      const state = stateRef.current;
      if (state.gameOver || state.upgradeMenu || state.gameWon || !state.hasStartedStory) return;

      const now = Date.now();
      let newGoblins = state.goblins.map(z => ({ ...z }));
      let newProjectiles = state.projectiles.map(p => ({ ...p }));
      let newDefenders = state.defenders.map(d => ({ ...d }));
      let shouldUpdateScore = false;

      const isOnFire = state.streak >= 3;
      const damageMultiplier = isOnFire ? 2 : 1;

      // 1. تحديث المقذوفات
      newProjectiles = newProjectiles.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy
      })).filter(p => p.x > -50 && p.x < ARENA_WIDTH + 50 && p.y > -50 && p.y < ARENA_HEIGHT + 50);

      // 2. تحديث المدافعين
      newDefenders = newDefenders.map(unit => {
        // البحث عن أقرب وحش ضمن نطاق الخطر
        let nearestDist = Infinity;
        let nearestZ: Goblin | null = null;
        
        let dangerThreshold = ARENA_HEIGHT * 0.5;
        if (unit.type === 'archer' || unit.type === 'mage') {
            dangerThreshold = ARENA_HEIGHT * 0.25;
        } else if (unit.type === 'swordsman') {
            dangerThreshold = 60;
        }

        newGoblins.forEach(z => {
          const isBoss = z.type === 'boss';
          const threshold = isBoss ? -100 : dangerThreshold;
          if (z.type !== 'missile' && z.y > threshold) {
            const dist = Math.hypot(z.x - unit.x, z.y - unit.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestZ = z;
            }
          }
        });

        if (unit.type === 'archer' || unit.type === 'mage') {
          const fireRate = unit.type === 'archer' ? 1000 : 2000;
          const damage = (unit.type === 'archer' ? 20 : 50) * damageMultiplier * (unit.level || 1);
          const projSpeed = unit.type === 'archer' ? 20 : 10;

          if (nearestZ && now - unit.lastActionTime > fireRate) {
            const angleRad = Math.atan2(nearestZ.y - unit.y, nearestZ.x - unit.x);
            newProjectiles.push({
              id: Math.random().toString(),
              x: unit.x,
              y: unit.y,
              vx: Math.cos(angleRad) * projSpeed,
              vy: Math.sin(angleRad) * projSpeed,
              angle: angleRad * (180 / Math.PI),
              damage,
              type: unit.type === 'archer' ? 'arrow' : 'magic'
            });
            return { ...unit, lastActionTime: now, angle: angleRad * (180 / Math.PI) };
          }
        } else if (unit.type === 'swordsman') {
          if (nearestZ) {
            const angleRad = Math.atan2(nearestZ.y - unit.y, nearestZ.x - unit.x);
            const angleDeg = angleRad * (180 / Math.PI);
            
            if (nearestDist > 30) {
              // التحرك نحو العدو
              const moveSpeed = 4;
              return {
                ...unit,
                x: unit.x + Math.cos(angleRad) * moveSpeed,
                y: unit.y + Math.sin(angleRad) * moveSpeed,
                angle: angleDeg
              };
            } else {
              // الهجوم عن قرب
              if (now - unit.lastActionTime > 800) {
                const baseDamage = 30 * (unit.level || 1);
                nearestZ.hp -= baseDamage * damageMultiplier;
                if (nearestZ.hp <= 0) {
                  const zIndex = newGoblins.findIndex(z => z.id === nearestZ!.id);
                  if (zIndex > -1) {
                    newGoblins.splice(zIndex, 1);
                    shouldUpdateScore = true;
                  }
                }
                return { ...unit, lastActionTime: now, angle: angleDeg };
              } else {
                 return { ...unit, angle: angleDeg };
              }
            }
          } else {
            // العودة إلى الموقع الأساسي إذا لم يكن هناك عدو قريب
            const baseY = ARENA_HEIGHT - 40;
            if (Math.abs(unit.y - baseY) > 5) {
               const angleRad = Math.atan2(baseY - unit.y, 0); // العودة عمودياً
               const moveSpeed = 3;
               return {
                 ...unit,
                 y: unit.y + Math.sin(angleRad) * moveSpeed,
                 angle: -90 // النظر للأعلى
               };
            }
          }
        }
        return unit;
      });

      // 3. تحديث الوحوش
      let lifeToLose = 0;
      
      newGoblins = newGoblins.map(goblin => {
        let newX = goblin.x;
        let newY = goblin.y;
        
        let effectiveSpeed = goblin.speed;
        if (state.narratorSeal > now) {
            effectiveSpeed *= 0.3; // بطء 70%
        }
        if (state.inkBombActive) {
            effectiveSpeed = 0; // تجميد
        }

        if (goblin.type === 'missile') {
           newY += effectiveSpeed;
           if (newY > ARENA_HEIGHT - 20) {
             lifeToLose++;
             return { ...goblin, x: newX, y: newY, hp: 0 };
           }
           return { ...goblin, x: newX, y: newY };
        }

        if (state.echoShield > now && newY > ARENA_HEIGHT - 120 && goblin.type !== 'boss') {
            goblin.hp -= 10;
            newY -= 20; // إرجاع للخلف
        }

        if (goblin.type === 'big_goblin') {
           // يرمي حجارة كل 5 ثواني
           if (now - (goblin.lastAttackTime || 0) > 5000) {
              if (newDefenders.length > 0) {
                 const target = newDefenders[Math.floor(Math.random() * newDefenders.length)];
                 const angleRad = Math.atan2(target.y - goblin.y, target.x - goblin.x);
                 newProjectiles.push({
                   id: Math.random().toString(),
                   x: goblin.x,
                   y: goblin.y,
                   vx: Math.cos(angleRad) * 4,
                   vy: Math.sin(angleRad) * 4,
                   angle: angleRad * (180 / Math.PI),
                   damage: 100, // Not used directly, but we use rock type
                   type: 'rock'
                 });
                 goblin.lastAttackTime = now;
              }
           }
        }

        if (goblin.type === 'healer') {
           if (now - (goblin.lastAttackTime || 0) > 3000) {
              newGoblins.forEach(other => {
                 if (other.id !== goblin.id && Math.hypot(other.x - goblin.x, other.y - goblin.y) < 100) {
                    other.hp = Math.min(other.hp + 20, other.maxHp);
                 }
              });
              goblin.lastAttackTime = now;
           }
        }

        let isEating = false;
        let targetUnitIndex = -1;
        let minUnitDist = Infinity;

        // البحث عن أقرب مدافع للهجوم عليه
        newDefenders.forEach((d, idx) => {
          const dist = Math.hypot(d.x - goblin.x, d.y - goblin.y);
          if (dist < 40 && dist < minUnitDist) {
            minUnitDist = dist;
            targetUnitIndex = idx;
          }
        });

        if (targetUnitIndex !== -1) {
          isEating = true;
          if (goblin.type === 'big_goblin' && newDefenders[targetUnitIndex].type === 'swordsman') {
            newDefenders[targetUnitIndex].hp = 0; // العفريت العظام يقضي على السياف بضربة
          } else {
            const zLevel = goblin.level || 1;
            newDefenders[targetUnitIndex].hp -= 0.5 * zLevel; // ضرر الوحش يتضاعف مع المستوى
          }
          if (newDefenders[targetUnitIndex].hp <= 0) {
            newDefenders.splice(targetUnitIndex, 1);
            isEating = false;
          }
        }

        let angle = 90; // افتراضيا ينظر لأسفل

        if (!isEating) {
          newY += effectiveSpeed; // النزول لأسفل بشكل مستمر
        } else if (targetUnitIndex !== -1) {
          const target = newDefenders[targetUnitIndex];
          angle = Math.atan2(target.y - goblin.y, target.x - goblin.x) * (180 / Math.PI);
        }

        if (newY > ARENA_HEIGHT - 20) {
          lifeToLose++;
          return { ...goblin, x: newX, y: newY, hp: 0 };
        }

        return { ...goblin, x: newX, y: newY, angle, isEating };
      });

      // 4. التصادم بين المقذوفات والوحوش
      for (let i = newProjectiles.length - 1; i >= 0; i--) {
        const proj = newProjectiles[i];

        if (proj.type === 'rock') {
           const hitIndex = newDefenders.findIndex(d => Math.hypot(d.x - proj.x, d.y - proj.y) < 30);
           if (hitIndex !== -1) {
             const defender = newDefenders[hitIndex];
             defender.hp -= (defender.maxHp / 3); // 3 ضربات ويموت
             if (defender.hp <= 0) {
               newDefenders.splice(hitIndex, 1);
             }
             newProjectiles.splice(i, 1);
           }
           continue;
        }

        if (proj.type === 'anti_missile') {
           const hitIndex = newGoblins.findIndex(z => z.type === 'missile' && Math.hypot(z.x - proj.x, z.y - proj.y) < 60);
           if (hitIndex !== -1 || proj.y < ARENA_HEIGHT / 2) {
             newGoblins.forEach(z => {
               if (z.type === 'missile') z.hp = 0;
             });
             newProjectiles.splice(i, 1);
           }
           continue;
        }

        if (proj.type === 'boss_sword') {
           const hitIndex = newGoblins.findIndex(z => z.type === 'boss' && Math.hypot(z.x - proj.x, z.y - proj.y) < 80);
           if (hitIndex !== -1 || proj.y < 160) {
             const bossIndex = newGoblins.findIndex(z => z.type === 'boss');
             if (bossIndex !== -1) {
               newGoblins[bossIndex].hp -= 1000;
               if (newGoblins[bossIndex].hp <= 0) {
                 newGoblins[bossIndex].hp = 0;
                 setGameWon(true);
               }
             }
             newProjectiles.splice(i, 1);
           }
           continue;
        }

        const hitIndex = newGoblins.findIndex(z => Math.hypot(z.x - proj.x, z.y - proj.y) < 30);
        
        if (hitIndex !== -1) {
          newGoblins[hitIndex].hp -= proj.damage;
          newProjectiles.splice(i, 1);
          if (newGoblins[hitIndex].hp <= 0) {
            newGoblins.splice(hitIndex, 1);
            shouldUpdateScore = true;
          }
        }
      }

      // إزالة الوحوش الميتة (في حالة تم قتلهم بطرق أخرى)
      newGoblins = newGoblins.filter(z => z.hp > 0);

      setDefenders(newDefenders);
      setGoblins(newGoblins);
      setProjectiles(newProjectiles);
      if (shouldUpdateScore) setScore(s => s + 10);
      
      if (lifeToLose > 0) {
        setLives(l => {
          const newLives = l - lifeToLose;
          if (newLives <= 0) setGameOver(true);
          return newLives;
        });
      }

    }, GAME_SPEED);

    return () => clearInterval(gameLoop);
  }, []);

  // توليد الوحوش حسب الموجة
  const waveLevel = getWaveIndex(correctCount);

  const specialSpawnsRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    if (gameOver || gameWon || upgradeMenu || bossPhase === 'warning' || bossPhase === 'final_warning' || !hasStartedStory) return;
    
    const wave = getWaveIndex(correctCount);

    const createGoblin = (type: Goblin['type'], baseHp: number, speed: number): Goblin => ({
      id: Math.random().toString(),
      x: Math.random() * (ARENA_WIDTH - 80) + 40,
      y: -40,
      hp: baseHp * wave,
      maxHp: baseHp * wave,
      speed,
      isEating: false,
      angle: 90,
      type,
      spawnTime: Date.now(),
      level: wave
    });

    if (correctCount === 10 && !specialSpawnsRef.current[10]) {
      specialSpawnsRef.current[10] = true;
      const newGoblins = Array(8).fill(null).map(() => createGoblin('goblin', 150, 0.3 + Math.random()*0.2));
      setGoblins(prev => [...prev, ...newGoblins]);
    }
    if (correctCount === 18 && !specialSpawnsRef.current[18]) {
      specialSpawnsRef.current[18] = true;
      const bz = createGoblin('big_goblin', 5000, 0.1);
      setGoblins(prev => [...prev, { ...bz, maxHp: bz.hp, x: ARENA_WIDTH/2 }]);
    }
    if (correctCount === 33 && !specialSpawnsRef.current[33]) {
      specialSpawnsRef.current[33] = true;
      setGoblins(prev => [...prev, createGoblin('goblin', 300, 0.3)]);
    }
    if (correctCount === 38 && !specialSpawnsRef.current[38]) {
      specialSpawnsRef.current[38] = true;
      setGoblins(prev => [...prev, createGoblin('speeder', 200, 0.6)]);
    }
    if (correctCount === 43 && !specialSpawnsRef.current[43]) {
      specialSpawnsRef.current[43] = true;
      const newGoblins = Array(10).fill(null).map(() => createGoblin('goblin', 200, 0.4 + Math.random()*0.2));
      setGoblins(prev => [...prev, ...newGoblins]);
    }
    if (correctCount === 51 && !specialSpawnsRef.current[51]) {
      specialSpawnsRef.current[51] = true;
      const bz = createGoblin('big_goblin', 10000, 0.05);
      setGoblins(prev => [...prev, { ...bz, maxHp: bz.hp, x: ARENA_WIDTH/2 }]);
    }

    let intervalId: NodeJS.Timeout;
    if (wave === 1) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('goblin', 100, 0.3)]), 3000);
    } else if (wave === 2) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('speeder', 80, 0.8)]), 2500);
    } else if (wave === 3) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('tank', 500, 0.2)]), 4000);
    } else if (wave === 4) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('ghost', 150, 0.4)]), 3500);
    } else if (wave === 5) {
      intervalId = setInterval(() => {
         const type = Math.random() > 0.5 ? 'goblin' : (Math.random() > 0.5 ? 'speeder' : 'tank');
         setGoblins(prev => [...prev, createGoblin(type as any, type === 'tank' ? 500 : 150, type === 'speeder' ? 1.0 : 0.4)]);
      }, 1500);
    } else if (wave === 6) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('healer', 200, 0.3)]), 3000);
    } else if (wave === 7) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('tank', 800, 0.25)]), 3000);
    } else if (wave === 8) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('speeder', 150, 0.9)]), 2000);
    } else if (wave === 9) {
      intervalId = setInterval(() => {
         const type = Math.random() > 0.5 ? 'ghost' : 'healer';
         setGoblins(prev => [...prev, createGoblin(type as any, 250, 0.5)]);
      }, 2500);
    } else if (wave === 10) {
      intervalId = setInterval(() => setGoblins(prev => [...prev, createGoblin('goblin', 250, 0.5)]), 4000);
    } else if (wave === 11 && bossPhase === 'final_boss') {
      intervalId = setInterval(() => {
         setGoblins(prev => [...prev, createGoblin('goblin', 300, 0.5)]);
      }, 8000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [correctCount, gameOver, gameWon, upgradeMenu, bossPhase, hasStartedStory]);

  useEffect(() => {
    if (bossPhase === 'final_boss' && stateRef.current.goblins.filter(z => z.type === 'boss').length === 0) {
      const bossHp = 7000 + (stateRef.current.mistakes.length * 1000);
      setGoblins([
        { id: 'final_boss', x: ARENA_WIDTH / 2, y: 150, hp: bossHp, maxHp: bossHp, speed: 0.1, isEating: false, angle: 180, type: 'boss' },
      ]);
    }
  }, [currentQuestion, bossPhase]);

  // التفاعل مع الإجابات
  const handleOptionClick = (selectedOption: string) => {
    const state = stateRef.current;
    if (state.gameOver || !state.currentQuestion) return;

    if (selectedOption === state.currentQuestion.correctAnswer) {
      // إجابة صحيحة!
      const newStreak = state.streak + 1;
      setStreak(newStreak);
      setScore(s => s + 10);
      
      const wave = getWaveIndex(state.correctCount);

      if (newStreak === 5) {
         setExplosion(true);
         setTimeout(() => setExplosion(false), 1000);
         
         let powerUpName = '⚡ طاقة إضافية';
         if (wave === 1) powerUpName = '🔁 Echo Repeat';
         else if (wave === 2) powerUpName = '🛡️ Echo Shield';
         else if (wave === 3) powerUpName = '💣 Ink Bomb';
         else if (wave === 4) powerUpName = '🌪️ Chaos Storm';
         else if (wave === 5) powerUpName = '⏰ Time Freeze';
         else if (wave === 6) powerUpName = '📜 Narrator Seal';
         else if (wave === 7) powerUpName = '⚡ Translator Wrath';
         else if (wave === 8) powerUpName = '🔁 Echo Boost x2';
         else if (wave === 9) powerUpName = '🌪️ Chaos Storm x2';
         else if (wave >= 10) powerUpName = '⚡ MAX POWER!';
         
         setActivePowerUpName(powerUpName);
         setTimeout(() => setActivePowerUpName(null), 3000);

         if (wave === 2) {
            setEchoShield(Date.now() + 8000);
         } else if (wave === 3 || wave === 5) {
            setInkBombActive(true);
            setGoblins(prev => prev.map(z => ({ ...z, lastAttackTime: Date.now() + 5000 })));
            setTimeout(() => setInkBombActive(false), 5000);
         } else if (wave === 4 || wave === 9) {
            setChaosStorm(Date.now() + 6000);
            setGoblins(prev => prev.map(z => {
               const newY = z.y > ARENA_HEIGHT * 0.5 ? z.y - 100 : z.y;
               return { ...z, y: newY, hp: z.hp * (wave === 9 ? 0.5 : 0.8) };
            }));
         } else if (wave === 6) {
            setNarratorSeal(Date.now() + 10000);
         } else if (wave === 7) {
            setGoblins(prev => prev.map(z => {
               if (z.type === 'boss') return { ...z, hp: Math.max(0, z.hp - 1500) };
               if (z.type === 'big_goblin') return { ...z, hp: Math.max(0, z.hp - 1000) };
               return { ...z, hp: 0 };
            }));
         } else if (wave >= 10) {
            setEchoShield(Date.now() + 8000);
            setInkBombActive(true); setTimeout(() => setInkBombActive(false), 5000);
            setChaosStorm(Date.now() + 6000);
            setNarratorSeal(Date.now() + 10000);
         } else {
            setEnergy(e => e + (wave === 8 ? 100 : 50));
            setGoblins(prev => prev.map(z => {
               if (z.type === 'boss') return z;
               if (z.type === 'big_goblin') return { ...z, hp: Math.max(0, z.hp - z.maxHp / 2) };
               return { ...z, hp: 0 };
            }));
         }
      }
      
      if (wave === 4 || wave === 9) {
         setGoblins(prev => prev.map(z => z.type === 'big_goblin' ? { ...z, hp: Math.max(0, z.hp - (wave === 4 ? 1000 : 2000)) } : z));
      }
      if (wave === 10) {
         setGoblins(prev => prev.map(z => z.type === 'boss' ? { ...z, hp: Math.max(0, z.hp - 1000) } : z));
      }
      if (wave === 6 || wave === 7) {
         setGoblins(prev => prev.filter(z => z.type !== 'goblin' && z.type !== 'speeder'));
      }
      
      setCorrectCount(c => {
         const newCount = c + 1;
         if (state.bossPhase === 'final_boss') {
           setCurrentQuestion(generateQuestionForFinalBoss());
         } else {
           setCurrentQuestion(generateQuestion(newCount));
         }
         return newCount;
      });

      if (state.bossPhase === 'final_boss') {
        // إطلاق سيف قوي نحو الزعيم
        setProjectiles(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            x: ARENA_WIDTH / 2,
            y: ARENA_HEIGHT - 40,
            vx: 0,
            vy: -15,
            angle: -90,
            damage: 1000,
            type: 'boss_sword'
          }
        ]);
        const earnedEnergy = 40;
        setEnergy(e => e + earnedEnergy);
      } else {
        const isSentence = state.currentQuestion.prompt.includes(' ');
        const nextType = isSentence ? 'mage' : 'archer';
        const baseHp = nextType === 'archer' ? 100 : 80;
        
        // Spawn 1 automatic defender for correctly answering, unless we have enough energy
        setDefenders(prev => [...prev, {
          id: Math.random().toString(),
          type: nextType,
          x: ARENA_WIDTH / 2 + (Math.random() * 80 - 40),
          y: ARENA_HEIGHT - 40,
          hp: baseHp * wave,
          maxHp: baseHp * wave,
          lastActionTime: Date.now(),
          angle: -90,
          level: wave
        }]);

        // Energy handling
        const earnedEnergy = 10 + (newStreak * 5); 
        let newEnergy = state.energy + earnedEnergy;
        let newSpawnCount = state.spawnCount;
        const defendersToSpawn: Defender[] = [];

        while (true) {
          const spawnType = newSpawnCount % 3 === 0 ? 'swordsman' : newSpawnCount % 3 === 1 ? 'archer' : 'mage';
          const cost = spawnType === 'swordsman' ? 30 : spawnType === 'archer' ? 45 : 60;

          if (newEnergy >= cost) {
            newEnergy -= cost;
            newSpawnCount++;
            
            const spawnBaseHp = spawnType === 'swordsman' ? 300 : 100;
            defendersToSpawn.push({
              id: Math.random().toString(),
              type: spawnType,
              x: ARENA_WIDTH / 2 + (Math.random() * 80 - 40),
              y: ARENA_HEIGHT - 40,
              hp: spawnBaseHp * wave,
              maxHp: spawnBaseHp * wave,
              lastActionTime: Date.now(),
              angle: -90,
              level: wave
            });
          } else {
            break;
          }
        }

        setEnergy(newEnergy);
        setSpawnCount(newSpawnCount);

        if (defendersToSpawn.length > 0) {
          setDefenders(prev => [...prev, ...defendersToSpawn]);
        }
      }
    } else {
      // إجابة خاطئة
      if (state.currentQuestion) {
        setMistakes(prev => {
          if (!prev.some(m => m.prompt === state.currentQuestion!.prompt)) {
            return [...prev, state.currentQuestion!];
          }
          return prev;
        });
      }

      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) setGameOver(true);
        return newLives;
      });
      
      if (state.bossPhase === 'active') {
        setCurrentQuestion(generateQuestion(state.correctCount));
      } else if (state.bossPhase === 'final_boss') {
        setCurrentQuestion(generateQuestionForFinalBoss());
      } else {
        setCurrentQuestion(generateQuestion(state.correctCount));
      }
    }
  };

  let rank = 'مبتدئ';
  if (correctCount >= 5) rank = 'متقدم';
  else if (correctCount >= 2) rank = 'متوسط';

  const nextType = spawnCount % 3 === 0 ? 'swordsman' : spawnCount % 3 === 1 ? 'archer' : 'mage';
  const nextCost = nextType === 'swordsman' ? 30 : nextType === 'archer' ? 45 : 60;

  const jumpToPhase = (phase: string) => {
    setShowAdmin(false);
    setGoblins([]);
    setProjectiles([]);
    if (phase === 'wave1') {
      setCorrectCount(0);
      setBossPhase('none');
      setCurrentQuestion(generateQuestion(0));
    } else if (phase === 'wave3') {
      setCorrectCount(10);
      setBossPhase('none');
      setCurrentQuestion(generateQuestion(10));
    } else if (phase === 'wave4') {
      setCorrectCount(18);
      setBossPhase('none');
      setCurrentQuestion(generateQuestion(18));
    } else if (phase === 'wave5') {
      setCorrectCount(23);
      setBossPhase('none');
      setCurrentQuestion(generateQuestion(23));
    } else if (phase === 'wave6') {
      setCorrectCount(33);
      setBossPhase('none');
      setCurrentQuestion(generateQuestion(33));
    } else if (phase === 'wave8') {
      setCorrectCount(43);
      setBossPhase('none');
      setCurrentQuestion(generateQuestion(43));
    } else if (phase === 'wave10') {
      setCorrectCount(56);
      setBossPhase('warning');
      setCurrentQuestion(null);
      setTimeout(() => {
        setBossPhase('active');
        setCurrentQuestion(generateQuestion(56));
        setGoblins([{ id: 'boss1', x: ARENA_WIDTH / 2, y: 150, hp: 7000, maxHp: 7000, speed: 0.1, isEating: false, angle: 180, type: 'boss' }]);
      }, 4000);
    } else if (phase === 'final_boss') {
      setCorrectCount(63);
      setBossPhase('final_warning');
      setCurrentQuestion(null);
      setTimeout(() => {
        setBossPhase('final_boss');
        if (stateRef.current.mistakes.length === 0) {
          setMistakes([generateQuestion(0)]);
        }
        setTimeout(() => setCurrentQuestion(generateQuestionForFinalBoss()), 100);
      }, 4000);
    }
  };

  // --- Responsive Scaling Engine ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Leave small padding on all sides
      const paddingX = windowWidth < 640 ? 8 : 16;
      const paddingY = windowHeight < 640 ? 8 : 16;
      const availWidth = windowWidth - paddingX * 2;
      const availHeight = windowHeight - paddingY * 2;

      const widthScale = availWidth / ARENA_WIDTH;
      const heightScale = availHeight / TOTAL_HEIGHT;

      // Fit strictly within BOTH dimensions — no cutoff ever
      let newScale = Math.min(widthScale, heightScale);

      // Clamp: never smaller than 0.45, no artificial upper cap
      newScale = Math.max(0.45, newScale);

      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center w-full h-full overflow-hidden select-none font-sans ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
      {/* --- SCALING GAME BOARD --- */}
      <div 
        ref={containerRef}
        className="relative bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 rounded-3xl border border-blue-500/30 shadow-[0_0_60px_rgba(30,58,138,0.5)] overflow-hidden shrink-0"
        style={{
          width: `${ARENA_WIDTH}px`,
          height: `${TOTAL_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
      
      {!hasStartedStory && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-[#0b1c1e] rounded-3xl border-2 border-red-500/40 p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] relative">
            <div className="text-6xl mb-4 animate-bounce">🧌</div>
            <h2 className="text-2xl font-black text-red-400 tracking-tight mb-2">هجوم الوحوش!</h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              ليث! الوحوش تقترب من القرية! يجب أن نستخدم الكلمات السحرية لطردهم فوراً وحماية المزرعة!
              أجب بسرعة لرمي التعاويذ!
            </p>
            <button
              onClick={() => setHasStartedStory(true)}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black rounded-xl text-lg shadow-xl shadow-red-500/20 transition-all active:scale-95 cursor-pointer"
            >
              الدفاع عن القرية!
            </button>
          </div>
        </div>
      )}

      {activePowerUpName && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)] border-2 border-white/20">
            <p className="text-white font-black text-xl tracking-wider text-center drop-shadow-md">
              POWER-UP: {activePowerUpName}!
            </p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
      `}</style>
      
      {/* Developer Tools Compact Icon Button */}
      <button 
        onClick={() => setShowAdmin(true)} 
        title="أدوات المطور"
        className="absolute top-3 right-3 z-50 p-2.5 rounded-full bg-purple-900/80 hover:bg-purple-700 text-white shadow-md border border-purple-500/40 active:scale-95 transition-all opacity-80 hover:opacity-100 cursor-pointer"
      >
        <Wrench className="w-4 h-4 text-purple-200" />
      </button>

      {/* Skip Compact Arrow Button */}
      {onClose && (
        <button 
          onClick={onClose} 
          title="تخطي"
          className="absolute top-3 left-3 z-50 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white shadow-md border border-slate-600/60 active:scale-95 transition-all cursor-pointer"
        >
          <FastForward className="w-4 h-4 text-white" />
        </button>
      )}

      {showAdmin && (
        <div className="absolute top-10 right-2 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 flex flex-col gap-2 shadow-2xl">
          <div className="text-white text-sm font-bold border-b border-gray-600 pb-1 mb-1 text-center">أدوات المطور (Admin)</div>
          <button onClick={() => jumpToPhase('wave1')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-4 rounded">الموجة 1</button>
          <button onClick={() => jumpToPhase('wave3')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-4 rounded">الموجة 3</button>
          <button onClick={() => jumpToPhase('wave4')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-4 rounded">الموجة 4</button>
          <button onClick={() => jumpToPhase('wave5')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-4 rounded">الموجة 5</button>
          <button onClick={() => jumpToPhase('wave6')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-4 rounded">الموجة 6</button>
          <button onClick={() => jumpToPhase('wave8')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-4 rounded">الموجة 8</button>
          <button onClick={() => jumpToPhase('wave10')} className="bg-orange-700 hover:bg-orange-600 text-white text-xs py-2 px-4 rounded">الزعيم 1 (W10)</button>
          <button onClick={() => jumpToPhase('final_boss')} className="bg-purple-900 hover:bg-purple-800 text-white text-xs py-2 px-4 rounded border border-purple-500">الزعيم الأخير (W11)</button>
          <button onClick={() => setShowAdmin(false)} className="bg-slate-600 hover:bg-slate-500 text-white text-xs py-2 px-4 rounded mt-2">إغلاق</button>
        </div>
      )}

      {upgradeMenu && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[60] p-4">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6">اختر ترقية لمحاربك</h1>
          <div className="flex flex-col gap-4">
            <button onClick={() => {
               setUpgradeMenu(false);
               setDefenders(prev => prev.map(d => d.type === 'swordsman' ? { ...d, level: 2, maxHp: 600, hp: 600 } : d));
               setCurrentQuestion(generateQuestion(correctCount));
            }} className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-lg text-xl font-bold shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              سياف مستوى 2 (قوة مضاعفة)
            </button>
            <button onClick={() => {
               setUpgradeMenu(false);
               setCurrentQuestion(generateQuestion(correctCount));
            }} className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-lg text-xl font-bold">
              خيار 2 (قريباً)
            </button>
            <button onClick={() => {
               setUpgradeMenu(false);
               setCurrentQuestion(generateQuestion(correctCount));
            }} className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-lg text-xl font-bold">
              خيار 3 (قريباً)
            </button>
          </div>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 mt-10 drop-shadow-lg text-center leading-tight">انتصار عظيم!</h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-6 font-medium text-center">لقد دمرت الزعيم الأخير وتعلمت من أخطائك بنجاح.</p>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 w-full max-w-md mb-8">
             <h2 className="text-2xl text-white font-bold mb-4 text-center border-b border-gray-700 pb-2">الكلمات التي تعلمتها</h2>
             <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                {mistakes.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <span className="text-green-400 font-bold">{m.correctAnswer}</span>
                    <span className="text-gray-300 text-sm">{m.prompt}</span>
                  </div>
                ))}
                {mistakes.length === 0 && (
                  <div className="text-center text-gray-400 py-4">لم ترتكب أي أخطاء! أداء مثالي.</div>
                )}
             </div>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-4 px-10 rounded-xl text-xl shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all mb-10"
          >
            العب مرة أخرى
          </button>
        </div>
      )}

      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* الواجهة العلوية (المعلومات) */}
        <div className="w-full bg-white/5 backdrop-blur-md px-4 py-2 flex justify-between items-center border-b border-white/10 z-30 shrink-0 gap-2 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" style={{ height: INFO_BAR_HEIGHT }}>
          <div className="text-white font-bold text-xs bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-400/30 whitespace-nowrap flex flex-col items-center leading-none shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <span className="drop-shadow-md">{bossPhase === 'active' ? 'هجوم صاروخي' : bossPhase === 'final_boss' ? 'الزعيم الأخير' : `موجة ${Math.min(waveLevel, 3)}`}</span>
            <span className="text-[10px] text-blue-200 mt-1">{rank}</span>
          </div>
          
          <div className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-lg flex flex-col items-center whitespace-nowrap border border-white/5 shadow-inner">
            <div className="flex items-center drop-shadow-md">
              طاقة: <span className="text-yellow-400 mx-1 text-sm">{energy}</span> <span className="text-sm drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">⚡</span>
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">
              المحارب التالي: {nextCost} ⚡
            </div>
          </div>

          <div className="flex gap-1 items-center bg-black/30 px-2 py-1 rounded-full border border-red-500/20">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-xs drop-shadow-[0_0_3px_rgba(239,68,68,0.8)] transition-all ${i < lives ? 'scale-100' : 'opacity-20 grayscale scale-75'}`}>
                ❤️
              </span>
            ))}
          </div>

          <div className={`text-xs font-bold px-3 py-1 rounded-full flex items-center transition-all shadow-lg border ${streak > 0 ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400/50 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-gray-800/80 text-gray-400 border-gray-600/50'}`}>
            🔥 {streak}
          </div>
        </div>

        {/* ساحة المعركة */}
        <div className="relative w-full flex-grow bg-transparent overflow-hidden">
          
          {/* Word Cemetery - Graves */}
          {mistakes.map((m, i) => {
             // Deterministic random-like position based on index
             const px = 20 + ((i * 137) % (ARENA_WIDTH - 40));
             const py = 20 + ((i * 97) % (ARENA_HEIGHT - 150));
             return (
               <div key={`grave-${i}`} className="absolute pointer-events-none opacity-40 flex flex-col items-center" style={{ left: px, top: py, transform: 'translate(-50%, -50%)' }}>
                 <GraveSVG className="w-12 h-12" />
                 <span className="text-[8px] font-bold text-gray-300 mt-1 max-w-[60px] truncate text-center bg-black/40 px-1 rounded">{m.correctAnswer}</span>
               </div>
             );
          })}

          {/* خط الأمان السفلي */}
          <div className="absolute bottom-10 w-full border-t-2 border-dashed border-red-500/50" />

          {/* رسم المدافعين المتمركزين */}
          {defenders.map(unit => (
            <div
              key={unit.id}
              className="absolute flex flex-col items-center justify-center pointer-events-none"
              style={{
                left: unit.x - 20,
                top: unit.y - 20,
                width: 40,
                height: 40,
              }}
            >
              <div className="absolute -top-3 w-8 h-1 bg-red-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }} 
                />
              </div>
              <div style={{ transform: `rotate(${unit.angle}deg)`, transition: 'transform 100ms ease' }}>
                {unit.type === 'swordsman' && <Sword3D className={unit.level === 2 ? "w-14 h-14 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "w-10 h-10"} />}
                {unit.type === 'archer' && <BowSVG />}
                {unit.type === 'mage' && <StaffSVG />}
              </div>
              {unit.level && unit.level > 1 && (
                 <div className="absolute -bottom-4 bg-blue-900 text-blue-200 text-[8px] font-bold px-1 rounded border border-blue-500 whitespace-nowrap z-10">
                   Lvl {unit.level}
                 </div>
              )}
            </div>
          ))}

          {/* رسم الوحوش والصواريخ */}
          {goblins.map(goblin => (
            <div
              key={goblin.id}
              className="absolute flex flex-col items-center justify-center pointer-events-none transition-transform"
              style={{
                left: goblin.x - 40,
                top: goblin.y - 60,
                width: 80,
                height: 100,
              }}
            >
              {goblin.type === 'missile' ? (
                <div style={{ transform: `rotate(${goblin.angle}deg)` }}>
                  <MissileSVG className="w-12 h-12 animate-pulse" />
                </div>
              ) : goblin.type === 'boss' ? (
                <>
                  <div className="absolute top-1 w-24 h-2 bg-red-950 rounded-full overflow-hidden border border-gray-800 z-50" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${(goblin.hp / goblin.maxHp) * 100}%` }} 
                    />
                  </div>
                  <div style={{ transform: `rotate(${goblin.angle}deg)` }}>
                    <BossSVG className="w-24 h-24 sm:w-32 sm:h-32" />
                  </div>
                </>
              ) : goblin.type === 'big_goblin' ? (
                <>
                  <div className="absolute top-1 w-16 h-2 bg-red-900 rounded-full overflow-hidden border border-gray-800 z-50" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                    <div 
                      className="h-full bg-orange-500" 
                      style={{ width: `${(Math.max(0, goblin.hp) / goblin.maxHp) * 100}%` }} 
                    />
                  </div>
                  <div style={{ transform: `rotate(${goblin.angle}deg)` }}>
                    <BigGoblinSVG className="w-16 h-16 sm:w-20 sm:h-20" />
                  </div>
                </>
              ) : (
                <div style={{ opacity: goblin.type === 'ghost' ? (Math.floor((Date.now() - (goblin.spawnTime || 0)) / 1000) % 5 < 2 ? 1 : 0.2) : 1, transition: 'opacity 0.3s' }} className="flex flex-col items-center">
                  <div className="absolute top-10 w-8 h-1 bg-red-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${(Math.max(0, goblin.hp) / goblin.maxHp) * 100}%` }} 
                    />
                  </div>
                  <div style={{ transform: `rotate(${goblin.angle}deg)` }}>
                    {goblin.type === 'speeder' ? <SpeederSVG className="w-10 h-10" /> :
                     goblin.type === 'tank' ? <TankSVG className="w-14 h-14" /> :
                     goblin.type === 'ghost' ? <GhostSVG className="w-10 h-10" /> :
                     goblin.type === 'healer' ? <HealerSVG className="w-10 h-10" /> :
                     <MonsterSVG className="w-10 h-10" />}
                  </div>
                </div>
              )}
              {goblin.level && goblin.level > 1 && goblin.type !== 'missile' && (
                 <div className="absolute top-16 bg-red-900 text-red-200 text-[8px] font-bold px-1 rounded border border-red-500 whitespace-nowrap z-10">
                   Lvl {goblin.level}
                 </div>
              )}
            </div>
          ))}

          {/* رسم المقذوفات */}
          {projectiles.map(proj => (
            <div
              key={proj.id}
              className="absolute pointer-events-none"
              style={{
                left: proj.x,
                top: proj.y,
                transform: `translate(-50%, -50%) rotate(${proj.angle}deg)`,
              }}
            >
              {proj.type === 'arrow' ? <ArrowSVG /> : proj.type === 'anti_missile' ? <MissileSVG className="w-8 h-8 opacity-80" /> : proj.type === 'boss_sword' ? <div className="text-4xl">🗡️</div> : proj.type === 'rock' ? <RockSVG /> : <MagicOrb />}
            </div>
          ))}

          {/* تأثير الانفجار (Streak 5) */}
          {explosion && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="w-[800px] h-[800px] bg-yellow-500/80 rounded-full animate-ping opacity-0 mix-blend-screen shadow-[0_0_100px_rgba(234,179,8,1)]"></div>
              <div className="absolute w-full h-full bg-white/30 animate-pulse mix-blend-overlay"></div>
            </div>
          )}

          {/* شاشة التحذير (Boss Warning) */}
          {/* Power Up Banner */}
          {activePowerUpName && (
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-3 rounded-full shadow-lg border-2 border-white text-center">
                <span className="text-white font-black text-2xl drop-shadow-md">{activePowerUpName}</span>
                <p className="text-white text-xs font-bold mt-1 uppercase tracking-wider">تم التفعيل!</p>
              </div>
            </div>
          )}

          {bossPhase === 'warning' && (
            <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center z-40 p-6 text-center animate-pulse">
              <h2 className="text-4xl font-black text-white mb-4 drop-shadow-lg text-red-100">تحذير!</h2>
              <p className="text-xl font-bold text-white mb-2">العفريت غاضبون، سيتم قصفك!</p>
              <p className="text-lg text-red-200">استعد.. سنعطيك القذائف المضادة.</p>
              <p className="text-lg text-red-200 mt-4 bg-black/50 px-4 py-2 rounded-lg border border-red-500">حاول ألا تخطئ التصويب وإلا ستفقد حياتك!</p>
            </div>
          )}

          {bossPhase === 'final_warning' && (
            <div className="absolute inset-0 bg-purple-900/90 flex flex-col items-center justify-center z-40 p-6 text-center animate-pulse">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg text-purple-100">تحذير خطير!</h2>
              <p className="text-2xl font-bold text-purple-200 mb-2">لقد أيقظت الزعيم الأخير!</p>
              {mistakes.length > 0 ? (
                <>
                  <p className="text-lg text-purple-300">أخطائك ({mistakes.length} كلمات) في المقبرة زادت من قوته!</p>
                  <p className="text-lg text-purple-300 mt-2">سيختبرك الآن في الكلمات التي أخطأت بها.</p>
                </>
              ) : (
                <p className="text-lg text-purple-300">سيختبرك الآن في الكلمات التي أخطأت بها.</p>
              )}
              <p className="text-lg text-purple-300 mt-4 bg-black/50 px-4 py-2 rounded-lg border border-purple-500">أجب بشكل صحيح 7 مرات لتدميره نهائياً!</p>
            </div>
          )}
        </div>

        {/* الواجهة السفلية (أزرار الخيارات) */}
        <div className="w-full bg-gradient-to-t from-black via-slate-900 to-slate-800/90 backdrop-blur-md p-3 flex flex-col items-center justify-center border-t border-slate-600/50 z-30 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]" style={{ height: BUTTONS_BAR_HEIGHT }}>
           {currentQuestion ? (
             <div className="w-full flex flex-col items-center h-full gap-3">
               <div className="text-white text-base font-bold bg-black/60 px-4 py-2 rounded-2xl border border-white/10 shadow-inner text-center w-full flex items-center justify-center gap-3 relative overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 pointer-events-none" />
                 <span className="truncate drop-shadow-md z-10 text-[17px]">{currentQuestion.prompt}</span>
                 {currentQuestion.type === 'listen' && (
                  <button onClick={() => playAudio(currentQuestion.prompt)} className="bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-300/50 hover:from-blue-300 hover:to-blue-500 text-white rounded-full p-2 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.6)] active:scale-95 transition-transform flex-shrink-0 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 drop-shadow">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                  </button>
                 )}
               </div>
                <div className={`grid ${currentQuestion.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 w-full flex-1 min-h-0`}>
                 {currentQuestion.options.map((opt, i) => (
                   <button 
                     key={i}
                     onClick={() => handleOptionClick(opt)}
                     className={`relative text-white font-black rounded-2xl transition-all flex flex-col items-center justify-center p-3 text-center overflow-hidden active:translate-y-1 active:shadow-none group border-b-4 cursor-pointer ${
                       bossPhase === 'active' ? 'bg-gradient-to-b from-red-600 to-red-800 border-red-900 shadow-[0_4px_0_rgba(127,29,29,1)] hover:from-red-500 hover:to-red-700' 
                       : bossPhase === 'final_boss' ? 'bg-gradient-to-b from-purple-600 to-purple-800 border-purple-900 shadow-[0_4px_0_rgba(88,28,135,1)] hover:from-purple-500 hover:to-purple-700' 
                       : 'bg-blue-600 hover:bg-blue-500 border-blue-800 shadow-[0_4px_0_rgba(30,58,138,1)]'
                     } min-h-[50px]`}
                   >
                     <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 pointer-events-none" />
                     {bossPhase === 'active' && <span className="text-[10px] text-red-200 mb-0.5 leading-none drop-shadow">🚀 مضاد</span>}
                     {bossPhase === 'final_boss' && <span className="text-[10px] text-purple-200 mb-0.5 leading-none drop-shadow">💥 اضرب</span>}
                     <span className="text-base sm:text-lg leading-tight drop-shadow-md relative z-10 break-words">{opt}</span>
                   </button>
                 ))}
               </div>
             </div>
           ) : (
             <div className="text-gray-400 font-bold text-lg h-full flex items-center justify-center">جاري التحميل...</div>
           )}
        </div>

        {/* شاشة النهاية (Game Over) */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-red-600 rounded-3xl p-1 max-w-sm w-full text-center shadow-2xl relative">
              <div className="bg-white rounded-[22px] p-6 text-slate-900 flex flex-col items-center">
                <span className="text-5xl block mb-2 animate-bounce">💥</span>
                <h2 className="text-3xl font-black text-red-600 tracking-tight">انتهت اللعبة!</h2>
                
                <div className="flex w-full justify-between gap-4 mt-4">
                  <div className="flex-1 bg-blue-500 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-white/80 block font-bold">الموجة:</span>
                    <span className="text-xl font-black text-white">{Math.min(waveLevel, 3)}</span>
                  </div>
                  <div className="flex-1 bg-blue-500 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-white/80 block font-bold">النقاط الكلية:</span>
                    <span className="text-xl font-black text-white">{score}</span>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-3 mt-6">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    إعادة المحاولة مجدداً
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
