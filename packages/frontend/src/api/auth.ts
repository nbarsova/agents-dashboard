import type { AuthResponse, MeResponse } from '@template/shared';

import { apiGet, apiPost } from './client';

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', { email, password });
}

export function signup(
  email: string,
  name: string,
  password: string,
  orgName: string,
): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/signup', { email, name, password, orgName });
}

export function getMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me');
}
