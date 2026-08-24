import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { ChevronUp, ChevronDown, RefreshCcw, Languages } from 'lucide-react'
import { toArabicPhonetics } from '@/utils/phonetics'
import type { LiveMessage } from '@/hooks/useLiveRadio'
import type { Language } from '@/types/remix_types'

interface TeleprompterProps {
  speaker: 'Sara' | 'Khalid'
  turns: any[]
  globalActiveTurnIndex: number
  isLiveMode: boolean
  audioStatus: string
  activeLiveSpeaker: string | null
  liveConversation?: LiveMessage[]
  language?: Language
  showNativeScript?: boolean
  onToggleNativeScript?: () => void
}

export function Teleprompter({
  speaker,
  turns,
  globalActiveTurnIndex,
  isLiveMode,
  audioStatus,
  activeLiveSpeaker,
  liveConversation = [],
  language,
  showNativeScript: parentShowNativeScript,
  onToggleNativeScript
}: TeleprompterProps) {
  const [viewIndex, setViewIndex] = useState(0)
  const [localShowNativeScript, setLocalShowNativeScript] = useState(false)
  const showNative = parentShowNativeScript !== undefined ? parentShowNativeScript : localShowNativeScript
  const toggleNative = onToggleNativeScript || (() => setLocalShowNativeScript(prev => !prev))

  const langCode = language?.code || 'en'
  const isJa = langCode === 'ja'
  const isZh = langCode === 'zh'
  const hasScriptToggle = isJa || isZh

  // Filter turns belonging strictly to this speaker and remember their global indices
  const myTurns = useMemo(() => {
    return turns
      .map((t, i) => ({ ...t, globalIndex: i }))
      .filter((t) => t.speaker?.toLowerCase() === speaker.toLowerCase() || (speaker === 'Sara' && t.speaker === 'Sarah') || (speaker === 'Khalid' && t.speaker === 'Khaled'))
  }, [turns, speaker])

  // Filter live messages strictly said by this speaker
  const myLiveMessages = useMemo(() => {
    const targetTag = speaker === 'Sara' ? 'sarah' : 'khalid'
    return liveConversation.filter((m) => m.speakerTag === targetTag)
  }, [liveConversation, speaker])

  // Auto-sync when the global index matches one of my turns in offline mode
  useEffect(() => {
    const activeLocalIndex = myTurns.findIndex(
      (t) => t.globalIndex === globalActiveTurnIndex
    )
    if (activeLocalIndex !== -1) {
      setViewIndex(activeLocalIndex)
    }
  }, [globalActiveTurnIndex, myTurns])

  const handleUp = () => {
    if (viewIndex > 0) setViewIndex(viewIndex - 1)
  }
  const handleDown = () => {
    if (viewIndex < myTurns.length - 1) setViewIndex(viewIndex + 1)
  }
  const handleSync = () => {
    let latest = 0
    myTurns.forEach((t, i) => {
      if (t.globalIndex <= globalActiveTurnIndex) latest = i
    })
    setViewIndex(latest)
  }

  const normalizedLiveSpeaker = activeLiveSpeaker?.toLowerCase() === 'sarah' ? 'sara' : activeLiveSpeaker?.toLowerCase()
  const isMyTurnActive = isLiveMode
    ? normalizedLiveSpeaker === (speaker === 'Sara' ? 'sara' : 'khalid')
    : audioStatus === 'speaking' &&
      turns[globalActiveTurnIndex]?.speaker?.toLowerCase() === speaker.toLowerCase()

  const currentLine = myTurns[viewIndex]
  const isCurrentlySpeakingThisLine =
    isMyTurnActive && currentLine?.globalIndex === globalActiveTurnIndex

  // Determine active text in Live mode vs Offline mode
  const latestLiveMsg = myLiveMessages[myLiveMessages.length - 1]
  const liveRawText = latestLiveMsg?.text 
    ? latestLiveMsg.text.replace(/^(سارة|خالد|Sarah|Khalid):\s*/i, '').trim()
    : ''

  // Determine display text based on language and Romaji/Pinyin preferences
  let primaryText = ''
  let nativeScriptText = ''
  let translationText = ''
  let phoneticPronunciation = ''

  if (isLiveMode) {
    if (liveRawText) {
      primaryText = liveRawText
      phoneticPronunciation = toArabicPhonetics(liveRawText)
    } else {
      primaryText = isMyTurnActive 
        ? (speaker === 'Sara' ? 'سارة تتحدث الآن...' : 'خالد يتحدث الآن...')
        : (speaker === 'Sara' ? 'في انتظار رد سارة...' : 'في انتظار رد خالد...')
    }
  } else if (currentLine) {
    const romajiOrPronunciation = currentLine.romaji || currentLine.phonetic || currentLine.pronunciation || ''
    const nativeText = currentLine.nativeScript || currentLine.native || currentLine.text || ''

    if (hasScriptToggle) {
      if (showNative) {
        primaryText = nativeText || romajiOrPronunciation
        nativeScriptText = romajiOrPronunciation
      } else {
        primaryText = romajiOrPronunciation || nativeText
        nativeScriptText = nativeText
      }
    } else {
      primaryText = currentLine.text || nativeText
    }

    translationText = currentLine.translation || currentLine.ar || ''
    phoneticPronunciation = toArabicPhonetics(romajiOrPronunciation || primaryText)
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Background Video - Idle (Listening) */}
      <video
        src={speaker === 'Sara' ? '/female_teacher_idle.mp4' : '/male_teacher_idle.mp4'}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${!isMyTurnActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      />
      {/* Background Video - Talking */}
      <video
        src={speaker === 'Sara' ? '/female_teacher.mp4' : '/male_teacher.mp4'}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${isMyTurnActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      />

      {/* Host Badge Header */}
      <div className={`absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white/95 px-4 py-1.5 rounded-2xl font-bold text-xs tracking-wide border border-white/20 shadow-lg ${speaker === 'Sara' ? 'top-4 sm:top-6 lg:top-8' : 'bottom-4 sm:bottom-6 lg:bottom-8'}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${isMyTurnActive ? (speaker === 'Sara' ? 'bg-pink-400 animate-ping' : 'bg-indigo-400 animate-ping') : 'bg-slate-400'}`} />
        <span>{speaker === 'Sara' ? '🎙️ سارة (Sara)' : '🎙️ خالد (Khalid)'}</span>
      </div>

      {/* Subtitle Teleprompter Overlaid */}
      <div className="absolute bottom-12 sm:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2 w-[92%] sm:w-[84%] max-w-lg z-20 flex items-center justify-center gap-2 sm:gap-3">
        
        {/* Main Subtitle Bubble */}
        <div className={`flex-1 flex flex-col justify-center items-center text-center backdrop-blur-2xl rounded-[1.8rem] sm:rounded-[2.2rem] p-3.5 sm:p-5 shadow-2xl border transition-all duration-300 min-h-[95px] sm:min-h-[120px] ${
          isMyTurnActive
            ? speaker === 'Sara'
              ? 'bg-white/90 border-pink-400/80 ring-4 ring-pink-400/20 shadow-pink-500/10'
              : 'bg-white/90 border-indigo-400/80 ring-4 ring-indigo-400/20 shadow-indigo-500/10'
            : 'bg-white/75 border-white/60'
        }`}>
          
          {(isLiveMode && liveRawText) || (!isLiveMode && myTurns.length > 0) ? (
            <motion.div
              key={isLiveMode ? (latestLiveMsg?.id || 'live') : viewIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center gap-1.5 sm:gap-2"
            >
              {/* Script Toggle Pill (for Japanese & Chinese) */}
              {hasScriptToggle && (
                <div className="flex items-center gap-1.5 self-center mb-0.5">
                  <button
                    onClick={toggleNative}
                    type="button"
                    className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-[10px] font-bold text-slate-700 flex items-center gap-1 border border-slate-300 transition-all shadow-xs"
                    title={isJa ? 'التبديل بين الروماجي والكانجي' : 'التبديل بين البينيين والهانزي'}
                  >
                    <Languages className="w-3 h-3 text-blue-600" />
                    <span>{isJa ? (showNative ? '🔤 عرض الروماجي' : '🇯🇵 عرض الكانجي/هيراغانا') : (showNative ? '🔤 عرض البينيين' : '🇨🇳 عرض الرموز (هانزي)')}</span>
                  </button>
                </div>
              )}

              {/* Primary Spoken Text (Romaji / Pinyin / Native) */}
              <h2
                dir="ltr"
                className={`text-base sm:text-lg lg:text-xl font-black font-sans leading-snug tracking-wide transition-colors ${
                  isMyTurnActive
                    ? speaker === 'Sara' ? 'text-pink-600' : 'text-indigo-600'
                    : 'text-slate-800'
                }`}
              >
                {primaryText}
              </h2>

              {/* Arabic Phonetic Pronunciation (نطق بالأحرف العربية) */}
              {phoneticPronunciation && phoneticPronunciation !== primaryText && (
                <div dir="rtl" className="px-2.5 py-0.5 rounded-md bg-amber-50/90 border border-amber-200/80 text-[11px] sm:text-xs text-amber-900 font-bold font-sans">
                  🗣️ النطق: <span className="text-amber-800 font-extrabold">{phoneticPronunciation}</span>
                </div>
              )}

              {/* Arabic Translation */}
              {translationText && (
                <p dir="rtl" className="text-xs sm:text-sm lg:text-base text-slate-700 font-bold font-sans leading-relaxed mt-0.5">
                  {translationText}
                </p>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-500 font-medium text-xs sm:text-sm py-1">
              <span className="animate-pulse">{isMyTurnActive ? (speaker === 'Sara' ? 'سارة تتحدث...' : 'خالد يتحدث...') : (speaker === 'Sara' ? 'في انتظار سارة...' : 'في انتظار خالد...')}</span>
            </div>
          )}
        </div>

        {/* Floating Navigation Controls (in offline mode) */}
        {!isLiveMode && myTurns.length > 1 && (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <button 
              onClick={handleUp} 
              disabled={viewIndex === 0}
              aria-label="Previous line"
              className="p-1.5 sm:p-2 rounded-full bg-white/70 backdrop-blur-md shadow-md border border-white/60 hover:bg-white active:scale-95 transition-all text-slate-700 disabled:opacity-30"
            >
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={handleSync} 
              aria-label="Sync line"
              className="p-1.5 sm:p-2 rounded-full bg-white/70 backdrop-blur-md shadow-md border border-white/60 hover:bg-white active:scale-95 transition-all text-indigo-600"
            >
              <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={handleDown} 
              disabled={viewIndex === myTurns.length - 1}
              aria-label="Next line"
              className="p-1.5 sm:p-2 rounded-full bg-white/70 backdrop-blur-md shadow-md border border-white/60 hover:bg-white active:scale-95 transition-all text-slate-700 disabled:opacity-30"
            >
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Equalizer Audio Waves when speaking */}
      {isMyTurnActive && (
        <div className="absolute bottom-3 left-4 flex items-end gap-1 h-5 z-20 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, 14, 8, 18, 4][i] * Math.random() + 4 }}
              transition={{ repeat: Infinity, duration: 0.4 + i * 0.1, ease: 'easeInOut' }}
              className={`w-1 bg-gradient-to-t ${speaker === 'Sara' ? 'from-pink-500 to-pink-300' : 'from-indigo-500 to-indigo-300'} rounded-full`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
