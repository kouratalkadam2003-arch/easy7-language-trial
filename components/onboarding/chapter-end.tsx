'use client'

import { Star } from 'lucide-react'

export function ChapterEnd({
  onRestart,
  onContinue,
  chapterLabel = 'نهاية الفصل الأول',
  title = 'الخيانة',
  description = 'نجوت من البحر، وقابلت إيلي، ونطقت أول كلماتك بالإنجليزية. رحلة استرداد العرش قد بدأت للتو...',
  nextLabel = 'الفصل القادم: القرية',
  image = '/scenes/beach.png',
  imageAlt = 'شاطئ عند الفجر',
}: {
  onRestart: () => void
  onContinue?: () => void
  chapterLabel?: string
  title?: string
  description?: string
  nextLabel?: string
  image?: string
  imageAlt?: string
}) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-white">
      <img src={image || '/placeholder.svg'} alt={imageAlt} className="h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center animate-fade-in-slow">
        <p className="text-sm tracking-widest text-white/70">{chapterLabel}</p>
        <h2 className="font-serif text-4xl md:text-6xl font-bold text-balance">{title}</h2>

        <div className="flex items-center gap-2 text-primary" aria-label="حصلت على 3 نجوم إرادة">
          <Star className="size-8 fill-primary" />
          <Star className="size-8 fill-primary" />
          <Star className="size-8 fill-primary" />
        </div>

        <p className="max-w-md text-base leading-relaxed text-white/70 text-pretty">
          {description}
        </p>

        <p className="font-serif text-lg text-white/80">{nextLabel}</p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              تابع المغامرة
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="rounded-md border border-border px-8 py-3 text-sm text-white hover:border-primary hover:text-primary transition-colors"
          >
            العودة إلى البداية
          </button>
        </div>
      </div>
    </div>
  )
}
