<svelte:head>
	<title>Declaring incidents — Haveri Docs</title>
</svelte:head>

<div class="docs-page">
	<div class="docs-layout">
		<aside class="docs-sidebar">
			<nav>
				<span class="sidebar-title">Documentation</span>
				<ul>
					<li><a href="/docs/getting-started" class="sidebar-link">Getting started</a></li>
					<li><a href="/docs/declaring-incidents" class="sidebar-link active">Declaring incidents</a></li>
					<li><a href="/docs/escalation-policies" class="sidebar-link">Escalation policies</a></li>
					<li><a href="/docs/teams-and-areas" class="sidebar-link">Teams &amp; areas</a></li>
					<li><a href="/docs/dashboard" class="sidebar-link">Dashboard</a></li>
				</ul>
			</nav>
		</aside>

		<div class="docs-content">
			<a href="/docs" class="back-link">&larr; All docs</a>
			<div class="prose">
				<h1>Declaring and managing incidents</h1>
				<p>
					Incidents in Haveri follow a simple lifecycle: declare, triage, investigate,
					resolve. Everything happens in Microsoft Teams.
				</p>

				<h2>Declaring an incident</h2>
				<p>
					In any Teams channel, type <code>/haveri declare</code>. You'll be prompted to provide:
				</p>
				<ul>
					<li><strong>Severity</strong> — SEV-1 (critical), SEV-2 (major), or SEV-3 (minor)</li>
					<li><strong>Description</strong> — a brief summary of what's happening</li>
					<li><strong>Area</strong> — the affected production area</li>
				</ul>
				<p>
					Haveri then creates a dedicated incident channel, notifies the appropriate team members
					based on your escalation policy, and starts the incident timer.
				</p>

				<h2>Severity levels</h2>
				<p>
					Use these as guidelines. Adapt them to your operation's context:
				</p>
				<ul>
					<li><strong>SEV-1 (Critical):</strong> Production stopped. Safety risk. Immediate action required.</li>
					<li><strong>SEV-2 (Major):</strong> Significant impact on production. Needs attention soon but not an emergency.</li>
					<li><strong>SEV-3 (Minor):</strong> Limited impact. Can be handled by the shift team without escalation.</li>
				</ul>

				<h2>During an incident</h2>
				<p>
					The incident channel is where all communication happens. Your team talks naturally —
					Haveri captures messages, timestamps them, and builds the incident timeline
					automatically.
				</p>
				<p>You can update the incident at any time:</p>
				<ul>
					<li><code>/haveri update</code> — change severity, add notes, or update the description</li>
					<li><code>/haveri escalate</code> — manually trigger the next escalation tier</li>
					<li><code>/haveri assign @person</code> — assign someone as incident lead</li>
				</ul>

				<h2>Resolving an incident</h2>
				<p>
					When the issue is fixed, type <code>/haveri resolve</code>. You'll be prompted to provide:
				</p>
				<ul>
					<li><strong>Root cause</strong> — what caused the incident</li>
					<li><strong>Resolution</strong> — what was done to fix it</li>
					<li><strong>Follow-ups</strong> — any actions needed to prevent recurrence</li>
				</ul>
				<p>
					The incident channel is archived (not deleted) so the full history remains
					searchable. Follow-up items are tracked in the dashboard.
				</p>

				<h2>Next steps</h2>
				<ul>
					<li><a href="/docs/escalation-policies">Configure escalation policies</a></li>
					<li><a href="/docs/dashboard">View incidents in the dashboard</a></li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.docs-page { padding-top: 5rem; }
	.docs-layout { display: grid; grid-template-columns: 220px 1fr; max-width: 1100px; margin: 0 auto; }
	.docs-sidebar { padding: 3rem 1.5rem 3rem 2rem; border-right: 1px solid var(--color-warm-200); position: sticky; top: 5rem; height: fit-content; }
	.sidebar-title { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-slate-400); display: block; margin-bottom: 1rem; }
	.docs-sidebar ul { list-style: none; display: flex; flex-direction: column; gap: 0.15rem; }
	.sidebar-link { display: block; padding: 0.4rem 0.75rem; font-size: 0.85rem; color: var(--color-slate-600); text-decoration: none; border-radius: 5px; transition: all 0.15s; }
	.sidebar-link:hover { background: var(--color-warm-100); color: var(--color-slate-900); }
	.sidebar-link.active { background: var(--color-amber-glow); color: var(--color-amber); font-weight: 500; }
	.docs-content { padding: 3rem 2rem 5rem 3rem; max-width: 720px; }
	.back-link { font-size: 0.82rem; color: var(--color-amber); text-decoration: none; display: inline-block; margin-bottom: 1.5rem; }
	.back-link:hover { text-decoration: underline; }
	@media (max-width: 768px) {
		.docs-layout { grid-template-columns: 1fr; }
		.docs-sidebar { position: static; border-right: none; border-bottom: 1px solid var(--color-warm-200); padding: 2rem; }
		.docs-sidebar ul { flex-direction: row; flex-wrap: wrap; gap: 0.25rem; }
		.docs-content { padding: 2rem; }
	}
</style>
