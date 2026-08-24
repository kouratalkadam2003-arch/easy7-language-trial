import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, ChevronRight, Check } from 'lucide-react';
import { Button3D } from './ui/Button3D';

interface ChatMessage {
  speaker: 'A' | 'B';
  speakerName: string;
  gender: 'male' | 'female';
  text: string;
  translation: string;
  pronunciation: string;
}

interface PracticeStageProps {
  messages: ChatMessage[];
  onComplete: () => void;
}

export function PracticeStage({ messages, onComplete }: PracticeStageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  
  const activeMessage = messages[currentIndex];
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Videos
  const maleIdle = '/male_teacher_idle.mp4';
  const maleSpeak = '/male_teacher.mp4';
  const femaleIdle = '/female_teacher_idle.mp4';
  const femaleSpeak = '/female_teacher.mp4';

  useEffect(() => {
    // When current index changes, add it to visible messages
    if (messages[currentIndex] && !visibleMessages.includes(messages[currentIndex])) {
      setVisibleMessages(prev => [...prev, messages[currentIndex]]);
      // Auto-play the speech
      playCurrentMessage();
    }
  }, [currentIndex]);

  useEffect(() => {
    // Scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  const playCurrentMessage = () => {
    if (!messages[currentIndex]) return;
    setIsPlaying(true);
    
    // Simulate audio duration based on text length (approx 100ms per character)
    const duration = Math.max(2000, messages[currentIndex].text.length * 80);
    
    // Play text-to-speech
    const utterance = new SpeechSynthesisUtterance(messages[currentIndex].text);
    utterance.lang = 'en-US'; // We could make this dynamic based on targetLang
    
    // Try to match gender voice
    const voices = window.speechSynthesis.getVoices();
    const isMale = messages[currentIndex].gender === 'male';
    const voice = voices.find(v => v.lang.includes('en') && (isMale ? v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('guy') : v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('girl')));
    if (voice) utterance.voice = voice;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    window.speechSynthesis.speak(utterance);
    
    // Fallback if TTS fails or doesn't trigger onend
    setTimeout(() => {
      setIsPlaying(false);
    }, duration);
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    if (currentIndex < messages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  // Determine current video source
  let videoSrc = '';
  if (activeMessage) {
    const isMale = activeMessage.gender === 'male';
    if (isMale) {
      videoSrc = isPlaying ? maleSpeak : maleIdle;
    } else {
      videoSrc = isPlaying ? femaleSpeak : femaleIdle;
    }
  }

  return (
    <div className="flex flex-col h-screen bg-bg-main text-text-main">
      {/* Top Header */}
      <div className="h-14 flex items-center justify-between px-4 bg-white border-b-2 border-border-main z-10 shrink-0">
        <h2 className="font-black text-lg text-text-main">مرحلة الممارسة</h2>
        <span className="text-sm font-bold text-text-muted">{currentIndex + 1} / {messages.length}</span>
      </div>

      {/* Video Area (Fixed height) */}
      <div className="relative w-full h-64 bg-black overflow-hidden shrink-0">
        {videoSrc ? (
          <video 
            key={videoSrc} // Force re-mount when src changes to play immediately
            src={videoSrc}
            autoPlay
            loop
            muted // Muted because we use SpeechSynthesis for audio
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            لا يوجد فيديو
          </div>
        )}
        
        {/* Speaker Name Badge */}
        {activeMessage && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white font-bold flex items-center gap-2">
            {activeMessage.gender === 'male' ? '👨' : '👩'} {activeMessage.speakerName}
          </div>
        )}
      </div>

      {/* Chat Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-bg-subtle">
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg, idx) => {
            const isMe = msg.speaker === 'A';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border-2 ${
                  isMe 
                    ? 'bg-lingo-blue text-white border-lingo-blue-dark rounded-br-none' 
                    : 'bg-white text-text-main border-border-main rounded-bl-none'
                }`}>
                  <p className="font-bold text-lg leading-relaxed" dir="ltr">{msg.text}</p>
                  <p className={`text-sm mt-2 pt-2 border-t ${isMe ? 'border-white/20 text-blue-100' : 'border-border-main text-text-muted'}`} dir="rtl">
                    {msg.translation}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={chatEndRef} className="h-20" />
      </div>

      {/* Controls Area (Fixed bottom) */}
      <div className="p-4 bg-white border-t-2 border-border-main shrink-0">
        <div className="flex gap-3">
          <Button3D 
            variant="secondary" 
            className="flex-1 flex gap-2 justify-center"
            onClick={playCurrentMessage}
            disabled={isPlaying}
          >
            <Play className="w-5 h-5" />
            إعادة الاستماع
          </Button3D>
          
          <Button3D 
            variant={currentIndex === messages.length - 1 ? 'primary' : 'ghost'} 
            className={`flex-1 flex gap-2 justify-center ${currentIndex !== messages.length - 1 ? 'border-2 border-border-main' : ''}`}
            onClick={handleNext}
          >
            {currentIndex === messages.length - 1 ? (
              <>إنهاء <Check className="w-5 h-5" /></>
            ) : (
              <>التالي <ChevronRight className="w-5 h-5" /></>
            )}
          </Button3D>
        </div>
      </div>
    </div>
  );
}
