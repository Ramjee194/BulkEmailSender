<script lang="ts">
	import { 
		Send, 
		Users, 
		CheckCircle, 
		AlertCircle, 
		ArrowUpRight,
		Clock
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { emailService } from '$api/email';

	let stats = $state([
		{ name: 'Total Sent', value: '0', icon: Send, color: 'bg-blue-500', trend: '+12%' },
		{ name: 'Active Users', value: '0', icon: Users, color: 'bg-purple-500', trend: '+5%' },
		{ name: 'Deliverability', value: '98.2%', icon: CheckCircle, color: 'bg-green-500', trend: '+0.4%' },
		{ name: 'Bounce Rate', value: '1.8%', icon: AlertCircle, color: 'bg-red-500', trend: '-0.2%' },
	]);

	let recentJobs = $state<any[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			const res = await emailService.getScheduledJobs();
			if (res.success) {
				recentJobs = res.data?.slice(0, 5) || [];
			}
		} catch (error) {
			console.error('Failed to fetch jobs:', error);
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="space-y-8">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each stats as stat}
			<div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
				<div class="flex items-center justify-between">
					<div class="{stat.color} p-3 rounded-xl">
						<stat.icon class="h-6 w-6 text-white" />
					</div>
					<span class="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
						{stat.trend}
						<ArrowUpRight class="h-3 w-3 ml-1" />
					</span>
				</div>
				<div class="mt-4">
					<p class="text-sm font-medium text-gray-500">{stat.name}</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
				</div>
			</div>
		{/each}
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Recent Activity -->
		<div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
			<div class="p-6 border-b border-gray-100 flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Recent Campaigns</h3>
				<a href="/dashboard/campaigns" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if isLoading}
					{#each Array(3) as _}
						<div class="p-6 animate-pulse flex items-center space-x-4">
							<div class="h-10 w-10 bg-gray-100 rounded-full"></div>
							<div class="flex-1 space-y-2">
								<div class="h-4 bg-gray-100 rounded w-1/4"></div>
								<div class="h-3 bg-gray-100 rounded w-1/2"></div>
							</div>
						</div>
					{/each}
				{:else if recentJobs.length === 0}
					<div class="p-12 text-center text-gray-500">
						<Send class="h-12 w-12 mx-auto text-gray-200 mb-4" />
						<p>No recent campaigns found. Start your first one!</p>
					</div>
				{:else}
					{#each recentJobs as job}
						<div class="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center space-x-4">
								<div class="bg-indigo-50 p-2 rounded-lg">
									<Send class="h-5 w-5 text-indigo-600" />
								</div>
								<div>
									<p class="font-semibold text-gray-900">{job.subject}</p>
									<p class="text-sm text-gray-500">{new Date(job.scheduled_time).toLocaleString()}</p>
								</div>
							</div>
							<div class="flex items-center space-x-3">
								<span class="px-3 py-1 rounded-full text-xs font-medium 
									{job.status === 'completed' ? 'bg-green-100 text-green-700' : 
									 job.status === 'running' ? 'bg-blue-100 text-blue-700' : 
									 'bg-gray-100 text-gray-700'}">
									{job.status}
								</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Quick Actions / Mini Stats -->
		<div class="space-y-6">
			<div class="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-lg shadow-indigo-200">
				<h3 class="text-xl font-bold mb-2">Ready to send?</h3>
				<p class="text-indigo-100 text-sm mb-6">Create a new bulk email campaign and reach thousands instantly.</p>
				<a 
					href="/dashboard/campaigns" 
					class="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
				>
					Start Campaign
				</a>
			</div>

			<div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
				<h3 class="font-bold text-gray-900 mb-4">SMTP Health</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-600 flex items-center">
							<CheckCircle class="h-4 w-4 text-green-500 mr-2" />
							Primary Gmail
						</span>
						<span class="text-green-600 font-medium">Active</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-600 flex items-center">
							<Clock class="h-4 w-4 text-orange-500 mr-2" />
							Outlook Work
						</span>
						<span class="text-orange-600 font-medium">Pending</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
