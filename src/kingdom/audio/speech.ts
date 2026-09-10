/**
 * Speech synthesis utility for multilingual pronunciation practice
 */

const LANG_CODE_MAP: Record<string, string> = {
  ja: 'ja-JP',
  japanese: 'ja-JP',
  zh: 'zh-CN',
  chinese: 'zh-CN',
  en: 'en-US',
  english: 'en-US',
  de: 'de-DE',
  german: 'de-DE',
  fr: 'fr-FR',
  french: 'fr-FR',
  it: 'it-IT',
  italian: 'it-IT',
  es: 'es-ES',
  spanish: 'es-ES',
  ar: 'ar-SA',
  arabic: 'ar-SA',
};

export function speakText(text: string, languageOrSubject?: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    let lang = 'en-US';

    if (languageOrSubject) {
      const lower = languageOrSubject.toLowerCase();
      for (const [key, code] of Object.entries(LANG_CODE_MAP)) {
        if (lower.includes(key)) {
          lang = code;
          break;
        }
      }
    }

    // Heuristics based on character set if not matched
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) {
      if (/[\u3040-\u30ff]/.test(text)) {
        lang = 'ja-JP';
      } else {
        lang = 'zh-CN';
      }
    } else if (/[äöüßÄÖÜ]/.test(text)) {
      lang = 'de-DE';
    } else if (/[éàèùâêîôûëïüç]/.test(text)) {
      lang = 'fr-FR';
    } else if (/[áéíóúñ¿¡]/.test(text)) {
      lang = 'es-ES';
    }

    utterance.lang = lang;
    utterance.rate = 0.9; // slightly slower for language learners
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}
