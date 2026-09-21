
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import { updateService } from './services/updateService';
import { APP_VERSION, APP_RELEASE_DATE, APP_RELEASE_NOTES } from './version';

// Register the service worker with automatic non-blocking updates
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[SW] App needs refresh - notifying update service');
    updateService.notifyUpdate({
      version: APP_VERSION,
      releaseDate: APP_RELEASE_DATE,
      releaseNotes: APP_RELEASE_NOTES,
      forceReload: true
    });
  },
  onOfflineReady() {
    console.log('[SW] App ready for offline use');
  },
  onRegisteredSW(swUrl, r) {
    console.log('[SW] SW Registered successfully');

    (window as any).triggerUpdate = () => {
      updateService.notifyUpdate({
        version: APP_VERSION,
        releaseDate: APP_RELEASE_DATE,
        releaseNotes: APP_RELEASE_NOTES,
        forceReload: true
      });
      if (r) {
        r.update().then(() => updateSW(true)).catch(() => updateSW(true));
      } else {
        updateSW(true);
      }
    };

    if (r) {
      // Force update check now
      r.update().catch(() => {});
      
      // Check for updates every 5 minutes
      setInterval(async () => {
        if (!(!r.installing && navigator)) return;
        if (('connection' in navigator) && !navigator.onLine) return;
        await r.update().catch(() => {});
      }, 5 * 60 * 1000);

      // Check when app resumes or comes to foreground
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          r.update().catch(() => {});
        }
      });
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("index.tsx: Starting render");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log("index.tsx: Render called");
