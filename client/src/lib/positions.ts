/** Единый формат ролей в БД (совпадает с seed и профилем). */
export const ROLE_PREFS = ['Pos 1', 'Pos 2', 'Pos 3', 'Pos 4', 'Pos 5'] as const;

export function roleLabelKey(role: string): string {
  const digit = role.replace(/\D/g, '').slice(-1) || role[0];
  return `pos.${digit}`;
}
