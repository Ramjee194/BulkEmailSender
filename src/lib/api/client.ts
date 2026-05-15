// src/lib/api/client.ts
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { toast } from 'svelte-sonner';

type FetchOptions = RequestInit & {
	params?: Record<string, string>;
};

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
		const url = new URL(endpoint, this.baseUrl);
		
		if (options.params) {
			Object.entries(options.params).forEach(([key, value]) => {
				url.searchParams.append(key, value);
			});
		}

		// Request Interceptor Logic
		const headers = new Headers(options.headers);
		if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json');
		}

		const config: RequestInit = {
			...options,
			headers,
			// Important for cookie-based auth
			credentials: 'include'
		};

		try {
			const response = await fetch(url.toString(), config);
			
			// Response Interceptor Logic
			if (response.status === 401) {
				// Handle unauthorized - maybe redirect to login or clear auth state
				if (!endpoint.includes('/auth/me')) {
					// toast.error('Session expired. Please login again.');
					// window.location.href = '/login';
				}
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Something went wrong');
			}

			return data as T;
		} catch (error: any) {
			console.error(`API Error [${endpoint}]:`, error);
			throw error;
		}
	}

	get<T>(endpoint: string, options?: FetchOptions) {
		return this.request<T>(endpoint, { ...options, method: 'GET' });
	}

	post<T>(endpoint: string, body?: any, options?: FetchOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body: body instanceof FormData ? body : JSON.stringify(body)
		});
	}

	put<T>(endpoint: string, body?: any, options?: FetchOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: 'PUT',
			body: body instanceof FormData ? body : JSON.stringify(body)
		});
	}

	delete<T>(endpoint: string, options?: FetchOptions) {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' });
	}
}

export const apiClient = new ApiClient(PUBLIC_API_BASE_URL);
