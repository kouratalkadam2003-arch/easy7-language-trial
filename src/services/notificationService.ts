import { Capacitor, registerPlugin } from '@capacitor/core';
import { useReviewStore, isErroneousEnglishCard } from '@/store/reviewStore';
import { useUserStore } from '@/store/userStore';
import { globalSpacedRepetition } from '@/kingdom/engine/spacedRepetition';

interface Easy7NotificationsPlugin {
  send(options: { title: string; body: string; id?: number }): Promise<{ success: boolean }>;
}

const Easy7NativeNotifications = registerPlugin<Easy7NotificationsPlugin>('Easy7Notifications');

export type SmartNotificationType =
  | 'FIELD_WATERING'
  | 'TIRED_FIGHTERS'
  | 'DUE_MEMORIES'
  | 'SIEGE_ALERT'
  | 'STREAK_FLAME'
  | 'WELCOME_ACTIVATION';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

const STORAGE_LAST_NOTIF_TIME = 'easy7_last_notification_time';
const STORAGE_NOTIF_ENABLED = 'easy7_notifications_enabled';
const STORAGE_NOTIF_DISMISSED = 'easy7_notifications_dismissed_until';

export class NotificationService {
  private static instance: NotificationService;
  private heartbeatInterval: any = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public isSupported(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission | 'unsupported' {
    if (Capacitor.isNativePlatform()) {
      return localStorage.getItem(STORAGE_NOTIF_ENABLED) === 'true' ? 'granted' : 'default';
    }
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public isEnabled(): boolean {
    if (Capacitor.isNativePlatform()) {
      return localStorage.getItem(STORAGE_NOTIF_ENABLED) === 'true';
    }
    if (!this.isSupported()) return false;
    return Notification.permission === 'granted' && localStorage.getItem(STORAGE_NOTIF_ENABLED) === 'true';
  }

  public async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      localStorage.setItem(STORAGE_NOTIF_ENABLED, 'true');
      localStorage.removeItem(STORAGE_NOTIF_DISMISSED);

      this.sendNotification({
        title: '🎉 تم تفعيل إشعارات Easy7 بنجاح!',
        body: 'سننبهك عند حاجة الحقول للسقي، وتعب المقاتلين، ومواعيد تثبيت كلماتك.',
        url: '/village',
        tag: 'welcome',
      });

      this.startHeartbeat();
      return true;
    }

    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(STORAGE_NOTIF_ENABLED, 'true');
        localStorage.removeItem(STORAGE_NOTIF_DISMISSED);

        this.sendNotification({
          title: '🎉 تم تفعيل إشعارات Easy7 بنجاح!',
          body: 'سننبهك عند حاجة الحقول للسقي، وتعب المقاتلين، ومواعيد تثبيت كلماتك.',
          url: '/village',
          tag: 'welcome',
        });

        this.startHeartbeat();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }

