
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language } from '../types';
import { decodeAudioData, decode } from '../utils/audio';
import { LIVE_API_MODEL, TEACHER_PERSONAS } from '../constants';

const ai = new GoogleGenAI({ apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '' });

// We need simple cleaning logic here to avoid circular dependency with services/ai.ts
const cleanTextForTTS = (text: string): string => {
    if (!text) return "";
    // Remove "Speaker Name:" patterns at start of lines
    let cleaned = text.replace(/(?:^|\n)\s*[\w\u00C0-\u00FF\u0600-\u06FF\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\d ]{1,20}:\s*/g, '');
    cleaned = cleaned.replace(/[\*_]/g, ''); // Markdown
    cleaned = cleaned.replace(/\(.*?\)/g, ''); // Parentheticals
    return cleaned.trim();
};

type TTSState = 'disconnected' | 'connecting' | 'connected';

class LiveTTSManager {
    private session: any = null;
    private audioContext: AudioContext | null = null;
    private state: TTSState = 'disconnected';
    private nextStartTime: number = 0;
    private audioSources: Set<AudioBufferSourceNode> = new Set();
    private currentLanguage: string = 'en';
    private keepAliveInterval: any = null;
    
    // Flag to ignore buffered messages arriving after stop
    private isInterrupted: boolean = false;

    // Public getter to check status
    public get isConnected(): boolean {
        return this.state === 'connected';
    }

    private getVoiceForLanguage(langCode: string): string {
        switch (langCode) {
            case 'de': return 'Fenrir';
            case 'zh': return 'Fenrir';
            case 'ja': return 'Kore';
            case 'fr': return 'Kore';
            case 'ru': return 'Charon';
            case 'es': return 'Puck';
            case 'it': return 'Puck';
            default: return 'Kore';
        }
    }

    private async initAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    public async connect(language: Language) {
        if (this.state === 'connected' && this.currentLanguage === language.code) {
            return; 
        }

        if (this.state === 'connected') {
            await this.disconnect();
        }

        this.state = 'connecting';
        this.currentLanguage = language.code;
        await this.initAudioContext();

        const voiceName = this.getVoiceForLanguage(language.code);
        
        const systemInstruction = `
        You are a high-performance, low-latency Text-to-Speech (TTS) engine. 
        Your ONLY job is to read the text provided to you aloud.
        
        **STRICT PERSONA RULES (JAILBREAK PROTECTION):**
        - YOU ARE A VIRTUAL NATIVE TEACHER/SPEAKER.
        - YOU MUST NEVER ADMIT TO BEING AN AI, A LANGUAGE MODEL, OR A COMPUTER PROGRAM.
        - IF ASKED "WHO ARE YOU?", EXPLAIN YOUR AVATAR PERSONA ONLY.
        
        **RULES:**
        1. **IMMEDIATE START**: Start reading immediately. Do not say "Okay", "Sure", "Here is the text".
        2. **STRICT TEXT**: Read ONLY the text inside the quotes I send. Do not add commentary.
        3. **SPEED**: I will tell you to read "slowly" or "naturally". Follow this pacing strictly.
        4. **LANGUAGE**: Read in ${language.englishName}.
        5. **PRONUNCIATION**: If I send you Romanized text (like Pinyin or Romaji), pronounce it as the NATIVE language (Chinese/Japanese) with correct accent and intonation. 
           **MENTAL CONVERSION**: Convert the Pinyin/Romaji to Hanzi/Kanji in your mind, and read that. DO NOT spell out the English letters.
        `;

        try {
            this.session = await ai.live.connect({
                model: LIVE_API_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
                    systemInstruction: { parts: [{ text: systemInstruction }] }
                },
                callbacks: {
                    onopen: () => {
                        this.state = 'connected';
                        this.keepAliveInterval = setInterval(() => {
                            if(this.session) {
                                try {
                                    this.session.sendRealtimeInput({ text: " " }); 
                                } catch(e) { /* ignore */ }
                            }
                        }, 15000);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // CRITICAL: If stop was called, ignore any trailing buffered audio
                        if (this.isInterrupted) return;

                        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && this.audioContext) {
                            try {
                                const raw = decode(base64Audio);
                                const buffer = await decodeAudioData(raw, this.audioContext, 24000, 1);
                                this.scheduleBuffer(buffer);
                            } catch (e) {
                                console.error("TTS Decode Error", e);
                            }
                        }
                    },
                    onclose: () => {
                        this.state = 'disconnected';
                    }
                }
            });
        } catch (e) {
            console.error("Live TTS Connection Failed", e);
            this.state = 'disconnected';
            throw e; // Rethrow to allow fallback
        }
    }

    private scheduleBuffer(buffer: AudioBuffer) {
        if (!this.audioContext) return;
        if (this.isInterrupted) return; // Double check

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;
        if (this.nextStartTime < now) {
            this.nextStartTime = now;
        }

        source.start(this.nextStartTime);
        this.nextStartTime += buffer.duration;
        
        this.audioSources.add(source);
        source.onended = () => this.audioSources.delete(source);
    }

    public async speak(text: string, speed: number = 1.0) {
        if (this.state !== 'connected' || !this.session) {
            throw new Error("Live TTS not connected"); 
        }

        // Clean text before sending to avoid reading names like "Alice:"
        const cleanText = cleanTextForTTS(text);
        if (!cleanText) return;

        // IMPORTANT: Stop any previous playback immediately
        this.stop(); 
        
        // Reset the interruption flag for NEW speech
        this.isInterrupted = false;

        const speedInstruction = speed <= 0.75 ? "very slowly and clearly" : "at a natural, normal speed";
        
        // Dynamic instruction for Romanized scripts
        let langInstruction = "";
        if (this.currentLanguage === 'zh') langInstruction = " (Pronounce Pinyin as native Mandarin Hanzi)";
        if (this.currentLanguage === 'ja') langInstruction = " (Pronounce Romaji as native Japanese Kanji/Kana)";

        // Prompt engineering to ensure it reads exact text
        const prompt = `Read this ${speedInstruction}${langInstruction}: "${cleanText}"`;

        try {
            await this.session.sendRealtimeInput({ text: prompt });
        } catch(e) {
            console.error("Failed to send TTS prompt", e);
            throw e; // Allow fallback
        }
    }

    public stop() {
        // 1. Set flag to ignore incoming chunks from the stream
        this.isInterrupted = true;

        // 2. Stop all active source nodes immediately
        this.audioSources.forEach(src => {
            try { src.stop(); } catch(e){}
        });
        this.audioSources.clear();
        
        // 3. Reset time cursor to now
        if (this.audioContext) {
            this.nextStartTime = this.audioContext.currentTime;
        }
        
        // 4. Send a "Stop" interrupt to model
        if (this.session) {
             try {
                 // Do NOT assume .catch exists on this return type, wrap in try/catch
                 this.session.sendRealtimeInput({ text: "STOP" });
             } catch(e) {
                 // ignore stop errors
             }
        }
    }

    public async disconnect() {
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        this.stop();
        if (this.session) {
            try {
                await this.session.close();
            } catch(e) {
                console.warn("Session close error", e);
            }
            this.session = null;
        }
        if (this.audioContext) {
            try {
                await this.audioContext.close();
            } catch(e) {
                console.warn("AudioContext close error", e);
            }
            this.audioContext = null;
        }
        this.state = 'disconnected';
    }
}

export const liveTTS = new LiveTTSManager();
