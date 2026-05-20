export const MAX_MESSAGE_LENGTH = 2000;

export function privateChatId(userA: string, userB: string): string {
  return [userA, userB].sort().join("_");
}

export function privateChatPeerId(chatId: string, userId: string): string {
  const parts = chatId.split("_");
  return parts.find((id) => id !== userId) || "";
}

export function isValidPrivateChatId(chatId: string, userId: string): boolean {
  const parts = chatId.split("_").filter(Boolean);
  return parts.length === 2 && parts.includes(userId);
}

export function teamIdFromChatId(chatId: string): string | null {
  if (!chatId.startsWith("team:")) return null;
  return chatId.slice(5) || null;
}
