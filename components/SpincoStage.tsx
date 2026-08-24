
import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { LessonViewProps } from './LessonView';
import { SpincoCard } from '../types';
import { LoadingDisplay, ErrorDisplay } from './Spinner';
import GeneratedImage from './GeneratedImage';
import { DownloadIcon, RefreshIcon } from './icons';
import { downloadSpincoCardAsImage } from '../utils/imageExport';
import TTSButton from './TTSButton';

const UI_TEXTS_AR = {
    error: "حدث خطأ أثناء إنشاء المحتوى. حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
    generating: "جاري إنشاء بطاقات سبينكو...",
    regenerateImage: "تجديد الصورة"
};

interface SpincoStageProps extends LessonViewProps {
    cards: SpincoCard[] | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onRegenerate: (index: number) => void;
}

const SpincoStage: React.FC<SpincoStageProps> = ({ cards, isLoading, error, onRetry, onRegenerate, ...props }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [svgPath, setSvgPath] = useState('');
    const [ropeHeight, setRopeHeight] = useState(0);

    // Initialize/Reset refs array when cards change
    useEffect(() => {
        if (cards) {
            cardRefs.current = cardRefs.current.slice(0, cards.length);
        }
    }, [cards]);

    const updateRopes = useCallback(() => {
        if (!containerRef.current || !cards || cards.length < 2) {
            setSvgPath('');
            return;
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        let pathStr = '';
        
        // Ensure we cover the full scrollable height
        setRopeHeight(containerRef.current.scrollHeight);

        for (let i = 0; i < cards.length - 1; i++) {
            const boxA = cardRefs.current[i];
            const boxB = cardRefs.current[i + 1];

            if (boxA && boxB) {
                const rectA = boxA.getBoundingClientRect();
                const rectB = boxB.getBoundingClientRect();

                // Calculate center points relative to the container
                // We use offsetLeft/offsetTop if possible for stability within scroll
                // But getBoundingClientRect is safer for flex layouts, just subtract container pos
                // Note: We need to account for scrollTop if the container is scrolling, 
                // but since the SVG is absolute inside the container, we want coordinates relative to the container's top-left corner (0,0).
                
                const startX = (rectA.left + rectA.width / 2) - containerRect.left;
                const startY = (rectA.top + rectA.height / 2) - containerRect.top + containerRef.current.scrollTop;
                
                const endX = (rectB.left + rectB.width / 2) - containerRect.left;
                const endY = (rectB.top + rectB.height / 2) - containerRect.top + containerRef.current.scrollTop;

                // Bezier curve logic from the user's prompt
                // Moves right (+150) from start, and left (-150) from end to create the S-shape loop
                pathStr += `
                    M ${startX},${startY}
                    C ${startX + 150},${startY}
                      ${endX - 150},${endY}
                      ${endX},${endY}
                `;
            }
        }
        setSvgPath(pathStr);
    }, [cards]);

    // Update ropes on resize, scroll, or image load (approximated by time)
    useEffect(() => {
        window.addEventListener('resize', updateRopes);
        
        // Also observe the container for size changes (e.g. images loading expanding divs)
        const ro = new ResizeObserver(() => {
            updateRopes();
        });
        
        if (containerRef.current) {
            ro.observe(containerRef.current);
            // Also observe children to be safe
            cardRefs.current.forEach(el => el && ro.observe(el));
        }

        // Slight delay to ensure layout is settled
        const t = setTimeout(updateRopes, 100);

        return () => {
            window.removeEventListener('resize', updateRopes);
            ro.disconnect();
            clearTimeout(t);
        };
    }, [updateRopes, cards]);

    // Force update when images might have loaded
    const handleImageLoad = () => {
        updateRopes();
    };

    if (isLoading) return <LoadingDisplay text={UI_TEXTS_AR.generating} />;
    if (error) return <ErrorDisplay errorText={UI_TEXTS_AR.error} retryText={UI_TEXTS_AR.retry} onRetry={onRetry} />;
    if (!cards) return <div className="p-4 text-center">لم يتم تحميل المحتوى بعد.</div>;
    
    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full bg-[#f2f4f8] overflow-y-auto overflow-x-hidden p-4 sm:p-8" 
            dir="rtl"
        >
            {/* Title / Header area inside the scroll view */}
            <div className="text-center mb-8 relative z-20">
                <h2 className="text-lg font-bold text-purple-700 mb-2">بطاقات الذاكرة (تخطيط الأفعى)</h2>
                <p className="text-purple-500 text-sm">تتبع الحبل لتعلم الكلمات بالترتيب!</p>
            </div>

            {/* Rope SVG Layer */}
            <svg 
                className="absolute top-0 left-0 w-full pointer-events-none z-0"
                style={{ height: ropeHeight || '100%' }}
            >
                <path 
                    d={svgPath} 
                    fill="none" 
                    stroke="#90caf9" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="opacity-90 transition-all duration-300"
                />
            </svg>

            {/* Cards Container */}
            <div className="relative z-10 flex flex-col gap-16 md:gap-24 max-w-3xl mx-auto pb-20">
                {cards.map((card, index) => {
                    const isLeft = index % 2 === 0;
                    
                    return (
                        <div 
                            key={index}
                            ref={(el) => { if (el) cardRefs.current[index] = el; }}
                            className={`
                                relative w-full max-w-[280px] sm:max-w-[320px] 
                                bg-[#e8f0fe] border-2 border-dashed border-[#999] rounded-[10px] 
                                p-3 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-md
                                ${isLeft ? 'self-start sm:ml-12' : 'self-end sm:mr-12'}
                            `}
                        >
                            {/* Number Badge */}
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#64b5f6] text-white font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white z-20">
                                {index + 1}
                            </div>

                            {/* Top Input (Visual Equation) */}
                            <div className="w-[90%] mb-2 relative">
                                <div className="w-full text-center text-sm p-1.5 bg-white border border-[#ccc] rounded-[5px] text-gray-700 font-medium">
                                    {card.visualEquation || "..."}
                                </div>
                                {/* TTS Button (Absolute positioned like in the reference) */}
                                <div className="absolute top-1/2 -translate-y-1/2 left-1">
                                    <TTSButton 
                                        text={card.foreignWord} 
                                        nativeText={card.transliteration} 
                                        language={props.language} 
                                        size="sm"
                                        className="!bg-[#4caf50] !text-white !border-none hover:!opacity-90"
                                    />
                                </div>
                            </div>

                            {/* Image */}
                            <div className="w-full mb-2 bg-white rounded-[10px] border-2 border-[#333] overflow-hidden">
                                {card.imageIsLoading ? (
                                    <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                                    </div>
                                ) : card.error ? (
                                    <div className="w-full aspect-square flex flex-col items-center justify-center bg-red-50 p-2 text-center">
                                        <p className="text-xs text-red-500 mb-2">فشل الصورة</p>
                                        <button onClick={() => onRegenerate(index)} className="text-xs underline text-red-700">{UI_TEXTS_AR.regenerateImage}</button>
                                    </div>
                                ) : (
                                    <img 
                                        src={card.imageUrl || ''} 
                                        alt={card.foreignWord} 
                                        className="w-full h-auto object-contain block"
                                        onLoad={handleImageLoad}
                                    />
                                )}
                            </div>

                            {/* Input Fields (Styled as Read-only inputs) */}
                            <div className="w-[90%] space-y-1.5 mb-2">
                                {/* Romaji / Transliteration */}
                                <div 
                                    className="w-full p-1.5 text-sm bg-white border border-[#ccc] rounded-[5px] text-center text-gray-600 font-mono"
                                    title="النطق"
                                >
                                    {card.transliteration}
                                </div>
                                
                                {/* Foreign Word / Japanese */}
                                <div 
                                    className="w-full p-1.5 text-lg font-bold bg-white border border-[#ccc] rounded-[5px] text-center text-gray-800"
                                    dir="ltr"
                                    title="الكلمة الأصلية"
                                >
                                    {card.foreignWord}
                                </div>

                                {/* Arabic Meaning */}
                                <div 
                                    className="w-full p-1.5 text-base font-semibold bg-white border border-[#ccc] rounded-[5px] text-center text-green-700"
                                    title="المعنى"
                                >
                                    {card.meaning}
                                </div>
                            </div>

                            {/* Mnemonic Text (Collapsible or Small) */}
                            <div className="w-[95%] text-xs text-gray-600 text-center leading-relaxed bg-white/50 p-2 rounded border border-gray-200">
                                <div dangerouslySetInnerHTML={{ __html: card.mnemonicHtml }} />
                            </div>

                            {/* Action Buttons Overlay (Download/Regenerate) */}
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => downloadSpincoCardAsImage(card, `Spinco-${index + 1}.png`)}
                                    className="p-1.5 rounded bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-blue-500 transition-colors"
                                    title="تحميل البطاقة"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onRegenerate(index)}
                                    className="p-1.5 rounded bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-orange-500 transition-colors"
                                    title="تغيير الصورة"
                                >
                                    <RefreshIcon className="w-4 h-4" />
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SpincoStage;
