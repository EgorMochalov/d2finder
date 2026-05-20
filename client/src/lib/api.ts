import { API_URL, MEDIA_ORIGIN, assertApiConfigured } from './config';

assertApiConfigured();

export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) return `${MEDIA_ORIGIN}${url}`;
  return url;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('API не настроен: задайте VITE_API_URL в переменных окружения Vercel');
  }

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth:logout'));
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: data }),
    login: (data: { login: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: data }),
  },
  users: {
    me: () => request<any>('/users/me'),
    get: (id: string) => request<any>(`/users/${id}`),
    update: (data: any) => request<any>('/users/me', { method: 'PATCH', body: data }),
    startLooking: () => request<any>('/users/looking', { method: 'POST' }),
    stopLooking: () => request<any>('/users/looking/stop', { method: 'POST' }),
  },
  teams: {
    list: () => request<any[]>('/teams'),
    get: (id: string) => request<any>(`/teams/${id}`),
    create: (data: any) => request<any>('/teams', { method: 'POST', body: data }),
    invite: (teamId: string, userId: string) =>
      request<any>(`/teams/${teamId}/invite`, { method: 'POST', body: { userId } }),
    joinRequest: (teamId: string, message?: string) =>
      request<any>(`/teams/${teamId}/join-request`, { method: 'POST', body: { message } }),
    handleJoinRequest: (teamId: string, requestId: string, action: 'accept' | 'decline') =>
      request<any>(`/teams/${teamId}/join-request/${requestId}/${action}`, { method: 'POST' }),
    removeMember: (teamId: string, userId: string) =>
      request<any>(`/teams/${teamId}/member/${userId}`, { method: 'DELETE' }),
    leave: (teamId: string) => request<any>(`/teams/${teamId}/leave`, { method: 'POST' }),
    disband: (teamId: string) => request<any>(`/teams/${teamId}`, { method: 'DELETE' }),
    myInvitations: () => request<any[]>('/teams/my/invitations'),
    mySentInvitations: () => request<any[]>('/teams/my/sent-invitations'),
    myRequests: () => request<any[]>('/teams/my/requests'),
    respondInvitation: (id: string, action: 'accept' | 'decline') =>
      request<any>(`/teams/invitations/${id}/${action}`, { method: 'PATCH' }),
    cancelRequest: (id: string) =>
      request<any>(`/teams/requests/${id}`, { method: 'DELETE' }),
    cancelInvitation: (id: string) =>
      request<any>(`/teams/invitations/${id}`, { method: 'DELETE' }),
  },
  search: {
    teammates: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return request<any[]>(`/search/teammates?${qs}`);
    },
    teams: (params?: Record<string, string>) => {
      const qs = params && Object.values(params).some(Boolean) ? `?${new URLSearchParams(params).toString()}` : '';
      return request<any[]>(`/search/teams${qs}`);
    },
  },
  clanWars: {
    challenge: (team1Id: string, team2Id: string, message?: string) =>
      request<any>('/clanwars', { method: 'POST', body: { team1Id, team2Id, message } }),
    looking: {
      list: (params?: Record<string, string>) => {
        const qs = params && Object.values(params).some(Boolean) ? `?${new URLSearchParams(params).toString()}` : '';
        return request<any[]>(`/clanwars/looking${qs}`);
      },
      create: (data: { teamId: string; description: string; timeText?: string; dateText?: string; rankReq?: string; mmrReq?: number }) =>
        request<any>('/clanwars/looking', { method: 'POST', body: data }),
      delete: (id: string) => request<any>(`/clanwars/looking/${id}`, { method: 'DELETE' }),
    },
  },
  notifications: {
    list: () => request<any[]>('/notifications'),
    read: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
    readAll: () => request<any>('/notifications/read-all', { method: 'PATCH' }),
  },
  chats: {
    contacts: () => request<any[]>('/chats/contacts'),
    private: (userId: string) => request<{ chatId: string; messages: any[]; otherUserId: string }>(`/chats/private/${userId}`),
    team: (teamId: string) => request<{ chatId: string; messages: any[] }>(`/chats/team/${teamId}`),
  },
  blocks: {
    list: () => request<any[]>('/blocks'),
    block: (userId: string) => request<any>(`/blocks/${userId}`, { method: 'POST' }),
    unblock: (userId: string) => request<any>(`/blocks/${userId}`, { method: 'DELETE' }),
  },
  stats: {
    get: () => request<{ users: number; teams: number }>('/stats'),
  },
  upload: {
    avatar: async (file: File) => {
      if (!API_URL) throw new Error('API не настроен');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_URL}/upload/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Upload failed' })); throw new Error(err.error || 'Upload failed'); }
      return res.json();
    },
    teamLogo: async (file: File, teamId: string) => {
      if (!API_URL) throw new Error('API не настроен');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('teamId', teamId);
      const res = await fetch(`${API_URL}/upload/team-logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Upload failed' })); throw new Error(err.error || 'Upload failed'); }
      return res.json();
    },
  },
  reports: {
    create: (data: { reportedUserId?: string; reportedTeamId?: string; reason: string; description?: string }) =>
      request<any>('/reports', { method: 'POST', body: data }),
    list: () => request<any[]>('/reports'),
    update: (id: string, status: string) =>
      request<any>(`/reports/${id}`, { method: 'PATCH', body: { status } }),
  },
};
