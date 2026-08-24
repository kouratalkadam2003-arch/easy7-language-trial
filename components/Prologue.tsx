import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';

interface PrologueProps {
    onComplete: () => void;
    selectedLanguage: Language;
}

const scenes = [
    {
        id: 1,
        title: "القصة تبدأ...",
        text: "في بلاد الشرق البعيدة، حيث الرمال تعانق السحاب، وقصور المرمر تلمع تحت أشعة الشمس... كان هناك أمير شاب، شجاع وطيب القلب، يُدعى 'ليث'.",
        subtext: "نشأ ليث مع 'عاصف'، الفتى اليتيم الذي تبناه الملك، كأخوين يتدربان ويضحكان معاً. لكن الحسد كان ينمو في الظلام.",
        color: "from-amber-900 to-black"
    },
    {
        id: 2,
        title: "الخيانة",
        text: "في ليلة تتويج ليث ملكاً، كشر عاصف عن أنيابه.",
        subtext: "سلب العرش، وقيّد الملك الشرعي. لم يكتفِ بذلك، بل حكم عليه بالنفي المطلق في بحار النسيان.",
        color: "from-red-950 to-black"
    },
    {
        id: 3,
        title: "المنفى",
        text: "رمى عاصف بليث في البحر الهائج، وسلب منه شيئاً أغلى من التاج...",
        subtext: "سلب منه لغته وذاكرته، لكي لا يتمكن أبداً من العودة والمطالبة بعرشه!",
        color: "from-blue-950 to-black"
    },
    {
        id: 4,
        title: "فجر جديد",
        text: "تفتح عيناك بصعوبة على رمال شاطئ غريب...",
        subtext: "فتاة شابة ذات ابتسامة دافئة تنظر إليك. تقول كلمات لا تفهمها. أنت الآن وحيد في عالم جديد، لا تملك سوى عزيمتك.",
        color: "from-emerald-950 to-black"
    }
];

export const Prologue: React.FC<PrologueProps> = ({ onComplete, selectedLanguage }) => {
    const [currentScene, setCurrentScene] = useState(0);

    const nextScene = () => {
        if (currentScene < scenes.length - 1) {
            setCurrentScene(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const scene = scenes[currentScene];

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${scene.color} text-white p-6 md:p-12 relative overflow-hidden transition-colors duration-1000`}>
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)' }}></div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentScene}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="max-w-3xl text-center z-10 flex flex-col items-center gap-8"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-amber-500 font-serif tracking-widest drop-shadow-lg mb-4">
                        {scene.title}
                    </h2>
                    
                    <p className="text-xl md:text-3xl font-medium leading-relaxed drop-shadow-md text-slate-200">
                        {scene.text}
                    </p>
                    
                    <p className="text-lg md:text-xl text-slate-400 mt-4 max-w-2xl leading-relaxed">
                        {scene.subtext}
                    </p>

                    {currentScene === scenes.length - 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="mt-8 p-6 bg-black/40 border border-emerald-500/30 rounded-2xl backdrop-blur-sm"
                        >
                            <p className="text-emerald-400 font-bold text-lg mb-2">أنت الآن في أراضي: {selectedLanguage.name}</p>
                            <p className="text-sm text-slate-300">مهمتك هي أن تكون عقل ليث ولسانه. تعلّم لغتهم، ابنِ قوتك، واستعد للعودة!</p>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            <motion.button
                onClick={nextScene}
                className="absolute bottom-12 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 rounded-full text-amber-100 font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.6)] z-20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {currentScene < scenes.length - 1 ? "التالي" : "ابدأ رحلة ليث"}
            </motion.button>
        </div>
    );
};