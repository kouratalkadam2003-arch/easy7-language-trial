import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Bot,
  Languages,
  ArrowRight,
  ShieldCheck,
  Coffee,
  CloudRain,
  Compass,
  VolumeX,
  Radio,
  Lightbulb,
  Eye,
  EyeOff,
  Award,
  HelpCircle,
  Target
} from 'lucide-react';
import { Button3D } from '@/components/ui/Button3D';
import type { Lesson } from '@/data/lessons/types';
import { useUserStore } from '@/store/userStore';
import { useFarmStore } from '@/store/farmStore';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { TEXT_MODEL, LIVE_API_MODEL, ALL_LANGUAGES } from '@/constants';
import { getKeyForVoiceChat, getApiKey } from '@/utils/apiKeyPool';
import { voiceCoachVoice, buildRoleplayCoachPrompt } from '@/lib/voiceCoachPrompt';
import { generateSpeechFromText } from '../../../services/ai';
import { speakTextBrowser } from '../../../utils/audio';
import { ambientSound, type AmbientType } from '@/utils/ambientSound';
import { useLessonTrackerStore } from '@/store/lessonTrackerStore';
import { matchSpeech } from '@/utils/smartMatcher';

interface Props {
  lesson: Lesson;
  analyticsFromReading?: {
    mastered: string[];
    needsReview: string[];
    accuracyScore: number;
  };
  onComplete: () => void;
}

interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'bot';
  character?: string;
  text: string;
  translation?: string;
  isFinal: boolean;
}

