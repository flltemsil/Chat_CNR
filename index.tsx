
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Register the service worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('App needs refresh');
    if (window.confirm("Kritik Sistem Güncellemesi\n\nChat CNR - Professional Edition için yeni bir sürüm mevcut. Sürüm yükseltmek ve en iyi performansı almak için lütfen onaylayın.")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use');
  },
  onRegisteredSW(swUrl, r) {
    console.log('SW Registered');
    if (r) {
      // Force update check now
      r.update();
      
      // Check for updates every 10 minutes
      setInterval(async () => {
        if (!(!r.installing && navigator)) return;
        if (('connection' in navigator) && !navigator.onLine) return;
        console.log('Checking for SW update...');
        await r.update();
      }, 10 * 60 * 1000); // 10 mins

      // Check when app resumes or comes to foreground
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
           r.update();
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
