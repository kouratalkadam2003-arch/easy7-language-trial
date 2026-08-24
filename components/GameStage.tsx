
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LessonViewProps } from './LessonView';
import { GameTurn, Language, WordData, Flashcard } from '../types';
import { LoadingDisplay, ErrorDisplay } from './Spinner';
import InteractiveText from './InteractiveText';
import GeneratedImage from './GeneratedImage';
import { DownloadIcon, CopyIcon } from './icons';
import { downloadGameTurnAsImage } from '../utils/imageExport';
import StageSeparator from './StageSeparator';
import AIAudioPlayer from './AIAudioPlayer';

const UI_TEXTS_AR = {
    error: "حدث خطأ أثناء إنشاء المحتوى. حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
    generating: "جاري إنشاء المحتوى...",
};

interface InteractiveScenarioProps {
    scenario: string;
    language: Language;
    nativeLanguage: Language;
    wordDataCache: Record<string, WordData>;
    onCacheWordData: (key: string, data: WordData) => void;
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    containerRef: React.RefObject<HTMLElement>;
}

const InteractiveScenario: React.FC<InteractiveScenarioProps> = (props) => {
    const { scenario } = props;

    const displayScenario = useMemo(() => {
        return scenario.replace(/\s*\(.*?\)\s*$/, '').trim();
    }, [scenario]);

    return (
        <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
            {displayScenario}
        </h4>
    );
};

interface GameStageProps extends LessonViewProps {
    turns: GameTurn[] | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onRegenerate: (index: number) => void;
}