// Downsample audio buffer to 16kHz for Gemini Live API
function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number = 16000): Float32Array {
  if (inputSampleRate === outputSampleRate) return buffer;
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// Synchronous 16-bit PCM (24kHz Mono) decoder for instant playback without gaps
function decodePcm24k(base64: string, ctx: AudioContext): AudioBuffer {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768.0;
  const buf = ctx.createBuffer(1, f32.length, 24000);
  buf.getChannelData(0).set(f32);
  return buf;
}

// Encode Float32 audio to 16-bit Little-Endian PCM Base64
function float32ToPcmBase64(data: Float32Array): string {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function RealRoleplayStage({ lesson, onComplete }: Props) {
  const { uiLang, userName } = useUserStore();
  const isAr = uiLang === 'ar';
  const { addResources } = useFarmStore();

  // Extract characters from dialogue
  const dialogueLines = lesson.dialogue || [];
  const uniqueCharacters = Array.from(new Set(dialogueLines.map(d => d.character).filter(Boolean)));
  const charA = uniqueCharacters[0] || 'المتحدث الأول';
  const charB = uniqueCharacters[1] || (uniqueCharacters.length > 1 ? uniqueCharacters[1] : 'المتحدث الثاني');

  // Roleplay configuration states
  const [selectedRole, setSelectedRole] = useState<string>(charA);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>(charA);
  const [aiRole, setAiRole] = useState<string>(charB);
  const [round, setRound] = useState<1 | 2>(1);
  const [showOriginalScript, setShowOriginalScript] = useState<boolean>(false);

  // Real-Life Simulation Mission HUD & Whisper Lifeline States
  const [currentObjectiveIdx, setCurrentObjectiveIdx] = useState<number>(0);
  const [completedObjectives, setCompletedObjectives] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [whisperAlert, setWhisperAlert] = useState<{ phrase: string; translation: string; pronunciation: string } | null>(null);

  // User dialogue lines & current active objective
  const userDialogueLines = dialogueLines.filter(d => d.character === userRole);
  const currentGoal = userDialogueLines[currentObjectiveIdx] || userDialogueLines[0];
  const currentGoalRef = useRef(currentGoal);
  useEffect(() => {
    currentGoalRef.current = currentGoal;
  }, [currentGoal]);

  // Ambient Sound States
  const [ambientType, setAmbientType] = useState<AmbientType>('cafe');
  const [ambientMuted, setAmbientMuted] = useState<boolean>(false);

  // Gemini Live Connection States
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'ended'>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [micOn, setMicOn] = useState<boolean>(true);
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);

  // Live session and audio refs
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micOnRef = useRef<boolean>(true);
  const statusRef = useRef<'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'ended'>('idle');
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const currentEntryIdRef = useRef<string>('');
  const callCompletedRef = useRef<boolean>(false);
  const finishRoleplayRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Clean up all audio contexts, media streams, and WebSocket sessions
  const cleanup = useCallback(() => {
    console.log('[Roleplay Live AI] Cleaning up session resources...');
    ambientSound.stopPhoneRinging();
    ambientSound.stopAmbient();

    try { sessionRef.current?.close(); } catch (e) {}
    sessionRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    try { scriptProcessorRef.current?.disconnect(); } catch (e) {}
    try { mediaStreamSourceRef.current?.disconnect(); } catch (e) {}
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;

    try { inputAudioContextRef.current?.close(); } catch (e) {}
    inputAudioContextRef.current = null;
    try { outputAudioContextRef.current?.close(); } catch (e) {}
    outputAudioContextRef.current = null;

    for (const src of audioSourcesRef.current.values()) {
      try { src.stop(); } catch (e) {}
    }
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setUserAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Play audio chunk from Gemini Live
  const playAudioChunk = useCallback((base64: string) => {
    const ctx = outputAudioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const audioBuffer = decodePcm24k(base64, ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      audioSourcesRef.current.add(source);

      setStatus('speaking');
      statusRef.current = 'speaking';

      const now = ctx.currentTime;
      // 100ms jitter buffer on speech burst to avoid packet jitter
      const startAt = (nextStartTimeRef.current < now) ? (now + 0.10) : nextStartTimeRef.current;
      source.start(startAt);
      nextStartTimeRef.current = startAt + audioBuffer.duration;

      source.addEventListener('ended', () => {
        audioSourcesRef.current.delete(source);
        if (audioSourcesRef.current.size === 0) {
          if (callCompletedRef.current) {
            console.log('[Roleplay Live AI] Conversation completed by AI. Automatically terminating call.');
            finishRoleplayRef.current?.();
          } else {
            setStatus('listening');
            statusRef.current = 'listening';
          }
        }
      });
    } catch (err) {
      console.error('[Roleplay Live AI] Audio decode error:', err);
    }
  }, []);

  // Async translation for transcripts
  const translateSpeechAsync = async (text: string, entryId: string) => {
    if (!text || text.trim().length === 0) return;
    try {
      const apiKey = getApiKey();
      if (!apiKey) return;
      const genAI = new GoogleGenAI({ apiKey });
      const res = await genAI.models.generateContent({
        model: TEXT_MODEL,
        contents: `Translate this spoken sentence into natural, clear Arabic. Output ONLY the Arabic translation without notes:\n"${text}"`
      });
      const arabic = res.text?.trim();
      if (arabic) {
        setTranscript(prev => prev.map(m => m.id === entryId ? { ...m, translation: arabic } : m));
      }
    } catch (e) {
      console.warn('[Roleplay Live AI] Translation error:', e);
    }
  };

  // Replay phrase via TTS
  const replayPhrase = async (text: string, entryId: string) => {
    if (playingMsgId) return;
    setPlayingMsgId(entryId);
    const voice = voiceGender === 'male' ? 'Puck' : 'Aoede';
    try {
      if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }
      const cleanText = text.replace(/^(ليث|إيلي|أنت|[\w\s]+):\s*/, '');
      const base64 = await generateSpeechFromText(cleanText, lesson.lang, 1.0, voice);
      playAudioChunk(base64);
    } catch (e) {
      speakTextBrowser(text, { code: lesson.lang, englishName: lesson.lang, nativeName: lesson.lang }, 1.0, voiceGender);
    } finally {
      setTimeout(() => setPlayingMsgId(null), 1000);
    }
  };

  // Setup live session with Gemini Live API
  const setupLiveRoleplaySession = useCallback(async (newUserRole?: string, newRound?: 1 | 2) => {
    cleanup();
    setStatus('connecting');
    statusRef.current = 'connecting';
    setErrorMsg('');
    ambientSound.startPhoneRinging();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('المتصفح لا يدعم الوصول إلى الميكروفون.');
      }

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          channelCount: 1, 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        }
      });
      mediaStreamRef.current = stream;

      // 2. Setup Audio Contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      try {
        inputAudioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      } catch {
        inputAudioContextRef.current = new AudioCtx();
      }

      try {
        outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      } catch {
        outputAudioContextRef.current = new AudioCtx();
      }

      if (inputAudioContextRef.current.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      // 3. Resolve Target Language details
      const matchedLang = ALL_LANGUAGES.find(l => l.code === lesson.lang);
      const targetLangName = matchedLang?.englishName || lesson.lang || 'English';

      const effectiveUserRole = newUserRole || userRole;
      const effectiveAiRole = effectiveUserRole === charA ? charB : charA;
      const effectiveRound = newRound || round;

      // 4. Build Roleplay Specialized System Instruction
      const systemInstruction = buildRoleplayCoachPrompt({
        voiceGender,
        language: targetLangName,
        nativeLanguage: 'العربية',
        userName: userName || 'صديقي',
        userRole: effectiveUserRole,
        aiRole: effectiveAiRole,
        dialogue: dialogueLines,
        level: lesson.cefr || 'A1',
        round: effectiveRound
      });

      // 5. Connect to Gemini Live API
      const apiKey = getKeyForVoiceChat();
      if (!apiKey) {
        throw new Error('مفتاح Gemini API غير متوفر حالياً.');
      }

      const liveClient = new GoogleGenAI({ apiKey });

      const handleEvent = (msg: any) => {
        switch (msg.type) {
          case 'voice-connected':
            console.log('[Roleplay Live AI] Connected successfully.');
            ambientSound.playPickupSound();
            if (!ambientMuted && ambientType !== 'none') {
              ambientSound.setAmbient(ambientType, 0.035);
            }
            setStatus('listening');
            statusRef.current = 'listening';
            startMicStreaming();
            break;
          case 'interrupted':
            if (statusRef.current === 'listening') {
              console.log('[Roleplay Live AI] Speech interrupted by user');
              for (const src of audioSourcesRef.current.values()) {
                try { src.stop(); } catch (e) {}
              }
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            break;
          case 'audio':
            if (msg.audioBase64) {
              playAudioChunk(msg.audioBase64);
            }
            break;
          case 'transcript': {
            let chunk: string = msg.text || '';
            if (!chunk) break;

            // Detect AI conclusion token or closing phrases
            if (chunk.includes('[CALL_COMPLETED]') || /خلاص\s*انتهينا|انتهينا\s*من\s*محادثة\s*الموقف|نلتقي\s*في\s*راديو\s*القرية/i.test(chunk)) {
              callCompletedRef.current = true;
              chunk = chunk.replace(/\[CALL_COMPLETED\]/g, '').trim();
            }
            if (!chunk) break;

            setTranscript(prev => {
              const newTr = [...prev];
              const last = newTr[newTr.length - 1];
              if (last && last.speaker === 'bot' && !last.isFinal) {
                last.text += ' ' + chunk;
              } else {
                const newId = `${Date.now()}-${Math.random()}`;
                currentEntryIdRef.current = newId;
                newTr.push({ 
                  id: newId, 
                  speaker: 'bot', 
                  character: effectiveAiRole,
                  text: chunk, 
                  isFinal: false 
                });
              }
              return newTr;
            });
            break;
          }
          case 'user-transcript': {
            const chunk: string = msg.text || '';
            if (!chunk) break;

            // Silently match user speech with current goal in background
            const activeGoal = currentGoalRef.current;
            if (activeGoal) {
              const res = matchSpeech(chunk, activeGoal.native, 0.65);
              if (res.isMatch) {
                useLessonTrackerStore.getState().recordRoleplay(activeGoal.native, false, true);
              }
            }

            setTranscript(prev => {
              const newTr = [...prev];
              const last = newTr[newTr.length - 1];
              if (last && last.speaker === 'user' && !last.isFinal) {
                last.text += ' ' + chunk;
              } else {
                newTr.push({ 
                  id: `u-${Date.now()}-${Math.random()}`, 
                  speaker: 'user', 
                  character: effectiveUserRole,
                  text: chunk, 
                  isFinal: false 
                });
              }
              return newTr;
            });
            break;
          }
          case 'turnComplete':
            setTranscript(prev => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'bot' && last.text && currentEntryIdRef.current) {
                translateSpeechAsync(last.text, currentEntryIdRef.current);
              }
              return prev.map(t => ({ ...t, isFinal: true }));
            });
            if (audioSourcesRef.current.size === 0) {
              setStatus('listening');
              statusRef.current = 'listening';
            }
            break;
          case 'error':
            console.error('[Roleplay Live AI] Live error:', msg.message);
            setStatus('error');
            statusRef.current = 'error';
            setErrorMsg(msg.message || 'حدث خطأ في الاتصال بالذكاء الاصطناعي.');
            break;
        }
      };

      const session = await liveClient.live.connect({
        model: LIVE_API_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceCoachVoice(voiceGender) } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction
        },
        callbacks: {
          onmessage: (sm: LiveServerMessage) => {
            if (sm.serverContent?.interrupted) {
              handleEvent({ type: 'interrupted' });
            }

            for (const part of sm.serverContent?.modelTurn?.parts || []) {
              if (part.inlineData?.data) {
                handleEvent({ type: 'audio', audioBase64: part.inlineData.data });
              }
            }

            const textChunk = (sm.serverContent as any)?.outputTranscription?.text
              || sm.serverContent?.modelTurn?.parts?.find((p: any) => p.text && !p.thought)?.text;
            if (textChunk && !textChunk.startsWith('**Initiating') && !textChunk.startsWith('**Crafting')) {
              handleEvent({ type: 'transcript', text: textChunk });
            }

            const userTxt = sm.serverContent?.interrupted
              ? null
              : (sm.serverContent as any)?.inputAudioTranscription?.text;
            if (userTxt) {
              handleEvent({ type: 'user-transcript', text: userTxt });
            }

            if (sm.serverContent?.turnComplete) {
              handleEvent({ type: 'turnComplete' });
            }
          },
          onerror: (err: any) => {
            console.error('[Roleplay Live AI] Session error:', err);
            handleEvent({ type: 'error', message: err?.message });
          },
          onclose: () => {
            console.log('[Roleplay Live AI] Session closed');
            setStatus(prev => (prev === 'error' ? prev : 'ended'));
            statusRef.current = 'ended';
          }
        }
      });

      sessionRef.current = session;
      handleEvent({ type: 'voice-connected' });

      // Trigger initial welcoming turn from the AI
      session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ 
            text: `We are ready to start Round ${effectiveRound}! You play "${effectiveAiRole}" and I play "${effectiveUserRole}". Please deliver your opening line or invite me in Arabic to start!` 
          }]
        }],
        turnComplete: true
      });

    } catch (err: any) {
      console.error('[Roleplay Live AI] Connection setup failed:', err);
      cleanup();
      setErrorMsg(err?.message || 'تعذر الاتصال بالذكاء الاصطناعي المباشر.');
      setStatus('error');
      statusRef.current = 'error';
    }

    async function startMicStreaming() {
      if (!inputAudioContextRef.current || !mediaStreamRef.current || scriptProcessorRef.current) return;

      if (inputAudioContextRef.current.state === 'suspended') {
        try { await inputAudioContextRef.current.resume(); } catch (e) {}
      }

      try {
        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

        scriptProcessorRef.current.onaudioprocess = (evt) => {
          if (!micOnRef.current) return;

          // Mute sending during bot speech to prevent acoustic feedback
          if (statusRef.current === 'speaking' || audioSourcesRef.current.size > 0) {
            setUserAudioLevel(0);
            return;
          }

          const inputData = evt.inputBuffer.getChannelData(0);

          // Volume level for live wave
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          setUserAudioLevel(Math.min(1, rms * 5));

          const actualSampleRate = inputAudioContextRef.current?.sampleRate || 16000;
          const downsampled = actualSampleRate === 16000 ? inputData : downsampleBuffer(inputData, actualSampleRate, 16000);
          const pcmBase64 = float32ToPcmBase64(downsampled);

          if (sessionRef.current && pcmBase64) {
            try {
              sessionRef.current.sendRealtimeInput({
                audio: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' }
              });
            } catch (e) {}
          }
        };

        const muteGain = inputAudioContextRef.current.createGain();
        muteGain.gain.value = 0;
        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
        scriptProcessorRef.current.connect(muteGain);
        muteGain.connect(inputAudioContextRef.current.destination);
        console.log('[Roleplay Live AI] Microphone audio streaming active');
      } catch (err) {
        console.error('[Roleplay Live AI] Failed to start mic streaming:', err);
      }
    }
  }, [cleanup, userRole, charA, charB, round, voiceGender, lesson.lang, lesson.cefr, userName, dialogueLines, playAudioChunk, ambientMuted, ambientType]);

  // Ambient Environment Switcher
  const handleAmbientChange = (type: AmbientType) => {
    setAmbientType(type);
    if (type === 'none') {
      setAmbientMuted(true);
      ambientSound.stopAmbient();
    } else {
      setAmbientMuted(false);
      if (statusRef.current === 'listening' || statusRef.current === 'speaking') {
        ambientSound.setAmbient(type, 0.035);
      }
    }
  };

  // 💡 Whisper Lifeline: Dispatched to Gemini Live + shown as gentle temporary toast
  const handleWhisperLifeline = () => {
    setHintsUsed(prev => prev + 1);
    if (currentGoal) {
      // Record lifeline used in lessonTrackerStore
      useLessonTrackerStore.getState().recordRoleplay(currentGoal.native, true, false);
      setWhisperAlert({
        phrase: currentGoal.native,
        translation: currentGoal.translation,
        pronunciation: currentGoal.pronunciation
      });
      setTimeout(() => setWhisperAlert(null), 8000);
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.sendClientContent({
          turns: [{
            role: 'user',
            parts: [{
              text: `[STUDENT_CLICKED_LIFELINE]: The student pressed "لا أعرف ماذا أقول". Pause character role for one brief warm sentence and whisper in Arabic as coach (${voiceGender === 'male' ? 'Laith' : 'Eli'}): "لا تقلق يا صديقي! قل فقط: ${currentGoal?.native || ''} (${currentGoal?.translation || ''})... خذ وقتك وجرب الآن!". Then wait warmly for them to speak!`
            }]
          }],
          turnComplete: true
        });
      } catch (e) {
        console.warn('Lifeline send error:', e);
      }
    }
  };

  // Advance objective manually or automatically
  const handleAdvanceObjective = () => {
    if (currentGoal) {
      useLessonTrackerStore.getState().recordRoleplay(currentGoal.native, false, true);
    }
    setCompletedObjectives(prev => {
      if (!prev.includes(currentObjectiveIdx)) {
        return [...prev, currentObjectiveIdx];
      }
      return prev;
    });
    if (currentObjectiveIdx < userDialogueLines.length - 1) {
      setCurrentObjectiveIdx(prev => prev + 1);
      setShowCheatSheet(false);
    }
  };

  // Handle starting the roleplay from the selection screen
  const handleStartCall = (chosenRole: string) => {
    const aiChar = chosenRole === charA ? charB : charA;
    setUserRole(chosenRole);
    setAiRole(aiChar);
    setIsStarted(true);
    setRound(1);
    setCurrentObjectiveIdx(0);
    setCompletedObjectives([]);
    setHintsUsed(0);
    setShowCheatSheet(false);
    setWhisperAlert(null);
    setupLiveRoleplaySession(chosenRole, 1);
  };

  // Flip Roles (Role Reversal)
  const handleFlipRoles = () => {
    ambientSound.playPickupSound();
    const newRound = round === 1 ? 2 : 1;
    const newUserRole = aiRole;
    const newAiRole = userRole;
    setUserRole(newUserRole);
    setAiRole(newAiRole);
    setRound(newRound);
    setCurrentObjectiveIdx(0);
    setCompletedObjectives([]);
    setShowCheatSheet(false);
    setWhisperAlert(null);

    if (sessionRef.current) {
      // In-session seamless role swap announcement to Gemini Live
      sessionRef.current.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{
            text: `ROLE REVERSAL TIME! We are now starting Round 2. Roles are now FLIPPED: I am now playing "${newUserRole}", and you (${voiceGender === 'male' ? 'Laith' : 'Eli'}) are now playing "${newAiRole}". Please enthusiastically announce the role reversal in Arabic to the learner, then start the dialogue rehearsal again from Line 1!`
          }]
        }],
        turnComplete: true
      });
    } else {
      setupLiveRoleplaySession(newUserRole, newRound);
    }
  };

  // End Call & Complete
  const handleFinishRoleplay = () => {
    ambientSound.playHangupSound();
    cleanup();
    addResources(50, 20, 0);

    // Confirm all completed objectives in tracker
    userDialogueLines.forEach((line, idx) => {
      if (completedObjectives.includes(idx) || idx <= currentObjectiveIdx) {
        useLessonTrackerStore.getState().recordRoleplay(line.native, false, true);
      }
    });

    setIsCompleteModalOpen(true);
  };
  finishRoleplayRef.current = handleFinishRoleplay;

  // Status label text
  const statusText = (() => {
    if (status === 'error') return errorMsg || 'حدث خطأ في الاتصال';
    if (status === 'connecting') return 'جاري الاتصال بالذكاء الاصطناعي المباشر...';
    if (status === 'listening') return `الذكاء الاصطناعي (${aiRole}) يستمع إليك... تحدث الآن`;
    if (status === 'speaking') return `الذكاء الاصطناعي (${aiRole}) يتحدث إليك...`;
    if (status === 'ended') return 'انتهت المحادثة الصوتية';
    return '';
  })();

  // ─────────────────────────────────────────────────────────────
  // 1. Role Selection Screen (Before starting call)
  // ─────────────────────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 backdrop-blur-2xl border-2 border-pink-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-black border border-pink-500/30">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>محاكاة محادثة واقعية حقيقية (Gemini Live)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              اختر دورك في الموقف 🎭
            </h2>
            <p className="text-sm text-slate-300 font-bold leading-relaxed">
              مكالمة واقعية حية مع متحدث أصلي! تحدث بعفوية بأسلوبك وسيتفاعل معك إنسانياً ويسألك عن التفاصيل، ثم تتبادلان الأدوار معاً!
            </p>
          </div>

          {/* Real Scenario Context Brief */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-right space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
              <Compass className="w-4 h-4" />
              <span>📍 الموقف: {lesson.title || 'محادثة الموقف الحقيقي'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-bold">
              تحدث بحرية وبصوتك الطبيعي. لا داعي للتلاوة الحرفية؛ عبر بمفهومك والذكاء الاصطناعي سيفهم قصدك ويكمل معك الحوار.
            </p>
          </div>

          {/* Character selection buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
            <button
              onClick={() => setSelectedRole(charA)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 cursor-pointer ${
                selectedRole === charA 
                  ? 'bg-blue-600/30 border-blue-500 shadow-lg shadow-blue-500/20 text-white scale-[1.02]' 
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400">الشخصية الأولى</span>
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-lg font-black text-white">{charA}</span>
              <span className="text-xs text-slate-400 font-bold">
                {dialogueLines.filter(d => d.character === charA).length} أهداف حوارية
              </span>
            </button>

            <button
              onClick={() => setSelectedRole(charB)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 cursor-pointer ${
                selectedRole === charB 
                  ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20 text-white scale-[1.02]' 
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-400">الشخصية الثانية</span>
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-lg font-black text-white">{charB}</span>
              <span className="text-xs text-slate-400 font-bold">
                {dialogueLines.filter(d => d.character === charB).length} أهداف حوارية
              </span>
            </button>
          </div>

          {/* Ambient Environment Selector */}
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-pink-400" />
              <span>الأجواء الصوتية المحيطة:</span>
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleAmbientChange('cafe')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${ambientType === 'cafe' && !ambientMuted ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900/60'}`}
                title="أجواء كافيه هادئ"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>كافيه</span>
              </button>
              <button
                onClick={() => handleAmbientChange('rain')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${ambientType === 'rain' && !ambientMuted ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900/60'}`}
                title="صوت مطر ناعم"
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>مطر</span>
              </button>
              <button
                onClick={() => handleAmbientChange('street')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${ambientType === 'street' && !ambientMuted ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900/60'}`}
                title="شوارع المدينة"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>مدينة</span>
              </button>
              <button
                onClick={() => handleAmbientChange('none')}
                className={`px-2 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${ambientMuted || ambientType === 'none' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white bg-slate-900/60'}`}
                title="صامت"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Voice Coach Selection */}
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">صوت مدرب الذكاء الاصطناعي:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setVoiceGender('male')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${voiceGender === 'male' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                ليث (Puck)
              </button>
              <button
                onClick={() => setVoiceGender('female')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${voiceGender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                إيلي (Kore)
              </button>
            </div>
          </div>

          {/* Start Call Action */}
          <Button3D
            variant="primary"
            size="lg"
            onClick={() => handleStartCall(selectedRole)}
            className="w-full !bg-emerald-600 hover:!bg-emerald-700 !border-b-4 !border-emerald-800 !text-white text-base font-black py-4 !rounded-2xl cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2">
              <Phone className="w-5 h-5 fill-current" />
              <span>بدء المحادثة الصوتية الحية 🎙️</span>
            </div>
          </Button3D>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Active Call Screen (Gemini Live with Roleplay & Teleprompter)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl select-none" dir="rtl">
      
      {/* Top Header: Role Status Bar + Flip Button + Finish Button */}
      <div className="px-3 sm:px-6 py-2.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 z-20">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${round === 1 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
            {round === 1 ? 'الجولة 1/2' : 'الجولة 2/2 (عكس الأدوار)'}
          </span>
          <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <span className="text-emerald-400 font-black">أنت: {userRole}</span>
            <span className="text-slate-500">|</span>
            <span className="text-blue-400 font-black">المعلم: {aiRole}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFlipRoles}
            className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-purple-300 font-black text-xs border border-purple-500/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="قلب الأدوار فوراً"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>اقلب الأدوار 🔄</span>
          </button>

          <button
            onClick={handleFinishRoleplay}
            className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <span>إتمام 🏆</span>
          </button>
        </div>
      </div>

      {/* Main Call Body */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-between p-3 sm:p-5 gap-3 min-h-0 overflow-y-auto">
        
        {/* Left/Top Section: Video Avatar & Call Controls */}
        <div className="flex flex-col items-center justify-center w-full md:w-5/12 flex-shrink-0">
          
          {/* Video Avatar */}
          <div
            className="relative flex items-center justify-center w-full max-w-[190px] xs:max-w-[210px] sm:max-w-[230px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl cursor-pointer ring-4 ring-pink-500/30 transition-all duration-300 bg-slate-900"
            onClick={() => {
              if (status === 'idle' || status === 'error' || status === 'ended') {
                setupLiveRoleplaySession();
              }
            }}
          >
            {/* Idle Base Layer */}
            <video
              src={voiceGender === 'male' ? '/male_teacher_idle.mp4' : '/female_teacher_idle.mp4'}
              className="absolute inset-0 w-full h-full object-cover z-0"
              loop muted playsInline autoPlay
            />
            {/* Speaking Layer with smooth fade */}
            <video
              src={voiceGender === 'male' ? '/male_teacher.mp4' : '/female_teacher.mp4'}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${status === 'speaking' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              loop muted playsInline autoPlay preload="auto"
            />

            {(status === 'idle' || status === 'ended') && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 cursor-pointer text-center z-20">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-2 shadow-xl animate-pulse">
                  <Phone className="w-7 h-7 fill-current ml-0.5" />
                </div>
                <span className="font-black text-sm mb-0.5">انقر لبدء المكالمة</span>
                <span className="text-[11px] text-white/80 font-bold">مع الذكاء الاصطناعي الحي</span>
              </div>
            )}

            {status === 'connecting' && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 text-center z-20">
                <div className="w-9 h-9 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="font-black text-xs">جاري الاتصال بالمعلم...</span>
              </div>
            )}
          </div>

          {/* Status Badge & Voice Wave */}
          <div className="mt-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-black text-center flex items-center gap-2 shadow-md border border-white/10">
            {status === 'speaking' && <Volume2 className="w-3.5 h-3.5 text-pink-400 animate-pulse" />}
            {status === 'listening' && (
              <div className="flex items-center gap-1.5">
                <Mic className={`w-3.5 h-3.5 ${userAudioLevel > 0.1 ? 'text-green-400 scale-110' : 'text-emerald-400'} transition-all`} />
                {userAudioLevel > 0.05 && (
                  <span className="flex gap-0.5 items-center">
                    <span className="w-1 h-2 bg-green-400 rounded-full animate-ping" />
                    <span className="w-1 h-3 bg-emerald-300 rounded-full animate-pulse" />
                  </span>
                )}
              </div>
            )}
            {status === 'connecting' && <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            <span className="text-[11px] sm:text-xs">{statusText}</span>
          </div>

          {/* Floating Call Action Controls */}
          <div className="flex gap-4 mt-3 p-2 bg-white/10 backdrop-blur-md rounded-full shadow-2xl items-center justify-center border border-white/10">
            <button
              onClick={() => { if (status === 'idle' || status === 'error' || status === 'ended') setupLiveRoleplaySession(); }}
              disabled={status === 'connecting' || status === 'listening' || status === 'speaking'}
              className="w-10 h-10 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
              title="بدء الاتصال">
              <Phone className="w-5 h-5 fill-current ml-0.5" />
            </button>

            <button
              onClick={() => setMicOn(!micOn)}
              disabled={status !== 'listening' && status !== 'speaking'}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${micOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              title={micOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}>
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={cleanup}
              disabled={status === 'idle' || status === 'ended' || status === 'error'}
              className="w-10 h-10 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
              title="إنهاء المكالمة">
              <PhoneOff className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Floating In-Call Ambient Sound Selector */}
          <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-xs">
            <span className="text-[10px] text-slate-400 font-bold ml-1 flex items-center gap-1">
              <Radio className="w-3 h-3 text-pink-400" />
              <span>الجو الصوتي:</span>
            </span>
            <button
              onClick={() => handleAmbientChange('cafe')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${ambientType === 'cafe' && !ambientMuted ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="أجواء كافيه هادئ"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAmbientChange('rain')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${ambientType === 'rain' && !ambientMuted ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="صوت مطر ناعم"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAmbientChange('street')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${ambientType === 'street' && !ambientMuted ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="شوارع المدينة"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAmbientChange('none')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${ambientMuted || ambientType === 'none' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
              title="كتم الصوت المحيط"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right/Bottom Section: Real-Life Simulation Mission HUD & Whisper Lifeline */}
        <div className="flex-1 w-full flex flex-col gap-3 min-h-0 h-full max-h-[460px] md:max-h-full">
          
          {/* Main Mission Card */}
          <div className="flex-1 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col min-h-0 shadow-2xl overflow-hidden relative">
            
            {/* Top HUD: Real Scenario + Progress */}
            <div className="bg-slate-950/80 p-2.5 sm:p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-white block">
                    📍 {lesson.title || 'محاكاة الموقف الواقعي'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    تحدث من عقلك وذاكرتك بدون قراءة ورقة، والمعلم سيفهمك 💬
                  </span>
                </div>
              </div>

              {/* Progress Count */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-black text-emerald-300">
                  {completedObjectives.length} / {userDialogueLines.length}
                </span>
              </div>
            </div>

            {/* Active Current Objective Card (Glowing Hero Card) */}
            <div className="bg-gradient-to-br from-slate-950/90 to-emerald-950/20 border-2 border-emerald-500/40 rounded-2xl p-3 sm:p-4 shadow-lg mb-3 flex-shrink-0 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>مهمتك الصوتية الحالية (المعنى المستهدف)</span>
                </span>

                {/* Optional peek toggle */}
                <button
                  onClick={() => setShowCheatSheet(!showCheatSheet)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1 cursor-pointer bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800"
                >
                  {showCheatSheet ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showCheatSheet ? 'إخفاء العبارة' : 'كشف العبارة المقترحة'}</span>
                </button>
              </div>

              {/* The Goal in Arabic (No foreign text by default!) */}
              <h3 className="text-sm sm:text-base font-black text-white leading-relaxed mt-1">
                "{currentGoal?.translation || 'تواصل في الموقف بأسلوبك'}"
              </h3>
              
              <p className="text-[11px] text-slate-300 font-bold mt-1">
                🎙️ تحدث الآن بصوتك في الميكروفون وعبر عن هذا المعنى بأسلوبك وكلماتك!
              </p>

              {/* Peek sheet if user requested it */}
              {showCheatSheet && currentGoal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2.5 p-2 bg-slate-900/90 rounded-xl border border-blue-500/30 text-left"
                  dir="ltr"
                >
                  <div className="text-xs sm:text-sm font-black text-blue-300 flex items-center justify-between">
                    <span>{currentGoal.native}</span>
                    <button
                      onClick={() => replayPhrase(currentGoal.native, 'hint')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  {currentGoal.pronunciation && (
                    <div className="text-[11px] font-bold text-slate-400 mt-0.5" dir="rtl">
                      النطق: {currentGoal.pronunciation}
                    </div>
                  )}
                </motion.div>
              )}

              {/* The Lifeline Action Buttons Row */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                {/* 💡 Floating Whisper Lifeline Button */}
                <button
                  onClick={handleWhisperLifeline}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>💡 لا أعرف ماذا أقول؟ (اطلب همسة المعلم)</span>
                </button>

                {/* Advance Objective Button */}
                <button
                  onClick={handleAdvanceObjective}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
                  title="الانتقال للمهمة التالية"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>أنجزتها ✅</span>
                </button>
              </div>
            </div>

            {/* Whisper Alert Toast */}
            <AnimatePresence>
              {whisperAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-2 p-2.5 bg-amber-950/90 border border-amber-500/60 rounded-xl text-right flex items-start gap-2 shadow-xl"
                >
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs font-black text-amber-300 block">
                      همسة المعلم: "لا تقلق يا صديقي! قل فقط:"
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white block mt-0.5" dir="ltr">
                      "{whisperAlert.phrase}"
                    </span>
                    {whisperAlert.pronunciation && (
                      <span className="text-[11px] text-slate-300 font-bold block mt-0.5">
                        النطق: {whisperAlert.pronunciation}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => replayPhrase(whisperAlert.phrase, 'whisper')}
                    className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* All Mission Steps Checklist */}
            <div className="text-[11px] font-black text-slate-400 mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-500" />
              <span>خريطة مهام الموقف الكاملة:</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {userDialogueLines.map((line, idx) => {
                const isCompleted = completedObjectives.includes(idx);
                const isCurrent = idx === currentObjectiveIdx;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentObjectiveIdx(idx);
                      setShowCheatSheet(false);
                    }}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 text-right cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow'
                        : isCompleted
                        ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                        : 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </span>
                      <span className={`text-xs font-bold ${isCurrent ? 'text-white font-black' : isCompleted ? 'line-through text-slate-400' : 'text-slate-300'}`}>
                        {line.translation}
                      </span>
                    </div>

                    <span className="text-[10px] font-black text-slate-500">
                      {isCompleted ? 'أُنجزت ✅' : isCurrent ? 'جارية 🎯' : 'قادمة ⏳'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Transcript Stream */}
          {transcript.length > 0 && (
            <div className="h-24 sm:h-28 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 overflow-y-auto shadow-inner flex-shrink-0">
              <div className="text-[10px] font-black text-slate-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>مجرى الحديث الصوتي المباشر:</span>
              </div>
              <div className="space-y-1">
                {transcript.slice(-3).map((entry) => (
                  <div key={entry.id} className="text-xs border-b border-slate-800/60 pb-1 last:border-0">
                    <span className={`font-black ml-1 ${entry.speaker === 'bot' ? 'text-blue-300' : 'text-emerald-300'}`}>
                      {entry.speaker === 'bot' ? `${aiRole}: ` : 'أنت: '}
                    </span>
                    <span className="text-slate-200 font-medium">{entry.text}</span>
                    {entry.translation && (
                      <div className="text-[10px] text-amber-300 font-bold">
                        {entry.translation}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 🎉 Celebratory Stage Completion Modal */}
      <AnimatePresence>
        {isCompleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl space-y-4 text-white"
            >
              <div className="text-5xl animate-bounce">
                {hintsUsed === 0 ? '👑' : '🏆'}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {hintsUsed === 0 ? '🌟 وسام الطلاقة الذهبية (بدون أي مساعدة!)' : '👏 إنجاز محاكاة الموقف الواقعي'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {hintsUsed === 0 ? 'تحدثت بطلاقة من ذاكرتك وعقلك! 🎉' : 'أداء رائع وتواصل إنساني حقيقي! 👏'}
                </h2>
                <p className="text-xs font-bold text-slate-300">
                  {hintsUsed === 0 
                    ? 'لم تقرأ أي ورقة ولم تستخدم أي تلميح، خضت الموقف الواقعي كمتحدث أصلي معتمد!'
                    : `أتممت الحوار ومهام الموقف الواقعي بنجاح تام، واستفدت من (${hintsUsed}) همسات دعم.`}
                </p>
              </div>

              {/* Fluency Metrics */}
              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">مهام الموقف المنجزة:</span>
                  <span className="text-base font-black text-emerald-400">
                    {Math.max(completedObjectives.length, userDialogueLines.length)} / {userDialogueLines.length} ✅
                  </span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">المساعدات المطلوبة:</span>
                  <span className="text-base font-black text-amber-400">
                    {hintsUsed === 0 ? '0 (طلاقة تامة 🌟)' : `${hintsUsed} همسات`}
                  </span>
                </div>
              </div>

              {/* Rewards */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-emerald-500/20 flex justify-around items-center">
                <div className="text-center">
                  <div className="text-xl font-black text-amber-400">+50</div>
                  <div className="text-[10px] font-bold text-slate-400">ذهب 🪙</div>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-400">+20</div>
                  <div className="text-[10px] font-bold text-slate-400">بذور 🌾</div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsCompleteModalOpen(false);
                    handleFlipRoles();
                  }}
                  className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-black text-xs border border-purple-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة بقلب الدور 🔄</span>
                </button>

                <Button3D
                  variant="primary"
                  size="lg"
                  onClick={onComplete}
                  className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !border-b-4 !border-emerald-800 !text-white text-xs font-black py-3 !rounded-2xl cursor-pointer"
                >
                  إتمام الدرس ➔
                </Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
