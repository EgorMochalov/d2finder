/** Бэкенд (Render). На Vercel задайте VITE_API_URL и VITE_SOCKET_URL в Environment Variables. */
const apiFromEnv = import.meta.env.VITE_API_URL as string | undefined;
const socketFromEnv = import.meta.env.VITE_SOCKET_URL as string | undefined;
const mediaFromEnv = import.meta.env.VITE_MEDIA_URL as string | undefined;

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/** Локально — прокси Vite; в проде — только env (без подстановки hostname Vercel). */
export const API_URL = apiFromEnv || (isLocal ? '/api' : '');

export const SOCKET_URL =
  socketFromEnv ||
  (apiFromEnv ? apiFromEnv.replace(/\/api\/?$/, '') : '') ||
  (isLocal ? 'http://localhost:3001' : '');

export const MEDIA_ORIGIN =
  mediaFromEnv ||
  (apiFromEnv ? apiFromEnv.replace(/\/api\/?$/, '').replace(/\/$/, '') : '') ||
  (isLocal ? 'http://localhost:3001' : '');

export function assertApiConfigured(): void {
  if (!API_URL && !isLocal) {
    console.error(
      '[config] VITE_API_URL не задан. Укажите URL бэкенда Render в настройках Vercel (например https://your-app.onrender.com/api).'
    );
  }
}
