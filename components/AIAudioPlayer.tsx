
import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Language } from '../types';
import { PlayIcon, PauseIcon } from './icons';
import { liveTTS } from '../services/liveTTS';
import { cleanTextFromScriptLabels } from '../services/ai';
import Spinner from './Spinner';
import { speakText, stopSpeech } from '../utils/audio';

export interface AIAudioPlayerHandle {
    play: () => void;
    pause: () => void;
    seekToPercent: (percent: number) => void;
    seekToTime: (time: number) => void;
    getDuration: () => number;
}

interface AIAudioPlayerProps {
    text: string;
    language: Language;
    className?: string;
    speechText?: string | null; // This is the "Native Script" (Kanji/Hanzi)
    voiceName?: string;
    useBrowserTTS?: boolean; // Deprecated/Ignored
    onWordIndexChange?: (index: number) => void;
    shouldPreload?: boolean;
}

type PlayMode = 'none' | 'live' | 'hq' | 'standard';

const AIAudioPlayer = forwardRef<AIAudioPlayerHandle, AIAudioPlayerProps>((props, ref) => {
    const { 
        text, 
        language, 
        className = "", 
        speechText, 
        onWordIndexChange 
    } = props;

    const [playingMode, setPlayingMode] = useState<PlayMode>('none');
    const [loadingMode, setLoadingMode] = useState<PlayMode>('none');
    const [speed, setSpeed] = useState(1.0);

    // -------------------------------------------------------------------------
    // CORE LOGIC: Text Selection & Cleaning
    // -------------------------------------------------------------------------
    const contentToSpeak = useMemo(() => {
        let rawText = text;
        if (speechText && speechText.trim().length > 0) {
            rawText = speechText;
        }
        return cleanTextFromScriptLabels(rawText);
    }, [text, speechText]);

    // Check if we need to show dual script (only for JA/ZH when scripts differ)
    const showNativeScript = (language.code === 'ja' || language.code === 'zh') && 
                             speechText && 
                             speechText.trim() !== text.trim();

    useEffect(() => {
        // Stop playback if content changes
        stopAll();
    }, [contentToSpeak, language.code]);

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
        if (onWordIndexChange) onWordIndexChange(-1);
    };

    const handlePlayLive = async () => {
        try {
            setLoadingMode('live');
            
            // Check connection first
            if (!liveTTS.isConnected) {
                await liveTTS.connect(language);
            }
            
            setLoadingMode('none');
            setPlayingMode('live');
            
            // Speak using Live API
            await liveTTS.speak(contentToSpeak, speed);
            
            // Auto-reset playing state after a rough estimate, 
            // since Live API doesn't give a precise "ended" event for the stream easily.
            // Estimate: 5 chars per second (very rough) + 2s buffer
            const estimatedDuration = Math.max(3000, (contentToSpeak.length / 5) * 1000);
            setTimeout(() => {
                setPlayingMode(prev => prev === 'live' ? 'none' : prev);
            }, estimatedDuration);

        } catch (error) {
            console.error("Live TTS Failed", error);
            setLoadingMode('none');
            setPlayingMode('none');
            alert("فشل الاتصال بخدمة الصوت المباشر. يرجى المحاولة مرة أخرى.");
        }
    };

    const handlePlayHQ = async () => {
        setLoadingMode('hq');
        try {
            await speakText(text, language, speed, speechText, () => {
                setPlayingMode(prev => prev === 'hq' ? 'none' : prev);
            }, 'hq');
            setLoadingMode('none');
            setPlayingMode('hq');
        } catch (e) {
            console.error("HQ Play Failed", e);
            setLoadingMode('none');
            setPlayingMode('none');
        }
    };

    const handlePlayStandard = async () => {
        setLoadingMode('standard');
        try {
            await speakText(text, language, speed, speechText, () => {
                setPlayingMode(prev => prev === 'standard' ? 'none' : prev);
            }, 'standard');
            setLoadingMode('none');
            setPlayingMode('standard');
        } catch (e) {
            console.error("Standard Play Failed", e);
            setLoadingMode('none');
            setPlayingMode('none');
        }
    };

    const togglePlayMode = (mode: 'live' | 'hq' | 'standard') => {
        if (playingMode === mode) {
            stopAll();
        } else {
            stopAll();
            if (mode === 'live') handlePlayLive();
            else if (mode === 'hq') handlePlayHQ();
            else if (mode === 'standard') handlePlayStandard();
        }
    };

    const changeSpeed = (newSpeed: number) => {
        setSpeed(newSpeed);
        if (playingMode !== 'none') {
            const currentMode = playingMode;
            stopAll();
            // Optional: Auto-restart with new speed? 
            // For now, let user press play again to avoid complexity.
        }
    };

    useImperativeHandle(ref, () => ({
        play: () => togglePlayMode('live'),
        pause: stopAll,
        seekToPercent: () => {}, // Not supported in Live Stream
        seekToTime: () => {}, // Not supported in Live Stream
        getDuration: () => 0 // Unknown in Live Stream
    }));

    return (
        <button
            onClick={() => togglePlayMode('hq')}
            disabled={loadingMode !== 'none' && loadingMode !== 'hq'}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all shadow-sm transform active:scale-95 shrink-0 ${className}
                ${playingMode === 'hq' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-500 hover:bg-purple-600'}
                ${loadingMode === 'hq' ? 'opacity-70 cursor-not-allowed' : ''}`}
            title="Play Audio"
        >
            {loadingMode === 'hq' ? <Spinner size="h-4 w-4 text-white" /> : (
                playingMode === 'hq' ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />
            )}
        </button>
    );
});

export default AIAudioPlayer;
