export const PLAYSTYLE_TAG_IDS = [
  "silent",
  "feeder_repent",
  "weird_picks",
  "gives_aegis",
  "no_toxic",
  "voice",
  "tryhard",
] as const;

export type PlaystyleTagId = (typeof PLAYSTYLE_TAG_IDS)[number];

export const MAX_PLAYSTYLE_TAGS = 4;

export function isValidPlaystyleTag(id: string): id is PlaystyleTagId {
  return (PLAYSTYLE_TAG_IDS as readonly string[]).includes(id);
}

export function sanitizePlaystyleTags(tags: unknown): PlaystyleTagId[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is PlaystyleTagId => typeof t === "string" && isValidPlaystyleTag(t)).slice(0, MAX_PLAYSTYLE_TAGS);
}
