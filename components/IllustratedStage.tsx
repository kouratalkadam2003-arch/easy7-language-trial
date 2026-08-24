
import React, { useRef, useMemo } from 'react';
import { LessonViewProps } from './LessonView';
import { Language, WordData, Flashcard } from '../types';
import { LoadingDisplay, ErrorDisplay } from './Spinner';
import InteractiveText from './InteractiveText';
import GeneratedImage from './GeneratedImage';
import { CopyIcon } from './icons';
import StageSeparator from './StageSeparator';

// Local definition to satisfy compiler for unused/legacy code
interface IllustratedScene {
    imageIsLoading?: boolean;
    imageUrl?: string | null;
    error?: string;
    imagePrompt: string;
    paragraph: string;
}

interface InteractiveMnemonicTextProps {
    text: string;
    nativeLanguage: Language; 
    targetLanguage: Language; 
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    containerRef: React.RefObject<HTMLElement>;
    wordDataCache: Record<string, WordData>;
    onCacheWordData: (key: string, data: WordData) => void;
}

const InteractiveMnemonicText: React.FC<InteractiveMnemonicTextProps> = ({
    text,
    nativeLanguage,
    targetLanguage,
    onAddFlashcard,
    containerRef,
    wordDataCache,
    onCacheWordData,
}) => {
    const segments = useMemo(() => {
        const parts: ({ type: 'native'; content: string; } | { type: 'phrase'; original: string; })[] = [];
        const regex = /\[([^\]]+)\]! which means "([^"]+)"|'([a-zA-Z0-9\s-āēīōūáéíóúàèìòùâêîôûäëïöüçñß]+)'/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'native', content: text.substring(lastIndex, match.index) });
            }
            
            if (match[1] !== undefined) {
                parts.push({ type: 'phrase', original: match[1] });
            } else if (match[3] !== undefined) {
                parts.push({ type: 'phrase', original: match[3] });
            }
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push({ type: 'native', content: text.substring(lastIndex) });
        }
        return parts;
    }, [text]);

    const isRtl = nativeLanguage.code === 'ar';

    return (
        <p className="text-gray-700 text-lg leading-relaxed" style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
            {segments.map((segment, index) => {
                if (segment.type === 'native') {
                    return (
                        <InteractiveText
                            key={index}
                            as="span"
                            text={segment.content}
                            language={nativeLanguage}
                            nativeLanguage={nativeLanguage}
                            translationTargetLanguage={targetLanguage}
                            wordDataCache={wordDataCache}
                            onCacheWordData={onCacheWordData}
                            onAddFlashcard={onAddFlashcard}
                            containerRef={containerRef}
                        />
                    );
                } else {
                    return (
                        <span key={index} className="font-bold text-pink-700" style={{ direction: 'ltr', display: 'inline-block' }}>
                            <InteractiveText
                                as="span"
                                text={segment.original}
                                language={targetLanguage}
                                nativeLanguage={nativeLanguage}
                                wordDataCache={wordDataCache}
                                onCacheWordData={onCacheWordData}
                                onAddFlashcard={onAddFlashcard}
                                containerRef={containerRef}
                            />
                        </span>
                    );
                }
            })}
        </p>
    );
};

const UI_TEXTS_AR = {
    error: "حدث خطأ أثناء إنشاء المحتوى. حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
    generating: "جاري إنشاء المحتوى...",
};

interface IllustratedStageProps extends LessonViewProps {
    scenes: IllustratedScene[] | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onRegenerate: (index: number) => void;
    type: 'diary' | 'mnemonics';
}

const IllustratedStage: React.FC<IllustratedStageProps> = ({ scenes, isLoading, error, onRetry, onRegenerate, type, ...props }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    if (isLoading) return <LoadingDisplay text={UI_TEXTS_AR.generating} />;
    if (error) return <ErrorDisplay errorText={UI_TEXTS_AR.error} retryText={UI_TEXTS_AR.retry} onRetry={onRetry} />;
    if (!scenes) return <div className="p-4 text-center">لم يتم تحميل المحتوى بعد.</div>;
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div ref={containerRef} className="p-4 sm:p-8 h-full overflow-auto">
            <div className="max-w-2xl mx-auto space-y-12">
                 <StageSeparator stageId={type} />
                {scenes.map((scene, index) => (
                    <div key={index} className="text-center">
                        <div className="mb-6">
                           <GeneratedImage
                                isLoading={scene.imageIsLoading}
                                imageUrl={scene.imageUrl}
                                error={scene.error}
                                alt={scene.imagePrompt}
                                onRegenerate={() => onRegenerate(index)}
                                aspectRatioClass="aspect-square"
                            />
                        </div>
                        <div className="text-gray-800 text-lg leading-relaxed text-right bg-amber-50/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-200/50 shadow-sm relative">
                            <button
                                onClick={() => handleCopy(scene.paragraph)}
                                className="absolute top-2 left-14 juicy-button from-sky-400 to-blue-500 !p-2"
                                title="نسخ النص"
                            >
                                <CopyIcon className="w-5 h-5 text-white" />
                            </button>
                           <InteractiveMnemonicText
                                text={scene.paragraph}
                                nativeLanguage={props.nativeLanguage}
                                targetLanguage={props.language}
                                onAddFlashcard={props.onAddFlashcard}
                                containerRef={containerRef}
                                wordDataCache={props.wordDataCache}
                                onCacheWordData={props.onCacheWordData}
                           />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IllustratedStage;
