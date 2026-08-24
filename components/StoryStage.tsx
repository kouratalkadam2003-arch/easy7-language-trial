import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Language, StoryContentType, Topic } from '../types';
import { LoadingDisplay, ErrorDisplay } from './Spinner';
import InteractiveText from './InteractiveText';
import { DownloadIcon, CopyIcon, RefreshIcon, SpeakerIcon, PlayIcon, PauseIcon, XIcon, BookmarkIcon, RotateCcwIcon, RotateCwIcon, ChevronRightIcon, BookIcon, RepeatIcon } from './icons';
import { downloadStoryAsImage } from '../utils/imageExport';
import { LessonViewProps } from './LessonView';
import AIAudioPlayer from './AIAudioPlayer';
import { generateSpeechFromText } from '../services/ai';
import { processAudioForDownload, speakText, stopSpeech } from '../utils/audio';
import Spinner from './Spinner';
import { TEACHER_PERSONAS } from '../constants';
import { useGlobalAudio } from './GlobalAudioContext';
import VoiceSelector from './VoiceSelector';

interface StoryStageProps extends Omit<LessonViewProps, 'previousTopics' | 'onCompleteLesson' | 'onUpdateReview' | 'onClearCacheKey'> {
    story: StoryContentType | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onRegenerate: () => void;
    onNextStage?: () => void;
    previousTopics: Topic[];
    selectedVoice?: SpeechSynthesisVoice | null;
    initialMode?: 'read' | 'listen';
}

const UI_TEXTS_AR = {
    error: "حدث خطأ أثناء إنشاء المحتوى. حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
    generating: "جاري إنشاء المحتوى...",
    regenerate: "إعادة إنشاء النص",
    downloadAudio: "تحميل صوتي",
    downloading: "جاري التحميل..."
};

