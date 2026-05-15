<script lang="ts">
	import { authStore } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { 
		LayoutDashboard, 
		Send, 
		Settings, 
		LogOut, 
		User, 
		Menu, 
		X, 
		Bell,
		Mail,
		Clock
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let isSidebarOpen = $state(false);

	const navItems = [
		{ name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
		{ name: 'Campaigns', icon: Send, href: '/dashboard/campaigns' },
		{ name: 'Activity Logs', icon: Clock, href: '/dashboard/logs' },
		{ name: 'SMTP Settings', icon: Settings, href: '/dashboard/settings' },
	];

	async function handleLogout() {
		await authStore.logout();
		goto('/login');
	}

	onMount(async () => {
		if (!authStore.user) {
			await authStore.checkAuth();
			if (!authStore.isAuthenticated) {
				goto('/login');
			}
		}
	});
</script>

<div class="min-h-screen bg-gray-50 flex">
	<!-- Mobile Sidebar Overlay -->
	{#if isSidebarOpen}
		<button 
			type="button"
			aria-label="Close sidebar"
			class="fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm lg:hidden border-none"
			onclick={() => isSidebarOpen = false}
			onkeydown={(e) => e.key === 'Escape' && (isSidebarOpen = false)}
		></button>
	{/if}

	<!-- Sidebar -->
	<aside 
		class="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 {isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<div class="h-full flex flex-col">
			<!-- Logo -->
			<div class="p-6 border-b border-gray-100 flex items-center space-x-3">
				<div class="bg-indigo-600 p-2 rounded-lg">
					<Mail class="h-6 w-6 text-white" />
				</div>
				<span class="text-xl font-bold text-gray-900 tracking-tight">BulkMail</span>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 px-4 py-6 space-y-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 group"
					>
						<item.icon class="h-5 w-5 group-hover:scale-110 transition-transform" />
						<span class="font-medium">{item.name}</span>
					</a>
				{/each}
			</nav>

			<!-- User Profile & Logout -->
			<div class="p-4 border-t border-gray-100 space-y-2">
				<div class="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
					<div class="bg-indigo-100 p-2 rounded-full">
						<User class="h-5 w-5 text-indigo-600" />
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-gray-900 truncate">{authStore.user?.name || 'User'}</p>
						<p class="text-xs text-gray-500 truncate">{authStore.user?.email || ''}</p>
					</div>
				</div>
				<button
					onclick={handleLogout}
					class="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
				>
					<LogOut class="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
					<span class="font-medium">Logout</span>
				</button>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
		<!-- Top Navbar -->
		<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
			<button 
				class="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
				onclick={() => isSidebarOpen = true}
			>
				<Menu class="h-6 w-6" />
			</button>

			<div class="flex-1 hidden lg:block">
				<h1 class="text-lg font-semibold text-gray-800">Welcome back, {authStore.user?.name}!</h1>
			</div>

			<div class="flex items-center space-x-4">
				<button class="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
					<Bell class="h-6 w-6" />
					<span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
				</button>
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
