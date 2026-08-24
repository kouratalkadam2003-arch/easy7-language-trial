
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Flashcard, FlashcardStatus, Language, WordData, StoryContentType } from '../types';
import { SpeakerIcon, PlusIcon, DownloadIcon, UploadIcon, CopyIcon, DeckIcon, QuizIcon } from './icons';
import InteractiveText from './InteractiveText';
import { shuffleArray } from '../utils/srs';
import Spinner from './Spinner';
import TTSButton from './TTSButton';
import { dueCards, rateCard } from '../lib/cardStore';
import { formatNextReview } from '../utils/srs';

declare const JSZip: any;
declare const saveAs: any;

interface CardDeckViewProps {
    flashcards: Flashcard[];
    language: Language;
    nativeLanguage: Language;
    storyContent?: StoryContentType | null; // Passed from parent
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    onImportFlashcards: (event: React.ChangeEvent<HTMLInputElement>) => void;
    wordDataCache: Record<string, WordData>;
    onCacheWordData: (key: string, data: WordData) => void;
    onUpdateReview: (cardId: string, rating: FlashcardStatus, langCode: Language['code']) => void;
    startInReviewMode?: boolean;
    onReviewFinished?: () => void;
    onNextStage?: () => void;
}

const STATUS_CONFIG: Record<FlashcardStatus, { border: string; bg: string; text: string; label: string; }> = {
    new: { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-800', label: 'جديدة' },
    again: { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-800', label: 'مجدداً' },
    hard: { border: 'border-orange-500', bg: 'bg-orange-100', text: 'text-orange-800', label: 'صعبة' },
    good: { border: 'border-sky-500', bg: 'bg-sky-100', text: 'text-sky-800', label: 'جيدة' },
    easy: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-800', label: 'سهلة' },
};

const FLASHCARD_TEXTS_AR = {
    title: "مراجعة البطاقات",
    showAnswer: "إظهار الإجابة",
    reviewComplete: "اكتملت المراجعة! عمل رائع.",
    backToList: "العودة إلى القائمة",
    again: "مجددًا",
    hard: "صعب",
    good: "جيد",
    easy: "سهل",
    buttonsHelp: {
        again: "بعد دقيقة",
        hard: "بعد 6 دقائق",
        good: "بعد 10 دقائق",
        easy: "بعد 4 أيام"
    },
    startReview: "بدء المراجعة ({count} بطاقات)",
    exportAnki: "تصدير لـ Anki",
    myCards: "بطاقاتي",
};

interface CardProps {
    card: Flashcard;
    language: Language;
    nativeLanguage: Language;
    wordDataCache: Record<string, WordData>;
    onCacheWordData: (key: string, data: WordData) => void;
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

const Card: React.FC<CardProps> = ({ card, language, nativeLanguage, wordDataCache, onCacheWordData, onAddFlashcard, containerRef }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const statusStyle = STATUS_CONFIG[card.status];

    return (
        <div className={`perspective-1000 h-64`} onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className={`absolute w-full h-full backface-hidden flex flex-col p-5 rounded-2xl shadow-sm border-l-8 ${statusStyle.border} bg-white items-center justify-center text-center cursor-pointer hover:shadow-md transition-shadow`}>
                    <p className="text-xl font-cafe font-bold text-purple-800">{card.translation}</p>
                    <p className="text-xs font-cafe text-slate-400 mt-4">اضغط لرؤية {language.name}</p>
                </div>

                {/* Back */}
                <div className={`absolute w-full h-full backface-hidden rotate-y-180 flex flex-col justify-between p-5 rounded-2xl shadow-sm border-r-8 ${statusStyle.border} ${statusStyle.bg} cursor-pointer`}>
                    <div className="flex justify-between items-start">
                        <span className={`px-3 py-1 text-xs font-cafe font-bold rounded-full ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>{statusStyle.label}</span>
                        <TTSButton 
                            text={card.originalText} 
                            nativeText={card.nativeText} 
                            language={language} 
                            className="bg-white hover:bg-white text-purple-700 shadow-sm"
                        />
                    </div>
                    <div className="my-auto flex flex-col items-center gap-2 text-center">
                        <InteractiveText
                            as="p"
                            text={card.originalText}
                            language={language}
                            nativeLanguage={nativeLanguage}
                            wordDataCache={wordDataCache}
                            onCacheWordData={onCacheWordData}
                            onAddFlashcard={onAddFlashcard}
                            containerRef={containerRef}
                            className={`text-2xl font-brand font-bold ${statusStyle.text}`}
                        />
                         {card.nativeText && card.nativeText !== card.originalText && (
                            <p className="text-md text-purple-600 font-brand">{card.nativeText}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CardDeckView: React.FC<CardDeckViewProps> = ({ 
    flashcards, language, nativeLanguage, storyContent, 
    onAddFlashcard, onImportFlashcards, wordDataCache, 
    onCacheWordData, onUpdateReview, startInReviewMode, onReviewFinished, onNextStage
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'list' | 'review'>('list');
    const [reviewDeck, setReviewDeck] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const texts = FLASHCARD_TEXTS_AR;

    // Filter cards related to current story context if possible, or just show all
    const displayedCards = useMemo(() => {
        // Sort by difficulty (hardest first), then by creation time
        const difficultyWeight: Record<FlashcardStatus, number> = {
            'again': 1,
            'hard': 2,
            'new': 3,
            'good': 4,
            'easy': 5
        };
        return [...flashcards].sort((a, b) => {
            const weightA = difficultyWeight[a.status] || 99;
            const weightB = difficultyWeight[b.status] || 99;
            const diff = weightA - weightB;
            if (diff !== 0) return diff;
            return (parseInt(a.id) || 0) - (parseInt(b.id) || 0);
        });
    }, [flashcards]);

    const dueCardsCount = useMemo(() => {
        const now = Date.now();
        return flashcards.filter(card => card.nextReviewTimestamp <= now).length;
    }, [flashcards]);

    const startReview = useCallback(() => {
        // Use the new cardStore system
        const due = dueCards(language.code);
        if (due.length > 0) {
            setReviewDeck(shuffleArray(due));
            setCurrentIndex(0);
            setIsFlipped(false);
            setViewMode('review');
        } else {
            // Fallback to old system
            const now = Date.now();
            const oldDueCards = flashcards.filter(card => card.nextReviewTimestamp <= now);
            if (oldDueCards.length > 0) {
                setReviewDeck(shuffleArray(oldDueCards));
                setCurrentIndex(0);
                setIsFlipped(false);
                setViewMode('review');
            } else {
                alert("لا يوجد بطاقات للمراجعة الآن. عد لاحقاً!");
            }
        }
    }, [flashcards, language.code]);

    useEffect(() => {
        if (startInReviewMode) {
            startReview();
            // DO NOT call onReviewFinished here, wait for user to finish or close
        }
    }, [startInReviewMode]);

    const handleNextCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
        const currentCard = reviewDeck[currentIndex];
        if (currentCard) {
            // Use the new cardStore system
            rateCard(currentCard.id, rating);
            // Also update the old system
            onUpdateReview(currentCard.id, rating, language.code);
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleExportAnki = async () => {
        setIsExporting(true);
        const zip = new JSZip();
        
        let csvContent = "#separator:tab\n#html:true\n#tags:language-learning\n";
        
        for (const card of flashcards) {
            const front = `
                <div style="text-align:center; padding: 20px;">
                    <h2 style="color:#2d3748;">${card.translation}</h2>
                    <p style="color:#718096; font-size: 0.8em;">(Translate to ${language.name})</p>
                </div>
            `.replace(/\n/g, '');
            
            const back = `
                <div style="text-align:center; padding: 20px;">
                    <h1 style="color:#d53f8c; margin-bottom: 10px;">${card.originalText}</h1>
                    ${card.nativeText ? `<p style="color:#4a5568; font-family: monospace;">${card.nativeText}</p>` : ''}
                    <hr style="margin: 15px 0; border: 0; border-top: 1px solid #e2e8f0;">
                    <p style="color:#2d3748;">${card.translation}</p>
                </div>
            `.replace(/\n/g, '');

            csvContent += `${front}\t${back}\n`;
        }

        zip.file("deck.txt", csvContent);
        
        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${language.englishName}_Flashcards.apkg`); 
        } catch (e) {
            console.error("Export failed", e);
            alert("فشل التصدير.");
        } finally {
            setIsExporting(false);
        }
    };

    if (viewMode === 'review') {
        const currentCard = reviewDeck[currentIndex];
        const progressPercentage = reviewDeck.length > 0 ? ((currentIndex) / reviewDeck.length) * 100 : 0;

        return (
            <div className="p-4 sm:p-6 h-full flex flex-col font-brand">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{texts.title}</h2>
                    {startInReviewMode && onReviewFinished ? (
                        <button onClick={onReviewFinished} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    ) : (
                        <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-800 font-semibold">{texts.backToList}</button>
                    )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 border border-white/50">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center p-4">
                    {!currentCard ? (
                        <div className="text-center text-gray-600">
                            <h3 className="text-3xl font-bold mb-4">🎉 {texts.reviewComplete}</h3>
                            <button onClick={() => {
                                if (startInReviewMode && onReviewFinished) onReviewFinished();
                                else setViewMode('list');
                            }} className="juicy-button from-blue-500 to-sky-600">
                                {startInReviewMode ? "متابعة الدرس" : "العودة للقائمة"}
                            </button>
                        </div>
                    ) : (
                        <div className={`w-full max-w-sm h-[400px] perspective-1000`}>
                            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center bg-white border-4 border-pink-100 rounded-2xl p-6 shadow-xl text-center">
                                    <p className="text-gray-500 text-sm mb-4">ما معنى هذه العبارة؟</p>
                                    <p className="text-2xl font-bold text-gray-800 leading-relaxed" dir="ltr">{currentCard.originalText}</p>
                                    <button onClick={() => setIsFlipped(true)} className="mt-8 juicy-button from-pink-500 to-red-500">{texts.showAnswer}</button>
                                </div>
                                <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-purple-700 border-4 border-purple-400 rounded-2xl p-6 shadow-xl text-white">
                                    <p className="text-3xl font-bold mb-4">{currentCard.translation}</p>
                                    {currentCard.nativeText && <p className="text-lg opacity-80 mb-6 font-mono">{currentCard.nativeText}</p>}
                                    <div className="mb-6">
                                        <TTSButton 
                                            text={currentCard.originalText} 
                                            nativeText={currentCard.nativeText} 
                                            language={language}
                                            className="bg-white/20 text-white hover:bg-white/30 border-white/40"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {currentCard && isFlipped && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto">
                        <button onClick={() => handleNextCard('again')} className="p-3 bg-red-100 text-red-700 rounded-lg font-bold border-b-4 border-red-200 active:border-b-0 active:translate-y-1 transition-all">{texts.again}</button>
                        <button onClick={() => handleNextCard('hard')} className="p-3 bg-orange-100 text-orange-700 rounded-lg font-bold border-b-4 border-orange-200 active:border-b-0 active:translate-y-1 transition-all">{texts.hard}</button>
                        <button onClick={() => handleNextCard('good')} className="p-3 bg-sky-100 text-sky-700 rounded-lg font-bold border-b-4 border-sky-200 active:border-b-0 active:translate-y-1 transition-all">{texts.good}</button>
                        <button onClick={() => handleNextCard('easy')} className="p-3 bg-green-100 text-green-700 rounded-lg font-bold border-b-4 border-green-200 active:border-b-0 active:translate-y-1 transition-all">{texts.easy}</button>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 h-full flex flex-col bg-gray-50 overflow-auto" dir="rtl">
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
            `}</style>

            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <DeckIcon />
                    <h3 className="text-2xl font-bold text-gray-800">{texts.myCards} <span className="text-sm font-normal text-gray-500">({displayedCards.length})</span></h3>
                </div>
                <div className="flex gap-2">
                    {onNextStage && (
                        <button 
                            onClick={onNextStage}
                            className="group relative overflow-hidden rounded-2xl bg-amber-600 p-1 transition-all hover:bg-amber-500 active:scale-95 shadow-[0_8px_0_0_#92400e,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_0_#92400e,0_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[8px]"
                        >
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                            <div className="relative flex items-center justify-center gap-2 rounded-xl border-2 border-amber-900/20 bg-amber-500 px-4 py-2 font-black text-amber-50 drop-shadow-md">
                                <span className="text-sm">إنهاء الدرس</span>
                            </div>
                        </button>
                    )}
                    <button 
                        onClick={startReview} 
                        disabled={dueCardsCount === 0}
                        className="juicy-button from-pink-500 to-red-600 !px-4 !py-2 text-sm flex items-center gap-2"
                    >
                        <QuizIcon className="w-5 h-5" />
                        {texts.startReview.replace('{count}', String(dueCardsCount))}
                    </button>
                    <button 
                        onClick={handleExportAnki} 
                        disabled={isExporting || flashcards.length === 0}
                        className="juicy-button from-gray-500 to-purple-600 !px-4 !py-2 text-sm flex items-center gap-2"
                        title={texts.exportAnki}
                    >
                        {isExporting ? <Spinner size="h-4 w-4" /> : <DownloadIcon className="w-4 h-4" />}
                        Anki
                    </button>
                </div>
            </div>
            
            <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedCards.map((card, idx) => (
                    <Card 
                        key={card.id} 
                        card={card} 
                        language={language} 
                        nativeLanguage={nativeLanguage}
                        wordDataCache={wordDataCache}
                        onCacheWordData={onCacheWordData}
                        onAddFlashcard={onAddFlashcard}
                        containerRef={containerRef}
                    />
                ))}
            </div>
        </div>
    );
};

export default CardDeckView;
