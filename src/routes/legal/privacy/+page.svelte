<svelte:head>
	<title>Privacy Policy — Haveri</title>
</svelte:head>

<div class="legal-page">
	<div class="legal-inner">
		<a href="/" class="back-link">&larr; Home</a>
		<div class="prose">
			<h1>Privacy Policy</h1>
			<p><em>Last updated: February 2026</em></p>

			<p>
				Haveri ("we", "us", "our") is committed to protecting your privacy. This policy
				explains how we collect, use, and protect your data when you use our incident
				management service.
			</p>

			<h2>What we collect</h2>
			<p>When you use Haveri, we collect:</p>
			<ul>
				<li><strong>Account information:</strong> Name, email address, company name, and role provided during signup.</li>
				<li><strong>Incident data:</strong> Messages, timelines, severity levels, and resolution details captured during incidents through your Microsoft Teams integration.</li>
				<li><strong>Usage data:</strong> Basic analytics about how you use the dashboard (page views, feature usage). We use Cloudflare Analytics, which does not use cookies or track individuals.</li>
			</ul>

			<h2>How we use your data</h2>
			<ul>
				<li>To provide the Haveri service — capturing incidents, building timelines, powering escalation policies, and surfacing insights.</li>
				<li>To improve the service — understanding how teams use Haveri to make it better.</li>
				<li>To communicate with you — service updates, onboarding support, and (with your consent) product updates.</li>
			</ul>

			<h2>Where your data is stored</h2>
			<p>
				All incident data is stored in the European Union (Sweden). We use infrastructure
				providers that comply with GDPR requirements. Your operational data stays within
				European infrastructure.
			</p>

			<h2>Data sharing</h2>
			<p>
				We do not sell your data. We do not share your incident data with third parties
				except as required to provide the service (e.g., Microsoft Teams integration) or
				as required by law.
			</p>

			<h2>Data retention</h2>
			<p>
				Your incident data is retained as long as your account is active. If you cancel
				your subscription, data is retained for 30 days before deletion. You can request
				a full data export at any time.
			</p>

			<h2>Your rights</h2>
			<p>Under GDPR, you have the right to:</p>
			<ul>
				<li>Access your data</li>
				<li>Correct inaccurate data</li>
				<li>Request deletion of your data</li>
				<li>Export your data in a portable format</li>
				<li>Object to processing</li>
			</ul>

			<h2>Cookies</h2>
			<p>
				The Haveri marketing site does not use tracking cookies. We use Cloudflare
				Analytics, which is privacy-friendly and does not require cookie consent.
				The Haveri application uses essential cookies for authentication only.
			</p>

			<h2>Contact</h2>
			<p>
				For privacy questions or data requests, contact us at
				<a href="mailto:privacy@haveri.app">privacy@haveri.app</a>.
			</p>
		</div>
	</div>
</div>

<style>
	.legal-page {
		padding-top: 7rem;
		padding-bottom: 6rem;
	}

	.legal-inner {
		max-width: 680px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.back-link {
		font-size: 0.82rem;
		color: var(--color-amber);
		text-decoration: none;
		display: inline-block;
		margin-bottom: 2rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}
</style>
