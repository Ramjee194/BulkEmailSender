<script lang="ts">
	import { reportService, type EmailLog } from '$api/report';
	import { toast } from 'svelte-sonner';
	import { 
		Clock, 
		Search, 
		Download, 
		Trash2, 
		CheckCircle, 
		XCircle, 
		AlertCircle,
		Loader2,
		Filter
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	let logs = $state<EmailLog[]>([]);
	let stats = $state({ total: 0, sent: 0, failed: 0 });
	let isLoading = $state(true);
	let searchQuery = $state('');

	async function loadReport() {
		isLoading = true;
		try {
			const res = await reportService.getReport();
			if (res.success && res.data) {
				logs = res.data.logs;
				stats = res.data.stats;
			}
		} catch (error) {
			toast.error('Failed to load logs');
		} finally {
			isLoading = false;
		}
	}

	onMount(loadReport);

	const filteredLogs = $derived(
		logs.filter(log => 
			log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.subject.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	async function handleClearLogs() {
		if (!confirm('Are you sure you want to clear all logs?')) return;
		try {
			const res = await reportService.clearLogs();
			if (res.success) {
				toast.success('Logs cleared');
				await loadReport();
			}
		} catch (error) {
			toast.error('Failed to clear logs');
		}
	}
</script>

<div class="space-y-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Activity Logs</h2>
			<p class="text-gray-500 mt-1">Review the delivery status of every email sent.</p>
		</div>
		<div class="flex items-center space-x-3">
			<button 
				onclick={handleClearLogs}
				class="flex items-center space-x-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
			>
				<Trash2 class="h-5 w-5" />
				<span>Clear Logs</span>
			</button>
			<button 
				onclick={() => window.open(`${PUBLIC_API_BASE_URL}/report/export/csv`, '_blank')}
				class="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all font-medium shadow-sm"
			>
				<Download class="h-5 w-5" />
				<span>Export CSV</span>
			</button>
		</div>
	</div>

	<!-- Stats Summary -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
		<div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
			<div class="bg-blue-100 p-3 rounded-xl text-blue-600">
				<Clock class="h-6 w-6" />
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Total Processed</p>
				<p class="text-2xl font-bold text-gray-900">{stats.total}</p>
			</div>
		</div>
		<div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
			<div class="bg-green-100 p-3 rounded-xl text-green-600">
				<CheckCircle class="h-6 w-6" />
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Successfully Sent</p>
				<p class="text-2xl font-bold text-gray-900">{stats.sent}</p>
			</div>
		</div>
		<div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
			<div class="bg-red-100 p-3 rounded-xl text-red-600">
				<XCircle class="h-6 w-6" />
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Failed Attempts</p>
				<p class="text-2xl font-bold text-gray-900">{stats.failed}</p>
			</div>
		</div>
	</div>

	<!-- Logs Table Card -->
	<div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
		<div class="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="relative flex-1 max-w-md">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<Search class="h-5 w-5 text-gray-400" />
				</div>
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Search recipient or subject..."
					class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
				/>
			</div>
			<div class="flex items-center space-x-2">
				<button class="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
					<Filter class="h-5 w-5" />
				</button>
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead class="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
					<tr>
						<th class="px-6 py-4 font-bold">Recipient</th>
						<th class="px-6 py-4 font-bold">Subject</th>
						<th class="px-6 py-4 font-bold">Status</th>
						<th class="px-6 py-4 font-bold text-right">Timestamp</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#if isLoading}
						{#each Array(5) as _}
							<tr class="animate-pulse">
								<td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-2/3"></div></td>
								<td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-full"></div></td>
								<td class="px-6 py-4"><div class="h-6 bg-gray-100 rounded-full w-16"></div></td>
								<td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-1/3 ml-auto"></div></td>
							</tr>
						{/each}
					{:else if filteredLogs.length === 0}
						<tr>
							<td colspan="4" class="px-6 py-12 text-center text-gray-500 italic">
								No logs found matching your criteria.
							</td>
						</tr>
					{:else}
						{#each filteredLogs as log}
							<tr class="hover:bg-gray-50/50 transition-colors">
								<td class="px-6 py-4">
									<div class="flex flex-col">
										<span class="text-sm font-semibold text-gray-900">{log.recipient}</span>
									</div>
								</td>
								<td class="px-6 py-4">
									<span class="text-sm text-gray-600 line-clamp-1">{log.subject}</span>
								</td>
								<td class="px-6 py-4">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
										{log.status === 'sent' ? 'bg-green-100 text-green-700' : 
										 log.status === 'failed' ? 'bg-red-100 text-red-700' : 
										 'bg-blue-100 text-blue-700'}">
										{#if log.status === 'sent'}
											<CheckCircle class="h-3 w-3 mr-1" />
										{:else if log.status === 'failed'}
											<AlertCircle class="h-3 w-3 mr-1" />
										{/if}
										{log.status}
									</span>
									{#if log.error}
										<p class="text-[10px] text-red-500 mt-1 max-w-[200px] truncate" title={log.error}>
											{log.error}
										</p>
									{/if}
								</td>
								<td class="px-6 py-4 text-right text-xs text-gray-500 whitespace-nowrap">
									{new Date(log.timestamp).toLocaleString()}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
