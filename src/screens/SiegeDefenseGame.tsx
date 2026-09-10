import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Shield,
  Zap,
  Flame,
  RotateCcw,
  Sparkles,
  Swords,
  X,
  Heart,
  Volume2,
  Coins,
  Crown,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useReviewStore, ReviewCard } from '@/store/reviewStore';
import { useFarmStore } from '@/store/farmStore';
import { useUserStore } from '@/store/userStore';
import { speak, bcp47 } from '@/lib/tts';

// --- Sound Synthesizer via Web Audio API (Zero external assets, instant & reliable) ---
class SiegeSoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSummonSound(type: DefenderType) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      if (type === 'wizard') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3);
      } else if (type === 'archer') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 0.2);
      }
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }

  playArrowShot() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (_) {}
  }

  playMagicBolt() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }

  playChainLightning() {
    try {
      this.init();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (_) {}
  }

  playEnemyHit() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (_) {}
  }

  playCastleDamage() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (_) {}
  }

  playVictoryFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.35, this.ctx!.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.12);
        osc.stop(this.ctx!.currentTime + idx * 0.12 + 0.35);
      });
    } catch (_) {}
  }
}

const siegeAudio = new SiegeSoundFX();

// --- Types & Data Structures ---
export interface SiegeDefenseStats {
  mode: string;
  totalCards: number;
  rememberedCount: number;
  struggledCount: number;
  goldEarned: number;
  woodEarned: number;
  gemEarned: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  maxHp: number;
  hp: number;
  speed: number;
  size: number;
  type: 'goblin' | 'orc' | 'boss';
  color: string;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetEnemyId: number;
  speed: number;
  isLightning?: boolean;
  isArrow?: boolean;
  isMagic?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export type DefenderType = 'swordsman' | 'archer' | 'wizard';

interface DefenderUnit {
  id: number;
  type: DefenderType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  range: number;
  state: 'advancing' | 'fighting' | 'guarding';
  targetEnemyId: number | null;
  attackCooldown: number;
  attackTimer: number;
  name: string;
  color: string;
  slashAnim: number;
  cost: number;
}

const STARTER_VOCABULARY_BY_LANG: Record<string, Array<{ id: string; native: string; translation: string; pronunciation: string }>> = {
  de: [
    { id: 'fallback_de_1', native: 'Hallo', translation: 'مرحباً', pronunciation: 'hah-loh' },
    { id: 'fallback_de_2', native: 'Danke', translation: 'شكراً لك', pronunciation: 'dahn-kuh' },
    { id: 'fallback_de_3', native: 'Guten Morgen', translation: 'صباح الخير', pronunciation: 'goo-ten mor-gen' },
    { id: 'fallback_de_4', native: 'Wie geht es dir?', translation: 'كيف حالك؟', pronunciation: 'vee gayt es deer' },
    { id: 'fallback_de_5', native: 'Auf Wiedersehen', translation: 'إلى اللقاء', pronunciation: 'owf vee-der-zayn' },
    { id: 'fallback_de_6', native: 'Gute Nacht', translation: 'تصبح على خير', pronunciation: 'goo-tuh nahkht' },
    { id: 'fallback_de_7', native: 'Willkommen', translation: 'أهلاً وسهلاً', pronunciation: 'vil-kom-en' },
  ],
  fr: [
    { id: 'fallback_fr_1', native: 'Bonjour', translation: 'مرحباً', pronunciation: 'bon-zhoor' },
    { id: 'fallback_fr_2', native: 'Merci', translation: 'شكراً لك', pronunciation: 'mair-see' },
    { id: 'fallback_fr_3', native: 'Bonsoir', translation: 'مساء الخير', pronunciation: 'bon-swahr' },
    { id: 'fallback_fr_4', native: 'Comment allez-vous?', translation: 'كيف حالك؟', pronunciation: 'koh-mohn tah-lay voo' },
    { id: 'fallback_fr_5', native: 'Au revoir', translation: 'إلى اللقاء', pronunciation: 'oh ruh-vwahr' },
    { id: 'fallback_fr_6', native: 'Bonne nuit', translation: 'تصبح على خير', pronunciation: 'bun nwee' },
    { id: 'fallback_fr_7', native: 'Bienvenue', translation: 'أهلاً وسهلاً', pronunciation: 'byen-ven-oo' },
  ],
  es: [
    { id: 'fallback_es_1', native: 'Hola', translation: 'مرحباً', pronunciation: 'oh-lah' },
    { id: 'fallback_es_2', native: 'Gracias', translation: 'شكراً لك', pronunciation: 'grah-syahs' },
    { id: 'fallback_es_3', native: 'Buenos días', translation: 'صباح الخير', pronunciation: 'bway-nos dee-ahs' },
    { id: 'fallback_es_4', native: '¿Cómo estás?', translation: 'كيف حالك؟', pronunciation: 'koh-moh es-tahs' },
    { id: 'fallback_es_5', native: 'Adiós', translation: 'إلى اللقاء', pronunciation: 'ah-dyohs' },
    { id: 'fallback_es_6', native: 'Buenas noches', translation: 'تصبح على خير', pronunciation: 'bway-nahs noh-ches' },
    { id: 'fallback_es_7', native: 'Bienvenido', translation: 'أهلاً وسهلاً', pronunciation: 'byen-veh-nee-doh' },
  ],
  it: [
    { id: 'fallback_it_1', native: 'Ciao', translation: 'مرحباً', pronunciation: 'chow' },
    { id: 'fallback_it_2', native: 'Grazie', translation: 'شكراً لك', pronunciation: 'graht-syay' },
    { id: 'fallback_it_3', native: 'Buongiorno', translation: 'صباح الخير', pronunciation: 'bwon-zhor-noh' },
    { id: 'fallback_it_4', native: 'Come stai?', translation: 'كيف حالك؟', pronunciation: 'koh-may sty' },
    { id: 'fallback_it_5', native: 'Arrivederci', translation: 'إلى اللقاء', pronunciation: 'ah-ree-veh-dair-chee' },
    { id: 'fallback_it_6', native: 'Buonanotte', translation: 'تصبح على خير', pronunciation: 'bwon-ah-not-tay' },
    { id: 'fallback_it_7', native: 'Benvenuto', translation: 'أهلاً وسهلاً', pronunciation: 'ben-veh-noo-toh' },
  ],
  ja: [
    { id: 'fallback_ja_1', native: 'Konnichiwa', translation: 'مرحباً', pronunciation: 'kon-nee-chee-wah' },
    { id: 'fallback_ja_2', native: 'Arigatou', translation: 'شكراً لك', pronunciation: 'ah-ree-gah-toh' },
    { id: 'fallback_ja_3', native: 'Ohayou', translation: 'صباح الخير', pronunciation: 'oh-hah-yoh' },
    { id: 'fallback_ja_4', native: 'Ogenki desu ka?', translation: 'كيف حالك؟', pronunciation: 'oh-gen-kee des kah' },
    { id: 'fallback_ja_5', native: 'Sayounara', translation: 'إلى اللقاء', pronunciation: 'sah-yoh-nah-rah' },
    { id: 'fallback_ja_6', native: 'Oyasumi', translation: 'تصبح على خير', pronunciation: 'oh-yah-soo-mee' },
    { id: 'fallback_ja_7', native: 'Youkoso', translation: 'أهلاً وسهلاً', pronunciation: 'yoh-koh-soh' },
  ],
  zh: [
    { id: 'fallback_zh_1', native: 'Ni hao', translation: 'مرحباً', pronunciation: 'nee how' },
    { id: 'fallback_zh_2', native: 'Xie xie', translation: 'شكراً لك', pronunciation: 'shyeh shyeh' },
    { id: 'fallback_zh_3', native: 'Zao shang hao', translation: 'صباح الخير', pronunciation: 'dzow shahng how' },
    { id: 'fallback_zh_4', native: 'Ni hao ma?', translation: 'كيف حالك؟', pronunciation: 'nee how mah' },
    { id: 'fallback_zh_5', native: 'Zai jian', translation: 'إلى اللقاء', pronunciation: 'dzye jyen' },
    { id: 'fallback_zh_6', native: 'Wan an', translation: 'تصبح على خير', pronunciation: 'wahn ahn' },
    { id: 'fallback_zh_7', native: 'Huan ying', translation: 'أهلاً وسهلاً', pronunciation: 'hwan yeeng' },
  ],
  en: [
    { id: 'fallback_en_1', native: 'Hello', translation: 'مرحباً', pronunciation: 'hel-oh' },
    { id: 'fallback_en_2', native: 'Thank you', translation: 'شكراً لك', pronunciation: 'thank-yoo' },
    { id: 'fallback_en_3', native: 'Good morning', translation: 'صباح الخير', pronunciation: 'good-mor-ning' },
    { id: 'fallback_en_4', native: 'How are you?', translation: 'كيف حالك؟', pronunciation: 'how-ar-yoo' },
    { id: 'fallback_en_5', native: 'Goodbye', translation: 'إلى اللقاء', pronunciation: 'good-bye' },
    { id: 'fallback_en_6', native: 'Good night', translation: 'تصبح على خير', pronunciation: 'good-nyte' },
    { id: 'fallback_en_7', native: 'Welcome', translation: 'أهلاً وسهلاً', pronunciation: 'wel-kum' },
  ],
};

interface QuizItem {
  cardId: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
  pronunciation?: string;
  rawCard: any;
}

interface SiegeDefenseGameProps {
  flashcards?: any[];
  onClose: (stats?: SiegeDefenseStats) => void;
}

export default function SiegeDefenseGame({ flashcards, onClose }: SiegeDefenseGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { targetLanguage, uiLang } = useUserStore();
  const isAr = uiLang === 'ar';
  const { recordCardReview } = useReviewStore();
  const { addResources } = useFarmStore();

  // Wave Progression (Blitz 3 Waves)
  const [wave, setWave] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [castleHp, setCastleHp] = useState(100);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [screenShake, setScreenShake] = useState(0);

  // Victory / Defeat States
  const [isVictory, setIsVictory] = useState(false);
  const [isDefeat, setIsDefeat] = useState(false);
  const [lootClaimed, setLootClaimed] = useState(false);

  // Stats tracking
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  const [struggledCards, setStruggledCards] = useState<string[]>([]);

  // Simulation entities (Starts with ZERO defenders on field as requested!)
  const enemiesRef = useRef<Enemy[]>([]);
  const defendersRef = useRef<DefenderUnit[]>([]);
  const enemySpawnTimerRef = useRef<any>(null);
  const [unitCounts, setUnitCounts] = useState({ swordsmen: 0, archers: 0, wizards: 0 });
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Convert raw flashcards into normalized Quiz items (Strictly isolated by target language)
  const quizDeck: QuizItem[] = useMemo(() => {
    const langKey = (targetLanguage || 'en').toLowerCase();
    const fallbackList = STARTER_VOCABULARY_BY_LANG[langKey] || STARTER_VOCABULARY_BY_LANG.zh;

    // Filter incoming flashcards strictly by the learner's active target language
    const filteredFlashcards = (flashcards || []).filter((c: any) => {
      const cardLang = (c.language || '').toLowerCase();
      return cardLang === langKey;
    });

    const rawList = filteredFlashcards.length > 0 ? filteredFlashcards : fallbackList;

    // Build unique Arabic translation pool for distractors
    const allTranslations = Array.from(new Set(rawList.map((c: any) => c.translation || c.back || ''))).filter(Boolean);

    return rawList.map((card: any, idx: number) => {
      const prompt = card.native || card.front || card.word || `Phrase ${idx + 1}`;
      const correctAnswer = card.translation || card.back || 'معنى العبارة';
      const pronunciation = card.pronunciation || card.phonetic || '';

      // Pick 3 random distractors
      const distractors = allTranslations.filter((t) => t !== correctAnswer);
      const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
      while (shuffledDistractors.length < 3) {
        shuffledDistractors.push(`خيار ${shuffledDistractors.length + 2}`);
      }

      const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);

      return {
        cardId: card.id || `card_${idx}`,
        prompt,
        correctAnswer,
        options,
        pronunciation,
        rawCard: card,
      };
    });
  }, [flashcards, targetLanguage]);

