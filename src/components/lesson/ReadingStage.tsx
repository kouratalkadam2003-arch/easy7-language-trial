import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff, Flame, Star, Sprout, Volume2, Mic, CheckCircle, Sparkles, Play, Pause, X } from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import type { Lesson, DialogueLine, Tier } from '@/data/lessons/types'
import { useUserStore } from '@/store/userStore'
import { useLessonTrackerStore } from '@/store/lessonTrackerStore'
import { matchSpeech } from '@/utils/smartMatcher'
import { bcp47, speak, stopSpeaking } from '@/lib/tts'
import { translateWordOrPhrase, cleanWord, getWordGloss, batchResolveLessonGlosses } from '@/utils/wordTranslator'

const SPEEDS = [1, 1.25, 1.5, 0.75];

interface Props {
  lesson: Lesson
  onComplete: (analytics?: { mastered: string[]; needsReview: string[]; accuracyScore: number }) => void
}

const TIER_META: Record<Tier, { label: string; icon: any; color: string }> = {
  core: { label: 'أساسية', icon: Flame, color: '#FF4B4B' },
  medium: { label: 'متوسّطة', icon: Star, color: '#FF9600' },
  secondary: { label: 'ثانوية', icon: Sprout, color: '#58CC02' },
}

export function ReadingStage({ lesson, onComplete }: Props) {
  const { uiLang } = useUserStore()
  const isAr = uiLang === 'ar'

  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<Tier | 'all'>('all')
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [playingAll, setPlayingAll] = useState(false)
  const [rateIdx, setRateIdx] = useState(0)
  const stopFlag = useRef(false)
  
  // Word-by-word glosses cache for interlinear display
  const [wordGlosses, setWordGlosses] = useState<Record<string, string>>({})

  useEffect(() => {
    let isMounted = true;
    batchResolveLessonGlosses(lesson.dialogue, lesson.lang || 'en').then((glosses) => {
      if (isMounted) {
        setWordGlosses(glosses);
      }
    });
    return () => { isMounted = false; };
  }, [lesson]);

  const getGlossForWord = (rawWord: string) => {
    const clean = cleanWord(rawWord);
    if (!clean) return '';
    const langKey = (lesson.lang || 'en').toLowerCase();
    return wordGlosses[`${langKey}_${clean}`] || getWordGloss(clean, langKey) || '';
  };

  // Interactive word popup state
  interface WordPopupState {
    lineIdx: number;
    startWordIdx: number;
    endWordIdx: number;
    phrase: string;
    translation: string;
    canExpand: boolean;
  }
  const [activeWordPopup, setActiveWordPopup] = useState<WordPopupState | null>(null)

  // Silent tracking states
  const [spokenLineScores, setSpokenLineScores] = useState<Record<number, number>>({})
  const [isMicActive, setIsMicActive] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Start silent microphone listening in background
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      const langMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'ja': 'ja-JP',
        'ar': 'ar-SA',
      };
      recognition.lang = langMap[lesson.lang || 'en'] || 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        if (!transcript) return;

        // Check against all lesson lines silently
        lesson.dialogue.forEach((line, idx) => {
          const target = line.native;
          const result = matchSpeech(transcript, target, 0.70);
          if (result.isMatch) {
            setSpokenLineScores(prev => ({
              ...prev,
              [idx]: Math.max(prev[idx] || 0, Math.round(result.similarity * 100))
            }));
            // Student read/repeated phrase with high similarity
            useLessonTrackerStore.getState().recordReading(target, true);
          }
        });
      };

      recognition.onerror = () => {};
      recognition.onend = () => {
        // Auto restart if stage still open
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsMicActive(true);
    } catch (e) {
      console.warn('Silent reading speech recognition unavailable:', e);
    }

    return () => {
      stopFlag.current = true;
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [lesson]);

  const rate = SPEEDS[rateIdx];

  const playLineAudio = (text: string, idx: number) => {
    stopFlag.current = true;
    stopSpeaking();
    setPlayingAll(false);
    setPlayingIdx(idx);
    useLessonTrackerStore.getState().recordReading(text, false);
    speak(text, bcp47(lesson.lang), rate);
    setTimeout(() => {
      setPlayingIdx(null);
    }, Math.max(1200, (text.length * 90) / rate));
  };

  const playAll = async () => {
    if (playingAll) {
      stopFlag.current = true;
      stopSpeaking();
      setPlayingAll(false);
      setPlayingIdx(null);
      return;
    }
    setPlayingAll(true);
    stopFlag.current = false;
    for (let i = 0; i < lesson.dialogue.length; i++) {
      if (stopFlag.current) break;
      const line = lesson.dialogue[i];
      setPlayingIdx(i);
      useLessonTrackerStore.getState().recordReading(line.native, false);
      speak(line.native, bcp47(lesson.lang), rate);
      const waitMs = Math.max(1400, (line.native.length * 95) / rate);
      await new Promise((r) => setTimeout(r, waitMs));
    }
    setPlayingAll(false);
    setPlayingIdx(null);
  };

  const toggleReveal = (idx: number) => {
    const next = new Set(revealed)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setRevealed(next)
  }

  const handleCardClick = (idx: number, lineNative: string) => {
    // If clicking card, reveal Arabic translation & play audio immediately!
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        // Replay audio if clicked again
        playLineAudio(lineNative, idx);
        return next;
      }
      next.add(idx);
      playLineAudio(lineNative, idx);
      return next;
    });
  };

  const handleWordClick = async (
    e: React.MouseEvent,
    lineIdx: number,
    wordIdx: number,
    rawWord: string,
    line: DialogueLine
  ) => {
    e.stopPropagation();
    const clean = cleanWord(rawWord);
    if (!clean) return;

    // Pronounce the word in target language immediately
    speak(clean, bcp47(lesson.lang), rate);

    const allWords = line.native.trim().split(/\s+/);
    const canExpand = wordIdx < allWords.length - 1;

    // Set active popup immediately with placeholder
    setActiveWordPopup({
      lineIdx,
      startWordIdx: wordIdx,
      endWordIdx: wordIdx,
      phrase: clean,
      translation: '...جاري الترجمة',
      canExpand,
    });

    const trans = await translateWordOrPhrase(clean, lesson.lang || 'en', line.native, line.translation);
    setActiveWordPopup((prev) => {
      if (
        prev &&
        prev.lineIdx === lineIdx &&
        prev.startWordIdx === wordIdx &&
        prev.endWordIdx === wordIdx
      ) {
        return { ...prev, translation: trans };
      }
      return prev;
    });
  };

  const handleExpandWord = async (lineIdx: number, line: DialogueLine) => {
    if (!activeWordPopup || activeWordPopup.lineIdx !== lineIdx) return;
    const allWords = line.native.trim().split(/\s+/);
    const nextIdx = activeWordPopup.endWordIdx + 1;
    if (nextIdx >= allWords.length) return;

    const combinedWords = allWords.slice(activeWordPopup.startWordIdx, nextIdx + 1);
    const combinedPhrase = combinedWords.map((w) => cleanWord(w)).join(' ');

    // Pronounce both words together
    speak(combinedPhrase, bcp47(lesson.lang), rate);

    setActiveWordPopup({
      lineIdx,
      startWordIdx: activeWordPopup.startWordIdx,
      endWordIdx: nextIdx,
      phrase: combinedPhrase,
      translation: '...جاري الترجمة',
      canExpand: nextIdx < allWords.length - 1,
    });

    const trans = await translateWordOrPhrase(combinedPhrase, lesson.lang || 'en', line.native, line.translation);
    setActiveWordPopup((prev) => {
      if (
        prev &&
        prev.lineIdx === lineIdx &&
        prev.startWordIdx === activeWordPopup.startWordIdx &&
        prev.endWordIdx === nextIdx
      ) {
        return { ...prev, translation: trans };
      }
      return prev;
    });
  };

  const revealAll = () => {
    if (revealed.size === lesson.dialogue.length) {
      setRevealed(new Set())
    } else {
      setRevealed(new Set(lesson.dialogue.map((_, i) => i)))
    }
  }

  const visibleLines = lesson.dialogue.map((line, idx) => ({ line, idx })).filter(
    (item) => filter === 'all' || item.line.tier === filter
  )

  const isAllRevealed = revealed.size === lesson.dialogue.length

  const handleFinishReading = () => {
    const mastered: string[] = [];
    const needsReview: string[] = [];
    let totalScore = 0;

    lesson.dialogue.forEach((line, idx) => {
      const score = spokenLineScores[idx] || 0;
      totalScore += score;
      if (score >= 70) {
        mastered.push(line.native);
      } else {
        needsReview.push(line.native);
      }
    });

    const avgScore = lesson.dialogue.length > 0 ? Math.round(totalScore / lesson.dialogue.length) : 85;

    onComplete({
      mastered,
      needsReview,
      accuracyScore: avgScore
    });
  };

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      {/* Silent Listener Banner */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-2xl mb-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-200">
            🎙️ اقرأ بصوت عالٍ، المساعد يستمع لتقييم أدائك في التقرير النهائي
          </span>
        </div>
        <div className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
          {Object.keys(spokenLineScores).length}/{lesson.dialogue.length} مقروءة
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2.5 mb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button3D
              variant="primary"
              size="sm"
              onClick={playAll}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white !border-b-4 !border-blue-800 !shadow-none !rounded-xl px-3.5 text-xs font-bold cursor-pointer"
            >
              {playingAll ? (
                <><Pause className="w-3.5 h-3.5 mr-1 inline" /> {isAr ? 'إيقاف' : 'Pause'}</>
              ) : (
                <><Play className="w-3.5 h-3.5 mr-1 inline" /> {isAr ? 'استماع للكل 🎧' : 'Listen All 🎧'}</>
              )}
            </Button3D>

            <button
              onClick={() => setRateIdx((i) => (i + 1) % SPEEDS.length)}
              className="px-2.5 py-1 text-xs font-black text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
              title="سرعة الصوت"
            >
              {rate}x
            </button>

            <Button3D variant="ghost" size="sm" onClick={revealAll} className="text-xs">
              {isAllRevealed ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
              {isAllRevealed ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Reveal')}
            </Button3D>
          </div>
          
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-xl border border-white/40 text-slate-600 shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-blue-500 hover:bg-white/50'}`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            {(Object.entries(TIER_META) as [Tier, any][]).map(([tier, meta]) => {
               const active = filter === tier
               return (
                 <button
                   key={tier}
                   onClick={() => setFilter(tier)}
                   className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all`}
                   style={{
                     backgroundColor: active ? meta.color + '20' : 'transparent',
                     color: active ? meta.color : 'var(--muted-foreground)'
                   }}
                 >
                   <meta.icon className="w-3 h-3" />
                 </button>
               )
            })}
          </div>
        </div>
      </div>

      {/* Dialogue Reading Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-4">
        <AnimatePresence>
          {visibleLines.map(({ line, idx }) => {
            const isRev = revealed.has(idx)
            const meta = TIER_META[line.tier]
            const score = spokenLineScores[idx]
            const isCurrentPlaying = playingIdx === idx
            
            return (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative bg-white rounded-2xl border-2 overflow-hidden cursor-pointer hover:bg-slate-50 shadow-sm transition-all text-slate-800 ${
                  isCurrentPlaying ? 'border-blue-500 bg-blue-50/60 shadow-md ring-2 ring-blue-400/30 scale-[1.01]' : 'border-slate-200'
                }`}
                onClick={() => handleCardClick(idx, line.native)}
              >
                {/* Tier indicator bar */}
                <div 
                  className="absolute top-0 start-0 w-1.5 h-full"
                  style={{ backgroundColor: meta.color }}
                />

                <div className="p-4 ps-6">
                  {/* Speaker Name Badge */}
                  <div className="flex items-center gap-2 mb-1" dir="ltr">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {line.character}
                    </span>
                  </div>

                  <div className="flex justify-between items-start mb-1" dir="ltr">
                    <div className="flex-1 pr-2">
                      {/* Interlinear Word-by-Word Glossing Row */}
                      <div className="flex flex-wrap gap-2 sm:gap-2.5 items-start my-1.5" dir="ltr">
                        {line.native.trim().split(/\s+/).map((word, wIdx) => {
                          const isSelected =
                            activeWordPopup &&
                            activeWordPopup.lineIdx === idx &&
                            wIdx >= activeWordPopup.startWordIdx &&
                            wIdx <= activeWordPopup.endWordIdx;
                          const gloss = getGlossForWord(word);

                          return (
                            <div
                              key={wIdx}
                              onClick={(e) => handleWordClick(e, idx, wIdx, word, line)}
                              className={`inline-flex flex-col items-center justify-center cursor-pointer select-none px-2.5 py-1.5 rounded-xl transition-all border ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 border-blue-600 scale-105'
                                  : 'bg-slate-50 hover:bg-blue-50/90 border-slate-200/90 hover:border-blue-300 active:scale-95 shadow-xs'
                              }`}
                              title="اضغط لنطق وترجمة هذه الكلمة"
                            >
                              {/* Word in Target Language */}
                              <span className={`text-base sm:text-lg font-black tracking-wide ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {word}
                              </span>
                              {/* Exact Arabic Gloss directly beneath it - ONLY shown when phrase is revealed or word is clicked */}
                              {(isRev || isSelected) && (
                                <motion.span
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className={`text-[11px] sm:text-xs font-bold leading-tight mt-0.5 ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}
                                  dir="rtl"
                                >
                                  {gloss || '...'}
                                </motion.span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {line.romaji && line.romaji !== line.native && (
                        <div className="text-xs font-mono text-blue-600 font-semibold mt-1">{line.romaji}</div>
                      )}

                      {/* Interactive Word Translation Popover */}
                      {activeWordPopup && activeWordPopup.lineIdx === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white shadow-xl border border-slate-700/80 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-amber-300 font-mono" dir="ltr">
                                {activeWordPopup.phrase}
                              </span>
                              <button
                                onClick={() => speak(activeWordPopup.phrase, bcp47(lesson.lang), rate)}
                                className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer"
                                title="إعادة نطق الكلمة"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {activeWordPopup.canExpand && (
                                <button
                                  onClick={() => handleExpandWord(idx, line)}
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-600/30 border border-blue-500/40 hover:bg-blue-600/50 text-blue-300 transition-colors cursor-pointer"
                                  title="إضافة الكلمة التالية لترجمة كلمتين معاً"
                                >
                                  + ضم كلمة تالية
                                </button>
                              )}
                              <button
                                onClick={() => setActiveWordPopup(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs" dir="rtl">
                            <span className="text-slate-400 font-semibold">الترجمة بالعربية:</span>
                            <span className="font-extrabold text-emerald-400 text-sm">
                              {activeWordPopup.translation}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {score !== undefined && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> {score}%
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playLineAudio(line.native, idx);
                        }}
                        className={`p-2 rounded-xl transition-all ${playingIdx === idx ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title="استمع للنطق"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Arabic Pronunciation & Complete Translation (Strictly Hidden Until User Clicks to Reveal) */}
                  <div dir="rtl" className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                    {isRev ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2"
                      >
                        {line.pronunciation && (
                          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                            <span className="text-slate-400">🗣️ نطق العبارة:</span>
                            <span className="font-mono text-slate-700 font-extrabold">{line.pronunciation}</span>
                          </div>
                        )}
                        <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-blue-600 text-white shrink-0">
                              الترجمة الكاملة:
                            </span>
                            <span className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                              {line.translation}
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold shrink-0">✨ مترجمة ومسموعة</span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-between py-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                          <span>{isAr ? 'اضغط على العبارة لكشف الترجمة الكاملة وسماع النطق 🎧' : 'Click phrase to reveal translation & hear audio 🎧'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {isAr ? 'انقر للترجمة 👁️' : 'Reveal 👁️'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Next Step */}
      <div className="py-3 bg-white border-t border-black/10 w-full flex-shrink-0">
        <Button3D
          variant="primary"
          size="lg"
          className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white !border-b-4 !border-blue-800 !shadow-none !rounded-2xl cursor-pointer"
          onClick={handleFinishReading}
        >
          {isAr ? 'أنهيت الاستماع والقراءة، إلى محادثة الموقف الواقعي 💬 ➔' : 'Finished Listening & Reading 💬 ➔'}
        </Button3D>
      </div>
    </div>
  )
}
