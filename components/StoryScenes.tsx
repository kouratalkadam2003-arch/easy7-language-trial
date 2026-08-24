import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryScenesProps {
    fromStage: string;
    toStage: string;
    onProceed: () => void;
    topicTitle?: string;
}

type Character = 'elly' | 'laith' | 'narrator' | 'radio' | 'sound';

interface DialogueLine {
    character: Character;
    label?: string;
    text: string;
    isWhisper?: boolean;
    isAction?: boolean;
}

interface SceneData {
    id: string;
    background: string;
    ambientClass: string;
    dialogues: DialogueLine[];
    buttonText: string;
    badge?: string;
}

// ─── Character Config ─────────────────────────────────────────────────────────

const characterConfig: Record<Character, { emoji: string; color: string; bgColor: string; borderColor: string }> = {
    elly: {
        emoji: '🧡',
        color: 'text-[#5c3d2e]',
        bgColor: 'bg-[#e8dcc7]',
        borderColor: 'border-[#cfc6b5]',
    },
    laith: {
        emoji: '🛡️',
        color: 'text-[#1e3a5f]',
        bgColor: 'bg-[#d8e3ed]',
        borderColor: 'border-[#b5c7d8]',
    },
    narrator: {
        emoji: '✨',
        color: 'text-slate-300',
        bgColor: 'bg-white/10',
        borderColor: 'border-white/20',
    },
    radio: {
        emoji: '📻',
        color: 'text-[#5e2b4f]',
        bgColor: 'bg-[#e8cce0]',
        borderColor: 'border-[#cfb5c8]',
    },
    sound: {
        emoji: '🔊',
        color: 'text-yellow-100',
        bgColor: 'bg-black/30',
        borderColor: 'border-yellow-500/20',
    },
};

// ─── Scene Definitions ────────────────────────────────────────────────────────

