import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'
import { BookOpen, Sparkles, Target, Users } from 'lucide-react'

import foxLogo from '../fox-logo.png'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { uiLang, setUiLang, isOnboarded } = useUserStore()

  useEffect(() => {
    if (isOnboarded) {
      navigate('/learn')
    }
  }, [isOnboarded, navigate])

  const features = [
    { icon: BookOpen, title: uiLang === 'ar' ? 'قصص تفاعلية' : 'Interactive Stories', desc: uiLang === 'ar' ? 'تعلم عبر قصة ليث الملحمية' : 'Learn through Laith\'s epic story' },
    { icon: Sparkles, title: uiLang === 'ar' ? 'مراجعة ذكية' : 'Smart Review', desc: uiLang === 'ar' ? 'تكرار متباعد للحفظ الدائم' : 'Spaced repetition for lasting memory' },
    { icon: Target, title: uiLang === 'ar' ? 'مستويات متدرجة' : 'Progressive Levels', desc: uiLang === 'ar' ? 'من المبتدئ للإتقان بخطوات ثابتة' : 'From beginner to mastery step by step' },
    { icon: Users, title: uiLang === 'ar' ? 'مجتمع متعلمين' : 'Learning Community', desc: uiLang === 'ar' ? 'تنافس وتعاون مع متعلمين حول العالم' : 'Compete and collaborate globally' },
  ]

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800" dir="rtl">

      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-24 -start-24 animate-float" />
        <div className="absolute w-56 h-56 rounded-full bg-white/5 bottom-10 -end-10 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute w-40 h-40 rounded-full bg-white/10 top-1/3 end-10 animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center p-8 max-w-md mx-4 w-full"
      >
        {/* Blue Fox Mascot Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          className="mb-4 animate-bounce-soft flex justify-center"
        >
          <img 
            src={foxLogo} 
            alt="Easy7languages Logo" 
            className="w-44 h-44 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] rounded-3xl"
          />
        </motion.div>

        {/* Title (Explicit LTR for English branding) */}
        <motion.div
          dir="ltr"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3.5 mb-4 select-none"
        >
          <span 
            className="text-4xl md:text-5xl font-black text-amber-300 tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
            style={{ fontFamily: '"Fredoka One", "Nunito", sans-serif' }}
          >
            Easy7
          </span>
          <span 
            className="text-3xl md:text-4xl font-black text-white tracking-wider uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
            style={{ fontFamily: '"Nunito", "Cairo", sans-serif' }}
          >
            Languages
          </span>
        </motion.div>



        {/* Features — staggered cascade, one at a time */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="w-full mb-8 space-y-3"
        >
          {features.slice(0, 3).map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ x: -30, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{
                delay: 1.0 + index * 0.35,
                type: 'spring',
                stiffness: 180,
                damping: 20,
              }}
              className="flex items-center gap-3 p-3.5 bg-white rounded-2xl shadow-md border border-white/50 text-right"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-blue-900 font-bold text-sm">{feature.title}</p>
                <p className="text-blue-600/80 text-xs font-medium">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>


        {/* Language toggle */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex gap-3 mb-8 justify-center w-full"
        >
          <button
            onClick={() => setUiLang('ar')}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border-2 cursor-pointer shadow-sm ${uiLang === 'ar'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                : 'bg-white text-blue-600 border-white hover:bg-blue-50'
              }`}
          >
            عربي
          </button>
          <button
            onClick={() => setUiLang('en')}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border-2 cursor-pointer shadow-sm ${uiLang === 'en'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                : 'bg-white text-blue-600 border-white hover:bg-blue-50'
              }`}
          >
            English
          </button>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.7 }}
          className="w-full space-y-4"
        >
          <Button3D
            variant="secondary"
            className="w-full text-lg font-bold !bg-green-500 hover:!bg-green-600 !text-white !border-b-4 !border-green-700 !shadow-none !rounded-2xl transition-colors duration-200"
            onClick={() => navigate('/onboarding')}
          >
            {uiLang === 'ar' ? 'ابدأ الآن مجاناً' : 'Get Started Free'}
          </Button3D>

          <button
            onClick={() => navigate('/learn')}
            className="w-full py-4 text-white hover:bg-blue-600 hover:text-white font-bold text-sm rounded-2xl transition-colors duration-200 border-2 border-transparent hover:border-blue-400"
          >
            {uiLang === 'ar' ? 'لدي حساب بالفعل' : 'I already have an account'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}