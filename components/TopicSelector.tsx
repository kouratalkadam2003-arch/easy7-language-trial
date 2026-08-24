
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Language, Topic, CEFRLevel, LevelStatus, WordData, Flashcard, ShareableLessonData } from '../types';
import { TARGET_LANGUAGES, TOPICS, CEFR_CURRICULUM, LEVEL_COORDINATES, STAGE_GATE_COORDINATES, MAP_BACKGROUND_IMAGE_PROMPT } from '../constants';
import { LockIcon, PlayIcon, StarIcon, UploadIcon, GraduationCapIcon, BookIcon, GamepadIcon, HomeIcon } from './icons';
import { FALLBACK_MAP_BACKGROUND } from '../assets/map-background';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { generateImagesWithRetry, generateRaceBanter } from '../services/ai';
import { User } from 'firebase/auth';
import { TTSModeToggle } from './TTSModeToggle';
import { useCreator } from '../contexts/CreatorContext';
import { importLessonsFromJson, getLessonsMetadata } from '../services/firebase';
import { Leaf, Star } from 'lucide-react';
import { useFarmStore } from '../farmStore';
import MapIntroModal from './MapIntroModal';
import { isDayUnlocked, needsDailyReview, dailyReviewDoneToday } from '../lib/cardStore';


interface TopicSelectorProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onStartLesson: (topic: Topic, dayNumber: number, previousTopics: Topic[], initialStage?: string) => void;
  difficultyLevel: CEFRLevel;
  onDifficultyChange: (level: CEFRLevel) => void;
  completedLevels: number[];
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImportFlashcards: (event: React.ChangeEvent<HTMLInputElement>) => void;
  generateWithImages: boolean;
  onGenerateWithImagesChange: (generate: boolean) => void;
  lessonMode: 'single' | 'multi';
  onBackToModeSelection: () => void;
  onOpenArcade: () => void;
  user: any;
  coins: number;
  onSignOut: () => void;
  onCacheContent: (key: string, content: string) => void;
  onExportLesson: (topic: Topic) => void;
  onOpenFarm: () => void;
  [key: string]: any;
}

const UI_TEXTS = {
    title: "خريطة قرية إيلي",
    subtitle: "رحلة التعلم والبناء مع ليث وإيلي",
    languageLabel: "اللغة:",
    start: "ابدأ المغامرة",
    importButton: "بيانات",
    importLessonButton: "استيراد درس",
    importCardsButton: "بطاقات",
    generateWithImagesLabel: "صور AI",
    backToMode: "خروج",
    selectLevel: "المستوى"
};

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const wrapSvgText = (text: string, maxCharsPerLine: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
};

// --- DECORATION COMPONENTS (Pure SVG) ---
const DecorationTree: React.FC<{ x: number, y: number, scale?: number, color?: string }> = ({ x, y, scale = 1, color = "var(--color-progress-fill-start)" }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* Trunk */}
        <path d="M-5 0 L5 0 L5 -15 L-5 -15 Z" fill="#7c2d12" />
        {/* Leaves (Cone layers) */}
        <path d="M-20 -10 L0 -40 L20 -10 Z" fill={color} stroke="#1e3a8a" strokeWidth="2" />
        <path d="M-15 -30 L0 -55 L15 -30 Z" fill={color} filter="brightness(1.2)" stroke="#1e3a8a" strokeWidth="2" />
        <path d="M-10 -50 L0 -70 L10 -50 Z" fill={color} filter="brightness(1.4)" stroke="#1e3a8a" strokeWidth="2" />
    </g>
);

const DecorationHill: React.FC<{ d: string, color: string }> = ({ d, color }) => (
    <path d={d} fill={color} stroke="none" />
);

