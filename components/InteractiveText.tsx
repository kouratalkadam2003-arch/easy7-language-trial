
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Language, WordData, Flashcard } from '../types';
import { fetchContextualTranslation, fetchArabicTranslation } from '../services/ai';
import TranslationTooltip from './TranslationTooltip';
import { speakText, speakTextBrowser } from '../utils/audio';
import { liveTTS } from '../services/liveTTS';

import { useGlobalAudio } from './GlobalAudioContext';

interface InteractiveTextProps {
    text: string;
    language: Language; 
    nativeLanguage: Language; 
    translationTargetLanguage?: Language; 
    wordDataCache: Record<string, WordData>;
    onCacheWordData: (key: string, data: WordData) => void;
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    containerRef: React.RefObject<HTMLElement>; 
    as?: 'p' | 'span';
    className?: string;
    highlightWordIndex?: number | null; 
    disableTooltip?: boolean; 
    onWordClick?: (index: number, word: string, charIndex: number) => void;
    onSpeakPhrase?: (phrase: string) => void; 
    onInteractionEnd?: () => void; // New prop to enforce "Stop" when selection clears
    selectedVoice?: SpeechSynthesisVoice | null;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({
    text = '',
    language,
    nativeLanguage,
    translationTargetLanguage,
    wordDataCache,
    onCacheWordData,
    onAddFlashcard,
    containerRef,
    as: Component = 'p',
    className,
    highlightWordIndex = null,
    disableTooltip = false,
    onWordClick,
    onSpeakPhrase,
    onInteractionEnd,
    selectedVoice
}) => {
    const [selectionRange, setSelectionRange] = useState<[number, number] | null>(null);
    const [anchorIndex, setAnchorIndex] = useState<number | null>(null); 
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [currentTranslation, setCurrentTranslation] = useState<string | null>(null);
    const [currentNativeText, setCurrentNativeText] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    
    const tooltipRef = useRef<HTMLDivElement>(null);
    const componentRef = useRef<HTMLParagraphElement | HTMLSpanElement>(null);
    const activeWordRequest = useRef<string | null>(null);
    const { repeatCount, speed, engine } = useGlobalAudio();

    // Reset flipped state when text changes
    useEffect(() => {
        setIsFlipped(false);
        setCurrentTranslation(null);
        setShowTooltip(false);
    }, [text]);

    const segments = useMemo(() => {
        const safeText = (text || '').toString();
        const segs = safeText.split(/([.,!?;:"()\s]+)/).filter(Boolean);
        let charCounter = 0;
        return segs.map(s => {
            const start = charCounter;
            charCounter += s.length;
            return { text: s, start };
        });
    }, [text]);

    const activeSegmentIndex = useMemo(() => {
        if (highlightWordIndex === null) return -1;
        let wordCounter = 0;
        for (let i = 0; i < segments.length; i++) {
            const isWord = segments[i].text.trim().length > 0 && !/^[.,!?;:"()]+$/.test(segments[i].text);
            if (isWord) {
                if (wordCounter === highlightWordIndex) return i;
                wordCounter++;
            }
        }
        return -1;
    }, [highlightWordIndex, segments]);

    const translateSegment = async (phrase: string, rect: DOMRect) => {
        if (!phrase) return;

        activeWordRequest.current = phrase;
        setSelectedText(phrase);

        // --- SMART PRONUNCIATION WITH FALLBACK ---
        if (onSpeakPhrase) {
            // Use custom handler if provided (e.g. forced Live API for Listening Stage)
            onSpeakPhrase(phrase);
        } else {
            // Default behavior: Loop based on repeatCount
            const speakLoop = async () => {
                for (let i = 0; i < repeatCount; i++) {
                    // Check if the request is still active
                    if (activeWordRequest.current !== phrase) break;

                    if (engine === 'live') {
                        if (!liveTTS.isConnected) {
                            await liveTTS.connect(language);
                        }
                        try {
                            await liveTTS.speak(phrase, speed); 
                            // LiveTTS doesn't return a promise that waits for audio end, so we use approximation
                            if (i < repeatCount - 1) {
                                const waitTime = (phrase.length / 15) * 1000 * (1 / speed) + 800;
                                await new Promise(resolve => setTimeout(resolve, waitTime));
                            }
                        } catch (e) {
                            console.warn("Live TTS failed for word click, falling back to browser.", e);
                            await speakText(phrase, language, speed, undefined, undefined, 'standard', selectedVoice);
                        }
                    } else {
                        await speakText(phrase, language, speed, undefined, undefined, engine as 'hq' | 'standard', selectedVoice);
                    }

                    // Added small buffer between loops for natural pacing if not handled by liveTTS delay above
                    if (engine !== 'live' && i < repeatCount - 1) {
                            await new Promise(resolve => setTimeout(resolve, 600));
                    }
                }
            };
            speakLoop();
        }

        const containerEl = containerRef.current;
        if (!containerEl) return;

        const containerRect = containerEl.getBoundingClientRect();
        const scrollTop = containerEl.scrollTop;
        const scrollLeft = containerEl.scrollLeft;

        const left = rect.left + rect.width / 2 - containerRect.left + scrollLeft;
        const top = rect.top - containerRect.top + scrollTop;

        setTooltipPosition({ top, left });
        
        // --- TOOLTIP REMOVED AS REQUESTED ---
        setShowTooltip(false);
        
        setIsTranslating(true);
        setCurrentTranslation(null);
        setCurrentNativeText(null);
        setIsFlipped(true);

        try {
            if (language.code === nativeLanguage.code && translationTargetLanguage) {
                const result = await fetchArabicTranslation({ text: phrase, targetLanguage: translationTargetLanguage });
                if (activeWordRequest.current === phrase) {
                    setCurrentTranslation(result);
                    setCurrentNativeText(null);
                }
            } else { 
                const result = await fetchContextualTranslation({ text: phrase, wordDataCache, language, nativeLanguage, onCacheWordData });
                if (activeWordRequest.current === phrase) {
                    setCurrentTranslation(result.translation);
                    setCurrentNativeText(result.nativeText);
                }
            }
        } catch (error) {
            console.error("Translation fetch failed:", error);
            if (activeWordRequest.current === phrase) {
                setCurrentTranslation("Translation Failed");
            }
        } finally {
            if (activeWordRequest.current === phrase) {
                setIsTranslating(false);
            }
        }
    };

    const handleClick = useCallback((e: React.MouseEvent<HTMLSpanElement>, index: number) => {
        e.stopPropagation();

        // Toggling back logic: Only toggle off if we are clicking on the already translated text area
        // AND we are not in the middle of a multi-word selection (anchorIndex === null)
        if (isFlipped && anchorIndex === null && selectionRange && index >= selectionRange[0] && index <= selectionRange[1]) {
            setIsFlipped(false);
            setShowTooltip(false);
            setSelectionRange(null);
            return;
        }

        const clickedSegment = segments[index];

        if (onWordClick) {
            let wordCountBefore = 0;
            for(let k=0; k<index; k++) {
                const isW = segments[k].text.trim().length > 0 && !/^[.,!?;:"()]+$/.test(segments[k].text);
                if (isW) wordCountBefore++;
            }
            onWordClick(wordCountBefore, clickedSegment.text, clickedSegment.start);
        }

        let start = index;
        let end = index;
        let newAnchor: number | null = null;

        // A to B selection logic
        if (anchorIndex === null) {
            start = index;
            end = index;
            newAnchor = index; 
        } else {
            start = Math.min(anchorIndex, index);
            end = Math.max(anchorIndex, index);
            newAnchor = null; 
        }

        setAnchorIndex(newAnchor);
        setSelectionRange([start, end]);

        const selectedSegments = segments.slice(start, end + 1).map(s => s.text);
        const phraseToTranslate = selectedSegments.join('').trim();
        
        if (!phraseToTranslate) {
            setSelectionRange(null);
            setShowTooltip(false);
            setIsFlipped(false);
            if (onInteractionEnd) onInteractionEnd();
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        translateSegment(phraseToTranslate, rect);

    }, [anchorIndex, segments, language, nativeLanguage, translationTargetLanguage, wordDataCache, onCacheWordData, containerRef, disableTooltip, onWordClick, onSpeakPhrase, onInteractionEnd, selectedVoice, isFlipped, currentTranslation, selectionRange]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isClickInsideComponent = componentRef.current && componentRef.current.contains(target);
            const isClickInsideTooltip = (tooltipRef.current && tooltipRef.current.contains(target));

            if (!isClickInsideComponent && !isClickInsideTooltip) {
                const wasShowing = showTooltip || selectionRange !== null || isFlipped;
                setShowTooltip(false);
                setSelectionRange(null);
                setAnchorIndex(null); 
                setIsFlipped(false);
                
                if (wasShowing) {
                    activeWordRequest.current = null;
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    if (engine === 'live') liveTTS.stop();
                    if (onInteractionEnd) onInteractionEnd();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTooltip, selectionRange, onInteractionEnd, engine, isFlipped]);
    
    const isRtl = language.code === 'ar';

    return (
        <>
            <Component
                ref={componentRef as any}
                className={className === undefined ? (Component === 'p' ? "text-gray-800 text-lg leading-relaxed" : "") : className}
                style={{ direction: isRtl ? 'rtl' : 'ltr', userSelect: 'none' }}
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {segments.map((segmentObj, index) => {
                    const segment = segmentObj.text;
                    const isWord = segment.trim().length > 0;

                    const isSelected = selectionRange && index >= selectionRange[0] && index <= selectionRange[1];
                    const isFirstSelected = selectionRange && index === selectionRange[0];
                    
                    // Flip Logic: Replace range with translation
                    if (isFlipped && isSelected) {
                        if (isFirstSelected) {
                            return (
                                <span
                                    key={`flipped-${index}`}
                                    className="cursor-pointer transition-all duration-300 rounded px-1.5 py-0.5 bg-purple-100 text-purple-800 font-bold border-b-2 border-purple-400 animate-in fade-in zoom-in-95 duration-300 shadow-sm"
                                    onClick={(e) => handleClick(e as any, index)}
                                >
                                    {isTranslating ? (
                                        <span className="animate-pulse">...</span>
                                    ) : (
                                        currentTranslation || segment
                                    )}
                                </span>
                            );
                        }
                        return null; 
                    }

                    if (!isWord) {
                        return <React.Fragment key={index}>{segment}</React.Fragment>;
                    }

                    let segmentClassName = "cursor-pointer transition-all duration-200 rounded px-0.5 box-decoration-clone";

                    const isAnchor = anchorIndex === index;
                    const isSpoken = index === activeSegmentIndex;
                    
                    if (isSpoken) {
                        segmentClassName += ' text-emerald-800 bg-emerald-200 font-extrabold rounded-lg shadow-sm scale-110 inline-block transform px-2';
                    } else if (isSelected) {
                        segmentClassName += ' bg-emerald-100 text-emerald-800 font-medium rounded-lg px-2'; 
                    } else if (isAnchor) {
                        segmentClassName += ' bg-emerald-100 underline decoration-emerald-500 decoration-2 rounded-lg px-2'; 
                    } else {
                        segmentClassName += " hover:bg-emerald-50/50 hover:text-emerald-700 rounded-lg px-1";
                    }

                    return (
                        <span
                            key={index}
                            className={segmentClassName}
                            onClick={(e) => handleClick(e, index)}
                            onMouseEnter={() => isWord && setHoveredIndex(index)}
                        >
                            {segment}
                        </span>
                    );
                })}
            </Component>
        </>
    );
};

export default InteractiveText;