function getSceneData(fromStage: string, toStage: string): SceneData | null {
    // Scene A: Start → Story
    if (fromStage === 'start' && toStage === 'story') {
        return {
            id: 'awakening',
            background: 'from-[#3a2f26] via-[#2c231c] to-[#1e1712]',
            ambientClass: 'ambient-morning',
            dialogues: [
                {
                    character: 'narrator',
                    text: '☀️ داخل الكوخ. ضوء الصباح يتسلل من النافذة...',
                    isAction: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي (تهمس)',
                    text: 'انظر إليه... ينام كأنه سلطان القرية! السوق يستيقظ منذ الفجر. أنا لا أجرؤ أوقظه، شخيره يخيف الدجاج!',
                    isWhisper: true,
                },
                {
                    character: 'narrator',
                    text: '🪶 إيلي تقترب بريشة دجاج وتدغدغ أنف ليث...',
                    isAction: true,
                },
                {
                    character: 'laith',
                    label: 'ليث (يستيقظ فجأة)',
                    text: 'الوحش! الوحش أتى! 😱',
                },
                {
                    character: 'elly',
                    label: 'إيلي (تضحك)',
                    text: 'لا يا بطل، إنها الريشة فقط 😂 انهض! علينا الذهاب إلى السوق.',
                },
                {
                    character: 'elly',
                    label: 'إيلي (تلتفت لك وتغمز)',
                    text: 'مهمتك الأولى: استمع جيداً لكل ما يُقال. ثق بي. 😉',
                },
            ],
            buttonText: 'هيا إلى السوق! ←',
        };
    }

    // Scene B: Story → Review
    if (fromStage === 'story' && toStage === 'review') {
        return {
            id: 'return-from-market',
            background: 'from-[#423126] via-[#3a2f26] to-[#2c231c]',
            ambientClass: 'ambient-afternoon',
            dialogues: [
                {
                    character: 'narrator',
                    text: '🏡 في طريق العودة إلى الكوخ... ليث يحمل رغيف مارثا بطريقة غريبة.',
                    isAction: true,
                },
                {
                    character: 'laith',
                    label: 'ليث',
                    text: 'لم أتخيل أن شراء الجزر يتطلب مقابلة شخصية! فينسنت كاد يشم رائحتي! 🥕😤',
                },
                {
                    character: 'elly',
                    label: 'إيلي (تضحك)',
                    text: 'هكذا قريتنا. لكنك كنت جيداً... نوعاً ما. عندما قلت "اسمي ليث"، بدا وجهك مثل الشمندر! 😆',
                },
                {
                    character: 'narrator',
                    text: '📓 إيلي تخرج دفترها الصغير...',
                    isAction: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي',
                    text: 'الآن، قبل أن أنسى... ذاكرتي مثل الدجاج، تنسى بسرعة 🐔',
                },
                {
                    character: 'elly',
                    label: 'إيلي (لك)',
                    text: 'تعال. اقرأ معي ما حدث. من يدري متى ستحتاج هذه الكلمات... 📖',
                },
            ],
            buttonText: 'لنقرأ معاً ←',
        };
    }

    // Scene C: Review → Memory
    if (fromStage === 'review' && toStage === 'memory') {
        return {
            id: 'broken-fence',
            background: 'from-[#263142] via-[#1e2733] to-[#161d26]',
            ambientClass: 'ambient-sunset',
            dialogues: [
                {
                    character: 'sound',
                    text: 'كررررر! 🐔 — صوت الدجاجة نقنوقة تصرخ بهلع!',
                },
                {
                    character: 'laith',
                    label: 'ليث (يندفع إلى النافذة)',
                    text: 'السياج! نسينا السياج! إذا جاء بركلز الليلة... 😨',
                },
                {
                    character: 'elly',
                    label: 'إيلي',
                    text: 'لا تقلق. نذهب إلى الغابة ونحتطب. لكن... 🌲',
                },
                {
                    character: 'elly',
                    label: 'إيلي (تخفض صوتها)',
                    text: 'في الغابة يسكن المزاحون... العفاريت الزرق 👹 إذا سمعوا كلمة خطأ، سيضحكون علينا طوال الليل!',
                    isWhisper: true,
                },
                {
                    character: 'laith',
                    label: 'ليث (لك)',
                    text: 'أنت قادم معي صح؟ إذا رأيت شيئاً أزرق يضحك... اضرب الجذع الصحيح! 🪓💪',
                },
            ],
            buttonText: 'إلى الغابة! ←',
        };
    }

    // Scene D: Memory → Campfire
    if (fromStage === 'memory' && toStage === 'campfire') {
        return {
            id: 'fireside',
            background: 'from-[#121820] via-[#16101c] to-[#2a170d]',
            ambientClass: 'ambient-campfire',
            dialogues: [
                {
                    character: 'narrator',
                    text: '🪵 ليث يعود بحزمة حطب وغصن عالق بشعره...',
                    isAction: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي',
                    text: 'نجوتم! لم يسرقوا قبعاتكم حتى! 😅',
                },
                {
                    character: 'laith',
                    label: 'ليث',
                    text: 'أزعجنا؟ كاد زيزو يغني أغنية عن أنفي! لكننا أسكتناه بالكلمات الصحيحة. 💪',
                },
                {
                    character: 'narrator',
                    text: '🔨 يبدأ بإصلاح السياج... فجأة... خطوات ثقيلة في الظلام!',
                    isAction: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي (تهمس)',
                    text: 'إنه... بركلز. 😰',
                    isWhisper: true,
                },
                {
                    character: 'laith',
                    label: 'ليث',
                    text: 'كل ما تعلمناه اليوم... استمعنا، قرأنا، حفظنا... الآن نستخدمه! ⚔️',
                },
                {
                    character: 'narrator',
                    text: '🔥 بعد المواجهة... يجلسون حول النار، والسماء مليئة بالنجوم.',
                    isAction: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي',
                    text: 'الليالي هنا باردة... لكنها جميلة. أخبرني... كيف كان يومك حقاً؟ 🌙',
                },
            ],
            buttonText: 'لنتحدث معاً ←',
        };
    }

    // Scene E: Campfire → Radio
    if (fromStage === 'campfire' && toStage === 'radio') {
        return {
            id: 'radio-time',
            background: 'from-[#121016] via-[#1c1626] to-[#10121a]',
            ambientClass: 'ambient-starry',
            dialogues: [
                {
                    character: 'narrator',
                    text: '🕯️ داخل الكوخ. سماء الليل من النافذة. ضوء شمعة دافئ...',
                    isAction: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي (تتذكر فجأة)',
                    text: 'أوه! كدت أنسى! الراديو! 📻',
                },
                {
                    character: 'laith',
                    label: 'ليث (يفتح عينيه)',
                    text: 'عنا؟ كيف عرفا؟ 😳',
                },
                {
                    character: 'elly',
                    label: 'إيلي',
                    text: 'كل القرية تعرف! فينسنت يتكلم أكثر من الراديو نفسه! 🗣️',
                },
                {
                    character: 'narrator',
                    text: '📻 إيلي تدير قرص الراديو... تشويش... ثم صوت واضح...',
                    isAction: true,
                },
                {
                    character: 'radio',
                    label: 'صوت خالد من الراديو',
                    text: 'مساء الخير يا سكان الوادي! 🎙️',
                },
                {
                    character: 'elly',
                    label: 'إيلي (تضع إصبعها على شفتيها)',
                    text: 'اسمع... 🤫',
                    isWhisper: true,
                },
            ],
            buttonText: 'لنستمع! ←',
        };
    }

    // Scene F: Radio → Complete
    if (fromStage === 'radio' && toStage === 'complete') {
        return {
            id: 'end-of-day',
            background: 'from-[#0a0f16] via-[#10161f] to-[#0a0f16]',
            ambientClass: 'ambient-night',
            dialogues: [
                {
                    character: 'narrator',
                    text: '😴 ليث نائم على الطاولة، شخيره عاد بقوة...',
                    isAction: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي (تهمس)',
                    text: 'انظر... نام كالطفل. لقد كان يوماً طويلاً حقاً. 💤',
                    isWhisper: true,
                },
                {
                    character: 'elly',
                    label: 'إيلي (لك)',
                    text: 'شكراً لك. تعلمنا الكثير اليوم. أنا، وليث، وأنت أيضاً. 🧡',
                },
                {
                    character: 'elly',
                    label: 'إيلي',
                    text: 'كلما تحدثنا أكثر، كبرت قريتنا. غداً... ربما نذهب إلى مكان جديد. لكن الآن، نم جيداً أيها البطل. 🌟',
                },
                {
                    character: 'narrator',
                    text: '🕯️ الشمعة تنطفئ تدريجياً... نجمة تتلألأ في السماء.',
                    isAction: true,
                },
            ],
            buttonText: 'نم جيداً... وغداً مغامرة جديدة! ←',
            badge: '🏅 يوم مكتمل!',
        };
    }

    return null;
}

