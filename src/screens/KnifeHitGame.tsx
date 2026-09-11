import React, { useMemo } from 'react';
import KnifeHitGameDesktop, {
  KnifeHitGameProps,
  getPhraseDurability
} from './KnifeHitGame.desktop';
import KnifeHitGameMobile from './KnifeHitGame.mobile';

/**
 * فاحص بيئة التشغيل:
 * يتعرف بدقة على هواتف أندرويد وآيفون والأجهزة اللوحية
 * ويفصل بين تجربة الحاسوب وتجربة الهاتف.
 */
function isMobileEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|webos/i.test(ua);
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth <= 768;
  return isMobileUA || (isTouch && isSmallScreen);
}

export { getPhraseDurability, type KnifeHitGameProps };

/**
 * KnifeHitGame - الموزع الذكي:
 * - على أجهزة الحاسوب (Desktop): يُشغّل النسخة الأصلية الكاملة الحالية بدون أي تغيير.
 * - على الهواتف (Android / iPhone): يُشغّل النسخة المخصصة للهاتف (KnifeHitGame.mobile.tsx)
 *   والتي تدعم إطلاق السكين بالنطق المباشر وحساسية الصوت وفك حجز الميكروفون مع إمكانية النقر البديل.
 */
export default function KnifeHitGame(props: KnifeHitGameProps) {
  const isMobile = useMemo(() => isMobileEnvironment(), []);

  if (isMobile) {
    return <KnifeHitGameMobile {...props} />;
  }

  return <KnifeHitGameDesktop {...props} />;
}