const RaceBanner: React.FC<{ x: number, y: number, text: string, type?: 'start' | 'finish' }> = ({ x, y, text, type = 'start' }) => {
    const isFinish = type === 'finish';
    const mainColor = isFinish ? 'var(--color-progress-fill-start)' : 'var(--color-app-accent)';
    const postColor = 'var(--color-nav-icon-inactive)';
    
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Posts */}
            <rect x={-150} y={0} width={10} height={100} fill={postColor} />
            <rect x={140} y={0} width={10} height={100} fill={postColor} />
            
            {/* Banner Cloth */}
            <path d="M-150 10 Q0 30 150 10 L150 60 Q0 80 -150 60 Z" fill={mainColor} stroke="white" strokeWidth="2" />
            
            {/* Checkered pattern for finish */}
            {isFinish && (
                <g clipPath="url(#bannerClip)">
                    <defs>
                        <clipPath id="bannerClip">
                             <path d="M-150 10 Q0 30 150 10 L150 60 Q0 80 -150 60 Z" />
                        </clipPath>
                    </defs>
                    <pattern id="checkers" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="10" height="10" fill="white" opacity="0.3" />
                        <rect x="10" y="10" width="10" height="10" fill="white" opacity="0.3" />
                    </pattern>
                    <rect x="-150" y="0" width="300" height="100" fill="url(#checkers)" />
                </g>
            )}

            <text 
                x="0" y="45" 
                textAnchor="middle" 
                fill="white" 
                fontSize="28" 
                fontWeight="bold" 
                fontFamily="sans-serif"
                style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
            >
                {text}
            </text>
        </g>
    );
};

// --- MAP CHARACTER (The Opponents & User) ---
interface MapCharacterProps {
    x: number;
    y: number;
    color: string;
    skinColor?: string;
    isUser?: boolean;
    name?: string;
    message?: string | null;
}

const MapCharacter: React.FC<MapCharacterProps> = ({ x, y, color, skinColor = "var(--color-skin-tone)", isUser, name, message }) => {
    // CSS Animations for walking (legs/arms scissoring)
    const walkStyle = {
        animation: 'bounce-walk 1s infinite linear'
    };
    
    return (
        <g transform={`translate(${x}, ${y})`}>
            <style>
                {`
                    @keyframes limb-swing-left { 
                        0% { transform: rotate(20deg); } 
                        50% { transform: rotate(-20deg); } 
                        100% { transform: rotate(20deg); } 
                    }
                    @keyframes limb-swing-right { 
                        0% { transform: rotate(-20deg); } 
                        50% { transform: rotate(20deg); } 
                        100% { transform: rotate(-20deg); } 
                    }
                    .limb { transform-origin: top center; }
                    .animate-left-limb { animation: limb-swing-left 0.8s ease-in-out infinite alternate; }
                    .animate-right-limb { animation: limb-swing-right 0.8s ease-in-out infinite alternate; }
                    .char-bounce { animation: bounce-body 0.4s ease-in-out infinite alternate; }
                    @keyframes bounce-body { from { transform: translateY(0); } to { transform: translateY(-3px); } }
                `}
            </style>

            {/* Scale entire character */}
            <g transform="scale(1.2)">
                
                {/* Back Leg */}
                <g className="limb animate-right-limb" transform="translate(5, 15)">
                    <rect x="-3" y="0" width="6" height="20" rx="3" fill="#334155" />
                    <rect x="-3" y="18" width="8" height="4" rx="2" fill="black" />
                </g>

                {/* Back Arm */}
                <g className="limb animate-left-limb" transform="translate(10, -5)">
                    <rect x="-2" y="0" width="4" height="18" rx="2" fill={skinColor} />
                    <circle cx="0" cy="18" r="3" fill={skinColor} />
                </g>

                {/* Body Group (Bouncing) */}
                <g className="char-bounce">
                    {/* Torso */}
                    <path d="M-10 -15 L10 -15 L12 15 L-12 15 Z" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    
                    {/* Head */}
                    <circle cx="0" cy="-25" r="12" fill={skinColor} />
                    {/* Hair/Hat hint */}
                    <path d="M-12 -28 Q0 -40 12 -28 L12 -22 Q0 -15 -12 -22 Z" fill={isUser ? "#facc15" : "#4b5563"} />
                    
                    {/* Eyes */}
                    <circle cx="-4" cy="-24" r="1.5" fill="black" />
                    <circle cx="4" cy="-24" r="1.5" fill="black" />
                    {/* Smile */}
                    <path d="M-3 -19 Q0 -17 3 -19" stroke="black" strokeWidth="1" fill="none" />
                </g>

                {/* Front Leg */}
                <g className="limb animate-left-limb" transform="translate(-5, 15)">
                    <rect x="-3" y="0" width="6" height="20" rx="3" fill="#334155" />
                    <rect x="-3" y="18" width="8" height="4" rx="2" fill="black" />
                </g>

                {/* Front Arm */}
                <g className="limb animate-right-limb" transform="translate(-10, -5)">
                    <rect x="-2" y="0" width="4" height="18" rx="2" fill={skinColor} />
                    <circle cx="0" cy="18" r="3" fill={skinColor} />
                </g>

                {/* Name Tag */}
                {name && (
                    <g transform="translate(0, -45)">
                        <rect x="-25" y="-12" width="50" height="14" rx="4" fill="white" stroke={color} strokeWidth="1" opacity="0.9" />
                        <text x="0" y="-2" textAnchor="middle" fontSize="9" fill="#333" fontWeight="bold" fontFamily="sans-serif">{name}</text>
                    </g>
                )}

                {/* Speech Bubble (Banter) */}
                {message && (
                    <g transform="translate(0, -65)" className="animate-bounce">
                        <path d="M-60 -40 L60 -40 L60 0 L10 0 L0 10 L-10 0 L-60 0 Z" fill="white" stroke="#333" strokeWidth="2" />
                        <text x="0" y="-20" textAnchor="middle" fontSize="10" fill="black" fontWeight="bold" fontFamily="sans-serif">
                            {wrapSvgText(message, 15).map((line, i) => (
                                <tspan key={i} x="0" dy={i === 0 ? 0 : 12}>{line}</tspan>
                            ))}
                        </text>
                    </g>
                )}
            </g>
        </g>
    );
};

