<svelte:head>
	<title>Why we built Haveri — Haveri Blog</title>
	<meta name="description" content="The story starts with a production facility, a group chat, and the same valve failing twice." />
</svelte:head>

<article class="blog-article">
	<div class="article-inner">
		<div class="article-meta">
			<a href="/blog" class="back-link">&larr; Blog</a>
			<span class="meta-sep">&middot;</span>
			<span class="meta-date">February 2026</span>
			<span class="meta-sep">&middot;</span>
			<span class="meta-tag">Company</span>
		</div>

		<h1>Why we built Haveri</h1>

		<div class="prose">
			<p class="lede">
				We've worked in both software and manufacturing. We built Haveri because
				we kept seeing the same gap between the two.
			</p>

			<p>
				On the software side, we've built and used structured incident management for years.
				On the manufacturing side, we've been on the factory floor at 3 AM when a line
				goes down. We've seen shift supervisors wake people up because nobody knew who else
				to call. We've watched teams scroll through hundreds of chat messages trying to
				reconstruct what happened on a shift they weren't on. We've seen the same equipment
				fail the same way, three months apart, because the fix was never written down
				anywhere anyone could find it.
			</p>

			<p>
				This isn't unusual. It's standard operating procedure in manufacturing. When something
				breaks, the group chat explodes. Three people start troubleshooting in parallel,
				stepping on each other. Someone eventually fixes it — somehow. Nobody records what
				happened. The knowledge stays with the person who was on shift, and when they're not
				around next time, the whole cycle starts again.
			</p>

			<h2>The software world figured this out years ago</h2>

			<p>
				In software, structured incident management has been standard practice for years.
				When a service goes down, there's a clear process: declare the incident, assign a
				severity, notify the right people, work the problem in a dedicated channel, capture
				everything in a timeline, and write up what happened afterward. Tools like PagerDuty
				and incident.io made this possible.
			</p>

			<p>
				The result isn't just faster resolution — it's organizational learning. Every incident
				becomes a record. Patterns emerge. Root causes get addressed. The team gets smarter.
			</p>

			<p>
				Manufacturing teams deal with incidents that are equally complex — often more so,
				since they involve physical equipment, safety considerations, and people who aren't
				sitting at desks with laptops. But they're doing it with group chats and phone calls.
			</p>

			<h2>What if there was a tool built for them?</h2>

			<p>
				Not an enterprise platform that costs six figures and takes six months to implement.
				Not a CMMS with an incident module bolted on. Not a generic project management tool
				repurposed for incidents.
			</p>

			<p>
				Something that lives where these teams already communicate — in Microsoft Teams, on
				their phones. Something that captures what happens during an incident automatically,
				just by the team talking. Something that surfaces what worked last time when the same
				thing breaks again.
			</p>

			<p>
				That's what we're building. We named it Haveri — the Swedish word for a breakdown,
				a disaster, an incident. Because pretending incidents don't happen is what makes them
				catastrophic. Haveri says: incidents are normal. Let's get good at them.
			</p>

			<h2>Where we are now</h2>

			<p>
				We're in early access, working with a small number of manufacturing teams to validate
				and refine the product. If your team manages incidents through group chats and phone
				calls, and you're tired of losing fixes to chat history —
				<a href="/contact">we'd like to hear from you</a>.
			</p>

			<p>
				The fix your team figured out at 3 AM shouldn't disappear into a group chat.
			</p>
		</div>
	</div>
</article>

<style>
	.blog-article {
		padding-top: 7rem;
		padding-bottom: 6rem;
	}

	.article-inner {
		max-width: 680px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.article-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
		font-size: 0.82rem;
	}

	.back-link {
		color: var(--color-amber);
		text-decoration: none;
		font-weight: 500;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.meta-sep {
		color: var(--color-warm-300);
	}

	.meta-date {
		color: var(--color-slate-400);
	}

	.meta-tag {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.1rem 0.45rem;
		border-radius: 3px;
		background: var(--color-amber-glow);
		color: var(--color-amber);
	}

	h1 {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 2.8rem);
		font-weight: 400;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		line-height: 1.15;
		margin-bottom: 2rem;
	}

	.lede {
		font-size: 1.2rem;
		color: var(--color-slate-700);
		line-height: 1.6;
		font-weight: 400;
	}
</style>
