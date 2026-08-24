import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, GraduationCap, Globe, ChevronLeft } from 'lucide-react';

interface ModeSelectionProps {
  onSelectMode: (mode: 'story' | 'normal') => void;
  onSkip: () => void;
}

export function ModeSelection({ onSelectMode, onSkip }: ModeSelectionProps) {
  // Background gradient animation variants
  const bgVariants = {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: { duration: 6, ease: 'easeInOut', repeat: Infinity },
    },
  };

  const floatVariants = {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.5, ease: 'easeOut' },
    }),
    hover: { scale: 1.02, y: -4, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FFF8F0] to-[#F0F9FF]"
      variants={bgVariants}
      animate="animate"
      style={{ backgroundSize: '200% 200%' }}
      dir="rtl"
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center w-full max-w-md mx-auto">
        <button
          onClick={onSkip}
          className="text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          تخطي
        </button>
        <div className="flex items-center gap-2 text-slate-400">
          <Globe className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">المنصة</span>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col items-center z-10 pt-12 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-bold text-[#1E293B] mb-2 text-center"
        >
          كيف تفضل أن تتعلم؟
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 mb-10 text-center text-sm"
        >
          اختر طريقتك المفضلة لبدء رحلتك
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-5 w-full">
          {/* Story Mode Card */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onClick={() => onSelectMode('story')}
            className="flex-1 rounded-[24px] p-6 cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] bg-gradient-to-br from-[#1E3A5F] to-[#2D5A87] border border-white/10 group"
          >
            {/* Sparkle Decoration */}
            <div className="absolute top-4 right-4 text-[#F59E0B] opacity-50">
              <Sparkles className="w-5 h-5" />
            </div>
            
            {/* Badge */}
            <div className="absolute top-4 left-4 bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" /> جديد
            </div>

            <motion.div variants={floatVariants} className="mt-4 mb-4 text-5xl">
              🎭
            </motion.div>

            <h3 className="text-white font-bold text-[20px] mb-3">وضع القصة</h3>
            
            <p className="text-white/80 text-[14px] leading-relaxed mb-6 flex-grow">
              عُش قصة ليث المثيرة وتعلم الإنجليزية من خلال محادثات تفاعلية ومشاهد سينمائية.
            </p>

            <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-8 rounded-full text-sm transition-colors border border-white/20 group-hover:bg-white group-hover:text-[#1E3A5F]">
              ابدأ القصـة
            </button>
          </motion.div>

          {/* Normal Mode Card */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onClick={() => onSelectMode('normal')}
            className="flex-1 rounded-[24px] p-6 cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] bg-gradient-to-br from-[#059669] to-[#10B981] border border-white/20 group"
          >
            {/* Badge */}
            <div className="absolute top-4 left-4 bg-white text-[#059669] text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              الأشهر
            </div>

            <motion.div variants={floatVariants} className="mt-4 mb-4 text-5xl">
              📚
            </motion.div>

            <h3 className="text-white font-bold text-[20px] mb-3">وضع التعلم</h3>
            
            <p className="text-white/80 text-[14px] leading-relaxed mb-6 flex-grow">
              تعلم بخطوات منظمة مع دروس يومية وبطاقات ذاكرة وألعاب تفاعلية لترسيخ حفظك.
            </p>

            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-8 rounded-full text-sm transition-colors border border-white/20 group-hover:bg-white group-hover:text-[#059669]">
              ابدأ التعلـم
            </button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-slate-400 text-xs mt-8"
        >
          يمكنك التعديل لاحقاً من الإعدادات
        </motion.p>
      </div>
    </motion.div>
  );
}
