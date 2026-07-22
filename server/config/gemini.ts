import { GoogleGenAI } from '@google/genai';
import WebSocket from 'ws';
import { ENV } from './env';

// Polyfill global WebSocket for @google/genai SDK in Node environments
if (!globalThis.WebSocket) {
  (globalThis as any).WebSocket = WebSocket;
}

export const geminiApiKey = ENV.GEMINI_API_KEY;
export let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini API successfully initialized server-side.');
  } catch (err) {
    console.error('Failed to initialize Gemini SDK', err);
  }
} else {
  console.warn('GEMINI_API_KEY missing or using placeholder, fallback response mode active.');
}
