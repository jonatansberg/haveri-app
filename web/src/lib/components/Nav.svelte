<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let scrolled = $state(false);
	let mobileOpen = $state(false);

	onMount(() => {
		const handler = () => {
			scrolled = window.scrollY > 40;
		};
		window.addEventListener('scroll', handler);
		return () => window.removeEventListener('scroll', handler);
	});

	const links = [
		{ href: '/how-it-works', label: 'How it works' },
		{ href: '/pricing', label: 'Pricing' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/docs', label: 'Docs' },
		{ href: '/about', label: 'About' }
	];

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<nav class:scrolled>
	<a href="/" class="nav-logo">haveri</a>

	<button class="mobile-toggle" onclick={() => (mobileOpen = !mobileOpen)} aria-label="Toggle menu">
		{#if mobileOpen}
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M5 5l10 10M15 5L5 15" />
			</svg>
		{:else}
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M3 6h14M3 10h14M3 14h14" />
			</svg>
		{/if}
	</button>

	<ul class="nav-links" class:open={mobileOpen}>
		{#each links as link}
			<li>
				<a
					href={link.href}
					class:active={$page.url.pathname.startsWith(link.href)}
					onclick={closeMobile}
				>
					{link.label}
				</a>
			</li>
		{/each}
		<li class="nav-cta">
			<a href="/contact" class="btn-primary" onclick={closeMobile}>Get early access</a>
		</li>
	</ul>
</nav>

{#if mobileOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="mobile-overlay" onclick={closeMobile} onkeydown={closeMobile}></div>
{/if}

<style>
	nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: 1.25rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: background 0.4s, backdrop-filter 0.4s;
	}

	nav.scrolled {
		background: rgba(248, 246, 243, 0.85);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--color-warm-200);
	}

	.nav-logo {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 500;
		color: var(--color-slate-900);
		letter-spacing: -0.02em;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 2.5rem;
		list-style: none;
	}

	.nav-links a {
		font-size: 0.875rem;
		color: var(--color-slate-600);
		text-decoration: none;
		letter-spacing: 0.01em;
		transition: color 0.2s;
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: var(--color-slate-900);
	}

	.nav-links a:global(.btn-primary) {
		color: var(--color-warm-white);
		font-size: 0.82rem;
	}

	.nav-links a:global(.btn-primary):hover {
		color: var(--color-warm-white);
	}

	.nav-cta {
		margin-left: 0.5rem;
		padding-left: 1rem;
		border-left: 1px solid var(--color-warm-200);
	}

	.mobile-toggle {
		display: none;
		background: none;
		border: none;
		color: var(--color-slate-700);
		cursor: pointer;
		padding: 0.5rem;
	}

	.mobile-overlay {
		display: none;
	}

	@media (max-width: 900px) {
		.mobile-toggle {
			display: flex;
			align-items: center;
		}

		.nav-links {
			display: none;
			position: fixed;
			top: 60px;
			left: 0;
			right: 0;
			background: rgba(248, 246, 243, 0.98);
			backdrop-filter: blur(20px);
			flex-direction: column;
			padding: 1.5rem 2rem 2rem;
			gap: 0;
			border-bottom: 1px solid var(--color-warm-200);
		}

		.nav-links.open {
			display: flex;
		}

		.nav-links li {
			width: 100%;
		}

		.nav-links a {
			display: block;
			padding: 0.75rem 0;
			font-size: 1rem;
		}

		.nav-cta {
			margin-left: 0;
			padding-left: 0;
			border-left: none;
			margin-top: 1rem;
			padding-top: 1rem;
			border-top: 1px solid var(--color-warm-200);
		}

		.mobile-overlay {
			display: block;
			position: fixed;
			inset: 0;
			top: 60px;
			z-index: 99;
			background: rgba(0, 0, 0, 0.2);
		}
	}
</style>
