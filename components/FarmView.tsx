import React from 'react';
import { useFarmStore } from '../farmStore';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';

interface FarmViewProps {
  onContinueLesson?: () => void;
  onAIPractice?: () => void;
  onZombieBattle?: () => void;
  onKnifeHit?: () => void;
}

export const FarmView: React.FC<FarmViewProps> = ({
  onContinueLesson,
  onAIPractice,
  onZombieBattle,
  onKnifeHit
}) => {
    const { points, seeds } = useFarmStore();
    const wordsMastered = Object.keys(seeds).length || 124; // Fallback to 124 if empty
    
    // Using mock data for stats to match the design for now
    const dayStreak = 7;
    const xpPoints = points > 0 ? points : 1340;

    return (
        <div className="flex flex-col h-full bg-[#FAF8F5] font-sans overflow-y-auto pb-20 custom-scrollbar">
            
            {/* Top Image Section */}
            <div className="relative w-full h-[35vh] min-h-[250px] bg-[url('/village-map-bg.jpg')] bg-cover bg-center bg-no-repeat shadow-sm border-b-4 border-[#E8DCC8]">
                {/* Fallback styling in case image is missing */}
                <div className="absolute inset-0 bg-[#D4E1C6] -z-10 flex items-center justify-center">
                   <span className="text-white/50 font-bold text-sm">/village-map-bg.jpg</span>
                </div>
                
                {/* Words Mastered Badge */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-full px-4 py-2 font-bold text-slate-800 flex items-center gap-2 shadow-md border border-slate-100">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    Words Mastered: {wordsMastered}
                </div>
            </div>

            {/* Stats Row */}
            <div className="px-4 mt-6">
                <div className="flex items-center gap-3 justify-center w-full max-w-md mx-auto">
                    {/* Day Streak */}
                    <div className="flex-1 card-paper !rounded-[1.5rem] p-3 flex flex-col items-center justify-center">
                        <span className="text-3xl mb-1 block">🔥</span>
                        <span className="text-xl font-bold text-[#5c3d2e]">{dayStreak}</span>
                        <span className="text-[10px] text-amber-800/60 font-black mt-1 uppercase tracking-wider">النقاط</span>
                    </div>
                    {/* XP Points */}
                    <div className="flex-1 card-paper !rounded-[1.5rem] p-3 flex flex-col items-center justify-center">
                        <span className="text-3xl mb-1 block text-yellow-400 drop-shadow-md">⭐</span>
                        <span className="text-xl font-bold text-[#5c3d2e]">{xpPoints}</span>
                        <span className="text-[10px] text-amber-800/60 font-black mt-1 uppercase tracking-wider">الخبرة</span>
                    </div>
                    {/* Words */}
                    <div className="flex-1 card-paper !rounded-[1.5rem] p-3 flex flex-col items-center justify-center">
                        <span className="text-3xl mb-1 block">📚</span>
                        <span className="text-xl font-bold text-[#5c3d2e]">{wordsMastered}</span>
                        <span className="text-[10px] text-amber-800/60 font-black mt-1 uppercase tracking-wider">الكلمات</span>
                    </div>
                </div>
            </div>

            {/* Today's Journey */}
            <div className="px-4 mt-8 w-full max-w-md mx-auto">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-2xl font-bold text-[#5D4037]">Today's Journey</h2>
                    <span className="text-base font-bold text-[#A68A77]">اليوم</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Continue Lesson */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onContinueLesson}
                        className="card-paper hover:brightness-95 transition-all !rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer outline-none w-full"
                    >
                        <span className="text-5xl mb-3 block drop-shadow-sm">📖</span>
                        <h3 className="font-bold text-[#5c3d2e] text-lg leading-tight mb-1">متابعة الدرس</h3>
                        <p className="text-xs text-amber-800/70 font-medium">الطعام والشراب</p>
                    </motion.button>
                    
                    {/* AI Practice */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAIPractice}
                        className="card-paper hover:brightness-95 transition-all !rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer outline-none w-full"
                    >
                        <span className="text-5xl mb-3 block drop-shadow-sm">🎙️</span>
                        <h3 className="font-bold text-[#5c3d2e] text-lg leading-tight mb-1">التدريب الحي</h3>
                        <p className="text-xs text-amber-800/70 font-medium">تحدث مع إيلي</p>
                    </motion.button>

                    {/* Goblin Battle */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onZombieBattle}
                        className="card-paper hover:brightness-95 transition-all !rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer outline-none w-full"
                    >
                        <span className="text-5xl mb-3 block drop-shadow-sm">🧌</span>
                        <h3 className="font-bold text-[#5c3d2e] text-lg leading-tight mb-1">قتال العفاريت</h3>
                        <p className="text-xs text-amber-800/70 font-medium">تحدي الكلمات</p>
                    </motion.button>

                    {/* Knife Hit */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onKnifeHit}
                        className="card-paper hover:brightness-95 transition-all !rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer outline-none w-full"
                    >
                        <span className="text-5xl mb-3 block drop-shadow-sm">🎯</span>
                        <h3 className="font-bold text-[#5c3d2e] text-lg leading-tight mb-1">رمي السكاكين</h3>
                        <p className="text-xs text-amber-800/70 font-medium">ألعاب دقة</p>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
