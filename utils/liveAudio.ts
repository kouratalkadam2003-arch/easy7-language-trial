// أدوات صوت خام (PCM16) للتواصل مع Gemini Live API.

export function b64encode(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...(bytes.subarray(i, i + chunk) as unknown as number[]));
  }
  return btoa(bin);
}

export function b64decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function floatTo16BitPCM(input: Float32Array): Uint8Array {
  const out = new Uint8Array(input.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return out;
}

export class MicRecorder {
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private inputRate = 16000;
  private readonly targetRate = 16000;

  async start(onChunk: (pcm16: Uint8Array) => void) {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error("المتصفح لا يدعم الوصول إلى المايكروفون (يتطلّب اتصال HTTPS).");
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
    } catch (e) {
      const name = (e as { name?: string })?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        throw new Error("تم رفض إذن المايكروفون. فعّله من إعدادات المتصفح ثم أعد المحاولة.");
      }
      if (name === "NotFoundError" || name === "OverconstrainedError") {
        throw new Error("لم يتم العثور على مايكروفون متاح.");
      }
      if (name === "NotReadableError") {
        throw new Error("المايكروفون مشغول من تطبيق آخر.");
      }
      throw new Error("تعذّر فتح المايكروفون: " + (e instanceof Error ? e.message : String(e)));
    }

    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      // بعض المتصفحات (Safari) تتجاهل sampleRate — نقرأ المعدّل الفعلي ثم نُعيد التحجيم إلى 16kHz.
      this.ctx = new AC({ sampleRate: 16000 });
      this.inputRate = this.ctx.sampleRate;
      this.source = this.ctx.createMediaStreamSource(this.stream);
      this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e) => {
        try {
          const input = e.inputBuffer.getChannelData(0);
          const resampled = this.inputRate === this.targetRate
            ? input
            : downsample(input, this.inputRate, this.targetRate);
          onChunk(floatTo16BitPCM(resampled));
        } catch (err) {
          console.error("mic chunk error", err);
        }
      };
      this.source.connect(this.processor);
      this.processor.connect(this.ctx.destination);
    } catch (e) {
      this.stop();
      throw new Error("تعذّر تهيئة معالج الصوت: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  stop() {
    try { this.processor?.disconnect(); } catch { /* noop */ }
    try { this.source?.disconnect(); } catch { /* noop */ }
    try { this.stream?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    try { this.ctx?.close(); } catch { /* noop */ }
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.ctx = null;
  }
}

function downsample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate >= inRate) return input;
  const ratio = inRate / outRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  let o = 0, i = 0;
  while (o < outLen) {
    const next = Math.floor((o + 1) * ratio);
    let sum = 0, count = 0;
    for (; i < next && i < input.length; i++) { sum += input[i]; count++; }
    out[o++] = count > 0 ? sum / count : 0;
  }
  return out;
}

export class AudioPlayer {
  private ctx: AudioContext;
  private nextTime = 0;
  private closed = false;

  constructor() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC({ sampleRate: 24000 });
  }

  async enqueue(pcm16: Uint8Array) {
    if (this.closed) return;
    try {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      if (pcm16.byteLength < 2) return;
      const view = new DataView(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
      const samples = Math.floor(pcm16.byteLength / 2);
      const buf = this.ctx.createBuffer(1, samples, 24000);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < samples; i++) ch[i] = view.getInt16(i * 2, true) / 0x8000;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      if (this.nextTime < now) this.nextTime = now;
      src.start(this.nextTime);
      this.nextTime += buf.duration;
    } catch (e) {
      console.error("audio playback error", e);
    }
  }

  async close() {
    this.closed = true;
    try { await this.ctx.close(); } catch { /* noop */ }
  }
}
