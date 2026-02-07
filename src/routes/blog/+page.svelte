<svelte:head>
	<title>Blog — Haveri</title>
	<meta name="description" content="Thoughts on incident management, manufacturing operations, and building tools for teams that make real things." />
</svelte:head>

<div class="blog-page">
	<section class="blog-hero">
		<div class="blog-inner">
			<span class="section-label">Blog</span>
			<h1 class="blog-title">Thinking about incidents.</h1>
			<p class="blog-lead">
				On incident management, manufacturing operations, and why the group chat
				isn't working.
			</p>
		</div>
	</section>

	<section class="posts-section">
		<div class="blog-inner">
			<div class="posts-grid">
				<a href="/blog/why-we-built-haveri" class="post-card featured">
					<div class="post-meta">
						<span class="post-date">February 2026</span>
						<span class="post-tag">Company</span>
					</div>
					<h2>Why we built Haveri</h2>
					<p>The story starts with a production facility, a group chat, and the same valve failing twice. Here's why we built incident management for manufacturing.</p>
					<span class="post-link">Read article &rarr;</span>
				</a>

				<a href="/blog/incident-management-not-just-for-tech" class="post-card">
					<div class="post-meta">
						<span class="post-date">February 2026</span>
						<span class="post-tag">Industry</span>
					</div>
					<h2>Incident management isn't just for tech companies</h2>
					<p>Software teams have had structured incident management for years. Manufacturing teams handle more complex incidents with less tooling. That's changing.</p>
					<span class="post-link">Read article &rarr;</span>
				</a>

				<a href="/blog/the-3am-phone-call" class="post-card">
					<div class="post-meta">
						<span class="post-date">February 2026</span>
						<span class="post-tag">Practical</span>
					</div>
					<h2>The 3 AM phone call and how to stop making it</h2>
					<p>Escalation policies aren't about bureaucracy. They're about making sure the right person gets involved at the right time — and everyone else can sleep.</p>
					<span class="post-link">Read article &rarr;</span>
				</a>
			</div>
		</div>
	</section>
</div>

<style>
	.blog-page {
		padding-top: 5rem;
	}

	.blog-inner {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.blog-hero {
		padding: 5rem 0 3rem;
	}

	.blog-title {
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		margin-top: 0.5rem;
	}

	.blog-lead {
		font-size: 1.1rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 460px;
		margin-top: 1rem;
	}

	.posts-section {
		padding: 0 0 6rem;
	}

	.posts-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.post-card {
		display: block;
		padding: 2rem;
		background: var(--color-warm-white);
		border: 1px solid var(--color-warm-200);
		border-radius: 10px;
		text-decoration: none;
		transition: all 0.3s;
	}

	.post-card:hover {
		border-color: var(--color-warm-300);
		box-shadow: 0 8px 40px rgba(26, 29, 35, 0.05);
		transform: translateY(-2px);
	}

	.post-card.featured {
		background: var(--color-warm-100);
		border-color: var(--color-warm-300);
	}

	.post-meta {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.post-date {
		font-size: 0.78rem;
		color: var(--color-slate-400);
	}

	.post-tag {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.15rem 0.5rem;
		border-radius: 3px;
		background: var(--color-amber-glow);
		color: var(--color-amber);
	}

	.post-card h2 {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 500;
		color: var(--color-slate-950);
		letter-spacing: -0.01em;
		margin-bottom: 0.5rem;
	}

	.post-card p {
		font-size: 0.92rem;
		line-height: 1.6;
		color: var(--color-slate-500);
	}

	.post-link {
		display: inline-block;
		margin-top: 1rem;
		font-size: 0.85rem;
		color: var(--color-amber);
		font-weight: 500;
	}
</style>