// ─── Dialogue Bubble Component ────────────────────────────────────────────────

const DialogueBubble: React.FC<{
    line: DialogueLine;
    index: number;
    visibleCount: number;
}> = ({ line, index, visibleCount }) => {
    const config = characterConfig[line.character];
    const isVisible = index < visibleCount;

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={`flex gap-3 items-start w-full ${line.isAction ? 'justify-center' : ''}`}
            dir="rtl"
        >
            {/* Action / Narration style */}
            {line.isAction ? (
                <div className="text-center w-full px-4 py-3">
                    <motion.p
                        className="text-sm md:text-base text-slate-400 italic leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        {line.text}
                    </motion.p>
                </div>
            ) : (
                <>
                    {/* Character Avatar */}
                    <motion.div
                        className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center text-lg md:text-xl shadow-lg`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                    >
                        {config.emoji}
                    </motion.div>

                    {/* Speech Bubble */}
                    <div className="flex-1 min-w-0">
                        {line.label && (
                            <p className={`text-xs md:text-sm font-bold mb-1 ${config.color} opacity-80`}>
                                {line.label}
                            </p>
                        )}
                        <motion.div
                            className={`${config.bgColor} ${config.borderColor} border rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg backdrop-blur-sm ${
                                line.isWhisper ? 'border-dashed' : ''
                            }`}
                            initial={{ scaleX: 0.8 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{ transformOrigin: 'right' }}
                        >
                            <p
                                className={`text-sm md:text-base leading-relaxed ${config.color} ${
                                    line.isWhisper ? 'italic opacity-90' : ''
                                }`}
                            >
                                {line.text}
                            </p>
                        </motion.div>
                    </div>
                </>
            )}
        </motion.div>
    );
};

// ─── Stars Display (for completion scene) ─────────────────────────────────────

const StarsDisplay: React.FC = () => {
    return (
        <motion.div
            className="flex gap-3 justify-center my-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="text-3xl md:text-4xl drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        delay: 0.5 + i * 0.2,
                        type: 'spring',
                        bounce: 0.6,
                    }}
                >
                    ⭐
                </motion.span>
            ))}
        </motion.div>
    );
};

// ─── Ambient Particles ────────────────────────────────────────────────────────

const AmbientParticles: React.FC<{ type: string }> = ({ type }) => {
    const particles = React.useMemo(() => {
        const count = type === 'ambient-night' || type === 'ambient-starry' ? 30 : 12;
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 4,
            duration: Math.random() * 3 + 2,
        }));
    }, [type]);

    const getParticleColor = () => {
        switch (type) {
            case 'ambient-morning':
                return 'bg-yellow-300/30';
            case 'ambient-afternoon':
                return 'bg-orange-300/25';
            case 'ambient-sunset':
                return 'bg-red-400/25';
            case 'ambient-campfire':
                return 'bg-orange-400/30';
            case 'ambient-starry':
            case 'ambient-night':
                return 'bg-white/40';
            default:
                return 'bg-white/20';
        }
    };

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className={`absolute rounded-full ${getParticleColor()}`}
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: [0, -20, -40],
                        scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Campfire glow for fire scenes */}
            {type === 'ambient-campfire' && (
                <motion.div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full"
                    style={{
                        background: 'radial-gradient(ellipse, rgba(251,146,60,0.3) 0%, transparent 70%)',
                    }}
                    animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scaleX: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}

            {/* Morning sun glow */}
            {type === 'ambient-morning' && (
                <motion.div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)',
                    }}
                    animate={{
                        opacity: [0.4, 0.7, 0.4],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}

            {/* Moon glow for night */}
            {(type === 'ambient-night' || type === 'ambient-starry') && (
                <motion.div
                    className="absolute top-8 left-8 w-16 h-16 rounded-full bg-slate-200/20 shadow-[0_0_30px_rgba(203,213,225,0.3)]"
                    animate={{
                        opacity: [0.6, 1, 0.6],
                        boxShadow: [
                            '0 0 30px rgba(203,213,225,0.3)',
                            '0 0 50px rgba(203,213,225,0.5)',
                            '0 0 30px rgba(203,213,225,0.3)',
                        ],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StoryScenes({ fromStage, toStage, onProceed, topicTitle }: StoryScenesProps) {
    const scene = getSceneData(fromStage, toStage);
    const [visibleCount, setVisibleCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const allDialoguesShown = scene ? visibleCount >= scene.dialogues.length : false;

    // Stagger dialogue appearance
    useEffect(() => {
        if (!scene) return;

        setVisibleCount(0);
        let count = 0;

        const showNext = () => {
            count++;
            setVisibleCount(count);
            if (count < scene.dialogues.length) {
                timer = setTimeout(showNext, 1200);
            }
        };

        let timer = setTimeout(showNext, 800);

        return () => clearTimeout(timer);
    }, [scene?.id]);

    // Auto-scroll as new dialogue appears
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [visibleCount]);

    // Fallback if no matching scene
    if (!scene) {
        return (
            <div
                className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black"
                dir="rtl"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-8"
                >
                    <p className="text-2xl text-slate-300 mb-6">المرحلة التالية جاهزة...</p>
                    <motion.button
                        onClick={onProceed}
                        className="px-8 py-3 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded-full text-amber-100 font-bold text-lg transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        تابع ←
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className={`absolute inset-0 z-50 flex flex-col bg-gradient-to-br ${scene.background} transition-colors duration-1000`}
        >
            {/* Ambient overlay */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            {/* Ambient particles */}
            <AmbientParticles type={scene.ambientClass} />

            {/* Top bar with scene vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%)',
                }}
            />

            {/* Title / Topic */}
            {topicTitle && (
                <motion.div
                    className="relative z-10 text-center pt-6 pb-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-xs md:text-sm text-amber-400/70 tracking-widest uppercase font-medium">
                        {topicTitle}
                    </p>
                </motion.div>
            )}

            {/* Scrollable Dialogue Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto relative z-10 px-4 py-6 flex flex-col"
            >
                <div className="max-w-lg w-full mx-auto flex flex-col gap-4 flex-1">
                    {/* Scene decorative header */}
                    <motion.div
                        className="text-center mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="text-xs md:text-sm text-slate-400">
                                {scene.id === 'awakening' && '🌅 الاستيقاظ'}
                                {scene.id === 'return-from-market' && '🏡 العودة من السوق'}
                                {scene.id === 'broken-fence' && '⚠️ السياج المكسور'}
                                {scene.id === 'fireside' && '🔥 حول النار'}
                                {scene.id === 'radio-time' && '📻 وقت الراديو'}
                                {scene.id === 'end-of-day' && '🌙 نهاية اليوم'}
                            </span>
                        </div>
                    </motion.div>

                    {/* Dialogue Lines */}
                    <AnimatePresence mode="popLayout">
                        {scene.dialogues.map((line, index) => (
                            <DialogueBubble
                                key={`${scene.id}-${index}`}
                                line={line}
                                index={index}
                                visibleCount={visibleCount}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Completion badge */}
                    {scene.badge && allDialoguesShown && (
                        <motion.div
                            className="text-center mt-4"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
                        >
                            <div className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600/40 to-yellow-600/40 border border-amber-400/40 rounded-2xl backdrop-blur-sm">
                                <p className="text-2xl md:text-3xl font-bold text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                                    {scene.badge}
                                </p>
                            </div>
                            <StarsDisplay />
                        </motion.div>
                    )}

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1 min-h-8" />
                </div>
            </div>

            {/* Proceed Button */}
            <AnimatePresence>
                {allDialoguesShown && (
                    <motion.div
                        className="relative z-10 p-4 pb-8 flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        <motion.button
                            onClick={onProceed}
                            className="px-8 py-3.5 bg-gradient-to-r from-[#d4a070] to-[#c8946a] border border-[#cfc6b5]/50 rounded-full text-[#1a1410] font-black text-base md:text-lg tracking-wide transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] active:scale-95"
                            dir="rtl"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            {scene.buttonText}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
