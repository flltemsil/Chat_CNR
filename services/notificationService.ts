import {
  db,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc
} from '../firebase';
import { AppNotification, UserProfile } from '../types';

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  },

  showLocalNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }
    try {
      const notif = new Notification(title, {
        icon: 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (e) {
      console.warn('Native notification failed, falling back to Service Worker if present', e);
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            icon: 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png',
            ...options,
          });
        }).catch(console.error);
      }
      return false;
    }
  },

  /**
   * Checks if 30 days (1 month) have passed since the last monthly notification was sent to this user.
   * If so, sends the monthly reminder and updates the timestamp in Firestore and local storage.
   */
  async checkAndTriggerMonthlyNotification(user: UserProfile): Promise<boolean> {
    if (!user || !user.uid) return false;

    const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Check last sent timestamp
    let lastNotifTime: number | null = null;
    if (user.lastMonthlyNotification) {
      const dt = user.lastMonthlyNotification.toDate ? user.lastMonthlyNotification.toDate() : new Date(user.lastMonthlyNotification);
      lastNotifTime = dt.getTime();
    } else {
      const localStored = localStorage.getItem(`chat_cnr_last_monthly_${user.uid}`);
      if (localStored) {
        lastNotifTime = parseInt(localStored, 10);
      }
    }

    const shouldSend = !lastNotifTime || (now - lastNotifTime >= MONTH_IN_MS);

    if (shouldSend) {
      const title = 'Chat_CNR Aylık Hatırlatıcı 🌟';
      const body = `Merhaba ${user.name || 'Dostum'}! Chat_CNR'daki yeni yapay zeka özellikleri, sesli 'Hey CNR' komutları ve güncellemeler seni bekliyor.`;

      // Show native browser notification if granted
      this.showLocalNotification(title, {
        body,
        tag: 'monthly-reminder'
      });

      // Update timestamp in Firestore and local storage
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastMonthlyNotification: serverTimestamp(),
        });
        localStorage.setItem(`chat_cnr_last_monthly_${user.uid}`, now.toString());
        return true;
      } catch (err) {
        console.error('Failed to update lastMonthlyNotification in Firestore:', err);
      }
    }

    return false;
  },

  /**
   * Send broadcast notification (e.g. monthly update or general announcement) to all users
   */
  async sendBroadcastNotification(
    title: string,
    message: string,
    type: 'monthly' | 'announcement' = 'monthly',
    senderEmail: string = 'dorukaliarslan20@gmail.com',
    targetUid: string = 'all'
  ): Promise<string> {
    const notifRef = collection(db, 'broadcast_notifications');
    const newDoc = await addDoc(notifRef, {
      title,
      message,
      type,
      targetUid,
      senderEmail,
      createdAt: serverTimestamp(),
    });

    // Also trigger locally if this device has permission
    this.showLocalNotification(title, {
      body: message,
      tag: `broadcast-${newDoc.id}`
    });

    return newDoc.id;
  },

  /**
   * Listen to recent broadcast announcements
   */
  subscribeToBroadcasts(callback: (notifications: AppNotification[]) => void) {
    const q = query(
      collection(db, 'broadcast_notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'announcement',
          targetUid: data.targetUid || 'all',
          senderEmail: data.senderEmail || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        };
      });
      callback(notifs);
    }, (err) => {
      console.warn('Broadcast subscription notice:', err.message);
    });
  }
};
