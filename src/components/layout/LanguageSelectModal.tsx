import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUserStore } from '@/store/userStore'
import { Check, X, Globe, Sparkles, Award } from 'lucide-react'
import { ALL_CEFR_LEVELS } from '@/utils/cefrGuidelines'

export const TARGET_LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'الإنجليزية', nameEn: 'English', nativeName: 'English' },
  { code: 'ja', flag: '🇯🇵', name: 'اليابانية', nameEn: 'Japanese', nativeName: '日本語' },
  { code: 'zh', flag: '🇨🇳', name: 'الصينية', nameEn: 'Chinese', nativeName: '中文' },
  { code: 'es', flag: '🇪🇸', name: 'الإسبانية', nameEn: 'Spanish', nativeName: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'الفرنسية', nameEn: 'French', nativeName: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'الألمانية', nameEn: 'German', nativeName: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', name: 'الإيطالية', nameEn: 'Italian', nativeName: 'Italiano' },
]

interface LanguageSelectModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'language' | 'level'
}

export function LanguageSelectModal({ isOpen, onClose, initialTab = 'language' }: LanguageSelectModalProps) {
  const { targetLanguage, setTargetLanguage, currentLevel, setCurrentLevel, uiLang } = useUserStore()
  const [activeTab, setActiveTab] = useState<'language' | 'level'>(initialTab)
  const isAr = uiLang === 'ar'

  const handleSelectLanguage = (langCode: string) => {
    setTargetLanguage(langCode)
  }

  const handleSelectLevel = (levelCode: string) => {
    setCurrentLevel(levelCode)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 overflow-hidden text-slate-900 z-10"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  {activeTab === 'language' ? <Globe className="w-5 h-5" /> : <Award className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {activeTab === 'language' 
                      ? (isAr ? 'لغة التعلم المستهدفة' : 'Target Learning Language') 
                      : (isAr ? 'مستوى الذكاء الاصطناعي (CEFR)' : 'AI Proficiency Level (CEFR)')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeTab === 'language'
                      ? (isAr ? 'اختر اللغة وسيتحدث بها الراديو والفويس شات' : 'Select target language for AI & lessons')
                      : (isAr ? 'سيتحدث الذكاء الاصطناعي بدقة تامة وفق هذا المستوى' : 'AI will strictly adapt its speech to this level')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
              <button
                onClick={() => setActiveTab('language')}
                className={`flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'language'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isAr ? 'اللغات (7)' : 'Languages (7)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('level')}
                className={`flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'level'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? `المستوى (${currentLevel || 'A1'})` : `Level (${currentLevel || 'A1'})`}</span>
              </button>
            </div>

            {/* Content: Language Grid */}
            {activeTab === 'language' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {TARGET_LANGUAGES.map((lang) => {
                  const isSelected = targetLanguage === lang.code
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer text-start ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl drop-shadow-xs">{lang.flag}</span>
                        <div>
                          <div className="font-black text-xs sm:text-sm">
                            {isAr ? lang.name : lang.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {lang.nativeName}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Content: CEFR Level List */}
            {activeTab === 'level' && (
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {ALL_CEFR_LEVELS.map((lvl) => {
                  const isSelected = (currentLevel || 'A1').toUpperCase() === lvl.code
                  return (
                    <button
                      key={lvl.code}
                      onClick={() => handleSelectLevel(lvl.code)}
                      className={`flex items-start justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer text-start ${
                        isSelected
                          ? 'bg-amber-50/90 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-1 rounded-xl bg-slate-100 text-slate-800 font-black text-xs shadow-xs border border-slate-200 shrink-0">
                          {lvl.badge}
                        </span>
                        <div>
                          <div className="font-black text-xs sm:text-sm text-slate-900">
                            {isAr ? lvl.nameAr : lvl.nameEn}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                            {isAr ? lvl.descriptionAr : lvl.descriptionEn}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Modal Bottom Action */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isAr ? 'حفظ وإغلاق ✅' : 'Save & Close ✅'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
