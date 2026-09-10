import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'
import { ChevronLeft } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'الإنجليزية', nameEn: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'الإسبانية', nameEn: 'Spanish' },
  { code: 'fr', flag: '🇫🇷', name: 'الفرنسية', nameEn: 'French' },
  { code: 'de', flag: '🇩🇪', name: 'الألمانية', nameEn: 'German' },
  { code: 'ja', flag: '🇯🇵', name: 'اليابانية', nameEn: 'Japanese' },
  { code: 'it', flag: '🇮🇹', name: 'الإيطالية', nameEn: 'Italian' },
  { code: 'zh', flag: '🇨🇳', name: 'الصينية', nameEn: 'Chinese' },
]

const STEPS = [
  { id: 'language', title: 'إلى أي شواطئ جرفت الأمواج بطلنا؟', titleEn: 'Where did the waves carry our hero?' },
  { id: 'profile', title: 'أخبرنا عن نفسك لتخصيص تدريبك الصوتي', titleEn: 'Tell us about yourself to personalize your voice coach' },
  { id: 'mode', title: 'اختر وضع اللعب المفضل', titleEn: 'Choose your preferred play mode' },
  { id: 'prologue', title: 'قصة ليث', titleEn: "Laith's Story" },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { 
    uiLang, 
    gameMode, 
    setGameMode, 
    setTargetLanguage, 
    isOnboarded, 
    completeOnboarding,
    setUserProfile,
    userName,
    userJob,
    userGoal
  } = useUserStore()

  const [step, setStep] = useState(0)
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  
  // Profile inputs
  const [nameInput, setNameInput] = useState(userName || '')
  const [jobInput, setJobInput] = useState(userJob || 'مبرمج')
  const [customJob, setCustomJob] = useState('')
  const [goalInput, setGoalInput] = useState(userGoal || 'التطوير المهني والوظيفة')

  const isAr = uiLang === 'ar'

  useEffect(() => {
    if (isOnboarded) {
      navigate('/learn')
    }
  }, [isOnboarded, navigate])

  const saveProfileData = () => {
    const finalJob = jobInput === 'other' ? (customJob.trim() || 'عامل') : jobInput;
    setUserProfile({
      userName: nameInput.trim() || 'إسلام',
      userJob: finalJob,
      userGoal: goalInput
    });
  }

  const handleFinish = () => {
    if (selectedLang) setTargetLanguage(selectedLang)
    saveProfileData()
    completeOnboarding()
    if (gameMode === 'story') {
      navigate('/story')
    } else {
      navigate('/learn')
    }
  }

  const handleContinue = () => {
    if (step === 0) {
      if (selectedLang) setTargetLanguage(selectedLang)
      setStep(1)
    } else if (step === 1) {
      saveProfileData()
      setStep(2)
    } else if (step === 2) {
      if (gameMode === 'story') {
        setStep(3)
      } else {
        handleFinish()
      }
    }
  }

  // Calculated max steps for progress bar
  const maxSteps = gameMode === 'story' ? 4 : 3

  return (
    <div className="min-h-dvh flex flex-col bg-white text-slate-900" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-700">
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
        )}
        {/* Progress bar */}
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((step + 1) / maxSteps) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="language"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full text-center"
            >
              <h1 className="text-2xl sm:text-3xl font-black mb-6 text-slate-900">
                {isAr ? 'اختر اللغة التي تريد تعلمها' : 'Choose the language you want to learn'}
              </h1>

              <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all font-bold text-start cursor-pointer ${selectedLang === lang.code
                        ? 'bg-blue-100 text-slate-900 border-blue-500 shadow-md shadow-blue-200/50 scale-[1.02]'
                        : 'bg-white text-slate-900 border-black/10 hover:border-black/30 hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                        {isAr ? lang.name : lang.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isAr ? lang.nameEn : lang.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="profile"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full text-center space-y-4 max-h-[65vh] overflow-y-auto px-1"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-1 text-slate-900">
                  {isAr ? 'أخبرنا عنك لتخصيص رحلتك 👤' : 'Personalize Your Experience 👤'}
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm font-bold">
                  {isAr 
                    ? 'سيستخدم المدرب الصوتي اسمك الحقيقي ومجالك ليعلمك عبارات مخصصة لك!' 
                    : 'Your voice coach will use your real name and profession in lessons!'}
                </p>
              </div>

              <div className="space-y-3.5 text-start">
                {/* 1. Name Input */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 transition-all">
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isAr ? '1. ما هو اسمك الكريم؟' : '1. What is your name?'}
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={isAr ? 'مثال: إسلام، سارة، أحمد...' : 'e.g. Islam, Sarah, Alex...'}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>

                {/* 2. Job / Study Field */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
                  <label className="block text-xs font-black text-slate-700 mb-2">
                    {isAr ? '2. ماذا تعمل أو تدرس؟ (لتدريبك على مفردات مجالك)' : '2. What do you work or study?'}
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'مبرمج', label: '💻 مبرمج / تقني' },
                      { id: 'طالب', label: '🎓 طالب / باحث' },
                      { id: 'أعمال وتجارة', label: '💼 أعمال / تجارة' },
                      { id: 'طبيب / صحة', label: '🏥 طبيب / صحي' },
                      { id: 'مصمم / فنان', label: '🎨 مصمم / فنان' },
                      { id: 'other', label: '✍️ تخصص آخر' },
                    ].map((j) => (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setJobInput(j.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border-2 text-center cursor-pointer ${
                          jobInput === j.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm scale-[1.02]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {j.label}
                      </button>
                    ))}
                  </div>

                  {jobInput === 'other' && (
                    <input
                      type="text"
                      value={customJob}
                      onChange={(e) => setCustomJob(e.target.value)}
                      placeholder={isAr ? 'اكتب مهنتك أو تخصصك هنا...' : 'Type your job or field here...'}
                      className="mt-2.5 w-full bg-white px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  )}
                </div>

                {/* 3. Learning Goal */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
                  <label className="block text-xs font-black text-slate-700 mb-2">
                    {isAr ? '3. ما هدفك الأساسي من تعلم اللغة؟' : '3. What is your primary learning goal?'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'التطوير المهني والوظيفة', label: '🚀 العمل والوظيفة' },
                      { id: 'السفر والسياحة', label: '✈️ السفر والسياحة' },
                      { id: 'الدراسة والتفوق', label: '📚 الدراسة والامتحانات' },
                      { id: 'الثقافة وتكوين صداقات', label: '🌍 الثقافة والتحدث' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoalInput(g.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border-2 text-center cursor-pointer ${
                          goalInput === g.id
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm scale-[1.02]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="mode"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full text-center space-y-6"
            >
              <h1 className="text-2xl font-black mb-2 text-slate-900">{isAr ? STEPS[2].title : STEPS[2].titleEn}</h1>
              <p className="text-slate-600 text-sm">
                {isAr ? 'حدد كيف تفضل التعلم في هذا التطبيق' : 'Select how you prefer to learn in this app'}
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setGameMode('story')}
                  className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all text-start cursor-pointer ${gameMode === 'story'
                      ? 'border-black bg-blue-600 scale-[1.01] shadow-md text-white ring-4 ring-black/10'
                      : 'border-black/10 bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  <span className="text-4xl">🎭</span>
                  <div className="flex-1 space-y-1">
                    <div className="font-extrabold text-base text-white">
                      {isAr ? 'وضع القصة (موصى به)' : 'Story Mode (Recommended)'}
                    </div>
                    <div className="text-xs text-white/90 leading-relaxed">
                      {isAr
                        ? 'تعلم اللغات من خلال مغامرة ليث السينمائية، مشهد الشاطئ، حوار الكوخ والقرية ومحاورة الشخصيات بالذكاء الاصطناعي.'
                        : "Learn languages through Laith's cinematic adventure, beach survival, cabin dialogs, and talking to AI characters."}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setGameMode('normal')}
                  className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all text-start cursor-pointer ${gameMode === 'normal'
                      ? 'border-black bg-green-600 scale-[1.01] shadow-md text-white ring-4 ring-black/10'
                      : 'border-black/10 bg-green-500 text-white hover:bg-green-600'
                    }`}
                >
                  <span className="text-4xl">⚡</span>
                  <div className="flex-1 space-y-1">
                    <div className="font-extrabold text-base text-white">
                      {isAr ? 'الوضع العادي' : 'Regular Mode'}
                    </div>
                    <div className="text-xs text-white/90 leading-relaxed">
                      {isAr
                        ? 'دراسة مباشرة للمراحل والدروس المتتالية بدون مشاهد القصة السردية، مع الحفاظ على ترقية المزرعة والقرية.'
                        : 'Direct study of sequential lessons without cinematic cutscenes, keeping the farm and village elements.'}
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="prologue"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full text-center space-y-6 flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-7xl"
              >
                👑
              </motion.div>

              <div className="w-full max-w-md bg-slate-50 rounded-[2rem] p-6 shadow-md border border-slate-200 z-10 flex flex-col space-y-3 relative overflow-hidden text-start">
                <p className="text-base font-bold leading-relaxed text-slate-900">
                  {isAr
                    ? '«في بلاد الشرق البعيدة، نشأ الأمير ليث وصديقه عاصف كأخوين... لكن الحسد كان ينمو في الظلام.»'
                    : '"In distant Eastern lands, Prince Laith and his friend Aasif grew up as brothers... but envy was growing in the shadows."'}
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  {isAr
                    ? 'في ليلة التتويج، كشّر عاصف عن أنيابه، سلب العرش، ونفى ليث عبر البحار. استيقظ ليث على شاطئ مجهول، لا يعرف أحداً ولا يفهم لغة أهله...'
                    : 'On coronation night, Aasif showed his true face, seized the throne, and exiled Laith across the seas. Laith woke up on an unknown shore, knowing no one and unable to understand the local language...'}
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  {isAr
                    ? 'وجدته فتاة تُدعى إيلي وأخذته إلى كوخها الصغير. مهمتك الآن: ساعد ليث على تعلم اللغة، بناء مملكة جديدة، واستعادة عرشه!'
                    : 'A girl named Elly found him and took him to her small cabin. Your mission now: help Laith learn the language, build a new kingdom, and reclaim his throne!'}
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex-1 h-px bg-slate-200" />
                <span>🏖️ ← 👸 إيلي تجد ليث على الشاطئ</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="p-4 max-w-xl mx-auto w-full">
        {step === 0 && (
          <Button3D
            variant="success"
            size="lg"
            className="w-full text-lg !bg-[#58CC02] hover:!bg-[#46A302] !text-white !border-b-4 !border-[#46A302] !shadow-none !rounded-2xl cursor-pointer"
            disabled={!selectedLang}
            onClick={handleContinue}
          >
            {isAr ? 'التالي' : 'Next'}
          </Button3D>
        )}
        {step === 1 && (
          <Button3D
            variant="primary"
            size="lg"
            className="w-full text-lg !bg-blue-600 hover:!bg-blue-700 !text-white !border-b-4 !border-blue-800 !shadow-none !rounded-2xl cursor-pointer"
            onClick={handleContinue}
          >
            {isAr ? 'التالي: اختيار الوضع ➔' : 'Next: Choose Mode ➔'}
          </Button3D>
        )}
        {step === 2 && (
          <Button3D
            variant="primary"
            size="lg"
            className="w-full text-lg !bg-blue-500 hover:!bg-blue-600 !text-white !border-b-4 !border-blue-700 !shadow-none !rounded-2xl cursor-pointer"
            onClick={handleContinue}
          >
            {isAr ? 'التالي' : 'Next'}
          </Button3D>
        )}
        {step === 3 && (
          <Button3D
            variant="success"
            size="lg"
            className="w-full text-lg !bg-blue-500 hover:!bg-blue-600 !text-white !border-b-4 !border-blue-700 !shadow-none !rounded-2xl cursor-pointer"
            onClick={handleFinish}
          >
            {isAr ? 'ابدأ رحلة ليث 🚀' : "Begin Laith's Journey 🚀"}
          </Button3D>
        )}
      </div>
    </div>
  )
}
