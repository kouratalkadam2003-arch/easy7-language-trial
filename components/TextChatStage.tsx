
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { StoryContentType, TextChatContentType, TextChatMessage, Language, Flashcard } from '../types';
import { LoadingDisplay, ErrorDisplay } from './Spinner';
import { CopyIcon } from './icons';
import AIAudioPlayer from './AIAudioPlayer';
import { VOICE_POOLS, FIXED_CHARACTERS } from '../constants';

interface TextChatStageProps {
    storyContent: StoryContentType | null;
    chatContent: TextChatContentType | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    language: Language; 
    flashcards?: Flashcard[];
    nativeLanguage: Language;
    level: string;
}

const UI_TEXTS_AR = {
    generating: "جاري كتابة المحادثة...",
    error: "حدث خطأ أثناء إنشاء المحادثة.",
    retry: "حاول مرة أخرى",
    pronunciation: "النطق",
    translation: "الترجمة",
    vocabTitle: "المفردات الأساسية",
    grammarTitle: "نصيحة نحو/قواعد",
};

// Using avatars from the provided screenshot
const speakerAvatars: Record<string, string> = {
    'Ali': 'https://i.imgur.com/sJZ5I7i.png',
    'Lukas': 'https://i.imgur.com/1uL8m2A.png',
    'Herr Schmidt': 'https://i.imgur.com/n42rA5h.png'
};

const defaultAvatarA = 'https://i.imgur.com/sJZ5I7i.png';
const defaultAvatarB = 'https://i.imgur.com/1uL8m2A.png';

// Helper to deterministically pick a voice from the pool based on name hash, OR return fixed voice
const getVoiceForSpeaker = (name: string, gender: 'male' | 'female' | string, languageCode: string): string => {
    // 1. Check Fixed Characters First
    const fixedChars = FIXED_CHARACTERS[languageCode];
    if (fixedChars) {
        if (fixedChars.A.name === name) return fixedChars.A.voice;
        if (fixedChars.B.name === name) return fixedChars.B.voice;
    }

    // 2. Fallback to pool based on gender/hash
    const pool = (gender === 'female' || gender === 'woman') ? VOICE_POOLS.female : VOICE_POOLS.male;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return pool[Math.abs(hash) % pool.length];
};

const RobotAvatar = () => (
    <div className="w-12 h-12 relative flex-shrink-0">
        <div className="absolute inset-0 bg-white rounded-full shadow-lg border border-purple-50 flex items-center justify-center overflow-hidden">
            <div className="w-10 h-6 bg-purple-900 rounded-full relative flex items-center justify-center gap-1.5 shadow-inner">
                {/* Glowing rings around eyes */}
                <div className="absolute inset-0 rounded-full opacity-50 blur-[2px]" style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #A855F7 100%)' }}></div>
                <div className="w-2.5 h-2.5 bg-white rounded-full z-10"></div>
                <div className="w-2.5 h-2.5 bg-white rounded-full z-10"></div>
            </div>
        </div>
    </div>
);

