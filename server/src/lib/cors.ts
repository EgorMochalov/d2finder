export function getAllowedOrigins(): string[] {
  return [
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',').map((s) => s.trim()) : []),
    'http://localhost:5173',
    'http://localhost:3001',
  ].filter(Boolean) as string[];
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  return allowed.some((a) => origin === a || origin.startsWith(a) || origin.endsWith('.vercel.app'));
}
