import { generateSpeechFromText } from '../../services/ai';

let currentAudio: HTMLAudioElement | null = null;

/** Google Gemini AI Speech Engine with natural AI voice. */
export async function speak(text: string, lang = "en-US", rate = 1.0) {
  if (!text || typeof window === "undefined") return;
  
  stopSpeaking();

  const langCode = lang.split('-')[0].toLowerCase() as any;

  try {
    const base64Audio = await generateSpeechFromText(text, langCode, rate);
    if (base64Audio) {
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      currentAudio = audio;
      audio.playbackRate = rate;
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('[TTS] Google GenAI speech failed, falling back to browser speech synthesis:', err);
  }

  // Graceful browser fallback if offline
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

const LANG_BCP47: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  ja: "ja-JP",
  zh: "zh-CN",
  ar: "ar-SA",
};

export function bcp47(code: string) {
  return LANG_BCP47[code] ?? "en-US";
}

/** Tiny vibration helper for tactile feedback. */
export function buzz(pattern: number | number[] = 30) {
  if (typeof navigator === "undefined") return;
  // @ts-ignore
  if (navigator.vibrate) navigator.vibrate(pattern);
}
