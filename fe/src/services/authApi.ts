// fe/src/services/authApi.ts

import { apiRequest, setAuthToken, clearAuthToken } from './apiClient';

export type AuthUser = { id: string; email: string; full_name: string | null; roles: Array<'admin' | 'user'> };

export async function login(email: string, password: string) {
  const res = await apiRequest<{ access_token: string; user: AuthUser }>({
    method: 'POST',
    path: '/auth/login',
    body: { email, password },
  });

  setAuthToken(res.access_token);
  return res;
}

export async function signup(email: string, password: string, fullName: string) {
  return apiRequest<{ success: boolean; user: { id: string; email: string; full_name: string | null } }>({
    method: 'POST',
    path: '/auth/signup',
    body: { email, password, fullName },
  });
}

export async function me() {
  return apiRequest<AuthUser>({
    method: 'GET',
    path: '/auth/me',
    auth: true,
  });
}

export function logout() {
  clearAuthToken();
}
