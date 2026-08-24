
export interface GenAIBlob {
  data: string;
  mimeType: string;
}
import { Language } from '../types';
import { generateSpeechFromText, convertTextForTTS, cleanTextFromScriptLabels } from '../services/ai';

// --- STRICT LOCALE MAPPING ---
// Enforces the correct voice engine for each language.
const LOCALE_MAP: Record<string, string> = {
    'en': 'en-US',
    'ja': 'ja-JP',
    'zh': 'zh-CN', // Mandarin
    'es': 'es-ES',
    'it': 'it-IT',
    'de': 'de-DE',
    'fr': 'fr-FR',
    'ar': 'ar-SA',
    'ru': 'ru-RU',
    'pt': 'pt-BR',
    'ko': 'ko-KR',
    'tr': 'tr-TR',
    'hi': 'hi-IN'
};

// --- TTS Mode Management ---
export type TTSMode = 'standard' | 'hq';

export const getTTSMode = (): TTSMode => {
    return (localStorage.getItem('ttsMode') as TTSMode) || 'hq';
};

export const setTTSMode = (mode: TTSMode) => {
    localStorage.setItem('ttsMode', mode);
    // Dispatch event so UI can update if needed
    window.dispatchEvent(new Event('ttsModeChanged'));
};

// Global AudioContext for HQ TTS
let globalAudioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null;

const getAudioContext = () => {
    if (!globalAudioContext) {
        globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioContext.state === 'suspended') {
        globalAudioContext.resume();
    }
    return globalAudioContext;
};

// --- Core TTS Function (Browser Fallback) ---
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speak = (
    text: string,
    languageCode: string,
    rate: number = 1.0,
    pitch: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (e: any) => void,
    selectedVoice?: SpeechSynthesisVoice | null | string
) => {
    if (!('speechSynthesis' in window)) {
        console.error("Web Speech API not supported");
        return;
    }
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply Strict Locale
    // Normalize language code to handle cases like 'zh' -> 'zh-CN'
    const baseLang = languageCode.split('-')[0].toLowerCase();
    const targetLang = LOCALE_MAP[languageCode] || LOCALE_MAP[baseLang] || languageCode;
    utterance.lang = targetLang;
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); currentUtterance = null; };
    utterance.onerror = (e) => { if (onError) onError(e); currentUtterance = null; };
    
    // Attempt to find an exact voice match if possible to prevent OS fallback to wrong dialect
    const voices = window.speechSynthesis.getVoices();
    if (selectedVoice) {
        let voiceUri = typeof selectedVoice === 'string' ? selectedVoice : selectedVoice.voiceURI;
        const exactVoice = voices.find(v => v.voiceURI === voiceUri);
        if (exactVoice) {
            utterance.voice = exactVoice;
        } else {
            console.warn(`Voice with uri ${voiceUri} not found, falling back`);
        }
    } 
    
    if (!utterance.voice && voices.length > 0) {
        // Try to find Google voices first for better quality
        // Normalize voice lang for comparison (some browsers use underscore)
        let bestVoice = voices.find(v => 
            v.lang.replace('_', '-') === targetLang && v.name.includes('Google')
        );
        
        if (!bestVoice) {
            bestVoice = voices.find(v => v.lang.replace('_', '-') === targetLang);
        }
        
        if (!bestVoice) {
            // Fallback to any voice matching the base language code (e.g. 'ar' for 'ar-SA')
            bestVoice = voices.find(v => v.lang.startsWith(baseLang));
        }
        
        if (bestVoice) {
            utterance.voice = bestVoice;
        }
    }

    currentUtterance = utterance; // Keep reference to prevent garbage collection bug
    window.speechSynthesis.speak(utterance);
    return utterance;
};

export const stopSpeech = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    if (currentAudioSource) {
        try {
            currentAudioSource.stop();
        } catch (e) {
            // Ignore if already stopped
        }
        currentAudioSource = null;
    }
};

// --- Audio Utils for AI ---

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> {
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const frameCount = Math.floor(data.byteLength / (2 * numChannels));
  const buffer = ctx.createBuffer(numChannels, Math.max(1, frameCount), sampleRate);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      const offset = (i * numChannels + channel) * 2;
      if (offset + 1 < data.byteLength) {
        const int16 = dataView.getInt16(offset, true);
        channelData[i] = int16 < 0 ? int16 / 32768.0 : int16 / 32767.0;
      }
    }
  }
  return buffer;
}