  // Questions allocated across 3 waves
  const totalQuestions = quizDeck.length;
  const currentItem = quizDeck[currentQuestionIndex % quizDeck.length];

  // Spawn enemies gradually (شيئاً فشيئاً) so player has time to answer and summon defenders
  const spawnEnemiesForWave = (w: number) => {
    if (enemySpawnTimerRef.current) {
      clearInterval(enemySpawnTimerRef.current);
      enemySpawnTimerRef.current = null;
    }

    enemiesRef.current = [];
    const count = w === 1 ? 3 : w === 2 ? 5 : 7;
    let spawned = 0;

    const spawnSingleEnemy = (i: number) => {
      const isBoss = w === 3 && i === 0;
      const roadY = 140 - 20 + 20; // Road center
      const spawnX = 390;
      const spawnY = roadY + (Math.random() - 0.5) * 24;

      enemiesRef.current.push({
        id: Math.random(),
        x: spawnX,
        y: spawnY,
        maxHp: isBoss ? 260 : w === 2 ? 90 : 45,
        hp: isBoss ? 260 : w === 2 ? 90 : 45,
        // Gentle, manageable speed so monsters do not rush the castle
        speed: isBoss ? 0.20 : w === 2 ? 0.28 : 0.35,
        size: isBoss ? 20 : w === 2 ? 14 : 10,
        type: isBoss ? 'boss' : w === 2 ? 'orc' : 'goblin',
        color: isBoss ? '#dc2626' : w === 2 ? '#f97316' : '#22c55e',
      });
    };

    // Spawn 1st enemy immediately
    spawnSingleEnemy(0);
    spawned = 1;

    // Spawn remaining enemies gradually every 4 seconds
    if (count > 1) {
      enemySpawnTimerRef.current = setInterval(() => {
        if (spawned < count) {
          spawnSingleEnemy(spawned);
          spawned++;
        } else {
          if (enemySpawnTimerRef.current) {
            clearInterval(enemySpawnTimerRef.current);
            enemySpawnTimerRef.current = null;
          }
        }
      }, 4000);
    }
  };

