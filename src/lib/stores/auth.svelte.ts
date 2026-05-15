// src/lib/stores/auth.svelte.ts
import { authService } from '$api/auth';
import type { User } from '$api/types';

class AuthStore {
	user = $state<User | null>(null);
	isLoading = $state(true);
	isAuthenticated = $derived(!!this.user);

	async checkAuth() {
		this.isLoading = true;
		try {
			const response = await authService.me();
			if (response.success && response.user) {
				this.user = response.user;
			} else {
				this.user = null;
			}
		} catch (error) {
			this.user = null;
		} finally {
			this.isLoading = false;
		}
	}

	setUser(user: User | null) {
		this.user = user;
		this.isLoading = false;
	}

	async logout() {
		try {
			await authService.logout();
		} finally {
			this.user = null;
		}
	}
}

export const authStore = new AuthStore();
