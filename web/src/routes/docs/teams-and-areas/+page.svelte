<svelte:head>
	<title>Teams &amp; areas — Haveri Docs</title>
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
					<li><a href="/docs/teams-and-areas" class="sidebar-link active">Teams &amp; areas</a></li>
					<li><a href="/docs/dashboard" class="sidebar-link">Dashboard</a></li>
				</ul>
			</nav>
		</aside>

		<div class="docs-content">
			<a href="/docs" class="back-link">&larr; All docs</a>
			<div class="prose">
				<h1>Teams &amp; areas</h1>
				<p>
					Organize your facility by defining teams (groups of people) and areas
					(physical sections of your facility). This structure powers escalation
					policies and incident routing.
				</p>

				<h2>Areas</h2>
				<p>
					An area represents a physical section of your facility. Examples: "Line 1",
					"Packaging", "Cooling", "Warehouse". When declaring an incident, the person
					selects the affected area.
				</p>
				<p>
					Areas help with:
				</p>
				<ul>
					<li>Routing incidents to the right team</li>
					<li>Area-specific escalation policies</li>
					<li>Incident analytics by location</li>
				</ul>

				<h2>Teams</h2>
				<p>
					A team is a group of people who respond to incidents. Common team structures:
				</p>
				<ul>
					<li><strong>Shift teams:</strong> "Shift A", "Shift B", "Night shift"</li>
					<li><strong>Area teams:</strong> "Line 1 team", "Packaging team"</li>
					<li><strong>Management:</strong> "Area leads", "Production management"</li>
				</ul>

				<h2>Managing teams</h2>
				<p>
					In the dashboard, go to <strong>Settings &rarr; Teams</strong> to create and manage teams.
					Each team member is linked to their Microsoft Teams account, which is how they receive notifications.
				</p>

				<h2>On-duty schedules</h2>
				<p>
					You can mark teams as "on-duty" or "off-duty". When an incident is declared,
					Haveri prioritizes notifying the on-duty team. This is particularly useful for
					shift-based operations where different teams are responsible at different times.
				</p>

				<h2>Next steps</h2>
				<ul>
					<li><a href="/docs/escalation-policies">Set up escalation policies that use your teams</a></li>
					<li><a href="/docs/dashboard">View team and area analytics</a></li>
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