  // Start initial wave (Starts with EXACTLY ZERO soldiers on the field as per user specification)
  useEffect(() => {
    defendersRef.current = [];
    setUnitCounts({ swordsmen: 0, archers: 0, wizards: 0 });
    spawnEnemiesForWave(1);
    return () => {
      if (enemySpawnTimerRef.current) {
        clearInterval(enemySpawnTimerRef.current);
        enemySpawnTimerRef.current = null;
      }
    };
  }, []);

  // Main Canvas Render & Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = canvas.width;
      const h = canvas.height;

      // 1. Render Kingdom Architect Village Terrain (Lush Grass, Checker Shading, Dirt Path)
      ctx.fillStyle = '#2d6a4f'; // Rich medieval grass base
      ctx.fillRect(0, 0, w, h);

      // Grass checker grid (matching Kingdom Architect tile pattern)
      const tileSize = 28;
      for (let r = 0; r < Math.ceil(h / tileSize); r++) {
        for (let c = 0; c < Math.ceil(w / tileSize); c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillStyle = '#40916c';
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
          }
        }
      }

      // Cobblestone / Dirt Road connecting right to the Fortress gate
      const roadY = h / 2 - 20;
      const roadHeight = 40;
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(40, roadY, w, roadHeight);
      ctx.fillStyle = '#a06535';
      ctx.fillRect(40, roadY + 3, w, roadHeight - 6);

      // Cobblestones on road
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let rx = 50; rx < w; rx += 22) {
        ctx.fillRect(rx, roadY + 6, 8, 5);
        ctx.fillRect(rx + 10, roadY + 22, 10, 6);
      }

      // Decorative Trees (top & bottom border like Kingdom Architect)
      const drawTree = (tx: number, ty: number) => {
        // Trunk
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(tx - 4, ty + 10, 8, 14);
        // Foliage layers
        ctx.beginPath();
        ctx.arc(tx, ty + 4, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#1b4332';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx - 3, ty - 4, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#2d6a4f';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx + 2, ty - 6, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#52b788';
        ctx.fill();
      };

      drawTree(90, 25);
      drawTree(160, 28);
      drawTree(240, 22);
      drawTree(310, 30);
      drawTree(90, h - 35);
      drawTree(180, h - 30);
      drawTree(270, h - 36);

      // 2. Draw Kingdom Architect Fortress & Sentry Spire
      const castleX = 45;
      const castleY = h / 2;

      // Stone ramparts
      ctx.fillStyle = '#334155';
      ctx.fillRect(castleX - 35, castleY - 65, 45, 130);
      ctx.fillStyle = '#475569';
      // Battlements
      for (let by = castleY - 65; by < castleY + 65; by += 26) {
        ctx.fillRect(castleX + 10, by, 12, 16);
      }

      // Fortress Sentry Spire (Center Round Tower)
      ctx.beginPath();
      ctx.arc(castleX, castleY, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f59e0b'; // Royal Gold border
      ctx.stroke();

      // Glowing Spire Crystal (Kingdom Arcane Core)
      const crystalPulse = 0.7 + Math.sin(time * 0.005) * 0.3;
      ctx.beginPath();
      ctx.arc(castleX, castleY, 14, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${crystalPulse})`;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hero Guardian Avatar on the Spire
      ctx.beginPath();
      ctx.arc(castleX, castleY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(castleX - 5, castleY - 12, 10, 4); // Golden Crown

      // Castle HP Circular Ring
      const hpPercent = Math.max(0, castleHp / 100);
      ctx.beginPath();
      ctx.arc(castleX, castleY, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpPercent);
      ctx.strokeStyle = hpPercent > 0.4 ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 3. Update & Draw Defender Units (Swordsmen, Archers, Wizards)
      const defenders = defendersRef.current;
      for (let di = defenders.length - 1; di >= 0; di--) {
        const d = defenders[di];
        d.slashAnim = Math.max(0, d.slashAnim - dt);
        d.attackTimer = Math.max(0, d.attackTimer - dt);

        // Find nearest living enemy
        let closestE: Enemy | null = null;
        let minEDist = Infinity;
        for (const e of enemiesRef.current) {
          const dist = Math.hypot(e.x - d.x, e.y - d.y);
          if (dist < minEDist) {
            minEDist = dist;
            closestE = e;
          }
        }

        // Combat behavior by defender unit type
        if (d.type === 'swordsman') {
          // Melee Swordsman: Marches right into enemy lines
          if (closestE && minEDist > d.range) {
            const dx = closestE.x - d.x;
            const dy = closestE.y - d.y;
            d.x += (dx / minEDist) * d.speed * 60 * dt;
            d.y += (dy / minEDist) * d.speed * 60 * dt;
          } else if (closestE && minEDist <= d.range) {
            if (d.attackTimer <= 0) {
              d.attackTimer = d.attackCooldown;
              d.slashAnim = 0.22;
              closestE.hp -= d.damage;
              siegeAudio.playEnemyHit();

              // Spark particles
              for (let k = 0; k < 6; k++) {
                const pAngle = Math.random() * Math.PI * 2;
                const pSpeed = 30 + Math.random() * 50;
                particlesRef.current.push({
                  x: closestE.x,
                  y: closestE.y,
                  vx: Math.cos(pAngle) * pSpeed,
                  vy: Math.sin(pAngle) * pSpeed,
                  color: '#facc15',
                  size: 2 + Math.random() * 2,
                  life: 0.3,
                  maxLife: 0.3,
                });
              }

              floatingTextsRef.current.push({
                id: Math.random(),
                x: closestE.x,
                y: closestE.y - 12,
                text: `⚔️ -${d.damage}`,
                color: '#facc15',
                life: 0.8,
              });

              if (closestE.hp <= 0) {
                enemiesRef.current = enemiesRef.current.filter((e) => e.id !== closestE!.id);
              }
            }
          }
        } else if (d.type === 'archer') {
          // Royal Archer: Keeps safe distance and shoots arrows
          if (closestE && minEDist > 150) {
            const dx = closestE.x - d.x;
            const dy = closestE.y - d.y;
            d.x += (dx / minEDist) * d.speed * 60 * dt;
            d.y += (dy / minEDist) * d.speed * 60 * dt;
          }
          if (closestE && minEDist <= d.range && d.attackTimer <= 0) {
            d.attackTimer = d.attackCooldown;
            d.slashAnim = 0.24; // Bow draw
            siegeAudio.playArrowShot();

            projectilesRef.current.push({
              id: Math.random(),
              x: d.x + 6,
              y: d.y - 2,
              targetX: closestE.x,
              targetY: closestE.y,
              targetEnemyId: closestE.id,
              speed: 480,
              isArrow: true,
            });
          }
        } else if (d.type === 'wizard') {
          // Arcane Wizard: Stays near castle and casts magic spells & chain lightning
          if (closestE && minEDist > 200) {
            const dx = closestE.x - d.x;
            const dy = closestE.y - d.y;
            d.x += (dx / minEDist) * d.speed * 60 * dt;
            d.y += (dy / minEDist) * d.speed * 60 * dt;
          }
          if (closestE && minEDist <= d.range && d.attackTimer <= 0) {
            d.attackTimer = d.attackCooldown;
            d.slashAnim = 0.35; // Glowing staff
            const isLightning = Math.random() > 0.55;

            if (isLightning) {
              siegeAudio.playChainLightning();
              enemiesRef.current.forEach((enemy) => {
                projectilesRef.current.push({
                  id: Math.random(),
                  x: d.x + 8,
                  y: d.y - 8,
                  targetX: enemy.x,
                  targetY: enemy.y,
                  targetEnemyId: enemy.id,
                  speed: 560,
                  isLightning: true,
                });
              });
            } else {
              siegeAudio.playMagicBolt();
              projectilesRef.current.push({
                id: Math.random(),
                x: d.x + 8,
                y: d.y - 8,
                targetX: closestE.x,
                targetY: closestE.y,
                targetEnemyId: closestE.id,
                speed: 420,
                isMagic: true,
              });
            }
          }
        }

        // Draw Defender Shadow
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 10, 10, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();

        // Draw Defender Character Sprite by Type
        if (d.type === 'swordsman') {
          // Swordsman: Blue heavy armor, visor, round shield, swinging sword
          ctx.beginPath();
          ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#f8fafc';
          ctx.stroke();

          // Visor
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(d.x - 4, d.y - 6, 8, 3);

          // Shield
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(d.x - 7, d.y + 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Sword
          const swordAngle = d.slashAnim > 0 ? Math.PI / 4 : -Math.PI / 6;
          ctx.save();
          ctx.translate(d.x + 8, d.y);
          ctx.rotate(swordAngle);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(0, -2, 12, 4);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(-2, -4, 3, 8);
          ctx.restore();
        } else if (d.type === 'archer') {
          // Archer: Forest green tunic, archer cap, quiver, curved wooden bow
          ctx.beginPath();
          ctx.arc(d.x, d.y, 9, 0, Math.PI * 2);
          ctx.fillStyle = '#15803d';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#86efac';
          ctx.stroke();

          // Cap & Feather
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.moveTo(d.x - 6, d.y - 4);
          ctx.lineTo(d.x, d.y - 12);
          ctx.lineTo(d.x + 6, d.y - 4);
          ctx.fill();
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(d.x + 2, d.y - 14, 2, 6);

          // Quiver
          ctx.fillStyle = '#78350f';
          ctx.fillRect(d.x - 8, d.y - 6, 3, 10);

          // Bow
          ctx.beginPath();
          ctx.arc(d.x + 7, d.y, 9, -Math.PI / 3, Math.PI / 3);
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Bow string
          ctx.beginPath();
          ctx.moveTo(d.x + 11, d.y - 8);
          const pullBack = d.slashAnim > 0 ? -4 : 0;
          ctx.lineTo(d.x + 7 + pullBack, d.y);
          ctx.lineTo(d.x + 11, d.y + 8);
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (d.type === 'wizard') {
          // Wizard: Purple mystic robe, pointed wizard hat, glowing crystal staff
          ctx.beginPath();
          ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#581c87';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#c084fc';
          ctx.stroke();

          // Pointed Hat
          ctx.fillStyle = '#3b0764';
          ctx.beginPath();
          ctx.moveTo(d.x - 7, d.y - 5);
          ctx.lineTo(d.x, d.y - 16);
          ctx.lineTo(d.x + 7, d.y - 5);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.fillRect(d.x - 4, d.y - 7, 8, 2);

          // Staff
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(d.x + 8, d.y + 10);
          ctx.lineTo(d.x + 8, d.y - 12);
          ctx.stroke();

          // Glowing Crystal Orb
          ctx.beginPath();
          ctx.arc(d.x + 8, d.y - 13, 4, 0, Math.PI * 2);
          const orbGlow = d.slashAnim > 0 ? '#38bdf8' : '#a855f7';
          ctx.fillStyle = orbGlow;
          ctx.shadowColor = orbGlow;
          ctx.shadowBlur = d.slashAnim > 0 ? 15 : 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Defender HP Bar
        const dHpPercent = Math.max(0, d.hp / d.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(d.x - 10, d.y - 15, 20, 3);
        ctx.fillStyle = d.type === 'wizard' ? '#c084fc' : d.type === 'archer' ? '#4ade80' : '#38bdf8';
        ctx.fillRect(d.x - 10, d.y - 15, 20 * dHpPercent, 3);

        // Check defender death
        if (d.hp <= 0) {
          defenders.splice(di, 1);
          setUnitCounts({
            swordsmen: defenders.filter((u) => u.type === 'swordsman').length,
            archers: defenders.filter((u) => u.type === 'archer').length,
            wizards: defenders.filter((u) => u.type === 'wizard').length,
          });
        }
      }

      // 4. Update & Draw Enemies (Zombies, Goblins, Orcs, Boss)
      const enemies = enemiesRef.current;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Check if fighting an engaging defender unit
        let fightingDefender: DefenderUnit | null = null;
        for (const d of defendersRef.current) {
          if (Math.hypot(d.x - e.x, d.y - e.y) <= 26) {
            fightingDefender = d;
            break;
          }
        }

        if (fightingDefender) {
          // Attack defender instead of advancing
          fightingDefender.hp -= 14 * dt;
          if (fightingDefender.hp <= 0) {
            siegeAudio.playEnemyHit();
          }
        } else {
          // March toward castle
          const dx = castleX - e.x;
          const dy = castleY - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 45) {
            e.x += (dx / dist) * e.speed * 60 * dt;
            e.y += (dy / dist) * e.speed * 60 * dt;
          } else {
            // Reached castle wall: attack!
            setCastleHp((prev) => {
              const next = Math.max(0, prev - Math.round(12 * dt));
              if (next === 0 && !isDefeat) {
                setIsDefeat(true);
                siegeAudio.playCastleDamage();
              }
              return next;
            });
          }
        }

        // Enemy Shadow
        ctx.beginPath();
        ctx.ellipse(e.x, e.y + e.size - 2, e.size * 0.9, e.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();

        // Enemy Sprite
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e293b';
        ctx.stroke();

        // Glowing red monster eyes
        ctx.fillStyle = '#fee2e2';
        ctx.beginPath();
        ctx.arc(e.x - 4, e.y - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(e.x + 4, e.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(e.x - 4, e.y - 2, 1.2, 0, Math.PI * 2);
        ctx.arc(e.x + 4, e.y - 2, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Pointy Goblin Ears
        if (e.type === 'goblin') {
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.moveTo(e.x - e.size, e.y - 2);
          ctx.lineTo(e.x - e.size - 5, e.y - 6);
          ctx.lineTo(e.x - e.size + 2, e.y);
          ctx.moveTo(e.x + e.size, e.y - 2);
          ctx.lineTo(e.x + e.size + 5, e.y - 6);
          ctx.lineTo(e.x + e.size - 2, e.y);
          ctx.fill();
        }

        // Boss Horns / Crown & Dark Aura
        if (e.type === 'boss') {
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.moveTo(e.x - 8, e.y - e.size);
          ctx.lineTo(e.x - 4, e.y - e.size - 12);
          ctx.lineTo(e.x, e.y - e.size);
          ctx.moveTo(e.x, e.y - e.size);
          ctx.lineTo(e.x + 4, e.y - e.size - 12);
          ctx.lineTo(e.x + 8, e.y - e.size);
          ctx.fill();
        }

        // HP bar above enemy
        const enemyHpPercent = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - 14, e.y - e.size - 8, 28, 4);
        ctx.fillStyle = enemyHpPercent > 0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(e.x - 14, e.y - e.size - 8, 28 * enemyHpPercent, 4);
      }

      // 5. Update & Draw Projectiles (Arrows, Magic Bolts & Lightning)
      const projectiles = projectilesRef.current;
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15 || p.isLightning) {
          const target = enemies.find((e) => e.id === p.targetEnemyId) || enemies[0];
          if (target) {
            const hitDamage = p.isLightning ? 140 : p.isArrow ? 50 : 70;
            target.hp -= hitDamage;

            floatingTextsRef.current.push({
              id: Math.random(),
              x: target.x,
              y: target.y - 10,
              text: p.isLightning ? '⚡ LIGHTNING CRIT!' : p.isArrow ? `🏹 -${hitDamage}` : `🔮 -${hitDamage}`,
              color: p.isLightning ? '#38bdf8' : p.isArrow ? '#4ade80' : '#c084fc',
              life: 1.0,
            });

            for (let k = 0; k < 7; k++) {
              const pAngle = Math.random() * Math.PI * 2;
              const pSpeed = 40 + Math.random() * 80;
              particlesRef.current.push({
                x: target.x,
                y: target.y,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                color: p.isLightning ? '#38bdf8' : p.isArrow ? '#4ade80' : '#f59e0b',
                size: 2 + Math.random() * 2.5,
                life: 0.4,
                maxLife: 0.4,
              });
            }

            siegeAudio.playEnemyHit();

            if (target.hp <= 0) {
              enemiesRef.current = enemiesRef.current.filter((e) => e.id !== target.id);
            }
          }

          projectiles.splice(i, 1);
          continue;
        }

        // Move projectile forward
        p.x += (dx / dist) * p.speed * 60 * dt;
        p.y += (dy / dist) * p.speed * 60 * dt;

        // Draw Projectile
        if (p.isArrow) {
          const angle = Math.atan2(dy, dx);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-10, -1, 14, 2); // Shaft
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(6, -3);
          ctx.lineTo(10, 0);
          ctx.lineTo(6, 3);
          ctx.fill(); // Tip
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-10, -2.5, 3, 5); // Fletching
          ctx.restore();
        } else if (p.isLightning) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 6. Update & Draw Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;

        if (pt.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = Math.max(0, pt.life / pt.maxLife);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 7. Update & Draw Floating Damage Texts
      const texts = floatingTextsRef.current;
      for (let i = texts.length - 1; i >= 0; i--) {
        const ft = texts[i];
        ft.y -= 25 * dt;
        ft.life -= dt;

        if (ft.life <= 0) {
          texts.splice(i, 1);
          continue;
        }

        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [castleHp, isDefeat]);

  // Current summon tier and reward based on streak
  const currentSummonTier = useMemo(() => {
    const cycle = streak % 3;
    if (cycle === 0) {
      return {
        type: 'swordsman' as DefenderType,
        nameAr: 'مقاتل بالسيف',
        icon: '⚔️',
        cost: 30,
        color: '#2563eb',
        tag: 'ثمن الإجابة: 30🪙',
      };
    } else if (cycle === 1) {
      return {
        type: 'archer' as DefenderType,
        nameAr: 'رامي سهام ملكي',
        icon: '🏹',
        cost: 60,
        color: '#16a34a',
        tag: 'ثمن الإجابة: 60🪙',
      };
    } else {
      return {
        type: 'wizard' as DefenderType,
        nameAr: 'ساحر الصواعق',
        icon: '🧙‍♂️',
        cost: 100,
        color: '#9333ea',
        tag: 'ثمن الإجابة: 100🪙',
      };
    }
  }, [streak]);

  // Handle Question Answer Choice
  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentItem) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isMatch = option.trim().toLowerCase() === currentItem.correctAnswer.trim().toLowerCase();
    setIsCorrect(isMatch);

    if (isMatch) {
      const roadY = 140 - 20; // 120
      const tier = currentSummonTier;
      const dIdx = defendersRef.current.length;

      // 1. Summon Defender Unit strictly via correct answer with distinct cost and type
      if (tier.type === 'swordsman') {
        defendersRef.current.push({
          id: Math.random(),
          type: 'swordsman',
          x: 65,
          y: roadY + 20 + ((dIdx % 3) - 1) * 10,
          hp: 200,
          maxHp: 200,
          damage: 35,
          speed: 0.85,
          range: 28,
          state: 'advancing',
          targetEnemyId: null,
          attackCooldown: 0.65,
          attackTimer: 0,
          name: 'مقاتل بالسيف',
          color: '#2563eb',
          slashAnim: 0,
          cost: tier.cost,
        });
      } else if (tier.type === 'archer') {
        defendersRef.current.push({
          id: Math.random(),
          type: 'archer',
          x: 55,
          y: roadY + 12 + ((dIdx % 2) - 0.5) * 16,
          hp: 130,
          maxHp: 130,
          damage: 45,
          speed: 0.55,
          range: 190,
          state: 'guarding',
          targetEnemyId: null,
          attackCooldown: 0.85,
          attackTimer: 0,
          name: 'رامي سهام ملكي',
          color: '#16a34a',
          slashAnim: 0,
          cost: tier.cost,
        });
      } else {
        defendersRef.current.push({
          id: Math.random(),
          type: 'wizard',
          x: 50,
          y: roadY + 20,
          hp: 100,
          maxHp: 100,
          damage: 75,
          speed: 0.40,
          range: 260,
          state: 'guarding',
          targetEnemyId: null,
          attackCooldown: 1.1,
          attackTimer: 0,
          name: 'ساحر الصواعق',
          color: '#9333ea',
          slashAnim: 0,
          cost: tier.cost,
        });
      }

      // Update unit counts in state
      setUnitCounts({
        swordsmen: defendersRef.current.filter((u) => u.type === 'swordsman').length,
        archers: defendersRef.current.filter((u) => u.type === 'archer').length,
        wizards: defendersRef.current.filter((u) => u.type === 'wizard').length,
      });

      // Play specific summon sound
      siegeAudio.playSummonSound(tier.type);

      floatingTextsRef.current.push({
        id: Math.random(),
        x: 80,
        y: roadY - 10,
        text: `✨ تم استدعاء ${tier.nameAr}! (-${tier.cost}🪙)`,
        color: '#4ade80',
        life: 1.6,
      });

      // Sentry Spire Support Fire
      const nearestEnemy = enemiesRef.current[0];
      const targetX = nearestEnemy ? nearestEnemy.x : 220;
      const targetY = nearestEnemy ? nearestEnemy.y : 120;

      const newStreak = streak + 1;
      setStreak(newStreak);

      const isChainLightning = newStreak % 3 === 0;

      if (isChainLightning) {
        siegeAudio.playChainLightning();
        setScreenShake(8);
        setTimeout(() => setScreenShake(0), 400);

        enemiesRef.current.forEach((enemy) => {
          projectilesRef.current.push({
            id: Math.random(),
            x: 50,
            y: 150,
            targetX: enemy.x,
            targetY: enemy.y,
            targetEnemyId: enemy.id,
            speed: 600,
            isLightning: true,
          });
        });
      } else {
        siegeAudio.playMagicBolt();
        projectilesRef.current.push({
          id: Math.random(),
          x: 50,
          y: 150,
          targetX,
          targetY,
          targetEnemyId: nearestEnemy ? nearestEnemy.id : 0,
          speed: 420,
        });
      }

      setMasteredCards((prev) => Array.from(new Set([...prev, currentItem.cardId])));
    } else {
      // Wrong answer: Enemy strikes castle!
      siegeAudio.playCastleDamage();
      setStreak(0);
      setScreenShake(10);
      setTimeout(() => setScreenShake(0), 500);
      setCastleHp((hp) => Math.max(0, hp - 20));
      setStruggledCards((prev) => Array.from(new Set([...prev, currentItem.cardId])));
    }

    // Auto advance question after 1.2 seconds
    setTimeout(() => {
      advanceStep();
    }, 1200);
  };

  // Advance to next question or next wave
  const advanceStep = () => {
    const nextIdx = currentQuestionIndex + 1;

    // Check wave progression:
    // Wave 1 finishes after 3 questions
    // Wave 2 finishes after 7 questions (3 + 4)
    // Wave 3 finishes after 11 questions (3 + 4 + 4)
    if (nextIdx === 3 && wave === 1) {
      setWave(2);
      spawnEnemiesForWave(2);
    } else if (nextIdx === 7 && wave === 2) {
      setWave(3);
      spawnEnemiesForWave(3);
    } else if (nextIdx >= Math.min(11, totalQuestions)) {
      // Victory!
      setIsVictory(true);
      siegeAudio.playVictoryFanfare();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      return;
    }

    setCurrentQuestionIndex(nextIdx);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(null);
  };

  // Finalize victory rewards and update SRS & Farm stores
  const handleClaimLoot = () => {
    if (lootClaimed) return;
    setLootClaimed(true);

    const goldReward = 60;
    const woodReward = 40;
    const gemReward = 2;

    // 1. Deliver resources to farm/kingdom
    addResources(goldReward, woodReward, gemReward);

    // 2. Deliver card reviews to SRS store
    masteredCards.forEach((id) => {
      recordCardReview(id, 'good');
    });
    struggledCards.forEach((id) => {
      recordCardReview(id, 'again');
    });

    // 3. Return callback
    onClose({
      mode: 'siege',
      totalCards: quizDeck.length,
      rememberedCount: masteredCards.length,
      struggledCount: struggledCards.length,
      goldEarned: goldReward,
      woodEarned: woodReward,
      gemEarned: gemReward,
    });
  };

  // Keyboard shortcut support (1, 2, 3, 4 for options)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || isVictory || isDefeat || !currentItem) return;
      if (e.key === '1' && currentItem.options[0]) handleSelectOption(currentItem.options[0]);
      if (e.key === '2' && currentItem.options[1]) handleSelectOption(currentItem.options[1]);
      if (e.key === '3' && currentItem.options[2]) handleSelectOption(currentItem.options[2]);
      if (e.key === '4' && currentItem.options[3]) handleSelectOption(currentItem.options[3]);
      if (e.code === 'Space') {
        e.preventDefault();
        speak(currentItem.prompt, bcp47(targetLanguage));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentItem, isAnswered, isVictory, isDefeat]);

  const totalSoldiers = unitCounts.swordsmen + unitCounts.archers + unitCounts.wizards;

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none ${
        screenShake > 0 ? 'animate-bounce' : ''
      }`}
      style={{
        transform: screenShake > 0 ? `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)` : 'none',
      }}
    >
      {/* Top HUD Bar */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onClose()}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer"
            title="خروج"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black text-sm flex items-center gap-1">
                <Crown className="w-4 h-4" />
                {isAr ? 'حصار المملكة' : 'Siege Defense'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                الموجة {wave} / 3
              </span>
            </div>
            {/* Castle HP Mini Bar */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <Heart className="w-3 h-3 text-rose-400" />
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    castleHp > 40 ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${castleHp}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">{castleHp}%</span>
            </div>
          </div>
        </div>

        {/* Units Counter HUD Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/90 border border-slate-700 rounded-full text-xs font-bold text-slate-300 shadow-sm">
            <span className="text-sky-400" title="مقاتل بالسيف (30🪙)">⚔️ {unitCounts.swordsmen}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400" title="رامي سهام ملكي (60🪙)">🏹 {unitCounts.archers}</span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-400" title="ساحر الصواعق (100🪙)">🧙‍♂️ {unitCounts.wizards}</span>
          </div>

          {streak >= 2 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 font-black text-xs animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{streak} متتالية!</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-3 py-1 bg-slate-800/80 rounded-full text-xs font-mono font-bold text-slate-200">
            <span>{currentQuestionIndex + 1}</span>
            <span className="text-slate-500">/</span>
            <span>{Math.min(11, totalQuestions)}</span>
          </div>
        </div>
      </header>

      {/* 2D Canvas Battle Arena */}
      <div className="flex-1 relative w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={280}
          className="w-full h-full max-h-[320px] object-cover"
        />

        {/* Floating Streak Lightning Alert */}
        {streak > 0 && streak % 3 === 0 && (
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
            <div className="px-4 py-1 bg-sky-500 text-white font-black text-xs rounded-full shadow-[0_0_20px_rgba(56,189,248,0.8)] animate-bounce flex items-center gap-1">
              <Zap className="w-4 h-4 fill-white" />
              <span>عاصفة الصواعق نشطة! ⚡</span>
            </div>
          </div>
        )}

        {/* Soldier Deployment Status Banner (Starts with 0, summons by price) */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
          <div className="px-3.5 py-1 bg-slate-900/90 border border-slate-700/80 rounded-full text-[11px] font-bold text-slate-300 shadow-md flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {totalSoldiers === 0
                ? (isAr ? '0 جنود في الميدان — أجب إجابة صحيحة لاستدعاء جندي أو رامي سهام أو ساحر بثمن الإجابة!' : '0 defenders on field — answer correctly to summon units by answer price!')
                : (isAr ? `🛡️ جيشك في الميدان: ${unitCounts.swordsmen} مقاتل بالسيف • ${unitCounts.archers} رامي سهام • ${unitCounts.wizards} ساحر صواعق` : `🛡️ Army: ${unitCounts.swordsmen} Swordsmen • ${unitCounts.archers} Archers • ${unitCounts.wizards} Wizards`)}
            </span>
          </div>
        </div>
      </div>

      {/* Question Card & Action Panel */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0 flex flex-col gap-3">
        {currentItem && (
          <>
            {/* Prompt Banner & Next Summon Price Indicator */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'اضرب العدو بالترجمة الصحيحة:' : 'Target with the correct meaning:'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span>{currentSummonTier.icon}</span>
                    <span>استدعاء: {currentSummonTier.nameAr}</span>
                    <span className="text-amber-400 font-mono">({currentSummonTier.cost}🪙)</span>
                  </span>
                </div>
                <div className="text-xl font-black text-amber-300 tracking-wide" dir="ltr">
                  {currentItem.prompt}
                </div>
                {currentItem.pronunciation && (
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    /{currentItem.pronunciation}/
                  </div>
                )}
              </div>

              {/* Audio Listen Button */}
              <button
                onClick={() => speak(currentItem.prompt, bcp47(targetLanguage))}
                className="w-11 h-11 bg-slate-700/80 hover:bg-slate-600 rounded-xl flex items-center justify-center text-slate-200 active:scale-95 transition-transform cursor-pointer shadow-md"
                title="استمع للنطق"
              >
                <Volume2 className="w-5 h-5 text-amber-400" />
              </button>
            </div>

            {/* Multiple Choice Option Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentItem.options.map((option, idx) => {
                let btnStyle = 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100';

                if (isAnswered) {
                  if (option === currentItem.correctAnswer) {
                    btnStyle = 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]';
                  } else if (option === selectedOption) {
                    btnStyle = 'bg-rose-600 border-rose-500 text-white animate-shake';
                  } else {
                    btnStyle = 'bg-slate-800/40 border-slate-800/40 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(option)}
                    className={`py-3 px-3 rounded-2xl border-2 font-bold text-sm transition-all duration-150 flex items-center justify-between active:scale-95 cursor-pointer text-right ${btnStyle}`}
                    dir="rtl"
                  >
                    <span className="truncate">{option}</span>
                    <span className="w-5 h-5 rounded-full bg-black/20 text-[10px] font-mono flex items-center justify-center text-slate-400 shrink-0 mr-2">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* VICTORY MODAL OVERLAY */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto mb-3 text-amber-400">
              <Crown className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-amber-400 mb-1">
              {isAr ? 'نصر ملحمي! تم صد الغارة 👑' : 'Victory! Castle Defended 👑'}
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              {isAr
                ? 'أثبتت بسالتك ودقة ذاكرتك في الدفاع عن أسوار المملكة واستدعاء الجيوش!'
                : 'Your memory precision defended the realm ramparts!'}
            </p>

            {/* Kingdom Loot Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-4">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                {isAr ? 'صندوق الغنائم الملكية 📦' : 'Royal Loot Chest 📦'}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/90 p-2 rounded-xl border border-amber-500/20">
                  <div className="text-amber-400 font-black text-base">+60</div>
                  <div className="text-[10px] text-slate-400 font-bold">{isAr ? 'ذهب 🪙' : 'Gold 🪙'}</div>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-xl border border-emerald-500/20">
                  <div className="text-emerald-400 font-black text-base">+40</div>
                  <div className="text-[10px] text-slate-400 font-bold">{isAr ? 'خشب 🪵' : 'Wood 🪵'}</div>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-xl border border-sky-500/20">
                  <div className="text-sky-400 font-black text-base">+2</div>
                  <div className="text-[10px] text-slate-400 font-bold">{isAr ? 'جواهر 💎' : 'Gems 💎'}</div>
                </div>
              </div>
            </div>

            {/* SRS Review Summary */}
            <div className="flex items-center justify-around text-xs text-slate-400 mb-5 font-bold">
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{masteredCards.length} كلمات رُسخت</span>
              </div>
              {struggledCards.length > 0 && (
                <div className="flex items-center gap-1 text-purple-400">
                  <RotateCcw className="w-4 h-4" />
                  <span>{struggledCards.length} للمراجعة القريبة</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleClaimLoot}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isAr ? 'استلام الغنائم والمتابعة' : 'Claim Loot & Continue'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT MODAL OVERLAY */}
      {isDefeat && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center mx-auto mb-3 text-rose-400">
              <Shield className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-rose-400 mb-1">
              {isAr ? 'سقط السور! أعِد المحاولة' : 'Wall Breached! Retry'}
            </h2>
            <p className="text-xs text-slate-300 mb-5">
              {isAr
                ? 'اخترقت الوحوش الدفاعات. مراجعة إضافية ستمنحك القوة للانتصار!'
                : 'Monsters breached the defenses. Another try will secure victory!'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCastleHp(100);
                  setIsDefeat(false);
                  setWave(1);
                  setCurrentQuestionIndex(0);
                  defendersRef.current = [];
                  setUnitCounts({ swordsmen: 0, archers: 0, wizards: 0 });
                  spawnEnemiesForWave(1);
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl cursor-pointer"
              >
                {isAr ? 'العب مجدداً ⚔️' : 'Play Again ⚔️'}
              </button>
              <button
                onClick={() => onClose()}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl cursor-pointer"
              >
                {isAr ? 'خروج' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
