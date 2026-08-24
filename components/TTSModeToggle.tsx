import React, { useState, useEffect } from 'react';
import { getTTSMode, setTTSMode, TTSMode } from '../utils/audio';

export const TTSModeToggle: React.FC = () => {
    const [mode, setMode] = useState<TTSMode>(getTTSMode());

    useEffect(() => {
        const handleModeChange = () => {
            setMode(getTTSMode());
        };
        window.addEventListener('ttsModeChanged', handleModeChange);
        return () => window.removeEventListener('ttsModeChanged', handleModeChange);
    }, []);

    const toggleMode = () => {
        const newMode = mode === 'hq' ? 'standard' : 'hq';
        setTTSMode(newMode);
    };

    return (
        <button 
            onClick={toggleMode}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm font-bold transition-colors ${
                mode === 'hq' 
                ? 'bg-purple-100 border-purple-300 text-purple-800' 
                : 'bg-purple-50 border-slate-300 text-purple-600'
            }`}
            title={mode === 'hq' ? 'High Quality AI Voice Enabled' : 'Standard Browser Voice Enabled'}
        >
            {mode === 'hq' ? (
                <>
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                    </svg>
                    <span>HQ Voice</span>
                </>
            ) : (
                <>
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span>Standard</span>
                </>
            )}
        </button>
    );
};
