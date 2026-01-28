// fe/src/services/apiClient.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const KIOSK_KEY = import.meta.env.VITE_KIOSK_KEY as string;

const TOKEN_KEY = 'vk_admin_token';

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: any;
  auth?: boolean;   // include Authorization Bearer token
  kiosk?: boolean;  // include X-Kiosk-Key
};

export async function apiRequest<T>(opts: RequestOptions): Promise<T> {
  if (!API_BASE_URL) throw new Error('VITE_API_BASE_URL is not set');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (opts.auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (opts.kiosk) {
    if (!KIOSK_KEY) throw new Error('VITE_KIOSK_KEY is not set');
    headers['X-Kiosk-Key'] = KIOSK_KEY;
  }

  const res = await fetch(`${API_BASE_URL}${opts.path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (payload && typeof payload === 'object' && 'message' in payload && (payload as any).message) ||
      (payload && typeof payload === 'object' && 'error' in payload && (payload as any).error) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return payload as T;
}
