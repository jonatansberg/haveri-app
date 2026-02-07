<svelte:head>
	<title>Docs — Haveri</title>
	<meta name="description" content="Get started with Haveri. Setup guides, workflow documentation, and troubleshooting." />
</svelte:head>

<div class="docs-page">
	<div class="docs-layout">
		<aside class="docs-sidebar">
			<nav>
				<span class="sidebar-title">Documentation</span>
				<ul>
					<li><a href="/docs/getting-started" class="sidebar-link">Getting started</a></li>
					<li><a href="/docs/declaring-incidents" class="sidebar-link">Declaring incidents</a></li>
					<li><a href="/docs/escalation-policies" class="sidebar-link">Escalation policies</a></li>
					<li><a href="/docs/teams-and-areas" class="sidebar-link">Teams &amp; areas</a></li>
					<li><a href="/docs/dashboard" class="sidebar-link">Dashboard</a></li>
				</ul>
			</nav>
		</aside>

		<div class="docs-content">
			<span class="section-label">Documentation</span>
			<h1>Haveri Documentation</h1>
			<p class="docs-lead">
				Everything you need to set up and run Haveri for your team.
				Most teams are live within 30 minutes.
			</p>

			<div class="docs-grid">
				<a href="/docs/getting-started" class="doc-card">
					<h3>Getting started</h3>
					<p>Install the Teams app, connect your first facility, and run your first incident.</p>
				</a>
				<a href="/docs/declaring-incidents" class="doc-card">
					<h3>Declaring incidents</h3>
					<p>How to declare, triage, and resolve incidents from Microsoft Teams.</p>
				</a>
				<a href="/docs/escalation-policies" class="doc-card">
					<h3>Escalation policies</h3>
					<p>Configure who gets notified, when, and how auto-escalation works.</p>
				</a>
				<a href="/docs/teams-and-areas" class="doc-card">
					<h3>Teams &amp; areas</h3>
					<p>Organize your facility into teams and production areas.</p>
				</a>
				<a href="/docs/dashboard" class="doc-card">
					<h3>Dashboard</h3>
					<p>View incident history, timelines, analytics, and follow-up status.</p>
				</a>
			</div>

			<div class="docs-help">
				<h3>Need help?</h3>
				<p>
					Can't find what you're looking for? Reach out at
					<a href="mailto:hello@haveri.app">hello@haveri.app</a> and we'll help you directly.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.docs-page {
		padding-top: 5rem;
	}

	.docs-layout {
		display: grid;
		grid-template-columns: 220px 1fr;
		max-width: 1100px;
		margin: 0 auto;
		min-height: calc(100vh - 5rem);
	}

	.docs-sidebar {
		padding: 3rem 1.5rem 3rem 2rem;
		border-right: 1px solid var(--color-warm-200);
		position: sticky;
		top: 5rem;
		height: fit-content;
	}

	.sidebar-title {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-slate-400);
		display: block;
		margin-bottom: 1rem;
	}

	.docs-sidebar ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.sidebar-link {
		display: block;
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
		color: var(--color-slate-600);
		text-decoration: none;
		border-radius: 5px;
		transition: all 0.15s;
	}

	.sidebar-link:hover {
		background: var(--color-warm-100);
		color: var(--color-slate-900);
	}

	.docs-content {
		padding: 3rem 2rem 5rem 3rem;
		max-width: 720px;
	}

	h1 {
		font-family: var(--font-display);
		font-size: 2.2rem;
		font-weight: 400;
		color: var(--color-slate-950);
		letter-spacing: -0.025em;
		margin-top: 0.5rem;
	}

	.docs-lead {
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		margin-top: 1rem;
		max-width: 480px;
	}

	.docs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 2.5rem;
	}

	.doc-card {
		display: block;
		padding: 1.5rem;
		background: var(--color-warm-white);
		border: 1px solid var(--color-warm-200);
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.2s;
	}

	.doc-card:hover {
		border-color: var(--color-warm-300);
		box-shadow: 0 4px 20px rgba(26, 29, 35, 0.04);
		transform: translateY(-1px);
	}

	.doc-card h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-slate-900);
		margin-bottom: 0.35rem;
	}

	.doc-card p {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-slate-500);
	}

	.docs-help {
		margin-top: 3rem;
		padding: 1.5rem;
		background: var(--color-warm-100);
		border-radius: 8px;
	}

	.docs-help h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-slate-900);
		margin-bottom: 0.35rem;
	}

	.docs-help p {
		font-size: 0.88rem;
		color: var(--color-slate-500);
	}

	.docs-help a {
		color: var(--color-amber);
	}

	@media (max-width: 768px) {
		.docs-layout {
			grid-template-columns: 1fr;
		}

		.docs-sidebar {
			position: static;
			border-right: none;
			border-bottom: 1px solid var(--color-warm-200);
			padding: 2rem 2rem 1.5rem;
		}

		.docs-sidebar ul {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.25rem;
		}

		.docs-content {
			padding: 2rem;
		}

		.docs-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
