import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useSpeech } from '../hooks/use-speech'
import { MicButton } from './MicButton'
import { EnglishText } from './EnglishText'
import { askElly, type EllyTurn } from '../../services/ellyChat'

const SUGGESTIONS = ['Water, please', 'I want to sleep', 'Where am I?', 'Thank you, Elly']

// Mirrors the shape @ai-sdk/react's useChat produced, so the markup below is
// unchanged. Elly now answers from the browser instead of the /api/elly route.
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  parts: { type: 'text'; text: string }[]
}

export function CabinScene({ onComplete }: { onComplete: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<'ready' | 'streaming' | 'error'>('ready')
  const [input, setInput] = useState('')
  const { supported, listening, transcript, error: micError, listen, stop, setTranscript } = useSpeech()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [saidGoodbye, setSaidGoodbye] = useState(false)
  const canSend = status === 'ready' || status === 'error'

  const sendMessage = async ({ text }: { text: string }) => {
    const userMsg: ChatMessage = {
      id: `u-${messages.length}-${text.length}`,
      role: 'user',
      parts: [{ type: 'text', text }],
    }
    const history: EllyTurn[] = [...messages, userMsg].map(m => ({
      role: m.role,
      text: m.parts.map(p => p.text).join(' '),
    }))

    setMessages(prev => [...prev, userMsg])
    setStatus('streaming')
    try {
      const reply = await askElly(history)
      setMessages(prev => [...prev, {
        id: `a-${prev.length}-${reply.length}`,
        role: 'assistant',
        parts: [{ type: 'text', text: reply }],
      }])
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  // When speech recognition finishes, send the transcript
  useEffect(() => {
    if (!listening && transcript) {
      send(transcript)
      setTranscript('')
    }
  }, [listening, transcript, setTranscript])

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
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <img
        src="/scenes/cabin.png"
        alt="كوخ خشبي دافئ، إيلي تجلس على حافة السرير والنافذة تطل على البحر"
        className="h-full w-full object-cover"
        style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

      <div className="pointer-events-none absolute top-0 inset-x-0 h-10 md:h-16 bg-black" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-2 bg-black" />

      {/* Scene intro label */}
      <div className="absolute top-12 md:top-20 inset-x-0 flex justify-center px-4">
        <p className="rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-4 py-1.5 text-xs md:text-sm text-white/60">
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
              <div className="rounded-md border border-white/20 bg-black/70 backdrop-blur-sm px-4 py-3">
                <span className="inline-block mb-1 rounded-sm bg-[#58CC02] px-2 py-0.5 text-xs font-semibold text-white">
                  إيلي
                </span>
                <p dir="ltr" className="text-left font-serif text-base md:text-lg leading-relaxed text-white">
                  <EnglishText text={'"You are safe here, Laith. Are you hungry? Thirsty? Talk to me."'} />
                </p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-md border px-4 py-3 backdrop-blur-sm ${
                  message.role === 'user'
                    ? 'border-[#1CB0F6]/40 bg-[#1CB0F6]/15 self-end max-w-[85%]'
                    : 'border-white/20 bg-black/70 self-start max-w-[85%]'
                }`}
              >
                <span
                  className={`inline-block mb-1 rounded-sm px-2 py-0.5 text-xs font-semibold ${
                    message.role === 'user'
                      ? 'bg-[#1CB0F6] text-white'
                      : 'bg-[#58CC02] text-white'
                  }`}
                >
                  {message.role === 'user' ? 'ليث' : 'إيلي'}
                </span>
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    <p
                      key={index}
                      dir="ltr"
                      className="text-left font-serif text-base md:text-lg leading-relaxed text-white"
                    >
                      {message.role === 'user' ? part.text : <EnglishText text={part.text} />}
                    </p>
                  ) : null,
                )}
              </div>
            ))}
            {status === 'streaming' && (
              <p className="text-xs text-white/50 animate-pulse">إيلي تتحدث...</p>
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
                className="rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs md:text-sm text-white/60 hover:text-white hover:border-[#1CB0F6]/60 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

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
                if (e.key === 'Enter') {
                  send(input)
                }
              }}
              placeholder="Speak or type in English..."
              disabled={!canSend}
              className="flex-1 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-5 py-3 text-white placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-[#1CB0F6] disabled:opacity-60"
              aria-label="تحدث مع إيلي بالإنجليزية"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!canSend || !input.trim()}
              className="rounded-full bg-[#1CB0F6] p-3 text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              aria-label="إرسال"
            >
              <Send className="size-5" />
            </button>
          </div>

          {saidGoodbye && canSend && (
            <button
              type="button"
              onClick={onComplete}
              className="self-center rounded-md border border-[#1CB0F6] bg-[#1CB0F6]/20 px-6 py-2.5 text-sm font-semibold text-[#1CB0F6] hover:bg-[#1CB0F6]/30 transition-colors"
            >
              إنهاء الفصل الأول
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
