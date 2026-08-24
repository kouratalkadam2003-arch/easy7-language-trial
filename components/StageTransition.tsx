import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle, Star } from 'lucide-react';

interface Props {
  fromStageName: string;
  toStageName: string;
  isComplete?: boolean;
  onProceed: () => void;
  starsCount?: number;
  lessonReport?: string;
}

export default function StageTransition({ fromStageName, toStageName, isComplete, onProceed, starsCount = 3, lessonReport }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isComplete) return; // Don't auto-proceed on the final report screen
    
    const timer = setInterval(() => {
      setProgress(p => Math.min(p + 2, 100)); // Fills over ~1 second
    }, 25);

    const timeout = setTimeout(() => {
      onProceed();
    }, 3000); // Auto proceed after 3s

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [onProceed, isComplete]);

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px] w-full max-w-2xl mx-auto mt-10 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100 border border-emerald-200 shadow-xl overflow-y-auto relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.6 }}
        className="bg-white p-5 rounded-full shadow-lg mb-6 relative z-10"
      >
        <CheckCircle className="w-20 h-20 text-emerald-500" />
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
           className="absolute -top-3 -right-3 text-yellow-500"
        >
          <Sparkles className="w-10 h-10 fill-yellow-400" />
        </motion.div>
      </motion.div>

      <h2 className="text-3xl font-bold text-gray-800 mb-3 font-display z-10 text-center" dir="rtl">
        {isComplete ? "ممتاز، لقد أنهيت الدرس بنجاح!" : `لقد أكملت مرحلة ${fromStageName} ببراعة!`}
      </h2>
      
      {!isComplete && (
        <p className="text-xl text-emerald-700 font-medium mb-8 z-10" dir="rtl">
          أنت تتقدم بسرعة! سننتقل الآن إلى <span className="font-bold text-emerald-900 border-b-2 border-emerald-300">{toStageName}</span>...
        </p>
      )}

      {isComplete && (
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="flex flex-col items-center w-full z-10 gap-6 mb-8"
        >
            <div className="flex gap-4 justify-center">
                {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                       key={i}
                       initial={{ scale: 0, rotate: -45 }}
                       animate={{ scale: 1, rotate: 0 }}
                       transition={{ delay: 0.5 + (i * 0.2), type: 'spring', bounce: 0.6 }}
                    >
                       <Star className={`w-16 h-16 ${i < starsCount ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg' : 'text-gray-300'}`} />
                    </motion.div>
                ))}
            </div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 1.2 }}
               className="bg-amber-100 border-2 border-amber-400 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm"
               dir="rtl"
            >
                <div className="w-10 h-10 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center font-bold text-yellow-900 shadow-inner">💰</div>
                <div>
                    <h3 className="text-amber-900 font-black text-xl">مكافأة إتمام المهام!</h3>
                    <p className="text-amber-800 font-medium">حصلت على الذهب والإكسير، تمت الإضافة إلى رصيدك.</p>
                </div>
            </motion.div>
            
            {lessonReport && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 1.5 }}
                  className="bg-white/80 p-6 rounded-2xl border border-emerald-200 shadow-sm w-full max-w-lg text-right"
                  dir="rtl"
                >
                    <h3 className="text-xl font-bold text-emerald-900 mb-2">تقرير الدرس المنجز:</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{lessonReport}</p>
                </motion.div>
            )}
        </motion.div>
      )}

      {!isComplete && (
        <div className="w-full max-w-md bg-emerald-200/50 rounded-full h-3 mb-6 overflow-hidden shadow-inner z-10">
          <motion.div 
            className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <button 
        onClick={onProceed}
        className="juicy-button bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-8 py-3 text-lg font-bold shadow-md z-10 flex items-center gap-2"
        dir="rtl"
      >
        {isComplete ? "نم جيداً... وغداً مغامرة جديدة! 🏆" : "انتقل الآن 🚀"}
      </button>
    </div>
  );
}
