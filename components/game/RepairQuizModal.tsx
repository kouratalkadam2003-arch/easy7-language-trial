import React, { useState } from 'react';
import { useGameStore } from '../../game/store';
import { BUILDING_DEFS } from '../../game/constants';
import { dueCards, rateCard } from '../../lib/cardStore';
import { SRSButtons, SRSRating } from '../SRSButtons';

interface RepairQuizModalProps {
  buildingId: string;
  onClose: () => void;
}

export default function RepairQuizModal({ buildingId, onClose }: RepairQuizModalProps) {
  const buildings = useGameStore((s) => s.buildings);
  const waterOrRepairBuilding = useGameStore((s) => s.waterOrRepairBuilding);
  const triggerStoryDialog = useGameStore((s) => s.triggerStoryDialog);

  const building = buildings.find((b) => b.id === buildingId);
  if (!building) return null;

  const bDef = BUILDING_DEFS[building.type];
  
  // Get due cards from cardStore (max 5 cards)
  const [cards] = useState(() => dueCards().slice(0, 5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState(0);

  const currentCard = cards[currentIndex];
  const isFinished = !currentCard;

  const handleRate = (rating: SRSRating) => {
    if (!currentCard || !flipped) return;
    
    // Update cardStore
    rateCard(currentCard.id, rating);
    
    // Update farmStore
    const farmRatingMap: Record<SRSRating, string> = {
      'again': 'forgot',
      'hard': 'hard',
      'good': 'normal',
      'easy': 'perfect'
    };
    // Note: This would need to be connected to farmStore.reviewSeed if we want farm integration
    
    const isCorrect = rating === 'good' || rating === 'easy';
    if (isCorrect) setScore(prev => prev + 1);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
    } else {
      // Finished
      const total = cards.length;
      if (score >= total * 0.7) {
        // Success - repair the building
        waterOrRepairBuilding(buildingId);
      } else {
        // Failed
        triggerStoryDialog(
          'eli',
          'مراجعة غير دقيقة 🥀',
          `للأسف يا ليث، أخطأت في الإجابات ولم نستطع إصلاح أو ري ${bDef.nameAr}. أعِد قراءة الدروس وحاول مجدداً!`
        );
      }
      onClose();
    }
  };

  const isCollector = building.type === 'gold_mine' || building.type === 'elixir_collector';

  if (isFinished || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">✅ تمت المراجعة!</h2>
          <p className="text-gray-600 mb-4">صحيح: {score} من {cards.length}</p>
          <button onClick={onClose} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold">
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{isCollector ? '💦 ريّ ومراجعة' : '🛠️ إصلاح ومراجعة'} {bDef.nameAr}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">{currentIndex + 1} / {cards.length} — صحيح: {score}</p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1 rounded-full mb-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
        
        {/* Card */}
        <div
          className="w-full h-48 cursor-pointer perspective-1000 mb-4"
          onClick={() => setFlipped(!flipped)}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
              <p className="text-xl font-bold text-gray-800" dir="ltr">{currentCard.native}</p>
              <p className="text-sm text-gray-400 mt-4">اضغط لرؤية الترجمة</p>
            </div>
            
            {/* Back */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white">
              <p className="text-2xl font-bold">{currentCard.translation}</p>
            </div>
          </div>
        </div>

        {/* SRS Buttons */}
        <div className={`transition-all duration-300 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <p className="text-center text-sm text-gray-500 mb-3">كيف كان تذكّرك؟</p>
          <SRSButtons onRate={handleRate} disabled={!flipped} />
        </div>
      </div>
    </div>
  );
}
