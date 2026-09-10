/**
 * محرك المؤثرات الصوتية والبيئة المحيطة (Ambient Immersion & Phone SFX)
 * تم بناؤه باستخدام Web Audio API النقي بدون أي ملفات خارجية، ليعمل 100% بدون انقطاع أو تأخير.
 */

export type AmbientType = 'cafe' | 'rain' | 'street' | 'none';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private ringInterval: any = null;

  // Ambient nodes
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientType: AmbientType = 'none';
  private clinkTimer: any = null;

  private initCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // -------------------------------------------------------------
  // 1. مؤثر رنين الهاتف (Phone Ringtone)
  // -------------------------------------------------------------
  startPhoneRinging() {
    this.stopPhoneRinging();
    const ctx = this.initCtx();

    const ringOnce = () => {
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // التردد القياسي لرنة الهاتف الدولية (440Hz + 480Hz)
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);
        osc1.type = 'sine';
        osc2.type = 'sine';

        // نبضة رنين طبيعية (ثانيتان رنين، ثم توقف)
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.setValueAtTime(0.08, now + 1.8);
        gain.gain.linearRampToValueAtTime(0, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      } catch (e) {
        console.warn('Ring sound error:', e);
      }
    };

    ringOnce();
    this.ringInterval = setInterval(ringOnce, 4500); // تكرار كل 4.5 ثوانٍ
  }

  stopPhoneRinging() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  // -------------------------------------------------------------
  // 2. مؤثر فتح الخط / الرد (Pickup Click & Connect Chime)
  // -------------------------------------------------------------
  playPickupSound() {
    this.stopPhoneRinging();
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // صوت نقرة مفتاح الاتصال الواقعية
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);

      // نغمة ناعمة للترحيب بالاتصال (Dual chime)
      const chime1 = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime1.type = 'sine';
      chime1.frequency.setValueAtTime(587.33, now + 0.1); // D5
      chime1.frequency.setValueAtTime(880, now + 0.22); // A5

      chimeGain.gain.setValueAtTime(0, now + 0.1);
      chimeGain.gain.linearRampToValueAtTime(0.04, now + 0.15);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      chime1.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime1.start(now + 0.1);
      chime1.stop(now + 0.5);
    } catch (e) {
      console.warn('Pickup sound error:', e);
    }
  }

  // -------------------------------------------------------------
  // 3. مؤثر إغلاق الخط (Call Hangup / End Beep)
  // -------------------------------------------------------------
  playHangupSound() {
    this.stopPhoneRinging();
    this.stopAmbient();
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // 3 نغمات سريعة لإنهاء المكالمة
      [0, 0.15, 0.3].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now + delay);
        gain.gain.setValueAtTime(0.06, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.11);
      });
    } catch (e) {
      console.warn('Hangup sound error:', e);
    }
  }

  // -------------------------------------------------------------
  // 4. الأصوات البيئية المحيطة الحية (Ambient Environments)
  // -------------------------------------------------------------
  setAmbient(type: AmbientType, volume = 0.04) {
    if (this.ambientType === type && this.ambientNoiseSource) return;
    this.stopAmbient();
    this.ambientType = type;

    if (type === 'none') return;

    try {
      const ctx = this.initCtx();
      const bufferSize = ctx.sampleRate * 3; // 3 ثوانٍ من النويز المتكرر المفلتر
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // توليد صوت طبيعي دافئ (Pink / Brown noise)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      this.ambientNoiseSource = ctx.createBufferSource();
      this.ambientNoiseSource.buffer = noiseBuffer;
      this.ambientNoiseSource.loop = true;

      this.ambientFilter = ctx.createBiquadFilter();
      this.ambientGain = ctx.createGain();

      if (type === 'cafe') {
        // فلترة دافئة لأجواء الكافيه (حركة هادئة + ترددات متوسطة دافئة)
        this.ambientFilter.type = 'bandpass';
        this.ambientFilter.frequency.setValueAtTime(450, ctx.currentTime);
        this.ambientFilter.Q.setValueAtTime(0.8, ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(volume * 0.7, ctx.currentTime);

        // نقرات فنجان قهوة خفيفة وعفوية كل بضع ثوانٍ
        this.startCafeClinks(ctx, volume);
      } else if (type === 'rain') {
        // صوت مطر ناعم هادئ
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(1400, ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(volume * 1.1, ctx.currentTime);
      } else if (type === 'street') {
        // صوت نسيم وشوارع المدينة
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(600, ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
      }

      this.ambientNoiseSource.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);

      this.ambientNoiseSource.start();
    } catch (e) {
      console.warn('Ambient error:', e);
    }
  }

  private startCafeClinks(ctx: AudioContext, masterVolume: number) {
    const playSingleClink = () => {
      if (this.ambientType !== 'cafe') return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // ترددات نقرة الزجاج / الخزف الرقيقة
        const freq = 2200 + Math.random() * 800;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(masterVolume * 0.25, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } catch {}

      // جدولة النقرة القادمة بفواصل غير منتظمة واقعية (4 إلى 11 ثانية)
      const nextDelay = 4000 + Math.random() * 7000;
      this.clinkTimer = setTimeout(playSingleClink, nextDelay);
    };

    this.clinkTimer = setTimeout(playSingleClink, 2500);
  }

  setVolume(vol: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  stopAmbient() {
    if (this.clinkTimer) {
      clearTimeout(this.clinkTimer);
      this.clinkTimer = null;
    }
    if (this.ambientNoiseSource) {
      try {
        this.ambientNoiseSource.stop();
        this.ambientNoiseSource.disconnect();
      } catch {}
      this.ambientNoiseSource = null;
    }
    this.ambientType = 'none';
  }

  dispose() {
    this.stopPhoneRinging();
    this.stopAmbient();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

export const ambientSound = new AmbientSoundEngine();
