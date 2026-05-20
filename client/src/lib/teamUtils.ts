export function isTeamManager(team: { captainId: string; members?: { userId: string; role: string }[] }, userId: string): boolean {
  if (team.captainId === userId) return true;
  return team.members?.some(
    (m) => m.userId === userId && (m.role === 'CAPTAIN' || m.role === 'VICE_CAPTAIN')
  ) ?? false;
}

export function filterManageableTeams<T extends { captainId: string; members?: { userId: string; role: string }[] }>(
  teams: T[],
  userId: string
): T[] {
  return teams.filter((t) => isTeamManager(t, userId));
}
