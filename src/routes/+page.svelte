<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$stores/auth.svelte';
	import { Loader2 } from 'lucide-svelte';

	onMount(async () => {
		await authStore.checkAuth();
		if (authStore.isAuthenticated) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="text-center">
		<Loader2 class="animate-spin h-10 w-10 text-indigo-600 mx-auto" />
		<p class="mt-4 text-gray-600 font-medium">Loading your experience...</p>
	</div>
</div>
