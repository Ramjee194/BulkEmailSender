// src/lib/api/email.ts
import { apiClient } from './client';
import type { ApiResponse, BatchStatus, ScheduledJob } from './types';

export const emailService = {
	sendBulk: (formData: FormData) => {
		return apiClient.post<ApiResponse>('/send', formData);
	},
	getScheduledJobs: () => {
		return apiClient.get<ApiResponse<ScheduledJob[]>>('/scheduled-jobs');
	},
	cancelScheduledJob: (jobId: string) => {
		return apiClient.delete<ApiResponse>(`/scheduled-jobs/${jobId}`);
	},
	getBatchStatus: () => {
		return apiClient.get<ApiResponse<BatchStatus>>('/batch-status');
	},
	pauseBatch: () => {
		return apiClient.post<ApiResponse>('/batch-pause');
	},
	resumeBatch: () => {
		return apiClient.post<ApiResponse>('/batch-resume');
	},
	cancelBatch: () => {
		return apiClient.delete<ApiResponse>('/batch-cancel');
	},
	parseExcel: (formData: FormData) => {
		return apiClient.post<{ success: boolean, contacts: any[], totalCount: number }>('/parse-excel', formData);
	}
};
