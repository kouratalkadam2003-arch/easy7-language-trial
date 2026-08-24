import { create } from 'zustand';
import { QuestData, generateQuest, generateImage } from './services/gameMaster';
import { TOPICS, CEFR_CURRICULUM } from '../constants';

export interface QuestItem {
  id: string;
  sound: string;
  arabicObject: string;
  imagePrompt: string;
  imageUrl?: string;
  description: string;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface MonsterState {
  id: string;
  position: Vector2;
  state: 'patrol' | 'chase' | 'eating' | 'captured';
  target?: Vector2;
}

export interface TrapState {
  id: string;
  orderIndex: number; // 0, 1, 2...
  position: Vector2;
  isFilled: boolean;
  capturedItem?: QuestItem;
}

export interface BubbleState {
  position: Vector2;
  target: Vector2;
  createdAt: number;
}

type GamePhase = 'playing' | 'caught' | 'won';

interface GameState {
  // --- Game Config & Flow ---
  isLoading: boolean;
  currentLevel: number;
  gamePhase: GamePhase;
  topic: string;
  targetLanguage: string;
  
  // --- AI Data ---
  currentQuest: QuestData | null;
  questItems: QuestItem[];
  
  // --- Game Entities ---
  grid: number[][]; // 2D level grid (1=wall, 0=path)
  pigPosition: Vector2;
  monsters: MonsterState[];
  traps: TrapState[];
  starfruits: Vector2[];
  starsCollected: number;
  activeBubble: BubbleState | null;

  // --- Interaction State ---
  isMocking: boolean;
  mockeryMessage: string;

