<svelte:head>
	<title>Escalation policies — Haveri Docs</title>
</svelte:head>

<div class="docs-page">
	<div class="docs-layout">
		<aside class="docs-sidebar">
			<nav>
				<span class="sidebar-title">Documentation</span>
				<ul>
					<li><a href="/docs/getting-started" class="sidebar-link">Getting started</a></li>
					<li><a href="/docs/declaring-incidents" class="sidebar-link">Declaring incidents</a></li>
					<li><a href="/docs/escalation-policies" class="sidebar-link active">Escalation policies</a></li>
					<li><a href="/docs/teams-and-areas" class="sidebar-link">Teams &amp; areas</a></li>
					<li><a href="/docs/dashboard" class="sidebar-link">Dashboard</a></li>
				</ul>
			</nav>
		</aside>

		<div class="docs-content">
			<a href="/docs" class="back-link">&larr; All docs</a>
			<div class="prose">
				<h1>Escalation policies</h1>
				<p>
					Escalation policies define who gets notified when an incident is declared,
					and what happens if nobody responds. They replace the "call whoever you can think of"
					approach with clear, automated rules.
				</p>

				<h2>How policies work</h2>
				<p>
					Each escalation policy has one or more tiers. When an incident is declared,
					the first tier is notified. If nobody acknowledges within the configured window,
					Haveri automatically notifies the next tier.
				</p>

				<h2>Creating a policy</h2>
				<p>
					In the Haveri dashboard, navigate to <strong>Settings &rarr; Escalation Policies</strong>.
					Each policy needs:
				</p>
				<ul>
					<li><strong>A name</strong> — e.g., "SEV-1 Critical" or "Night shift default"</li>
					<li><strong>Applicable severities</strong> — which severity levels trigger this policy</li>
					<li><strong>Tiers</strong> — the notification sequence</li>
				</ul>

				<h3>Example policy: SEV-2 Major</h3>
				<ul>
					<li><strong>Tier 1:</strong> Notify the on-duty shift team. Wait 15 minutes.</li>
					<li><strong>Tier 2:</strong> Notify the area lead. Wait 15 minutes.</li>
					<li><strong>Tier 3:</strong> Notify the production manager.</li>
				</ul>

				<h2>Time-of-day rules</h2>
				<p>
					Policies can vary by time of day. A common pattern is to have a more aggressive
					escalation path during night shifts (when fewer people are available) and a
					broader notification during day shifts.
				</p>

				<h2>Area-specific policies</h2>
				<p>
					Different production areas can have different policies. A critical area (e.g.,
					a high-speed packaging line) might escalate faster than a non-critical area
					(e.g., a storage facility).
				</p>

				<h2>Manual escalation</h2>
				<p>
					Any team member can manually escalate at any time by typing
					<code>/haveri escalate</code> in the incident channel. This immediately
					triggers the next tier, regardless of the timer.
				</p>

				<h2>Next steps</h2>
				<ul>
					<li><a href="/docs/teams-and-areas">Set up your teams and areas</a></li>
					<li><a href="/docs/declaring-incidents">Learn about declaring incidents</a></li>
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
