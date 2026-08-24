import React from 'react';
import { useStore } from '../store';
import World from './World';

export default function GameScene({ onExit, onWin }: { onExit: () => void, onWin: () => void }) {
  const { 
    currentQuest, 
    puzzlePhase, 
    puzzleAttempt, 
    isMocking, 
    mockeryMessage, 
    showAbsurdScene, 
    collectedItems,
    addToPuzzle,
    removeFromPuzzle,
    checkPuzzle,
    retryPuzzle
  } = useStore();

  const playTTS = (text: string, lang = 'en-US') => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="relative w-full h-full bg-[#1a0f2e] overflow-hidden flex flex-col font-sans" dir="rtl">
      
      {/* 3D World fills the background */}
      <div className={`absolute inset-0 transition-all duration-700 ${puzzlePhase || showAbsurdScene ? 'blur-md scale-105 opacity-50 pointer-events-none' : ''}`}>
        <World />
      </div>

      {/* Top UI Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4 pointer-events-none">
        <button onClick={onExit} className="pointer-events-auto bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-md backdrop-blur transition-colors">
          خروج
        </button>
        {currentQuest && !puzzlePhase && !showAbsurdScene && (
          <div className="bg-black/60 text-white p-4 rounded-2xl max-w-md text-center shadow-xl backdrop-blur-md border border-purple-500/30">
            <h3 className="text-purple-300 font-bold mb-1">رسالة من الـ Game Master:</h3>
            <p className="font-medium leading-relaxed">{currentQuest.questBrief}</p>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar */}
      {!puzzlePhase && !showAbsurdScene && currentQuest && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="bg-black/60 px-6 py-3 rounded-full flex gap-3 items-center backdrop-blur-md border border-white/10">
            <span className="text-white font-bold">التقدم:</span>
            {currentQuest.syllables.map((s, i) => {
              const collected = collectedItems.find(c => c.sound === s.sound);
              return (
                <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm shadow-inner transition-all duration-500 ${collected ? 'bg-green-500 text-white scale-110' : 'bg-gray-700 text-gray-400'}`}>
                   {collected ? '✓' : i+1}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PUZZLE PHASE OVERLAY */}
      {puzzlePhase && !showAbsurdScene && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#f4ebd0] p-8 rounded-[2rem] shadow-2xl border-4 border-[#3e2723] max-w-2xl w-[90%] pointer-events-auto relative">
             
             {isMocking ? (
                <div className="animate-[shake_0.5s_ease-in-out_infinite] bg-red-100 border-4 border-red-500 p-6 rounded-2xl text-center">
                  <div className="text-6xl mb-4">🤡</div>
                  <h2 className="text-2xl font-black text-red-600 mb-2">خطأ فادح!</h2>
                  <p className="text-xl font-bold text-gray-800 mb-6">{mockeryMessage}</p>
                  <button onClick={retryPuzzle} className="px-8 py-3 bg-red-600 text-white rounded-xl font-black shadow-[0_4px_0_#991b1b] active:translate-y-1 active:shadow-none transition-all">
                    حاول مرة أخرى
                  </button>
                </div>
             ) : (
                <div className="text-center">
                  <h2 className="text-3xl font-black text-[#3e2723] mb-2">لغز الذاكرة!</h2>
                  <p className="text-[#5d4037] font-bold mb-8">رتب المقاطع التي جمعتها لتكوين الجملة الصحيحة بالإنجليزية:</p>
                  
                  {/* Drop zone / Attempt display */}
                  <div className="flex flex-wrap gap-3 justify-center mb-10 min-h-[80px] p-4 bg-white/50 rounded-2xl border-2 border-dashed border-[#8d6e63]" dir="ltr">
                    {puzzleAttempt.map((item, i) => (
                      <button 
                        key={i} 
                        onClick={() => removeFromPuzzle(item.id)}
                        className="px-4 py-2 bg-[#2e7d32] text-white rounded-xl font-black text-xl shadow-[0_4px_0_#1b5e20] active:translate-y-1 active:shadow-none animate-in zoom-in"
                      >
                        {item.sound}
                      </button>
                    ))}
                    {puzzleAttempt.length === 0 && (
                      <span className="text-gray-400 font-bold flex items-center">اضغط على المقاطع بالأسفل لترتيبها...</span>
                    )}
                  </div>

                  {/* Available Items */}
                  <div className="flex flex-wrap gap-4 justify-center mb-8" dir="ltr">
                    {collectedItems.map((item) => {
                      const isUsed = puzzleAttempt.find(i => i.id === item.id);
                      if (isUsed) return null;
                      return (
                        <button 
                          key={item.id} 
                          onClick={() => addToPuzzle(item)}
                          className="flex flex-col items-center bg-white p-2 rounded-xl shadow-[0_4px_0_#d7ccc8] border-2 border-[#d7ccc8] active:translate-y-1 active:shadow-none hover:bg-gray-50 transition-all"
                        >
                          <img src={item.imageUrl} alt={item.arabicObject} className="w-16 h-16 object-cover rounded-lg mb-2" />
                          <span className="font-black text-gray-800">{item.sound}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={checkPuzzle}
                    disabled={puzzleAttempt.length !== collectedItems.length}
                    className={`w-full py-4 rounded-xl font-black text-xl transition-all ${
                      puzzleAttempt.length === collectedItems.length 
                      ? 'bg-[#1565c0] text-white shadow-[0_4px_0_#0d47a1] active:translate-y-1 active:shadow-none hover:bg-[#1976d2]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    تأكيد الإجابة
                  </button>
                </div>
             )}
          </div>
        </div>
      )}

      {/* ABSURD SCENE (VICTORY) */}
      {showAbsurdScene && currentQuest && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1e0a3c]/90 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-[#f4ebd0] p-6 md:p-8 rounded-[2rem] shadow-2xl border-4 border-[#ffb300] max-w-3xl w-[95%] max-h-[90vh] overflow-y-auto pointer-events-auto">
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#ffb300] rounded-full flex items-center justify-center text-3xl shadow-inner">
                ✨
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#3e2723]">استعدت ذاكرتك!</h2>
                <p className="text-[#8d6e63] font-bold">الجملة صحيحة تماماً.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#d7ccc8] mb-6 relative overflow-hidden">
               {/* English Target */}
               <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                  <div className="text-right flex-1">
                    <p className="text-sm font-bold text-gray-500 mb-1">الجملة المستهدفة</p>
                    <p className="text-2xl font-black tracking-wide text-gray-800" dir="ltr">{currentQuest.targetSentence}</p>
                  </div>
                  <button onClick={() => playTTS(currentQuest.targetSentence)} className="w-12 h-12 bg-[#1565c0] text-white rounded-full flex items-center justify-center text-xl shadow-md hover:bg-[#1976d2] active:scale-95 transition-all">
                    🔊
                  </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-500 mb-1">الترجمة</p>
                    <p className="text-lg font-bold text-[#3e2723]">{currentQuest.arabicTranslation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 mb-1">النطق (Transliteration)</p>
                    <p className="text-lg font-bold text-[#3e2723]">{currentQuest.arabicTransliteration}</p>
                  </div>
               </div>
            </div>

            <div className="bg-[#fff8e1] p-6 rounded-2xl border-l-4 border-[#ffb300] mb-6">
               <h3 className="text-xl font-black text-[#5d4037] mb-2 flex items-center gap-2"><span>🎭</span> المشهد العبثي للربط الذهني:</h3>
               <p className="text-lg font-medium text-gray-800 leading-relaxed">"{currentQuest.absurdScene}"</p>
            </div>

            <div className="bg-[#e8eaf6] p-4 rounded-2xl border-l-4 border-[#3f51b5] mb-8">
               <h3 className="text-lg font-bold text-[#283593] mb-1 flex items-center gap-2"><span>🧠</span> ذاكرة الأبطال:</h3>
               <p className="font-medium text-gray-700">{currentQuest.memoryReveal}</p>
            </div>

            <div className="flex gap-4">
              <button onClick={onExit} className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-300 transition-colors">
                العودة للأركيد
              </button>
              <button onClick={onWin} className="flex-1 py-4 bg-[#2e7d32] text-white rounded-xl font-black text-xl shadow-[0_4px_0_#1b5e20] active:translate-y-1 active:shadow-none hover:bg-[#388e3c] transition-all">
                المستوى التالي
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
