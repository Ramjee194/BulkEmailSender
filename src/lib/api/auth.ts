// src/lib/api/auth.ts
import { apiClient } from './client';
import type { AuthResponse } from './types';

export const authService = {
	login: (credentials: any) => {
		return apiClient.post<AuthResponse>('/auth/login', credentials);
	},
	register: (userData: any) => {
		return apiClient.post<AuthResponse>('/auth/register', userData);
	},
	logout: () => {
		return apiClient.post<AuthResponse>('/auth/logout');
	},
	me: () => {
		return apiClient.get<AuthResponse>('/auth/me');
	}
};
