import React, { useState } from 'react';
import { Flashcard, Language, FlashcardStatus } from '../../types';
import LostLanguageWrapper from './LostLanguageWrapper';
import LingoCafeStage from '../LingoCafeStage'; // Import LingoCafeStage
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import KnifeHitGame from '../../src/screens/KnifeHitGame';
import ZombieFightGame from '../../src/screens/ZombieFightGame';

interface ArcadeScreenProps {
  initialGame?: 'none' | 'lostlanguage' | 'cafe' | 'knifehit' | 'zombie';
  currentDayNumber?: number;
  flashcards: Flashcard[];
  language: Language;
  nativeLanguage: Language;
  onUpdateFlashcard: (id: string, status: FlashcardStatus) => void;
  onCompleteLesson: (dayNumber: number) => void;
  onClose: () => void;
}

export default function ArcadeScreen({
  initialGame = 'none',
  currentDayNumber,
  flashcards,
  language,
  nativeLanguage,
  onUpdateFlashcard,
  onCompleteLesson,
  onClose
}: ArcadeScreenProps) {
  const [selectedGame, setSelectedGame] = useState<'none' | 'lostlanguage' | 'cafe' | 'knifehit' | 'zombie'>(initialGame);

  const weakFlashcards = flashcards.filter(f => f.status === 'again' || f.status === 'hard');
  const strongFlashcards = flashcards.filter(f => f.status === 'good' || f.status === 'easy');
  const weakCount = weakFlashcards.length;

  if (selectedGame === 'lostlanguage') {
    return (
      <ErrorBoundary onSkip={() => setSelectedGame('none')}>
        <LostLanguageWrapper
          currentDayNumber={currentDayNumber}
          weakFlashcards={weakFlashcards}
          strongFlashcards={strongFlashcards}
          language={language}
          onUpdateFlashcard={onUpdateFlashcard}
          onCompleteLevel={onCompleteLesson}
          onExit={() => setSelectedGame('none')}
        />
      </ErrorBoundary>
    );
  }

  if (selectedGame === 'cafe') {
      return (
          <div className="fixed inset-0 z-50 bg-[#f4ebd0] flex flex-col">
              <div className="flex-shrink-0 p-4 bg-white/80 backdrop-blur-md shadow-sm z-50 flex items-center">
                  <button onClick={() => setSelectedGame('none')} className="text-purple-600 font-bold px-4 py-2 hover:bg-purple-100 rounded-xl transition-colors">
                      &larr; رجوع للألعاب
                  </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                  <ErrorBoundary onSkip={() => setSelectedGame('none')}>
                      <LingoCafeStage
                          language={language}
                          nativeLanguage={nativeLanguage}
                          topic={{ id: 'arcade', title: 'محادثة حرة في المقهى' }}
                          onAddFlashcard={() => {}}
                      />
                  </ErrorBoundary>
              </div>
          </div>
      );
  }

  if (selectedGame === 'knifehit') {
    return (
      <ErrorBoundary onSkip={() => setSelectedGame('none')}>
        <KnifeHitGame 
          onClose={() => setSelectedGame('none')} 
          flashcards={flashcards}
          language={language}
        />
      </ErrorBoundary>
    );
  }

  if (selectedGame === 'zombie') {
    return (
      <ErrorBoundary onSkip={() => setSelectedGame('none')}>
        <ZombieFightGame flashcards={flashcards} onClose={() => setSelectedGame('none')} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1e0a3c] text-white flex flex-col font-cafe" dir="rtl">
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 border-b border-purple-900/50 bg-[#1e0a3c]/80 backdrop-blur-sm shadow-xl">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-yellow-300 to-orange-400">
          🎮 ساحة الأركيد
        </h1>
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-2xl transition-all"
        >
          ✕
        </button>
      </div>

      {/* Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Lost Language */}
          <div className="rounded-2xl border-4 border-[#3e2723] bg-[#f4ebd0] text-[#3e2723] p-6 flex flex-col relative overflow-hidden shadow-[8px_8px_0_#3e2723] transition-transform hover:-translate-y-1">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-black mb-2">متاهة اللغة</h2>
            <p className="text-lg opacity-80 mb-6 flex-1">ساعد بطلك على إيقاع الوحوش في الفخ! راجع كلماتك الضعيفة.</p>
            
            <div className={`py-2 px-4 rounded-full text-center font-bold mb-6 ${weakCount > 0 ? 'bg-red-500/20 text-red-700' : 'bg-green-500/20 text-green-700'}`}>
              {weakCount > 0 ? `${weakCount} كلمة تحتاج مراجعة` : 'كل كلماتك ممتازة ✓'}
            </div>
            
            <button 
              onClick={() => setSelectedGame('lostlanguage')}
              className="w-full py-3 rounded-xl font-bold text-xl border-b-4 transition-all bg-[#4caf50] text-white border-[#2e7d32] hover:brightness-110 active:border-b-0 active:translate-y-1"
            >
              العب الآن!
            </button>
          </div>

          {/* Card 2: Knife Hit */}
          <div className="rounded-2xl border-4 border-[#3e2723] bg-[#f4ebd0] text-[#3e2723] p-6 flex flex-col relative overflow-hidden shadow-[8px_8px_0_#3e2723] transition-transform hover:-translate-y-1">
            <div className="text-6xl mb-4">🔪</div>
            <h2 className="text-2xl font-black mb-2">اصطدام السكاكين (Lingo Hit)</h2>
            <p className="text-lg opacity-80 mb-6 flex-1">أطلق السكاكين على الكلمات الصحيحة بالصوت والميكروفون!</p>
            <div className="py-2 px-4 rounded-full text-center font-bold mb-6 bg-blue-500/10 text-blue-800">
              {flashcards.length || 8} كلمات متاحة للدراسة
            </div>
            <button 
              onClick={() => setSelectedGame('knifehit')}
              className="w-full py-3 rounded-xl font-bold text-xl border-b-4 transition-all bg-[#4caf50] text-white border-[#2e7d32] hover:brightness-110 active:border-b-0 active:translate-y-1 cursor-pointer"
            >
              العب الآن!
            </button>
          </div>

          {/* Card 3: Zombie */}
          <div className="rounded-2xl border-4 border-[#3e2723] bg-[#f4ebd0] text-[#3e2723] p-6 flex flex-col relative overflow-hidden shadow-[8px_8px_0_#3e2723] transition-transform hover:-translate-y-1">
            <div className="text-6xl mb-4">🧟</div>
            <h2 className="text-2xl font-black mb-2">زومبي (Zombie Fight)</h2>
            <p className="text-lg opacity-80 mb-6 flex-1">دافع عن نباتك ضد وحوش الكلمات</p>
            <div className="py-2 px-4 rounded-full text-center font-bold mb-6 bg-blue-500/10 text-blue-800">
              {flashcards.length} كلمة متاحة
            </div>
            <button 
              onClick={() => setSelectedGame('zombie')}
              className="w-full py-3 rounded-xl font-bold text-xl border-b-4 transition-all bg-[#4caf50] text-white border-[#2e7d32] hover:brightness-110 active:border-b-0 active:translate-y-1 cursor-pointer"
            >
              العب الآن!
            </button>
          </div>

          {/* Card 4: Cafe */}
          <div className="rounded-2xl border-4 border-[#3e2723] bg-[#f4ebd0] text-[#3e2723] p-6 flex flex-col relative overflow-hidden shadow-[8px_8px_0_#3e2723] transition-transform hover:-translate-y-1">
            <div className="text-6xl mb-4">☕</div>
            <h2 className="text-2xl font-black mb-2">لينغو كافيه</h2>
            <p className="text-lg opacity-80 mb-6 flex-1">محادثة حرة مع المعلم، تدرب على أي موضوع تريده.</p>
            <div className="py-2 px-4 rounded-full text-center font-bold mb-6 bg-purple-500/20 text-purple-700">
              مفتوح دائماً للحديث!
            </div>
            <button
              onClick={() => setSelectedGame('cafe')} 
              className="w-full py-3 rounded-xl font-bold text-xl border-b-4 transition-all bg-[#4caf50] text-white border-[#2e7d32] hover:brightness-110 active:border-b-0 active:translate-y-1"
            >
              العب الآن!
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
