import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Volume2,
  Plus,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { DetailedLesson, findLessonDetails, addEntireLessonToDeck } from '../data/curriculumDatabase';
import { SpacedRepetitionEngine } from '../engine/spacedRepetition';
import { speakText } from '../audio/speech';

interface LessonDialogueModalProps {
  level: string;
  languageCode: string;
  subjectName: string;
  dayNumber: number;
  levelTitle: string;
  unitTitle: string;
  engine: SpacedRepetitionEngine;
  onClose: () => void;
  onItemAdded?: () => void;
}

export const LessonDialogueModal: React.FC<LessonDialogueModalProps> = ({
  level,
  languageCode,
  subjectName,
  dayNumber,
  levelTitle,
  unitTitle,
  engine,
  onClose,
  onItemAdded,
}) => {
  const [lesson, setLesson] = useState<DetailedLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [allAdded, setAllAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'story' | 'grammar'>('chat');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    findLessonDetails(level, languageCode, dayNumber).then((data) => {
      if (isMounted) {
        setLesson(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [level, languageCode, dayNumber]);

  const handleAddSingleMessage = (msgIndex: number, text: string, translation: string, pronunciation: string, speakerName: string) => {
    const itemId = `${languageCode}_${level}_d${dayNumber}_msg_${msgIndex + 1}`;
    engine.addIndividualItem({
      id: itemId,
      subject: subjectName,
      sourceLevelId: levelTitle,
      sourceUnitId: unitTitle,
      sourceLessonId: `اليوم ${dayNumber}: ${lesson?.title || ''}`,
      primaryText: text,
      secondaryText: `${translation} • ${pronunciation}`,
      contextOrNotes: `${speakerName} (${msgIndex + 1}/10): ${translation}`,
      categoryTag: msgIndex % 2 === 0 ? 'Dialogue-A' : 'Dialogue-B',
    });

    setAddedItems((prev) => ({ ...prev, [itemId]: true }));
    if (onItemAdded) onItemAdded();
  };

  const handleAddAllToDeck = async () => {
    if (!lesson) return;
    const count = await addEntireLessonToDeck(
      engine,
      subjectName,
      levelTitle,
      unitTitle,
      `اليوم ${dayNumber}: ${lesson.title}`,
      level,
      languageCode,
      dayNumber
    );

    if (count > 0) {
      setAllAdded(true);
      if (onItemAdded) onItemAdded();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              D{dayNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {level} • {subjectName}
                </span>
                <span className="text-xs text-slate-400">اليوم {dayNumber}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
                {lesson ? lesson.title : `اليوم ${dayNumber}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              حوار ياسين وعمر (10 رسائل)
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'grammar'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              القاعدة والتمهيد
            </button>
          </div>

          <button
            onClick={handleAddAllToDeck}
            disabled={allAdded}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              allAdded
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {allAdded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                تمت إضافة جميع البطاقات للتدريب
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                إضافة كامل الدرس لبطاقات المراجعة (+10)
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">جاري تحميل حوار الدرس والبيانات...</p>
            </div>
          ) : !lesson ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              لم يتم العثور على محتوى هذا الدرس.
            </div>
          ) : activeTab === 'chat' ? (
            /* Dialogue Messages List */
            <div className="space-y-3">
              <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  حوار تفاعلي متسلسل: ياسين ⟷ عمر (استمع وتدرب على النطق)
                </span>
                <span className="text-[11px] text-amber-400/90 font-mono">10 جمل</span>
              </div>

              {lesson.messages.map((msg, idx) => {
                const isYassin = msg.speaker === 'A' || msg.speakerName.toLowerCase().includes('yassin');
                const itemId = `${languageCode}_${level}_d${dayNumber}_msg_${idx + 1}`;
                const isSaved = allAdded || !!addedItems[itemId] || !!engine.getItemById(itemId);

                return (
                  <div
                    key={idx}
                    className={`flex flex-col p-3.5 rounded-2xl border transition ${
                      isYassin
                        ? 'bg-slate-950/80 border-slate-800 mr-4 sm:mr-8'
                        : 'bg-slate-850/80 border-amber-500/20 ml-4 sm:ml-8'
                    }`}
                  >
                    {/* Speaker Header */}
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isYassin
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isYassin ? 'Y' : 'O'}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {msg.speakerName || (isYassin ? 'Yassin' : 'Omar')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => speakText(msg.text, languageCode)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                          title="استمع للنطق الصوتي"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        {isSaved ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3" /> مضاف
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleAddSingleMessage(
                                idx,
                                msg.text,
                                msg.translation,
                                msg.pronunciation,
                                msg.speakerName || (isYassin ? 'Yassin' : 'Omar')
                              )
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-0.5 rounded-md transition"
                            title="إضافة هذه الجملة لبطاقات المراجعة"
                          >
                            <Plus className="w-3 h-3" /> + بطاقة
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Target Script Text */}
                    <div className="text-sm sm:text-base font-bold text-slate-100 tracking-wide font-sans">
                      {msg.text}
                    </div>

                    {/* Romanization / Pronunciation */}
                    {msg.pronunciation && (
                      <div className="text-xs text-amber-300/90 font-mono mt-1">
                        {msg.pronunciation}
                      </div>
                    )}

                    {/* Arabic Translation */}
                    <div className="text-xs sm:text-sm text-slate-300 mt-1 pt-1 border-t border-slate-800/40 font-medium">
                      {msg.translation}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Grammar Tip & Next Lesson Bridge */
            <div className="space-y-4">
              {lesson.grammarTip && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Lightbulb className="w-4 h-4" />
                    {lesson.grammarTip.title || `قاعدة اليوم ${dayNumber}`}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {lesson.grammarTip.tip}
                  </p>
                </div>
              )}

              {lesson.nextLessonLink && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                    التمهيد للدرس القادم
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lesson.nextLessonLink}
                  </p>
                </div>
              )}

              {lesson.storyNativeScriptText && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    النص السردي الكامل (Passage Script)
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-mono">
                    {lesson.storyNativeScriptText}
                  </div>
                  {lesson.storyTranslatedText && (
                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 whitespace-pre-line leading-relaxed">
                      {lesson.storyTranslatedText}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            إغلاق
          </button>

          <div className="text-xs text-slate-400">
            مستوى <span className="text-amber-400 font-bold">{level}</span> • اليوم {dayNumber} من 30
          </div>
        </div>
      </motion.div>
    </div>
  );
};
