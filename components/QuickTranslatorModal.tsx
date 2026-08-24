
import React, { useState } from 'react';
import { Language } from '../types';
import { quickTranslate, QuickTranslationResult } from '../services/ai';
import AIAudioPlayer from './AIAudioPlayer';
import Spinner from './Spinner';
import { CopyIcon, XIcon } from './icons';

interface QuickTranslatorModalProps {
    language: Language;
    onClose: () => void;
}

const UI_TEXTS = {
    title: "✨ تشينغو",
    placeholder: "اكتب أي كلمة أو جملة...",
    translate: "ترجم",
    close: "إغلاق",
    script: "النص الأصلي:",
};

export const QuickTranslatorModal: React.FC<QuickTranslatorModalProps> = ({ language, onClose }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<QuickTranslationResult | null>(null);

    const handleTranslate = async () => {
        if (!input.trim() || loading) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await quickTranslate(input, language);
            setResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-purple-900/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-4 border-white animate-slideUp" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-2xl">🪄</span>
                        {UI_TEXTS.title} ({language.name})
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                            placeholder={UI_TEXTS.placeholder}
                            className="w-full border-2 border-purple-100 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all"
                            autoFocus
                        />
                        <button 
                            onClick={handleTranslate}
                            disabled={loading || !input.trim()}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Spinner size="w-5 h-5 text-white" /> : UI_TEXTS.translate}
                        </button>
                    </div>

                    {result && (
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 animate-fadeIn">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-purple-900 leading-relaxed" dir="ltr">{result.targetText}</p>
                                    <p className="text-lg text-purple-600 mt-1 font-medium">{result.meaning}</p>
                                </div>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(`${result.targetText} - ${result.meaning}`)}
                                    className="p-2 text-purple-300 hover:text-purple-600 transition-colors"
                                >
                                    <CopyIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Audio Player */}
                            <div className="bg-white rounded-lg p-2 shadow-sm border border-purple-100">
                                <AIAudioPlayer 
                                    text={result.targetText}
                                    speechText={result.audioScript} 
                                    language={language}
                                    className="scale-95 origin-center !bg-transparent !border-none !p-0"
                                    useBrowserTTS={false} 
                                />
                            </div>

                            {/* Script Hint (Only if different) */}
                            {result.audioScript && result.audioScript !== result.targetText && (
                                <div className="mt-3 text-xs text-purple-400 font-mono text-center border-t border-purple-200 pt-2">
                                    {UI_TEXTS.script} <span className="font-bold">{result.audioScript}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
