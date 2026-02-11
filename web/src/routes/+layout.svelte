<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="description" content="Haveri — incident management for teams that build real things. Structured, chat-native, and designed to make your operation smarter with every incident." />
</svelte:head>

<Nav />
<main>
	{@render children()}
</main>
<Footer />
