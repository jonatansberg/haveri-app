<svelte:head>
	<title>Dashboard — Haveri Docs</title>
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
					<li><a href="/docs/dashboard" class="sidebar-link active">Dashboard</a></li>
				</ul>
			</nav>
		</aside>

		<div class="docs-content">
			<a href="/docs" class="back-link">&larr; All docs</a>
			<div class="prose">
				<h1>Dashboard</h1>
				<p>
					The Haveri dashboard is your web-based view of all incident activity.
					Access it at <code>app.haveri.app</code> with your Haveri account.
				</p>

				<h2>Incident list</h2>
				<p>
					The main view shows all incidents — active and resolved. Filter by severity,
					area, date range, or status. Each incident links to its full timeline.
				</p>

				<h2>Incident timeline</h2>
				<p>
					Click any incident to see the complete timeline: every message, status change,
					escalation, and resolution detail. This is the auto-generated record that
					your team creates just by communicating in the incident channel.
				</p>

				<h2>Follow-ups</h2>
				<p>
					The follow-ups view shows all open action items across incidents. Each item
					has an owner, a due date, and a link back to the source incident. Mark items
					complete as they're addressed.
				</p>

				<h2>Analytics (Team plan)</h2>
				<p>
					On the Team plan, the dashboard includes analytics:
				</p>
				<ul>
					<li><strong>Incident volume</strong> — trends over time, by severity</li>
					<li><strong>Resolution time</strong> — average time from declaration to resolution</li>
					<li><strong>Recurring equipment</strong> — which equipment or areas generate the most incidents</li>
					<li><strong>Follow-up completion rate</strong> — how many action items are getting done</li>
				</ul>

				<h2>Settings</h2>
				<p>
					From the dashboard, you can manage:
				</p>
				<ul>
					<li>Facility configuration</li>
					<li>Teams and team members</li>
					<li>Areas</li>
					<li>Escalation policies</li>
					<li>Integrations</li>
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
