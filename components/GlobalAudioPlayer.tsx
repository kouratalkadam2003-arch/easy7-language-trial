import React, { useState, useEffect, useRef } from 'react';
import { useGlobalAudio } from './GlobalAudioContext';
import { PlayIcon, PauseIcon } from './icons';
import { liveTTS } from '../services/liveTTS';
import { speakText, stopSpeech } from '../utils/audio';
import Spinner from './Spinner';
import { Language } from '../types';

interface GlobalAudioPlayerProps {
    language: Language;
}

type PlayMode = 'none' | 'live' | 'hq' | 'standard';

const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({ language }) => {
    const { mainAudio, repeatCount, setRepeatCount, speed, setSpeed, setIsPlaying, togglePlayRef, engine, setEngine } = useGlobalAudio();
    const [playingMode, setPlayingMode] = useState<PlayMode>('none');
    const [loadingMode, setLoadingMode] = useState<PlayMode>('none');

    useEffect(() => {
        setIsPlaying(playingMode !== 'none');
    }, [playingMode, setIsPlaying]);

    useEffect(() => {
        stopAll();
    }, [mainAudio?.text, language.code]);

    useEffect(() => {
        return () => {
            stopAll();
        };
    }, []);

    const stopAll = () => {
        if (liveTTS.isConnected) {
            liveTTS.stop();
        }
        stopSpeech();
        setPlayingMode('none');
        setLoadingMode('none');
        if (mainAudio?.onWordIndexChange) mainAudio.onWordIndexChange(-1);
    };

    const playWithEngine = async (engine: PlayMode, currentRepeat: number) => {
        if (!mainAudio) return;
        if (currentRepeat <= 0) {
            setPlayingMode('none');
            return;
        }

        const contentToSpeak = mainAudio.speechText && mainAudio.speechText.trim().length > 0 
            ? mainAudio.speechText 
            : mainAudio.text;

        try {
            setLoadingMode(engine);
            if (engine === 'live') {
                if (!liveTTS.isConnected) await liveTTS.connect(language);
                setLoadingMode('none');
                setPlayingMode('live');
                await liveTTS.speak(contentToSpeak, speed);
                
                const estimatedDuration = Math.max(3000, (contentToSpeak.length / 5) * 1000);
                setTimeout(() => {
                    playWithEngine(engine, currentRepeat - 1);
                }, estimatedDuration);
            } else {
                await speakText(mainAudio.text, language, speed, mainAudio.speechText, () => {
                    playWithEngine(engine, currentRepeat - 1);
                }, engine as 'hq' | 'standard');
                setLoadingMode('none');
                setPlayingMode(engine);
            }
        } catch (e) {
            console.error("Play Failed", e);
            setLoadingMode('none');
            setPlayingMode('none');
        }
    };

    const handlePlayPause = () => {
        if (playingMode !== 'none') {
            stopAll();
        } else {
            playWithEngine(engine, repeatCount);
        }
    };

    useEffect(() => {
        togglePlayRef.current = handlePlayPause;
    }, [handlePlayPause, togglePlayRef]);

    if (!mainAudio) return null;

    return (
        <div className="w-full bg-white/90 backdrop-blur-md border border-purple-100 rounded-2xl shadow-lg p-3 flex items-center justify-between gap-4" dir="ltr">
            {/* Left: Speed Control */}
            <div className="flex items-center gap-1 bg-purple-50/80 p-1 rounded-xl shrink-0 border border-purple-100/50">
                {[0.75, 1.0, 1.25].map((s) => (
                    <button 
                        key={s}
                        onClick={() => setSpeed(s)} 
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 ${
                            speed === s 
                                ? 'bg-purple-600 text-white shadow-sm scale-105' 
                                : 'text-purple-500 hover:bg-white hover:text-purple-600'
                        }`}
                    >
                        {s}x
                    </button>
                ))}
            </div>

            {/* Middle: Play & Engine Select */}
            <div className="flex items-center gap-3 flex-1 justify-center">
                <div className="relative group">
                    <button
                        onClick={handlePlayPause}
                        disabled={loadingMode !== 'none'}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 active:scale-90 hover:scale-105 ${
                            playingMode !== 'none' 
                                ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                                : 'bg-gradient-to-br from-purple-500 to-purple-600'
                        }`}
                    >
                        {loadingMode !== 'none' ? (
                            <Spinner size="h-6 w-6 text-white" />
                        ) : (
                            playingMode !== 'none' ? (
                                <PauseIcon className="w-6 h-6" />
                            ) : (
                                <PlayIcon className="w-6 h-6 ml-1" />
                            )
                        )}
                    </button>
                </div>
                
                <div className="hidden sm:block">
                    <select 
                        value={engine}
                        onChange={(e) => setEngine(e.target.value as any)}
                        className="bg-white border border-purple-100 text-purple-700 text-[10px] font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                        <option value="hq">AI Voice (HQ)</option>
                        <option value="live">Live API</option>
                        <option value="standard">Google TTS</option>
                    </select>
                </div>
            </div>

            {/* Right: Repeat Control */}
            <div className="flex items-center gap-2 bg-purple-50/80 p-1.5 rounded-xl shrink-0 border border-purple-100/50">
                <span className="text-[10px] font-black text-slate-400 ml-1">REPEAT</span>
                <div className="flex items-center bg-white rounded-lg border border-purple-100 px-2 py-1 shadow-sm">
                    <button 
                        onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}
                        className="text-purple-600 hover:text-purple-800 font-black px-1"
                    >
                        -
                    </button>
                    <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-6 text-center font-black text-xs text-purple-800 outline-none bg-transparent"
                    />
                    <button 
                        onClick={() => setRepeatCount(Math.min(10, repeatCount + 1))}
                        className="text-purple-600 hover:text-purple-800 font-black px-1"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalAudioPlayer;
