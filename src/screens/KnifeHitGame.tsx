import React, { useState } from 'react';
import KnifeHitGameDesktop, {
  KnifeHitGameProps,
  getPhraseDurability
} from './KnifeHitGame.desktop';
import KnifeHitGameMobile from './KnifeHitGame.mobile';

/**
 * دالة فحص البيئة وتحديد النسخة:
 * 1. تفحص الرابط (Query Param): ?version=desktop أو ?version=mobile
 * 2. تفحص الخيار المحفوظ في localStorage إن وُجد
 * 3. الفحص التلقائي لنوع الجهاز (هاتف أم حاسوب)
 */
function getInitialVersion(): 'desktop' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';

  // 1. رابط صريح في الـ URL: ?version=desktop أو ?version=mobile
  const params = new URLSearchParams(window.location.search);
  const v = (params.get('version') || params.get('mode') || params.get('device') || '').toLowerCase();
  if (v === 'desktop' || v === 'pc') return 'desktop';
  if (v === 'mobile' || v === 'phone') return 'mobile';

  // 2. خيار محفوظ سابقاً من زر التبديل
  const saved = localStorage.getItem('knifehit_version_preference');
  if (saved === 'desktop' || saved === 'mobile') return saved;

  // 3. كشف تلقائي على عتاد الجهاز
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|webos/i.test(ua);
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth <= 768;
  return (isMobileUA || (isTouch && isSmallScreen)) ? 'mobile' : 'desktop';
}

export { getPhraseDurability, type KnifeHitGameProps };

/**
 * KnifeHitGame - الموزع الذكي والمباشر:
 * يُتيح التبديل الفوري بنقرة واحدة أو عبر الرابط المباشر:
 * - ?version=desktop -> يُشغّل نسخة الحاسوب الأصلية 100%
 * - ?version=mobile  -> يُشغّل نسخة الهاتف المخصصة
 */
export default function KnifeHitGame(props: KnifeHitGameProps) {
  const [activeVersion, setActiveVersion] = useState<'desktop' | 'mobile'>(() => getInitialVersion());

  const switchVersion = (ver: 'desktop' | 'mobile') => {
    setActiveVersion(ver);
    try {
      localStorage.setItem('knifehit_version_preference', ver);
      const url = new URL(window.location.href);
      url.searchParams.set('version', ver);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  return (
    <div className="relative w-full h-full">
      {/* زر التبديل الفوري السريع بين نسخة الحاسوب ونسخة الهاتف */}
      <div 
        className="fixed top-2.5 left-2.5 z-[99999] flex items-center gap-1 bg-slate-950/90 backdrop-blur-md rounded-full border border-white/30 p-1 text-[11px] shadow-2xl font-bold select-none"
        dir="ltr"
      >
        <button
          type="button"
          onClick={() => switchVersion('desktop')}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            activeVersion === 'desktop'
              ? 'bg-blue-600 text-white shadow-md scale-105 border border-blue-400'
              : 'text-white/60 hover:text-white'
          }`}
          title="تشغيل نسخة الحاسوب الأصلية"
        >
          🖥️ نسخة الحاسوب
        </button>
        <button
          type="button"
          onClick={() => switchVersion('mobile')}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            activeVersion === 'mobile'
              ? 'bg-emerald-600 text-white shadow-md scale-105 border border-emerald-400'
              : 'text-white/60 hover:text-white'
          }`}
          title="تشغيل نسخة الهاتف المخصصة"
        >
          📱 نسخة الهاتف
        </button>
      </div>

      {/* عرض النسخة المختارة */}
      {activeVersion === 'mobile' ? (
        <KnifeHitGameMobile {...props} />
      ) : (
        <KnifeHitGameDesktop {...props} />
      )}
    </div>
  );
}