const GameStage: React.FC<GameStageProps> = ({ turns, isLoading, error, onRetry, onRegenerate, ...props }) => {
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [playerChoices, setPlayerChoices] = useState<Record<number, number>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      setPlayerChoices({});
      setCurrentTurnIndex(0);
    }, [turns]);

    const handleChoice = (turnId: number, choiceIndex: number) => {
        if (playerChoices[turnId] !== undefined) return;
        setPlayerChoices(prev => ({ ...prev, [turnId]: choiceIndex }));
    };
    
    const handleNext = () => {
        if (turns && currentTurnIndex < turns.length - 1) {
            setCurrentTurnIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentTurnIndex > 0) {
            setCurrentTurnIndex(prev => prev - 1);
        }
    };

    const handleCopyAll = (e: React.MouseEvent, turn: GameTurn) => {
        e.stopPropagation();
        const choicesText = turn.choices.map((c, i) => `${i + 1}. ${c.text} (${c.translation})`).join('\n');
        const fullText = `Scenario:\n${turn.scenario}\n\nChoices:\n${choicesText}`;
        navigator.clipboard.writeText(fullText);
    };

    const handleCopyChoice = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
    };

    if (isLoading) return <LoadingDisplay text={UI_TEXTS_AR.generating} />;
    if (error) return <ErrorDisplay errorText={UI_TEXTS_AR.error} retryText={UI_TEXTS_AR.retry} onRetry={onRetry} />;
    if (!turns || turns.length === 0) return <div className="p-4 text-center">لم يتم تحميل اللعبة بعد.</div>;
    
    const turn = turns[currentTurnIndex];
    const playerChoiceIndex = playerChoices[turn.id];
    const choiceMade = playerChoiceIndex !== undefined;
    const isCorrectlyAnswered = choiceMade && turn.choices[playerChoiceIndex].isCorrect;
    const progressPercentage = (currentTurnIndex / turns.length) * 100;

    return (
        <div ref={containerRef} className="p-4 sm:p-8 h-full flex flex-col">
            <div className="w-full max-w-3xl mx-auto">
                <StageSeparator stageId="game" />
                <div className="mb-4">
                    <div className="w-full bg-pink-200/50 rounded-full h-2.5">
                        <div className="bg-pink-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                <div className="text-center relative">
                    <div className="absolute right-0 top-0 flex flex-col gap-1 items-end">
                        <button 
                            onClick={(e) => handleCopyAll(e, turn)}
                            className="p-2 text-gray-400 hover:text-gray-600 bg-white/80 rounded-full shadow-sm"
                            title="نسخ السيناريو والخيارات"
                        >
                            <CopyIcon className="w-5 h-5" />
                        </button>
                        <AIAudioPlayer 
                            text={turn.scenario} 
                            language={props.nativeLanguage} 
                            className="bg-white/80 rounded-full"
                            shouldPreload={true} 
                            useBrowserTTS={false} // FORCE AI TTS
                        />
                    </div>

                    <InteractiveScenario 
                        scenario={turn.scenario}
                        language={props.language}
                        nativeLanguage={props.nativeLanguage}
                        wordDataCache={props.wordDataCache}
                        onCacheWordData={props.onCacheWordData}
                        onAddFlashcard={props.onAddFlashcard}
                        containerRef={containerRef}
                    />
                    <div className="mb-4">
                        <GeneratedImage
                            isLoading={turn.imageIsLoading}
                            imageUrl={turn.imageUrl}
                            error={turn.error}
                            alt={turn.scenario}
                            onRegenerate={() => onRegenerate(currentTurnIndex)}
                            aspectRatioClass="aspect-video"
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
                        {turn.choices.map((choice, choiceIndex) => {
                            const isCorrect = choice.isCorrect;
                            const isPlayerChoice = playerChoiceIndex === choiceIndex;
                            let containerClass = "p-4 rounded-lg border-2 transition-all duration-300 text-right flex items-center gap-4 relative group";
                            
                            if (choiceMade) {
                                if (isCorrect) containerClass += " bg-green-200 border-green-400";
                                else if (isPlayerChoice) containerClass += " bg-red-200 border-red-400";
                                else containerClass += " bg-white border-gray-300 opacity-60";
                            } else {
                                containerClass += " bg-white border-gray-300 hover:border-pink-400 hover:bg-pink-50 cursor-pointer";
                            }

                            return (
                                <div key={choiceIndex} onClick={() => !choiceMade && handleChoice(turn.id, choiceIndex)} className={containerClass}>
                                    <div className="flex-grow text-left">
                                        <div className="font-semibold text-lg flex items-center gap-2">
                                            <InteractiveText
                                                as="span"
                                                text={choice.text}
                                                language={props.language}
                                                nativeLanguage={props.nativeLanguage}
                                                wordDataCache={props.wordDataCache}
                                                onCacheWordData={props.onCacheWordData}
                                                onAddFlashcard={props.onAddFlashcard}
                                                containerRef={containerRef}
                                            />
                                            <button 
                                                onClick={(e) => handleCopyChoice(e, choice.text)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                                                title="نسخ"
                                            >
                                                <CopyIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600 text-right">{choice.translation}</p>
                                        {choiceMade && !isCorrect && isPlayerChoice && choice.incorrectOutcome && <p className="text-xs text-red-700 mt-1 text-right">{choice.incorrectOutcome}</p>}
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <AIAudioPlayer 
                                            text={choice.text} 
                                            speechText={choice.nativeScript} 
                                            language={props.language} 
                                            useBrowserTTS={false} // FORCE AI TTS
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="mt-auto pt-6 flex justify-between items-center w-full max-w-3xl mx-auto">
                <button onClick={handlePrev} disabled={currentTurnIndex === 0} className="juicy-button from-gray-400 to-gray-500">
                    السابق
                </button>
                <button
                    onClick={() => downloadGameTurnAsImage(turn, `scenario-${currentTurnIndex + 1}.png`)}
                    className="juicy-button from-sky-400 to-blue-500 !p-3"
                    title="تحميل هذا السيناريو كصورة"
                >
                    <DownloadIcon className="w-5 h-5 text-white" />
                </button>
                <span className="font-bold text-purple-600">{currentTurnIndex + 1} / {turns.length}</span>
                <button onClick={handleNext} disabled={!choiceMade || currentTurnIndex === turns.length - 1} className="juicy-button from-pink-500 to-red-500">
                    التالي
                </button>
            </div>
        </div>
    );
};

export default GameStage;
