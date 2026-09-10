import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sword, RefreshCw, Star, CheckCircle2, ArrowRight, Play, Sparkles, Flame } from 'lucide-react';
import { Button3D } from '@/components/ui/Button3D';
import type { Lesson } from '@/data/lessons/types';
import KnifeHitGame from '@/screens/KnifeHitGame';
import GoblinFightGame from '@/screens/ZombieFightGame';
import { ContextChangeGame } from './ContextChangeGame';
import { useFarmStore } from '@/store/farmStore';

interface Props {
  lesson: Lesson;
  onComplete: () => void;
}

type GameId = 'knife' | 'zombie' | 'context';

export function GamesArenaHub({ lesson, onComplete }: Props) {
  const [activeGame, setActiveGame] = useState<'hub' | GameId>('hub');
  const [completedGames, setCompletedGames] = useState<Set<GameId>>(new Set());
  const { addResources } = useFarmStore();

  const handleGameFinished = (gameId: GameId) => {
    setCompletedGames(prev => {
      const next = new Set(prev);
      const isFirstTime = !next.has(gameId);
      next.add(gameId);
      
      if (isFirstTime) {
        // Award progressive rewards
        if (next.size === 1) addResources(20, 10, 0);
        else if (next.size === 2) addResources(40, 20, 0);
        else if (next.size === 3) addResources(80, 40, 0);
      }
      return next;
    });
    setActiveGame('hub');
  };

  const flashcardsForKnife = (lesson.dialogue || []).map((line: any, i: number) => ({
    id: String(i),
    character: line.character || '',
    originalText: line.native,
    translation: line.translation,
    romanization: line.pronunciation,
    tier: line.tier || 'core'
  }));

  const flashcardsForZombie = (lesson.dialogue || []).map((line: any, i: number) => ({
    id: String(i),
    character: line.character || '',
    originalText: line.native,
    translation: line.translation,
    romanization: line.pronunciation,
    translatedText: line.translation,
    nativeText: null,
    speechRate: 1,
    nextReviewTimestamp: Date.now(),
    status: 'new' as const
  }));

  if (activeGame === 'knife') {
    return (
      <div className="flex-1 w-full h-full min-h-0 relative">
        <KnifeHitGame
          onComplete={() => handleGameFinished('knife')}
          onClose={() => setActiveGame('hub')}
          flashcards={flashcardsForKnife}
          orderMode="text"
          language={lesson.lang}
        />
      </div>
    );
  }

  if (activeGame === 'zombie') {
    return (
      <div className="flex-1 w-full h-full min-h-0 relative">
        <GoblinFightGame
          onClose={() => handleGameFinished('zombie')}
          flashcards={flashcardsForZombie}
          orderMode="text"
        />
      </div>
    );
  }

  if (activeGame === 'context') {
    return (
      <div className="flex-1 w-full h-full min-h-0 relative">
        <ContextChangeGame
          lesson={lesson}
          onComplete={() => handleGameFinished('context')}
        />
      </div>
    );
  }

  const completedCount = completedGames.size;
  const canProceed = completedCount >= 1;

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-3 sm:p-5 max-w-4xl mx-auto overflow-y-auto">
      {/* Header Banner */}
      <div className="text-center w-full mb-3">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-500 font-bold text-xs sm:text-sm mb-2">
          <Trophy className="w-4 h-4" />
          <span>ساحة التحديات والحفظ</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
          اختر لعبتك المفضلة لتثبيت العبارات 🎯
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
          أكمل تحدياً واحداً على الأقل للعبور للقراءة، أو العب الألعاب الثلاث لمضاعفة مكافآت مزرعتك!
        </p>

        {/* Stars Progress */}
        <div className="flex items-center justify-center gap-3 mt-3">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black transition-all ${
                completedCount >= starIdx
                  ? 'bg-amber-100 text-amber-600 border border-amber-300 shadow-sm scale-105'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${completedCount >= starIdx ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
              <span>نجمة {starIdx}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 w-full my-auto">
        
        {/* Card 1: Knife Hit */}
        <motion.div
          whileHover={{ y: -4 }}
          className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border-2 transition-all bg-white shadow-lg ${
            completedGames.has('knife')
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
              : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          {completedGames.has('knife') && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1 rounded-full shadow">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
              🗡️
            </div>
            <h3 className="text-lg font-black text-slate-800">لعبة السكين</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              تحقق دقيق بالصوت أو الكتابة، وتصويب سريع بالسكاكين لتثبيت المفردات.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button3D
              variant={completedGames.has('knife') ? 'ghost' : 'primary'}
              size="sm"
              fullWidth
              onClick={() => setActiveGame('knife')}
              className={!completedGames.has('knife') ? '!bg-amber-500 hover:!bg-amber-600 !border-amber-700 !text-white' : ''}
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              {completedGames.has('knife') ? 'إعادة اللعب' : 'بدء التحدي'}
            </Button3D>
          </div>
        </motion.div>

        {/* Card 2: Zombie Fight */}
        <motion.div
          whileHover={{ y: -4 }}
          className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border-2 transition-all bg-white shadow-lg ${
            completedGames.has('zombie')
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
              : 'border-rose-200 hover:border-rose-400'
          }`}
        >
          {completedGames.has('zombie') && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1 rounded-full shadow">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
              ⚔️
            </div>
            <h3 className="text-lg font-black text-slate-800">معركة الغول</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              تحدي استرجاع سريع تحت الضغط للدفاع عن القلعة ضد هجمات الوحوش.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button3D
              variant={completedGames.has('zombie') ? 'ghost' : 'primary'}
              size="sm"
              fullWidth
              onClick={() => setActiveGame('zombie')}
              className={!completedGames.has('zombie') ? '!bg-rose-500 hover:!bg-rose-600 !border-rose-700 !text-white' : ''}
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              {completedGames.has('zombie') ? 'إعادة اللعب' : 'بدء المعركة'}
            </Button3D>
          </div>
        </motion.div>

        {/* Card 3: Context Change */}
        <motion.div
          whileHover={{ y: -4 }}
          className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border-2 transition-all bg-white shadow-lg ${
            completedGames.has('context')
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
              : 'border-sky-200 hover:border-sky-400'
          }`}
        >
          {completedGames.has('context') && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1 rounded-full shadow">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
              🔄
            </div>
            <h3 className="text-lg font-black text-slate-800">تغيير السياق</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              تطبيق الكلمات في سياقات جديدة ومواقف بديلة لفهم عميق للغة.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button3D
              variant={completedGames.has('context') ? 'ghost' : 'primary'}
              size="sm"
              fullWidth
              onClick={() => setActiveGame('context')}
              className={!completedGames.has('context') ? '!bg-sky-500 hover:!bg-sky-600 !border-sky-700 !text-white' : ''}
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              {completedGames.has('context') ? 'إعادة اللعب' : 'بدء السياق'}
            </Button3D>
          </div>
        </motion.div>

      </div>

      {/* Bottom Action / Next Stage */}
      <div className="w-full pt-4 mt-2 flex flex-col items-center gap-2 border-t border-slate-200/60">
        {canProceed ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm"
          >
            <Button3D
              variant="success"
              size="lg"
              fullWidth
              onClick={onComplete}
              className="py-3.5 text-base font-black !bg-[#58CC02] hover:!bg-[#46A302] !border-[#46A302] !text-white shadow-xl cursor-pointer"
            >
              <span>متابعة إلى مرحلة القراءة</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button3D>
          </motion.div>
        ) : (
          <div className="text-center text-xs font-bold text-slate-400 py-3 bg-slate-100/80 rounded-2xl w-full max-w-sm border border-slate-200">
            🔒 أكمل لعبة واحدة على الأقل لفتح مرحلة القراءة
          </div>
        )}
      </div>
    </div>
  );
}
