import { APP_VERSION, APP_RELEASE_DATE, APP_RELEASE_NOTES } from '../version';
import { db, doc, onSnapshot, setDoc, getDoc } from '../firebase';

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string[];
  forceReload?: boolean;
}

type UpdateListener = (info: UpdateInfo) => void;

class UpdateService {
  private listeners: Set<UpdateListener> = new Set();
  private isUpdateAvailable: boolean = false;
  private pendingUpdateInfo: UpdateInfo | null = null;
  private unsubscribeFirestore: (() => void) | null = null;
  private checkInterval: any = null;

  constructor() {
    this.init();
  }

  public init() {
    // 1. Expose to window for testing & service worker compatibility
    if (typeof window !== 'undefined') {
      (window as any).__chatCnrVersion = APP_VERSION;
      (window as any).triggerUpdate = () => {
        this.notifyUpdate({
          version: APP_VERSION,
          releaseDate: APP_RELEASE_DATE,
          releaseNotes: APP_RELEASE_NOTES,
          forceReload: true
        });
      };
    }

    // 2. Real-time listener via Firestore system/version
    try {
      const versionDocRef = doc(db, 'system', 'version');
      this.unsubscribeFirestore = onSnapshot(versionDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const remoteVersion = data?.latestVersion || data?.version;
          if (remoteVersion && this.isNewerVersion(remoteVersion, APP_VERSION)) {
            console.log(`[UpdateService] New version detected via Firestore: ${remoteVersion}`);
            this.notifyUpdate({
              version: remoteVersion,
              releaseDate: data?.releaseDate || APP_RELEASE_DATE,
              releaseNotes: data?.releaseNotes || APP_RELEASE_NOTES,
              forceReload: !!data?.forceReload
            });
          }
        }
      }, (err) => {
        console.warn('[UpdateService] Firestore version listen error (non-critical):', err);
      });
    } catch (e) {
      console.warn('[UpdateService] Failed to init Firestore version listener:', e);
    }

    // 3. Periodic check via /api/version every 5 minutes
    if (typeof window !== 'undefined') {
      this.checkForUpdates(false);
      this.checkInterval = setInterval(() => {
        this.checkForUpdates(false);
      }, 5 * 60 * 1000);

      // Check on window focus or visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdates(false);
        }
      });
    }
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    if (this.isUpdateAvailable && this.pendingUpdateInfo) {
      listener(this.pendingUpdateInfo);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyUpdate(info: UpdateInfo) {
    this.isUpdateAvailable = true;
    this.pendingUpdateInfo = info;
    this.listeners.forEach((listener) => {
      try {
        listener(info);
      } catch (err) {
        console.error('[UpdateService] Listener error:', err);
      }
    });
  }

  public async checkForUpdates(manual = false): Promise<UpdateInfo | null> {
    try {
      // Fetch /api/version with cache busting
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const remoteVersion = data.version;
        if (remoteVersion && this.isNewerVersion(remoteVersion, APP_VERSION)) {
          const updateInfo: UpdateInfo = {
            version: remoteVersion,
            releaseDate: data.releaseDate || APP_RELEASE_DATE,
            releaseNotes: data.releaseNotes || APP_RELEASE_NOTES,
            forceReload: false
          };
          this.notifyUpdate(updateInfo);
          return updateInfo;
        }
      }

      // Check Firestore doc as fallback
      const versionDocRef = doc(db, 'system', 'version');
      const snap = await getDoc(versionDocRef);
      if (snap.exists()) {
        const data = snap.data();
        const remoteVersion = data?.latestVersion || data?.version;
        if (remoteVersion && this.isNewerVersion(remoteVersion, APP_VERSION)) {
          const updateInfo: UpdateInfo = {
            version: remoteVersion,
            releaseDate: data?.releaseDate || APP_RELEASE_DATE,
            releaseNotes: data?.releaseNotes || APP_RELEASE_NOTES,
            forceReload: !!data?.forceReload
          };
          this.notifyUpdate(updateInfo);
          return updateInfo;
        }
      }

      return null;
    } catch (err) {
      console.warn('[UpdateService] Check update error:', err);
      return null;
    }
  }

  /**
   * Broadcasts a new version to all users via Firestore (Admin only)
   */
  public async publishVersionToAllUsers(version: string, releaseNotes: string[] = APP_RELEASE_NOTES): Promise<void> {
    const versionDocRef = doc(db, 'system', 'version');
    await setDoc(versionDocRef, {
      latestVersion: version,
      releaseDate: new Date().toISOString().split('T')[0],
      releaseNotes: releaseNotes,
      forceReload: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[UpdateService] Published version ${version} to all users in Firestore.`);
  }

  /**
   * Clears all ServiceWorker and browser caches and forces immediate reload
   */
  public async applyUpdate(): Promise<void> {
    console.log('[UpdateService] Applying update and clearing caches...');
    
    // 1. Clear CacheStorage
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        console.log('[UpdateService] Caches cleared.');
      } catch (e) {
        console.warn('[UpdateService] Failed to clear caches:', e);
      }
    }

    // 2. Unregister old service workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      } catch (e) {
        console.warn('[UpdateService] SW unregister error:', e);
      }
    }

    // 3. Force hard reload with timestamp query to bust browser/proxy disk cache
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('v_update', Date.now().toString());
    window.location.href = currentUrl.toString();
  }

  public getCurrentVersion(): string {
    return APP_VERSION;
  }

  private isNewerVersion(remote: string, local: string): boolean {
    if (!remote || !local) return false;
    const cleanRemote = remote.replace(/^v/, '').trim();
    const cleanLocal = local.replace(/^v/, '').trim();
    if (cleanRemote === cleanLocal) return false;

    const rParts = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
    const lParts = cleanLocal.split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(rParts.length, lParts.length);

    for (let i = 0; i < maxLen; i++) {
      const r = rParts[i] || 0;
      const l = lParts[i] || 0;
      if (r > l) return true;
      if (r < l) return false;
    }
    return false;
  }

  public cleanup() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const updateService = new UpdateService();
