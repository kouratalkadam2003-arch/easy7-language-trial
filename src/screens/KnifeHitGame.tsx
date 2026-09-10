import React, { useState, useEffect, useRef } from 'react';
import { matchText, matchSpeech } from '@/utils/smartMatcher';
import { useLessonTrackerStore } from '@/store/lessonTrackerStore';
import {
  Settings,
  Volume2,
  VolumeX,
  Award,
  RotateCcw,
  Flame,
  Globe,
  Trophy,
  Info,
  Mic,
  MicOff,
  X,
  Sliders,
  HelpCircle
} from 'lucide-react';

function speakTargetLanguage(text: string, langCode: string = 'en-US', onComplete?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onComplete) onComplete();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.85;
  if (onComplete) {
    utterance.onend = () => onComplete();
    utterance.onerror = () => onComplete();
  }
  window.speechSynthesis.speak(utterance);
}

// Vocabulary entries for LingoHit levels
const VOCABULARY_LISTS: { [key: string]: { word: string; translation: string; pronunciation: string }[] } = {
  Spanish: [
    { word: "Hello", translation: "Hola", pronunciation: "OH-lah" },
    { word: "Friend", translation: "Amigo", pronunciation: "ah-MEE-go" },
    { word: "Thank you", translation: "Gracias", pronunciation: "GRAH-syahs" },
    { word: "Apple", translation: "Manzana", pronunciation: "mahn-ZAH-nah" },
    { word: "House", translation: "Casa", pronunciation: "KAH-sah" },
    { word: "Love", translation: "Amor", pronunciation: "ah-MOHR" },
    { word: "Book", translation: "Libro", pronunciation: "LEE-broh" },
    { word: "Water", translation: "Agua", pronunciation: "AH-gwah" },
    { word: "Night", translation: "Noche", pronunciation: "NOH-cheh" }
  ],
  German: [
    { word: "Hello", translation: "Hallo", pronunciation: "HAH-loh" },
    { word: "Friend", translation: "Freund", pronunciation: "froynd" },
    { word: "Thank you", translation: "Danke", pronunciation: "DAHN-keh" },
    { word: "Apple", translation: "Apfel", pronunciation: "AHP-fel" },
    { word: "House", translation: "Haus", pronunciation: "hows" },
    { word: "Book", translation: "Buch", pronunciation: "book" },
    { word: "Water", translation: "Wasser", pronunciation: "VAHS-ser" },
    { word: "Night", translation: "Nacht", pronunciation: "nahkt" }
  ],
  French: [
    { word: "Hello", translation: "Bonjour", pronunciation: "bohn-ZHOOR" },
    { word: "Friend", translation: "Ami", pronunciation: "ah-MEE" },
    { word: "Thank you", translation: "Merci", pronunciation: "mair-SEE" },
    { word: "Apple", translation: "Pomme", pronunciation: "pohm" },
    { word: "House", translation: "Maison", pronunciation: "may-ZOHN" },
    { word: "Love", translation: "Amour", pronunciation: "ah-MOOR" },
    { word: "Book", translation: "Livre", pronunciation: "LEE-vruh" },
    { word: "Water", translation: "Eau", pronunciation: "oh" }
  ],
  Arabic: [
    { word: "Hello", translation: "مرحباً", pronunciation: "Marhaban" },
    { word: "Friend", translation: "صديق", pronunciation: "Sadeeq" },
    { word: "Thank you", translation: "شكراً", pronunciation: "Shukran" },
    { word: "Apple", translation: "تفاحة", pronunciation: "Tuffahah" },
    { word: "House", translation: "بيت", pronunciation: "Bayt" },
    { word: "Book", translation: "كتاب", pronunciation: "Kitab" },
    { word: "Water", translation: "ماء", pronunciation: "Maa'" },
    { word: "Night", translation: "ليل", pronunciation: "Layl" }
  ],
  Japanese: [
    { word: "Hello", translation: "こんにちは", pronunciation: "Konnichiwa" },
    { word: "Friend", translation: "友達", pronunciation: "Tomodachi" },
    { word: "Thank you", translation: "ありがとう", pronunciation: "Arigatou" },
    { word: "Apple", translation: "りんご", pronunciation: "Ringo" },
    { word: "House", translation: "家", pronunciation: "Ie" },
    { word: "Book", translation: "本", pronunciation: "Hon" },
    { word: "Water", translation: "水", pronunciation: "Mizu" },
    { word: "Night", translation: "夜", pronunciation: "Yoru" }
  ]
};

// --------------------------------------------------
// Web Audio API Synthesizer - 100% Client-Side Audio
// --------------------------------------------------
class SynthSoundSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  playThrow() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio play failure:', e);
    }
  }

  playHitWood() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (p) {
      console.warn(p);
    }
  }

  playHitApple() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playClang() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(1500, this.ctx.currentTime + 0.15);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.2);
      osc2.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playShatter() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseSource.start();
      noiseSource.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.start();
      osc.stop(now + 0.55);
    } catch (e) {}
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

const synthSounds = new SynthSoundSystem();

// Stuck knife interface
interface StuckKnife {
  id: string;
  angle: number; // local relative angle inside log (0 to 2*PI)
}

// Apple interface
interface Apple {
  id: string;
  angle: number; // local angle on log
  isHit: boolean;
  splinterProgress: number; // 0 to 1 split anim
}

// Particles resulting from shatters & hits
interface GameParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'wood' | 'apple_left' | 'apple_right' | 'spark' | 'knife' | 'logo';
}

export interface KnifeHitGameProps {
  onClose?: () => void;
  drill?: any;
  language?: any;
  onComplete?: (success: boolean) => void;
  flashcards?: any[];
  /**
   * ترتيب العبارات: 'text' (افتراضي=ترتيب النص الأصلي) أو
   * 'srs' (ترتيب ذكي حسب منحنى النسيان لوضع المراجعة).
   */
  orderMode?: 'text' | 'srs';
}

/** يرتب البطاقات حسب SRS إن وُجدت حقوله، وإلا يُبقي ترتيب النص. */
function orderVocab(cards: any[], mode: 'text' | 'srs'): any[] {
  if (mode !== 'srs') return [...cards];
  const hasSrs = cards.some(
    (c) =>
      typeof c.lapses === 'number' ||
      typeof c.ease === 'number' ||
      typeof c.dueAt === 'number' ||
      typeof c.nextReviewTimestamp === 'number'
  );
  if (!hasSrs) return [...cards];
  const tierOrder: Record<string, number> = { core: 0, medium: 1, secondary: 2 };
  return [...cards].sort((a, b) => {
    const ta = tierOrder[a.tier] ?? 2;
    const tb = tierOrder[b.tier] ?? 2;
    if (ta !== tb) return ta - tb;
    const la = a.lapses ?? 0;
    const lb = b.lapses ?? 0;
    if (la !== lb) return lb - la;
    const ea = a.ease ?? 2.5;
    const eb = b.ease ?? 2.5;
    if (ea !== eb) return ea - eb;
    const da = a.dueAt ?? a.nextReviewTimestamp ?? 0;
    const db = b.dueAt ?? b.nextReviewTimestamp ?? 0;
    return da - db;
  });
}

/**
 * حساب متانة الخشبة وعدد السكاكين بحسب صعوبة العبارة وطور التدريب (النقر، الصوت، الكتابة):
 * - العبارة السهلة (1-3 كلمات): 5 سكاكين في النقر، 3 في الصوت، 2 في الكتابة
 * - العبارة المتوسطة (4-6 كلمات): 6 سكاكين في النقر، 4 في الصوت، 3 في الكتابة
 * - العبارة الصعبة (7+ كلمات): 8 سكاكين في النقر، 5 في الصوت، 4 في الكتابة
 */
export function getPhraseDurability(word: string, tier: string = 'core', mode: 'tap' | 'sound' | 'write'): number {
  const cleanWord = (word || '').trim();
  const wordCount = cleanWord.split(/\s+/).filter(Boolean).length;
  const charCount = cleanWord.length;

  let diff = 1;
  if (wordCount >= 4 || charCount >= 18) diff = 2;
  if (wordCount >= 7 || charCount >= 32 || tier === 'secondary') diff = 3;

  if (mode === 'tap') {
    return diff === 1 ? 5 : diff === 2 ? 6 : 8;
  }
  if (mode === 'sound') {
    return diff === 1 ? 3 : diff === 2 ? 4 : 5;
  }
  return diff === 1 ? 2 : diff === 2 ? 3 : 4;
}

