import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Plus,
  Check,
  Search,
  Upload,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  X,
  GraduationCap,
  MessageSquare,
  Volume2,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';
import { INITIAL_CURRICULUMS } from '../data/defaultCurriculum';
import { LearningItemTemplate, SubjectCurriculum } from '../types/learning';
import { SpacedRepetitionEngine } from '../engine/spacedRepetition';
import { LessonDialogueModal } from './LessonDialogueModal';
import { addEntireLessonToDeck, addEntireStationToDeck } from '../data/curriculumDatabase';

interface CurriculumBrowserModalProps {
  engine: SpacedRepetitionEngine;
  onClose: () => void;
  onItemAdded?: () => void;
}

export const CurriculumBrowserModal: React.FC<CurriculumBrowserModalProps> = ({
  engine,
  onClose,
  onItemAdded,
}) => {
  const [curriculums, setCurriculums] = useState<SubjectCurriculum[]>(INITIAL_CURRICULUMS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(INITIAL_CURRICULUMS[0].id);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Dialogue modal state
  const [activeDialogueData, setActiveDialogueData] = useState<{
    level: string;
    languageCode: string;
    subjectName: string;
    dayNumber: number;
    levelTitle: string;
    unitTitle: string;
  } | null>(null);

  // Custom Card Creator state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customSubject, setCustomSubject] = useState('Japanese');
  const [customPrimary, setCustomPrimary] = useState('');
  const [customSecondary, setCustomSecondary] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customCategory, setCustomCategory] = useState('Phrase');

  // File Upload state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Status feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeSubject = curriculums.find((c) => c.id === selectedSubjectId) || curriculums[0];
  const langCode = (activeSubject as any).languageCode || activeSubject.id;

  const handleAddTemplate = (
    template: LearningItemTemplate,
    levelTitle: string,
    unitTitle: string,
    lessonTitle: string
  ) => {
    engine.addIndividualItem({
      id: template.id,
      subject: activeSubject.subjectName,
      sourceLevelId: levelTitle,
      sourceUnitId: unitTitle,
      sourceLessonId: lessonTitle,
      primaryText: template.primaryText,
      secondaryText: template.secondaryText,
      contextOrNotes: template.contextOrNotes,
      categoryTag: template.categoryTag,
    });

    showToast(`Added phrase to memory deck!`);
    if (onItemAdded) {
      onItemAdded();
    }
  };

  const handleAddEntireLesson = async (
    levelTitle: string,
    unitTitle: string,
    lessonTitle: string,
    lvlName: string,
    dayNumber: number
  ) => {
    const count = await addEntireLessonToDeck(
      engine,
      activeSubject.subjectName,
      levelTitle,
      unitTitle,
      lessonTitle,
      lvlName,
      langCode,
      dayNumber
    );

    showToast(`Added ${count} dialogue cards for Day ${dayNumber}!`);
    if (onItemAdded) {
      onItemAdded();
    }
  };

  const handleAddEntireStation = async (
    levelTitle: string,
    unitTitle: string,
    lvlName: string,
    unitId: string
  ) => {
    // Extract station number from unitId or day ranges
    let startDay = 1;
    let endDay = 7;
    if (unitId.includes('Station2')) {
      startDay = 8;
      endDay = 14;
    } else if (unitId.includes('Station3')) {
      startDay = 15;
      endDay = 21;
    } else if (unitId.includes('Station4')) {
      startDay = 22;
      endDay = 28;
    } else if (unitId.includes('Station5')) {
      startDay = 29;
      endDay = 30;
    }

    const count = await addEntireStationToDeck(
      engine,
      activeSubject.subjectName,
      levelTitle,
      unitTitle,
      lvlName,
      langCode,
      startDay,
      endDay
    );

    showToast(`Added ${count} cards for the entire station (Days ${startDay}-${endDay})!`);
    if (onItemAdded) {
      onItemAdded();
    }
  };

  const handleCreateCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrimary.trim() || !customSecondary.trim()) return;

    engine.addIndividualItem({
      subject: customSubject,
      primaryText: customPrimary.trim(),
      secondaryText: customSecondary.trim(),
      contextOrNotes: customNotes.trim(),
      categoryTag: customCategory,
      sourceUnitId: 'Custom Collection',
      sourceLessonId: 'My Saved Items',
    });

    setCustomPrimary('');
    setCustomSecondary('');
    setCustomNotes('');
    setIsAddingCustom(false);
    showToast('Custom memory card created!');

    if (onItemAdded) {
      onItemAdded();
    }
  };

  const handleImportCurriculum = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (!parsed.subjectName || !parsed.levels) {
        throw new Error('Invalid curriculum JSON format. Must contain "subjectName" and "levels".');
      }

      setCurriculums((prev) => [...prev, parsed]);
      setSelectedSubjectId(parsed.id || `subject_${Date.now()}`);
      setIsImportModalOpen(false);
      setImportJsonText('');
      showToast('Curriculum imported successfully!');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON file.');
    }
  };

  // Filter levels
  const filteredLevels = activeSubject.levels.filter((lvl) => {
    if (selectedLevelFilter === 'ALL') return true;
    const lvlKey = lvl.title.toUpperCase();
    return lvlKey.includes(`LEVEL ${selectedLevelFilter}`) || lvlKey.includes(`A1`) && selectedLevelFilter === 'A1' || lvlKey.includes(`A2`) && selectedLevelFilter === 'A2' || lvlKey.includes(`B1`) && selectedLevelFilter === 'B1' || lvlKey.includes(`B2`) && selectedLevelFilter === 'B2' || lvlKey.includes(`C1`) && selectedLevelFilter === 'C1' || lvlKey.includes(`C2`) && selectedLevelFilter === 'C2';
  });

  return (
    <div
      id="curriculum-browser-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Curriculum & Multi-Level Knowledge Base
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  A1 ➔ C2 Complete
                </span>
              </div>
              <p className="text-xs text-slate-400">
                قاعدة المناهج اللغوية الكاملة (المستويات A1 إلى C2 مع محطات الأيام والحوارات التفاعلية)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingCustom(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-semibold text-slate-950 text-xs transition"
            >
              <Plus className="w-4 h-4" /> بطاقة مخصصة
            </button>
            <button
              id="close-curriculum-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast feedback banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-900/90 text-emerald-100 text-xs font-bold px-6 py-2 border-b border-emerald-700/50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject Tabs */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {curriculums.map((curr) => {
              const isSelected = selectedSubjectId === curr.id;
              return (
                <button
                  key={curr.id}
                  onClick={() => {
                    setSelectedSubjectId(curr.id);
                    setExpandedUnitId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {curr.subjectName}
                </button>
              );
            })}
          </div>

          <div className="relative w-48 sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search phrases, topics, عربي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Level Filter Bar (A1, A2, B1, B2, C1, C2) */}
        {activeSubject.levels.length > 1 && (
          <div className="px-5 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">المستوى:</span>
            {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
              const isSelected = selectedLevelFilter === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  {lvl === 'ALL' ? 'جميع المستويات (All)' : lvl}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Curriculum Tree View */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
          {filteredLevels.map((lvl) => {
            // Extract clean level name e.g. "A1", "A2", "B1", etc.
            const lvlCodeMatch = lvl.title.match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
            const lvlCode = lvlCodeMatch ? lvlCodeMatch[1].toUpperCase() : 'A1';

            return (
              <div key={lvl.id} className="space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-amber-400 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      {lvl.title}
                    </h3>
                    {lvl.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{lvl.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300/90 font-mono">
                    {lvl.units.length} محطات • 30 يوم
                  </span>
                </div>

                {/* Units / Stations */}
                <div className="space-y-3">
                  {lvl.units.map((unit) => {
                    const isUnitExpanded = expandedUnitId === unit.id;

                    return (
                      <div
                        key={unit.id}
                        className="border border-slate-800 bg-slate-950/40 rounded-xl overflow-hidden shadow-sm"
                      >
                        {/* Unit Header */}
                        <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/40 hover:bg-slate-800/70 transition">
                          <button
                            onClick={() => setExpandedUnitId(isUnitExpanded ? null : unit.id)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            {isUnitExpanded ? (
                              <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                                {unit.title}
                              </div>
                              {unit.description && (
                                <div className="text-xs text-slate-400">{unit.description}</div>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 hidden sm:inline">
                              {unit.lessons.length} دروس
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddEntireStation(
                                  lvl.title,
                                  unit.title,
                                  lvlCode,
                                  unit.id
                                );
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition shadow-sm"
                              title="إضافة كل بطاقات هذه المحطة إلى مصفوفة المراجعة"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                              + إضافة المحطة بالكامل
                            </button>
                          </div>
                        </div>

                        {/* Lessons & Items */}
                        {isUnitExpanded && (
                          <div className="p-3 sm:p-4 space-y-4 border-t border-slate-800/60 bg-slate-900/60">
                            {unit.lessons.map((lesson) => {
                              const dayNumber = (lesson as any).dayNumber || 1;
                              const filteredItems = lesson.items.filter(
                                (i) =>
                                  !searchQuery ||
                                  i.primaryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  i.secondaryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (lesson.description &&
                                    lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))
                              );

                              if (filteredItems.length === 0 && searchQuery) return null;

                              return (
                                <div
                                  key={lesson.id}
                                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"
                                >
                                  {/* Lesson Title & Dialogue Action Bar */}
                                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/60">
                                    <div className="flex items-center gap-2">
                                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                                        D{dayNumber}
                                      </span>
                                      <div>
                                        <div className="text-xs sm:text-sm font-bold text-slate-100">
                                          {lesson.title}
                                        </div>
                                        {lesson.description && (
                                          <div className="text-[11px] text-slate-400">
                                            {lesson.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() =>
                                          setActiveDialogueData({
                                            level: lvlCode,
                                            languageCode: langCode,
                                            subjectName: activeSubject.subjectName,
                                            dayNumber: dayNumber,
                                            levelTitle: lvl.title,
                                            unitTitle: unit.title,
                                          })
                                        }
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold transition"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        معاينة الحوار الصوتي (10 جمل)
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleAddEntireLesson(
                                            lvl.title,
                                            unit.title,
                                            lesson.title,
                                            lvlCode,
                                            dayNumber
                                          )
                                        }
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
                                        title="إضافة جميع بطاقات الدرس للمراجعة"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        + إضافة الدرس
                                      </button>
                                    </div>
                                  </div>

                                  {/* Individual Card Items */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredItems.map((item) => {
                                      const existingRecord = engine.getItemById(item.id);
                                      const isSaved = !!existingRecord;

                                      return (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition"
                                        >
                                          <div className="space-y-0.5 max-w-[70%]">
                                            <div className="text-xs sm:text-sm font-bold text-slate-100">
                                              {item.primaryText}
                                            </div>
                                            <div className="text-[11px] text-amber-300/90 font-medium">
                                              {item.secondaryText}
                                            </div>
                                          </div>

                                          <div>
                                            {isSaved ? (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                                                <Check className="w-3 h-3" /> مضاف
                                              </span>
                                            ) : (
                                              <button
                                                onClick={() =>
                                                  handleAddTemplate(
                                                    item,
                                                    lvl.title,
                                                    unit.title,
                                                    lesson.title
                                                  )
                                                }
                                                className="flex items-center gap-1 text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded-md shadow-xs transition"
                                              >
                                                <Plus className="w-3 h-3" /> + بطاقة
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Dialogue Inspector Modal */}
        <AnimatePresence>
          {activeDialogueData && (
            <LessonDialogueModal
              level={activeDialogueData.level}
              languageCode={activeDialogueData.languageCode}
              subjectName={activeDialogueData.subjectName}
              dayNumber={activeDialogueData.dayNumber}
              levelTitle={activeDialogueData.levelTitle}
              unitTitle={activeDialogueData.unitTitle}
              engine={engine}
              onClose={() => setActiveDialogueData(null)}
              onItemAdded={() => {
                showToast('Lesson cards added to memory deck!');
                if (onItemAdded) onItemAdded();
              }}
            />
          )}
        </AnimatePresence>

        {/* Custom Card Modal */}
        <AnimatePresence>
          {isAddingCustom && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl text-slate-100"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-400" /> Add Custom Card
                  </h3>
                  <button
                    onClick={() => setIsAddingCustom(false)}
                    className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateCustomCard} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subject / Language
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Front Text (Question / Target Expression)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ありがとうございます"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Back Text (Answer / Arabic / English Translation)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. شكراً جزيلاً (Arigatō gozaimasu)"
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Notes or Grammar Tips (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Formal polite gratitude"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      Save to Memory Deck
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active Knowledge Base: {activeSubject.subjectName}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
};
