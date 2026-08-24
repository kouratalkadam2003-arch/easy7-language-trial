import React, { useEffect, useState } from 'react';
import { Language } from '../types';

interface VoiceSelectorProps {
    language: Language;
    selectedVoice: SpeechSynthesisVoice | null;
    onVoiceChange: (voice: SpeechSynthesisVoice | null) => void;
    className?: string;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ language, selectedVoice, onVoiceChange, className }) => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const allVoices = window.speechSynthesis.getVoices();
            // Filter voices for the target language (loose match)
            const filtered = allVoices.filter(v => v.lang.startsWith(language.code));
            setVoices(filtered);
            
            // Auto-select best voice if none selected
            if (!selectedVoice && filtered.length > 0) {
                 let best = filtered.find(v => v.name.includes('Google') && v.lang === language.code); // Exact match Google
                 if (!best) best = filtered.find(v => v.lang === language.code); // Exact match
                 if (!best) best = filtered[0]; // First available
                 
                 // Auto-call onVoiceChange to ensure a voice is actually selected
                 onVoiceChange(best);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [language, selectedVoice, onVoiceChange]);

    if (voices.length === 0) return null;

    return (
        <select
            className={`text-sm border-gray-300 rounded-md shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 ${className}`}
            value={selectedVoice?.voiceURI || ''}
            onChange={(e) => {
                const voice = voices.find(v => v.voiceURI === e.target.value) || null;
                onVoiceChange(voice);
            }}
        >
            {voices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                </option>
            ))}
        </select>
    );
};

export default VoiceSelector;
