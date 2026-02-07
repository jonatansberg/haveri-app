<script lang="ts">
	import { onMount } from 'svelte';

	let activeStep = $state(0);
	const steps = [
		{
			label: 'Declare',
			title: 'One command starts the process',
			description: 'A team member types /haveri in Teams. They pick a severity, describe the issue, and select the affected area. That\'s it — Haveri handles the rest.',
			detail: 'A dedicated incident channel is created instantly. The right team is notified based on your escalation policy. The clock starts.',
			mockup: 'declare'
		},
		{
			label: 'Triage',
			title: 'The right people, not just the next person up',
			description: 'Not every incident needs the boss\'s boss. A hydraulics issue needs the hydraulics technician. A cooling system failure might need an external contractor. Haveri routes to the people who can actually help.',
			detail: 'Routing is based on what\'s wrong — equipment, area, problem type — not just who\'s senior. If nobody acknowledges, Haveri widens the net automatically.',
			mockup: 'triage'
		},
		{
			label: 'Investigate',
			title: 'Work the problem, not the process',
			description: 'Your team communicates naturally in the incident channel. Haveri captures everything — messages, status updates, attachments — and builds a structured timeline automatically.',
			detail: 'When Haveri detects a similar past incident, it surfaces the previous resolution. Your team gets the answer before they even ask.',
			mockup: 'investigate'
		},
		{
			label: 'Resolve',
			title: 'Close it out, cleanly',
			description: 'When the issue is fixed, the incident commander resolves it. Haveri records the duration, root cause, and any follow-up actions needed.',
			detail: 'Follow-up items are tracked to completion — not left in a chat message that nobody will scroll back to find.',
			mockup: 'resolve'
		},
		{
			label: 'Learn',
			title: 'Every incident makes you smarter',
			description: 'The complete incident timeline is preserved as a searchable record. Root causes, resolution steps, who was involved, and what was tried — all captured automatically.',
			detail: 'Over time, patterns emerge. Recurring equipment issues, common root causes, and areas that need attention become visible in your dashboard.',
			mockup: 'learn'
		}
	];

	onMount(() => {
		const reveals = document.querySelectorAll('.reveal');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) entry.target.classList.add('visible');
				});
			},
			{ threshold: 0.15 }
		);
		reveals.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>How it works — Haveri</title>
	<meta name="description" content="Walk through the incident lifecycle with Haveri: declare, triage, investigate, resolve, learn. See how it replaces the group chat chaos." />
</svelte:head>

