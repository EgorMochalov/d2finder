/** MMR → визуальный тир (приближённо к рангам Dota 2). */
export function getRankTier(mmr: number) {
  if (mmr >= 5620) return { label: 'Immortal', className: 'rank-tier rank-immortal' };
  if (mmr >= 4620) return { label: 'Divine', className: 'rank-tier rank-divine' };
  if (mmr >= 3850) return { label: 'Ancient', className: 'rank-tier rank-ancient' };
  if (mmr >= 3080) return { label: 'Legend', className: 'rank-tier rank-legend' };
  if (mmr >= 2310) return { label: 'Archon', className: 'rank-tier rank-archon' };
  if (mmr >= 1540) return { label: 'Guardian', className: 'rank-tier rank-guardian' };
  if (mmr >= 770) return { label: 'Crusader', className: 'rank-tier rank-crusader' };
  return { label: 'Herald', className: 'rank-tier rank-herald' };
}