export function createBlob(data: Float32Array, sampleRate: number = 16000): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${sampleRate}`,
  };
}

export function getWavHeader(dataLength: number, sampleRate: number, numChannels: number) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    function writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true); 
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    return new Uint8Array(buffer);
}

export async function processAudioForDownload(base64Audio: string, speed: number, sampleRate: number = 24000): Promise<Blob> {
    const bytes = decode(base64Audio);
    const header = getWavHeader(bytes.length, sampleRate, 1);
    const wavBytes = new Uint8Array(header.length + bytes.length);
    wavBytes.set(header, 0);
    wavBytes.set(bytes, header.length);
    return new window.Blob([wavBytes], { type: 'audio/wav' });
}

// Helper to just decode the buffer without playing, allowing the component to manage the source
export const getAudioBufferFromBase64 = async (
    base64: string,
    audioContext: AudioContext
): Promise<AudioBuffer> => {
    const raw = decode(base64);
    return await decodeAudioData(raw, audioContext, 24000, 1);
};

// Legacy simple player helper for one-off sounds
export const playAudioFromBase64 = async (
    base64: string, 
    audioContext: AudioContext, 
    onEnded?: () => void
): Promise<AudioBufferSourceNode> => {
    const buffer = await getAudioBufferFromBase64(base64, audioContext);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    if (onEnded) source.onended = onEnded;
    source.start();
    return source;
};

// --- UNIFIED SPEAK FUNCTION ---
export const speakText = async (
    text: string,
    language: Language,
    rate: number = 1,
    nativeText?: string | null,
    onEnd?: () => void,
    forceMode?: TTSMode,
    selectedVoice?: SpeechSynthesisVoice | null | string
): Promise<void> => {
    stopSpeech(); // Stop any ongoing speech
    
    const mode = forceMode || getTTSMode();
    let textToSpeak = nativeText || text;

    if (!textToSpeak || !cleanTextFromScriptLabels(textToSpeak)) {
        if (onEnd) onEnd();
        return Promise.resolve();
    }

    // "Mental Conversion" for Asian languages if nativeText is missing
    if (!nativeText && (language.code === 'ja' || language.code === 'zh')) {
        const containsCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
        if (!containsCJK) {
            try {
                const conversion = await convertTextForTTS(text, language.code);
                if (conversion && conversion.tts_text) {
                    textToSpeak = conversion.tts_text;
                    console.log(`[TTS] Converted "${text}" to native script: "${textToSpeak}" for accurate pronunciation.`);
                }
            } catch (e) {
                console.warn("Mental conversion failed, proceeding with original text", e);
            }
        }
    }

    return new Promise((resolve) => {
        const handleEnd = () => {
            if (onEnd) onEnd();
            resolve();
        };

        if (mode === 'hq') {
            getAudioContext(); // Ensure AudioContext is available
            generateSpeechFromText(textToSpeak, language.code, rate)
                .then(base64Audio => {
                    playAudioFromBase64(base64Audio, getAudioContext(), () => {
                        currentAudioSource = null;
                        handleEnd();
                    }).then(source => {
                         currentAudioSource = source;
                    });
                })
                .catch(e => {
                    console.error("HQ TTS failed, falling back to standard voice", e);
                    const errMsg = String(e?.message || e).toLowerCase();
                    if (
                        errMsg.includes("quota") || 
                        errMsg.includes("limit") || 
                        errMsg.includes("billing") || 
                        errMsg.includes("exceeded") || 
                        errMsg.includes("429") || 
                        errMsg.includes("resource_exhausted") ||
                        errMsg.includes("payment")
                    ) {
                        console.warn("Switching default TTS mode to standard due to quota or billing limits on the API key.");
                        setTTSMode('standard');
                    }
                    speak(textToSpeak, language.code, rate, 1.0, undefined, handleEnd, undefined, selectedVoice);
                });
            return;
        }
        
        // Standard Browser TTS
        speak(textToSpeak, language.code, rate, 1.0, undefined, handleEnd, undefined, selectedVoice);
    });
};

// Legacy alias forwarding to new unified system
export const speakTextBrowser = (
    text: string,
    language: Language,
    rate: number = 1,
    nativeText?: string | null,
    onEnd?: () => void,
    selectedVoice?: SpeechSynthesisVoice | null | string
) => {
    // Forward to the unified function which handles mode checking, force 'standard' mode
    speakText(text, language, rate, nativeText, onEnd, 'standard', selectedVoice);
};
