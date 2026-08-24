
import React, { useState, useEffect, useRef } from 'react';
import { SpeakerIcon, StopIcon } from './icons';
import { Language } from '../types';
import { generateSpeechFromText } from '../services/ai';
import { playAudioFromBase64, speakTextBrowser } from '../utils/audio';
import Spinner from './Spinner';

interface TTSButtonProps {
    text: string;
    language: Language;
    nativeText?: string | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const TTSButton: React.FC<TTSButtonProps> = ({ text, language, nativeText, className = "", size = 'md' }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stop = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e) {}
            sourceRef.current = null;
        }
        setStatus('idle');
    };

    useEffect(() => {
        return () => stop();
    }, []);

    const toggleSpeech = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (status === 'playing' || status === 'loading') {
            stop();
            return;
        }

        const textToRead = nativeText || text;
        if (!textToRead) return;

        setStatus('loading');

        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // USE AI MODEL
            const base64 = await generateSpeechFromText(textToRead, language.code, 1.0);
            
            setStatus('playing');
            sourceRef.current = await playAudioFromBase64(base64, audioContextRef.current, () => {
                setStatus('idle');
            });

        } catch (error) {
            console.error("AI TTS error, falling back:", error);
            // FALLBACK TO BROWSER
            speakTextBrowser(textToRead, language, 1.0, null, () => setStatus('idle'));
            setStatus('playing');
        }
    };

    // Styling
    const sizeClasses = {
        sm: "w-7 h-7 p-1.5",
        md: "w-9 h-9 p-2",
        lg: "w-12 h-12 p-3"
    };

    return (
        <button
            onClick={toggleSpeech}
            className={`rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border ${className} 
                ${status !== 'idle'
                    ? 'bg-pink-100 text-pink-600 border-pink-300 ring-2 ring-pink-200' 
                    : 'bg-white text-purple-600 hover:bg-purple-50 hover:text-pink-500 border-purple-100'
                } ${sizeClasses[size]}`}
            title={status === 'playing' ? "إيقاف" : "استمع"}
        >
            {status === 'loading' ? (
                <Spinner size="w-full h-full" />
            ) : status === 'playing' ? (
                <StopIcon className="w-full h-full" />
            ) : (
                <SpeakerIcon className="w-full h-full" />
            )}
        </button>
    );
};

export default TTSButton;
