<script lang="ts">
	import { settingsService } from '$api/settings';
	import type { SMTPConfig } from '$api/types';
	import { toast } from 'svelte-sonner';
	import { 
		Plus, 
		Trash2, 
		Edit2, 
		Server, 
		Shield, 
		ShieldOff, 
		Mail, 
		Loader2,
		AlertCircle,
		X
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	let configs = $state<SMTPConfig[]>([]);
	let isLoading = $state(true);
	let isSaving = $state(false);
	let showModal = $state(false);
	
	// Form state
	let formId = $state('');
	let formName = $state('');
	let host = $state('');
	let port = $state(587);
	let secure = $state(false);
	let user = $state('');
	let pass = $state('');
	let fromEmail = $state('');
	let fromName = $state('');
	let isDefault = $state(false);

	async function loadConfigs() {
		isLoading = true;
		try {
			const res = await settingsService.getConfigs();
			if (res.success) configs = res.data || [];
		} finally {
			isLoading = false;
		}
	}

	onMount(loadConfigs);

	function openAddModal() {
		formId = '';
		formName = '';
		host = '';
		port = 587;
		secure = false;
		user = '';
		pass = '';
		fromEmail = '';
		fromName = '';
		isDefault = configs.length === 0;
		showModal = true;
	}

	function openEditModal(config: SMTPConfig) {
		formId = config.id;
		formName = config.name;
		host = config.host;
		port = config.port;
		secure = config.secure;
		user = config.user;
		pass = config.pass;
		fromEmail = config.fromEmail;
		fromName = config.fromName;
		isDefault = config.isDefault;
		showModal = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSaving = true;
		
		const data = {
			name: formName,
			host,
			port,
			secure,
			user,
			pass,
			fromEmail: fromEmail,
			fromName: fromName,
			isDefault: isDefault
		};

		try {
			let res;
			if (formId) {
				res = await settingsService.updateConfig(formId, data);
			} else {
				res = await settingsService.addConfig(data);
			}

			if (res.success) {
				toast.success(formId ? 'Configuration updated' : 'Configuration added');
				showModal = false;
				await loadConfigs();
			} else {
				toast.error(res.message || 'Action failed');
			}
		} catch (error: any) {
			toast.error(error.message || 'Action failed');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this configuration?')) return;
		
		try {
			const res = await settingsService.deleteConfig(id);
			if (res.success) {
				toast.success('Configuration deleted');
				await loadConfigs();
			}
		} catch (error) {
			toast.error('Delete failed');
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">SMTP Settings</h2>
			<p class="text-gray-500 mt-1">Manage your outgoing email servers and configurations.</p>
		</div>
		<button
			onclick={openAddModal}
			class="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
		>
			<Plus class="h-5 w-5" />
			<span>Add Server</span>
		</button>
	</div>

	{#if isLoading}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each Array(2) as _}
				<div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-4">
					<div class="h-6 bg-gray-100 rounded w-1/3"></div>
					<div class="h-4 bg-gray-100 rounded w-1/2"></div>
					<div class="h-4 bg-gray-100 rounded w-2/3"></div>
				</div>
			{/each}
		</div>
	{:else if configs.length === 0}
		<div class="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
			<Server class="h-16 w-16 text-gray-200 mx-auto mb-6" />
			<h3 class="text-xl font-bold text-gray-900 mb-2">No servers configured</h3>
			<p class="text-gray-500 mb-8 max-w-md mx-auto">Add your first SMTP server to start sending bulk email campaigns securely.</p>
			<button
				onclick={openAddModal}
				class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
			>
				Setup First Server
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each configs as config}
				<div class="bg-white rounded-2xl border {config.isDefault ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-gray-100'} p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
					{#if config.isDefault}
						<div class="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
							Default
						</div>
					{/if}

					<div class="flex items-start justify-between">
						<div class="flex items-center space-x-4">
							<div class="bg-gray-50 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
								<Server class="h-6 w-6 text-gray-400 group-hover:text-indigo-600" />
							</div>
							<div>
								<h3 class="font-bold text-gray-900">{config.name}</h3>
								<p class="text-xs text-gray-500 flex items-center mt-0.5">
									{config.host}:{config.port}
									{#if config.secure}
										<Shield class="h-3 w-3 ml-2 text-green-500" />
									{:else}
										<ShieldOff class="h-3 w-3 ml-2 text-gray-300" />
									{/if}
								</p>
							</div>
						</div>
						<div class="flex items-center space-x-2">
							<button 
								onclick={() => openEditModal(config)}
								class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
							>
								<Edit2 class="h-4 w-4" />
							</button>
							<button 
								onclick={() => handleDelete(config.id)}
								class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					</div>

					<div class="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
						<div class="space-y-1">
							<p class="text-[10px] font-bold text-gray-400 uppercase">Username</p>
							<p class="text-xs text-gray-600 truncate font-medium">{config.user}</p>
						</div>
						<div class="space-y-1">
							<p class="text-[10px] font-bold text-gray-400 uppercase">From Email</p>
							<p class="text-xs text-gray-600 truncate font-medium">{config.fromEmail}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
		<div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
			<div class="p-8 border-b border-gray-100 flex items-center justify-between">
				<h3 class="text-2xl font-bold text-gray-900">{formId ? 'Edit Server' : 'Add New Server'}</h3>
				<button onclick={() => showModal = false} class="p-2 hover:bg-gray-100 rounded-full">
					<X class="h-6 w-6 text-gray-400" />
				</button>
			</div>
			
			<form onsubmit={handleSubmit} class="p-8 space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-2">
						<label for="formName" class="text-sm font-bold text-gray-700">Config Name</label>
						<input id="formName" bind:value={formName} placeholder="My Work Email" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
					</div>
					<div class="space-y-2">
						<label for="host" class="text-sm font-bold text-gray-700">SMTP Host</label>
						<input id="host" bind:value={host} placeholder="smtp.gmail.com" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
					</div>
					<div class="space-y-2">
						<label for="port" class="text-sm font-bold text-gray-700">Port</label>
						<input id="port" type="number" bind:value={port} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
					</div>
					<div class="space-y-2 flex items-center pt-8">
						<input type="checkbox" id="secure" bind:checked={secure} class="w-5 h-5 text-indigo-600 rounded" />
						<label for="secure" class="ml-3 text-sm font-bold text-gray-700">Use Secure Connection (SSL/TLS)</label>
					</div>
					<div class="space-y-2">
						<label for="user" class="text-sm font-bold text-gray-700">Username</label>
						<input id="user" bind:value={user} placeholder="user@gmail.com" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
					</div>
					<div class="space-y-2">
						<label for="pass" class="text-sm font-bold text-gray-700">Password / App Password</label>
						<input id="pass" type="password" bind:value={pass} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
					</div>
					<div class="space-y-2">
						<label for="fromEmail" class="text-sm font-bold text-gray-700">From Email</label>
						<input id="fromEmail" bind:value={fromEmail} placeholder="marketing@company.com" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
					</div>
					<div class="space-y-2">
						<label for="fromName" class="text-sm font-bold text-gray-700">From Name (Optional)</label>
						<input id="fromName" bind:value={fromName} placeholder="Marketing Team" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
					</div>
				</div>

				<div class="flex items-center space-x-3 p-4 bg-indigo-50 rounded-2xl">
					<input type="checkbox" id="isDefault" bind:checked={isDefault} class="w-5 h-5 text-indigo-600 rounded" />
					<label for="isDefault" class="text-sm font-bold text-indigo-900">Set as default configuration</label>
				</div>

				<div class="flex items-center justify-end space-x-4 pt-4">
					<button 
						type="button" 
						onclick={() => showModal = false}
						class="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
					>
						Cancel
					</button>
					<button
						disabled={isSaving}
						type="submit"
						class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center space-x-2 disabled:opacity-50"
					>
						{#if isSaving}
							<Loader2 class="animate-spin h-5 w-5" />
						{/if}
						<span>{formId ? 'Update Server' : 'Add Server'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
