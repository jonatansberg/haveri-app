<svelte:head>
	<title>Getting started — Haveri Docs</title>
</svelte:head>

<div class="docs-page">
	<div class="docs-layout">
		<aside class="docs-sidebar">
			<nav>
				<span class="sidebar-title">Documentation</span>
				<ul>
					<li><a href="/docs/getting-started" class="sidebar-link active">Getting started</a></li>
					<li><a href="/docs/declaring-incidents" class="sidebar-link">Declaring incidents</a></li>
					<li><a href="/docs/escalation-policies" class="sidebar-link">Escalation policies</a></li>
					<li><a href="/docs/teams-and-areas" class="sidebar-link">Teams &amp; areas</a></li>
					<li><a href="/docs/dashboard" class="sidebar-link">Dashboard</a></li>
				</ul>
			</nav>
		</aside>

		<div class="docs-content">
			<a href="/docs" class="back-link">&larr; All docs</a>
			<div class="prose">
				<h1>Getting started</h1>
				<p>
					This guide walks you through installing Haveri, connecting your first facility,
					and running your first incident. Most teams complete setup in under 30 minutes.
				</p>

				<h2>Prerequisites</h2>
				<ul>
					<li>An active Microsoft Teams subscription</li>
					<li>Admin permissions to install Teams apps (or access to someone who has them)</li>
					<li>A Haveri account (request one from your <a href="/contact">early access signup</a>)</li>
				</ul>

				<h2>Step 1: Install the Teams app</h2>
				<p>
					Once you have a Haveri account, you'll receive a link to install the Haveri bot
					in your Microsoft Teams workspace. Click the link and follow the Teams installation
					prompts. The app requires permissions to:
				</p>
				<ul>
					<li>Read and send messages in channels</li>
					<li>Create new channels (for incident-specific channels)</li>
					<li>Send notifications to team members</li>
				</ul>

				<h2>Step 2: Connect your facility</h2>
				<p>
					After installation, open a chat with the Haveri bot and type
					<code>/haveri setup</code>. You'll be guided through:
				</p>
				<ol>
					<li><strong>Naming your facility</strong> — the physical location (e.g., "North Plant", "Building A")</li>
					<li><strong>Defining areas</strong> — the sections of your facility (e.g., "Line 1", "Packaging", "Cooling")</li>
					<li><strong>Adding team members</strong> — who should be available for incident response</li>
				</ol>

				<h2>Step 3: Configure a basic escalation policy</h2>
				<p>
					Haveri comes with a default escalation policy that notifies the full team for
					all severities. You'll want to customize this. See
					<a href="/docs/escalation-policies">Escalation policies</a> for details.
				</p>
				<p>
					For a quick start, we recommend at minimum defining who should be notified for
					SEV-1 (critical) incidents versus SEV-3 (minor) ones.
				</p>

				<h2>Step 4: Declare a test incident</h2>
				<p>
					You're ready. In any Teams channel, type <code>/haveri declare</code> to create
					your first incident. Pick SEV-3, give it a test description, and walk through
					the full lifecycle: declare, investigate, resolve.
				</p>
				<p>
					This gives your team a feel for the workflow before a real incident happens.
				</p>

				<h2>What's next</h2>
				<ul>
					<li><a href="/docs/declaring-incidents">Learn about declaring and managing incidents</a></li>
					<li><a href="/docs/escalation-policies">Configure your escalation policies</a></li>
					<li><a href="/docs/teams-and-areas">Set up your teams and production areas</a></li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.docs-page { padding-top: 5rem; }

	.docs-layout {
		display: grid;
		grid-template-columns: 220px 1fr;
		max-width: 1100px;
		margin: 0 auto;
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

	.docs-sidebar ul { list-style: none; display: flex; flex-direction: column; gap: 0.15rem; }

	.sidebar-link {
		display: block;
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
		color: var(--color-slate-600);
		text-decoration: none;
		border-radius: 5px;
		transition: all 0.15s;
	}

	.sidebar-link:hover { background: var(--color-warm-100); color: var(--color-slate-900); }
	.sidebar-link.active { background: var(--color-amber-glow); color: var(--color-amber); font-weight: 500; }

	.docs-content { padding: 3rem 2rem 5rem 3rem; max-width: 720px; }

	.back-link {
		font-size: 0.82rem;
		color: var(--color-amber);
		text-decoration: none;
		display: inline-block;
		margin-bottom: 1.5rem;
	}

	.back-link:hover { text-decoration: underline; }

	@media (max-width: 768px) {
		.docs-layout { grid-template-columns: 1fr; }
		.docs-sidebar { position: static; border-right: none; border-bottom: 1px solid var(--color-warm-200); padding: 2rem; }
		.docs-sidebar ul { flex-direction: row; flex-wrap: wrap; gap: 0.25rem; }
		.docs-content { padding: 2rem; }
	}
</style>
