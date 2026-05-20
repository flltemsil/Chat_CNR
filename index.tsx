
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Register the service worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('App needs refresh');
    if (window.confirm("Chat CNR için yeni bir güncelleme mevcut. Yenilemek ister misiniz?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use');
  },
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
