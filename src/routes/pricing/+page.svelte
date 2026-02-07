<script lang="ts">
	let annual = $state(true);
</script>

<svelte:head>
	<title>Pricing — Haveri</title>
	<meta name="description" content="Simple, facility-based pricing. No per-seat fees. All team members included at no extra cost." />
</svelte:head>

<div class="pricing-page">
	<section class="pricing-hero">
		<div class="pricing-inner">
			<span class="section-label">Pricing</span>
			<h1 class="pricing-title">Simple pricing. No per-seat&nbsp;fees.</h1>
			<p class="pricing-lead">
				Everyone on your team can use Haveri at no extra per-user cost.
				Pick the plan that fits your operation.
			</p>

			<div class="billing-toggle">
				<button class:active={!annual} onclick={() => (annual = false)}>Monthly</button>
				<button class:active={annual} onclick={() => (annual = true)}>
					Annual <span class="save-tag">Save 20%</span>
				</button>
			</div>
		</div>
	</section>

	<section class="plans-section">
		<div class="pricing-inner">
			<div class="plans-grid">
				<!-- STARTER -->
				<div class="plan-card">
					<div class="plan-header">
						<h2>Starter</h2>
						<p class="plan-desc">For teams getting started with structured incident management.</p>
					</div>
					<div class="plan-price">
						<span class="price-amount">{annual ? '€149' : '€189'}</span>
						<span class="price-period">/ month per facility</span>
					</div>
					{#if annual}
						<p class="price-note">Billed annually (€1,788/year)</p>
					{/if}
					<a href="/contact" class="btn-secondary" style="width: 100%; justify-content: center; margin-top: 1.5rem;">Start with a free pilot &rarr;</a>
					<ul class="plan-features">
						<li class="included">1 facility</li>
						<li class="included">Unlimited incidents</li>
						<li class="included">Unlimited team members</li>
						<li class="included">Teams integration</li>
						<li class="included">Basic escalation policies</li>
						<li class="included">Incident timeline &amp; history (90 days)</li>
						<li class="included">Follow-up tracking</li>
						<li class="excluded">Dashboard analytics</li>
						<li class="excluded">Incident memory</li>
						<li class="excluded">SOP retrieval</li>
					</ul>
				</div>

				<!-- TEAM -->
				<div class="plan-card featured">
					<div class="plan-badge">Recommended</div>
					<div class="plan-header">
						<h2>Team</h2>
						<p class="plan-desc">Full incident management for operations that take reliability seriously.</p>
					</div>
					<div class="plan-price">
						<span class="price-amount">{annual ? '€349' : '€429'}</span>
						<span class="price-period">/ month per facility</span>
					</div>
					{#if annual}
						<p class="price-note">Billed annually (€4,188/year)</p>
					{/if}
					<a href="/contact" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 1.5rem;">Get early access &rarr;</a>
					<ul class="plan-features">
						<li class="included">Unlimited facilities</li>
						<li class="included">Unlimited incidents</li>
						<li class="included">Unlimited team members</li>
						<li class="included">Teams integration</li>
						<li class="included">Advanced escalation policies</li>
						<li class="included">Full incident history (unlimited)</li>
						<li class="included">Follow-up tracking</li>
						<li class="included">Dashboard analytics</li>
						<li class="included">Incident memory <span class="coming">Soon</span></li>
						<li class="included">SOP retrieval <span class="coming">Soon</span></li>
					</ul>
				</div>
			</div>

			<!-- COMPARISON TABLE (compact) -->
			<div class="comparison-note">
				<p>Both plans include unlimited team members. No per-seat pricing, ever.</p>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="faq-section">
		<div class="pricing-inner">
			<h2 class="faq-title">Frequently asked questions</h2>
			<div class="faq-grid">
				<div class="faq-item">
					<h3>What counts as a "facility"?</h3>
					<p>A facility is a physical location — a factory, a plant, a warehouse. Each facility has its own teams, areas, and escalation policies. If you operate from one building, you need one facility.</p>
				</div>
				<div class="faq-item">
					<h3>Do I need a Microsoft Teams subscription?</h3>
					<p>Yes. Haveri currently integrates with Microsoft Teams. Your organization needs an active Teams subscription for the chat-native features. We're exploring Slack support for the future.</p>
				</div>
				<div class="faq-item">
					<h3>Where is my data stored?</h3>
					<p>Incident data is stored in the EU (Sweden). We take data residency seriously — your operational data stays within European infrastructure. We can discuss specific requirements for your organization.</p>
				</div>
				<div class="faq-item">
					<h3>What happens if I cancel?</h3>
					<p>You can export all your incident data at any time. If you cancel, your data is retained for 30 days before deletion. Your incident history is yours — we don't hold it hostage.</p>
				</div>
				<div class="faq-item">
					<h3>How does onboarding work?</h3>
					<p>We set up Haveri together in a 30-minute session. Install the Teams app, configure your first facility and escalation policies, and you're ready. Most teams are live on the same day.</p>
				</div>
				<div class="faq-item">
					<h3>Can I try it before committing?</h3>
					<p>Yes. We offer a free pilot period for early access teams. Run Haveri on real incidents for a few weeks and decide if it's right for your team. No credit card required to start.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="pricing-cta">
		<div class="pricing-inner" style="text-align: center;">
			<h2 class="section-heading" style="margin: 0 auto;">Not sure which plan?</h2>
			<p class="section-text" style="margin: 1rem auto 0; text-align: center;">
				Let's talk about what you need. We'll recommend the right fit based on your operation.
			</p>
			<a href="/contact" class="btn-primary" style="margin-top: 2rem;">Talk to us &rarr;</a>
		</div>
	</section>
</div>

<style>
	.pricing-page {
		padding-top: 5rem;
	}

	.pricing-inner {
		max-width: 960px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.pricing-hero {
		padding: 5rem 0 2rem;
		text-align: center;
	}

	.pricing-title {
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		margin-top: 0.5rem;
	}

	.pricing-lead {
		font-size: 1.1rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 440px;
		margin: 1.25rem auto 0;
	}

	/* Billing toggle */
	.billing-toggle {
		display: inline-flex;
		gap: 0;
		margin-top: 2rem;
		background: var(--color-warm-100);
		border-radius: 8px;
		padding: 4px;
		border: 1px solid var(--color-warm-200);
	}

	.billing-toggle button {
		padding: 0.5rem 1.25rem;
		border: none;
		background: transparent;
		font-family: var(--font-body);
		font-size: 0.85rem;
		color: var(--color-slate-500);
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.billing-toggle button.active {
		background: var(--color-warm-white);
		color: var(--color-slate-900);
		font-weight: 500;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
	}

	.save-tag {
		font-size: 0.68rem;
		font-weight: 600;
		background: rgba(90, 154, 106, 0.12);
		color: var(--color-sev3);
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}

	/* Plans */
	.plans-section {
		padding: 2rem 0 4rem;
	}

	.plans-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.plan-card {
		background: var(--color-warm-white);
		border: 1.5px solid var(--color-warm-200);
		border-radius: 12px;
		padding: 2.5rem;
		position: relative;
	}

	.plan-card.featured {
		border-color: var(--color-slate-900);
		box-shadow: 0 8px 40px rgba(26, 29, 35, 0.08);
	}

	.plan-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-slate-900);
		color: var(--color-warm-white);
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.25rem 0.85rem;
		border-radius: 100px;
		letter-spacing: 0.03em;
	}

	.plan-header h2 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-slate-950);
	}

	.plan-desc {
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--color-slate-500);
		margin-top: 0.35rem;
	}

	.plan-price {
		margin-top: 1.5rem;
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
	}

	.price-amount {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 500;
		color: var(--color-slate-950);
		letter-spacing: -0.02em;
	}

	.price-period {
		font-size: 0.85rem;
		color: var(--color-slate-400);
	}

	.price-note {
		font-size: 0.78rem;
		color: var(--color-slate-400);
		margin-top: 0.25rem;
	}

	.plan-features {
		list-style: none;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-warm-200);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.plan-features li {
		font-size: 0.88rem;
		padding-left: 1.5rem;
		position: relative;
		color: var(--color-slate-600);
	}

	.plan-features li.included::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: var(--color-sev3);
		font-weight: 600;
		font-size: 0.85rem;
	}

	.plan-features li.excluded {
		color: var(--color-slate-400);
	}

	.plan-features li.excluded::before {
		content: '—';
		position: absolute;
		left: 0;
		color: var(--color-warm-300);
	}

	.coming {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-amber);
		background: var(--color-amber-glow);
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		margin-left: 0.35rem;
	}

	.comparison-note {
		text-align: center;
		margin-top: 2rem;
		padding: 1rem;
		background: var(--color-warm-100);
		border-radius: 8px;
	}

	.comparison-note p {
		font-size: 0.88rem;
		color: var(--color-slate-500);
		font-weight: 500;
	}

	/* FAQ */
	.faq-section {
		padding: 4rem 0 5rem;
		background: var(--color-warm-100);
	}

	.faq-title {
		font-family: var(--font-display);
		font-size: 1.8rem;
		font-weight: 400;
		color: var(--color-slate-950);
		letter-spacing: -0.02em;
		margin-bottom: 2.5rem;
		text-align: center;
	}

	.faq-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.faq-item h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-slate-900);
		margin-bottom: 0.5rem;
	}

	.faq-item p {
		font-size: 0.88rem;
		line-height: 1.6;
		color: var(--color-slate-500);
	}

	.pricing-cta {
		padding: 5rem 0;
	}

	@media (max-width: 768px) {
		.plans-grid {
			grid-template-columns: 1fr;
		}

		.faq-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
