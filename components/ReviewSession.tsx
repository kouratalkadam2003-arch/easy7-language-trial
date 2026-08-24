import { useCallback, useEffect, useMemo, useState } from "react";
import { SavedCard } from "../lib/cardStore";
import { formatNextReview, Rating } from "../utils/srs";
import { rateCard } from "../lib/cardStore";

interface Props {
  cards: SavedCard[];
  title?: string;
  subtitle?: string;
  onDone: () => void;
}

export const ReviewSession = ({ cards: initial, title = "المراجعة", subtitle, onDone }: Props) => {
  const [queue, setQueue] = useState<SavedCard[]>(initial);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [lastDue, setLastDue] = useState<number | null>(null);
  const total = initial.length;

  const current = queue[index];
  const finished = !current;

  const playAudio = useCallback((text: string, lang: string) => {
    try {
      if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "english" ? "en-US" : lang === "french" ? "fr-FR" : lang === "turkish" ? "tr-TR" : "en-US";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error("playAudio failed:", e);
    }
  }, []);

  const handleRate = useCallback((rating: Rating) => {
    if (!current || !flipped) return;
    try {
      const updated = rateCard(current.id, rating);
      setLastDue(updated?.due ?? null);
    } catch (e) {
      console.error("rateCard failed:", e);
    } finally {
      setDone((d) => d + 1);
      setFlipped(false);
      setTimeout(() => setIndex((i) => i + 1), 250);
    }
  }, [current, flipped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped) {
        if (e.key === "1") handleRate("again");
        else if (e.key === "2") handleRate("hard");
        else if (e.key === "3") handleRate("good");
        else if (e.key === "4") handleRate("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, handleRate]);

  useEffect(() => {
    return () => {
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch { /* noop */ }
    };
  }, []);

  const langLabel = useMemo(() => {
    if (!current) return "";
    return current.lang === "english" ? "English" : current.lang === "french" ? "Français" : current.lang;
  }, [current]);

  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center text-4xl">
            ✅
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">أحسنت!</h2>
            <p className="text-gray-500">
              راجعت {done} بطاقة. البطاقة التالية {lastDue ? formatNextReview(lastDue) : "قريبًا"}.
            </p>
          </div>
          <button
            onClick={onDone}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          >
            متابعة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col" dir="rtl">
      <header className="px-4 py-4 border-b border-purple-100 bg-white/50 backdrop-blur">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h1 className="text-base sm:text-lg font-bold text-gray-800">{title}</h1>
          </div>
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg space-y-6">
          {/* شريط التقدم */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500">{done} / {total}</p>

          {/* البطاقة */}
          <div
            className="w-full max-w-md mx-auto cursor-pointer h-64 perspective-1000"
            onClick={() => setFlipped((f) => !f)}
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
              {/* الوجه الأمامي */}
              <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl border-2 border-purple-100 p-8">
                <span className="text-xs uppercase tracking-widest text-gray-400 mb-4">{langLabel}</span>
                <h2 className="text-3xl font-bold text-gray-800 text-center leading-relaxed" dir="ltr">
                  {current.native}
                </h2>
                {current.pronunciation && (
                  <p className="text-sm text-gray-400 text-center mt-4">{current.pronunciation}</p>
                )}
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-6">
                  <span>🔄</span>
                  <span>اضغط للكشف عن الترجمة</span>
                </div>
              </div>

              {/* الوجه الخلفي */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
                <span className="text-xs uppercase tracking-widest text-white/70 mb-4">الترجمة</span>
                <p className="text-3xl font-bold text-center leading-relaxed mb-6">
                  {current.translation}
                </p>
                <p className="text-lg text-white/80 text-center" dir="ltr">
                  {current.native}
                </p>
              </div>
            </div>
          </div>

          {/* أزرار التقييم */}
          <div className={`transition-all duration-300 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <p className="text-center text-sm text-gray-500 mb-3">كيف كان تذكّرك؟</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md mx-auto">
              {[
                { rating: "again" as Rating, label: "نسيت", color: "from-red-500 to-red-600", key: "1" },
                { rating: "hard" as Rating, label: "صعب", color: "from-orange-500 to-orange-600", key: "2" },
                { rating: "good" as Rating, label: "جيد", color: "from-blue-500 to-blue-600", key: "3" },
                { rating: "easy" as Rating, label: "سهل", color: "from-green-500 to-green-600", key: "4" },
              ].map(({ rating, label, color, key }) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  disabled={!flipped}
                  className={`py-3 px-2 rounded-xl font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 bg-gradient-to-b ${color} text-white border-b-4 border-black/20 active:border-b-0`}
                >
                  <span className="block">{label}</span>
                  <span className="block text-[10px] opacity-70 mt-1">({key})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
