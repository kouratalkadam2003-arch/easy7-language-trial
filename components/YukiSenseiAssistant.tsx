
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LessonExportData, Language, LessonStage } from '../types';
import { generateYukiSenseiScript, generateSpeechFromText } from '../services/ai';
import { decode, decodeAudioData } from '../utils/audio';
import Spinner from './Spinner';
import { PlayIcon, PauseIcon, XIcon, YukiSenseiIcon } from './icons';
import { useYuki } from './YukiGlobal'; // Use Global Context

interface YukiSenseiAssistantProps {
    lessonData: LessonExportData;
    onClose: () => void;
    arabicLanguage: Language;
    autoPlay?: boolean;
    currentStage: LessonStage;
}

// --- Helper for concurrency limit ---
async function pMap<T, R>(
    items: T[],
    mapper: (item: T, index: number) => Promise<R>,
    concurrency: number
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;
    const executing: Promise<void>[] = [];

    for (const item of items) {
        const currentIndex = index++;
        const p = Promise.resolve().then(() => mapper(item, currentIndex));
        results[currentIndex] = (p as any); 
        
        const e: Promise<void> = p.then((res) => {
            results[currentIndex] = res;
            executing.splice(executing.indexOf(e), 1);
        });
        executing.push(e);

        if (executing.length >= concurrency) {
            await Promise.race(executing);
        }
    }
    await Promise.all(executing);
    return results;
}

interface ScriptSegment {
    id: string;
    section: string;
    type: 'speech' | 'pause' | 'action';
    lang?: Language['code'] | 'ar';
    displayText?: string;
    speechText?: string;
    rateDirective?: string;
    actionType?: string;
}

const PlaybackControls: React.FC<{
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    playbackState: 'idle' | 'playing' | 'paused';
    isLoading: boolean;
}> = ({ onPlay, onPause, onStop, playbackState, isLoading }) => {
    return (
        <div className="flex items-center justify-center gap-2">
            {playbackState === 'playing' ? (
                <button onClick={onPause} disabled={isLoading} className="juicy-button from-orange-400 to-red-500 !p-2">
                    {isLoading ? <Spinner size="w-5 h-5"/> : <PauseIcon className="w-5 h-5" />}
                </button>
            ) : (
                <button onClick={onPlay} disabled={isLoading} className="juicy-button from-green-400 to-emerald-500 !p-2">
                     {isLoading ? <Spinner size="w-5 h-5"/> : <PlayIcon className="w-5 h-5" />}
                </button>
            )}
        </div>
    );
};

