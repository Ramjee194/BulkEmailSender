<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import 'quill/dist/quill.snow.css';

	let { value = $bindable(''), placeholder = 'Compose your email...' } = $props();
	let editorElement: HTMLDivElement;
	let quill: any;

	onMount(async () => {
		const Quill = (await import('quill')).default;
		
		quill = new Quill(editorElement, {
			modules: {
				toolbar: [
					[{ header: [1, 2, 3, false] }],
					['bold', 'italic', 'underline', 'strike'],
					[{ list: 'ordered' }, { list: 'bullet' }],
					[{ color: [] }, { background: [] }],
					['link', 'clean']
				]
			},
			placeholder,
			theme: 'snow'
		});

		quill.on('text-change', () => {
			value = quill.root.innerHTML;
		});

		// Initial value
		if (value) {
			quill.root.innerHTML = value;
		}
	});

	// React to value changes from outside (optional, but good for resetting)
	$effect(() => {
		if (quill && value !== quill.root.innerHTML) {
			// Only update if it's actually different to avoid cursor jumps
			// quill.root.innerHTML = value;
		}
	});
</script>

<div class="quill-container">
	<div bind:this={editorElement} class="min-h-[300px] rounded-b-xl"></div>
</div>

<style>
	:global(.ql-toolbar.ql-snow) {
		border-top-left-radius: 0.75rem;
		border-top-right-radius: 0.75rem;
		border-color: #e5e7eb;
		background-color: #f9fafb;
	}
	:global(.ql-container.ql-snow) {
		border-bottom-left-radius: 0.75rem;
		border-bottom-right-radius: 0.75rem;
		border-color: #e5e7eb;
		font-family: inherit;
		font-size: 1rem;
	}
</style>
