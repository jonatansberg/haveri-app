<svelte:head>
	<title>The 3 AM phone call and how to stop making it — Haveri Blog</title>
	<meta name="description" content="Escalation policies aren't about bureaucracy. They're about making sure the right person gets involved at the right time." />
</svelte:head>

<article class="blog-article">
	<div class="article-inner">
		<div class="article-meta">
			<a href="/blog" class="back-link">&larr; Blog</a>
			<span class="meta-sep">&middot;</span>
			<span class="meta-date">February 2026</span>
			<span class="meta-sep">&middot;</span>
			<span class="meta-tag">Practical</span>
		</div>

		<h1>The 3 AM phone call and how to stop making it</h1>

		<div class="prose">
			<p class="lede">
				It's 3 AM. The night shift supervisor has a problem they can't solve alone.
				They do the only thing they know to do: call the production manager. This is
				how escalation works in most manufacturing operations. It doesn't have to be.
			</p>

			<p>
				The phone call itself isn't the problem. Sometimes the production manager needs
				to be involved — a critical line is down, there's a safety concern, or the issue
				is beyond the shift team's capability. The problem is that the phone call is the
				only escalation mechanism. There's no system to determine <em>when</em> to escalate,
				<em>to whom</em>, or <em>whether it's necessary at all</em>.
			</p>

			<h2>What an escalation policy actually does</h2>

			<p>
				An escalation policy is a set of rules that answer three questions:
			</p>

			<ol>
				<li><strong>Who should know about this incident?</strong> Based on its severity, location, and type.</li>
				<li><strong>When should they be notified?</strong> Immediately, or only if the first responders haven't resolved it within a certain time.</li>
				<li><strong>What happens if nobody responds?</strong> Automatic escalation to the next level.</li>
			</ol>

			<p>
				In practice, a well-designed escalation policy might work like this:
			</p>

			<ul>
				<li><strong>SEV-3 (minor):</strong> The on-duty shift team is notified. No escalation unless they explicitly request it. The production manager sleeps.</li>
				<li><strong>SEV-2 (major):</strong> The shift team plus the area lead are notified immediately. If no acknowledgment in 15 minutes, the production manager is paged.</li>
				<li><strong>SEV-1 (critical):</strong> Everyone relevant is notified immediately. The production manager is paged within 5 minutes if not already involved.</li>
			</ul>

			<h2>Why this matters for your team</h2>

			<p>
				The shift supervisor at 3 AM faces a difficult decision: is this bad enough to wake
				someone up? Without clear guidelines, they either escalate everything (leading to
				alert fatigue and resentment) or they escalate nothing (leading to problems that
				spiral because help came too late).
			</p>

			<p>
				An escalation policy removes the emotional weight from that decision. The severity
				level determines who gets notified. The supervisor declares the incident, assigns a
				severity based on clear criteria, and the system handles the rest. No judgment calls
				about who to call or whether to "bother" someone.
			</p>

			<h2>Getting started with escalation policies</h2>

			<p>
				You don't need software to start thinking about escalation. Here's a simple framework:
			</p>

			<ol>
				<li><strong>Define 2-3 severity levels.</strong> Keep it simple. Critical, major, minor. Write a one-sentence description of each that your shift teams can easily apply.</li>
				<li><strong>Map people to severities.</strong> For each severity, who should be notified immediately? Who should be notified after a delay?</li>
				<li><strong>Define time-based escalation.</strong> If the initial responders haven't resolved a SEV-2 within 30 minutes, who gets notified next?</li>
				<li><strong>Account for time of day.</strong> Day shift and night shift might have different escalation paths.</li>
			</ol>

			<p>
				Write this down. Share it with your shift teams. Even a document on a shared drive
				is better than nothing. And when you're ready to automate it —
				<a href="/how-it-works">that's exactly what Haveri does</a>.
			</p>

			<p>
				The goal isn't to eliminate phone calls entirely. It's to make sure that when the
				phone rings at 3 AM, it's because it genuinely needed to.
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
