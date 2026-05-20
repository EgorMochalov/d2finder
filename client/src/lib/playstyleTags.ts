export const PLAYSTYLE_TAG_IDS = [
  'silent',
  'feeder_repent',
  'weird_picks',
  'gives_aegis',
  'no_toxic',
  'voice',
  'tryhard',
] as const;

export type PlaystyleTagId = (typeof PLAYSTYLE_TAG_IDS)[number];

export const MAX_PLAYSTYLE_TAGS = 4;

export function playstyleTagKey(id: PlaystyleTagId): string {
  return `playstyle.${id}`;
}

export function parsePlaystyleTags(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Совместимость 0–100 по пересечению тегов. */
export function playstyleMatchPercent(a: string[], b: string[]): number | null {
  if (!a.length || !b.length) return null;
  const common = a.filter((t) => b.includes(t)).length;
  return Math.round((common / Math.max(a.length, b.length)) * 100);
}

export function togglePlaystyleTag(selected: string[], id: PlaystyleTagId): string[] {
  if (selected.includes(id)) return selected.filter((t) => t !== id);
  if (selected.length >= MAX_PLAYSTYLE_TAGS) return selected;
  return [...selected, id];
}
