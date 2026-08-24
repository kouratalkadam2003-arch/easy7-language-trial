import React, { useState } from 'react';
import { useGameStore } from '../../game/store';
import { GAME_LESSONS, Lesson, LessonQuiz } from '../../game/lessons';
import { BUILDING_DEFS } from '../../game/constants';

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
  
  // Find linked lesson
  const linkedLesson = GAME_LESSONS.find((l) => l.buildingType === building.type) || GAME_LESSONS[0];

  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedAns(opt);
    setIsAnswered(true);
    if (opt === linkedLesson.quizzes[quizIdx].answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (quizIdx < linkedLesson.quizzes.length - 1) {
      setQuizIdx(quizIdx + 1);
      setSelectedAns(null);
      setIsAnswered(false);
    } else {
      // Finished
      const total = linkedLesson.quizzes.length;
      if (score === total) {
        // Success
        waterOrRepairBuilding(buildingId);
      } else {
        // Failed
        triggerStoryDialog(
          'wife',
          'مراجعة غير دقيقة 🥀',
          `للأسف يا جلالة الملك، أخطأت في الإجابات ولم نستطع إصلاح أو ري ${bDef.nameAr}. أعِد قراءة الدروس في بوابة التعليم وحاول مجدداً لتنقذ القرية!`
        );
      }
      onClose();
    }
  };

  const isCollector = building.type === 'gold_mine' || building.type === 'elixir_collector';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
      <div className="w-full max-w-md bg-[#FDF6E3] border-4 border-[#C4603A] rounded-2xl p-5 shadow-2xl flex flex-col text-[#5C3D2E]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#C4603A]/30 pb-3 mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span>{isCollector ? '💦 ريّ ومراجعة' : '🛠️ إصلاح ومراجعة'}</span>
            {bDef.nameAr} (مستوى {building.level})
          </h2>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Info detail */}
        <div className="mb-4 text-xs text-stone-500 bg-[#F5E6C8]/40 p-3 rounded-lg border border-dashed border-[#C4603A]/20">
          هذا المبنى مرتبط بمفردات <b>({linkedLesson.nameAr})</b>. أجب بشكل صحيح على <b>{linkedLesson.quizzes.length} أسئلة مراجعة</b> لتنشيط العمال و{isCollector ? 'ريّ الأرض الجافة ليرتفع الإنتاج' : 'إصلاح التصدعات الهيكلية للمبنى'}!
        </div>

        {/* Quiz panel */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-stone-500 mb-1">
              <span>مراجعة: {quizIdx + 1} من {linkedLesson.quizzes.length}</span>
              <span>الإجابات الصحيحة: {score}</span>
            </div>
            <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden mb-4">
              <div 
                className="bg-[#8FAF7E] h-full transition-all duration-300"
                style={{ width: `${((quizIdx + 1) / linkedLesson.quizzes.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="bg-white border border-stone-200 p-4 rounded-xl text-center mb-4">
              <p className="text-sm font-bold text-[#5C3D2E]">
                {linkedLesson.quizzes[quizIdx].question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {linkedLesson.quizzes[quizIdx].options.map((opt) => {
                const isSelected = selectedAns === opt;
                const isCorrect = opt === linkedLesson.quizzes[quizIdx].answer;
                
                let btnStyle = 'border-stone-200 bg-white hover:bg-stone-50';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500 bg-red-50 text-red-900';
                  } else {
                    btnStyle = 'border-stone-100 bg-stone-50 opacity-50';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-[#C4603A] bg-[#C4603A]/5 text-[#C4603A]';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={isAnswered}
                    className={`w-full p-3 border-2 rounded-xl text-xs font-bold text-right transition-all flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && <span className="text-emerald-600 text-[10px]">✓ صحيح</span>}
                    {isAnswered && isSelected && !isCorrect && <span className="text-red-600 text-[10px]">✗ خطأ</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action */}
          <div>
            {isAnswered ? (
              <button
                onClick={handleNext}
                className="w-full py-2.5 bg-[#C4603A] hover:bg-[#d16f49] text-white text-xs font-bold rounded-xl transition-all border-b-2 border-[#5C3D2E] active:border-b-0"
              >
                {quizIdx < linkedLesson.quizzes.length - 1 ? 'السؤال التالي ➔' : 'تأكيد عملية الصيانة 🛠️'}
              </button>
            ) : (
              <p className="text-center text-[10px] text-stone-400 py-2">
                اختر إجابة صحيحة لتشغيل عملية الإصلاح السحرية!
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
