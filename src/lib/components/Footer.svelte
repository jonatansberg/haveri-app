<footer>
	<div class="footer-inner">
		<div class="footer-left">
			<span class="footer-logo">haveri</span>
			<span class="footer-tagline">Incidents happen. Chaos doesn't have to.</span>
		</div>
		<div class="footer-links">
			<div class="footer-col">
				<span class="footer-col-title">Product</span>
				<a href="/how-it-works">How it works</a>
				<a href="/pricing">Pricing</a>
				<a href="/changelog">Changelog</a>
			</div>
			<div class="footer-col">
				<span class="footer-col-title">Resources</span>
				<a href="/blog">Blog</a>
				<a href="/docs">Docs</a>
				<a href="/contact">Contact</a>
			</div>
			<div class="footer-col">
				<span class="footer-col-title">Company</span>
				<a href="/about">About</a>
				<a href="/legal/privacy">Privacy</a>
				<a href="/legal/terms">Terms</a>
			</div>
		</div>
	</div>
	<div class="footer-bottom">
		<span>&copy; {new Date().getFullYear()} Haveri. All rights reserved.</span>
	</div>
</footer>

<style>
	footer {
		background: var(--color-slate-950);
		padding: 4rem 2rem 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}

	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		gap: 4rem;
	}

	.footer-left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.footer-logo {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 500;
		color: var(--color-slate-300);
	}

	.footer-tagline {
		font-size: 0.85rem;
		color: var(--color-slate-600);
		max-width: 240px;
	}

	.footer-links {
		display: flex;
		gap: 4rem;
	}

	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.footer-col-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-slate-400);
		margin-bottom: 0.5rem;
	}

	.footer-col a {
		font-size: 0.85rem;
		color: var(--color-slate-500);
		text-decoration: none;
		transition: color 0.2s;
	}

	.footer-col a:hover {
		color: var(--color-warm-white);
	}

	.footer-bottom {
		max-width: 1200px;
		margin: 3rem auto 0;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.footer-bottom span {
		font-size: 0.78rem;
		color: var(--color-slate-600);
	}

	@media (max-width: 700px) {
		.footer-inner {
			flex-direction: column;
			gap: 2.5rem;
		}

		.footer-links {
			gap: 2.5rem;
			flex-wrap: wrap;
		}
	}
</style>
