import { Mic, Square } from 'lucide-react'

export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-6 items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-[#1CB0F6] ${active ? 'waveform-bar' : 'h-1.5'}`}
          style={
            active
              ? { height: `${8 + (i % 4) * 5}px`, animationDelay: `${i * 0.12}s`, animation: 'waveform 1.2s ease-in-out infinite' }
              : undefined
          }
        />
      ))}
    </div>
  )
}

export function MicButton({
  listening,
  onStart,
  onStop,
  label,
}: {
  listening: boolean
  onStart: () => void
  onStop: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={listening ? onStop : onStart}
      className={`flex items-center gap-3 rounded-full border px-5 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
        listening
          ? 'border-[#1CB0F6] bg-[#1CB0F6]/20 text-[#1CB0F6]'
          : 'border-white/20 bg-black/60 text-white hover:border-[#1CB0F6]/60'
      }`}
      aria-pressed={listening}
    >
      {listening ? <Square className="size-5" /> : <Mic className="size-5" />}
      <span className="text-sm font-medium">{label}</span>
      <Waveform active={listening} />

      <style>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>
    </button>
  )
}
