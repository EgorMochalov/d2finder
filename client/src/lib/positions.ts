/** Единый формат ролей в БД (совпадает с seed и профилем). */
export const ROLE_PREFS = ['Pos 1', 'Pos 2', 'Pos 3', 'Pos 4', 'Pos 5'] as const;

const EN_LABELS: Record<string, string> = {
  '1': '1 Safe',
  '2': '2 Mid',
  '3': '3 Off',
  '4': '4 Soft',
  '5': '5 Hard',
};

export function roleLabelEn(role: string): string {
  const digit = role.replace(/\D/g, '').slice(-1) || role[0];
  return EN_LABELS[digit] || role;
}