  // --- Actions ---
  startGame: (startLevel?: number | string, targetLanguage?: string, flashcards?: any[]) => Promise<void>;
  nextLevel: () => Promise<void>;
  restartLevel: () => void;
  setPigPosition: (pos: Vector2) => void;
  shootBubble: (target: Vector2) => void;
  updateMonsters: (monsters: MonsterState[]) => void;
  removeStarfruit: (index: number) => void;
  collectStarfruit: (index: number) => void;
  catchPig: () => void;
  captureMonsterInTrap: (monsterId: string, trapId: string) => void;
  removeBubble: () => void;
  resetMockery: () => void;
  // --- Helpers ---
  speak: (text: string, lang: 'en-US' | 'ar-SA', pitch?: number) => void;
}

// Helper to generate and assign images
const generateAndAssignImages = async (items: QuestItem[]): Promise<void> => {
  const promises = items.map(async (item) => {
    try {
      const prompt = item.imagePrompt || item.arabicObject;
      const imageUrl = await generateImage(prompt);
      item.imageUrl = imageUrl;
    } catch (error) {
      console.warn(`Failed to generate image for ${item.arabicObject}`, error);
      item.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(item.imagePrompt || item.arabicObject)}?width=256&height=256&nologo=true`;
    }
  });
  await Promise.all(promises);
};

// Helper: Ensure entities are spawned on safe paths (0)
const findNearestWalkable = (grid: number[][], startX: number, startY: number): Vector2 => {
  if (!grid || grid.length === 0) return { x: startX, y: startY };
  const rows = grid.length;
  const cols = grid[0]?.length || 1;
  let r = 0;
  while (r < 20) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const x = startX + dx;
          const y = startY + dy;
          if (y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] === 0) {
            return { x, y };
          }
        }
      }
    }
    r++;
  }
  return { x: startX, y: startY };
};

const buildSafeLevelState = (quest: QuestData, items: QuestItem[]) => {
  const layout = quest.levelLayout || ({} as any);
  const pigStart = layout.pigStartPosition || [0, 0];
  const safePigPos = findNearestWalkable(layout.grid || [[0]], pigStart[0] || 0, pigStart[1] || 0);
  
  const traps: TrapState[] = [];
  const monsters: MonsterState[] = [];
  
  // Force traps & monsters length to equal syllables length
  for (let i = 0; i < items.length; i++) {
    const tx = (layout.trapPositions || [])[i]?.[0] || safePigPos.x + 2;
    const ty = (layout.trapPositions || [])[i]?.[1] || safePigPos.y;
    traps.push({
      id: `trap-${i}`,
      orderIndex: i,
      position: findNearestWalkable(layout.grid || [[0]], tx, ty),
      isFilled: false
    });

    const mx = (layout.monsterPositions || [])[i]?.[0] || safePigPos.x - 2;
    const my = (layout.monsterPositions || [])[i]?.[1] || safePigPos.y;
    monsters.push({
      id: `monster-${i}`,
      position: findNearestWalkable(layout.grid || [[0]], mx, my),
      state: 'patrol'
    });
  }

  const starfruits = (layout.starfruitPositions || []).map((pos) => 
    findNearestWalkable(layout.grid || [[0]], pos[0], pos[1])
  );

  return {
    grid: layout.grid,
    pigPosition: safePigPos,
    monsters,
    traps,
    starfruits,
    starsCollected: 0,
    activeBubble: null,
    gamePhase: 'playing' as GamePhase,
    isMocking: false,
    mockeryMessage: ''
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  isLoading: false,
  currentLevel: 1,
  gamePhase: 'playing',
  topic: '',
  targetLanguage: '',
  
  currentQuest: null,
  questItems: [],
  
  grid: [],
  pigPosition: {x: 0, y: 0},
  monsters: [],
  traps: [],
  starfruits: [],
  starsCollected: 0,
  activeBubble: null,

  isMocking: false,
  mockeryMessage: '',

  speak: (text, lang, pitch = 1.0) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.pitch = pitch;
    window.speechSynthesis.speak(utterance);
  },

  startGame: async (startLevel?: number | string, targetLanguage?: string, flashcards?: any[]) => {
    let targetLevel = 1;
    let customTopic = '';
    
    if (typeof startLevel === 'number') {
      targetLevel = startLevel;
    } else if (typeof startLevel === 'string' && startLevel.trim() !== '') {
      customTopic = startLevel;
    }

    set({ isLoading: true, topic: customTopic, currentLevel: targetLevel, targetLanguage: targetLanguage || '' });
    try {
      let quest;

      if (flashcards && flashcards.length > 0) {
        // Fast synchronous path! Build quest locally from flashcards
        const validCards = flashcards.filter(c => c.originalText && c.originalText.trim() !== '');
        // Take up to 3 cards
        const selectedCards = validCards.slice(0, 3);
        if (selectedCards.length === 0) selectedCards.push({ originalText: "Hello", translation: "مرحباً", nativeText: "Hello" });

        quest = {
          targetSentence: selectedCards.map(c => c.originalText).join(' '),
          arabicTranslation: selectedCards.map(c => c.translation).join(' '),
          arabicTransliteration: selectedCards.map(c => c.nativeText || '').join(' '),
          syllables: selectedCards.map(c => ({
            sound: c.originalText,
            arabicObject: c.translation,
            imagePrompt: c.originalText,
            objectDescription: c.translation,
            visualType: 'cube' as const
          })),
          questBrief: "اجمع الكلمات في الفخاخ!",
          absurdScene: "تذكر الكلمات بشكل صحيح.",
          memoryReveal: "أنت تتذكر...",
          levelLayout: {
            grid: [
              [1,1,1,1,1,1,1,1,1],
              [1,0,0,0,0,0,0,0,1],
              [1,0,1,1,1,1,1,0,1],
              [1,0,0,0,0,0,0,0,1],
              [1,1,1,1,1,1,1,1,1]
            ],
            pigStartPosition: [1, 1] as [number, number],
            monsterPositions: [[7, 1], [7, 3], [1, 3]].slice(0, selectedCards.length) as [number, number][],
            starfruitPositions: [[4, 1], [4, 3]] as [number, number][],
            trapPositions: [[6, 1], [6, 3], [2, 3]].slice(0, selectedCards.length) as [number, number][]
          }
        };
      } else {
        const languageInfo = targetLanguage ? `اللغة المستهدفة هي ${targetLanguage}.` : "اللغة المستهدفة هي الإنجليزية.";
        let context = "مغامرة البداية. " + languageInfo;
        let targetPhrase = "";

        if (customTopic) {
          context = `العبارة أو الموضوع المطلوب تعليمه: ${customTopic}. ${languageInfo}`;
        } else {
           try {
             // Import here to avoid cyclic dependency issues
             const { getLessonFromFirebase } = await import('../services/firebase');
             if (targetLanguage) {
               const lesson = await getLessonFromFirebase(targetLanguage, 'A1', targetLevel);
               if (lesson) {
                  // Try to extract a sentence from interactive_text or any available stage text
                  if (lesson.story && lesson.story.originalText) {
                    targetPhrase = lesson.story.originalText.split('.')[0] || '';
                 } else if (lesson.interactive_text && lesson.interactive_text.storyText) {
                     targetPhrase = lesson.interactive_text.storyText.split('.')[0] || '';
                  } else if (lesson.grammar_explanation && lesson.grammar_explanation.title) {
                     targetPhrase = lesson.grammar_explanation.title;
                  }
               }
             }
           } catch(e) {
             console.warn("Could not fetch lesson from Firebase for game", e);
           }

           const allTopicsList = Object.values(TOPICS).flatMap(g => g.topics);
           const topicObj = allTopicsList[targetLevel - 1];
           
           if (targetPhrase) {
              context = `العبارة المطلوبة تعليمه هي بالضبط: "${targetPhrase}". ${languageInfo}`;
           } else if (topicObj) {
              context = `تعلم عبارات متعلقة بهذا الموضوع: ${topicObj.title}. 
  الموقف: المستخدم يتعلم الأساسيات ويريد بناء جملة مفيدة عن ${topicObj.title}.
  ${languageInfo}`;
           }
        }

        quest = await generateQuest(targetLevel, context);
      }
      
      const items: QuestItem[] = quest.syllables.map((s: any, index: number) => ({
        id: `item-${index}`,
        sound: s.sound,
        arabicObject: s.arabicObject,
        imagePrompt: s.imagePrompt,
        description: s.objectDescription,
      }));

      await generateAndAssignImages(items);

      const safeState = buildSafeLevelState(quest, items);
      
      set({ 
        currentQuest: quest, 
        questItems: items, 
        isLoading: false,
        currentLevel: 1,
        ...safeState
      });
    } catch (error) {
      console.error("Failed to start game:", error);
      set({ isLoading: false });
    }
  },

  nextLevel: async () => {
    const { currentLevel, topic, targetLanguage } = get();
    set({ isLoading: true });
    try {
      const nextLvl = currentLevel + 1;
      const languageInfo = targetLanguage ? `اللغة المستهدفة هي ${targetLanguage}.` : "اللغة المستهدفة هي الإنجليزية.";
      let context = "مغامرة البداية. " + languageInfo;
      let targetPhrase = "";

      if (topic) {
        context = `العبارة أو الموضوع المطلوب تعليمه: ${topic}. ${languageInfo}`;
      } else {
         try {
           const { getLessonFromFirebase } = await import('../services/firebase');
           if (targetLanguage) {
             const lesson = await getLessonFromFirebase(targetLanguage, 'A1', nextLvl);
             if (lesson) {
                if (lesson.story && lesson.story.originalText) {
                   targetPhrase = lesson.story.originalText.split('.')[0] || '';
                } else if (lesson.interactive_text && lesson.interactive_text.storyText) {
                   targetPhrase = lesson.interactive_text.storyText.split('.')[0] || '';
                } else if (lesson.grammar_explanation && lesson.grammar_explanation.title) {
                   targetPhrase = lesson.grammar_explanation.title;
                }
             }
           }
         } catch(e) {
           console.warn("Could not fetch lesson from Firebase for game", e);
         }

         const allTopicsList = Object.values(TOPICS).flatMap(g => g.topics);
         const topicObj = allTopicsList[nextLvl - 1];
         
         if (targetPhrase) {
            context = `العبارة المطلوبة تعليمه هي بالضبط: "${targetPhrase}". ${languageInfo}`;
         } else if (topicObj) {
            context = `تعلم عبارات متعلقة بهذا الموضوع: ${topicObj.title}.
الموقف: المستخدم يتعلم الأساسيات ويريد بناء جملة مفيدة عن ${topicObj.title}.
${languageInfo}`;
         } else {
            context = `مغامرة المستوى ${nextLvl}. ${languageInfo}`;
         }
      }
      const quest = await generateQuest(nextLvl, context);
      
      const items: QuestItem[] = quest.syllables.map((s, index) => ({
        id: `item-${index}-${Date.now()}`,
        sound: s.sound,
        arabicObject: s.arabicObject,
        imagePrompt: s.imagePrompt,
        description: s.objectDescription,
      }));

      await generateAndAssignImages(items);
      
      const safeState = buildSafeLevelState(quest, items);

      set({ 
        currentLevel: nextLvl,
        currentQuest: quest, 
        questItems: items, 
        isLoading: false,
        ...safeState
      });
    } catch (error) {
      console.error("Failed to load next level:", error);
      set({ isLoading: false });
    }
  },

  restartLevel: () => {
    const { currentQuest, questItems } = get();
    if (!currentQuest) return;
    
    const safeState = buildSafeLevelState(currentQuest, questItems);
    
    set({
      ...safeState
    });
  },

  setPigPosition: (pos) => set({ pigPosition: pos }),

  shootBubble: (target) => {
    const { pigPosition, activeBubble } = get();
    // Only one bubble at a time
    if (!activeBubble) {
      set({ activeBubble: { position: { ...pigPosition }, target, createdAt: Date.now() } });
    }
  },

  removeBubble: () => set({ activeBubble: null }),

  updateMonsters: (monsters) => set({ monsters }),

  removeStarfruit: (index) => {
    set((state) => ({
      starfruits: state.starfruits.filter((_, i) => i !== index)
    }));
  },

  collectStarfruit: (index) => {
    set((state) => ({
      starfruits: state.starfruits.filter((_, i) => i !== index),
      starsCollected: state.starsCollected + 1
    }));
  },

  catchPig: () => {
    const { speak } = get();
    const mockPhrases = [
      "قال 'are you how' قال! هههههههه",
      "يا ولدي واش راك تخلط؟ قالك 'are you how'!",
      "ضحكتني بزاف، هذي لغة جديدة؟ 'are you how'؟ هههههه",
      "أشد السخرية منك! طحتي في الفخ يا مسكين!"
    ];
    const message = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
    set({ gamePhase: 'caught', isMocking: true, mockeryMessage: message });
    speak(message, 'ar-SA');
    speak("Hahaha! You are so bad at this!", 'en-US', 1.5);
  },

  captureMonsterInTrap: (monsterId, trapId) => {
    const { traps, questItems, monsters, speak } = get();
    const trapIndex = traps.findIndex(t => t.id === trapId);
    if (trapIndex === -1) return;

    const trap = traps[trapIndex];
    
    // Check order enforcement
    const expectedTrapIndex = traps.findIndex(t => !t.isFilled);
    if (trap.orderIndex !== expectedTrapIndex) {
      speak("ترتيب خاطئ! ابدأ بالفخ الأول", 'ar-SA');
      // Briefly flash screen or show UI? Handled in component
      // Monster destroys bubble, returns to patrol
      get().removeBubble();
      return; 
    }

    // Capture success
    const item = questItems[trap.orderIndex];
    if (item) {
      speak(item.sound, 'en-US');
    }

    const newTraps = [...traps];
    newTraps[trapIndex] = { ...trap, isFilled: true, capturedItem: item };

    const newMonsters = monsters.filter(m => m.id !== monsterId);

    set({ traps: newTraps, monsters: newMonsters });
    get().removeBubble();

    // Check Win
    if (newTraps.every(t => t.isFilled)) {
      set({ gamePhase: 'won' });
    }
  },

  resetMockery: () => set({ isMocking: false, mockeryMessage: "" })
}));
