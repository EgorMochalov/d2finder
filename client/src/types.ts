export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  rank?: number;
  rolePrefs?: string;
  region?: string;
  languages?: string;
  bio?: string;
  isLooking?: boolean;
  lookingExpiry?: string;
  steamId?: string;
}

export interface ProfileUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  rank: number | null;
  rolePrefs: string | null;
  region: string | null;
  languages: string | null;
  bio: string | null;
  isLooking: boolean;
  lookingExpiry: string | null;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  description?: string | null;
  logoUrl?: string | null;
  captainId: string;
  captain?: { id: string; username: string; avatarUrl?: string | null };
  members?: TeamMember[];
  _count?: { members: number };
  joinRequests?: TeamJoinRequest[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'CAPTAIN' | 'VICE_CAPTAIN' | 'MEMBER';
  joinedAt: string;
  user?: User;
}

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  userId: string;
  message?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  user?: User;
}

export interface Message {
  id: string;
  chatType: 'PRIVATE' | 'TEAM';
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; username: string; avatarUrl?: string | null };
}

export interface Contact {
  userId: string;
  username: string;
  lastMessage: string;
}

export interface ClanWarLooking {
  id: string;
  teamId: string;
  authorId: string;
  description: string;
  timeText?: string | null;
  dateText?: string | null;
  rankReq?: string | null;
  mmrReq?: number | null;
  createdAt: string;
  team: Team;
  author: { id: string; username: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  content?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface BlockedUser {
  id: string;
  blocked: { id: string; username: string; avatarUrl?: string | null };
}

export interface Hero {
  id: number;
  name: string;
  icon: string;
  attr: 'str' | 'agi' | 'int';
  roles: string[];
}

export interface ChatInfo {
  type: 'PRIVATE' | 'TEAM';
  otherUserId?: string;
  username?: string;
  team?: Team;
}
