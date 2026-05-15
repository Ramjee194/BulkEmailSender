// src/lib/api/types.ts

export interface User {
	id: string;
	email: string;
	name: string;
}

export interface AuthResponse {
	success: boolean;
	message: string;
	user?: User;
}

export interface SMTPConfig {
	id: string;
	userId: string;
	name: string;
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	fromEmail: string;
	fromName: string;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ApiResponse<T = any> {
	success: boolean;
	message?: string;
	data?: T;
}

export interface EmailJobStats {
	total: number;
	sent: number;
	failed: number;
	pending: number;
}

export interface ScheduledJob {
	id: string;
	scheduled_time: string;
	status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
	contact_count: number;
	subject: string;
	use_batch: boolean;
	notify_email?: string;
	config_name: string;
}

export interface BatchStatus {
	isRunning: boolean;
	isPaused: boolean;
	totalContacts: number;
	processedContacts: number;
	sentCount: number;
	failedCount: number;
	currentBatch: number;
	totalBatches: number;
	progress: number;
}
