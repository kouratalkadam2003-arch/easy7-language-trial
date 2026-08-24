
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import {
    Language, Topic, LessonStage, GameTurn, Flashcard, WordData,
    FlashcardStatus, StoryContentType,
    GameContentType, MemoryContentType, ReviewContentType, TextChatContentType, RadioContentType, RadioTurn, LessonExportData, AssistantContextData, MemoryDrillItem, ShareableLessonData
} from '../types';
import { generateContentWithRetry, getErrorMessage, cleanTextFromScriptLabels } from '../services/ai';
import {
    CREATOR_PERSONA, TEXT_READING_SYSTEM_PROMPT_TEMPLATE, MEMORY_DRILL_PROMPT_TEMPLATE,
    REVIEW_CARD_CREATION_PROMPT_TEMPLATE,
    MESSENGER_CHAT_PROMPT_TEMPLATE, STORY_SCHEMA, MEMORY_DRILL_SCHEMA, REVIEW_SCHEMA, TEXT_CHAT_SCHEMA, RADIO_SCHEMA, AI_RADIO_PROMPT_TEMPLATE, TARGET_LANGUAGES, getDynamicJpChRule, TEACHER_PERSONAS, FIXED_CHARACTERS, TEXT_MODEL
} from '../constants';
import { cleanAndParseJson } from '../utils/json';
import Spinner from './Spinner';
import { CinematicIntro } from './CinematicIntro';
import { DownloadIcon, RefreshIcon, ShareIcon, FriendsIcon, ChevronRightIcon } from './icons';
import {
    generateSingleLanguageLessonPDF,
    generateSingleLanguageLessonHTML,
    prepareAllCanvasesForExport,
} from '../utils/exportLesson';
import { exportSingleLanguageLessonAsZip } from '../utils/zipExport';
import RegenerateButton from './RegenerateButton';
import { useAssistantContext } from '../contexts/AssistantContext';
import { useYuki } from './YukiGlobal';
import { QuickTranslatorModal } from './QuickTranslatorModal';
import { saveLessonToFirebase, getLessonFromFirebase } from '../services/firebase';
import { useCreator } from '../contexts/CreatorContext';
import VoiceSelector from './VoiceSelector';
import { GlobalAudioProvider, useGlobalAudio } from './GlobalAudioContext';
import GlobalAudioPlayer from './GlobalAudioPlayer';
import StageTransition from './StageTransition';
import MissionCover from './MissionCover';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Lazy load stages for faster initial render
const VoiceChatStage = lazy(() => import('./VoiceChatStage'));
const CardDeckView = lazy(() => import('./CardDeckView'));
const ChatModeModal = lazy(() => import('./VoiceModeModal'));
const TextChatStage = lazy(() => import('./TextChatStage'));
const StoryStage = lazy(() => import('./StoryStage'));
const MemoryStage = lazy(() => import('./MemoryStage'));
const ReviewStage = lazy(() => import('./ReviewStage'));
const LingoCafeStage = lazy(() => import('./LingoCafeStage'));
const RadioStage = lazy(() => import('./RadioStage'));


declare const saveAs: any;

export interface LessonViewProps {
    nativeLanguage: Language;
    language: Language;
    topic: Topic;
    previousTopics: Topic[];
    dayNumber: number;
    level: string;
    onBack: () => void;
    cachedContent: Record<string, string>;
    onCacheContent: (key: string, content: string) => void;
    onClearCacheKey: (key: string) => void;
    wordDataCache: Record<string, WordData>;
    onCacheWordData: (key: string, data: WordData) => void;
    flashcards: Partial<Record<Language['code'], Flashcard[]>>;
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    onUpdateReview: (cardId: string, rating: FlashcardStatus, langCode: Language['code']) => void;
    onCompleteLesson: (dayNumber: number) => void;
    onImportFlashcards: (event: React.ChangeEvent<HTMLInputElement>) => void;
    generateWithImages: boolean;
    mode: 'single' | 'multi';
    isLocalMode?: boolean;
    initialStage?: LessonStage | 'textChat';
}

const UI_TEXTS_AR = {
    back: "العودة",
    lessonComplete: "إنهاء",
    generating: "جاري تحضير الدرس...",
    error: "حدث خطأ أثناء إنشاء المحتوى. حاول مرة أخرى.",
    startReview: "بدء المراجعة",
    hardQuotaError: "فشل إنشاء الصور بسبب تجاوز الحصة. يرجى مراجعة خطتك وتفاصيل الفوترة في Google AI Studio.",
    genericImageError: "فشل إنشاء الصورة",
    downloadPdfSingle: "PDF",
    downloadZipSingle: "صور (ZIP)",
    downloadHtmlSingle: "HTML",
    downloading: "جاري التجميع...",
    preparingExports: "جاري تحضير ملفات التصدير...",
    regenerateStage: "إعادة إنشاء المرحلة",
    startYuki: "📣 تفعيل",
    share: "رابط",
    shareFile: "مشاركة الدرس",
    shareSuccess: "تم نسخ الرابط!",
    chingoBtn: "✨ تشينغو"
};

type GenStatus = 'idle' | 'loading' | 'done' | 'error';
type ContentStage = 'story' | 'memory' | 'review' | 'textChat' | 'radio';

// STAGES ORDER: 
const STAGES: { id: LessonStage | 'textChat' | 'review', name: string }[] = [
    { id: 'story', name: 'المهمة 1: في السوق (استماع)' },
    { id: 'review', name: 'المهمة 2: يوميات إيلي (قراءة)' },
    { id: 'memory', name: 'المهمة 3: الاحتطاب ومقاتلة الوحوش (حفظ)' },
    { id: 'textChat', name: 'المهمة 4: المراسلة (كتابة)' },
    { id: 'chat', name: 'المهمة 5: الممارسة الصوتية (محادثة AI)' },
    { id: 'radio', name: 'المهمة 6: محطة الوادي (استماع)' },
];

