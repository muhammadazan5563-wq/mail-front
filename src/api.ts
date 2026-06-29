/**
 * Centralized API client with authentication support.
 * All requests automatically include the JWT token from localStorage.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Token management
const TOKEN_KEY = 'equinox_token';
const USER_KEY = 'equinox_user';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  const user = getStoredUser();
  return user?.role === 'admin';
}

/**
 * Build full API URL
 */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;

/**
 * Authenticated fetch wrapper.
 * Automatically adds Authorization header with JWT token.
 * Redirects to login on 401 responses.
 */
export const api = async (path: string, init?: RequestInit): Promise<Response> => {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for JSON bodies if not already set
  if (init?.body && typeof init.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  // Handle 401 - token expired or invalid
  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  return response;
};

/**
 * Auth-specific API calls
 */
export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser } | { error: string }> {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Login failed' };
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async register(email: string, password: string, name: string): Promise<{ token: string; user: AuthUser } | { error: string }> {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Registration failed' };
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  logout(): void {
    clearAuth();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
};
