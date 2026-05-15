// src/lib/api/settings.ts
import { apiClient } from './client';
import type { ApiResponse, SMTPConfig } from './types';

export const settingsService = {
	getConfigs: () => {
		return apiClient.get<ApiResponse<SMTPConfig[]>>('/config/smtp');
	},
	addConfig: (config: any) => {
		return apiClient.post<ApiResponse>('/config/smtp', config);
	},
	updateConfig: (id: string, config: any) => {
		return apiClient.put<ApiResponse>(`/config/smtp/${id}`, config);
	},
	deleteConfig: (id: string) => {
		return apiClient.delete<ApiResponse>(`/config/smtp/${id}`);
	},
	testConfig: (config: any) => {
		return apiClient.post<ApiResponse>('/config/smtp/test', config);
	}
};