const StorySkeleton: React.FC = () => (
    <div className="p-2 sm:p-6 h-full overflow-hidden animate-pulse" dir="rtl">
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 h-32">
                <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-amber-200 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-amber-200 rounded w-3/4"></div>
                    <div className="h-4 bg-amber-200 rounded w-full"></div>
                    <div className="h-4 bg-amber-200 rounded w-5/6"></div>
                </div>
            </div>
            <div className="bg-[#f0e9dc] p-4 rounded-xl shadow-sm border border-[#cfc6b5] h-64">
                <div className="flex justify-between items-center mb-4 border-b border-[#cfc6b5] pb-2">
                     <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-[#cfc6b5] rounded-full"></div>
                        <div className="h-4 bg-[#cfc6b5] rounded w-24"></div>
                     </div>
                </div>
                <div className="h-10 bg-[#e8e1d4] rounded mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-[#e8e1d4] rounded w-full"></div>
                    <div className="h-4 bg-[#e8e1d4] rounded w-11/12"></div>
                    <div className="h-4 bg-[#e8e1d4] rounded w-full"></div>
                    <div className="h-4 bg-[#e8e1d4] rounded w-4/5"></div>
                </div>
            </div>
        </div>
    </div>
);

const VocabModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    words: {word: string, translation: string}[];
    expressions: {phrase: string, translation: string}[];
    language: Language;
    voiceName?: string;
}> = ({ isOpen, onClose, words, expressions, language, voiceName }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="card-paper w-full max-w-md flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300 overflow-hidden">
                <div className="p-5 border-b border-[#cfc6b5] flex justify-between items-center bg-[#e8e1d4]">
                    <h3 className="font-cafe font-black text-xl text-[#1a1410]">المفردات والعبارات</h3>
                    <button onClick={onClose} className="p-2 bg-[#cfc6b5]/50 hover:bg-[#cfc6b5] rounded-full transition-colors text-[#1a1410]">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto space-y-8 no-scrollbar">
                    {words && words.length > 0 && (
                        <div>
                            <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest text-center">New Vocabulary</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {words.map((w, i) => (
                                    <div key={i} className="bg-white border border-[#cfc6b5] rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => speakText(w.word, language, 1, w.word, undefined, 'hq', undefined)}>
                                        <div className="font-bold text-[#1a1410] text-lg mb-1">{w.word} <SpeakerIcon className="w-3 h-3 inline text-amber-600 opacity-50"/></div>
                                        <div className="text-sm font-medium text-amber-700">{w.translation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {expressions && expressions.length > 0 && (
                        <div>
                            <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest text-center">Additional Expressions</h4>
                            <div className="space-y-3">
                                {expressions.map((e, i) => (
                                    <div key={i} className="bg-white border border-[#cfc6b5] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group" onClick={() => speakText(e.phrase, language, 1, e.phrase, undefined, 'hq', undefined)}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Expression</div>
                                        <div className="font-black text-[#1a1410] text-xl mb-2 leading-tight" dir="ltr">{e.phrase}</div>
                                        <div className="text-base font-bold text-amber-700">{e.translation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StoryStage: React.FC<StoryStageProps> = (props) => {
    const { language, topic, story, isLoading, error, onRetry, onRegenerate } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const { setMainAudio, isPlaying, togglePlay, speed, setSpeed, repeatCount, setRepeatCount, engine, setEngine } = useGlobalAudio();
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
    
    // UI State
    const [tab, setTab] = useState<'listen' | 'read' | 'vocab'>(props.initialMode === 'listen' ? 'listen' : 'read');
    const [popup, setPopup] = useState<'speed' | 'repeat' | 'volume' | null>(null);
    const [trans, setTrans] = useState(false);
    const [localSelectedVoice, setLocalSelectedVoice] = useState<SpeechSynthesisVoice | null>(props.selectedVoice || null);

    const teacher = TEACHER_PERSONAS[language.code] || TEACHER_PERSONAS['en'];
    const voiceName = localSelectedVoice?.name || teacher.voiceName;

    // Use CSS variables from design system
    const colors = {
      G: 'var(--color-stage-review)',       // Green for review/stage
      G_rgb: '61, 90, 62',                  // RGB for rgba()
      BG: 'var(--color-app-bg)',             // Parchment background
      CARD: 'var(--color-cream-bg)',         // Card background
      BD: 'var(--color-path-color)',         // Border color
    } as const;

    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];
    const REPEATS = [1, 2, 3, 5];

    useEffect(() => {
        if (story) {
            setMainAudio({
                text: story.originalText,
                speechText: story.nativeScriptText,
                voiceName: voiceName,
                onWordIndexChange: setCurrentWordIndex
            });
        }
        return () => setMainAudio(null);
    }, [story, voiceName, setMainAudio]);

    const cleanWordList = useMemo(() => {
        if (!story?.wordList) return [];
        return story.wordList.map(item => {
            if (!item || !item.word) return item;
            if (item.word.includes('native_script:') || item.word.includes('translation:')) {
                const parts = item.word.split(';');
                const realWord = parts[0].trim();
                let native = item.native_script;
                const nativePart = parts.find(p => p.trim().includes('native_script:'));
                if (nativePart && nativePart.includes(':')) native = nativePart.split(':')[1].trim();
                let translation = item.translation;
                const transPart = parts.find(p => p.trim().includes('translation:') || p.trim().includes('translat'));
                if (transPart && transPart.includes(':')) translation = transPart.split(':')[1].trim();
                return { word: realWord, native_script: native || realWord, translation: translation || '' };
            }
            return item;
        });
    }, [story]);

    const toggle = (k: any) => setPopup(p => p === k ? null : k);

    if (isLoading) return <StorySkeleton />;
    if (error) return <ErrorDisplay errorText={UI_TEXTS_AR.error} retryText={UI_TEXTS_AR.retry} onRetry={onRetry} />;
    if (!story) return <div className="p-4 text-center">انقر فوق علامة تبويب لبدء إنشاء المحتوى.</div>;

    const sayWord = (w: string) => {
        speakText(w, language, 1, w, undefined, 'hq', undefined);
    };

    /* Book SVG illustration */
    const BookSVG = () => (
        <svg viewBox="0 0 160 160" width="100%" height="100%" style={{ display: "block" }}>
            <rect width={160} height={160} fill="#2a2a3a"/>
            <rect y={110} width={160} height={50} fill="#c8946a"/>
            <rect y={100} width={160} height={14} fill="#d4a070" opacity={0.5}/>
            <circle cx={30} cy={70} r={12} fill="#e8c49a"/>
            <rect x={22} y={82} width={16} height={22} rx={4} fill="#4a7ab5"/>
            <rect x={24} y={104} width={6} height={14} rx={2} fill="#4a7ab5"/>
            <rect x={32} y={104} width={6} height={14} rx={2} fill="#4a7ab5"/>
            <circle cx={72} cy={64} r={12} fill="#e8c49a"/>
            <rect x={64} y={76} width={16} height={22} rx={4} fill="#e07a30"/>
            <rect x={66} y={98} width={6} height={16} rx={2} fill="#fff"/>
            <rect x={74} y={98} width={6} height={16} rx={2} fill="#fff"/>
            <rect x={84} y={75} width={18} height={22} rx={2} fill="none" stroke="#8b6914" strokeWidth={2}/>
            <line x1={89} y1={75} x2={89} y2={97} stroke="#8b6914" strokeWidth={1.2}/>
            <line x1={94} y1={75} x2={94} y2={97} stroke="#8b6914" strokeWidth={1.2}/>
            <line x1={99} y1={75} x2={99} y2={97} stroke="#8b6914" strokeWidth={1.2}/>
            <line x1={84} y1={86} x2={102} y2={86} stroke="#8b6914" strokeWidth={1.2}/>
            <circle cx={93} cy={83} r={4} fill="#f5c842"/>
            <circle cx={118} cy={66} r={12} fill="#e8c49a"/>
            <rect x={110} y={78} width={16} height={20} rx={4} fill="#6ba3d6"/>
            <rect x={112} y={98} width={6} height={16} rx={2} fill="#fff"/>
            <rect x={120} y={98} width={6} height={16} rx={2} fill="#fff"/>
            <circle cx={148} cy={68} r={10} fill="#e8c49a"/>
            <rect x={141} y={78} width={14} height={20} rx={4} fill="#555"/>
            <rect x={143} y={98} width={5} height={14} rx={2} fill="#555"/>
            <rect x={150} y={98} width={5} height={14} rx={2} fill="#555"/>
            <rect x={0} y={0} width={160} height={65} fill="#1a2a1a" opacity={0.6}/>
            <rect x={10} y={8} width={100} height={45} rx={2} fill="#1e3d1e" opacity={0.8}/>
        </svg>
    );

    const Pill = ({ v, active, onClick }: { v: string, active: boolean, onClick: () => void }) => (
        <button onClick={onClick} style={{
            background: active ? colors.G : "#e0d8cc",
            border: "none", borderRadius: 7,
            padding: "4px 10px",
            color: active ? "#fff" : "#5a5045",
            fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "sans-serif",
        }}>{v}</button>
    );

    const S = (d: string | string[], size: number = 18, stroke: string = "#1a1410") => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
        </svg>
    );

    const ArrowLeft = () => S("M19 12H5M12 5l-7 7 7 7");
    const BookmarkIcn = () => S("M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z");
    const DotsIcn = () => (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="#1a1410">
            <circle cx={12} cy={5} r={1.3}/><circle cx={12} cy={12} r={1.3}/><circle cx={12} cy={19} r={1.3}/>
        </svg>
    );
    const HeadphoneIcn = () => S("M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z", 16);
    const BookIcn = () => S("M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z", 16);
    const ListIcn = () => S(["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"], 16);
    const TransIcn = ({ active }: { active: boolean }) => S("M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6", 22, active ? colors.G : "#1a1410");
    const NextIcn = () => S(["M5 4l10 8-10 8V4z", "M19 5v14"], 22);
    const VolumeIcn = () => S(["M11 5L6 9H2v6h4l5 4V5z", "M19.07 4.93a10 10 0 010 14.14", "M15.54 8.46a5 5 0 010 7.07"], 22);

    const Btn = ({ children, onClick }: any) => (
        <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
            {children}
        </button>
    );

    const CtrlItem = ({ label, children, onClick, active }: any) => (
        <button onClick={onClick} style={{
            background: active ? `rgba(${colors.G_rgb},0.12)` : "transparent",
            border: "none", borderRadius: 9, padding: "4px 6px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            cursor: "pointer", minWidth: 42,
        }}>
            {children}
            <span style={{ fontSize: 10, color: "#3d3428", fontWeight: 600, fontFamily: "sans-serif" }}>{label}</span>
        </button>
    );

    const Popup = ({ children, right }: any) => (
        <div onClick={e => e.stopPropagation()} style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            ...(right ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }),
            background: colors.CARD, border: `1px solid ${colors.BD}`,
            borderRadius: 12, padding: "10px 12px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
            zIndex: 100, whiteSpace: "nowrap",
        }}>{children}</div>
    );

    const DialCircle = ({ value, max, label, badge }: any) => {
        const pct = value / max;
        const r = 13;
        const circ = 2 * Math.PI * r;
        return (
            <div style={{ position: "relative", width: 34, height: 34 }}>
                <svg width={34} height={34} viewBox="0 0 34 34">
                    <circle cx={17} cy={17} r={r} fill="none" stroke="#c8bfb0" strokeWidth={2}/>
                    <circle cx={17} cy={17} r={r} fill="none" stroke={colors.G} strokeWidth={2}
                        strokeDasharray={`${pct * circ * 0.75} ${circ}`}
                        strokeDashoffset={circ * 0.125}
                        strokeLinecap="round" transform="rotate(-90 17 17)"/>
                </svg>
                <span style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: badge ? 11 : 9, fontWeight: 800,
                    color: "#1a1410", fontFamily: "sans-serif",
                }}>{label}</span>
            </div>
        );
    };

    const VocabCol = ({ title, items, onSpk }: any) => (
        <div style={{
            background: colors.CARD, border: `1px solid ${colors.BD}`,
            borderRadius: 12, padding: "8px 8px 6px",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
        }}>
            <div style={{
                fontSize: 10, fontWeight: 800, color: "#1a1410",
                textAlign: "center", marginBottom: 6,
                direction: "rtl",
            }}>{title}</div>
            <div style={{ flex: 1, overflowY: "auto" }} className="no-scrollbar">
                {items.map((v: any, i: number) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center",
                        padding: "4px 0",
                        borderBottom: i < items.length - 1 ? `1px solid ${colors.BD}` : "none",
                        gap: 4,
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1410", fontFamily: "Georgia, serif", flex: 1 }}>{v.w}</span>
                        <span style={{ fontSize: 10, color: "#7a6e60", direction: "rtl", flex: 1, textAlign: "right" }}>{v.m}</span>
                        <button onClick={() => onSpk(v.w)} style={{
                            background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0,
                        }}>
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#8a7e6e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                <path d="M15.54 8.46a5 5 0 010 7.07"/>
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <button style={{
                marginTop: 5, background: "none", border: "none",
                color: "#8a7e6e", fontSize: 10, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 3, direction: "rtl", padding: "2px 0",
            }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#8a7e6e" strokeWidth={2} strokeLinecap="round">
                    <line x1={8} y1={6} x2={21} y2={6}/><line x1={8} y1={12} x2={21} y2={12}/><line x1={8} y1={18} x2={21} y2={18}/>
                    <line x1={3} y1={6} x2={3.01} y2={6}/><line x1={3} y1={12} x2={3.01} y2={12}/><line x1={3} y1={18} x2={3.01} y2={18}/>
                </svg>
                عرض الكل
            </button>
        </div>
    );

    return (
        <div ref={containerRef} onClick={() => setPopup(null)} className="fixed inset-0 z-[60] flex flex-col font-sans select-none" style={{ background: colors.BG }} dir="ltr">
            {/* ── HEADER ── */}
            <div style={{ display: "flex", alignItems: "center", padding: "10px 14px 6px", gap: 8, flexShrink: 0, direction: 'rtl' }}>
                <Btn onClick={props.onBack}><ArrowLeft /></Btn>
                <div style={{ flex: 1, direction: 'rtl' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1410" }}>{topic?.title || "القراءة والاستماع"}</div>
                    <div style={{ fontSize: 11, color: "#8a7e6e" }}>الدرس {props.dayNumber}</div>
                </div>
                <Btn onClick={() => { setTrans(v => !v); setPopup(null); }}>
                    <TransIcn active={trans} />
                </Btn>
            </div>

            {/* ── TABS ── */}
            <div style={{
                margin: "0 14px 10px",
                background: "#d4ccbe", borderRadius: 11, padding: 3,
                display: "flex", gap: 2, flexShrink: 0, direction: 'rtl'
            }}>
                {[
                    { id: "listen", icon: <HeadphoneIcn />, label: "استماع" },
                    { id: "read",   icon: <BookIcn />,      label: "قراءة"  },
                    { id: "vocab",  icon: <ListIcn />,      label: "مفردات" },
                ].map(({ id, icon, label }) => (
                    <button key={id} onClick={() => setTab(id as any)} style={{
                        flex: 1,
                        background: tab === id ? colors.CARD : "transparent",
                        border: "none", borderRadius: 9,
                        padding: "8px 0",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        color: tab === id ? "#1a1410" : "#7a6e60",
                        fontSize: 12, fontWeight: tab === id ? 700 : 500,
                        cursor: "pointer",
                        boxShadow: tab === id ? "0 1px 5px rgba(0,0,0,0.1)" : "none",
                    }}>
                        {icon}{label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-32">
                {tab !== 'vocab' ? (
                    <>
                    {/* ── TEXT + IMAGE ── */}
                    <div style={{
                        marginTop: 10,
                        margin: "0 14px 8px",
                        display: "grid", gridTemplateColumns: "1fr 130px",
                        gap: 10, alignItems: "start",
                    }}>
                        <div style={{
                            margin: 0, fontSize: 16, lineHeight: 1.9,
                            color: "#1a1410", fontFamily: "Georgia, serif"
                        }}>
                             <InteractiveText 
                                text={story.originalText}
                                language={props.language}
                                nativeLanguage={props.nativeLanguage}
                                wordDataCache={props.wordDataCache}
                                onCacheWordData={props.onCacheWordData}
                                onAddFlashcard={props.onAddFlashcard}
                                containerRef={containerRef}
                                className="" // Inline takes over
                                highlightWordIndex={currentWordIndex}
                                selectedVoice={localSelectedVoice}
                            />
                        </div>
                        <div style={{
                            borderRadius: 10, overflow: "hidden",
                            border: `1px solid ${colors.BD}`,
                            aspectRatio: "1 / 1",
                        }}>
                            <BookSVG />
                        </div>
                    </div>

                    {/* Translation strip */}
                    {trans && (
                        <div style={{
                            margin: "0 14px 8px",
                            background: colors.CARD, border: `1px solid ${colors.BD}`, borderRadius: 10,
                            padding: "8px 12px",
                            fontSize: 14, lineHeight: 1.7,
                            color: "#6b5e4e", direction: "rtl", flexShrink: 0,
                            fontFamily: "sans-serif"
                        }}>
                            {story.translatedText}
                        </div>
                    )}
                    </>
                ) : (
                    /* ── VOCAB COLUMNS ── */
                    <div style={{
                        flex: 1,
                        margin: "0 14px 8px",
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                        minHeight: 0,
                    }}>
                        <VocabCol 
                            title="مفردات النص"          
                            items={cleanWordList.map(v => ({ w: v.word, m: v.translation }))}  
                            onSpk={sayWord} 
                        />
                        <VocabCol 
                            title="مفردات إضافية مهمة"   
                            items={(story.additionalExpressions || []).map(e => ({ w: e.phrase, m: e.translation }))} 
                            onSpk={sayWord} 
                        />
                    </div>
                )}
            </div>

            {/* ── FIXED CONTROLS BAR ── */}
            {tab !== 'vocab' && (
                <div onClick={e => e.stopPropagation()} style={{
                    position: "absolute", bottom: 80, left: 14, right: 14,
                    background: CARD, border: `1px solid ${colors.BD}`,
                    borderRadius: 14, padding: "10px 6px",
                    display: "flex", alignItems: "center", justifyContent: "space-around",
                    zIndex: 10
                }}>
                    {/* Translate */}
                    <CtrlItem label="ترجمة" active={trans} onClick={() => { setTrans(v => !v); setPopup(null); }}>
                        <TransIcn active={trans} />
                    </CtrlItem>

                    {/* Speed */}
                    <div style={{ position: "relative" }}>
                        <CtrlItem label="سرعة" active={popup === "speed"} onClick={() => toggle("speed")}>
                            <DialCircle value={speed} max={1.5} label={`${speed}x`} />
                        </CtrlItem>
                        {popup === "speed" && (
                            <Popup>
                                <div style={{ fontSize: 10, color: "#8a7e6e", fontWeight: 700, marginBottom: 6, textAlign: "center" }}>السرعة</div>
                                <div style={{ display: "flex", gap: 5 }}>
                                    {SPEEDS.map(s => <Pill key={s} v={`${s}x`} active={speed === s} onClick={() => { setSpeed(s); setPopup(null); }} />)}
                                </div>
                            </Popup>
                        )}
                    </div>

                    {/* Repeat */}
                    <div style={{ position: "relative" }}>
                        <CtrlItem label="تكرار" active={popup === "repeat"} onClick={() => toggle("repeat")}>
                            <DialCircle value={repeatCount} max={5} label={`${repeatCount}`} badge />
                        </CtrlItem>
                        {popup === "repeat" && (
                            <Popup>
                                <div style={{ fontSize: 10, color: "#8a7e6e", fontWeight: 700, marginBottom: 6, textAlign: "center" }}>التكرار</div>
                                <div style={{ display: "flex", gap: 5 }}>
                                    {REPEATS.map(r => <Pill key={r} v={`${r}×`} active={repeatCount === r} onClick={() => { setRepeatCount(r); setPopup(null); }} />)}
                                </div>
                            </Popup>
                        )}
                    </div>

                    {/* BIG PLAY */}
                    <button onClick={togglePlay} style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: G, border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 3px 12px rgba(61,90,62,0.45)", flexShrink: 0,
                    }}>
                        {isPlaying
                            ? <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff"><rect x={5} y={4} width={4} height={16} rx={1}/><rect x={15} y={4} width={4} height={16} rx={1}/></svg>
                            : <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff"><path d="M5 3l14 9-14 9V3z"/></svg>
                        }
                    </button>

                    {/* Next */}
                    <CtrlItem label="التالي" onClick={() => {
                        const evt = new CustomEvent('yuki-next-stage');
                        window.dispatchEvent(evt);
                    }}>
                        <NextIcn />
                    </CtrlItem>

                    {/* Volume (Mocked) */}
                    <div style={{ position: "relative" }}>
                        <CtrlItem label="الصوت" active={popup === "volume"} onClick={() => toggle("volume")}>
                            <VolumeIcn />
                        </CtrlItem>
                        {popup === "volume" && (
                            <Popup right>
                                <div style={{ fontSize: 10, color: "#8a7e6e", fontWeight: 700, marginBottom: 6, textAlign: "center" }}>الصوت</div>
                                <input type="range" min={0} max={100} defaultValue={80} style={{ width: 130, accentColor: G }} />
                            </Popup>
                        )}
                    </div>
                </div>
            )}

            {/* ── BOTTOM BUTTON ── */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px 20px", flexShrink: 0, background: 'linear-gradient(to top, #fcf9f2 60%, transparent)', pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                        const evt = new CustomEvent('yuki-next-stage');
                        window.dispatchEvent(evt);
                  }} 
                  className="btn-emerald pointer-events-auto w-full max-w-[240px] !rounded-2xl !text-lg shadow-2xl"
                  dir="rtl"
                >
                    <span>التالي</span>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <line x1={19} y1={12} x2={5} y2={12}/><polyline points="12 5 5 12 12 19"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default StoryStage;
