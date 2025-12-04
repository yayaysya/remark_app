import { User, Habit, Checkin } from '../types';

const STORAGE_KEYS = {
  TOKEN: 'simple_habit_token',
};

export const AUTH_EVENT = 'auth-change';

const API_BASE = '/api';

let cachedUser: User | null = null;

export const getAuthToken = () => {
  return typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const removeAuthToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.TOKEN);
  cachedUser = null;
  window.dispatchEvent(new Event(AUTH_EVENT));
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorBody: any = null;
    try {
      errorBody = await res.json();
    } catch {
      // ignore
    }
    const error = new Error(errorBody?.error || `Request failed with status ${res.status}`);
    throw error;
  }

  return res.json() as Promise<T>;
}

// --- Auth ---

export const requestLoginCode = async (phone: string) => {
  await request<{ success: boolean; code?: string }>('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};

export const loginUser = async (phone: string, code: string): Promise<User> => {
  const result = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  setAuthToken(result.token);
  cachedUser = result.user;
  return result.user;
};

export const logoutUser = () => {
  removeAuthToken();
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = await request<User>('/auth/me', { method: 'GET' });
    cachedUser = user;
    return user;
  } catch {
    // Token might be invalid; clear it for safety.
    removeAuthToken();
    return null;
  }
};

export const getCachedUser = () => cachedUser;

// --- Current user profile ---

export const fetchProfile = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = await request<User>('/users/me', { method: 'GET' });
    cachedUser = user;
    return user;
  } catch {
    removeAuthToken();
    return null;
  }
};

export const updateProfile = async (payload: { username?: string; nickname?: string }): Promise<User> => {
  const user = await request<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  cachedUser = user;
  return user;
};

export const uploadAvatar = async (file: File): Promise<User> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('avatar', file);

  const headers: HeadersInit = {};
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorBody: any = null;
    try {
      errorBody = await res.json();
    } catch {
      // ignore
    }
    const error = new Error(errorBody?.error || `Request failed with status ${res.status}`);
    throw error;
  }

  const user = (await res.json()) as User;
  cachedUser = user;
  return user;
};

// --- Habits ---

export const fetchHabits = async (): Promise<Habit[]> => {
  const result = await request<{ habits: Habit[] }>('/habits', { method: 'GET' });
  return result.habits;
};

export const createHabit = async (payload: {
  title: string;
  icon: string;
  themeColor: Habit['themeColor'];
}): Promise<Habit> => {
  const result = await request<{ habit: Habit }>('/habits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result.habit;
};

export const deleteHabit = async (id: string): Promise<void> => {
  await request(`/habits/${id}`, {
    method: 'DELETE',
  });
};

// --- Checkins & Vouchers ---

export const fetchCheckins = async (habitId?: string): Promise<Checkin[]> => {
  const qs = habitId ? `?habitId=${encodeURIComponent(habitId)}` : '';
  const result = await request<{ checkins: Checkin[] }>(`/checkins${qs}`, { method: 'GET' });
  return result.checkins;
};

export const addCheckin = async (habitId: string, date?: string): Promise<{ checkin: Checkin; user?: User }> => {
  const payload: any = { habitId };
  if (date) payload.date = date;
  return request<{ checkin: Checkin; user?: User }>('/checkins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const removeCheckin = async (habitId: string, date: string): Promise<void> => {
  await request('/checkins', {
    method: 'DELETE',
    body: JSON.stringify({ habitId, date }),
  });
};

export const spendVoucher = async (habitId: string, date: string): Promise<{ user: User }> => {
  const result = await request<{ success: boolean; user: User }>('/checkins/vouchers/spend', {
    method: 'POST',
    body: JSON.stringify({ habitId, date }),
  });
  cachedUser = result.user;
  return { user: result.user };
};

// --- Social: search & follows ---

export const searchUsers = async (query: string) => {
  const result = await request<{ users: Array<Pick<User, 'id' | 'username' | 'nickname' | 'avatar'>> }>(
    `/users/search?q=${encodeURIComponent(query)}`,
    { method: 'GET' }
  );
  return result.users;
};

export const getFollows = async () => {
  const result = await request<{ follows: Array<Pick<User, 'id' | 'username' | 'nickname' | 'avatar'>> }>(
    '/follows',
    { method: 'GET' }
  );
  return result.follows;
};

export const followUser = async (targetUserId: string) => {
  const result = await request<{ follow: Pick<User, 'id' | 'username' | 'nickname' | 'avatar'> }>('/follows', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
  return result.follow;
};

export const unfollowUser = async (targetUserId: string) => {
  await request(`/follows/${encodeURIComponent(targetUserId)}`, {
    method: 'DELETE',
  });
};

// --- Other users' data for supervision ---

export const fetchUserProfileById = async (userId: string): Promise<User> => {
  return request<User>(`/users/${encodeURIComponent(userId)}`, { method: 'GET' });
};

export const fetchUserHabits = async (userId: string): Promise<Habit[]> => {
  const result = await request<{ habits: Habit[] }>(`/users/${encodeURIComponent(userId)}/habits`, {
    method: 'GET',
  });
  return result.habits;
};

export const fetchUserCheckins = async (userId: string, habitId?: string): Promise<Checkin[]> => {
  const qs = habitId ? `?habitId=${encodeURIComponent(habitId)}` : '';
  const result = await request<{ checkins: Checkin[] }>(
    `/users/${encodeURIComponent(userId)}/checkins${qs}`,
    { method: 'GET' }
  );
  return result.checkins;
};
