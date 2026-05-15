// src/lib/api/report.ts
import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface EmailLog {
	id: string;
	recipient: string;
	subject: string;
	status: 'sent' | 'failed' | 'pending';
	error?: string;
	timestamp: string;
}

export interface ReportData {
	logs: EmailLog[];
	stats: {
		total: number;
		sent: number;
		failed: number;
	};
}

export const reportService = {
	getReport: () => {
		return apiClient.get<ApiResponse<ReportData>>('/report');
	},
	clearLogs: () => {
		return apiClient.delete<ApiResponse>('/report/clear');
	}
};
