<svelte:head>
	<title>About — Haveri</title>
	<meta name="description" content="Why Haveri exists. The story behind incident management built for teams that make real things." />
</svelte:head>

<div class="about-page">
	<section class="about-hero">
		<div class="about-inner">
			<span class="section-label">About Haveri</span>
			<h1 class="about-title">Incidents are normal.<br />Let's get good at them.</h1>
			<p class="about-lead">
				Haveri exists because the people who keep production lines running deserve better
				tools than a group chat and a phone tree.
			</p>
		</div>
	</section>

	<section class="about-story">
		<div class="about-inner">
			<div class="story-grid">
				<div class="story-content">
					<h2>Why this exists</h2>
					<p>
						Haveri started because two people from different worlds kept having the same
						conversation. Cecilia has spent her career in manufacturing operations — she
						knows what it's like to manage a production facility, get woken up at 3 AM,
						and lose hard-won fixes to chat history. Jonatan has built products and
						founded companies — he's seen how structured incident management
						transformed reliability in tech teams.
					</p>
					<p>
						In software, structured incident management has been standard for years. Tools like
						PagerDuty and incident.io are the norm. When something breaks, there's a process.
						It's calm, it's documented, and the team learns from it.
					</p>
					<p>
						In manufacturing, the same severity of incidents gets handled with a group chat
						and a phone call. The fix someone figured out at 3 AM disappears into chat history.
						The same equipment fails the same way three months later because the knowledge
						left with the person who was on shift.
					</p>
					<p>
						We built Haveri to bridge that gap. Not an enterprise platform that takes six months
						to implement. Something that meets manufacturing teams where they already are — in
						Teams, on their phones, between shifts. Named after the Swedish word for a breakdown,
						because pretending incidents don't happen is what makes them catastrophic.
					</p>
				</div>
				<div class="story-aside">
					<div class="belief-card">
						<h3>What we believe</h3>
						<ul>
							<li>
								<strong>Incidents are learning opportunities, not failures.</strong>
								The goal isn't zero incidents — it's zero repeated incidents.
							</li>
							<li>
								<strong>Knowledge should stay with the team.</strong>
								When a senior operator retires, their experience shouldn't leave with them.
							</li>
							<li>
								<strong>Tooling should meet people where they are.</strong>
								If your team lives in Teams, your incident tool should too.
							</li>
							<li>
								<strong>Calm is a feature.</strong>
								Good process removes drama. The right person gets notified, not everyone.
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="about-team">
		<div class="about-inner">
			<h2>The team</h2>
			<p class="team-intro">
				Haveri is built in Sweden by people who've lived the problem on both sides.
			</p>
			<div class="team-grid">
				<div class="team-member">
					<div class="member-avatar">CS</div>
					<h3>Cecilia</h3>
					<p class="member-role">Co-founder</p>
					<p class="member-bio">
						Manufacturing operations background. Has managed production facilities,
						handled incidents at 3 AM, and knows firsthand what works on the floor
						and what doesn't.
					</p>
				</div>
				<div class="team-member">
					<div class="member-avatar">JS</div>
					<h3>Jonatan</h3>
					<p class="member-role">Co-founder</p>
					<p class="member-bio">
						Product engineer and founder. Has built large-scale critical systems
						where every minute of downtime is expensive, and knows what good
						incident management looks like from the inside.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="about-cta">
		<div class="about-inner">
			<h2>Want to talk?</h2>
			<p>
				If you're dealing with the same problems — incidents that repeat, knowledge that
				disappears, escalations that don't work — we'd genuinely like to hear from you.
			</p>
			<div class="cta-buttons">
				<a href="/contact" class="btn-primary">Get in touch &rarr;</a>
				<a href="/blog" class="btn-secondary">Read the blog</a>
			</div>
		</div>
	</section>
</div>

<style>
	.about-page {
		padding-top: 5rem;
	}

	.about-inner {
		max-width: 960px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.about-hero {
		padding: 5rem 0 4rem;
	}

	.about-title {
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 5vw, 3.5rem);
		font-weight: 400;
		line-height: 1.15;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		max-width: 600px;
		margin-top: 0.5rem;
	}

	.about-lead {
		font-size: 1.15rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 540px;
		margin-top: 1.5rem;
	}

	/* Story */
	.about-story {
		padding: 3rem 0 5rem;
	}

	.story-grid {
		display: grid;
		grid-template-columns: 1.3fr 1fr;
		gap: 4rem;
		align-items: start;
	}

	.story-content h2 {
		font-family: var(--font-display);
		font-size: 1.8rem;
		font-weight: 400;
		color: var(--color-slate-950);
		letter-spacing: -0.02em;
		margin-bottom: 1.5rem;
	}

	.story-content p {
		font-size: 1rem;
		line-height: 1.75;
		color: var(--color-slate-600);
		margin-bottom: 1.25rem;
	}

	.belief-card {
		background: var(--color-warm-100);
		border: 1px solid var(--color-warm-200);
		border-radius: 10px;
		padding: 2rem;
	}

	.belief-card h3 {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 500;
		color: var(--color-slate-900);
		margin-bottom: 1.25rem;
	}

	.belief-card ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.belief-card li {
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--color-slate-600);
	}

	.belief-card li strong {
		display: block;
		color: var(--color-slate-900);
		font-weight: 500;
		margin-bottom: 0.15rem;
	}

	/* Team */
	.about-team {
		padding: 4rem 0;
		background: var(--color-warm-100);
	}

	.about-team h2 {
		font-family: var(--font-display);
		font-size: 1.8rem;
		font-weight: 400;
		color: var(--color-slate-950);
		letter-spacing: -0.02em;
	}

	.team-intro {
		font-size: 1rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		margin-top: 0.75rem;
		max-width: 500px;
	}

	.team-grid {
		margin-top: 2.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.team-member {
		background: var(--color-warm-white);
		border: 1px solid var(--color-warm-200);
		border-radius: 10px;
		padding: 2rem;
	}

	.member-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--color-slate-900);
		color: var(--color-warm-white);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.team-member h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--color-slate-900);
	}

	.member-role {
		font-size: 0.8rem;
		color: var(--color-amber);
		font-weight: 500;
		margin-top: 0.15rem;
	}

	.member-bio {
		font-size: 0.88rem;
		line-height: 1.6;
		color: var(--color-slate-500);
		margin-top: 0.75rem;
	}

	/* CTA */
	.about-cta {
		padding: 5rem 0;
		text-align: center;
	}

	.about-cta h2 {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 400;
		color: var(--color-slate-950);
		letter-spacing: -0.02em;
	}

	.about-cta p {
		font-size: 1rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 500px;
		margin: 0.75rem auto 0;
	}

	.cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.story-grid {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.cta-buttons {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
