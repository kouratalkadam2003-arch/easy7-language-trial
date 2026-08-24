
import React, { useState, useCallback, useEffect, Suspense, lazy, useRef } from 'react';
import { Language, Topic, Flashcard, CEFRLevel, UserData, FlashcardStatus, WordData } from './types';
import { ALL_LANGUAGES, TOPICS, CEFR_CURRICULUM } from './constants';
import { getFromStorage, saveToStorage } from './utils/storage';
import { calculateNextReviewTimestamp } from './utils/srs';
import { FullscreenEnterIcon, FullscreenExitIcon } from './components/icons';
import { AssistantProvider } from './contexts/AssistantContext';
import { YukiProvider, YukiGlobalView } from './components/YukiGlobal';
import { auth, getUserProgress, upsertUserProgress, signOut, saveBasicUserData, importLessonsFromJson } from './services/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import Spinner from './components/Spinner';
import { CreatorProvider } from './contexts/CreatorContext';
import ArcadeScreen from './components/ArcadeMode/ArcadeScreen';
import { useFarmStore } from './farmStore';
import { useGameStore } from './game/store';
import { addLesson, dueCards, needsDailyReview, markDayCompleted, markImmediateReviewDone, markDailyReviewDone, isDayUnlocked, dailyReviewCards, SavedCard } from './lib/cardStore';
import { ReviewSession } from './components/ReviewSession';