export default function KnifeHitGame({ onClose, drill, language, onComplete, flashcards, orderMode = 'text' }: KnifeHitGameProps) {
  // Game states
  const [stage, setStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('lingohit_highscore') || '346');
  });
  const [apples, setApples] = useState<number>(() => {
    return Number(localStorage.getItem('lingohit_apples') || '155');
  });
  
  const [currentLang, setCurrentLang] = useState<string>('Spanish');
  const [vocabIndex, setVocabIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'levelcomplete' | 'boss_intro'>('start');
  const [knivesLeft, setKnivesLeft] = useState<number>(5);
  const [knivesInStage, setKnivesInStage] = useState<number>(5);
  const [isBossStage, setIsBossStage] = useState<boolean>(false);

  // Mode systems (tap -> sound -> write) - Ordered logically: Tap -> Voice -> Write
  const [currentMode, setCurrentMode] = useState<'tap' | 'sound' | 'write'>('tap');
  const [typedWord, setTypedWord] = useState<string>('');
  const [typeFeedback, setTypeFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [speechFeedback, setSpeechFeedback] = useState<{
    message: string;
    isCorrect: boolean;
    heard?: string;
    expected?: string;
  } | null>(null);
  const [interimHeard, setInterimHeard] = useState<string>('');

  // Score pop visual cue
  const [popScore, setPopScore] = useState<boolean>(false);
  const [hasStartedStory, setHasStartedStory] = useState<boolean>(!drill);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game Engine Mutable Values
  const engineRef = useRef({
    rotation: 0,
    speed: 0.035,
    speedDir: 1,
    time: 0,
    shakeDuration: 0,
    shakeIntensity: 0,

    stuckKnives: [] as StuckKnife[],
    applesOnLog: [] as Apple[],
    flyingKnife: null as { y: number; speed: number; animating: boolean } | null,
    particles: [] as GameParticle[],
    
    shatteredLogSlices: [] as {
      points: {x: number, y: number}[];
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotation: number;
      vRotation: number;
    }[],
    isShattering: false,
    shatterTimer: 0,
  });

  // Current vocab pairing
  const vocabList = flashcards && flashcards.length > 0 
    ? orderVocab(flashcards, orderMode).map(f => ({
        character: f.character || "",
        word: f.originalText,
        translation: f.translation,
        pronunciation: f.romanization || "",
        tier: f.tier || "core"
      }))
    : (VOCABULARY_LISTS[currentLang] || VOCABULARY_LISTS['Spanish']).map(v => ({
        ...v,
        character: "",
        tier: "core"
      }));

  const currentVocab = drill ? {
    character: drill.character || "",
    word: drill.originalSentence || drill.word,
    translation: drill.translation,
    pronunciation: drill.nativeScript || "",
    tier: drill.tier || "core"
  } : (vocabList[vocabIndex] || vocabList[0]);

  // Ref to keep loop updated with React states without recreation
  const loopStateRef = useRef({
    currentMode,
    currentVocab,
    stage,
  });

  useEffect(() => {
    loopStateRef.current = {
      currentMode,
      currentVocab,
      stage,
    };
  }, [currentMode, currentVocab, stage]);

  // --------------------------------------------------
  // Microphone & Voice Control Settings
  // --------------------------------------------------
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micThreshold, setMicThreshold] = useState<number>(0.08); // Trigger threshold
  const [micError, setMicError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentVocabRef = useRef<any>(currentVocab);
  const isVoiceLockedRef = useRef<boolean>(false);
  const isAudioPlayingRef = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<any>(null);

  useEffect(() => {
    currentVocabRef.current = currentVocab;
  }, [currentVocab]);

  // Compute accurate BCP-47 language code for Web Speech API & TTS
  const getLanguageCode = (): string => {
    let code = 'en';
    if (typeof language === 'string' && language.trim().length > 0) {
      code = language.toLowerCase();
    } else if (language && typeof language === 'object' && (language as any).code) {
      code = (language as any).code.toLowerCase();
    } else if (currentLang) {
      const map: Record<string, string> = {
        spanish: 'es', french: 'fr', german: 'de', italian: 'it', japanese: 'ja', chinese: 'zh', english: 'en', arabic: 'ar'
      };
      code = map[currentLang.toLowerCase()] || 'en';
    }

    const speechLangMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ar: 'ar-SA'
    };
    return speechLangMap[code] || 'en-US';
  };

  // Speak current target phrase cleanly with echo guard
  const speakCurrentWord = () => {
    const word = currentVocab.word;
    if (!word) return;
    isAudioPlayingRef.current = true;
    speakTargetLanguage(word, getLanguageCode(), () => {
      setTimeout(() => {
        isAudioPlayingRef.current = false;
      }, 500);
    });
  };

  // Auto-start Mic when entering sound mode
  useEffect(() => {
    if (currentMode === 'sound' && !isListening) {
      startMic();
    } else if (currentMode !== 'sound' && isListening) {
      stopMic();
    }
  }, [currentMode]);

  // Start microphoning and speech recognition
  const startMic = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLanguageCode();

        recognition.onresult = (event: any) => {
          if (isAudioPlayingRef.current) return;
          if (isVoiceLockedRef.current) return;
          if (engineRef.current.flyingKnife) return;
          if (gameState !== 'playing' || knivesLeft <= 0) return;

          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          const currentInterim = (interimTranscript || '').trim();
          if (currentInterim) {
            setInterimHeard(currentInterim);
          }

          const candidateText = (finalTranscript || interimTranscript).toLowerCase().trim();
          if (!candidateText) return;

          const targetWord = (currentVocabRef.current?.word || "").toLowerCase().trim();
          if (!targetWord) return;

          // Process speech evaluation
          const processAttempt = (textToTest: string) => {
            if (isVoiceLockedRef.current || isAudioPlayingRef.current) return;
            if (engineRef.current.flyingKnife) return;
            if (gameState !== 'playing' || knivesLeft <= 0) return;

            setInterimHeard('');
            const speechResult = matchSpeech(textToTest, targetWord, 0.75);

            if (speechResult.isMatch) {
              // Lock voice to prevent multi-knife runaway throws on the same spoken word
              isVoiceLockedRef.current = true;
              synthSounds.playLevelUp();
              // Track correct speech in cross-stage tracker
              useLessonTrackerStore.getState().recordKnifeHit(targetWord, true);
              setSpeechFeedback({
                message: `نطق رائع ومتقن! 🎯 (${targetWord})`,
                isCorrect: true,
                heard: speechResult.heardText,
                expected: targetWord
              });

              // Launch exactly one knife!
              throwKnifeRef.current(true);

              // Unlock after knife flight finishes
              setTimeout(() => {
                isVoiceLockedRef.current = false;
                setSpeechFeedback(null);
              }, 1400);
            } else {
              // Check if candidate is long enough to consider a real incorrect attempt
              if (textToTest.length >= Math.min(3, targetWord.length)) {
                synthSounds.playClang();
                // Track mistake in cross-stage tracker
                useLessonTrackerStore.getState().recordKnifeHit(targetWord, false);
                engineRef.current.shakeDuration = 10;
                engineRef.current.shakeIntensity = 4;
                setSpeechFeedback({
                  message: `❌ سمعنا: "${speechResult.heardText}" — المطلوب: "${targetWord}"`,
                  isCorrect: false,
                  heard: speechResult.heardText,
                  expected: targetWord
                });

                // Temporary lock so multiple error sounds don't stack
                isVoiceLockedRef.current = true;
                setTimeout(() => {
                  isVoiceLockedRef.current = false;
                  setSpeechFeedback(null);
                }, 2200);
              }
            }
          };

          if (finalTranscript) {
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            processAttempt(finalTranscript);
          } else if (interimTranscript) {
            // Immediate trigger if already correct
            const quickCheck = matchSpeech(interimTranscript, targetWord, 0.75);
            if (quickCheck.isMatch) {
              if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
              processAttempt(interimTranscript);
            } else {
              // Wait for user to finish utterance before declaring incorrect
              if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = setTimeout(() => {
                processAttempt(candidateText);
              }, 850);
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          // Auto restart if still listening
          if (isListening && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } else {
        console.warn("Speech recognition not supported in this browser.");
      }

      setIsListening(true);
    } catch (err: any) {
      console.error("Microphone integration error:", err);
      setMicError("عذراً، لم نتمكن من تشغيل الميكروفون. تأكد من منح الصلاحية في المتصفح.");
      setIsListening(false);
    }
  };

  // Stop microphoning
  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setMicVolume(0);
  };

  const toggleVoiceMode = () => {
    if (isListening) {
      stopMic();
    } else {
      startMic();
    }
  };

  // Clean up mic on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Initialize stage structure
  useEffect(() => {
    setupStage(stage);
  }, [stage]);

  // Handle new drill from MemoryStage (Next Phrase)
  useEffect(() => {
    if (drill) {
      // Force setup for the new phrase
      setupStage(stage);
    }
  }, [drill]);

  // Handle highscore saves
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('lingohit_highscore', score.toString());
    }
  }, [score, highScore]);

  // Helper to reset engine for mode transitions
  const resetEngineForMode = () => {
    const engine = engineRef.current;
    engine.stuckKnives = [];
    engine.applesOnLog = [];
    engine.flyingKnife = null;
    engine.particles = [];
    engine.shatteredLogSlices = [];
    engine.isShattering = false;
    engine.shatterTimer = 0;
    engine.rotation = 0;
    setGameState('playing');
  };

  // Helper to switch sub-stages within the current phrase
  const switchSubStage = (targetMode: 'tap' | 'sound' | 'write') => {
    setCurrentMode(targetMode);
    const active = currentVocabRef.current || currentVocab;
    const needed = getPhraseDurability(active?.word || '', active?.tier || 'core', targetMode);
    setKnivesLeft(needed);
    setKnivesInStage(needed);
    resetEngineForMode();
  };

  const switchSubStageRef = useRef(switchSubStage);
  useEffect(() => {
    switchSubStageRef.current = switchSubStage;
  });

  // Helper to advance to next word stage
  const advanceNextWord = () => {
    if (drill && onComplete) {
      onComplete(true);
    } else {
      const totalPhrases = vocabList.length;
      if (stage >= totalPhrases) {
        synthSounds.playLevelUp();
        if (onComplete) {
          onComplete(true);
        } else if (onClose) {
          onClose();
        }
      } else {
        setStage(prev => prev + 1);
      }
    }
  };

  const advanceNextWordRef = useRef(advanceNextWord);
  useEffect(() => {
    advanceNextWordRef.current = advanceNextWord;
  });

  // Typing submit handler for write mode
  const handleTypeSubmit = () => {
    if (gameState !== 'playing') return;
    const engine = engineRef.current;
    if (engine.flyingKnife) return;
    if (knivesLeft <= 0) return;

    const target = currentVocab.word;
    const matchResult = matchText(typedWord, target);

    if (matchResult.isMatch) {
      if (matchResult.hasTypo) {
        setTypeFeedback({ message: `تم القبول والتصحيح: ${matchResult.correctedText} ✨`, isCorrect: true });
      } else {
        setTypeFeedback({ message: 'إجابة ممتازة! 🎯', isCorrect: true });
      }
      // Track correct typing in cross-stage tracker
      useLessonTrackerStore.getState().recordKnifeHit(target, true);
      setTimeout(() => setTypeFeedback(null), 1800);

      throwKnifeRef.current(true);
      setTypedWord('');
    } else {
      // Wrong word feedback - clang and shake
      synthSounds.playClang();
      // Track mistake in cross-stage tracker
      useLessonTrackerStore.getState().recordKnifeHit(target, false);
      engine.shakeDuration = 8;
      engine.shakeIntensity = 3;
      setTypeFeedback({ message: `حاول مجدداً: المطلوب "${target}"`, isCorrect: false });
      setTimeout(() => setTypeFeedback(null), 2000);
    }
  };

  // Set up values for a new level
  const setupStage = (targetStage: number) => {
    const isBoss = targetStage % 5 === 0;
    setIsBossStage(isBoss);
    setGameState(isBoss ? 'boss_intro' : 'playing');

    const engine = engineRef.current;
    engine.stuckKnives = [];
    engine.applesOnLog = [];
    engine.flyingKnife = null;
    engine.particles = [];
    engine.shatteredLogSlices = [];
    engine.isShattering = false;
    engine.shatterTimer = 0;
    engine.rotation = 0;
    
    // Calculate rotation profile
    engine.speed = 0.02 + Math.min(0.04, targetStage * 0.005);
    engine.speedDir = Math.random() > 0.5 ? 1 : -1;

    // Reset feedback and input
    setSpeechFeedback(null);
    setInterimHeard('');
    setTypedWord('');

    // Strictly map stage to vocabIndex: Stage 1 -> Line 0 (the first speaker & first line of dialogue)
    const targetIdx = (targetStage - 1) % Math.max(1, vocabList.length);
    setVocabIndex(targetIdx);

    // Each new phrase begins with sub-stage 1: tap (النقر والنظر)
    setCurrentMode('tap');
    const targetPhrase = vocabList[targetIdx] || vocabList[0];
    const neededKnives = getPhraseDurability(targetPhrase?.word || '', targetPhrase?.tier || 'core', 'tap');
    setKnivesLeft(neededKnives);
    setKnivesInStage(neededKnives);

    // Initial knives stuck on log: MUST BE 0 as per user request (clean wood block for each phrase)
    const reservedAngles: number[] = [];

    // Add apples attached to target representing juicy rewards
    const appleCount = isBoss ? 3 : (Math.random() > 0.4 ? (Math.random() > 0.7 ? 2 : 1) : 0);
    for (let i = 0; i < appleCount; i++) {
      let angle = (Math.random() * Math.PI * 2);
      let tooClose = reservedAngles.some(a => Math.abs(a - angle) < 0.4);
      if (tooClose) {
        angle = (angle + Math.PI / 2) % (Math.PI * 2);
      }
      engine.applesOnLog.push({
        id: `apple_${Date.now()}_${i}_${Math.random()}`,
        angle: angle,
        isHit: false,
        splinterProgress: 0
      });
      reservedAngles.push(angle);
    }

    if (isBoss) {
      setTimeout(() => {
        setGameState('playing');
      }, 1500);
    }
  };

  const toggleMute = () => {
    const val = !isMuted;
    setIsMuted(val);
    synthSounds.enabled = !val;
  };

  // Launch Knife Trigger
  const throwKnife = (force: boolean = false) => {
    if (gameState !== 'playing') return;
    const engine = engineRef.current;
    
    if (engine.flyingKnife) return;
    if (knivesLeft <= 0) return;

    // In sound mode: only speech recognition can throw
    if (!force && currentMode === 'sound') {
      setSpeechFeedback({
        message: '🎙️ في هذه المرحلة: انطق العبارة بصوتك في الميكروفون لإطلاق السكين!',
        isCorrect: false
      });
      setTimeout(() => setSpeechFeedback(null), 2500);
      return;
    }

    // In write mode: only typing can throw
    if (!force && currentMode === 'write') {
      setTypeFeedback({
        message: '⌨️ في هذه المرحلة: اكتب العبارة في المربع بالأسفل لإطلاق السكين!',
        isCorrect: false
      });
      setTimeout(() => setTypeFeedback(null), 2500);
      return;
    }

    synthSounds.playThrow();

    engine.flyingKnife = {
      y: 420, 
      speed: 28, 
      animating: true
    };

    setKnivesLeft(prev => prev - 1);
  };

  // Stabilize throwKnife for use in async/closure loops
  const throwKnifeRef = useRef(throwKnife);
  useEffect(() => {
    throwKnifeRef.current = throwKnife;
  }, [throwKnife]);

  // Keyboard integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentMode === 'write') return; // Disable keyboard space/arrow throws in write mode
      if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'ArrowUp') {
        e.preventDefault();
        throwKnifeRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, knivesLeft, currentMode]);

  // Utility to fire particles
  const spawnParticles = (x: number, y: number, color: string, type: GameParticle['type'], count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      engineRef.current.particles.push({
        id: `p_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        type
      });
    }
  };

  const spawnAppleShatter = (angleOnLog: number) => {
    const logRadius = 78;
    const logCenter = { x: 320 / 2, y: 155 }; // Using hardcoded canvas width to avoid needing canvas ref here
    const actualAngle = engineRef.current.rotation + angleOnLog;
    
    const appleX = logCenter.x + Math.sin(actualAngle) * logRadius;
    const appleY = logCenter.y - Math.cos(actualAngle) * logRadius;
    
    spawnParticles(appleX, appleY, '#ff3b30', 'spark', 5);
    
    engineRef.current.particles.push({
      id: `apL_${Date.now()}_${Math.random()}`,
      x: appleX,
      y: appleY,
      vx: -2 - Math.random() * 2,
      vy: -2 - Math.random() * 3,
      angle: 0,
      vAngle: -0.2,
      size: 15,
      color: '#e82c2c',
      alpha: 1.0,
      decay: 0.03,
      type: 'apple_left'
    });
    
    engineRef.current.particles.push({
      id: `apR_${Date.now()}_${Math.random()}`,
      x: appleX,
      y: appleY,
      vx: 2 + Math.random() * 2,
      vy: -2 - Math.random() * 3,
      angle: 0,
      vAngle: 0.2,
      size: 15,
      color: '#e82c2c',
      alpha: 1.0,
      decay: 0.03,
      type: 'apple_right'
    });
  };

  // Perform a full shatter of the wood
  const shatterLog = () => {
    const engine = engineRef.current;
    engine.isShattering = true;
    engine.shatterTimer = 90; // 90 frames of shatter viewing
    
    // Strong screen shake on wood shatter
    engine.shakeDuration = 25;
    engine.shakeIntensity = 8;
    
    const logCenter = { x: 320 / 2, y: 155 };
    const logRadius = 78;

    // Splinter into 6 slices
    for (let i = 0; i < 6; i++) {
      const sliceAngle = (i / 6) * Math.PI * 2;
      const nextAngle = ((i + 1) / 6) * Math.PI * 2;
      
      const vx = Math.cos(sliceAngle + 0.5) * (Math.random() * 4 + 2);
      const vy = Math.sin(sliceAngle + 0.5) * (Math.random() * 4 + 2) - 4; // pop upwards
      
      engine.shatteredLogSlices.push({
        points: [
          { x: 0, y: 0 },
          { x: Math.cos(sliceAngle) * logRadius, y: Math.sin(sliceAngle) * logRadius },
          { x: Math.cos(nextAngle) * logRadius, y: Math.sin(nextAngle) * logRadius }
        ],
        x: logCenter.x,
        y: logCenter.y,
        vx,
        vy,
        rotation: 0,
        vRotation: (Math.random() - 0.5) * 0.4
      });
    }

    // Explode apples
    engine.applesOnLog.forEach(apple => {
      if (!apple.isHit) {
        const actualAngle = engine.rotation + apple.angle;
        engine.particles.push({
          id: `apple_f_${Date.now()}_${Math.random()}`,
          x: logCenter.x + Math.sin(actualAngle) * logRadius,
          y: logCenter.y - Math.cos(actualAngle) * logRadius,
          vx: Math.sin(actualAngle) * 6,
          vy: -Math.cos(actualAngle) * 6,
          angle: actualAngle,
          vAngle: 0.1,
          size: 9,
          color: '#e82c2c',
          alpha: 1.0,
          decay: 0.025,
          type: Math.random() > 0.5 ? 'apple_left' : 'apple_right'
        });
      }
    });
  };

  // --------------------------------------------------
  // Primary 2D Canvas Game Loop / Voice Analyser Loop
  // --------------------------------------------------
  useEffect(() => {
    let animId: number;
    let micAnimId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions setup
    canvas.width = 320;
    canvas.height = 480;

    const logRadius = 78;
    const logCenter = { x: canvas.width / 2, y: 155 };

    // --------------------------------------------------
    // Microphone Real-time Checker
    // --------------------------------------------------
    const checkMicVolume = () => {
      if (isListening && analyserRef.current) {
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Compute average root-mean-square or peak volume
        let peak = 0;
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
          if (dataArray[i] > peak) peak = dataArray[i];
        }
        const normalizedVolume = peak / 255;
        setMicVolume(normalizedVolume);
        // Note: Voice volume is used for UI indicator only. Knife throw is strictly driven by SpeechRecognition matching!
      }
      micAnimId = requestAnimationFrame(checkMicVolume);
    };

    if (isListening) {
      micAnimId = requestAnimationFrame(checkMicVolume);
    }

    // --------------------------------------------------
    // Core Game Render Loop
    // --------------------------------------------------
    const loop = () => {
      if (!hasStartedStory) {
        animId = requestAnimationFrame(loop);
        return;
      }
      
      const engine = engineRef.current;
      engine.time++;

      // Process camera screenshake
      let shakeX = 0;
      let shakeY = 0;
      if (engine.shakeDuration > 0) {
        shakeX = (Math.random() * 2 - 1) * engine.shakeIntensity;
        shakeY = (Math.random() * 2 - 1) * engine.shakeIntensity;
        engine.shakeDuration--;
      }

      // Clear layout
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Log movement pattern updates
      if (!engine.isShattering && gameState === 'playing') {
        let currentOmega = engine.speed * engine.speedDir;
        engine.rotation += currentOmega;
        // Keep in 0..2PI bounds
        engine.rotation = engine.rotation % (Math.PI * 2);
      }

      // 1. Draw shattered wood parts if levels complete
      if (engine.isShattering) {
        engine.shatteredLogSlices.forEach((slice) => {
          slice.x += slice.vx;
          slice.y += slice.vy;
          slice.vy += 0.35; // gravity on fractures
          slice.rotation += slice.vRotation;

          ctx.save();
          ctx.translate(slice.x, slice.y);
          ctx.rotate(slice.rotation);

          ctx.beginPath();
          ctx.moveTo(slice.points[0].x, slice.points[0].y);
          for (let pi = 1; pi < slice.points.length; pi++) {
            ctx.lineTo(slice.points[pi].x, slice.points[pi].y);
          }
          ctx.closePath();
          ctx.closePath();

          const wedgeGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, logRadius);
          wedgeGrad.addColorStop(0, '#ffe694');
          wedgeGrad.addColorStop(0.5, '#e8bc3e');
          wedgeGrad.addColorStop(0.85, '#ab7016');
          wedgeGrad.addColorStop(1, '#8f4f00');

          ctx.fillStyle = wedgeGrad;
          ctx.fill();

          ctx.strokeStyle = '#5a3100';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(100,60,10,0.18)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, logRadius * 0.45, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });

        engine.shatterTimer--;
        if (engine.shatterTimer <= 0) {
          engine.isShattering = false;
          
          // Guided 3-Phase Progression for current phrase:
          // 1. tap (النقر والنظر) -> 2. sound (الكلام بالصوت) -> 3. write (الكتابة والتثبيت)
          const activeMode = loopStateRef.current.currentMode;
          
          if (activeMode === 'tap') {
            switchSubStageRef.current('sound');
          } else if (activeMode === 'sound') {
            switchSubStageRef.current('write');
          } else {
            // Write mode completed: Phrase finished across all 3 modes! Move to next phrase.
            advanceNextWordRef.current();
          }
        }
      }

      // 2. Draw normal rotating log
      if (!engine.isShattering) {
        ctx.save();
        ctx.translate(logCenter.x, logCenter.y);
        ctx.rotate(engine.rotation);

        // Circular Log Shadow Glow
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;

        // Wood concentric master backdrop
        ctx.beginPath();
        ctx.arc(0, 0, logRadius, 0, Math.PI * 2);
        ctx.closePath();
        
        const radialGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, logRadius);
        radialGrad.addColorStop(0, '#ffe694');
        radialGrad.addColorStop(0.4, '#fcd765');
        radialGrad.addColorStop(0.82, '#c78330');
        radialGrad.addColorStop(0.96, '#a05c1d');
        radialGrad.addColorStop(1, '#653102');

        ctx.fillStyle = radialGrad;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Concentric circles
        ctx.strokeStyle = 'rgba(125,75,12,0.22)';
        ctx.lineWidth = 2.0;
        const ageRings = [18, 32, 48, 62, 72];
        ageRings.forEach(r => {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Radial grain cracks
        ctx.strokeStyle = 'rgba(90,40,5,0.45)';
        ctx.lineWidth = 1.5;
        const radialCracks = [0.4, 1.8, 3.5, 4.9];
        radialCracks.forEach((ang) => {
          ctx.beginPath();
          ctx.moveTo(Math.sin(ang) * 15, -Math.cos(ang) * 15);
          ctx.lineTo(Math.sin(ang) * (logRadius - 6), -Math.cos(ang) * (logRadius - 6));
          ctx.stroke();
        });

        // Center Bolt Pin Core
        const boltGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
        boltGrad.addColorStop(0, '#fbe18c');
        boltGrad.addColorStop(0.4, '#d59a6c');
        boltGrad.addColorStop(1, '#00423b');

        ctx.fillStyle = boltGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0e1513';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // stuck knives on log
        engine.stuckKnives.forEach((knife) => {
          ctx.save();
          ctx.rotate(knife.angle);
          ctx.translate(0, logRadius);

          // Blade
          ctx.fillStyle = '#f1f5f9';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-3, 0); 
          ctx.lineTo(3, 0);
          ctx.lineTo(4, 25);
          ctx.lineTo(0, 32); 
          ctx.lineTo(-4, 25);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Highlight
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 31);
          ctx.stroke();

          // Crossguard
          ctx.fillStyle = '#ecc346';
          ctx.strokeStyle = '#b28e1b';
          ctx.beginPath();
          ctx.roundRect(-7, 24, 14, 4, 1.5);
          ctx.fill();
          ctx.stroke();

          // Handle grip
          ctx.fillStyle = '#e85c2c';
          ctx.beginPath();
          ctx.roundRect(-3, 28, 6, 24, 1.5);
          ctx.fill();

          ctx.fillStyle = '#7a280c';
          ctx.fillRect(-2.5, 33, 5, 2);
          ctx.fillRect(-2.5, 38, 5, 2);
          ctx.fillRect(-2.5, 43, 5, 2);
          ctx.fillRect(-2.5, 48, 5, 2);

          // pommel pommel
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.arc(0, 52, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });

        // Apple rendering
        engine.applesOnLog.forEach((apple) => {
          if (apple.isHit) return;

          ctx.save();
          ctx.rotate(apple.angle);
          ctx.translate(0, logRadius - 2);

          // Stem
          ctx.strokeStyle = '#5c310c';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.bezierCurveTo(2, 16, 6, 18, 5, 22);
          ctx.stroke();

          // Leaf shape
          ctx.fillStyle = '#4cd137';
          ctx.beginPath();
          ctx.ellipse(3, 17, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // curves
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.25)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 1;

          ctx.fillStyle = '#e82c2c';
          ctx.beginPath();
          ctx.arc(-5, 9, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(5, 9, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Dimple
          ctx.fillStyle = '#b31515';
          ctx.beginPath();
          ctx.arc(0, 4, 3, 0, Math.PI);
          ctx.fill();

          // glossy glossy
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.beginPath();
          ctx.ellipse(-5, 12, 2.5, 1, Math.PI / -6, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });

        ctx.restore();
      }

      // 3. Process Flying Knife logic
      if (engine.flyingKnife) {
        if (engine.flyingKnife.animating) {
          engine.flyingKnife.y -= engine.flyingKnife.speed;

          const targetHitY = logCenter.y + logRadius;
          
          if (engine.flyingKnife.y <= targetHitY) {
            // Collision checks!
            engine.flyingKnife = null; // Consume flying state

            const hitAngle = (-engine.rotation) % (Math.PI * 2);
            let positiveHitAngle = hitAngle < 0 ? hitAngle + Math.PI * 2 : hitAngle;

            // Did we hit another knife on the wood?
            let hitKnife = false;
            const collisionWindow = 0.22; // angle threshold of hit

            for (let i = 0; i < engine.stuckKnives.length; i++) {
              const diff = Math.abs(engine.stuckKnives[i].angle - positiveHitAngle);
              const wrapDiff = Math.PI * 2 - diff;
              
              if (diff < collisionWindow || wrapDiff < collisionWindow) {
                hitKnife = true;
                break;
              }
            }

            // Hit processing:
            if (hitKnife) {
              // Metallic clang sound and sparkling deflection, but counts as a successful hit!
              synthSounds.playClang();
              // Wedge knife slightly beside the existing knife
              positiveHitAngle = (positiveHitAngle + 0.12) % (Math.PI * 2);
            } else {
              // Standard wood hit
              synthSounds.playHitWood();
            }

            engine.shakeDuration = 8;
            engine.shakeIntensity = 3.5;

            // Insert stuck knife at hit point (always sticks!)
            const localAngleInLog = positiveHitAngle;
            engine.stuckKnives.push({
              id: `knife_${Date.now()}_${Math.random()}`,
              angle: localAngleInLog
            });

            // Add scores pop pop
            setScore(prev => prev + 10);
            setPopScore(true);
            setTimeout(() => setPopScore(false), 200);

            // Spawn sparks (cyan if striking another blade, amber if wood)
            for (let s = 0; s < 12; s++) {
              engine.particles.push({
                id: `spark_${Math.random()}`,
                x: logCenter.x,
                y: targetHitY,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * -4 - 1.5,
                angle: 0,
                vAngle: 0,
                size: Math.random() * 2 + 1,
                color: hitKnife ? '#38bdf8' : '#fbe18c',
                alpha: 1.0,
                decay: 0.04,
                type: 'spark'
              });
            }

              // Did we split any apple?
              engine.applesOnLog.forEach((apple) => {
                if (apple.isHit) return;
                
                const diff = Math.abs(apple.angle - positiveHitAngle);
                const wrapDiff = Math.PI * 2 - diff;

                if (diff < 0.28 || wrapDiff < 0.28) {
                  apple.isHit = true;
                  synthSounds.playHitApple();
                  setApples(prev => {
                    const next = prev + 2;
                    localStorage.setItem('lingohit_apples', next.toString());
                    return next;
                  });

                  setScore(prev => prev + 100); // 100 bonus multiplier!

                  // Spawn nice split half apple chunks falling
                  engine.particles.push({
                    id: `apple_part_left_${Math.random()}`,
                    x: logCenter.x,
                    y: targetHitY - 8,
                    vx: -3.5 + Math.random() * -2,
                    vy: Math.random() * -4 - 2,
                    angle: 0,
                    vAngle: -0.05,
                    size: 8,
                    color: '#e82c2c',
                    alpha: 1.0,
                    decay: 0.02,
                    type: 'apple_left'
                  });

                  engine.particles.push({
                    id: `apple_part_right_${Math.random()}`,
                    x: logCenter.x,
                    y: targetHitY - 8,
                    vx: 3.5 + Math.random() * 2,
                    vy: Math.random() * -4 - 2,
                    angle: 0,
                    vAngle: 0.05,
                    size: 8,
                    color: '#e82c2c',
                    alpha: 1.0,
                    decay: 0.02,
                    type: 'apple_right'
                  });
                }
              });

              // Check level complete criteria
              if (knivesLeft <= 1) {
                setTimeout(() => {
                  synthSounds.playLevelUp();
                  synthSounds.playShatter();
                  shatterLog();
                }, 100);
              }
          }
        }
      }

      // Render: Flying Knife inside transit
      if (engine.flyingKnife) {
        ctx.save();
        ctx.translate(logCenter.x, engine.flyingKnife.y);

        ctx.fillStyle = 'rgba(113, 248, 228, 0.25)';
        ctx.fillRect(-2, 32, 4, 45);

        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-3, 0); 
        ctx.lineTo(-4, 25);
        ctx.lineTo(4, 25);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, -7); 
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 25);
        ctx.stroke();

        ctx.fillStyle = '#ecc346';
        ctx.strokeStyle = '#b28e1b';
        ctx.beginPath();
        ctx.roundRect(-7, 24, 14, 4, 1.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e85c2c';
        ctx.beginPath();
        ctx.roundRect(-3, 28, 6, 24, 1.5);
        ctx.fill();

        ctx.fillStyle = '#7a280c';
        ctx.fillRect(-2.5, 33, 5, 2);
        ctx.fillRect(-2.5, 38, 5, 2);
        ctx.fillRect(-2.5, 43, 5, 2);
        ctx.fillRect(-2.5, 48, 5, 2);

        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(0, 52, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (gameState === 'playing' && knivesLeft > 0) {
        // Draw normal ready knife on deck
        ctx.save();
        ctx.translate(logCenter.x, 420);

        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-4, 25);
        ctx.lineTo(4, 25);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, -7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 25);
        ctx.stroke();

        ctx.fillStyle = '#ecc346';
        ctx.beginPath();
        ctx.roundRect(-7, 24, 14, 4, 1.5);
        ctx.fill();

        ctx.fillStyle = '#e85c2c';
        ctx.beginPath();
        ctx.roundRect(-3, 28, 6, 24, 1.5);
        ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(0, 52, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Render Particles list
      engine.particles.forEach((part, index) => {
        part.x += part.vx;
        part.y += part.vy;
        part.vy += 0.38; 
        part.angle += part.vAngle;
        part.alpha -= part.decay;

        if (part.alpha <= 0) {
          engine.particles.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.translate(part.x, part.y);
        ctx.rotate(part.angle);
        ctx.globalAlpha = part.alpha;

        if (part.type === 'apple_left') {
          ctx.fillStyle = '#e82c2c';
          ctx.beginPath();
          ctx.arc(0, 0, part.size, Math.PI / 2, Math.PI * 1.5);
          ctx.lineTo(0, part.size);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fffae3';
          ctx.beginPath();
          ctx.arc(0, 0, part.size - 2.5, Math.PI / 2, Math.PI * 1.5);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#331500';
          ctx.fillRect(-3, -1, 1.5, 2.5);
        } else if (part.type === 'apple_right') {
          ctx.fillStyle = '#e82c2c';
          ctx.beginPath();
          ctx.arc(0, 0, part.size, Math.PI * 1.5, Math.PI / 2);
          ctx.lineTo(0, -part.size);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fffae3';
          ctx.beginPath();
          ctx.arc(0, 0, part.size - 2.5, Math.PI * 1.5, Math.PI / 2);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#331500';
          ctx.fillRect(1.5, -1, 1.5, 2.5);
        } else if (part.type === 'knife') {
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.moveTo(-1.5, -12);
          ctx.lineTo(1.5, -12);
          ctx.lineTo(3.5, 12);
          ctx.lineTo(-3.5, 12);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ecc346';
          ctx.fillRect(-5, 10, 10, 3);
          ctx.fillStyle = '#e85c2c';
          ctx.fillRect(-2, 13, 4, 15);
        } else if (part.type === 'spark') {
          ctx.fillStyle = '#fbe18c';
          ctx.beginPath();
          ctx.arc(0, 0, part.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      ctx.restore(); // restore screenshake

      // Continue game loop
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      cancelAnimationFrame(micAnimId);
    };
  }, [gameState, stage, knivesLeft, isListening, micThreshold, hasStartedStory]);

  // Restart match controller
  const handleRestart = () => {
    setScore(0);
    setStage(1);
    setVocabIndex(0);
    setupStage(1);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#091012] text-white flex flex-col justify-between items-center overflow-hidden font-sans" dir="rtl">
      
      {/* Absolute backdrop graphics */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 mix-blend-color-dodge bg-cover bg-center"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Glossy cyan/purple light flares */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] aspect-square rounded-full bg-[#d59a6c]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-[#8b5cf6]/10 blur-[130px] pointer-events-none" />

      {/* ----------------- Header stats bar ----------------- */}
      <header className="relative z-10 w-full max-w-md px-6 py-4 flex justify-between items-center">
        
        {/* Back and return buttons */}
        {!drill ? (
          <button 
            onClick={onClose}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow transition-all active:scale-95 cursor-pointer"
          >
            متابعة &rarr;
          </button>
        ) : (
          <button 
            onClick={() => onComplete && onComplete(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <span>متابعة</span>
            <span className="text-sm leading-none">&rarr;</span>
          </button>
        )}

        {/* Level and stages banner */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] text-white/95 uppercase tracking-wider font-black bg-blue-700/80 border border-blue-400/40 px-3 py-0.5 rounded-full shadow-sm">
              العبارة {Math.min(stage, vocabList.length)} من {vocabList.length}
            </span>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
              {currentMode === 'tap' ? '1. نقر' : currentMode === 'sound' ? '2. كلام' : '3. كتابة'}
            </span>
          </div>
          <span className="text-xs font-black text-white px-3 py-0.5 bg-blue-600 rounded-xl shadow">
            {isBossStage ? "⚠️ مرحلة التحدي الأكبر ⚠️" : `المستوى ${Math.ceil(stage / 5)}`}
          </span>
        </div>

        {/* Audio mute settings button */}
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInstructions(true)}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow cursor-pointer transition-all active:scale-90"
            title="تعليمات اللعب"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleMute}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow cursor-pointer transition-all active:scale-90"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-300" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ----------------- Realtime high stakes scoring bar ----------------- */}
      <section className="relative z-10 flex w-full max-w-md justify-between px-8 text-center mt-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#859490] font-bold uppercase">النقاط</span>
          <span className={`text-4xl font-extrabold tracking-tight transition-transform duration-100 ${popScore ? "scale-125 text-[#fbe18c]" : "scale-100 text-white"}`}>
            {score}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#859490] font-bold uppercase">أعلى نقاط</span>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-[#ffd700]" />
            <span className="text-xl font-extrabold text-[#ffd700]">{highScore}</span>
          </div>
        </div>
      </section>

      {/* ----------------- CANVAS INTERACTIVE STAGE ----------------- */}
      <main className="absolute inset-0 z-0 flex flex-col items-center justify-center w-full h-full overflow-hidden bg-[#091012]">
        
        {/* Dynamic canvas wrapper */}
        <div 
          onClick={() => throwKnife()}
          className="relative w-full h-full cursor-crosshair flex items-center justify-center"
        >
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain max-w-2xl"
          />

          {/* Central neon glowing aura behind log target */}
          <div className="absolute top-[155px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-gradient-to-tr from-[#d59a6c]/5 to-[#fbe18c]/15 blur-2xl pointer-events-none -z-10 animate-pulse" />

          {/* Warning banner overlays */}
          {gameState === 'boss_intro' && (
            <div className="absolute inset-x-0 top-[120px] text-center pointer-events-none z-30 animate-bounce">
              <span className="px-5 py-2 rounded-full bg-[#71000b] text-[#ffdad7] border-2 border-[#ff3838] text-xs uppercase font-extrabold tracking-widest shadow-2xl">
                ⚠️ زعيم الكلمات: غابة عشوائية! ⚠️
              </span>
            </div>
          )}

          {/* Bullet stacks tray inside canvas */}
          <div className="absolute left-4 bottom-28 flex flex-col gap-1 select-none pointer-events-none">
            {Array.from({ length: knivesInStage }).map((_, idx) => {
              const isSpent = idx < (knivesInStage - knivesLeft);
              return (
                <div 
                  key={idx} 
                  className={`transition-all duration-300 transform ${isSpent ? "opacity-20 scale-75 -translate-x-1.5" : "opacity-100 scale-100"}`}
                >
                  {/* Neon stylized miniature knife icon */}
                  <svg className="w-4 h-7 filter drop-shadow" viewBox="0 0 24 40" fill="none">
                    <path d="M12 2 L9 18 L15 18 Z" fill="#b9cbd4" />
                    <rect x="7" y="18" width="10" height="3" fill="#ecc346" />
                    <rect x="10" y="21" width="4" height="15" fill="#e85c2c" />
                    <circle cx="12" cy="36" r="1.5" fill="#f1f5f9" />
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Apples accumulated counters */}
          <div className="absolute right-4 bottom-28 flex items-center gap-1 bg-[#0e1513]/90 px-3 py-1 rounded-full border border-[#3c4947]/30 text-red-500 select-none pointer-events-none font-bold text-xs shadow-md">
            <span className="text-sm">🍎</span>
            <span>{apples} تفاحات</span>
          </div>

          {/* LINGO BANNER WITH DYNAMIC GLOSS LOOK - SMALL SCREEN */}
          <div 
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-blue-600 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5),inset_0_0_15px_rgba(0,0,0,0.5)] z-20 min-w-[240px] text-center animate-fade-in-slow"
          >
            {/* Screen Glass Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-lg pointer-events-none" />
            <div className="absolute top-1 left-2 right-2 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg pointer-events-none" />

            {/* 3-Step Guided Mode Tabs */}
            <div className="flex items-center justify-center gap-1.5 mb-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => switchSubStage('tap')}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                  currentMode === 'tap'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105 border border-amber-300'
                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                }`}
                title="المرحلة الأولى: انظر للعبارة وترجمتها واضرب السكاكين بالنقر"
              >
                <span>1. 👆 نقر ونظر</span>
              </button>
              <button
                type="button"
                onClick={() => switchSubStage('sound')}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                  currentMode === 'sound'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105 border border-amber-300'
                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                }`}
                title="المرحلة الثانية: انطق العبارة بصوتك في الميكروفون لإطلاق السكاكين"
              >
                <Mic className="w-3 h-3" />
                <span>2. 🎙️ كلام</span>
              </button>
              <button
                type="button"
                onClick={() => switchSubStage('write')}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                  currentMode === 'write'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105 border border-amber-300'
                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                }`}
                title="المرحلة الثالثة: اكتب العبارة بالإنجليزية لإطلاق السكاكين وتثبيتها"
              >
                <span>3. ⌨️ كتابة</span>
              </button>
            </div>
            
            <div className="flex flex-col relative z-10 items-center">
              {currentVocab.character && (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mb-1.5 rounded-full bg-white/20 text-white text-xs font-black border border-white/30 shadow-sm" dir="ltr">
                  <span>🗣️</span>
                  <span>{currentVocab.character}</span>
                </div>
              )}

              <span className="text-xl font-black text-white leading-tight drop-shadow-md">
                {currentVocab.translation}
              </span>

              {/* Target phrase & pronunciation helper */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakCurrentWord();
                  }}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all cursor-pointer active:scale-95 shadow"
                  title="استمع للنطق النموذجي"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-white drop-shadow">
                  {currentVocab.word}
                </span>
                {currentVocab.pronunciation && (
                  <span className="text-[10px] text-white/70 font-medium">
                    ({currentVocab.pronunciation})
                  </span>
                )}
              </div>
              
              {currentMode === 'sound' && (
                <div className="flex flex-col items-center gap-1.5 mt-2 w-full px-2">
                  {/* Dynamic Speech Feedback / Status */}
                  {speechFeedback ? (
                    <div className={`text-[11px] font-black px-3 py-1.5 rounded-xl text-center shadow-lg transition-all w-full max-w-[280px] ${
                      speechFeedback.isCorrect
                        ? 'bg-emerald-500 text-white border-2 border-emerald-300 animate-bounce'
                        : 'bg-rose-600 text-white border-2 border-rose-400 animate-shake'
                    }`}>
                      {speechFeedback.message}
                    </div>
                  ) : interimHeard ? (
                    <div className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/50 animate-pulse w-full max-w-[260px] text-center">
                      🎙️ أسمع: "{interimHeard}"...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20">
                      <Mic className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                      <span className="text-[10px] font-bold text-white/95">انطق العبارة بصوت واضح لإطلاق السكين</span>
                    </div>
                  )}

                  {/* Realtime audio wave meter */}
                  {isListening && (
                    <div className="w-full max-w-[200px] h-1.5 bg-black/50 rounded-full overflow-hidden mt-1 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 transition-all duration-75"
                        style={{ width: `${Math.min(100, micVolume * 350)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {currentMode === 'write' && (
                <div className="flex flex-col gap-1.5 mt-2 w-full max-w-[220px]" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1.5 w-full">
                    <input
                      value={typedWord}
                      onChange={(e) => setTypedWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTypeSubmit()
                      }}
                      placeholder="اكتب بالإنجليزية..."
                      className="flex-1 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#1CB0F6]"
                    />
                    <button
                      onClick={handleTypeSubmit}
                      className="bg-[#1CB0F6] text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#1CB0F6]/80 transition-colors"
                    >
                      أطلق
                    </button>
                  </div>
                  {typeFeedback && (
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded text-center transition-all ${
                      typeFeedback.isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}>
                      {typeFeedback.message}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-1 pt-1 border-t border-[#d59a6c]/30 flex items-center justify-center gap-1.5 text-[8px] text-[#4fdbc8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d59a6c] animate-pulse shadow-[0_0_5px_#d59a6c]" />
              <span>الوضع: {currentVocab.tier === 'core' ? 'أساسي (3 مراحل)' : currentVocab.tier === 'medium' ? 'متوسط (مرحلتين)' : 'ثانوي (مرحلة واحدة)'}</span>
            </div>
          </div>
        </div>

        {/* Guidance tip based on states */}
        <p className="text-[10px] text-[#859490] mt-2 max-w-[270px] text-center leading-normal">
          {isBossStage 
            ? "⚠️ احترس! هدف الزعيم يغير اتجاه وسرعة الدوران بشكل عشوائي مفاجئ!"
            : "🎯 تفادى إصابة السكاكين المثبتة مسبقاً على الجذع لكي لا تخسر!"}
        </p>
      </main>

      {/* ----------------- SETTINGS POPUP ----------------- */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm flex items-end justify-center pb-32 px-4" 
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="w-full max-w-sm bg-[#3a2a18] rounded-3xl border border-[#d59a6c]/25 p-5 flex flex-col gap-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-3 left-3 text-[#859490] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-center font-bold text-[#fbe18c] mb-1">إعدادات اللعبة</h3>

            {/* Toggle with Volume indicators */}
            <div className="w-full flex items-center justify-between mt-2">
              <button 
                onClick={toggleVoiceMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                  isListening 
                    ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
                    : "bg-[#5c452e] text-[#fbe18c]/80 border-[#d59a6c]/25 hover:text-white"
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                    <span>إيقاف الميكروفون</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#4fdbc8]" />
                    <span>تشغيل بالميكروفون</span>
                  </>
                )}
              </button>

              {/* Volume peak monitor indicator bar */}
              <div className="flex-1 max-w-[140px] mr-2 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] text-[#859490]">
                  <span>مستوى الصوت:</span>
                  <span className={`font-bold ${micVolume >= micThreshold ? "text-red-400" : "text-[#fbe18c]"}`}>
                    {Math.round(micVolume * 100)}%
                  </span>
                </div>
                
                {/* Horizontal level bar showing color gradients */}
                <div className="h-2 bg-[#5c452e] rounded-full border border-[#d59a6c]/20 overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-75 ${
                      micVolume >= micThreshold 
                        ? "bg-gradient-to-r from-red-500 to-orange-400" 
                        : "bg-gradient-to-r from-[#d59a6c] to-[#fbe18c]"
                    }`}
                    style={{ width: `${Math.min(100, micVolume * 100)}%` }}
                  />
                  
                  {/* Vertical line indicator for Threshold */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                    style={{ right: `${100 - micThreshold * 100}%` }}
                    title="عتبة إطلاق السكين"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic sensitivity Threshold slider bar controls */}
            <div className="w-full flex items-center justify-between text-xs pb-1">
              <div className="flex items-center gap-1.5 text-[#859490]">
                <Sliders className="w-3.5 h-3.5" />
                <span>حسّاسية إطلاق الصوت:</span>
              </div>
              
              <div className="flex items-center gap-2 flex-grow max-w-[180px] mr-2">
                <span className="text-[10px] text-[#859490]">عالية</span>
                <input 
                  type="range"
                  min="0.03"
                  max="0.45"
                  step="0.01"
                  value={micThreshold}
                  onChange={(e) => setMicThreshold(Number(e.target.value))}
                  className="flex-grow accent-[#4fdbc8] bg-[#5c452e] h-1 rounded-full cursor-pointer"
                />
                <span className="text-[10px] text-[#859490]">منخفضة</span>
              </div>
            </div>

            {/* Error notification if mic fails */}
            {micError && (
              <p className="text-[10px] text-red-400 text-center font-semibold bg-red-950/20 px-3 py-1 rounded-lg border border-red-500/10">
                {micError}
              </p>
            )}

            {/* Microphone tutorial explanation bubble */}
            <p className="text-[9.5px] text-[#4fdbc8] text-center italic leading-relaxed bg-[#5c452e]/50 px-3.5 py-1.5 rounded-xl border border-[#d59a6c]/10 w-full">
              {isListening 
                ? "🎤 الميكروفون نَشِط! اصرخ بقوة، قل 'إطلاق' أو انفخ بقوة لإطلاق السكين بالصوت!"
                : "💡 يمكنك تشغيل الميكروفون أعلاه لإطلاق السكاكين عبر صوتك بدلاً من اللمس!"}
            </p>

            {/* Lower Language deck switch tools */}
            {!drill && (
              <div className="w-full mt-2 pt-4 border-t border-[#d59a6c]/10 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-[#fbe18c]/85 flex items-center gap-1.5 uppercase tracking-wider">
                    <Globe className="w-3 h-3" /> اختر قاموس الكلمات للدراسة
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-1 bg-[#3a2a18] p-1 rounded-lg border border-[#3c4947]/30">
                  {Object.keys(VOCABULARY_LISTS).map((lang) => {
                    const active = currentLang === lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => {
                          setCurrentLang(lang);
                          setVocabIndex(0);
                          setupStage(1);
                        }}
                        className={`py-1 rounded px-1 text-[10px] font-bold tracking-tight transition-all truncate cursor-pointer ${
                          active 
                            ? "bg-gradient-to-tr from-[#d59a6c] to-[#fbe18c] text-[#051f22]" 
                            : "text-[#859490] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {lang === 'Spanish' ? 'إسباني' : 
                         lang === 'German' ? 'ألماني' : 
                         lang === 'French' ? 'فرنسي' : 
                         lang === 'Arabic' ? 'عربي' : 'ياباني'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- FOOTER CONTROLLER ACTIONS (Compact HUD) ----------------- */}
      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 pointer-events-none">
        
        {/* Settings toggle button - compact */}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-8 h-8 rounded-full bg-[#5c452e]/70 backdrop-blur-sm border border-[#d59a6c]/20 flex items-center justify-center text-[#fbe18c]/70 hover:bg-[#1a383b] hover:text-[#fbe18c] transition-all cursor-pointer pointer-events-auto active:scale-90"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Compact launch button */}
        <div className="relative flex flex-col items-center pointer-events-auto">
          <button 
            onClick={() => throwKnife()}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md border border-[#0e1513]/50 transition-all duration-100 z-10 cursor-pointer backdrop-blur-sm ${
              isListening 
                ? "bg-red-500/80 hover:bg-red-400 active:bg-red-600 shadow-[0_4px_0_#991b1b] active:translate-y-1 active:shadow-[0_1px_0_#991b1b]" 
                : "bg-[#d59a6c]/80 hover:bg-[#fbe18c]/80 active:bg-[#4fdbc8]/80 shadow-[0_4px_0_#00423b] active:translate-y-1 active:shadow-[0_1px_0_#00423b]"
            }`}
          >
            {isListening ? (
              <Mic className="text-white w-6 h-6 animate-pulse" />
            ) : (
              <span className="material-symbols-outlined text-[28px] text-[#00201c] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                swords
              </span>
            )}
          </button>
          
          <span className="absolute -top-6 whitespace-nowrap text-[8px] text-[#fbe18c]/60 font-bold tracking-wider bg-[#0e1513]/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-[#d59a6c]/15">
            {isListening ? "انطق للإطلاق" : "انقر للإطلاق"}
          </span>
        </div>
      </footer>

      {/* ----------------- TRIGGERED POPUPS (GAMEOVER & INSTRUCTIONS) ----------------- */}
      
      {!hasStartedStory && drill && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-[#4a3623] rounded-3xl border-2 border-[#d59a6c]/40 p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(20,184,166,0.1)] relative">
            <div className="text-6xl mb-4">🪓</div>
            <h2 className="text-2xl font-black text-[#fbe18c] tracking-tight mb-2">مهمة الاحتطاب!</h2>
            <p className="text-sm text-[#859490] leading-relaxed mb-6">
              مرحباً ليث! المخازن شبه فارغة، نحتاج لجمع الحطب لبناء الأسوار والدفاعات التي تحمينا من الوحوش.
              ارمِ السكاكين لتقطيع الأخشاب وتعلم الكلمات!
            </p>
            <div className="bg-[#5c452e] p-4 rounded-2xl border border-[#d59a6c]/20 mb-6">
              <p className="text-[10px] text-[#fbe18c] uppercase font-bold tracking-wider mb-2">كلمات هذه المهمة:</p>
              <p className="text-lg font-bold text-white">{currentVocab.translation}</p>
              <p className="text-xs text-[#859490] mt-1">{currentVocab.word}</p>
            </div>
            <button
              onClick={() => setHasStartedStory(true)}
              className="w-full py-4 bg-gradient-to-r from-[#d59a6c] to-[#0d9488] hover:from-[#fbe18c] hover:to-[#d59a6c] text-[#051f22] font-black rounded-xl text-lg shadow-xl shadow-[#d59a6c]/20 transition-all active:scale-95"
            >
              هيا لنبدأ الجمع!
            </button>
          </div>
        </div>
      )}

      {/* Game Over modal backdrop */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-red-600 rounded-3xl p-1 max-w-sm w-full text-center shadow-2xl relative">
            <div className="bg-white rounded-[22px] p-6 text-slate-900 flex flex-col items-center">
              <span className="text-5xl block mb-2 animate-bounce">💥</span>
              <h2 className="text-3xl font-black text-red-600 tracking-tight">انتهت اللعبة!</h2>
              <p className="text-xs text-slate-500 mt-1">لقد اصطدمت السكين بسكين أخرى مثبّتة.</p>

              {/* Vocab review box inside game over */}
              <div className="my-4 w-full bg-blue-600 p-3 rounded-2xl border border-blue-400">
                <p className="text-[10px] text-white/80 uppercase font-bold tracking-wider mb-1">الكلمة المراجعة حالياً:</p>
                <p className="text-xl font-black text-white">"{currentVocab.translation}"</p>
                <p className="text-xs text-white/90 italic mt-0.5">{currentVocab.word} ({currentVocab.pronunciation})</p>
              </div>

              <div className="flex w-full justify-between gap-4 mt-2">
                <div className="flex-1 bg-blue-500 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-white/80 block font-bold">النقاط الكلية:</span>
                  <span className="text-xl font-black text-white">{score}</span>
                </div>
                <div className="flex-1 bg-blue-500 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-white/80 block font-bold">أعلى نقاط:</span>
                  <span className="text-xl font-black text-white">{highScore}</span>
                </div>
              </div>

              <div className="flex flex-col w-full gap-3 mt-6">
                <button 
                  onClick={handleRestart}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all cursor-pointer shadow-md"
                >
                  إعادة المحاولة مجدداً
                </button>
                
                {(!drill && onClose) && (
                  <button 
                    onClick={onClose}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
                  >
                    الرجوع إلى الألعاب
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Instruction help modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#4a3623] rounded-3xl border-2 border-[#d59a6c]/40 p-6 max-w-sm w-full shadow-2xl relative text-right" dir="rtl">
            <button 
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 left-4 text-[#859490] hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-white/5 transition-all text-sm cursor-pointer"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-black text-[#fbe18c] mb-3 flex items-center gap-2">
              📖 دليل لعبة اصطدام السكاكين
            </h2>
            
            <div className="space-y-4 text-xs leading-relaxed text-white/90">
              <p>مرحباً بك في <strong>اصطدام السكاكين (Lingo Hit)</strong>! هذه اللعبة صُممت لتسلية اللاعبين مع تحدي النطق ومراجعة مفردات اللغات بأسلوب شيق وجديد.</p>
              
              <div className="space-y-2 bg-[#5c452e]/60 p-3 rounded-2xl border border-[#d59a6c]/20">
                <p className="font-bold text-[#fbe18c]">🎤 كيف تلعب بالصوت (الميكروفون)؟</p>
                <ul className="list-disc list-inside space-y-1 text-white/80 pr-1">
                  <li>قم بتفعيل خيار <strong>'تشغيل بالميكروفون'</strong>.</li>
                  <li>امنح صلاحية الدخول للميكروفون في المتصفح إذا تم طلبها.</li>
                  <li>عند تفعيل صوت المايك، <strong>تكلم، انفخ، أو صِح بصوتٍ مرتجّل</strong>، وسيقوم النظام تلقائياً بإطلاق السكين فوراً عند تخطي شريط شدة صوتك لعتبة الحساسية!</li>
                  <li>استخدم <strong>شريط الحساسية</strong> لضبط مدى جهارة الصوت المطلوبة قبل الإطلاق.</li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-[#ffd700]">🎮 القواعد الأساسية للعبة:</p>
                <ul className="list-disc list-inside space-y-1 text-white/80 pr-1">
                  <li>أطلق كل السكاكين الملقاة بالأسفل لتثبيتها بكاملها على الجذع الخشبي الدائر.</li>
                  <li>احذر من إصابة أو ضرب أي سكاكين مثبتة سابقاً وإلا ستخسر الجولة.</li>
                  <li>كل سكين تطلقها تصيب الجذع تمنحك <strong className="text-green-400">10+ نقاط</strong> وتراجع معك كلمة لغوية معينة تظهر على اللوحة العائمة.</li>
                  <li>اصدم التفاح المعلق على الجذع لإحراز مكافآت ضخمة بقيمة <strong className="text-green-400">100+ نقطة</strong> وإضافة <strong className="text-red-400">2 تفاحة</strong> لرصيدك!</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowInstructions(false)}
              className="mt-6 w-full py-3 bg-[#d59a6c] hover:bg-[#fbe18c] text-[#00201c] font-black rounded-xl transition-all border-b-4 border-[#00423b] active:border-b-0 active:translate-y-1 cursor-pointer"
            >
              فهمت ولنكتسح النقاط!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
