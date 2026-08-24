'use client'

export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-white">
      <img
        src="/scenes/title-screen.png"
        alt="تاج ذهبي يغرق في بحر عاصف مظلم تحت ضوء القمر"
        className="h-full w-full object-cover animate-ken-burns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="animate-fade-in-slow flex flex-col items-center gap-3">
          <p className="text-sm md:text-base tracking-widest text-white/70">
            مغامرة سردية تعليمية
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white text-balance">
            مملكة الرمل
          </h1>
          <p dir="ltr" className="font-serif text-lg md:text-xl text-primary tracking-wide">
            Kingdom of Sand
          </p>
        </div>

        <p className="max-w-md text-sm md:text-base leading-relaxed text-white/70 text-pretty animate-fade-in-slow">
          خانك أقرب الناس إليك، وابتلعك البحر. استرد اسمك، وتعلم لغة جديدة في رحلة العودة إلى
          العرش.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-4 rounded-md border border-primary bg-primary/15 px-10 py-4 font-serif text-xl text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-primary animate-fade-in-slow"
        >
          ابدأ القصة
        </button>

        <p className="text-xs text-white/70/70">
          يُنصح باستخدام سماعات وميكروفون لتجربة كاملة
        </p>
      </div>
    </div>
  )
}
