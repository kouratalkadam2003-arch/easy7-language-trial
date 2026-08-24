'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send } from 'lucide-react'
import { useSpeech } from '@/hooks/use-speech'
import { MicButton } from './mic-button'
import { EnglishText } from './english-text'

const SUGGESTIONS = ['Water, please', 'I want to sleep', 'Where am I?', 'Thank you, Elly']

export function CabinScene({ onComplete }: { onComplete: () => void }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/elly' }), [])
  const { messages, sendMessage, status } = useChat({ transport })
  const [input, setInput] = useState('')
  const { supported, listening, transcript, error: micError, listen, stop, setTranscript } = useSpeech()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [saidGoodbye, setSaidGoodbye] = useState(false)
  // Allow retry after an error instead of locking the inputs forever
  const canSend = status === 'ready' || status === 'error'

  // When speech recognition finishes, send the transcript
  useEffect(() => {
    if (!listening && transcript) {
      send(transcript)
      setTranscript('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, transcript])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || !canSend) return
    sendMessage({ text: trimmed })
    setInput('')
    if (trimmed.toLowerCase().includes('goodbye') || trimmed.toLowerCase().includes('bye')) {
      setSaidGoodbye(true)
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-white">
      <img
        src="/scenes/cabin.png"
        alt="كوخ خشبي دافئ، إيلي تجلس على حافة السرير والنافذة تطل على البحر"
        className="h-full w-full object-cover animate-ken-burns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

      <div className="pointer-events-none absolute top-0 inset-x-0 h-10 md:h-16 bg-black text-white" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-2 bg-black text-white" />

      {/* Scene intro label */}
      <div className="absolute top-12 md:top-20 inset-x-0 flex justify-center px-4">
        <p className="rounded-full border border-border bg-black text-white/70 backdrop-blur-sm px-4 py-1.5 text-xs md:text-sm text-white/70">
          الكوخ — تحدث مع إيلي بحرية بالإنجليزية، بالصوت أو الكتابة
        </p>
      </div>

      {/* Chat area */}
      <div className="absolute bottom-0 inset-x-0 flex justify-center px-4 pb-4 md:pb-8">
        <div className="w-full max-w-3xl flex flex-col gap-3">
          <div
            ref={scrollRef}
            className="max-h-[40dvh] overflow-y-auto flex flex-col gap-2 pr-1"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="rounded-md border border-border bg-black text-white/70 backdrop-blur-sm px-4 py-3">
                <span className="inline-block mb-1 rounded-sm bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                  إيلي
                </span>
                <p dir="ltr" className="text-left font-serif text-base md:text-lg leading-relaxed">
                  <EnglishText text={'"You are safe here, Laith. Are you hungry? Thirsty? Talk to me."'} />
                </p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-md border px-4 py-3 backdrop-blur-sm ${
                  message.role === 'user'
                    ? 'border-primary/40 bg-primary/15 self-end max-w-[85%]'
                    : 'border-border bg-black text-white/70 self-start max-w-[85%]'
                }`}
              >
                <span
                  className={`inline-block mb-1 rounded-sm px-2 py-0.5 text-xs font-semibold ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                  }`}
                >
                  {message.role === 'user' ? 'ليث' : 'إيلي'}
                </span>
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    <p
                      key={index}
                      dir="ltr"
                      className="text-left font-serif text-base md:text-lg leading-relaxed"
                    >
                      {message.role === 'user' ? part.text : <EnglishText text={part.text} />}
                    </p>
                  ) : null,
                )}
              </div>
            ))}
            {status === 'streaming' && (
              <p className="text-xs text-white/70 animate-pulse">إيلي تتحدث...</p>
            )}
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2" dir="ltr">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={!canSend}
                className="rounded-full border border-border bg-black text-white/70 px-3 py-1.5 text-xs md:text-sm text-white/70 hover:text-white hover:border-primary/60 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {status === 'error' && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive/90 mb-2">
              <p>عذراً، يبدو أن خادم الذكاء الاصطناعي لا يرد حالياً (API Error).</p>
              <p>تستطيع المتابعة لإنهاء الفصل إذا أردت.</p>
            </div>
          )}

          {/* Input row */}
          <div className="flex items-center gap-2" dir="ltr">
            {supported && !micError && (
              <MicButton
                listening={listening}
                onStart={listen}
                onStop={stop}
                label={listening ? '...' : ''}
              />
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  send(input)
                }
              }}
              placeholder="Speak or type in English..."
              disabled={!canSend}
              className="flex-1 rounded-full border border-input bg-black text-white/70 backdrop-blur-sm px-5 py-3 text-white placeholder:text-white/70 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
              aria-label="تحدث مع إيلي بالإنجليزية"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!canSend || !input.trim()}
              className="rounded-full bg-primary p-3 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              aria-label="إرسال"
            >
              <Send className="size-5" />
            </button>
          </div>

          {(saidGoodbye || status === 'error') && canSend && (
            <button
              type="button"
              onClick={onComplete}
              className="self-center rounded-md border border-primary bg-primary/20 px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/30 transition-colors animate-fade-in-slow"
            >
              إنهاء الفصل الأول
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
