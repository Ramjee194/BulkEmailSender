<script lang="ts">
	import '../app.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				retry: false
			}
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<Toaster position="top-right" richColors />
	{@render children()}
</QueryClientProvider>