<div class="hiw-page">
	<section class="hiw-hero">
		<div class="hiw-inner">
			<span class="section-label">How it works</span>
			<h1 class="hiw-title">Five steps from chaos to clarity.</h1>
			<p class="hiw-lead">
				Haveri structures the entire incident lifecycle — from the moment something breaks
				to the follow-up that prevents it from happening again. Here's the complete walkthrough.
			</p>
		</div>
	</section>

	<!-- LIFECYCLE STEPS -->
	<section class="lifecycle-section">
		<div class="hiw-inner">
			<!-- Step navigation -->
			<div class="step-nav reveal">
				{#each steps as step, i}
					<button
						class="step-tab"
						class:active={activeStep === i}
						onclick={() => (activeStep = i)}
					>
						<span class="step-num">{i + 1}</span>
						<span class="step-name">{step.label}</span>
					</button>
					{#if i < steps.length - 1}
						<div class="step-connector" class:passed={activeStep > i}></div>
					{/if}
				{/each}
			</div>

			<!-- Step content -->
			{#key activeStep}
				<div class="step-content reveal visible">
					<div class="step-text">
						<h2>{steps[activeStep].title}</h2>
						<p class="step-desc">{steps[activeStep].description}</p>
						<p class="step-detail">{steps[activeStep].detail}</p>
					</div>
					<div class="step-visual">
						{#if steps[activeStep].mockup === 'declare'}
							<div class="mockup-card">
								<div class="mockup-header">
									<span class="mockup-title">New incident</span>
								</div>
								<div class="mockup-body">
									<div class="mock-field">
										<span class="mock-label">Severity</span>
										<div class="mock-select">
											<span class="sev-dot sev2"></span> SEV-2
										</div>
									</div>
									<div class="mock-field">
										<span class="mock-label">Description</span>
										<div class="mock-input">Pressure drop on Line 2, South Hall</div>
									</div>
									<div class="mock-field">
										<span class="mock-label">Area</span>
										<div class="mock-select">Line 2 &middot; South Hall</div>
									</div>
									<div class="mock-btn">Declare incident</div>
								</div>
							</div>
						{:else if steps[activeStep].mockup === 'triage'}
							<div class="mockup-card">
								<div class="mockup-header">
									<span class="mockup-title">Incident routing</span>
									<span class="mockup-badge">SEV-2 &middot; Pressure</span>
								</div>
								<div class="mockup-body">
									<div class="routing-match">
										<div class="routing-match-label">Matched by</div>
										<div class="routing-tags">
											<span class="routing-tag">Line 2</span>
											<span class="routing-tag">Pressure</span>
											<span class="routing-tag">On-duty</span>
										</div>
									</div>
									<div class="escalation-tier">
										<div class="tier-label">Routed to</div>
										<div class="tier-target">Shift team B &middot; Hydraulics</div>
										<div class="tier-status notified">Notified</div>
									</div>
									<div class="escalation-tier">
										<div class="tier-label">Also notified</div>
										<div class="tier-target">Erik Svensson &middot; Line 2 lead</div>
										<div class="tier-status notified">Notified</div>
									</div>
									<div class="escalation-tier">
										<div class="tier-label">If no ack (15 min)</div>
										<div class="tier-target">All shift B + Area lead</div>
										<div class="tier-status pending">Standby</div>
									</div>
								</div>
							</div>
						{:else if steps[activeStep].mockup === 'investigate'}
							<div class="mockup-card">
								<div class="mockup-header">
									<span class="mockup-title">Incident timeline</span>
									<span class="mockup-badge">Live</span>
								</div>
								<div class="mockup-body">
									<div class="tl-entry">
										<span class="tl-time">14:32</span>
										<span class="tl-dot declaration"></span>
										<span class="tl-text"><strong>Anna</strong> declared SEV-2 incident</span>
									</div>
									<div class="tl-entry">
										<span class="tl-time">14:33</span>
										<span class="tl-dot"></span>
										<span class="tl-text"><strong>Anna:</strong> Pressure at 0.2 bar, expected 1.5</span>
									</div>
									<div class="tl-entry insight">
										<span class="tl-time">14:34</span>
										<span class="tl-dot amber"></span>
										<span class="tl-text"><strong>haveri:</strong> Similar to INC-2801 — worn seal, DN50 EPDM</span>
									</div>
									<div class="tl-entry">
										<span class="tl-time">14:41</span>
										<span class="tl-dot"></span>
										<span class="tl-text"><strong>Anna:</strong> Confirmed seal failure. Replacing now.</span>
									</div>
								</div>
							</div>
						{:else if steps[activeStep].mockup === 'resolve'}
							<div class="mockup-card">
								<div class="mockup-header">
									<span class="mockup-title">Resolve incident</span>
								</div>
								<div class="mockup-body">
									<div class="mock-field">
										<span class="mock-label">Root cause</span>
										<div class="mock-input">Worn valve seal (DN50 EPDM)</div>
									</div>
									<div class="mock-field">
										<span class="mock-label">Resolution</span>
										<div class="mock-input">Seal replaced. Pressure restored to 1.5 bar.</div>
									</div>
									<div class="mock-field">
										<span class="mock-label">Follow-up</span>
										<div class="mock-input followup">Review seal replacement schedule for Line 2 main valve</div>
									</div>
									<div class="resolve-stats">
										<div class="stat">
											<span class="stat-value">26 min</span>
											<span class="stat-label">Duration</span>
										</div>
										<div class="stat">
											<span class="stat-value">4</span>
											<span class="stat-label">People involved</span>
										</div>
										<div class="stat">
											<span class="stat-value">1</span>
											<span class="stat-label">Follow-up</span>
										</div>
									</div>
									<div class="mock-btn resolve">Mark as resolved</div>
								</div>
							</div>
						{:else}
							<div class="mockup-card">
								<div class="mockup-header">
									<span class="mockup-title">Dashboard</span>
									<span class="mockup-badge">Last 30 days</span>
								</div>
								<div class="mockup-body">
									<div class="dash-stats">
										<div class="dash-stat">
											<span class="dash-val">12</span>
											<span class="dash-label">Incidents</span>
										</div>
										<div class="dash-stat">
											<span class="dash-val">34 min</span>
											<span class="dash-label">Avg. resolution</span>
										</div>
										<div class="dash-stat">
											<span class="dash-val">3</span>
											<span class="dash-label">Recurring</span>
										</div>
									</div>
									<div class="dash-pattern">
										<span class="dash-pattern-label">Top recurring equipment</span>
										<div class="dash-bar">
											<span class="dash-bar-label">Line 2 main valve</span>
											<div class="dash-bar-fill" style="width: 75%"></div>
											<span class="dash-bar-count">3</span>
										</div>
										<div class="dash-bar">
											<span class="dash-bar-label">Cooling unit 4A</span>
											<div class="dash-bar-fill" style="width: 50%"></div>
											<span class="dash-bar-count">2</span>
										</div>
										<div class="dash-bar">
											<span class="dash-bar-label">Packaging conveyor</span>
											<div class="dash-bar-fill" style="width: 25%"></div>
											<span class="dash-bar-count">1</span>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/key}
		</div>
	</section>

	<!-- INTELLIGENT ROUTING -->
	<section class="escalation-section">
		<div class="hiw-inner">
			<div class="esc-split reveal">
				<div>
					<span class="section-label">Intelligent routing</span>
					<h2 class="section-heading">Get the right people, not just the next person&nbsp;up.</h2>
					<p class="section-text">
						Not every incident needs the boss's boss. Sometimes you need the electrician
						who knows Line 3, or the external contractor for the cooling system. Haveri
						routes incidents to the people who can actually help — based on what's wrong,
						not just who's senior.
					</p>
					<ul class="esc-list">
						<li><strong>Skill and area-based routing.</strong> Match incidents to the people and teams who know that equipment, that area, that type of problem.</li>
						<li><strong>Time-aware.</strong> Different on-call groups for day and night shifts. Haveri knows who's available.</li>
						<li><strong>Auto-escalation as a fallback.</strong> If nobody acknowledges within your window, Haveri widens the net — but the first notification goes to the right place, not the top of the org chart.</li>
						<li><strong>External contacts.</strong> Some problems need a vendor or contractor. They can be part of the routing too.</li>
					</ul>
				</div>
				<div class="esc-visual">
					<div class="mockup-card">
						<div class="mockup-header">
							<span class="mockup-title">Routing rules</span>
						</div>
						<div class="mockup-body">
							<div class="policy-row">
								<div class="policy-name">Hydraulics &middot; Line 1–3</div>
								<div class="policy-detail">Hydraulics team (on-duty) + Area lead. Fallback: all shift + maintenance mgr.</div>
							</div>
							<div class="policy-row">
								<div class="policy-name">Cooling &middot; All areas</div>
								<div class="policy-detail">Cooling technicians + Kylservice AB (external). Fallback: shift team + area lead.</div>
							</div>
							<div class="policy-row">
								<div class="policy-name">Electrical &middot; South Hall</div>
								<div class="policy-detail">Erik S. + Shift electrician (on-duty). Fallback: all electricians + safety officer.</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- FOLLOW-UPS -->
	<section class="followups-section">
		<div class="hiw-inner">
			<div class="fu-split reveal">
				<div class="fu-visual">
					<div class="mockup-card">
						<div class="mockup-header">
							<span class="mockup-title">Follow-ups from INC-2847</span>
							<span class="mockup-badge">2 pushed</span>
						</div>
						<div class="mockup-body">
							<div class="fu-item">
								<div class="fu-icon">&#128279;</div>
								<div class="fu-content">
									<div class="fu-text">Review seal replacement schedule for Line 2 main valve</div>
									<div class="fu-meta">Pushed to <strong>SAP PM</strong> as work order &middot; WO-4821 &middot; Assigned to Erik S.</div>
								</div>
							</div>
							<div class="fu-item">
								<div class="fu-icon">&#128279;</div>
								<div class="fu-content">
									<div class="fu-text">Update spare parts inventory for DN50 EPDM seals</div>
									<div class="fu-meta">Pushed to <strong>SAP PM</strong> as work order &middot; WO-4822 &middot; Assigned to Anna L.</div>
								</div>
							</div>
							<div class="fu-item">
								<div class="fu-icon fu-haveri">h</div>
								<div class="fu-content">
									<div class="fu-text">Investigate root cause of recurring seal wear on Line 2</div>
									<div class="fu-meta">Tracked in Haveri &middot; Same follow-up created for INC-2801 (3 weeks ago)</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div>
					<span class="section-label">Follow-ups</span>
					<h2 class="section-heading">Incidents surface problems. Your systems track&nbsp;them.</h2>
					<p class="section-text">
						Most operations already have a system for work orders and maintenance. The gap
						is everything that happens before — the insight buried in a group chat that never
						becomes a ticket. Haveri captures follow-ups at close-out and makes sure they
						land where your team already works.
					</p>
					<ul class="esc-list">
						<li><strong>Captured at resolution.</strong> When an incident closes, Haveri prompts for follow-ups as part of the wrap-up — not as a separate process someone has to remember.</li>
						<li><strong>Push to your tools.</strong> Connect to your existing maintenance or task system so follow-ups become real work orders, not chat messages someone screenshots.</li>
						<li><strong>Visibility across incidents.</strong> See all open follow-ups in one place. Spot when the same follow-up keeps getting created because the underlying problem hasn't been addressed.</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- INCIDENT BRAIN -->
	<section class="brain-section">
		<div class="hiw-inner">
			<div class="brain-center reveal">
				<span class="section-label">Coming soon</span>
				<h2 class="section-heading" style="margin: 0 auto;">The incident brain</h2>
				<p class="section-text" style="margin: 1rem auto 0; max-width: 560px; text-align: center;">
					We're building an intelligence layer that gets smarter with every incident your team
					handles. Here's what's on the roadmap.
				</p>
			</div>
			<div class="brain-grid reveal">
				<div class="brain-card">
					<div class="brain-icon">&#128269;</div>
					<h3>Similar incident detection</h3>
					<p>When a new incident is declared, Haveri finds past incidents with matching equipment, symptoms, or areas — and surfaces what resolved them.</p>
				</div>
				<div class="brain-card">
					<div class="brain-icon">&#128196;</div>
					<h3>SOP retrieval</h3>
					<p>Upload your standard operating procedures. Haveri retrieves the relevant steps during an incident, so your team has the right information at the right moment.</p>
				</div>
				<div class="brain-card">
					<div class="brain-icon">&#128200;</div>
					<h3>Trend detection</h3>
					<p>Spot patterns across incidents: recurring equipment failures, common root causes, areas with increasing incident frequency. Move from reactive to proactive.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="hiw-cta">
		<div class="hiw-inner" style="text-align: center;">
			<h2 class="section-heading" style="margin: 0 auto;"><em>Haveri</em> in 15 minutes?</h2>
			<p class="section-text" style="margin: 1rem auto 0; max-width: 460px; text-align: center;">
				We'll walk you through how Haveri would work for your team. No slides, no demo scripts — just a conversation.
			</p>
			<div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
				<a href="/contact" class="btn-primary">Get early access &rarr;</a>
				<a href="/pricing" class="btn-secondary">See pricing</a>
			</div>
		</div>
	</section>
</div>

<style>
	.hiw-page {
		padding-top: 5rem;
	}

	.hiw-inner {
		max-width: 1060px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.hiw-hero {
		padding: 5rem 0 3rem;
	}

	.hiw-title {
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 5vw, 3.5rem);
		font-weight: 400;
		line-height: 1.15;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		max-width: 550px;
		margin-top: 0.5rem;
	}

	.hiw-lead {
		font-size: 1.1rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 520px;
		margin-top: 1.25rem;
	}

	/* Step navigation */
	.lifecycle-section {
		padding: 2rem 0 5rem;
	}

	.step-nav {
		display: flex;
		align-items: center;
		gap: 0;
		margin-bottom: 3rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.step-tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.2rem;
		border: 1.5px solid var(--color-warm-200);
		border-radius: 100px;
		background: var(--color-warm-white);
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.82rem;
		color: var(--color-slate-500);
		transition: all 0.2s;
		white-space: nowrap;
	}

	.step-tab:hover {
		border-color: var(--color-warm-300);
		color: var(--color-slate-800);
	}

	.step-tab.active {
		background: var(--color-slate-900);
		border-color: var(--color-slate-900);
		color: var(--color-warm-white);
	}

	.step-num {
		font-weight: 600;
		font-size: 0.72rem;
	}

	.step-connector {
		width: 24px;
		height: 1px;
		background: var(--color-warm-300);
		flex-shrink: 0;
	}

	.step-connector.passed {
		background: var(--color-amber);
	}

	/* Step content */
	.step-content {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		gap: 4rem;
		align-items: start;
	}

	.step-text h2 {
		font-family: var(--font-display);
		font-size: 1.8rem;
		font-weight: 400;
		color: var(--color-slate-950);
		letter-spacing: -0.02em;
		margin-bottom: 1.25rem;
	}

	.step-desc {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--color-slate-600);
		margin-bottom: 1rem;
	}

	.step-detail {
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		padding-left: 1rem;
		border-left: 2px solid var(--color-amber-glow-strong);
	}

	/* Mockup cards */
	.mockup-card {
		background: white;
		border: 1px solid var(--color-warm-200);
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 4px 30px rgba(26, 29, 35, 0.05);
	}

	.mockup-header {
		padding: 0.85rem 1.25rem;
		border-bottom: 1px solid var(--color-warm-200);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.mockup-title {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-slate-800);
	}

	.mockup-badge {
		font-size: 0.68rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		background: var(--color-amber-glow);
		color: var(--color-amber);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.mockup-body {
		padding: 1.25rem;
	}

	/* Mock form fields */
	.mock-field {
		margin-bottom: 1rem;
	}

	.mock-label {
		display: block;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-slate-500);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 0.3rem;
	}

	.mock-input, .mock-select {
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--color-warm-200);
		border-radius: 5px;
		font-size: 0.82rem;
		color: var(--color-slate-800);
		background: var(--color-warm-white);
	}

	.mock-input.followup {
		border-left: 3px solid var(--color-amber);
	}

	.mock-btn {
		padding: 0.55rem 1rem;
		background: var(--color-slate-900);
		color: var(--color-warm-white);
		border-radius: 5px;
		font-size: 0.82rem;
		font-weight: 500;
		text-align: center;
		margin-top: 0.5rem;
	}

	.mock-btn.resolve {
		background: var(--color-sev3);
	}

	.sev-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-right: 4px;
	}

	.sev-dot.sev2 {
		background: var(--color-sev2);
	}

	/* Escalation tiers */
	.escalation-tier {
		display: grid;
		grid-template-columns: 100px 1fr auto;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-warm-100);
		font-size: 0.82rem;
		align-items: center;
	}

	.tier-label {
		color: var(--color-slate-400);
		font-size: 0.78rem;
	}

	.tier-target {
		color: var(--color-slate-800);
		font-weight: 500;
	}

	.tier-status {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 3px;
	}

	.tier-status.notified {
		background: rgba(90, 154, 106, 0.12);
		color: var(--color-sev3);
	}

	.tier-status.pending {
		background: var(--color-warm-100);
		color: var(--color-slate-400);
	}

	/* Routing match */
	.routing-match {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-warm-100);
		margin-bottom: 0.25rem;
	}

	.routing-match-label {
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--color-slate-400);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 0.4rem;
	}

	.routing-tags {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.routing-tag {
		font-size: 0.72rem;
		font-weight: 500;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		background: var(--color-amber-glow);
		color: var(--color-amber);
		border: 1px solid rgba(212, 148, 58, 0.15);
	}

	/* Timeline entries */
	.tl-entry {
		display: grid;
		grid-template-columns: 50px 12px 1fr;
		gap: 8px;
		padding: 0.5rem 0;
		font-size: 0.8rem;
		align-items: start;
	}

	.tl-time {
		color: var(--color-slate-400);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}

	.tl-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-warm-300);
		margin-top: 5px;
	}

	.tl-dot.declaration {
		background: var(--color-sev2);
	}

	.tl-dot.amber {
		background: var(--color-amber);
	}

	.tl-text {
		color: var(--color-slate-700);
		line-height: 1.5;
	}

	.tl-entry.insight {
		background: var(--color-amber-glow);
		border-radius: 6px;
		padding: 0.5rem 0.5rem;
		margin: 0.25rem 0;
	}

	/* Resolve stats */
	.resolve-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin: 1rem 0;
		padding: 0.75rem 0;
		border-top: 1px solid var(--color-warm-100);
		border-bottom: 1px solid var(--color-warm-100);
	}

	.stat {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-slate-900);
		font-family: var(--font-display);
	}

	.stat-label {
		font-size: 0.68rem;
		color: var(--color-slate-400);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	/* Dashboard mockup */
	.dash-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.25rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-warm-100);
	}

	.dash-stat {
		text-align: center;
	}

	.dash-val {
		display: block;
		font-size: 1.5rem;
		font-weight: 600;
		font-family: var(--font-display);
		color: var(--color-slate-900);
	}

	.dash-label {
		font-size: 0.7rem;
		color: var(--color-slate-400);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.dash-pattern-label {
		display: block;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-slate-500);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 0.75rem;
	}

	.dash-bar {
		display: grid;
		grid-template-columns: 140px 1fr 30px;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.dash-bar-label {
		font-size: 0.78rem;
		color: var(--color-slate-700);
	}

	.dash-bar-fill {
		height: 6px;
		background: var(--color-amber);
		border-radius: 3px;
		opacity: 0.6;
	}

	.dash-bar-count {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-slate-500);
		text-align: right;
	}

	/* Escalation section */
	.escalation-section {
		padding: 5rem 0;
		background: var(--color-warm-100);
	}

	.esc-split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.esc-list {
		list-style: none;
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.esc-list li {
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--color-slate-600);
		padding-left: 1rem;
		border-left: 2px solid var(--color-warm-300);
	}

	.esc-list li strong {
		color: var(--color-slate-800);
	}

	.esc-visual .mockup-body {
		padding: 0;
	}

	.policy-row {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-warm-100);
	}

	.policy-row:last-child {
		border-bottom: none;
	}

	.policy-name {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-slate-800);
		margin-bottom: 0.25rem;
	}

	.policy-detail {
		font-size: 0.78rem;
		color: var(--color-slate-500);
	}

	/* Follow-ups section */
	.followups-section {
		padding: 5rem 0;
	}

	.fu-split {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.fu-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--color-warm-100);
		align-items: start;
	}

	.fu-icon {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		margin-top: 2px;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.fu-icon.fu-haveri {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--color-amber);
		color: white;
		font-size: 0.65rem;
		font-weight: 700;
	}

	.fu-text {
		font-size: 0.85rem;
		color: var(--color-slate-800);
		line-height: 1.4;
	}

	.fu-meta {
		font-size: 0.72rem;
		color: var(--color-slate-400);
		margin-top: 0.2rem;
	}

	/* Brain section */
	.brain-section {
		padding: 5rem 0;
		background: var(--color-slate-950);
	}

	.brain-center {
		text-align: center;
		margin-bottom: 3rem;
	}

	.brain-section :global(.section-heading) {
		color: var(--color-warm-white);
	}

	.brain-section :global(.section-text) {
		color: var(--color-slate-400);
	}

	.brain-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	.brain-card {
		background: var(--color-slate-900);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 10px;
		padding: 2rem;
	}

	.brain-icon {
		font-size: 1.3rem;
		margin-bottom: 1rem;
	}

	.brain-card h3 {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 500;
		color: var(--color-warm-white);
		margin-bottom: 0.5rem;
	}

	.brain-card p {
		font-size: 0.88rem;
		line-height: 1.6;
		color: var(--color-slate-400);
	}

	/* CTA */
	.hiw-cta {
		padding: 5rem 0;
	}

	@media (max-width: 900px) {
		.step-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.esc-split,
		.fu-split {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.brain-grid {
			grid-template-columns: 1fr;
		}

		.step-nav {
			gap: 0;
		}
	}
</style>
