<script lang="ts">
	import { emailService } from '$api/email';
	import { settingsService } from '$api/settings';
	import type { SMTPConfig } from '$api/types';
	import Editor from '$components/Editor.svelte';
	import { toast } from 'svelte-sonner';
	import { 
		Send, 
		Upload, 
		FileText, 
		Settings, 
		Clock, 
		Info, 
		Loader2,
		CheckCircle2,
		Users
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	// Form state
	let subject = $state('');
	let htmlContent = $state('');
	let selectedConfigId = $state('');
	let excelFile = $state<File | null>(null);
	let useBatch = $state(false);
	let batchSize = $state(20);
	let batchDelay = $state(60);
	let emailDelay = $state(2);
	let scheduleEmail = $state(false);
	let scheduledTime = $state('');
	
	let configs = $state<SMTPConfig[]>([]);
	let isLoadingConfigs = $state(true);
	let isSubmitting = $state(false);
	let contactPreview = $state<{ contacts: any[], totalCount: number } | null>(null);

	onMount(async () => {
		try {
			const res = await settingsService.getConfigs();
			if (res.success) {
				configs = res.data || [];
				const defaultBtn = configs.find(c => c.isDefault);
				if (defaultBtn) selectedConfigId = defaultBtn.id;
				else if (configs.length > 0) selectedConfigId = configs[0].id;
			}
		} catch (error) {
			toast.error('Failed to load SMTP settings');
		} finally {
			isLoadingConfigs = false;
		}
	});

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			excelFile = target.files[0];
			
			// Parse for preview
			const formData = new FormData();
			formData.append('excelFile', excelFile);
			try {
				const res = await emailService.parseExcel(formData);
				if (res.success) {
					contactPreview = { contacts: res.contacts, totalCount: res.totalCount };
					toast.success(`Loaded ${res.totalCount} contacts`);
				}
			} catch (error) {
				toast.error('Failed to parse Excel file');
			}
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		
		if (!selectedConfigId) return toast.error('Please select an SMTP configuration');
		if (!excelFile) return toast.error('Please upload an Excel file with contacts');
		if (!subject) return toast.error('Please enter a subject');
		if (!htmlContent || htmlContent === '<p><br></p>') return toast.error('Please compose your email');

		isSubmitting = true;
		const formData = new FormData();
		formData.append('subject', subject);
		formData.append('htmlContent', htmlContent);
		formData.append('configId', selectedConfigId);
		formData.append('excelFile', excelFile);
		
		if (useBatch) {
			formData.append('useBatch', 'on');
			formData.append('batchSize', batchSize.toString());
			formData.append('batchDelay', batchDelay.toString());
			formData.append('emailDelay', emailDelay.toString());
		}

		if (scheduleEmail) {
			formData.append('scheduleEmail', 'on');
			formData.append('scheduledTime', scheduledTime);
		}

		try {
			const res = await emailService.sendBulk(formData);
			if (res.success) {
				toast.success(res.message || 'Campaign started!');
				// Reset form or redirect
			} else {
				toast.error(res.message || 'Failed to start campaign');
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to start campaign');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="max-w-5xl mx-auto space-y-8 pb-12">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Create Campaign</h2>
			<p class="text-gray-500 mt-1">Design and send your bulk email campaign with precision.</p>
		</div>
		<div class="hidden sm:block">
			<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
				<Info class="h-4 w-4 mr-2" />
				Professional Mode Active
			</span>
		</div>
	</div>

	<form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Left Column: Editor & Settings -->
		<div class="lg:col-span-2 space-y-8">
			<!-- Basic Info Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
				<div class="space-y-2">
					<label for="subject" class="text-sm font-bold text-gray-700 ml-1">Email Subject</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<FileText class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="subject"
							bind:value={subject}
							type="text"
							placeholder="Enter a compelling subject line..."
							class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<span class="text-sm font-bold text-gray-700 ml-1">Email Content</span>
					<Editor bind:value={htmlContent} />
				</div>
			</div>

			<!-- Throttling & Scheduling Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900 flex items-center">
						<Clock class="h-5 w-5 mr-2 text-indigo-600" />
						Sending Strategy
					</h3>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Batch Settings -->
					<div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
						<div class="flex items-center justify-between">
							<label for="useBatch" class="font-bold text-gray-700">Batch Throttling</label>
							<input id="useBatch" type="checkbox" bind:checked={useBatch} class="w-5 h-5 text-indigo-600 rounded" />
						</div>
						{#if useBatch}
							<div class="space-y-3 pt-2">
								<div class="flex justify-between text-xs text-gray-500">
									<span>Batch Size</span>
									<span>{batchSize} emails</span>
								</div>
								<input type="range" min="5" max="100" bind:value={batchSize} class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
								
								<div class="flex justify-between text-xs text-gray-500">
									<span>Batch Delay</span>
									<span>{batchDelay} seconds</span>
								</div>
								<input type="range" min="10" max="300" step="10" bind:value={batchDelay} class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
							</div>
						{:else}
							<p class="text-xs text-gray-500 italic">Send all emails as fast as possible (standard limits apply).</p>
						{/if}
					</div>

					<!-- Scheduling Settings -->
					<div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
						<div class="flex items-center justify-between">
							<label for="scheduleEmail" class="font-bold text-gray-700">Schedule Campaign</label>
							<input id="scheduleEmail" type="checkbox" bind:checked={scheduleEmail} class="w-5 h-5 text-indigo-600 rounded" />
						</div>
						{#if scheduleEmail}
							<div class="space-y-2">
								<label for="scheduledTime" class="text-xs text-gray-500">Scheduled Time (Local)</label>
								<input 
									id="scheduledTime"
									type="datetime-local" 
									bind:value={scheduledTime}
									class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-indigo-500 text-sm"
								/>
							</div>
						{:else}
							<p class="text-xs text-gray-500 italic">Campaign will start immediately upon clicking "Send Now".</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column: Recipient & Config -->
		<div class="space-y-8">
			<!-- Configuration Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
				<h3 class="text-lg font-bold text-gray-900 flex items-center">
					<Settings class="h-5 w-5 mr-2 text-indigo-600" />
					SMTP Config
				</h3>
				
				<div class="space-y-3">
					{#if isLoadingConfigs}
						<div class="animate-pulse space-y-2">
							<div class="h-10 bg-gray-100 rounded-xl"></div>
							<div class="h-10 bg-gray-100 rounded-xl"></div>
						</div>
					{:else if configs.length === 0}
						<div class="text-center py-4 bg-red-50 rounded-xl border border-red-100">
							<p class="text-xs text-red-600">No SMTP settings found.</p>
							<a href="/dashboard/settings" class="text-xs font-bold text-red-700 underline">Add Settings</a>
						</div>
					{:else}
						<div class="space-y-2">
							{#each configs as config}
								<label class="flex items-center p-3 border {selectedConfigId === config.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white'} rounded-xl cursor-pointer transition-all hover:bg-gray-50">
									<input 
										type="radio" 
										name="config" 
										value={config.id} 
										bind:group={selectedConfigId}
										class="hidden"
									/>
									<div class="flex-1">
										<p class="text-sm font-bold text-gray-900">{config.name}</p>
										<p class="text-xs text-gray-500">{config.user}</p>
									</div>
									{#if selectedConfigId === config.id}
										<CheckCircle2 class="h-5 w-5 text-indigo-600" />
									{/if}
								</label>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Recipients Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
				<h3 class="text-lg font-bold text-gray-900 flex items-center">
					<Users class="h-5 w-5 mr-2 text-indigo-600" />
					Recipients
				</h3>

				<div class="space-y-4">
					<label for="excelFile" class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all">
						<div class="flex flex-col items-center justify-center pt-5 pb-6">
							<Upload class="h-8 w-8 text-gray-400 mb-2" />
							<p class="text-sm font-medium text-gray-600">
								{excelFile ? excelFile.name : 'Upload Excel file'}
							</p>
							<p class="text-xs text-gray-400 mt-1">.xlsx or .xls only</p>
						</div>
						<input id="excelFile" type="file" class="hidden" accept=".xlsx,.xls" onchange={handleFileChange} />
					</label>

					{#if contactPreview}
						<div class="p-4 bg-green-50 rounded-xl border border-green-100">
							<div class="flex items-center justify-between mb-3">
								<span class="text-xs font-bold text-green-700">Preview (Top 3)</span>
								<span class="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{contactPreview.totalCount} total</span>
							</div>
							<div class="space-y-2">
								{#each contactPreview.contacts.slice(0, 3) as contact}
									<div class="text-[10px] text-green-600 bg-white/50 px-2 py-1 rounded border border-green-100 truncate">
										{contact.Email || contact.email || 'N/A'} - {contact.Name || contact.name || 'N/A'}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Submit Button -->
			<button
				disabled={isSubmitting}
				type="submit"
				class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
			>
				{#if isSubmitting}
					<Loader2 class="animate-spin h-5 w-5" />
					<span>Launching...</span>
				{:else}
					<Send class="h-5 w-5" />
					<span>{scheduleEmail ? 'Schedule Campaign' : 'Send Now'}</span>
				{/if}
			</button>
		</div>
	</form>
</div>
