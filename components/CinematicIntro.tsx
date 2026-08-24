import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CinematicIntroProps {
    stage: string;
    onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ stage, onComplete }) => {
    const [visible, setVisible] = useState(true);

    const stageData: Record<string, { title: string; text: string; bg: string }> = {
        story: {
            title: "المهمة 1: الغريب في سوق القرية",
            text: "السوق مزدحم اليوم. الكل سيكون هناك... استمع جيداً لكل ما يقال في السوق.",
            bg: "from-amber-900 to-black"
        },
        listening: {
            title: "خطوات خفية",
            text: "تتمشى مع إيلي في أزقة القرية... استرق السمع لحوارات القرويين وحاول فهم لغتهم.",
            bg: "from-emerald-900 to-black"
        },
        memory_knife: {
            title: "المهمة 3: احتطاب ومبارزة العفاريت",
            text: "نسينا السياج! في الغابة، يسكن المزاحون العفاريت الزرق... اضرب الجذع الصحيح بسرعة!",
            bg: "from-emerald-900 to-black"
        },
        memory_zombie: {
            title: "المهمة 4: طرد بركلز الجائع",
            text: "بركلز لا يفهم إلا الأسئلة. أجب عليه بشكل صحيح وسيذهب. دافع عن القرية!",
            bg: "from-purple-900 to-black"
        },
        memory_context: {
            title: "تغيير السياق",
            text: "هل تتذكر ما تعلمته؟ حاول استخدامه في سياق مختلف تماماً الآن.",
            bg: "from-blue-900 to-black"
        },
        textChat: {
            title: "المهمة 5: نجوم ودردشة مع إيلي",
            text: "الليالي هنا باردة... لكنها جميلة. أخبرني... كيف كان يومك حقاً؟",
            bg: "from-indigo-900 to-black"
        },
        practice: {
            title: "التطبيق العملي",
            text: "استخدم صوتك وتحدث مع الشخصيات وجهاً لوجه.",
            bg: "from-pink-900 to-black"
        },
        chat: {
            title: "المهمة 5: نجوم ودردشة مع إيلي (صوتي)",
            text: "تحدث بحرية، واستكشف العالم بلسانهم.",
            bg: "from-teal-900 to-black"
        },
        deck: {
            title: "المهمة 2: يوميات إيلي",
            text: "إيلي: علي تدوين كل هذا في يومياتي. تعال. اقرأ معي ما حدث. هذا يساعدني على التذكر.",
            bg: "from-slate-800 to-black"
        },
        cafe: {
            title: "استراحة المقهى",
            text: "أنت جائع بعد يوم طويل. ادخل المقهى واطلب الطعام بلغتهم.",
            bg: "from-orange-900 to-black"
        },
        snowball: {
            title: "كرة الثلج",
            text: "ابنِ جملتك كلمة بكلمة... مثل كرة الثلج التي تكبر.",
            bg: "from-cyan-900 to-black"
        },
        radio: {
            title: "المهمة 6: محطة إذاعة الوادي المضحك",
            text: "خالد وسارة يتحدثان الليلة. سمعت أنهما يتكلمان عن... عنا! لنستمع!",
            bg: "from-fuchsia-900 to-black"
        }
    };

    const currentStageData = stageData[stage] || { title: "مهمة جديدة", text: "استعد للمرحلة القادمة...", bg: "from-slate-900 to-black" };

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 800); // Wait for fade out
        }, 3500); // Show for 3.5 seconds

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-[900] flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br ${currentStageData.bg}`}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                        className="relative z-10 max-w-xl flex flex-col items-center"
                    >
                        <h2 className="text-4xl md:text-6xl font-bold text-amber-500 font-serif tracking-widest drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] mb-6">
                            {currentStageData.title}
                        </h2>
                        <p className="text-xl md:text-3xl text-slate-200 font-medium leading-relaxed drop-shadow-md">
                            {currentStageData.text}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
