<script lang="ts">
	let formData = $state({
		name: '',
		company: '',
		role: '',
		teamSize: '',
		message: ''
	});
	let submitted = $state(false);
	let submitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (submitting) return;
		submitting = true;
		try {
			const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			if (res.ok) submitted = true;
		} catch {
			window.location.href = `mailto:hello@haveri.app?subject=Contact from ${formData.name}&body=${encodeURIComponent(formData.message)}`;
		}
		submitting = false;
	}
</script>

<svelte:head>
	<title>Contact — Haveri</title>
	<meta name="description" content="Get in touch with the Haveri team. Request early access or book a 15-minute intro call." />
</svelte:head>

<div class="contact-page">
	<section class="contact-hero">
		<div class="contact-inner">
			<span class="section-label">Contact</span>
			<h1 class="contact-title">Let's talk about your incidents.</h1>
			<p class="contact-lead">
				Whether you're ready for early access or just want to learn more,
				we'd like to hear from you. No sales pitch — just a conversation about
				how your team handles incidents today.
			</p>
		</div>
	</section>

	<section class="contact-form-section">
		<div class="contact-inner">
			<div class="contact-grid">
				<div class="form-side">
					{#if submitted}
						<div class="success-card">
							<div class="success-icon">&#10003;</div>
							<h2>Message sent.</h2>
							<p>We'll get back to you within a day or two. Looking forward to it.</p>
						</div>
					{:else}
						<form onsubmit={handleSubmit}>
							<div class="form-row">
								<label class="form-field">
									<span class="form-label">Name</span>
									<input type="text" bind:value={formData.name} required placeholder="Anna Lindqvist" />
								</label>
								<label class="form-field">
									<span class="form-label">Company</span>
									<input type="text" bind:value={formData.company} placeholder="Acme Manufacturing" />
								</label>
							</div>
							<div class="form-row">
								<label class="form-field">
									<span class="form-label">Role</span>
									<input type="text" bind:value={formData.role} placeholder="Production Manager" />
								</label>
								<label class="form-field">
									<span class="form-label">Team size</span>
									<select bind:value={formData.teamSize}>
										<option value="">Select...</option>
										<option value="1-20">1–20 people</option>
										<option value="20-50">20–50 people</option>
										<option value="50-200">50–200 people</option>
										<option value="200-500">200–500 people</option>
										<option value="500+">500+ people</option>
									</select>
								</label>
							</div>
							<label class="form-field full">
								<span class="form-label">Message</span>
								<textarea bind:value={formData.message} rows="5" placeholder="Tell us how your team handles incidents today, or what you're looking for..."></textarea>
							</label>
							<button type="submit" class="btn-primary" disabled={submitting}>
								{submitting ? 'Sending...' : 'Send message →'}
							</button>
						</form>
					{/if}
				</div>
				<div class="info-side">
					<div class="info-card">
						<h3>Prefer email?</h3>
						<p>Reach us directly at <a href="mailto:hello@haveri.app">hello@haveri.app</a></p>
					</div>
					<div class="info-card">
						<h3>Book a call</h3>
						<p>Schedule a 15-minute intro call. No preparation needed — we'll ask the questions.</p>
						<a href="/contact" class="btn-secondary" style="margin-top: 1rem;">Book a time &rarr;</a>
					</div>
					<div class="info-card">
						<h3>What to expect</h3>
						<ul>
							<li>A real conversation, not a demo script</li>
							<li>We'll ask about your current process</li>
							<li>No pressure, no 30-day trial countdown</li>
							<li>Response within 1–2 business days</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.contact-page {
		padding-top: 5rem;
	}

	.contact-inner {
		max-width: 1060px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.contact-hero {
		padding: 5rem 0 3rem;
	}

	.contact-title {
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		max-width: 500px;
		margin-top: 0.5rem;
	}

	.contact-lead {
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 480px;
		margin-top: 1.25rem;
	}

	.contact-form-section {
		padding: 0 0 6rem;
	}

	.contact-grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 4rem;
		align-items: start;
	}

	/* Form */
	form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-label {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-slate-700);
	}

	input, select, textarea {
		padding: 0.7rem 0.85rem;
		border: 1.5px solid var(--color-warm-300);
		border-radius: 6px;
		background: var(--color-warm-white);
		font-family: var(--font-body);
		font-size: 0.9rem;
		color: var(--color-slate-800);
		outline: none;
		transition: border-color 0.2s;
	}

	input::placeholder, textarea::placeholder {
		color: var(--color-slate-400);
	}

	input:focus, select:focus, textarea:focus {
		border-color: var(--color-amber);
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	select {
		cursor: pointer;
	}

	/* Info cards */
	.info-side {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.info-card {
		background: var(--color-warm-100);
		border: 1px solid var(--color-warm-200);
		border-radius: 10px;
		padding: 1.5rem;
	}

	.info-card h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-slate-900);
		margin-bottom: 0.5rem;
	}

	.info-card p {
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--color-slate-500);
	}

	.info-card a {
		color: var(--color-amber);
		text-decoration: none;
	}

	.info-card a:hover {
		text-decoration: underline;
	}

	.info-card ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.info-card li {
		font-size: 0.85rem;
		color: var(--color-slate-500);
		padding-left: 1.1rem;
		position: relative;
	}

	.info-card li::before {
		content: '—';
		position: absolute;
		left: 0;
		color: var(--color-warm-300);
	}

	/* Success */
	.success-card {
		text-align: center;
		padding: 4rem 2rem;
	}

	.success-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: rgba(90, 154, 106, 0.12);
		color: var(--color-sev3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		margin: 0 auto 1.5rem;
	}

	.success-card h2 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 400;
		color: var(--color-slate-950);
	}

	.success-card p {
		color: var(--color-slate-500);
		margin-top: 0.5rem;
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.contact-grid {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