const ChatBubble: React.FC<{ message: TextChatMessage; language: Language; isLast: boolean }> = ({ message, language, isLast }) => {
    const isBot = message.speaker === 'A'; // Speaker A is the Bot/Advisor
    
    // Determine voice
    const voiceName = useMemo(() => {
        const gender = message.gender || (isBot ? 'female' : 'male'); 
        return getVoiceForSpeaker(message.speakerName, gender, language.code);
    }, [message.speakerName, message.gender, isBot, language.code]);

    return (
        <div className={`flex flex-col mb-4 ${isBot ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-2 max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                {isBot && <RobotAvatar />}
                
                <div className="flex flex-col shadow-sm">
                    <div className={`px-5 py-3 rounded-3xl text-lg font-medium relative group ${
                        isBot 
                        ? 'bg-white text-purple-800 rounded-tl-none border border-purple-50' 
                        : 'bg-[#1C2C5E] text-white rounded-tr-none'
                    }`}>
                        <div className="flex flex-col gap-1">
                            <p className="text-left leading-relaxed" dir="ltr">{message.text}</p>
                            
                            {/* Translations/Pronunciation - subtle toggle or just small text */}
                            <div className={`text-xs mt-2 border-t pt-1 space-y-0.5 ${isBot ? 'text-slate-400 border-purple-50' : 'text-purple-200/60 border-purple-200/20'}`} dir="rtl">
                                <p><span className="font-bold">{UI_TEXTS_AR.pronunciation}:</span> {message.pronunciation}</p>
                                <p><span className="font-bold">{UI_TEXTS_AR.translation}:</span> {message.translation}</p>
                            </div>
                        </div>

                        {/* Audio Player Button - Miniaturized */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isBot ? '-right-10' : '-left-10'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                             <AIAudioPlayer 
                                text={message.text} 
                                language={language} 
                                voiceName={voiceName}
                                className="scale-75 shadow-md bg-white rounded-full p-1" 
                                useBrowserTTS={false}
                            />
                        </div>
                    </div>
                    {isBot && <span className="text-[10px] text-slate-400 mt-1 ml-2 font-bold">{message.speakerName}</span>}
                </div>
            </div>
        </div>
    );
};

const TextChatStage: React.FC<TextChatStageProps> = ({
    storyContent,
    chatContent,
    isLoading,
    error,
    onRetry,
    language,
    flashcards,
    nativeLanguage,
    level
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<TextChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);

    useEffect(() => {
        if (chatContent && chatContent.messages && messages.length === 0) {
            setMessages(chatContent.messages);
        }
    }, [chatContent, messages.length]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isBotTyping]);

    const handleSend = async () => {
        if (!inputText.trim() || isBotTyping || !nativeLanguage || !level) return;
        
        const userMsg: TextChatMessage = {
            speaker: 'B',
            speakerName: 'ليث',
            text: inputText,
            pronunciation: '', 
            translation: '',
            gender: 'male'
        };
        
        const currentHistory = [...messages];
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsBotTyping(true);
        
        try {
            // Need to import sendTextChatMessage from '../services/ai'
            // For now, doing it dynamically or if it's imported at top
            const { sendTextChatMessage } = await import('../services/ai');
            const aiResponse = await sendTextChatMessage(currentHistory, userMsg.text, language, nativeLanguage, level);
            const botMsg: TextChatMessage = {
                speaker: 'A',
                speakerName: 'إيلي',
                text: aiResponse.text,
                pronunciation: aiResponse.pronunciation || '',
                translation: aiResponse.translation || '',
                gender: 'female' 
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (e) {
            console.error(e);
            // Revert message on error (optional)
        } finally {
            setIsBotTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    if (isLoading) return <LoadingDisplay text={UI_TEXTS_AR.generating} />;
    if (error || !chatContent || !storyContent) return <ErrorDisplay errorText={UI_TEXTS_AR.error} retryText={UI_TEXTS_AR.retry} onRetry={onRetry} />;

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden" dir="rtl">
            <div className="flex-1 overflow-y-auto px-4 py-8 relative custom-scrollbar pb-32">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Welcome Hint */}
                    <div className="text-center mb-8">
                        <p className="inline-block px-4 py-1.5 bg-purple-100/50 text-purple-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex flex-col pb-10">
                        {messages.map((message, index) => (
                            <ChatBubble 
                                key={index} 
                                message={message} 
                                language={language} 
                                isLast={index === messages.length - 1} 
                            /> 
                        ))}
                        {isBotTyping && (
                            <div className="flex items-center gap-2 text-slate-400 mt-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Educational Info - Vocabulary & Grammar */}
                    <div className="space-y-6">
                        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 shadow-sm">
                            <h3 className="text-xl font-black text-purple-800 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-amber-100 rounded-xl text-lg">📙</span>
                                {UI_TEXTS_AR.vocabTitle}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {(()=>{
                                    let vocabList = (storyContent.basicVocabulary || []).map(item => ({
                                        word: item.word,
                                        translation: item.translation,
                                        isHard: false
                                    }));
                                    
                                    if (flashcards && flashcards.length > 0) {
                                        const difficultyWeight: Record<string, number> = { 'again': 1, 'hard': 2, 'new': 3, 'good': 4, 'easy': 5 };
                                        const sortedFlashcards = [...flashcards].sort((a, b) => {
                                            const weightA = difficultyWeight[a.status] || 99;
                                            const weightB = difficultyWeight[b.status] || 99;
                                            const diff = weightA - weightB;
                                            if (diff !== 0) return diff;
                                            return (parseInt(a.id) || 0) - (parseInt(b.id) || 0);
                                        });
                                        vocabList = sortedFlashcards.map(card => ({
                                            word: card.originalText,
                                            translation: card.translation,
                                            isHard: card.status === 'hard' || card.status === 'again'
                                        }));
                                    }

                                    return vocabList.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-purple-50/50 group hover:shadow-md transition-all">
                                            <span className="text-purple-500 font-medium">{item.translation}</span>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-lg font-bold ${item.isHard ? 'text-orange-600' : 'text-purple-800'}`} dir="ltr">{item.word}</span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        <div className="bg-[#1C2C5E] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2 relative z-10">
                                <span className="p-2 bg-purple-500/30 rounded-xl text-lg">✨</span>
                                {storyContent.grammarTip?.title}
                            </h3>
                            <p className="text-purple-100 leading-relaxed font-medium relative z-10">{storyContent.grammarTip?.tip}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Chat Input */}
            <div className="absolute bottom-0 left-0 w-full bg-white border-t p-4 z-40">
                <div className="max-w-3xl mx-auto flex gap-2 items-center relative">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="اكتب ردك هنا..."
                        className="flex-1 bg-slate-100 rounded-full px-6 py-4 text-lg outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                        dir="auto"
                        disabled={isBotTyping}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!inputText.trim() || isBotTyping}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-full w-14 h-14 flex items-center justify-center transition-colors"
                    >
                        <span className="text-xl rotate-180">➤</span>
                    </button>
                </div>
                {messages.length >= 3 && (
                    <div className="mt-4 flex justify-center pb-2">
                        <button 
                            onClick={(e) => {
                                const evt = new CustomEvent('yuki-next-stage');
                                window.dispatchEvent(evt);
                            }} 
                            className="text-sm font-bold text-slate-500 hover:text-slate-800 underline transition-colors"
                        >
                            إنهاء المحادثة والانتقال للتالي
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default TextChatStage;