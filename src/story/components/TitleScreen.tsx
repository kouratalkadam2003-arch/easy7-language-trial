export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <img
        src="/scenes/title-screen.png"
        alt="تاج ذهبي يغرق في بحر عاصف مظلم تحت ضوء القمر"
        className="h-full w-full object-cover"
        style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex flex-col items-center gap-3" style={{ animation: 'fadeInSlow 1.5s ease-out' }}>
          <p className="text-sm md:text-base tracking-widest text-white/50">
            مغامرة سردية تعليمية
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-white" style={{ fontFamily: 'serif' }}>
            مملكة الرمل
          </h1>
          <p dir="ltr" className="text-lg md:text-xl text-[#1CB0F6] tracking-wide" style={{ fontFamily: 'serif' }}>
            Kingdom of Sand
          </p>
        </div>

        <p className="max-w-md text-sm md:text-base leading-relaxed text-white/60" style={{ animation: 'fadeInSlow 2s ease-out' }}>
          خانك أقرب الناس إليك، وابتلعك البحر. استرد اسمك، وتعلم لغة جديدة في رحلة العودة إلى
          العرش.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-4 rounded-md border border-[#1CB0F6] bg-[#1CB0F6]/15 px-10 py-4 text-xl text-[#1CB0F6] transition-colors hover:bg-[#1CB0F6] hover:text-white"
          style={{ fontFamily: 'serif', animation: 'fadeInSlow 2.5s ease-out' }}
        >
          ابدأ القصة
        </button>

        <p className="text-xs text-white/40">
          يُنصح باستخدام سماعات وميكروفون لتجربة كاملة
        </p>
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes fadeInSlow {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