const YukiSenseiAssistant: React.FC<YukiSenseiAssistantProps> = ({ lessonData, onClose, arabicLanguage, autoPlay = false, currentStage }) => {
    const [script, setScript] = useState<string | null>(null);
    const [isLoadingScript, setIsLoadingScript] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
    const [displayText, setDisplayText] = useState('...');
    
    const { setSpeaking, setMessage, setTargetElement } = useYuki(); // Global Hooks

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const scriptSegmentsRef = useRef<Record<string, ScriptSegment[]>>({});
    const audioBuffersRef = useRef<Map<string, AudioBuffer | 'pause-3'>>(new Map());
    
    const currentSegmentIndexRef = useRef(0);
    const currentSectionSegmentsRef = useRef<ScriptSegment[]>([]);
    const timeoutRef = useRef<number | null>(null);
    const isComponentMounted = useRef(true);
    const hasPlayedIntro = useRef(false);

    const cleanupAudio = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        currentSourceRef.current?.stop();
        currentSourceRef.current = null;
        setSpeaking(false); // Stop global animation
    }, [setSpeaking]);

    // Initialize Audio Context
    useEffect(() => {
        isComponentMounted.current = true;
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            isComponentMounted.current = false;
            cleanupAudio();
            audioContextRef.current?.close();
        }
    }, [cleanupAudio]);

    // Fetch and Parse Script
    useEffect(() => {
        const fetchScript = async () => {
            try {
                setIsLoadingScript(true);
                const generatedScript = await generateYukiSenseiScript(lessonData);
                if (!isComponentMounted.current) return;
                setScript(generatedScript);

                const lines = generatedScript.split('\n').filter(line => line.trim() !== '');
                let currentSection = 'intro';
                const parsedSections: Record<string, ScriptSegment[]> = {};

                lines.forEach((line, idx) => {
                    const sectionMatch = line.match(/\[SECTION:(.*?)\]/);
                    if (sectionMatch) {
                        currentSection = sectionMatch[1].trim();
                        return;
                    }

                    const rawText = line.substring(line.indexOf(']') + 1).trim();

                    let segment: ScriptSegment = {
                        id: `${currentSection}-${idx}`,
                        section: currentSection,
                        type: 'speech',
                        displayText: rawText,
                        speechText: rawText
                    };

                    if (line.startsWith('[ACTION:')) {
                        const actionType = line.match(/\[ACTION:(.*?)\]/)?.[1];
                        segment.type = 'action';
                        segment.actionType = actionType;
                    } else if (line.startsWith('[ARABIC]')) {
                        segment.lang = 'ar';
                    } else if (line.startsWith('[TARGET_SLOW]')) {
                        segment.lang = lessonData.language.code;
                        segment.rateDirective = 'Say this at 0.5x speed: ';
                    } else if (line.startsWith('[TARGET_EXCITED]')) {
                        segment.lang = lessonData.language.code;
                        segment.rateDirective = 'Say this excitedly: ';
                    } else if (line.startsWith('[TARGET]')) {
                        segment.lang = lessonData.language.code;
                        segment.rateDirective = 'Say this at 0.75x speed: ';
                    } else if (line.startsWith('[PAUSE]')) {
                        segment.type = 'pause';
                    } else {
                         segment.lang = 'ar';
                    }

                    if (!parsedSections[currentSection]) parsedSections[currentSection] = [];
                    parsedSections[currentSection].push(segment);
                });
                
                scriptSegmentsRef.current = parsedSections;
                setIsLoadingScript(false);

            } catch (e) {
                if (isComponentMounted.current) setError((e as Error).message);
                setIsLoadingScript(false);
            }
        };
        fetchScript();
    }, [lessonData]);

    // Pre-fetch audio
    useEffect(() => {
        if (!script || isLoadingScript) return;

        const prepareAudio = async () => {
            const allSegments = Object.values(scriptSegmentsRef.current).flat() as ScriptSegment[];
            const speechSegments = allSegments.filter(s => s.type === 'speech');
            let loadedCount = 0;
            const total = speechSegments.length;

            allSegments.forEach(s => {
                if (s.type === 'pause') audioBuffersRef.current.set(s.id, 'pause-3');
            });

            await pMap(speechSegments, async (seg) => {
                 if (!isComponentMounted.current) return;
                 try {
                     const base64 = await generateSpeechFromText(`${seg.rateDirective || ''}${seg.speechText}`, seg.lang as any);
                     const rawBytes = decode(base64);
                     if (audioContextRef.current) {
                         const buffer = await decodeAudioData(rawBytes, audioContextRef.current, 24000, 1);
                         audioBuffersRef.current.set(seg.id, buffer);
                     }
                     loadedCount++;
                     setLoadingProgress(`Loading voice: ${Math.round((loadedCount/total)*100)}%`);
                 } catch (e) {
                     console.error("Audio gen failed for", seg.id, e);
                 }
            }, 5);
            
            setLoadingProgress('');
        };
        
        prepareAudio();
    }, [script, isLoadingScript]);

    const playSection = useCallback((sectionName: string) => {
        cleanupAudio();
        const segments = scriptSegmentsRef.current[sectionName] || [];
        currentSectionSegmentsRef.current = segments;
        currentSegmentIndexRef.current = 0;
        setPlaybackState('playing');
        
        const playNext = () => {
            if (!isComponentMounted.current) return;
            if (currentSegmentIndexRef.current >= currentSectionSegmentsRef.current.length) {
                setPlaybackState('idle');
                setDisplayText("...");
                setMessage(null);
                setSpeaking(false);
                return;
            }

            const segment = currentSectionSegmentsRef.current[currentSegmentIndexRef.current];
            
            if (segment.type === 'action') {
                // Trigger Global Movement Action
                if (segment.actionType === 'jump_text') {
                    setTargetElement('interactive-text-container');
                } else if (segment.actionType === 'climb_button') {
                    setTargetElement('game-options-container');
                }
                setTimeout(() => {
                    currentSegmentIndexRef.current++;
                    playNext();
                }, 1000);
                return;
            }

            setDisplayText(segment.displayText || '...');
            setMessage(segment.displayText || '...'); // Update global bubble

            if (segment.type === 'pause') {
                setSpeaking(false);
                timeoutRef.current = window.setTimeout(() => {
                    currentSegmentIndexRef.current++;
                    playNext();
                }, 3000);
            } else {
                const buffer = audioBuffersRef.current.get(segment.id);
                if (buffer && buffer instanceof AudioBuffer && audioContextRef.current) {
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextRef.current.destination);
                    source.onended = () => {
                        currentSourceRef.current = null;
                        currentSegmentIndexRef.current++;
                        playNext();
                    };
                    setSpeaking(true); // Start global animation
                    source.start();
                    currentSourceRef.current = source;
                } else {
                     currentSegmentIndexRef.current++;
                     playNext();
                }
            }
        };
        
        playNext();
    }, [cleanupAudio, setSpeaking, setMessage, setTargetElement]);

    useEffect(() => {
        if (isLoadingScript) return;
        
        let sectionToPlay = currentStage;
        if (currentStage === 'deck') sectionToPlay = 'deck';
        if (currentStage === 'practice') sectionToPlay = 'practice';

        if (currentStage === 'story' && !hasPlayedIntro.current) {
             playSection('intro');
             hasPlayedIntro.current = true;
        } else {
             playSection(sectionToPlay);
        }

    }, [currentStage, isLoadingScript, playSection]);

    const togglePlay = () => {
        if (playbackState === 'playing') {
            audioContextRef.current?.suspend();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setPlaybackState('paused');
            setSpeaking(false);
        } else if (playbackState === 'paused') {
            audioContextRef.current?.resume();
            setPlaybackState('playing');
            setSpeaking(true);
        } else {
             playSection(currentStage);
        }
    };

    return (
        <>
            {/* Control Panel only */}
            <div className="fixed bottom-4 right-4 z-50 w-80 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border-2 border-pink-300 flex flex-col overflow-hidden transition-all duration-300">
                <div className="bg-pink-100 p-2 flex justify-between items-center border-b border-pink-200">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full border border-white overflow-hidden bg-white">
                            <YukiSenseiIcon />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-pink-800">Yuki-Sensei Control</h4>
                            <p className="text-xs text-pink-600">{loadingProgress || (playbackState === 'playing' ? 'Speaking...' : 'Ready')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-pink-400 hover:text-pink-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-4 bg-white min-h-[60px] flex flex-col justify-center items-center text-center">
                    {error ? (
                        <p className="text-red-500 text-xs">{error}</p>
                    ) : (
                        <p className="text-slate-700 font-medium text-sm">{displayText}</p>
                    )}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-center">
                     <PlaybackControls 
                        onPlay={togglePlay} 
                        onPause={togglePlay} 
                        onStop={cleanupAudio} 
                        playbackState={playbackState} 
                        isLoading={!!loadingProgress} 
                     />
                </div>
            </div>
        </>
    );
};

export default YukiSenseiAssistant;
