import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/', // Changed from ./ to / for better Express integration
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        chunkSizeWarningLimit: 1600
      },
      define: {
        'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.CHAT_CNR_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.CHAT_CNR_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
        'process.env.CHAT_CNR_API_KEY': JSON.stringify(process.env.CHAT_CNR_API_KEY || process.env.GEMINI_API_KEY || env.CHAT_CNR_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
        'process.env.CHAT_CNR_PRO_API_KEY': JSON.stringify(process.env.CHAT_CNR_PRO_API_KEY || env.CHAT_CNR_PRO_API_KEY || ''),
        'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