const TopicSelector: React.FC<TopicSelectorProps> = ({ 
    language, 
    onLanguageChange, 
    onStartLesson, 
    difficultyLevel, 
    onDifficultyChange, 
    completedLevels, 
    onImportData, 
    onImportFlashcards,
    generateWithImages,
    onGenerateWithImagesChange,
    lessonMode,
    onBackToModeSelection,
    onOpenArcade,
    user,
    coins,
    onSignOut,
    onCacheContent,
    onExportLesson,
    onOpenFarm
}) => {
  const { myCreatorId, viewingCreatorId } = useCreator();
  const activeCreatorId = viewingCreatorId || myCreatorId;
  const dueSeedsCount = useFarmStore(state => state.getDueSeeds().length);
  const [subStagesProgress, setSubStagesProgress] = useState<Record<number, string[]>>({});

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showMapIntro, setShowMapIntro] = useState(() => {
    // Only show the map intro if this is the first day (no completed levels)
    return completedLevels.length === 0;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [banter, setBanter] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const showToast = (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 4000);
  };
  const importDataInputRef = useRef<HTMLInputElement>(null);
  const importLessonInputRef = useRef<HTMLInputElement>(null);
  const importCardsInputRef = useRef<HTMLInputElement>(null);
  const importLessonsDBInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // --- OPPONENTS LOGIC ---
  // Define opponents with different "Learning speeds"
  const opponentsRef = useRef([
      { id: 'rival', name: 'يوكي', color: '#ec4899', level: 1, speed: 0.8 }, // Fast but erratic
      { id: 'jester', name: 'رشدس', color: '#14b8a6', level: 1, speed: 0.4 }, // Slow
  ]);

  const [opponentPositions, setOpponentPositions] = useState<{id: string, level: number}[]>([]);

  useEffect(() => {
      // Initialize opponent positions (Simulated progress)
      // For demo: Randomize their current level around the user's max completed level
      const maxUserLevel = completedLevels.length > 0 ? Math.max(...completedLevels) : 1;
      
      const newPositions = opponentsRef.current.map(opp => {
          // Determine simulated level:
          // Rival is competitive (close to user), Jester is behind.
          let simLevel = 1;
          if (opp.id === 'rival') simLevel = Math.max(1, maxUserLevel + (Math.random() > 0.5 ? 1 : -1));
          if (opp.id === 'jester') simLevel = Math.max(1, maxUserLevel - 2);
          
          return { id: opp.id, level: simLevel };
      });
      setOpponentPositions(newPositions);

      // Trigger Banter AI
      const triggerBanter = async () => {
          const rival = newPositions.find(p => p.id === 'rival')!;
          const jester = newPositions.find(p => p.id === 'jester')!;
          
          const result = await generateRaceBanter(maxUserLevel, { name: 'يوكي', level: rival.level }, { name: 'رشدس', level: jester.level });
          if (result) {
              setBanter({ [result.speaker === 'يوكي' ? 'rival' : (result.speaker === 'رشدس' ? 'jester' : 'user')]: result.text });
              setTimeout(() => setBanter({}), 8000); // Hide after 8s
          }
      };
      
      const t = setTimeout(triggerBanter, 2000); // Delay banter slightly
      return () => clearTimeout(t);

  }, [completedLevels]);

  
  useEffect(() => {
      const handleResize = () => {
          setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [dynamicTopics, setDynamicTopics] = useState<any[]>([]);

  useEffect(() => {
      let mounted = true;
      const loadMetadata = async () => {
          const metadata = await getLessonsMetadata(language.code, difficultyLevel);
          if (mounted && metadata.length > 0) {
              setDynamicTopics(metadata);
          } else if (mounted) {
              setDynamicTopics([]);
          }
      };
      loadMetadata();
      return () => { mounted = false; };
  }, [language.code, difficultyLevel]);

  const allTopics = useMemo(() => {
    // If we have dynamic topics from DB or static files for this level, use them
    if (dynamicTopics.length > 0) {
        return dynamicTopics.map((meta, index) => {
            const levelKey = `Station${Math.floor(index / 3) + 1}`;
            const id = meta.topic.id || `s${Math.floor(index / 3) + 1}_d${meta.dayNumber}`;
            const title = typeof meta.topic === 'string' ? meta.topic : (meta.topic.title || `Day ${meta.dayNumber}`);
            return {
                id,
                title,
                levelKey,
                dayNumber: meta.dayNumber
            };
        });
    }
    
    // Fallback to constants
    const levelTopics = CEFR_CURRICULUM[difficultyLevel] || TOPICS;
    return Object.entries(levelTopics).flatMap(([levelKey, levelGroup]) => 
        levelGroup.topics.map((topic, idx) => ({...topic, levelKey, dayNumber: (topic as any).dayNumber || (idx + 1)}))
    );
  }, [dynamicTopics, difficultyLevel]);

  const currentLevelIndex = useMemo(() => {
      let lastCompleted = -1;
      for (let i = 0; i < allTopics.length; i++) {
          if (completedLevels.includes(i + 1)) {
              lastCompleted = i;
          } else {
              return i; 
          }
      }
      return lastCompleted === -1 ? 0 : lastCompleted;
  }, [allTopics, completedLevels]);

  // Auto-redirect to active lesson (cottage) exactly once per day/level
  useEffect(() => {
    const storageKey = `hasAutoDirectedDay_${currentLevelIndex}_${difficultyLevel}_${language.code}`;
    const alreadyDirected = localStorage.getItem(storageKey);
    if (!alreadyDirected && allTopics[currentLevelIndex]) {
        localStorage.setItem(storageKey, 'true');
        const autoStartActiveLesson = () => {
            const activeTopic = allTopics[currentLevelIndex];
            const dayNumber = activeTopic.dayNumber || currentLevelIndex + 1;
            const previousTopics = allTopics.slice(0, currentLevelIndex).map(t => ({ id: t.id, title: t.title }));
            onStartLesson(activeTopic, dayNumber, previousTopics);
        };
        const timer = setTimeout(autoStartActiveLesson, 1500); // 1.5s delay to let user see the lessons map
        return () => clearTimeout(timer);
    }
  }, [currentLevelIndex, allTopics, difficultyLevel, language.code, onStartLesson]);

  const BUILDING_LABELS = useMemo(() => [
    // Bottom half (Background repeated)
    { name: 'كوخ إيلي', top: '94%', left: '80%', desc: 'الأساسيات' },
    { name: 'سوق القرية', top: '89%', left: '20%', desc: 'التجارة' },
    { name: 'المكتبة', top: '79%', left: '80%', desc: 'القصص' },
    { name: 'ميدان التدريب', top: '79%', left: '25%', desc: 'المعركة' },
    { name: 'السوق', top: '67.5%', left: '80%', desc: 'التحيات' },
    { name: 'المكتبة', top: '64%', left: '20%', desc: 'الأساسيات' },
    
    // Top half
    { name: 'المدرسة', top: '44%', left: '80%', desc: 'الأساسيات' },
    { name: 'الحديقة', top: '39%', left: '20%', desc: 'الطبيعة' },
    { name: 'المخبز', top: '29%', left: '80%', desc: 'الطعام' },
    { name: 'المقهى', top: '29%', left: '25%', desc: 'الأرقام' },
    { name: 'السوق', top: '17.5%', left: '80%', desc: 'التحيات' },
    { name: 'المكتبة', top: '14%', left: '20%', desc: 'الأساسيات' },
  ], []);

  const PATH_COORDINATES = useMemo(() => [
    // Bottom Half (Background repeated)
    { top: '96%', left: '50%' }, { top: '93%', left: '65%' }, { top: '90%', left: '55%' },
    { top: '87%', left: '40%' }, { top: '84%', left: '50%' }, { top: '81%', left: '40%' },
    { top: '78%', left: '30%' }, { top: '75%', left: '40%' }, { top: '72%', left: '50%' },
    { top: '69%', left: '65%' }, { top: '66%', left: '55%' }, { top: '63%', left: '65%' },
    { top: '60%', left: '50%' }, { top: '57%', left: '35%' }, { top: '54%', left: '45%' },
    
    // Top Half
    { top: '48%', left: '50%' }, { top: '45%', left: '65%' }, { top: '42%', left: '55%' },
    { top: '39%', left: '40%' }, { top: '36%', left: '50%' }, { top: '33%', left: '40%' },
    { top: '30%', left: '30%' }, { top: '27%', left: '40%' }, { top: '24%', left: '50%' },
    { top: '21%', left: '65%' }, { top: '18%', left: '55%' }, { top: '15%', left: '65%' },
    { top: '12%', left: '50%' }, { top: '9%', left: '35%' },  { top: '6%', left: '45%' },
  ], []);

  const MAP_NODES = useMemo(() => {
      return allTopics.map((topic, index) => {
          const coords = PATH_COORDINATES[index % PATH_COORDINATES.length];
          return {
              ...topic,
              top: coords.top,
              left: coords.left,
          };
      });
  }, [allTopics, PATH_COORDINATES]);

  useEffect(() => {
      setTimeout(() => {
          if (mapContainerRef.current) {
              const containerViewportHeight = mapContainerRef.current.clientHeight;
              const scrollHeight = mapContainerRef.current.scrollHeight;
              
              // Calculate Y position based on percentage
              const coords = PATH_COORDINATES[currentLevelIndex % PATH_COORDINATES.length];
              const yPercent = parseFloat(coords.top);
              const currentY = (yPercent / 100) * scrollHeight;
              const targetScroll = currentY - (containerViewportHeight / 2);
              
              mapContainerRef.current.scrollTo({
                  top: Math.max(0, targetScroll),
                  behavior: 'smooth'
              });
          }
      }, 500);
  }, [currentLevelIndex, PATH_COORDINATES]);

  useEffect(() => {
      if (!selectedTopic && allTopics[currentLevelIndex]) {
          setSelectedTopic(allTopics[currentLevelIndex]);
      }
      
      const progress: Record<number, string[]> = {};
      for (let i = 1; i <= allTopics.length; i++) {
          const stored = localStorage.getItem(`lesson_progress_${i}`);
          if (stored) {
              try { progress[i] = JSON.parse(stored); } catch(e){}
          }
      }
      setSubStagesProgress(progress);
  }, [currentLevelIndex, allTopics, selectedTopic]);

  const getLevelStatus = useCallback((dayNumber: number): LevelStatus => {
    if (completedLevels.includes(dayNumber)) return LevelStatus.Completed;
    const currentDay = currentLevelIndex + 1;
    if (dayNumber === currentDay) return LevelStatus.Unlocked;
    if (dayNumber < currentDay) return LevelStatus.Unlocked; // In case they skipped somehow
    return LevelStatus.Locked;
  }, [completedLevels, currentLevelIndex]);

  const handleLevelClick = (topic: any, initialStage?: string) => {
    const dayIndex = allTopics.findIndex(t => t.id === topic.id);
    const dayNumber = topic.dayNumber || dayIndex + 1;
    
    // Check if lesson is locked
    if (getLevelStatus(dayNumber) === LevelStatus.Locked) return;
    
    // Check if daily review is needed (from cardStore)
    if (needsDailyReview(language.code) && !dailyReviewDoneToday(language.code)) {
      alert('لازم تراجع درس الأمس أولاً! المراجعة اليومية إجبارية.');
      return;
    }
    
    setSelectedTopic(topic);
    if (dayIndex > -1) {
        const previousTopics = allTopics.slice(0, dayIndex).map(t => ({ id: t.id, title: t.title }));
        onStartLesson(topic, dayNumber, previousTopics, initialStage);
    }
  }

  // Define some building emojis to cycle through
  const BUILDING_EMOJIS = ['🏡', '☕', '🏪', '🏫', '🏢', '🌳', '🏥', '🏦', '🍞', '📚', '⛺', '🏰', '🎪', '🏭'];


  const handleSubmit = () => {
        const dayIndex = allTopics.findIndex(t => t.id === selectedTopic?.id);
        if (selectedTopic && dayIndex > -1) {
            const dayNumber = (selectedTopic as any).dayNumber || dayIndex + 1;
            const previousTopics = allTopics.slice(0, dayIndex).map(t => ({ id: t.id, title: t.title }));
            onStartLesson(selectedTopic, dayNumber, previousTopics);
        }
  };

  const handleImportLesson = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        let successCount = 0;
        let errorMessages: string[] = [];
        let lastTopic = null;
        let lastDayNumber = null;
        let lastPreviousTopics = null;

        const importPromises = Array.from(files).map(async (file) => {
            try {
                const text = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file);
                });
                
                const importedData: ShareableLessonData = JSON.parse(text);
                
                // Validation
                if (importedData.type !== 'LINGO_LESSON_SHARE_V1' || !importedData.metadata || !importedData.content) {
                    throw new Error('الملف غير صالح أو تالف.');
                }

                const { topic, dayNumber, level, languageCode, previousTopics } = importedData.metadata;
                
                // 1. Set language & level (we do this for the last one if multiple)
                const lang = TARGET_LANGUAGES.find(l => l.code === languageCode);
                if (lang) onLanguageChange(lang);
                onDifficultyChange(level as CEFRLevel);

                // 2. Inject cached content
                Object.entries(importedData.content).forEach(([key, content]) => {
                    const newKey = key.endsWith(`-${activeCreatorId}`) ? key : `${key}-${activeCreatorId}`;
                    onCacheContent(newKey, content);
                });

                successCount++;
                lastTopic = topic;
                lastDayNumber = dayNumber;
                lastPreviousTopics = previousTopics;

            } catch (error) {
                console.error(`Failed to import lesson ${file.name}:`, error);
                errorMessages.push(`${file.name}: ${(error as Error).message}`);
            }
        });

        await Promise.all(importPromises);

        if (files.length === 1 && successCount === 1 && lastTopic) {
            showToast(`تم استيراد درس "${lastTopic?.title || ''}" بنجاح! جاري البدء...`);
            setTimeout(() => onStartLesson(lastTopic, lastDayNumber!, lastPreviousTopics!), 1000);
        } else if (files.length > 1) {
            if (errorMessages.length > 0) {
                showToast(`تم استيراد ${successCount} درس بنجاح.\nأخطاء:\n${errorMessages.join('\n')}`);
            } else {
                showToast(`تم استيراد ${successCount} درس بنجاح!`);
            }
        }
        
        event.target.value = '';
  };
  
  const handleImportLessonsToDB = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        showToast('جاري رفع الدروس إلى قاعدة البيانات...');
        let totalSuccessCount = 0;
        let errorMessages: string[] = [];

        const importPromises = Array.from(files).map(async (file) => {
            try {
                const text = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file);
                });
                
                const importedData = JSON.parse(text);
                let dataToImport = importedData;
                
                // Handle .lingo files (LINGO_LESSON_SHARE_V1 format)
                if (importedData.type === 'LINGO_LESSON_SHARE_V1' && importedData.metadata && importedData.content) {
                    const { languageCode, dayNumber } = importedData.metadata;
                    const formattedLesson: any = {
                        targetLang: languageCode,
                        dayNumber: dayNumber
                    };
                    
                    Object.entries(importedData.content).forEach(([key, value]) => {
                        try {
                            const parsedValue = JSON.parse(value as string);
                            if (key.includes('-story-')) formattedLesson.story = parsedValue;
                            if (key.includes('-memory-')) formattedLesson.memory = parsedValue;
                            if (key.includes('-review-')) formattedLesson.review = parsedValue;
                            if (key.includes('-textChat-')) formattedLesson.textChat = parsedValue;
                        } catch (e) {
                            console.warn("Failed to parse content for key", key);
                        }
                    });
                    
                    dataToImport = [formattedLesson];
                }

                const result = await importLessonsFromJson(dataToImport);
                
                if (result.success) {
                    totalSuccessCount += result.count || 1;
                } else {
                    throw new Error('حدث خطأ أثناء الرفع.');
                }

            } catch (error) {
                console.error(`Failed to import lessons to DB from ${file.name}:`, error);
                errorMessages.push(`${file.name}: ${(error as Error).message}`);
            }
        });

        await Promise.all(importPromises);

        if (errorMessages.length > 0) {
            showToast(`تم رفع ${totalSuccessCount} درس إلى قاعدة البيانات بنجاح.\nأخطاء:\n${errorMessages.join('\n')}`);
        } else {
            showToast(`تم رفع ${totalSuccessCount} درس إلى قاعدة البيانات بنجاح!`);
        }
        
        event.target.value = '';
  };
  
  // Level Colors Mapping
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A1': return 'bg-[#1CB0F6]'; // Blue
      case 'A2': return 'bg-[#58CC02]'; // Green
      case 'B1': return 'bg-[#FF9600]'; // Orange
      case 'B2': return 'bg-[#CE82FF]'; // Purple
      case 'C1': return 'bg-[#FF4B4B]'; // Red
      case 'C2': return 'bg-[#FF69B4]'; // Pink
      default: return 'bg-[#1CB0F6]';
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white font-sans overflow-hidden">
      <MapIntroModal isOpen={showMapIntro} onClose={() => setShowMapIntro(false)} />
      {toastMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-purple-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-pre-wrap text-center max-w-md transition-opacity duration-300">
              {toastMessage}
          </div>
      )}
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FAF8F5] shrink-0 z-10 w-full max-w-md mx-auto">
        <div className="flex items-center gap-1 font-bold text-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#FF4B4B] text-[#FF4B4B]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span className="text-[#FF4B4B] ml-1">25</span>
        </div>
        <div className="flex items-center gap-2 font-bold text-[#1CB0F6] text-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#1CB0F6] text-[#1CB0F6]"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
          <span>{coins}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-[#FF9600] text-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#FF9600] text-[#FF9600]"><path d="M12 2c0 0-4.5 3-4.5 8s3.5 5.5 1.5 8.5c2-1.5 4-1 5.5.5C16 16.5 16.5 13 15 11.5 12.5 9 14.5 5 12 2z"/></svg>
          <span>{completedLevels.length > 0 ? completedLevels.length : 1}</span>
        </div>
        <div className="flex items-center">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden shadow-sm border border-gray-200 text-2xl leading-none bg-gray-50">
               {language.flag}
            </div>
        </div>
      </div>

      {/* Section Bar */}
      <div className={`bg-[#FAF8F5] border-b-2 border-[#E5E5E5] text-slate-800 px-4 py-4 shrink-0 flex items-center justify-between z-10 w-full max-w-md mx-auto`}>
        <div className="flex flex-col items-end w-full" dir="rtl">
           <h2 className="text-xl font-bold font-sans">
             مستوى {difficultyLevel}
           </h2>
        </div>
        <div className="bg-slate-200/50 p-2 rounded-xl mr-auto ml-4">
           <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-500"><path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
        </div>
      </div>

      {/* Scrollable Map Area */}
      <div className="flex-1 overflow-y-auto w-full relative bg-[#C1D7B4] custom-scrollbar pb-[150px]" ref={mapContainerRef}>
        <div className="relative w-full max-w-md mx-auto bg-[url('/village-map-bg.jpg')] bg-[length:100%_50%] bg-repeat-y pt-12" style={{ minHeight: '1800px' }}>
            
            {/* Distance Indicator */}
            <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/80 backdrop-blur-md border border-amber-500/50 text-white px-6 py-2 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.3)] flex flex-col items-center pointer-events-none w-max">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-0.5">البعد عن القصر</span>
                <span className="font-bold font-mono text-xl">{10000 - (completedLevels.length * 50)} كم</span>
            </div>

            {/* Fog of War Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                    background: `linear-gradient(to bottom, rgba(230,240,250,0.95) 0%, rgba(230,240,250,0.95) ${Math.max(0, parseInt(MAP_NODES[Math.min(currentLevelIndex + 3, MAP_NODES.length - 1)]?.top || '10') - 10)}%, rgba(230,240,250,0) ${Math.max(0, parseInt(MAP_NODES[currentLevelIndex]?.top || '10') + 5)}%)`
                }}
            />

            {/* Building Labels positioned absolutely */}
            {BUILDING_LABELS.map((building, i) => (
                <div 
                    key={i}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
                    style={{ top: building.top, left: building.left }}
                >
                    <div className="bg-white/95 backdrop-blur shadow-sm border-2 border-slate-200 px-3 py-1.5 rounded-full flex flex-col items-center">
                        <span className="font-bold text-slate-700 text-sm">{building.name}</span>
                        <span className="text-slate-500 text-[10px] -mt-1">({building.desc})</span>
                    </div>
                </div>
            ))}
            
            {/* Path Nodes */}
            {MAP_NODES.map((node, index) => {
                const dayNumber = index + 1;
                const isActive = index === currentLevelIndex;
                const isCompleted = getLevelStatus(dayNumber) === LevelStatus.Completed;

                const isLocked = getLevelStatus(dayNumber) === LevelStatus.Locked;

                const stages = subStagesProgress[dayNumber] || [];
                const storyDone = stages.includes('story');
                const memoryDone = stages.includes('memory');
                const chatDone = stages.includes('chat') || stages.includes('textChat');
                const reviewDone = stages.includes('review') || stages.includes('deck');

                // Use CSS variables from design system for stage colors
                const cStory = storyDone ? 'var(--color-stage-story)' : 'var(--color-stage-locked)'; // Blue
                const cMemory = memoryDone ? 'var(--color-stage-memory)' : 'var(--color-stage-locked)'; // Purple
                const cChat = chatDone ? 'var(--color-stage-chat)' : 'var(--color-stage-locked)'; // Orange
                const cReview = reviewDone ? 'var(--color-stage-review)' : 'var(--color-stage-locked)'; // Green

                let initialStage = 'story';
                if (storyDone) initialStage = 'memory';
                if (storyDone && memoryDone) initialStage = 'chat';
                if (storyDone && memoryDone && chatDone) initialStage = 'review';
                if (isCompleted) initialStage = 'story'; // Replay from start if already completed

                const pieChartStyle = {
                    background: `conic-gradient(${cStory} 0deg 90deg, ${cMemory} 90deg 180deg, ${cChat} 180deg 270deg, ${cReview} 270deg 360deg)`
                };

                let shadowClass = isActive ? "shadow-[0_0_15px_rgba(var(--color-focus-ring)_/0.8)] animate-pulse" : isCompleted ? "shadow-[0_0_10px_rgba(var(--color-progress-fill-start)_/0.5)]" : "shadow-sm";

                return (
                    <div 
                        key={node.id} 
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 ${isLocked ? 'grayscale opacity-70' : 'pointer-events-auto'}`} 
                        style={{ top: node.top, left: node.left }} 
                        onClick={() => handleLevelClick(node, initialStage)}
                    >
                        {index === 0 && (
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md animate-bounce">
                                من هنا بدأ كل شيء
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-500 rotate-45"></div>
                            </div>
                        )}
                        <div className={`relative flex flex-col items-center hover:scale-110 transition-transform cursor-pointer group ${shadowClass} rounded-full`}>
                            
                            {/* Node Circle */}
                            <div className={`w-14 h-14 rounded-full border-b-[4px] border-x-2 border-t-2 border-white flex items-center justify-center relative overflow-hidden active:border-b-2 active:translate-y-[2px]`} style={pieChartStyle}>
                                {/* Inner circle to make it look like a donut or just leave as pie chart */}
                                <div className="absolute inset-1 rounded-full bg-white/90 flex items-center justify-center">
                                    {isCompleted ? <Star className="w-6 h-6 text-emerald-500 fill-emerald-500 drop-shadow-md" /> :
                                     isLocked ? <div className="w-5 h-5 text-slate-400"><LockIcon /></div> :
                                     <span className="text-slate-800 font-black text-xl drop-shadow-md">{dayNumber}</span>}
                                </div>
                            </div>
                            
                            {/* Contextual Label for the topic */}
                            <div className="bg-white/95 backdrop-blur border-2 border-slate-200 px-3 py-1 rounded-xl shadow-md absolute top-[64px] w-max max-w-[140px] text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="font-bold text-slate-800 text-xs truncate leading-tight" dir="rtl">{node.title}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

    </div>
  );
};

export default TopicSelector;
