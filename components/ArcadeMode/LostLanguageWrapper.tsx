import React, { useEffect, useState, useRef } from 'react';
import { Flashcard, Language, FlashcardStatus } from '../../types';
import NewGameApp from '../../src/App';
import { useGameStore } from '../../src/store';

interface LostLanguageWrapperProps {
  currentDayNumber?: number;
  weakFlashcards: Flashcard[];
  strongFlashcards: Flashcard[];
  language: Language;
  onUpdateFlashcard: (id: string, status: FlashcardStatus) => void;
  onCompleteLevel?: (level: number) => void; // Added here
  onExit: () => void;
}

export default function LostLanguageWrapper({
  currentDayNumber,
  weakFlashcards,
  strongFlashcards,
  language,
  onUpdateFlashcard,
  onCompleteLevel,
  onExit
}: LostLanguageWrapperProps) {
  const gamePhase = useGameStore(state => state.gamePhase);
  const startGame = useGameStore(state => state.startGame);
  const currentLevel = useGameStore(state => state.currentLevel);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      startGame(`${language.englishName} day ${currentDayNumber || 1}`, language.code, weakFlashcards);
    }
  }, [startGame, currentDayNumber, language, weakFlashcards]);

  // Hook into Game Phase to track wins and call onCompleteLevel
  const lastWonLevel = useRef<number | null>(null);

  useEffect(() => {
    if (gamePhase === 'won' && onCompleteLevel && lastWonLevel.current !== currentLevel) {
       lastWonLevel.current = currentLevel;
       onCompleteLevel(currentLevel);
    }
  }, [gamePhase, currentLevel, onCompleteLevel]);

  return (
    <div className="fixed inset-0 z-50 bg-[#c5e1a5] flex flex-col font-cafe" dir="rtl">
      {/* Top Bar Wrapper */}
      <div className="absolute top-4 left-4 z-[9999]">
        <button 
          onClick={onExit}
          className="w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg border-2 border-red-500 flex items-center justify-center text-xl text-red-500 font-bold transition-all"
        >
          ✕
        </button>
      </div>
      
      {/* Newly uploaded Game Canvas Wrapper */}
      <div className="flex-1 relative w-full h-full">
         <NewGameApp />
      </div>
    </div>
  );
}
