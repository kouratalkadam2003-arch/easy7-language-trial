import { useState, useEffect } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { useUserStore } from '@/store/userStore';

export function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const uiLang = useUserStore((s) => s.uiLang);
  const isAr = uiLang === 'ar';

  useEffect(() => {
    // Check if we should prompt the user
    if (notificationService.shouldShowPromptBanner()) {
      setVisible(true);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    notificationService.dismissPromptFor24h();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-3 pb-1" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-amber-500/40 p-4 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 shadow-inner">
            <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-black text-amber-300">
                {isAr ? 'تفعيل إشعارات القرية والمراجعة' : 'Enable Kingdom & Review Notifications'}
              </h4>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
              {isAr
                ? 'تنبيهات فورية عند حاجة الحقول للسقي، وتعب المقاتلين، ومواعيد تثبيت عباراتك!'
                : 'Live alerts when fields need watering, warriors are tired, and reviews are due!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={handleEnable}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>{isAr ? 'تفعيل الإشعارات 🔔' : 'Enable 🔔'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
            title={isAr ? 'لاحقاً' : 'Later'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