  public dismissPromptFor24h(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_NOTIF_DISMISSED, String(Date.now() + 24 * 60 * 60 * 1000));
    }
  }

  public shouldShowPromptBanner(): boolean {
    if (!this.isSupported()) return false;
    if (this.isEnabled()) return false;
    if (typeof Notification !== 'undefined' && Notification.permission !== 'default') return false;
    const dismissedUntil = Number(localStorage.getItem(STORAGE_NOTIF_DISMISSED) || 0);
    return Date.now() > dismissedUntil;
  }

  public getDueCount(): number {
    const { targetLanguage } = useUserStore.getState();
    const { cards } = useReviewStore.getState();
    const activeLang = (
      targetLanguage ||
      (typeof window !== 'undefined' ? localStorage.getItem('target_lang') : '') ||
      'de'
    ).toLowerCase();

    const now = Date.now();
    const dueCards = cards.filter((c) => {
      if (!c.language || c.language.toLowerCase() !== activeLang) return false;
      if (activeLang === 'de' && isErroneousEnglishCard(c.native)) return false;
      return c.nextReviewAt <= now;
    });

    let dueInKingdom = 0;
    try {
      dueInKingdom = globalSpacedRepetition
        .getDueReviewQueue()
        .filter((item) => !(activeLang === 'de' && isErroneousEnglishCard(item.primaryText))).length;
    } catch (_) {}

    return Math.max(dueCards.length, dueInKingdom);
  }

  public getNotificationContent(type: SmartNotificationType): NotificationPayload {
    const dueCount = this.getDueCount();
    const streak = useUserStore.getState().streak || 1;

    switch (type) {
      case 'FIELD_WATERING':
        return {
          title: '🌾 حقول قريتك بحاجة إلى سقي!',
          body: 'محاصيل قريتك وبذور الكلمات عطشى الآن! راجع كلماتك لتحصل على قطرات الماء وتنعش الحقل.',
          url: '/village',
          tag: 'field_watering',
        };

      case 'TIRED_FIGHTERS':
        return {
          title: '⚔️ حامية المملكة: المقاتلون متعبون!',
          body: 'طاقة المدافعين انخفضت ويحتاجون دعمك! أجب عن كلمات المراجعة لإمدادهم بالقوة وصد غارات الزومبي.',
          url: '/village',
          tag: 'tired_fighters',
        };

      case 'DUE_MEMORIES':
        return {
          title: dueCount > 0 ? `🧠 لديك ${dueCount} عبارات مستحقة للمراجعة!` : '🧠 حان وقت المراجعة الذكية!',
          body: 'هذا هو الوقت الذهبي لتثبيت الكلمات في ذاكرتك الدائمة قبل أن تنساها. دقيقة واحدة تكفي!',
          url: '/review',
          tag: 'due_memories',
        };

      case 'SIEGE_ALERT':
        return {
          title: '🏰 إنذار غارة على أسوار المملكة!',
          body: 'اقتربت الوحوش من البوابة الملكية! ادخل الآن وقُد الجنود بمهاراتك لحماية قريتك.',
          url: '/village',
          tag: 'siege_alert',
        };

      case 'STREAK_FLAME':
      default:
        return {
          title: '🔥 شعلة إنجازك بانتظارك!',
          body: `حافظ على سلسلتك اليومية (${streak} أيام متتالية) وأكمل تدريب اليوم قبل نهاية اليوم.`,
          url: '/learn',
          tag: 'streak_flame',
        };
    }
  }

  public sendNotification(payload: NotificationPayload): void {
    if (!this.isEnabled()) return;

    if (Capacitor.isNativePlatform()) {
      try {
        Easy7NativeNotifications.send({
          title: payload.title,
          body: payload.body,
          id: Math.floor(Math.random() * 100000) + 1,
        }).catch((err: any) => console.warn('Easy7NativeNotifications send error:', err));
      } catch (e) {
        console.warn('Easy7NativeNotifications call failed:', e);
      }
      localStorage.setItem(STORAGE_LAST_NOTIF_TIME, String(Date.now()));
      return;
    }

    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag || 'easy7-notification',
      };

      const notification = new Notification(payload.title, options);

      notification.onclick = () => {
        window.focus();
        if (payload.url) {
          window.location.href = payload.url;
        }
        notification.close();
      };

      localStorage.setItem(STORAGE_LAST_NOTIF_TIME, String(Date.now()));
    } catch (err) {
      console.warn('Native notification failed:', err);
    }
  }

  public sendTestNotification(type: SmartNotificationType = 'FIELD_WATERING'): void {
    const payload = this.getNotificationContent(type);
    this.sendNotification(payload);
  }

  public checkAndDispatchSmartNotification(force: boolean = false): void {
    if (!this.isEnabled()) return;

    const lastTime = Number(localStorage.getItem(STORAGE_LAST_NOTIF_TIME) || 0);
    const now = Date.now();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    // Throttle check
    if (!force && now - lastTime < TWO_HOURS_MS) {
      return;
    }

    const dueCount = this.getDueCount();

    // Contextual rotation based on state
    let chosenType: SmartNotificationType = 'DUE_MEMORIES';

    if (dueCount > 0) {
      // Rotate between the 3 core game themes
      const hour = new Date().getHours();
      if (hour % 3 === 0) {
        chosenType = 'FIELD_WATERING';
      } else if (hour % 3 === 1) {
        chosenType = 'TIRED_FIGHTERS';
      } else {
        chosenType = 'DUE_MEMORIES';
      }
    } else {
      chosenType = 'STREAK_FLAME';
    }

    const payload = this.getNotificationContent(chosenType);
    this.sendNotification(payload);
  }

  public startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    // Check periodically every 20 minutes
    this.heartbeatInterval = setInterval(() => {
      this.checkAndDispatchSmartNotification(false);
    }, 20 * 60 * 1000);

    // Also check when tab becomes visible again
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkAndDispatchSmartNotification(false);
        }
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();
