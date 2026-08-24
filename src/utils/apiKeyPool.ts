// Smart Multi-Key Pool for Google Gemini API Keys
// Handles multiple free tier keys across different Google accounts
// Provides round-robin rotation, speaker separation (Sarah vs Khalid), and automatic 429 fallback

class ApiKeyPoolManager {
  private keys: string[] = [];
  private currentIndex = 0;
  private exhaustedKeys: Map<string, number> = new Map(); // key -> expiration timestamp (ms)
  private readonly EXHAUST_TIMEOUT_MS = 60 * 1000; // 1 minute backoff for 429

  constructor() {
    this.reloadKeys();
  }

  public reloadKeys(): void {
    const rawKeys = (import.meta as any).env?.VITE_GEMINI_API_KEYS as string | undefined;
    const singleKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;

    const parsedKeys: string[] = [];

    if (rawKeys && typeof rawKeys === 'string') {
      const split = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
      parsedKeys.push(...split);
    }

    if (singleKey && typeof singleKey === 'string' && singleKey.trim().length > 0) {
      if (!parsedKeys.includes(singleKey.trim())) {
        parsedKeys.push(singleKey.trim());
      }
    }

    this.keys = parsedKeys;
  }

  public getKeysCount(): number {
    return this.keys.length;
  }

  public getAllKeys(): string[] {
    return [...this.keys];
  }

  /**
   * Get an active key for general REST / text / audio calls.
   * Uses round-robin with automatic skipping of temporary exhausted keys.
   */
  public getApiKey(): string {
    if (this.keys.length === 0) {
      return '';
    }

    const now = Date.now();
    // Filter active keys
    const activeKeys = this.keys.filter(k => {
      const expire = this.exhaustedKeys.get(k);
      if (!expire) return true;
      if (now > expire) {
        this.exhaustedKeys.delete(k);
        return true;
      }
      return false;
    });

    const candidatePool = activeKeys.length > 0 ? activeKeys : this.keys;

    // Pick next key round-robin
    const key = candidatePool[this.currentIndex % candidatePool.length];
    this.currentIndex = (this.currentIndex + 1) % candidatePool.length;
    return key;
  }

  /**
   * Separate Sarah and Khalid onto different keys to prevent WebSocket concurrency collisions.
   * Sarah gets Key #0, Khalid gets Key #1 (or alternative active key).
   */
  public getKeyForSpeaker(speaker: 'sarah' | 'khalid'): string {
    if (this.keys.length === 0) return '';
    if (this.keys.length === 1) return this.keys[0];

    const now = Date.now();
    const isKeyActive = (k: string) => {
      const expire = this.exhaustedKeys.get(k);
      return !expire || now > expire;
    };

    if (speaker === 'sarah') {
      // Sarah prefers key index 0
      const key0 = this.keys[0];
      if (isKeyActive(key0)) return key0;
      return this.getApiKey();
    } else {
      // Khalid prefers key index 1
      const key1 = this.keys.length > 1 ? this.keys[1] : this.keys[0];
      if (isKeyActive(key1)) return key1;
      return this.getApiKey();
    }
  }

  /**
   * Key for Voice Chat stage (prefers key index 2 if available to leave 0 and 1 for radio)
   */
  public getKeyForVoiceChat(): string {
    if (this.keys.length >= 3) {
      const key2 = this.keys[2];
      const expire = this.exhaustedKeys.get(key2);
      if (!expire || Date.now() > expire) return key2;
    }
    return this.getApiKey();
  }

  /**
   * Report a 429 quota exhaustion so this key is temporarily sidelined
   */
  public markKeyExhausted(key: string): void {
    if (!key) return;
    console.warn(`[ApiKeyPool] Key marked as exhausted temporarily for 60s: ${key.substring(0, 10)}...`);
    this.exhaustedKeys.set(key, Date.now() + this.EXHAUST_TIMEOUT_MS);
  }
}

export const apiKeyPool = new ApiKeyPoolManager();
export const getApiKey = (): string => apiKeyPool.getApiKey();
export const getKeyForSpeaker = (speaker: 'sarah' | 'khalid'): string => apiKeyPool.getKeyForSpeaker(speaker);
export const getKeyForVoiceChat = (): string => apiKeyPool.getKeyForVoiceChat();
export const markKeyExhausted = (key: string): void => apiKeyPool.markKeyExhausted(key);
