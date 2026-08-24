import React, { useState } from 'react';
import { useGameStore } from '../../game/store';
import { GAME_LESSONS, Lesson, LessonWord } from '../../game/lessons';

interface LanguagePortalProps {
  onClose: () => void;
}

export default function LanguagePortal({ onClose }: LanguagePortalProps) {
  const completedLessons = useGameStore((s) => s.completedLessons);
  const completeLesson = useGameStore((s) => s.completeLesson);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [mode, setMode] = useState<'list' | 'learn' | 'quiz'>('list'); // view state
  
  // Learning states
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  // Quiz states
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Start learning flashcards
  const handleStartLearn = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentWordIdx(0);
    setMode('learn');
  };

  // Start multiple-choice quiz
  const handleStartQuiz = () => {
    setQuizIdx(0);
    setSelectedAns(null);
    setIsAnswered(false);
    setScore(0);
    setMode('quiz');
  };

  // Handle quiz option selection
  const handleOptionSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedAns(opt);
    setIsAnswered(true);
    if (opt === selectedLesson!.quizzes[quizIdx].answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIdx < selectedLesson!.quizzes.length - 1) {
      setQuizIdx(quizIdx + 1);
      setSelectedAns(null);
      setIsAnswered(false);
    } else {
      // End of quiz
      const totalQuestions = selectedLesson!.quizzes.length;
      if (score === totalQuestions) {
        // Perfect score reward!
        completeLesson(selectedLesson!.id, 250, 250, 10);
      } else if (score >= totalQuestions - 1) {
        // Passing score reward
        completeLesson(selectedLesson!.id, 150, 150, 5);
      } else {
        // Failed
        // No action, trigger fail dialog locally
        useGameStore.getState().triggerStoryDialog(
          'eli',
          'محاولة جيدة ولكن لم تنجح 🥀',
          'لا تيأس! أعِد قراءة الكلمات بتركيز وجرّب الاختبار مرة أخرى لتروي القرية وتجمع الموارد!'
        );
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
      <div className="w-full max-w-md bg-[#FDF6E3] border-4 border-[#C4603A] rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] text-[#5C3D2E]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#C4603A]/30 pb-3 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>📚</span> بوابة التعليم والدرع الذهبي
          </h2>
          <button 
            onClick={onClose}
            className="text-[#C4603A] hover:bg-[#C4603A]/10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* MODE: Lessons list */}
        {mode === 'list' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <p className="text-xs text-stone-500 mb-2">
              اختر درساً لتعلم الكلمات الإنجليزية. النجاح في الاختبار يمنحك موارد وفيرة ويجلب مشاة لجيشك، كما يفعّل الدرع الحامي لقريتك!
            </p>
            
            {GAME_LESSONS.map((les) => {
              const isCompleted = completedLessons.includes(les.id);
              return (
                <div 
                  key={les.id}
                  className="bg-[#F5E6C8]/40 border border-[#C4603A]/20 hover:border-[#C4603A] p-4 rounded-xl transition-all flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-[#8FAF7E]/20 text-[#8FAF7E] border border-[#8FAF7E]/30 rounded-md font-mono text-[10px] font-bold">
                        {les.level}
                      </span>
                      {isCompleted && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                          ✓ تم الإنجاز
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#5C3D2E]">{les.nameAr}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                      {les.descriptionAr}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartLearn(les)}
                    className={`mr-3 py-2 px-3.5 rounded-xl font-bold text-xs transition-all ${
                      isCompleted 
                        ? 'bg-[#8FAF7E] text-white hover:bg-[#8FAF7E]/90' 
                        : 'bg-[#C4603A] text-white hover:bg-[#d16f49] border-b-2 border-[#5C3D2E]'
                    }`}
                  >
                    {isCompleted ? 'إعادة مراجعة' : 'دراسة الآن ⚔️'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* MODE: Learn Flashcards */}
        {mode === 'learn' && selectedLesson && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="text-center">
              <span className="text-xs font-mono text-[#8FAF7E] font-bold">
                الدرس {selectedLesson.level} - خطوة التعلم واللفظ ({currentWordIdx + 1} من {selectedLesson.words.length})
              </span>
              <h3 className="text-base font-bold text-[#5C3D2E] mt-1">{selectedLesson.nameAr}</h3>
            </div>

            {/* Flashcard board */}
            <div className="my-6 bg-gradient-to-br from-[#8FAF7E]/10 to-[#8FAF7E]/5 border-2 border-dashed border-[#8FAF7E]/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner relative min-h-[160px]">
              <span className="text-5xl mb-2">💡</span>
              <h1 className="text-3xl font-mono font-black text-[#5C3D2E] tracking-wide">
                {selectedLesson.words[currentWordIdx].word}
              </h1>
              <h2 className="text-lg font-bold text-[#C4603A] mt-2">
                {selectedLesson.words[currentWordIdx].meaning}
              </h2>
              <p className="text-xs text-stone-500 mt-2 bg-[#FDF6E3] px-3 py-1 rounded-full border border-stone-200">
                🎙️ النطق المساعد: {selectedLesson.words[currentWordIdx].hintAr}
              </p>
            </div>

            {/* Flashcard navigation */}
            <div className="flex gap-2">
              {currentWordIdx > 0 ? (
                <button
                  onClick={() => setCurrentWordIdx(currentWordIdx - 1)}
                  className="flex-1 py-2.5 px-3 bg-stone-200 hover:bg-stone-300 rounded-xl text-xs font-bold text-stone-700 transition-all"
                >
                  السابق
                </button>
              ) : (
                <button
                  onClick={() => setMode('list')}
                  className="flex-1 py-2.5 px-3 bg-stone-200 hover:bg-stone-300 rounded-xl text-xs font-bold text-stone-700 transition-all"
                >
                  عودة للمفردات
                </button>
              )}

              {currentWordIdx < selectedLesson.words.length - 1 ? (
                <button
                  onClick={() => setCurrentWordIdx(currentWordIdx + 1)}
                  className="flex-1 py-2.5 px-3 bg-[#8FAF7E] hover:bg-[#8FAF7E]/90 text-white rounded-xl text-xs font-bold transition-all"
                >
                  الكلمة التالية ➔
                </button>
              ) : (
                <button
                  onClick={handleStartQuiz}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#C4603A] to-[#8FAF7E] hover:from-[#d16f49] hover:to-[#a0c28f] text-white rounded-xl text-xs font-bold transition-all"
                >
                  بدء اختبار الدرس 📝
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE: Interactive Quiz */}
        {mode === 'quiz' && selectedLesson && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Header progress info */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>سؤال {quizIdx + 1} من {selectedLesson.quizzes.length}</span>
                <span>النتيجة الحالية: {score}</span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-[#C4603A] h-full transition-all duration-300" 
                  style={{ width: `${((quizIdx + 1) / selectedLesson.quizzes.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question box */}
            <div className="my-5 p-5 bg-[#F5E6C8]/60 border border-[#C4603A]/20 rounded-xl text-center">
              <span className="text-xs text-[#C4603A] font-bold block mb-1">اختبار المعرفة</span>
              <p className="text-base font-bold text-[#5C3D2E]">
                {selectedLesson.quizzes[quizIdx].question}
              </p>
            </div>

            {/* Options list */}
            <div className="space-y-2 mb-6">
              {selectedLesson.quizzes[quizIdx].options.map((opt) => {
                const isSelected = selectedAns === opt;
                const isCorrect = opt === selectedLesson.quizzes[quizIdx].answer;
                
                let btnStyle = 'border-stone-200 bg-white hover:bg-stone-50';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500 bg-red-100 text-red-900';
                  } else {
                    btnStyle = 'border-stone-200 bg-white opacity-60';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-[#C4603A] bg-[#C4603A]/10 text-[#C4603A]';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={isAnswered}
                    className={`w-full p-3.5 border-2 rounded-xl text-sm font-bold text-right transition-all flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && <span className="text-emerald-600">✓ صحيح</span>}
                    {isAnswered && isSelected && !isCorrect && <span className="text-red-600">✗ خطأ</span>}
                  </button>
                );
              })}
            </div>

            {/* Bottom action bar */}
            <div>
              {isAnswered ? (
                <button
                  onClick={handleNextQuizQuestion}
                  className="w-full py-3 bg-[#C4603A] hover:bg-[#d16f49] text-white font-bold rounded-xl text-sm transition-all"
                >
                  {quizIdx < selectedLesson.quizzes.length - 1 ? 'السؤال التالي ➔' : 'إنهاء وإعلان النتيجة 🏁'}
                </button>
              ) : (
                <p className="text-center text-[10px] text-stone-500 py-2">
                  اختر الإجابة الصحيحة للتقدم.
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