// Lazy load main views for better performance (Lazy Loading & Scalability)
const TopicSelector = lazy(() => import('./components/TopicSelector'));
const LessonView = lazy(() => import('./components/LessonView'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const LanguageSelector = lazy(() => import('./components/LanguageSelector'));
const LevelSelector = lazy(() => import('./components/LevelSelector'));
const QuickTranslatorModal = lazy(() => import('./components/QuickTranslatorModal').then(m => ({ default: m.QuickTranslatorModal })));
const Prologue = lazy(() => import('./components/Prologue').then(m => ({ default: m.Prologue })));
const FarmView = lazy(() => import('./components/game/GameApp'));
const PresentationMode = lazy(() => import('./components/PresentationMode').then(m => ({ default: m.PresentationMode })));
const FarmNotifications = lazy(() => import('./components/FarmNotifications').then(m => ({ default: m.FarmNotifications })));
const GlobalRadioScreen = lazy(() => import('./components/GlobalRadioScreen').then(m => ({ default: m.GlobalRadioScreen })));
const GameShell = lazy(() => import('./components/onboarding/game-shell').then(m => ({ default: m.GameShell })));
const ModeSelection = lazy(() => import('./components/ModeSelection').then(m => ({ default: m.ModeSelection })));
import { BottomNav } from './components/BottomNav';
import { LearningProvider } from './lib/game/learning-context';

const findLanguageByCode = (code: string | undefined): Language => 
    ALL_LANGUAGES.find(lang => lang.code === code) || ALL_LANGUAGES.find(l => l.code === 'ar')!;

import { CURRENT_DATA_VERSION, defaultUserData, migrateUserData } from './utils/userData';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [isLocalMode, setIsLocalMode] = useState(false);

    const [appState, setAppState] = useState<'modeSelection' | 'onboarding' | 'languageSelection' | 'levelSelection' | 'topicSelection' | 'lessonView' | 'farm' | 'cards' | 'radio' | 'prologue'>('modeSelection');
    const [lessonMode, setLessonMode] = useState<'single' | 'multi'>('single');

    // State initialization with default, updated later by DB fetch
    const [userData, setUserData] = useState<UserData>(defaultUserData);

    // --- Immediate Review State ---
    const [showImmediateReview, setShowImmediateReview] = useState(false);
    const [immediateReviewCards, setImmediateReviewCards] = useState<SavedCard[]>([]);

    // --- Auth & Data Fetching ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const localDataStr = window.localStorage.getItem('languageAppUserData');
                let localMigrated = null;
                if (localDataStr && localDataStr !== 'undefined') {
                    try {
                        const localData = JSON.parse(localDataStr);
                        localMigrated = migrateUserData(localData);
                        setUserData(localMigrated);
                    } catch (e) {
                        console.error('Error parsing local data', e);
                    }
                }
                
                setDataLoading(false);
                
                saveBasicUserData(currentUser.uid, currentUser.email, currentUser.displayName).catch(console.error);
                fetchRemoteData(currentUser.uid, localMigrated);
            } else {
                const localDataStr = window.localStorage.getItem('languageAppUserData');
                if (localDataStr && localDataStr !== 'undefined') {
                    try {
                        const localData = JSON.parse(localDataStr);
                        const localMigrated = migrateUserData(localData);
                        setUserData(localMigrated);
                        if (localMigrated.hasCompletedSetup) {
                             setIsLocalMode(true);
                        }
                    } catch (e) {
                        console.error('Error parsing local data', e);
                    }
                }
                setDataLoading(false);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const fetchRemoteData = async (userId: string, localData: UserData | null) => {
        if (!localData) setDataLoading(true);
        try {
            const remoteData = await getUserProgress(userId);
            if (remoteData) {
                const migrated = migrateUserData(remoteData);
                setUserData(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(migrated)) {
                        saveToStorage('languageAppUserData', migrated);
                        return migrated;
                    }
                    return prev;
                });
            } else {
                if (localData) {
                    await upsertUserProgress(userId, localData);
                } else {
                    setUserData(defaultUserData);
                    saveToStorage('languageAppUserData', defaultUserData);
                    await upsertUserProgress(userId, defaultUserData);
                }
            }
        } catch (e) {
            console.error("Failed to sync data", e);
        } finally {
            if (!localData) setDataLoading(false);
        }
    };

    const initialRouteChecked = useRef(false);

    // --- PUSH TO TOPIC SELECTION IF SETUP IS COMPLETED ---
    useEffect(() => {
        if (!authLoading && !dataLoading && !initialRouteChecked.current) {
            initialRouteChecked.current = true;
            const params = new URLSearchParams(window.location.search);
            const sharedTopicId = params.get('topic');
            
            if (!sharedTopicId && userData.hasCompletedSetup && (appState === 'languageSelection' || appState === 'modeSelection')) {
                setAppState(userData.hasSeenPrologue ? 'topicSelection' : 'prologue');
            }
        }
    }, [authLoading, dataLoading, userData.hasCompletedSetup, appState]);

    // --- SHARED LESSON LOGIC ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sharedTopicId = params.get('topic');
        const sharedLang = params.get('lang');
        const sharedLevel = params.get('level');

        if (sharedTopicId && sharedLang && sharedLevel && !authLoading && !dataLoading) {
            // Find topic in constants
            const rawCurriculum = CEFR_CURRICULUM[sharedLevel as CEFRLevel];
            const allTopics = (rawCurriculum ? Object.values(rawCurriculum).flatMap((g: any) => g.topics) : TOPICS) as any[];
            const topic = allTopics.find((t: any) => t.id === sharedTopicId);
            
            if (topic) {
                // Determine day number and previous topics
                const dayIndex = allTopics.findIndex(t => t.id === sharedTopicId);
                const dayNumber = dayIndex + 1;
                const previousTopics = allTopics.slice(0, dayIndex).map(t => ({ id: t.id, title: t.title }));

                // Set User State to match shared link
                setUserData(prev => ({
                    ...prev,
                    selectedLanguageCode: sharedLang as Language['code'],
                    difficultyLevel: sharedLevel as CEFRLevel
                }));

                // Auto Start Lesson
                setSelectedTopic({ topic, dayNumber, previousTopics });
                setAppState('lessonView');
                
                // Only enable guest mode if not logged in
                if (!user) setIsLocalMode(true);
            }
        }
    }, [authLoading, dataLoading, user]);

    // --- Persistence (Debounced Save) ---
    useEffect(() => {
        // Save to local storage always
        saveToStorage('languageAppUserData', userData);

        // Save to DB if logged in and NOT in local mode
        if (user && !isLocalMode) {
            const timer = setTimeout(() => {
                upsertUserProgress(user.uid, userData);
            }, 2000); // Debounce saves by 2 seconds
            return () => clearTimeout(timer);
        }
    }, [userData, user, isLocalMode]);

    useEffect(() => {
        const checkVersionAndNotify = () => {
            if (userData.version < CURRENT_DATA_VERSION) {
                // Not really needed as we migrate on load, but kept for logic consistency
            }
        };
        const timer = setTimeout(checkVersionAndNotify, 100);
        return () => clearTimeout(timer);
    }, [userData.version]); 
    
    // View and topic state
    const [selectedTopic, setSelectedTopic] = useState<{ topic: Topic, dayNumber: number, previousTopics: Topic[], initialStage?: any } | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
    const [generateWithImages, setGenerateWithImages] = useState(false);
    const [appToastMessage, setAppToastMessage] = useState<string | null>(null);

    const importLessonInputRef = useRef<HTMLInputElement>(null);
    const importLessonsDBInputRef = useRef<HTMLInputElement>(null);

    const [showTranslator, setShowTranslator] = useState(false);
    const [showArcade, setShowArcade] = useState(false);
    const [arcadeInitialGame, setArcadeInitialGame] = useState<'none' | 'lostlanguage' | 'cafe' | 'knifehit' | 'zombie'>('none');
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showPresentation, setShowPresentation] = useState(false);

    const showAppToast = (message: string) => {
        setAppToastMessage(message);
        setTimeout(() => setAppToastMessage(null), 4000);
    };

    const handleAdminJumpStage = (stage: string) => {
        if (appState !== 'lessonView') {
            if (!selectedTopic) {
                const rawCurriculum = CEFR_CURRICULUM[userData.difficultyLevel];
                const allTopicsList = rawCurriculum ? Object.values(rawCurriculum).flatMap((g: any) => g.topics) : TOPICS;
                const firstTopicObj = allTopicsList[0] || { id: 't1', title: 'Test' };
                handleStartLesson(firstTopicObj, 1, []);
            }
            setAppState('lessonView');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('ADMIN_JUMP_STAGE', { detail: stage }));
            }, 500); // give it time to mount
        } else {
            window.dispatchEvent(new CustomEvent('ADMIN_JUMP_STAGE', { detail: stage }));
        }
        setShowAdminPanel(false);
        setShowArcade(false);
    };

    // Fullscreen logic
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }, []);

    const handleLanguageChange = useCallback((lang: Language) => {
        setUserData(data => ({ ...data, selectedLanguageCode: lang.code }));
    }, []);

    const handleDifficultyChange = useCallback((level: CEFRLevel) => {
        setUserData(data => ({ ...data, difficultyLevel: level, hasCompletedSetup: true }));
    }, []);

    const handleCacheContent = useCallback((key: string, content: string) => {
        setUserData(data => ({ ...data, cachedContent: { ...data.cachedContent, [key]: content }}));
    }, []);

    const handleClearCacheKey = useCallback((key: string) => {
        setUserData(data => {
            const newCachedContent = { ...data.cachedContent };
            delete newCachedContent[key];
            return { ...data, cachedContent: newCachedContent };
        });
    }, []);

    const handleCacheWordData = useCallback((key: string | undefined, wordData: { translation: string; native?: string }) => {
        if (!key) return;
        setUserData(data => ({ ...data, wordDataCache: { ...data.wordDataCache, [key.toLowerCase()]: wordData }}));
    }, []);

    const handleAddFlashcard = useCallback((card: Omit<Flashcard, 'id'>) => {
        setUserData(data => {
            const langCode = data.selectedLanguageCode;
            const newCard = { ...card, id: `${Date.now()}-${card.originalText}` };
            const langFlashcards = data.flashcards[langCode] || [];
            if (langFlashcards.some(c => c.originalText === newCard.originalText)) return data;
            
            // Defer farm update to avoid React \"Cannot update component while rendering\" warning
            setTimeout(() => {
                useFarmStore.getState().addSeed({
                    id: newCard.id,
                    phrase: newCard.originalText,
                    translation: newCard.translation,
                    language: langCode,
                    level: data.difficultyLevel,
                    firstLearnedAt: Date.now(),
                    lastReviewedAt: Date.now(),
                    nextReviewAt: Date.now() + 60 * 60 * 1000,
                    reviewCount: 0
                });
            }, 0);

            return {
                ...data,
                flashcards: {
                    ...data.flashcards,
                    [langCode]: [...langFlashcards, newCard],
                },
            };
        });
    }, []);

    const handleUpdateReview = useCallback((cardId: string, rating: 'again' | 'hard' | 'good' | 'easy', langCode: Language['code']) => {
        setUserData(data => {
            const currentCards = data.flashcards[langCode] || [];
            // Reward coins for reviewing
            const reward = rating === 'easy' ? 5 : rating === 'good' ? 3 : 1;
            
            // Map rating to Farm Difficulty
            const farmRatingMap: Record<string, any> = {
                'again': 'forgot',
                'hard': 'hard',
                'good': 'normal',
                'easy': 'perfect' // or easy
            };
            
            // Defer farm update to avoid React \"Cannot update component while rendering\" warning
            setTimeout(() => {
                useFarmStore.getState().reviewSeed(cardId, farmRatingMap[rating] || 'normal', 'reading');
            }, 0);

            return {
                ...data,
                coins: data.coins + reward,
                flashcards: {
                    ...data.flashcards,
                    [langCode]: currentCards.map(card => 
                        card.id === cardId 
                            ? { ...card, status: rating, nextReviewTimestamp: calculateNextReviewTimestamp(rating) } 
                            : card
                    ),
                }
            };
        });
    }, []);

    const handleStartLesson = useCallback((topic: Topic, dayNumber: number, previousTopics: Topic[], initialStage?: string) => {
        setSelectedTopic({ topic, dayNumber, previousTopics, initialStage });
        setAppState('lessonView');
    }, []);
    
    const handleCompleteLesson = useCallback((dayNumber: number) => {
        setUserData(data => {
            const isFirstTime = !data.completedLevels.includes(dayNumber);
            const reward = isFirstTime ? 50 : 10;
            
            // Sync with Village Game
            setTimeout(() => {
                const gameStore = useGameStore.getState();
                const elixirEarned = isFirstTime ? 200 : 50;
                const gemsEarned = isFirstTime ? 5 : 0;
                gameStore.completeLesson(`lesson_${dayNumber}_${Date.now()}`, reward * 5, elixirEarned, gemsEarned);
            }, 0);

            // Mark lesson as completed in cardStore
            setTimeout(() => {
                markDayCompleted(data.selectedLanguageCode, dayNumber);
            }, 0);

            // Collect cards for immediate review
            const langFlashcards = data.flashcards[data.selectedLanguageCode] || [];
            const newCards = langFlashcards
              .filter(c => c.dayNumber === dayNumber)
              .map(c => ({ 
                id: c.id, 
                native: c.originalText, 
                translation: c.translation, 
                lang: data.selectedLanguageCode, 
                day: dayNumber, 
                addedAt: Date.now(), 
                ef: 2.5, 
                interval: 0, 
                reps: 0, 
                lapses: 0, 
                due: Date.now() 
              }));
            
            if (newCards.length > 0) {
              setTimeout(() => {
                setImmediateReviewCards(newCards);
                setShowImmediateReview(true);
              }, 0);
            }

            return {
                ...data,
                coins: data.coins + reward, // Economy Reward
                completedLevels: Array.from(new Set([...data.completedLevels, dayNumber]))
            };
        });
    }, []);
    
    const handleBackToSelection = useCallback(() => {
        setSelectedTopic(null);
        setAppState('topicSelection');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }, []);

    // Economy Handlers
    const handleBuySkin = useCallback((skinId: string, price: number) => {
        setUserData(data => {
            if (data.coins >= price && !data.ownedSkins.includes(skinId)) {
                return {
                    ...data,
                    coins: data.coins - price,
                    ownedSkins: [...data.ownedSkins, skinId],
                    equippedSkin: skinId // Auto equip
                };
            }
            return data;
        });
    }, []);

    const handleEquipSkin = useCallback((skinId: string) => {
        setUserData(data => {
            if (data.ownedSkins.includes(skinId)) {
                return { ...data, equippedSkin: skinId };
            }
            return data;
        });
    }, []);

    const handleExportLesson = useCallback((topic: { topic: Topic, dayNumber: number, previousTopics: Topic[] }) => {
        const lessonContent: Record<string, string> = {};
        // Find relevant cached content for this topic
        Object.entries(userData.cachedContent).forEach(([key, content]) => {
            if (key.includes(topic.topic.id)) {
                lessonContent[key] = content;
            }
        });

        const lessonData = {
            type: 'LINGO_LESSON_SHARE_V1',
            metadata: {
                topic: topic.topic,
                dayNumber: topic.dayNumber,
                previousTopics: topic.previousTopics,
                level: userData.difficultyLevel,
                languageCode: userData.selectedLanguageCode
            },
            content: lessonContent
        };

        const blob = new Blob([JSON.stringify(lessonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson-${topic.topic.id}.lingo`;
        a.click();
        URL.revokeObjectURL(url);
        showAppToast('تم تصدير الدرس بنجاح!');
    }, [userData]);

    const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('File content is not readable text.');
                const importedData = JSON.parse(text);
                if (importedData.selectedLanguageCode) {
                    importedData.nativeLanguageCode = 'ar';
                    setUserData(migrateUserData(importedData));
                    showAppToast('تم استيراد البيانات بنجاح! سيتم تحديث التطبيق.');
                } else {
                    throw new Error('الملف غير صالح أو تالف.');
                }
            } catch (error) {
                console.error('Failed to import data:', error);
                showAppToast(`فشل استيراد البيانات: ${(error as Error).message}`);
            } finally { event.target.value = ''; }
        };
        reader.readAsText(file);
    }, []);

    const handleImportFlashcards = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        // Existing implementation
    }, []);

    const handleUploadLessonsToDB = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        setDataLoading(true);
        showAppToast('جاري رفع الدروس إلى قاعدة البيانات...');
        
        let totalSuccessCount = 0;
        const errorMessages: string[] = [];

        const importPromises = Array.from(files).map(async (file) => {
            try {
                const text = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file);
                });

                const jsonData = JSON.parse(text);
                const result = await importLessonsFromJson(jsonData);
                if (result.success) {
                    totalSuccessCount += result.count || 1;
                } else {
                    throw result.error;
                }
            } catch (error) {
                console.error(`Failed to upload lesson ${file.name}:`, error);
                errorMessages.push(`${file.name}: ${(error as Error).message}`);
            }
        });

        Promise.all(importPromises).then(() => {
            if (errorMessages.length > 0) {
                showAppToast(`تم رفع ${totalSuccessCount} دروس بنجاح.\nأخطاء:\n${errorMessages.join('\n')}`);
            } else {
                showAppToast(`تم رفع ${totalSuccessCount} دروس بنجاح إلى قاعدة البيانات!`);
            }
            setDataLoading(false);
            if (event.target) event.target.value = '';
        });
    }, []);

    const handleSignOut = async () => {
        if (!isLocalMode) {
            try {
                await signOut();
            } catch(e) { console.warn("Sign out error (ignored)", e); }
        }
        setUser(null);
        setIsLocalMode(false);
        setAppState('languageSelection');
        // Optionally reset user data or keep basic defaults
        setUserData(defaultUserData);
    };

    const handleLocalGuest = useCallback(() => {
        setIsLocalMode(true);
        // Load local data if available to avoid resetting progress
        const localDataStr = window.localStorage.getItem('languageAppUserData');
        if (localDataStr && localDataStr !== 'undefined') {
            try {
                const localData = JSON.parse(localDataStr);
                const migrated = migrateUserData(localData);
                setUserData(migrated);
                if (migrated.hasCompletedSetup) {
                    setAppState(migrated.hasSeenPrologue ? 'topicSelection' : 'prologue');
                }
            } catch (e) {
                console.error('Failed to parse local data:', e);
                setUserData(defaultUserData);
            }
        } else {
            setUserData(defaultUserData);
        }
    }, []);

    const nativeLanguage = findLanguageByCode(userData.nativeLanguageCode);
    const selectedLanguage = findLanguageByCode(userData.selectedLanguageCode);
  
    const renderContent = () => {
        if (authLoading || dataLoading) {
            return (
                <div className="flex h-screen items-center justify-center bg-white flex-col gap-4">
                    <Spinner size="h-12 w-12" />
                    <p className="text-purple-600 font-bold">جاري تحميل البيانات...</p>
                </div>
            );
        }

        // Shared lesson bypass (Guest mode auto-entry if params exist)
        if (!user && !isLocalMode && !appState.includes('lessonView') && appState !== 'onboarding' && appState !== 'modeSelection') {
             return <AuthPage onLoginSuccess={() => {}} onLocalMode={handleLocalGuest} />;
        }

        switch (appState) {
            case 'modeSelection':
                return (
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner /></div>}>
                        <ModeSelection 
                            onSelectMode={(mode) => {
                                if (mode === 'story') {
                                    setAppState('onboarding');
                                } else {
                                    setAppState('languageSelection');
                                }
                            }}
                            onSkip={() => {
                                // Default to normal path
                                setAppState('languageSelection');
                            }}
                        />
                    </Suspense>
                );
            case 'onboarding':
                return (
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner /></div>}>
                        <LearningProvider>
                            <GameShell 
                                onFinishPrologue={() => {
                                    // Once prologue finishes, default to a language/level since this prologue doesn't ask yet.
                                    // The user can change language/level in the sidebar later.
                                    setUserData(prev => ({ 
                                        ...prev, 
                                        hasCompletedSetup: true,
                                        hasSeenPrologue: true 
                                    }));
                                    setIsLocalMode(true);
                                    setAppState('topicSelection');
                                }} 
                            />
                        </LearningProvider>
                    </Suspense>
                );
            case 'languageSelection':
                return (
                    <LanguageSelector 
                        onSelectLanguage={(lang) => {
                            handleLanguageChange(lang);
                            setAppState('levelSelection');
                        }}
                    />
                );
            case 'levelSelection':
                return (
                    <LevelSelector
                        language={selectedLanguage}
                        currentLevel={userData.difficultyLevel}
                        onSelectLevel={(level) => {
                            handleDifficultyChange(level);
                            setAppState(userData.hasSeenPrologue ? 'topicSelection' : 'prologue');
                        }}
                        onBack={() => setAppState('languageSelection')}
                    />
                );
            case 'prologue':
                return (
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner /></div>}>
                        <Prologue 
                            onComplete={() => {
                                setUserData(prev => ({ ...prev, hasSeenPrologue: true }));
                                setAppState('topicSelection');
                            }} 
                            selectedLanguage={selectedLanguage}
                        />
                    </Suspense>
                );
            case 'topicSelection':
                return (
                    <TopicSelector
                        onStartLesson={handleStartLesson}
                        language={selectedLanguage}
                        onLanguageChange={handleLanguageChange}
                        difficultyLevel={userData.difficultyLevel}
                        onDifficultyChange={handleDifficultyChange}
                        completedLevels={userData.completedLevels}
                        onImportData={handleImportData}
                        onImportFlashcards={handleImportFlashcards}
                        wordDataCache={userData.wordDataCache}
                        onCacheWordData={handleCacheWordData}
                        onAddFlashcard={handleAddFlashcard}
                        generateWithImages={generateWithImages}
                        onGenerateWithImagesChange={setGenerateWithImages}
                        lessonMode={lessonMode}
                        onBackToModeSelection={() => setAppState('levelSelection')}
                        onOpenArcade={() => setShowArcade(true)}
                        onOpenFarm={() => setAppState('farm')}
                        // Pass User Info
                        user={user}
                        coins={userData.coins}
                        onSignOut={handleSignOut}
                        onCacheContent={handleCacheContent} // Pass the cache updater
                        onExportLesson={(t: Topic) => {
                            const rawCurriculum = CEFR_CURRICULUM[userData.difficultyLevel];
                            const allTopicsList = (rawCurriculum ? Object.values(rawCurriculum).flatMap((g: any) => g.topics) : TOPICS) as any[];
                            const dayIndex = allTopicsList.findIndex((x: any) => x.id === t.id);
                            if (dayIndex > -1) {
                                const dayNumber = dayIndex + 1;
                                const previousTopics = allTopicsList.slice(0, dayIndex).map(x => ({ id: x.id, title: x.title }));
                                handleExportLesson({ topic: t, dayNumber, previousTopics });
                            }
                        }}
                    />
                );
            case 'farm':
                return (
                    <div className="w-full h-full bg-white flex flex-col relative md:pb-0">
                        <FarmView 
                            onStartArcade={(gameId: 'knifehit' | 'zombie' | 'lostlanguage') => {
                                setArcadeInitialGame(gameId);
                                setShowArcade(true);
                            }}
                            onClose={() => setAppState('topicSelection')}
                        />
                    </div>
                );
            case 'cards':
                return (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center relative pb-20 md:pb-0">
                        <div className="text-center text-slate-500 flex flex-col items-center">
                            <span className="text-6xl mb-4">🎴</span>
                            <h2 className="text-xl font-bold text-slate-800">البطاقات</h2>
                            <p className="mt-2 text-sm max-w-xs">قريباً.. ستتمكن هنا من مراجعة البطاقات التي جمعتها</p>
                        </div>
                    </div>
                );
            case 'radio':
                return (
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Spinner /></div>}>
                        <GlobalRadioScreen 
                            language={selectedLanguage}
                            nativeLanguage={nativeLanguage}
                            level={userData.difficultyLevel}
                            onBack={() => setAppState('topicSelection')}
                        />
                    </Suspense>
                );
            case 'lessonView':
                if (selectedTopic) {
                    // Show immediate review if available
                    if (showImmediateReview && immediateReviewCards.length > 0) {
                        return (
                            <ReviewSession
                                cards={immediateReviewCards}
                                onDone={() => {
                                    setShowImmediateReview(false);
                                    markImmediateReviewDone(userData.selectedLanguageCode, selectedTopic.dayNumber);
                                    showAppToast('تمت المراجعة بنجاح!');
                                }}
                                title="المراجعة الفورية"
                                subtitle="قيّم بطاقاتك بعد الدرس"
                            />
                        );
                    }
                    return (
                        <div className="w-full h-full bg-transparent flex flex-col">
                            <LessonView
                                mode={lessonMode}
                                nativeLanguage={nativeLanguage}
                                language={selectedLanguage}
                                topic={selectedTopic.topic}
                                dayNumber={selectedTopic.dayNumber}
                                initialStage={selectedTopic.initialStage}
                                previousTopics={selectedTopic.previousTopics}
                                level={userData.difficultyLevel}
                                onBack={handleBackToSelection}
                                cachedContent={userData.cachedContent}
                                onCacheContent={handleCacheContent}
                                onClearCacheKey={handleClearCacheKey}
                                wordDataCache={userData.wordDataCache}
                                onCacheWordData={handleCacheWordData}
                                flashcards={userData.flashcards}
                                onAddFlashcard={handleAddFlashcard}
                                onUpdateReview={handleUpdateReview}
                                onCompleteLesson={handleCompleteLesson}
                                onImportFlashcards={handleImportFlashcards}
                                generateWithImages={generateWithImages}
                                isLocalMode={isLocalMode}
                            />
                        </div>
                    );
                }
                return null;
            default:
                return null;
        }
    };

    const currentTargetLanguageCode = appState === 'lessonView' ? userData.selectedLanguageCode : 'guide';

    return (
        <CreatorProvider>
            <YukiProvider 
                coins={userData.coins}
                ownedSkins={userData.ownedSkins}
                equippedSkinId={userData.equippedSkin}
                onBuySkin={handleBuySkin}
                onEquipSkin={handleEquipSkin}
                targetLanguageCode={currentTargetLanguageCode}
            >
                <AssistantProvider>
                    <div 
                        className="h-[100dvh] w-screen overflow-hidden font-brand bg-transparent"
                        dir="rtl"
                    >
                        {/* Skip Link for Accessibility */}
                        <a href="#main-content" className="skip-link">
                            تخطي للمحتوى الرئيسي
                        </a>
                        
                        <YukiGlobalView />
                        
                        <input 
                            type="file" 
                            ref={importLessonInputRef} 
                            style={{ display: 'none' }} 
                            accept=".json,.lingo" 
                            onChange={handleImportData} 
                        />
                        <input 
                            type="file" 
                            ref={importLessonsDBInputRef} 
                            style={{ display: 'none' }} 
                            multiple 
                            accept=".json" 
                            onChange={handleUploadLessonsToDB} 
                        />
                        
                        {(user || isLocalMode) && (
                            <Suspense fallback={null}>
                                <Sidebar 
                                    onSignOut={handleSignOut} 
                                    coins={userData.coins} 
                                    onImportLesson={() => importLessonInputRef.current?.click()}
                                    onUploadLesson={() => importLessonsDBInputRef.current?.click()}
                                    onExportLesson={() => selectedTopic && handleExportLesson(selectedTopic)}
                                    onOpenTranslator={() => setShowTranslator(true)}
                                    onChangeLanguage={() => setAppState('languageSelection')}
                                    onChangeLevel={() => setAppState('levelSelection')}
                                    onOpenFarm={() => setAppState('farm')}
                                />
                            </Suspense>
                        )}
                        
                        {appToastMessage && (
                            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-purple-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-pre-wrap text-center max-w-md transition-opacity duration-300">
                                {appToastMessage}
                            </div>
                        )}

                        {showTranslator && (
                            <Suspense fallback={null}>
                                <QuickTranslatorModal language={selectedLanguage} onClose={() => setShowTranslator(false)} />
                            </Suspense>
                        )}

                        <Suspense fallback={null}>
                            <FarmNotifications onOpenFarm={() => setAppState('farm')} />
                        </Suspense>

                        <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="h-12 w-12" /></div>}>
                            <ErrorBoundary onSkip={() => setAppState(userData.hasCompletedSetup ? 'topicSelection' : 'languageSelection')}>
                                <main id="main-content" className="w-full h-full">
                                    {renderContent()}
                                </main>
                            </ErrorBoundary>
                        </Suspense>
                        
                        {/* Fullscreen Button removed */}

                        {showArcade && (
                          <div className="fixed inset-0 z-[100]">
                            <ArcadeScreen
                              initialGame={arcadeInitialGame}
                              currentDayNumber={userData.completedLevels.length > 0 ? Math.max(...userData.completedLevels) + 1 : 1}
                              flashcards={userData.flashcards[selectedLanguage.code] || []}
                              language={selectedLanguage}
                              nativeLanguage={nativeLanguage}
                              onCompleteLesson={handleCompleteLesson}
                              onUpdateFlashcard={(id, status) => {
                                if (status !== 'new') {
                                    handleUpdateReview(id, status as 'again' | 'hard' | 'good' | 'easy', selectedLanguage.code);
                                }
                              }}
                              onClose={() => setShowArcade(false)}
                            />
                          </div>
                        )}

                        {showPresentation && (
                            <Suspense fallback={<div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center text-white"><Spinner size="w-12 h-12" /></div>}>
                                <PresentationMode onClose={() => setShowPresentation(false)} />
                            </Suspense>
                        )}

                        {/* Admin Panel */}
                        <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
                            <button
                                onClick={() => setShowAdminPanel(!showAdminPanel)}
                                className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg opacity-50 hover:opacity-100 transition-opacity"
                            >
                                {showAdminPanel ? "إغلاق لوحة التحكم" : "Admin Tools"}
                            </button>
                            {showAdminPanel && (
                                <div className="bg-black/95 text-white rounded-xl p-3 flex flex-col gap-2 shadow-2xl backdrop-blur-sm border border-emerald-700 w-48 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-in slide-in-from-top-2">
                                    <div className="text-[10px] uppercase text-emerald-400 mb-1 border-b border-gray-700 pb-1 font-bold text-center">أدوات الإدارة (Admin)</div>
                                    <button onClick={() => { setAppState('languageSelection'); setShowAdminPanel(false); }} className="text-sm bg-gray-800 hover:bg-gray-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>اختيار اللغة</span> <span>🌍</span></button>
                                    <button onClick={() => { setAppState('levelSelection'); setShowAdminPanel(false); }} className="text-sm bg-gray-800 hover:bg-gray-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>المستوى</span> <span>📊</span></button>
                                    <button onClick={() => { setAppState('topicSelection'); setShowAdminPanel(false); setShowArcade(false); }} className="text-sm bg-gray-800 hover:bg-gray-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>الخريطة</span> <span>🗺️</span></button>
                                    <button onClick={() => { setAppState('farm'); setShowAdminPanel(false); setShowArcade(false); }} className="text-sm bg-gray-800 hover:bg-gray-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>المزرعة</span> <span>🌱</span></button>
                                    <button onClick={() => { setShowArcade(true); setShowAdminPanel(false); }} className="text-sm bg-purple-900 border border-purple-500 hover:bg-purple-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>الأركيد</span> <span>🕹️</span></button>
                                    
                                    <div className="text-[10px] uppercase text-emerald-400 mt-2 mb-1 border-b border-gray-700 pb-1 font-bold text-center">مراحل الدرس</div>
                                    <button onClick={() => handleAdminJumpStage('story')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>القراءة</span> <span>📖</span></button>
                                    <button onClick={() => handleAdminJumpStage('listening')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>الاستماع</span> <span>🎧</span></button>
                                    <button onClick={() => handleAdminJumpStage('memory_knife')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>لعبة السكاكين (حفظ)</span> <span>🔪</span></button>
                                    <button onClick={() => handleAdminJumpStage('memory_zombie')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>لعبة الزومبي (حفظ)</span> <span>🧟</span></button>
                                    <button onClick={() => handleAdminJumpStage('memory_context')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>تغيير السياق (حفظ)</span> <span>🎭</span></button>
                                    <button onClick={() => handleAdminJumpStage('review')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>المراجعة</span> <span>📝</span></button>
                                    <button onClick={() => handleAdminJumpStage('textChat')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>الممارسة (كتابة)</span> <span>⌨️</span></button>
                                    <button onClick={() => handleAdminJumpStage('practice')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>التطبيق (Live API)</span> <span>🎙️</span></button>
                                    <button onClick={() => handleAdminJumpStage('chat')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>محادثة (Live API)</span> <span>💬</span></button>
                                    <button onClick={() => handleAdminJumpStage('cafe')} className="text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>الكافيه</span> <span>☕</span></button>
                                    <button onClick={() => handleAdminJumpStage('radio')} className="text-xs bg-pink-900 border border-pink-600 hover:bg-pink-700 p-1.5 rounded text-right font-bold flex justify-between items-center transition-colors"><span>راديو AI 📻</span> <span>🎙️</span></button>
                                </div>
                            )}
                        </div>

                        {(user || isLocalMode) && ['topicSelection', 'cards', 'radio'].includes(appState) && !showArcade && (
                            <BottomNav
                                currentTab={appState === 'topicSelection' ? 'map' : appState}
                                onTabChange={(tab) => {
                                    if (tab === 'play') {
                                        setShowArcade(true);
                                    } else {
                                        setShowArcade(false);
                                        setAppState(tab === 'map' ? 'topicSelection' : tab as any);
                                    }
                                }}
                            />
                        )}
                    </div>
                </AssistantProvider>
            </YukiProvider>
        </CreatorProvider>
    );
}