const useLessonPipeline = (
    nativeLang: Language,
    targetLang: Language, 
    dayNumber: number,
    level: string,
    topic: Topic,
    previousTopics: Topic[],
    cachedContent: Record<string, string>,
    onCacheContent: (key: string, content: string) => void,
    onClearCacheKey: (key: string) => void,
    isLocalMode?: boolean,
) => {
    const { myCreatorId, viewingCreatorId } = useCreator();
    const activeCreatorId = viewingCreatorId || myCreatorId;

    // Helper to generate key
    const getKey = (stage: ContentStage) => `lesson-${dayNumber}-${nativeLang.code}-${targetLang.code}-${level}-${stage}-v10-optimized-${activeCreatorId}`;

    // Helper to init state from cache (Synchronous)
    const initFromCache = <T,>(stage: ContentStage): T | null => {
        const key = getKey(stage);
        return cachedContent[key] ? JSON.parse(cachedContent[key]) : null;
    };

    const [storyContent, setStoryContent] = useState<StoryContentType | null>(() => initFromCache('story'));
    const [memoryContent, setMemoryContent] = useState<MemoryContentType | null>(() => initFromCache('memory'));
    const [reviewContent, setReviewContent] = useState<ReviewContentType | null>(() => initFromCache('review'));
    const [textChatContent, setTextChatContent] = useState<TextChatContentType | null>(() => initFromCache('textChat'));
    const [radioContent, setRadioContent] = useState<RadioContentType | null>(() => initFromCache('radio'));

    const [generationStatus, setGenerationStatus] = useState<Record<ContentStage, GenStatus>>({
        story: initFromCache('story') ? 'done' : 'idle',
        memory: initFromCache('memory') ? 'done' : 'idle',
        review: initFromCache('review') ? 'done' : 'idle',
        textChat: initFromCache('textChat') ? 'done' : 'idle',
        radio: initFromCache('radio') ? 'done' : 'idle',
    });
    
    // Track active requests to avoid double-firing
    const activeRequests = useRef<Set<ContentStage>>(new Set());
    
    // State to track if we're checking the remote database first
    const [isCheckingRemote, setIsCheckingRemote] = useState<boolean>(true);

    // --- FIREBASE INTEGRATION: Load on Mount ---
    useEffect(() => {
        let mounted = true;
        const loadFromFirebase = async () => {
            setIsCheckingRemote(true);
            const data = await getLessonFromFirebase(targetLang.code, level, dayNumber);
            if (!mounted) return;
            
            if (data) {
                if (data.story) {
                    setStoryContent(data.story);
                    onCacheContent(getKey('story'), JSON.stringify(data.story));
                }
                if (data.memory) {
                    setMemoryContent(data.memory);
                    onCacheContent(getKey('memory'), JSON.stringify(data.memory));
                }
                if (data.review) {
                    setReviewContent(data.review);
                    onCacheContent(getKey('review'), JSON.stringify(data.review));
                }
                if (data.textChat) {
                    setTextChatContent(data.textChat);
                    onCacheContent(getKey('textChat'), JSON.stringify(data.textChat));
                }
                if (data.radio) {
                    setRadioContent(data.radio);
                    onCacheContent(getKey('radio'), JSON.stringify(data.radio));
                }
                
                setGenerationStatus({
                    story: 'done',
                    memory: 'done',
                    review: 'done',
                    textChat: 'done',
                    radio: 'done'
                });
            }
            // Once checked, allow generation if still needed
            setIsCheckingRemote(false);
        };
        loadFromFirebase();
        return () => { mounted = false; };
    }, [targetLang.code, dayNumber]); // Reload when lesson changes

    const generateStageContent = useCallback(async (stage: ContentStage, force = false) => {
        if (activeRequests.current.has(stage)) return;
        if (!force && generationStatus[stage] === 'done') return;
        
        // Dependency check: All other stages need story first
        if (stage !== 'story' && !storyContent) return;

        activeRequests.current.add(stage);
        setGenerationStatus(prev => ({ ...prev, [stage]: 'loading' }));

        try {
            const cacheKey = getKey(stage);
            let textData;

            // --- API CALL ---
            const jpChRule = getDynamicJpChRule(targetLang.code);
            const fixedChars = FIXED_CHARACTERS[targetLang.code];
            const currentStory = storyContent; 

            // Limit context to last 3 topics to speed up generation
            const limitedPreviousTopics = previousTopics.slice(-3);
            
            const storySoFarContext = limitedPreviousTopics.map((t, i) => `Lesson ${i+1}: ${t?.title || ''}`).join('; ');

            let promptTemplate = "";
            let schema = {};

            if (stage === 'story') {
                promptTemplate = TEXT_READING_SYSTEM_PROMPT_TEMPLATE
                    .replace(/{PROFICIENCY_LEVEL}/g, level)
                    .replace(/{LESSON_NUMBER}/g, String(dayNumber))
                    .replace(/{TOPIC_TITLE}/g, topic?.title || '')
                    .replace(/{STORY_SO_FAR_CONTEXT}/g, storySoFarContext);
                schema = STORY_SCHEMA;
            } else if (stage === 'memory') {
                promptTemplate = MEMORY_DRILL_PROMPT_TEMPLATE
                    .replace(/{STORY_TEXT}/g, currentStory?.originalText || '')
                    .replace(/{NATIVE_STORY_TEXT}/g, currentStory?.nativeScriptText || '')
                    .replace(/{TRANSLATED_STORY_TEXT}/g, currentStory?.translatedText || '');
                schema = MEMORY_DRILL_SCHEMA;
            } else if (stage === 'review') {
                promptTemplate = REVIEW_CARD_CREATION_PROMPT_TEMPLATE
                    .replace(/{STORY_TEXT}/g, currentStory?.originalText || '')
                    .replace(/{NATIVE_STORY_TEXT}/g, currentStory?.nativeScriptText || '')
                    .replace(/{TRANSLATED_STORY_TEXT}/g, currentStory?.translatedText || '');
                schema = REVIEW_SCHEMA;
            } else if (stage === 'textChat') {
                const hardVocabContext = '';

                promptTemplate = MESSENGER_CHAT_PROMPT_TEMPLATE
                    .replace(/{PROFICIENCY_LEVEL}/g, level)
                    .replace(/{SCENARIO_DESCRIPTION}/g, `Conversation about: "${topic?.title || ''}". Context: ${currentStory?.originalText.substring(0, 100)}...`)
                    .replace(/{HARD_VOCABULARY_CONTEXT}/g, hardVocabContext);
                schema = TEXT_CHAT_SCHEMA;
            } else if (stage === 'radio') {
                promptTemplate = AI_RADIO_PROMPT_TEMPLATE
                    .replace(/{STORY_TEXT}/g, currentStory?.originalText || '')
                    .replace(/{TOPIC_TITLE}/g, topic?.title || '')
                    .replace(/{PROFICIENCY_LEVEL}/g, level);
                schema = RADIO_SCHEMA;
            }

            const systemInstruction = CREATOR_PERSONA
                .replace(/{NATIVE_LANGUAGE_NAME}/g, nativeLang.englishName)
                .replace(/{TARGET_LANGUAGE_NAME}/g, targetLang.englishName)
                .replace(/{PROFICIENCY_LEVEL}/g, level);

            const finalPrompt = promptTemplate
                .replace(/{NATIVE_LANGUAGE_NAME}/g, nativeLang.englishName)
                .replace(/{TARGET_LANGUAGE_NAME}/g, targetLang.englishName)
                .replace(/{CHAR_A_NAME}/g, fixedChars?.A.name || "A")
                .replace(/{CHAR_B_NAME}/g, fixedChars?.B.name || "B")
                .replace(/{JP_CH_RULE_PLACEHOLDER}/g, jpChRule);

            // --- API CALL ---
            const response = await generateContentWithRetry({
                model: TEXT_MODEL,
                contents: finalPrompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });

            textData = cleanAndParseJson(response.text);

            // Post-processing
            if (stage === 'story') {
                if (textData.originalText) textData.originalText = cleanTextFromScriptLabels(textData.originalText);
                if (textData.translatedText) textData.translatedText = cleanTextFromScriptLabels(textData.translatedText);
                if (!textData.basicVocabulary && textData.wordList) {
                    textData.basicVocabulary = textData.wordList.map((w: any) => ({ word: w.word, translation: w.translation }));
                }
            }

            // Update Cache & State
            onCacheContent(cacheKey, JSON.stringify(textData));
            
            // --- FIREBASE SAVE ---
            saveLessonToFirebase(targetLang.code, level, dayNumber, stage, textData);

            if (stage === 'story') setStoryContent(textData);
            else if (stage === 'memory') setMemoryContent(textData);
            else if (stage === 'review') setReviewContent(textData);
            else if (stage === 'textChat') setTextChatContent(textData);
            else if (stage === 'radio') setRadioContent(textData);

            setGenerationStatus(prev => ({ ...prev, [stage]: 'done' }));

        } catch (e) {
            console.error(`Generation failed for ${stage}:`, e);
            setGenerationStatus(prev => ({ ...prev, [stage]: 'error' }));
        } finally {
            activeRequests.current.delete(stage);
        }
    }, [nativeLang, targetLang, dayNumber, level, topic, previousTopics, onCacheContent, storyContent, generationStatus]);

    // Initial Trigger
    useEffect(() => {
        if (!isCheckingRemote && generationStatus.story === 'idle') {
            generateStageContent('story');
        }
    }, [isCheckingRemote, generationStatus.story, generateStageContent]);

    // Dependent Triggers
    useEffect(() => {
        if (!isCheckingRemote && generationStatus.story === 'done' && storyContent) {
            if (generationStatus.memory === 'idle') generateStageContent('memory');
            if (generationStatus.review === 'idle') generateStageContent('review');
            if (generationStatus.textChat === 'idle') generateStageContent('textChat');
            if (generationStatus.radio === 'idle') generateStageContent('radio');
        }
    }, [isCheckingRemote, generationStatus, storyContent, generateStageContent]);

    const regenerateStage = useCallback((stage: ContentStage) => {
        const key = getKey(stage);
        onClearCacheKey(key);
        setGenerationStatus(prev => ({ ...prev, [stage]: 'idle' })); 
        setTimeout(() => generateStageContent(stage, true), 0);
    }, [onClearCacheKey, generateStageContent, getKey]);

    return {
        storyContent, memoryContent, reviewContent, textChatContent, radioContent,
        generationStatus, generateStageContent, regenerateStage, isCheckingRemote
    };
};

