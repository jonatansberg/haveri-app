<svelte:head>
	<title>Changelog — Haveri</title>
	<meta name="description" content="Product updates and improvements to Haveri." />
</svelte:head>

<div class="changelog-page">
	<section class="changelog-hero">
		<div class="changelog-inner">
			<span class="section-label">Changelog</span>
			<h1 class="changelog-title">What's new in Haveri</h1>
			<p class="changelog-lead">
				Product updates, improvements, and fixes. We ship regularly and
				document everything here.
			</p>
		</div>
	</section>

	<section class="entries-section">
		<div class="changelog-inner">
			<div class="changelog-entry">
				<div class="entry-date">February 7, 2026</div>
				<div class="entry-content">
					<h2>Launch of early access</h2>
					<div class="entry-tags">
						<span class="tag tag-new">New</span>
					</div>
					<ul>
						<li>Incident lifecycle: declare, triage, investigate, resolve from Microsoft Teams</li>
						<li>Automatic incident timelines built from team conversations</li>
						<li>Configurable escalation policies with severity-based routing</li>
						<li>Auto-escalation when incidents aren't acknowledged</li>
						<li>Follow-up action items created at resolution, tracked in dashboard</li>
						<li>Web dashboard with incident history, timelines, and follow-up management</li>
						<li>Facility, team, and area configuration</li>
					</ul>
					<p class="entry-note">
						We're onboarding a small number of manufacturing teams for early access.
						<a href="/contact">Get in touch</a> if you'd like to be part of it.
					</p>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.changelog-page {
		padding-top: 5rem;
	}

	.changelog-inner {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.changelog-hero {
		padding: 5rem 0 3rem;
	}

	.changelog-title {
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		margin-top: 0.5rem;
	}

	.changelog-lead {
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 440px;
		margin-top: 1rem;
	}

	.entries-section {
		padding: 0 0 6rem;
	}

	.changelog-entry {
		display: grid;
		grid-template-columns: 160px 1fr;
		gap: 2rem;
		padding: 2rem 0;
		border-top: 1px solid var(--color-warm-200);
	}

	.entry-date {
		font-size: 0.82rem;
		color: var(--color-slate-400);
		font-variant-numeric: tabular-nums;
		padding-top: 0.15rem;
	}

	.entry-content h2 {
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 500;
		color: var(--color-slate-950);
		margin-bottom: 0.75rem;
	}

	.entry-tags {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.tag {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.15rem 0.5rem;
		border-radius: 3px;
	}

	.tag-new {
		background: rgba(90, 154, 106, 0.12);
		color: var(--color-sev3);
	}

	.entry-content ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.entry-content li {
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--color-slate-600);
		padding-left: 1.25rem;
		position: relative;
	}

	.entry-content li::before {
		content: '—';
		position: absolute;
		left: 0;
		color: var(--color-warm-300);
	}

	.entry-note {
		margin-top: 1rem;
		font-size: 0.85rem;
		color: var(--color-slate-500);
		padding: 0.75rem 1rem;
		background: var(--color-warm-100);
		border-radius: 6px;
	}

	.entry-note a {
		color: var(--color-amber);
		text-decoration: none;
	}

	.entry-note a:hover {
		text-decoration: underline;
	}

	@media (max-width: 600px) {
		.changelog-entry {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
	}
</style>