const LessonViewContainer: React.FC<LessonViewProps> = (props) => {
    const { setContext } = useAssistantContext();
    const lessonData = useLessonPipeline(
        props.nativeLanguage, props.language, props.dayNumber, props.level, props.topic, props.previousTopics, props.cachedContent, props.onCacheContent, props.onClearCacheKey, props.isLocalMode
    );

    useEffect(() => {
        const { storyContent } = lessonData;
        const allStagesGenerated = Object.values(lessonData.generationStatus).every(s => s === 'done');
        
        if (allStagesGenerated && storyContent) {
            const contextData: AssistantContextData = {
                language: props.language,
                nativeLanguage: props.nativeLanguage,
                topic: props.topic,
                dayNumber: props.dayNumber,
                level: props.level,
                story: storyContent,
            };
            setContext(contextData);
        }
        
        return () => {
            setContext(null);
        };
    }, [lessonData.generationStatus, lessonData.storyContent, props, setContext]);

    return <SingleLanguageLessonView {...props} lessonData={lessonData} />;
};

const MultiLanguageLessonView: React.FC<LessonViewProps> = (props) => {
    const [currentLangCode, setCurrentLangCode] = useState<Language['code']>(props.language.code);
    const currentLanguage = TARGET_LANGUAGES.find(l => l.code === currentLangCode) || props.language;

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="bg-white/80 backdrop-blur-md border-b-2 border-purple-100/50 p-1.5 shadow-sm z-20">
                <div className="flex flex-wrap justify-center gap-1.5 w-full">
                    {TARGET_LANGUAGES.map(lang => {
                        const isActive = currentLangCode === lang.code;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => setCurrentLangCode(lang.code)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all duration-200
                                    ${isActive 
                                        ? 'bg-purple-600 border-purple-600 text-white shadow-md transform scale-105' 
                                        : 'bg-white border-purple-100 text-purple-600 hover:border-purple-300 hover:bg-purple-50'
                                    }
                                `}
                            >
                                <span className="text-lg leading-none">{lang.flag}</span>
                                <span className={`text-xs font-bold uppercase ${isActive ? 'text-white' : 'text-purple-600'}`}>
                                    <span className="sm:hidden">{lang.code}</span>
                                    <span className="hidden sm:inline">{lang.name}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                <LessonViewContainer {...props} language={currentLanguage} key={currentLangCode} />
            </div>
        </div>
    );
};

const SingleLanguageLessonView: React.FC<LessonViewProps & { lessonData: ReturnType<typeof useLessonPipeline> }> = (props) => {
    const { topic, dayNumber, level, onBack, onCompleteLesson, flashcards, lessonData, language, nativeLanguage, previousTopics } = props;
    const langFlashcards = flashcards[language.code] || [];
    const { setLessonContext } = useYuki();

    const [memoryState, setMemoryState] = useState<{drillIndex: number, step: 0 | 1 | 2}>({
        drillIndex: 0,
        step: 0
    });

    // Filter cards specifically for this day for export purposes
    const currentDayFlashcards = useMemo(() => {
        return langFlashcards.filter(card => card.dayNumber === dayNumber);
    }, [langFlashcards, dayNumber]);

    const teacher = TEACHER_PERSONAS[language.code] || TEACHER_PERSONAS.ar;
    const [currentStage, setCurrentStage] = useState<LessonStage | 'textChat' | 'cafe' | 'snowball'>(props.initialStage || 'story'); // Default to Story
    const [showCover, setShowCover] = useState(true);
    const [showIntro, setShowIntro] = useState(true);
    const [transitionState, setTransitionState] = useState<{from: string, to: string | 'lesson_complete'} | null>(null);
    const [shareCopied, setShareCopied] = useState(false);

    // CRITICAL FIX: Ensure dayNumber is added to cards created in this lesson context
    const handleAddLessonFlashcard = useCallback((card: Omit<Flashcard, 'id'>) => {
        props.onAddFlashcard({ ...card, dayNumber: dayNumber });
    }, [props.onAddFlashcard, dayNumber]);

    const handleShareLesson = () => {
        const url = new URL(window.location.origin);
        url.searchParams.set('topic', topic.id);
        url.searchParams.set('lang', language.code);
        url.searchParams.set('level', level);
        
        navigator.clipboard.writeText(url.toString()).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 3000);
        });
    };

    const handleFileShare = () => {
        const { storyContent, memoryContent, reviewContent, textChatContent, radioContent } = lessonData;
        if (!storyContent) {
            showLessonToast('الدرس غير جاهز للمشاركة بعد. يرجى الانتظار حتى يتم إنشاء المحتوى.');
            return;
        }

        const cacheContent: Record<string, string> = {};
        const getKey = (stage: ContentStage) => `lesson-${dayNumber}-${nativeLanguage.code}-${language.code}-${level}-${stage}-v10-optimized`;
        
        if (storyContent) cacheContent[getKey('story')] = JSON.stringify(storyContent);
        if (memoryContent) cacheContent[getKey('memory')] = JSON.stringify(memoryContent);
        if (reviewContent) cacheContent[getKey('review')] = JSON.stringify(reviewContent);
        if (textChatContent) cacheContent[getKey('textChat')] = JSON.stringify(textChatContent);
        if (radioContent) cacheContent[getKey('radio')] = JSON.stringify(radioContent);

        const shareData: ShareableLessonData = {
            type: 'LINGO_LESSON_SHARE_V1',
            metadata: {
                topic,
                dayNumber,
                level,
                languageCode: language.code,
                previousTopics,
                createdAt: Date.now()
            },
            content: cacheContent
        };

        const blob = new Blob([JSON.stringify(shareData)], { type: 'application/json' });
        saveAs(blob, `Lingo_Lesson_${dayNumber}_${(topic?.title || '').replace(/\s+/g, '_')}.lingo`);
    };

    useEffect(() => {
        if (lessonData.reviewContent?.flashcards) {
            lessonData.reviewContent.flashcards.forEach(card => {
                handleAddLessonFlashcard({
                    originalText: card.original,
                    translation: card.translation,
                    nativeText: card.native,
                    speechRate: 1,
                    nextReviewTimestamp: Date.now(),
                    status: 'new',
                });
            });
        }
    }, [lessonData.reviewContent, handleAddLessonFlashcard]);

    useEffect(() => {
        let contextText = `User is learning ${language.englishName}. Topic: ${topic?.title || ''}. Current Stage: ${currentStage}. `;
        if (currentStage === 'story' && lessonData.storyContent) {
            contextText += `\nStory Text: "${lessonData.storyContent.originalText}"`;
        } else if (currentStage === 'listening' && lessonData.storyContent) {
            contextText += `\nListening to story audio.`;
        } else if (currentStage === 'deck') {
            contextText += `\nReviewing Anki Cards.`;
        } else if (currentStage === 'cafe') {
            contextText += `\nIn the LingoCafe, practicing free conversation.`;
        } else if (currentStage === 'snowball') {
            contextText += `\nPlaying Snowball sentence building game.`;
        }
        setLessonContext(contextText);
    }, [currentStage, lessonData.storyContent, language, topic, setLessonContext]);

    const [startDeckInReviewMode, setStartDeckInReviewMode] = useState(false);
    const [lessonToastMessage, setLessonToastMessage] = useState<string | null>(null);

    const [chatConfig, setChatConfig] = useState<{
        chat: { type: 'text' | 'voice', gender?: 'male' | 'female' },
        practice: { type: 'text' | 'voice', gender?: 'male' | 'female' }
    }>({ chat: { type: 'text' }, practice: { type: 'voice', gender: 'male' } });

    const showLessonToast = (message: string) => {
        setLessonToastMessage(message);
        setTimeout(() => setLessonToastMessage(null), 4000);
    };
    const [selectedVoiceGender, setSelectedVoiceGender] = useState<'male' | 'female'>('male');
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    const isFullScreenStage = currentStage === 'story' || currentStage === 'listening' || currentStage === 'memory' || currentStage === 'snowball' || currentStage === 'chat' || currentStage === 'textChat' || currentStage === 'practice' || currentStage === 'deck' || currentStage === 'radio';
    const isLastStage = STAGES.findIndex(s => s.id === currentStage) === STAGES.length - 1;

    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreparingExport, setIsPreparingExport] = useState(false);
    const [preparedCanvases, setPreparedCanvases] = useState<Record<string, HTMLCanvasElement> | null>(null);
    const [progressMessage, setProgressMessage] = useState('');
    const [showTranslator, setShowTranslator] = useState(false);

    const { setOnCharacterClick, toggleLiveSession, isLive } = useYuki();

    // Removed setOnCharacterClick override so Live API Yuki works natively!

    const handleTabClick = (stage: LessonStage | 'textChat' | 'cafe' | 'snowball') => {
        if (stage === 'deck' && startDeckInReviewMode) setStartDeckInReviewMode(false);
        setCurrentStage(stage);
        setShowCover(true);
        setShowIntro(true);
    };

    const handleNextStage = useCallback(() => {
        const currentIndex = STAGES.findIndex(s => s.id === currentStage);
        const stageName = STAGES[currentIndex]?.name || currentStage;
        setTransitionState({ from: stageName, to: 'map' });
    }, [currentStage]);

    const handleProceedFromTransition = useCallback(() => {
        if (transitionState?.to === 'lesson_complete') {
            onCompleteLesson(dayNumber);
            onBack();
        } else if (transitionState?.to === 'map') {
            // Save sub-stage progress
            const key = `lesson_progress_${dayNumber}`;
            let progress = [];
            try {
                const stored = localStorage.getItem(key);
                if (stored) progress = JSON.parse(stored);
            } catch(e) {}
            if (!progress.includes(currentStage)) {
                progress.push(currentStage);
                localStorage.setItem(key, JSON.stringify(progress));
            }
            // Check if all 4 main stages (story, memory, chat, review) are done
            const requiredStages = ['story', 'memory', 'chat', 'review'];
            const allDone = requiredStages.every(s => progress.includes(s));
            if (allDone) {
                onCompleteLesson(dayNumber);
            }
            onBack();
        } else if (transitionState?.to) {
            setCurrentStage(transitionState.to as LessonStage | 'cafe' | 'snowball');
            setTransitionState(null);
        }
    }, [transitionState, onCompleteLesson, dayNumber, onBack, currentStage]);

    useEffect(() => {
        const handleAdminJump = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            const targetStr = customEvent.detail;
            
            if (targetStr.startsWith('memory_')) {
                const subType = targetStr.split('_')[1]; // knife or zombie or context
                if (subType === 'knife') {
                    setCurrentStage('memory');
                    setMemoryState(prev => ({ ...prev, step: 0 })); 
                } else if (subType === 'zombie') {
                    setCurrentStage('memory');
                    setMemoryState(prev => ({ ...prev, step: 1 }));
                } else if (subType === 'context') {
                    setCurrentStage('memory');
                    setMemoryState(prev => ({ ...prev, step: 2 }));
                }
                setShowIntro(true);
            } else {
                handleTabClick(targetStr as LessonStage | 'cafe' | 'snowball');
            }
        };
        window.addEventListener('ADMIN_JUMP_STAGE', handleAdminJump);
        return () => window.removeEventListener('ADMIN_JUMP_STAGE', handleAdminJump);
    }, [handleTabClick, setCurrentStage, setMemoryState]);

    // --- Render Logic ---
    useEffect(() => {
        const handleForceNext = () => {
            if (isLastStage) {
                onCompleteLesson(dayNumber);
                onBack();
            } else {
                handleNextStage();
            }
        };
        window.addEventListener('yuki-next-stage', handleForceNext);
        return () => {
            window.removeEventListener('yuki-next-stage', handleForceNext);
        };
    }, [handleNextStage, isLastStage, onCompleteLesson, dayNumber, onBack]);

    const renderCurrentStage = () => {
        if (showIntro) {
            const introStageStr = currentStage === 'memory' 
                ? `memory_${['knife', 'zombie', 'context'][memoryState.step]}` 
                : currentStage;
            return <CinematicIntro stage={introStageStr} onComplete={() => setShowIntro(false)} />;
        }

        if (transitionState) {
            const reportStr = `أحسنت! أتممت بنجاح مهام اليوم حول ${topic?.title || 'الموضوع'}. \n\n- استمعت لأهل القرية في السوق.\n- قرأت يوميات إيلي.\n- ساعدت ليث في الاحتطاب وحماية السياج.\n- راسلت إيلي عبر المحادثة الكتابية.\n- دردشت حول النار.\n- استمعت لراديو الوادي.\n\nاسترح الآن، غدًا بانتظارنا مغامرة جديدة!`;
            const isFinished = transitionState.to === 'lesson_complete' || transitionState.to === 'map';
            return (
                <StageTransition
                    fromStageName={transitionState.from}
                    toStageName={isFinished ? '' : (STAGES.find(s => s.id === transitionState.to)?.name || String(transitionState.to))}
                    isComplete={isFinished}
                    onProceed={handleProceedFromTransition}
                    starsCount={5}
                    lessonReport={transitionState.to === 'lesson_complete' ? reportStr : undefined}
                />
            );
        }

        if (showCover) {
            return <MissionCover stageId={currentStage} onStart={() => setShowCover(false)} onSkip={() => setShowCover(false)} />;
        }

        const { storyContent, memoryContent, reviewContent, textChatContent, radioContent, generationStatus } = lessonData;

        switch (currentStage) {
            case 'story':
                return (
                    <StoryStage
                        story={storyContent}
                        isLoading={(generationStatus.story === 'loading' || lessonData.isCheckingRemote) && !storyContent}
                        error={generationStatus.story === 'error'}
                        onRetry={() => lessonData.generateStageContent('story', true)}
                        onRegenerate={() => lessonData.regenerateStage('story')}
                        language={props.language}
                        nativeLanguage={props.nativeLanguage}
                        topic={props.topic}
                        dayNumber={props.dayNumber}
                        level={props.level}
                        onBack={props.onBack}
                        onNextStage={handleNextStage}
                        wordDataCache={props.wordDataCache}
                        onCacheWordData={props.onCacheWordData}
                        flashcards={props.flashcards}
                        onAddFlashcard={handleAddLessonFlashcard} // Fix: Use special handler
                        onImportFlashcards={props.onImportFlashcards}
                        cachedContent={props.cachedContent}
                        onCacheContent={props.onCacheContent}
                        generateWithImages={props.generateWithImages}
                        previousTopics={props.previousTopics}
                        mode={props.mode}
                        selectedVoice={selectedVoice}
                    />
                );
            case 'memory':
                return (
                    <MemoryStage
                        content={memoryContent}
                        isLoading={generationStatus.memory === 'loading'}
                        error={generationStatus.memory === 'error'}
                        onRetry={() => lessonData.generateStageContent('memory', true)}
                        onRegenerate={() => lessonData.regenerateStage('memory')}
                        language={props.language}
                        nativeLanguage={props.nativeLanguage}
                        topic={props.topic}
                        dayNumber={props.dayNumber}
                        level={props.level}
                        onBack={props.onBack}
                        wordDataCache={props.wordDataCache}
                        onCacheWordData={props.onCacheWordData}
                        flashcards={props.flashcards}
                        onAddFlashcard={handleAddLessonFlashcard} // Fix: Use special handler
                        onImportFlashcards={props.onImportFlashcards}
                        cachedContent={props.cachedContent}
                        onCacheContent={props.onCacheContent}
                        onUpdateReview={props.onUpdateReview}
                        onCompleteLesson={props.onCompleteLesson}
                        onClearCacheKey={props.onClearCacheKey}
                        generateWithImages={props.generateWithImages}
                        previousTopics={props.previousTopics}
                        drillIndex={memoryState.drillIndex}
                        step={memoryState.step}
                        onStateChange={(idx, stp) => {
                            setMemoryState({ drillIndex: idx, step: stp });
                            if (stp !== memoryState.step) {
                                setShowIntro(true);
                            }
                        }}
                        onNextStage={handleNextStage}
                    />
                );
            case 'textChat':
                return (
                    <TextChatStage
                        storyContent={storyContent}
                        chatContent={textChatContent}
                        isLoading={generationStatus.textChat === 'loading'}
                        error={generationStatus.textChat === 'error'}
                        onRetry={() => lessonData.generateStageContent('textChat', true)}
                        language={props.language}
                        flashcards={langFlashcards}
                        nativeLanguage={props.nativeLanguage}
                        level={props.level}
                    />
                );
            case 'chat':
                return (
                    <VoiceChatStage
                        nativeLanguage={props.nativeLanguage}
                        language={props.language}
                        topic={props.topic}
                        level={props.level}
                        storyContent={storyContent?.originalText || null}
                        isPractice={false}
                        dayNumber={props.dayNumber}
                        wordDataCache={props.wordDataCache}
                        onCacheWordData={props.onCacheWordData}
                        onAddFlashcard={handleAddLessonFlashcard}
                        voiceGender={chatConfig.chat.gender || 'male'}
                        flashcards={langFlashcards}
                    />
                );
            case 'practice':
                const practiceOptions = chatConfig.practice.type === 'voice' ? chatConfig.practice : { type: 'voice', gender: 'male' as const };
                return (
                    <VoiceChatStage
                        nativeLanguage={props.nativeLanguage}
                        language={props.language}
                        topic={props.topic}
                        level={props.level}
                        storyContent={storyContent?.originalText || null}
                        isPractice={true}
                        dayNumber={props.dayNumber}
                        wordDataCache={props.wordDataCache}
                        onCacheWordData={props.onCacheWordData}
                        onAddFlashcard={handleAddLessonFlashcard}
                        voiceGender={practiceOptions.gender}
                        flashcards={langFlashcards}
                    />
                );
            case 'cafe':
                return (
                    <LingoCafeStage
                        language={props.language}
                        nativeLanguage={props.nativeLanguage}
                        topic={props.topic}
                        onAddFlashcard={handleAddLessonFlashcard}
                    />
                );
            case 'deck':
                return (
                    <CardDeckView
                        flashcards={langFlashcards} // PASS ALL CARDS FOR THIS LANGUAGE
                        language={props.language}
                        nativeLanguage={props.nativeLanguage}
                        storyContent={storyContent}
                        onAddFlashcard={handleAddLessonFlashcard}
                        onImportFlashcards={props.onImportFlashcards}
                        wordDataCache={props.wordDataCache}
                        onCacheWordData={props.onCacheWordData}
                        onUpdateReview={props.onUpdateReview}
                        startInReviewMode={startDeckInReviewMode}
                        onReviewFinished={() => setStartDeckInReviewMode(false)}
                        onNextStage={handleNextStage}
                    />
                );
            case 'radio':
                return (
                    <RadioStage
                        content={radioContent}
                        isLoading={generationStatus.radio === 'loading'}
                        error={generationStatus.radio === 'error'}
                        onRetry={() => lessonData.generateStageContent('radio', true)}
                        onRegenerate={() => lessonData.regenerateStage('radio')}
                        language={props.language}
                        nativeLanguage={props.nativeLanguage}
                        topic={props.topic}
                        dayNumber={props.dayNumber}
                        level={props.level}
                        onBack={props.onBack}
                        onNextStage={handleNextStage}
                    />
                );
            case 'review':
            default: 
                 return (
                    <ReviewStage
                        content={reviewContent}
                        isLoading={generationStatus.review === 'loading'}
                        error={generationStatus.review === 'error'}
                        onRetry={() => lessonData.generateStageContent('review', true)}
                        language={props.language}
                        nativeLanguage={props.nativeLanguage}
                        topic={props.topic}
                        dayNumber={props.dayNumber}
                        level={props.level}
                        onBack={props.onBack}
                        wordDataCache={props.wordDataCache}
                        onCacheWordData={props.onCacheWordData}
                        flashcards={props.flashcards}
                        onAddFlashcard={handleAddLessonFlashcard}
                        onImportFlashcards={props.onImportFlashcards}
                        cachedContent={props.cachedContent}
                        onCacheContent={props.onCacheContent}
                        onUpdateReview={props.onUpdateReview}
                        onCompleteLesson={props.onCompleteLesson}
                        onClearCacheKey={props.onClearCacheKey}
                        generateWithImages={props.generateWithImages}
                        onStartReview={() => {
                            setCurrentStage('deck');
                            setStartDeckInReviewMode(true);
                        }}
                        onSkip={() => setCurrentStage('story')}
                        previousTopics={props.previousTopics}
                        mode={props.mode}
                    />
                );
        }
    };

    const allStagesGenerated = useMemo(() => {
        const stages: ContentStage[] = ['story', 'memory', 'review', 'textChat', 'radio'];
        return stages.every(s => lessonData.generationStatus[s] === 'done');
    }, [lessonData.generationStatus]);
    
    const handleExport = async (format: 'pdf' | 'zip' | 'html') => {
        if (!allStagesGenerated || (format !== 'html' && !preparedCanvases && !isPreparingExport)) {
             setIsPreparingExport(true);
             const exportData: LessonExportData = {
                story: lessonData.storyContent!, game: [], memory: lessonData.memoryContent!, review: lessonData.reviewContent!, textChatContent: lessonData.textChatContent!,
                flashcards: currentDayFlashcards, language: props.language, topic: props.topic, dayNumber: props.dayNumber,
            };
            const canvases = await prepareAllCanvasesForExport(exportData, (progress) => setProgressMessage(`${UI_TEXTS_AR.preparingExports} ${progress}`));
            setPreparedCanvases(canvases);
            setIsPreparingExport(false);
        }
        
        if (format === 'html' && allStagesGenerated) {
            const exportData: LessonExportData = {
                story: lessonData.storyContent!, game: [], memory: lessonData.memoryContent!, review: lessonData.reviewContent!, textChatContent: lessonData.textChatContent!,
                flashcards: currentDayFlashcards, language: props.language, topic: props.topic, dayNumber: props.dayNumber,
            };
            await generateSingleLanguageLessonHTML(exportData, (p) => setProgressMessage(p));
        } else if (preparedCanvases) {
            setIsDownloading(true);
            try {
                if (format === 'pdf') {
                    await generateSingleLanguageLessonPDF(preparedCanvases, `Lesson-${props.dayNumber}.pdf`, (p) => setProgressMessage(p));
                } else if (format === 'zip') {
                    await exportSingleLanguageLessonAsZip(preparedCanvases, `Lesson-${props.dayNumber}-Images.zip`, (p) => setProgressMessage(p));
                }
            } catch(e) { console.error(e); showLessonToast("Export failed"); }
            finally { setIsDownloading(false); setProgressMessage(''); }
        }
    };

    useEffect(() => {
        const prepareExports = async () => {
            if (allStagesGenerated && !preparedCanvases && !isPreparingExport) {
                setIsPreparingExport(true);
                const exportData: LessonExportData = {
                    story: lessonData.storyContent!, game: [], memory: lessonData.memoryContent!, review: lessonData.reviewContent!, textChatContent: lessonData.textChatContent!,
                    flashcards: currentDayFlashcards, language: props.language, topic: props.topic, dayNumber: props.dayNumber,
                };
                const canvases = await prepareAllCanvasesForExport(exportData, (progress) => setProgressMessage(`${UI_TEXTS_AR.preparingExports} ${progress}`));
                setPreparedCanvases(canvases);
                setIsPreparingExport(false);
                setProgressMessage('');
            }
        };
        prepareExports();
    }, [allStagesGenerated, preparedCanvases, isPreparingExport, lessonData, props, currentDayFlashcards]);

    const showProgress = isDownloading || isPreparingExport;
    const isCurrentStageGeneratable = ['story', 'memory', 'review', 'textChat'].includes(currentStage);
    const dataStageForCurrentUI = currentStage === 'textChat' || currentStage === 'chat' ? 'textChat' : (currentStage === 'deck' ? 'review' : (currentStage === 'cafe' || currentStage === 'snowball' || currentStage === 'listening' ? null : currentStage as ContentStage));
    const isCurrentStageLoading = dataStageForCurrentUI ? lessonData.generationStatus[dataStageForCurrentUI] === 'loading' : false;

    return (
        <GlobalAudioProvider>
            <div className="flex flex-col h-full w-full bg-[#f5efe6] p-2 sm:p-4 relative">
                {lessonToastMessage && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-purple-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-pre-wrap text-center max-w-md transition-opacity duration-300">
                        {lessonToastMessage}
                    </div>
                )}
            
            {showTranslator && (
                <QuickTranslatorModal language={props.language} onClose={() => setShowTranslator(false)} />
            )}

            {/* Small Floating Button to trigger Yuki Live API */}
            <button
                onClick={() => toggleLiveSession()}
                className={`fixed top-1/2 left-0 -translate-y-1/2 z-50 ${isLive ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#E8F0FE] text-[#1A73E8] border-[#d2e3fc]'} border border-l-0 p-1 rounded-r-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center w-6 h-10 outline-none`}
                title={isLive ? "إيقاف ياباني" : "تحدث مع ياباني"}
            >
                {isLive ? (
                    <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                )}
            </button>

            {!isFullScreenStage && (
                <header className="flex-shrink-0 bg-white/90 backdrop-blur-md px-4 py-3 rounded-b-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-10 mb-2">
                    <div className="flex justify-between items-center">
                        <button onClick={onBack} className="bg-transparent border-none text-base cursor-pointer text-purple-500 font-cafe font-bold" data-yuki-target="true">
                            &larr; {UI_TEXTS_AR.back}
                        </button>
                        <div className="text-center">
                            <h3 className="font-cafe text-lg font-black text-purple-800 line-clamp-1">{topic?.title || ''}</h3>
                            <span className="font-brand text-xs text-purple-500">Day {dayNumber}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <VoiceSelector 
                                language={language} 
                                selectedVoice={selectedVoice} 
                                onVoiceChange={setSelectedVoice}
                                className="w-24 hidden sm:block text-xs"
                            />
                        </div>
                    </div>
                </header>
            )}
            <main id="main-content-area" className={`flex-grow overflow-hidden relative ${isFullScreenStage ? 'bg-[#f5efe6]' : 'bg-[#f5efe6] backdrop-blur-sm rounded-xl shadow-sm border border-purple-100/50'}`}>

                <div id="stage-content-wrapper" className="h-full overflow-y-auto no-scrollbar">
                    <div id="interactive-text-container" data-yuki-target="true" className="absolute top-0 left-0 w-full h-1"></div>
                    <div id="game-options-container" data-yuki-target="true" className="absolute bottom-0 left-0 w-full h-1"></div>
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="h-12 w-12" /></div>}>
                        <ErrorBoundary onSkip={handleNextStage}>
                            {renderCurrentStage()}
                        </ErrorBoundary>
                    </Suspense>
                </div>
            </main>
             {!isFullScreenStage && (
                <footer className="flex-shrink-0 mt-2 flex flex-col gap-2">
                    <GlobalAudioPlayer language={props.language} />
                    {showProgress && (
                        <div className="text-center">
                            <p className="text-xs font-semibold text-purple-500">{progressMessage || '...'}</p>
                        </div>
                    )}
                    <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar justify-between">
                        <div className="flex gap-2">
                            {isCurrentStageGeneratable && (
                                <RegenerateButton
                                    stage={currentStage as LessonStage}
                                    isLoading={isCurrentStageLoading}
                                    isDisabled={!isCurrentStageGeneratable || isDownloading || isPreparingExport}
                                    onRegenerate={(stage) => {
                                        const targetDataStage = (stage === 'chat' ? 'textChat' : stage as ContentStage);
                                        lessonData.regenerateStage(targetDataStage);
                                    }}
                                />
                            )}
                            <button onClick={() => handleExport('pdf')} className="juicy-button from-red-500 to-orange-500 flex items-center justify-center gap-1 !px-3 !py-2 !text-xs" title={UI_TEXTS_AR.downloadPdfSingle}>
                                {(isDownloading && progressMessage.includes('PDF')) ? <Spinner size="h-4 w-4" /> : <DownloadIcon className="w-4 h-4" />} PDF
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleNextStage} 
                                className="group relative w-full overflow-hidden rounded-2xl bg-amber-600 p-1 transition-all hover:bg-amber-500 active:scale-95 shadow-[0_8px_0_0_#92400e,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_0_#92400e,0_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[8px]"
                            >
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                                <div className="relative flex items-center justify-center gap-2 rounded-xl border-2 border-amber-900/20 bg-amber-500 px-6 py-4 font-black text-amber-50 drop-shadow-md">
                                    <span className="text-xl">المرحلة التالية</span>
                                    <ChevronRightIcon className="w-6 h-6 animate-pulse" />
                                </div>
                            </button>
                        </div>
                        <div className="flex gap-2 w-full mt-4">
                            <button onClick={() => { onCompleteLesson(dayNumber); onBack(); }} disabled={isDownloading || isPreparingExport} className="w-full text-center juicy-button from-pink-500 to-red-500 !px-4 !py-3 !text-lg font-bold shadow-md">
                                {UI_TEXTS_AR.lessonComplete}
                            </button>
                        </div>
                    </div>
                </footer>
             )}

             {/* Hidden Audio Player for Full Screen Stages to keep audio playing */}
             {isFullScreenStage && (
                 <div className="hidden">
                     <GlobalAudioPlayer language={props.language} />
                 </div>
             )}
        </div>
        </GlobalAudioProvider>
    );
};

const LessonView: React.FC<LessonViewProps> = (props) => {
    if (props.mode === 'multi') {
        return <MultiLanguageLessonView {...props} />;
    }
    return <LessonViewContainer {...props} />;
};

export default LessonView;
