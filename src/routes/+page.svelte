<script lang="ts">
	import { onMount } from 'svelte';

	let emailValue = $state('');
	let submitted = $state(false);
	let submitting = $state(false);

	onMount(() => {
		const reveals = document.querySelectorAll('.reveal');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
		);
		reveals.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});

	async function handleEmailSubmit(e: Event) {
		e.preventDefault();
		if (!emailValue || submitting) return;
		submitting = true;
		// Replace with your Formspree/Loops endpoint
		try {
			const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: emailValue })
			});
			if (res.ok) submitted = true;
		} catch {
			// Fallback: open mailto
			window.location.href = `mailto:hello@haveri.app?subject=Early access&body=I'd like early access. My email: ${emailValue}`;
		}
		submitting = false;
	}
</script>

<svelte:head>
	<title>Haveri — From haveri to handled.</title>
</svelte:head>

<!-- HERO -->
<section class="hero">
	<div class="hero-badge">
		<span class="badge-dot"></span>
		Early access — now onboarding teams
	</div>
	<h1>From <em>haveri</em> to&nbsp;handled.</h1>
	<p class="hero-sub">
		Incident management for teams that build real things. Structured, chat-native, and designed to
		make your operation smarter with every incident.
	</p>
	<div class="hero-actions">
		<a href="/contact" class="btn-primary">Get early access &rarr;</a>
		<a href="/how-it-works" class="btn-secondary">See how it works</a>
	</div>

	<!-- WHO IT'S FOR -->
	<div class="who-strip">
		<span class="who-label">Built for</span>
		<span class="who-tag">Production managers</span>
		<span class="who-sep">&middot;</span>
		<span class="who-tag">Shift supervisors</span>
		<span class="who-sep">&middot;</span>
		<span class="who-tag">Operations teams</span>
		<span class="who-sep">&middot;</span>
		<span class="who-tag">20–500 person manufacturers</span>
	</div>

	<!-- TEAMS MOCKUP -->
	<div class="hero-visual">
		<div class="teams-window">
			<div class="teams-sidebar">
				<div class="teams-sidebar-header">
					Production Ops
					<span class="teams-icon-btn">&ctdot;</span>
				</div>
				<div class="teams-channel-group">
					<div class="teams-channel-group-label">Channels</div>
					<div class="teams-channel"><span class="channel-hash">#</span> General</div>
					<div class="teams-channel"><span class="channel-hash">#</span> Shift handover</div>
					<div class="teams-channel">
						<span class="channel-hash">#</span> Maintenance log
					</div>
				</div>
				<div class="teams-channel-group">
					<div class="teams-channel-group-label">Active incidents</div>
					<div class="teams-channel active">
						<span class="channel-hash">#</span> inc-2847-line2
						<span class="unread-dot"></span>
					</div>
				</div>
				<div class="teams-channel-group">
					<div class="teams-channel-group-label">Recent incidents</div>
					<div class="teams-channel"><span class="channel-hash">#</span> inc-2846-packaging</div>
					<div class="teams-channel"><span class="channel-hash">#</span> inc-2841-cooling</div>
				</div>
			</div>

			<div class="teams-chat">
				<div class="teams-chat-header">
					<h3># inc-2847-line2</h3>
					<span class="teams-sev-badge">SEV-2</span>
					<span class="header-meta">Pressure drop on Line 2 &middot; South Hall</span>
				</div>

				<div class="teams-messages">
					<div class="teams-system-msg" style="animation-delay: 0.5s">
						<span class="sys-icon">&#9889;</span>
						<span
							><strong>Anna Lindqvist</strong> declared a <strong>SEV-2</strong> incident
							— Pressure drop on Line 2, South Hall</span
						>
					</div>

					<div class="teams-msg" style="animation-delay: 0.9s">
						<div class="msg-avatar avatar-haveri">h</div>
						<div class="msg-body">
							<div class="msg-header">
								<span class="msg-name name-bot">haveri</span>
								<span class="msg-time">14:32</span>
							</div>
							<div class="msg-text">
								Incident channel created. Shift team B notified (4 members). What are
								you seeing — pressure, temperature, vibration, or something else?
							</div>
						</div>
					</div>

					<div class="teams-msg" style="animation-delay: 1.3s">
						<div class="msg-avatar avatar-anna">AL</div>
						<div class="msg-body">
							<div class="msg-header">
								<span class="msg-name">Anna Lindqvist</span>
								<span class="msg-time">14:33</span>
							</div>
							<div class="msg-text">
								Pressure. Main valve gauge reading 0.2 bar, should be 1.5
							</div>
						</div>
					</div>

					<div class="teams-msg" style="animation-delay: 1.7s">
						<div class="msg-avatar avatar-haveri">h</div>
						<div class="msg-body">
							<div class="msg-header">
								<span class="msg-name name-bot">haveri</span>
								<span class="msg-time">14:34</span>
							</div>
							<div class="msg-text">
								Noted. This looks similar to a recent incident on the same equipment.
							</div>
						</div>
					</div>
					<div class="teams-insight-card" style="animation-delay: 1.9s">
						<div class="insight-label">&#128206; Similar incident &middot; INC-2801</div>
						Same valve, 3 weeks ago. Root cause was a worn seal — replaced in 20 min by Erik's
						team. <span class="highlight">Seal type: DN50 EPDM</span>
					</div>

					<div class="teams-msg" style="animation-delay: 2.3s">
						<div class="msg-avatar avatar-anna">AL</div>
						<div class="msg-body">
							<div class="msg-header">
								<span class="msg-name">Anna Lindqvist</span>
								<span class="msg-time">14:41</span>
							</div>
							<div class="msg-text">
								Confirmed — seal is gone. Same as last time. Replacing now, we have
								spares in stock.
							</div>
						</div>
					</div>

					<div class="teams-system-msg resolved" style="animation-delay: 2.7s">
						<span class="sys-icon">&check;</span>
						<span
							><strong>Anna Lindqvist</strong> resolved the incident. Duration:
							<strong>26 min</strong>. Follow-up created: review seal replacement
							schedule for Line 2 main valve.</span
						>
					</div>
				</div>

				<div class="teams-compose">
					<div class="teams-compose-bar">
						<span>Type a message&hellip;</span>
						<div class="teams-compose-icons">&#128206; &#128522;</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- PROBLEM / SOLUTION -->
<section class="problem-section" id="how-it-works">
	<div class="section-inner">
		<div class="reveal">
			<span class="section-label">The reality</span>
			<h2 class="section-heading">
				The fix your team figured out at 3 AM shouldn't disappear into
				a&nbsp;group&nbsp;chat.
			</h2>
			<p class="section-text">
				Every manufacturing team knows the cycle. Something breaks, the group chat explodes,
				someone fixes it, nobody writes it down, and two months later it happens again.
			</p>
		</div>

		<div class="problem-grid reveal">
			<div class="problem-col">
				<h3>Today: <span>chaos as protocol</span></h3>
				<div class="problem-item">
					<strong>Something breaks down.</strong>
					Three people start troubleshooting in parallel — in the same group chat, stepping on
					each other, not knowing what the others have already tried.
				</div>
				<div class="problem-item">
					<strong>The 3 AM phone call.</strong>
					The shift supervisor wakes the production manager because there's no escalation path —
					just panic.
				</div>
				<div class="problem-item">
					<strong>It gets fixed. Somehow.</strong>
					But nobody records what happened, what worked, or what should be different next time.
				</div>
				<div class="problem-item">
					<strong>It happens again.</strong>
					Same equipment, same symptoms, same confusion — but different people on shift. The ones
					who fixed it last time aren't around, and the knowledge left with them.
				</div>
			</div>
			<div class="problem-col">
				<h3>With Haveri: <span>structure without friction</span></h3>
				<div class="solution-item">
					<strong>Declare an incident.</strong>
					One command in Teams. Haveri creates a focused channel, notifies the right people, starts
					the clock.
				</div>
				<div class="solution-item">
					<strong>Smart escalation.</strong>
					SEV-3 stays with the shift team. SEV-1 pages the production manager. Rules you configure,
					not panic you manage.
				</div>
				<div class="solution-item">
					<strong>Every message becomes a timeline.</strong>
					Your team just talks. Haveri captures, timestamps, and structures everything
					automatically.
				</div>
				<div class="solution-item">
					<strong>The system remembers.</strong>
					Next time this happens, Haveri surfaces what worked before. The fix stays with the team,
					not the individual.
				</div>
			</div>
		</div>
	</div>
</section>

<!-- FEATURES -->
<section id="features">
	<div class="section-inner">
		<div class="reveal">
			<span class="section-label">Capabilities</span>
			<h2 class="section-heading">Everything your team needs. Nothing they won't&nbsp;use.</h2>
			<p class="section-text">
				Haveri lives in the chat tools your team already uses. No new app to install, no workflow
				to learn.
			</p>
		</div>

		<div class="features-grid reveal">
			<div class="feature-card">
				<div class="feature-icon">&#9889;</div>
				<h3>One-command incidents</h3>
				<p>
					Declare, triage, and resolve incidents without leaving Teams. The bot handles channel
					creation, notifications, and structured data capture.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">&#128203;</div>
				<h3>Automatic timeline</h3>
				<p>
					Every message, status change, and escalation is captured as a timestamped event. Your
					audit trail builds itself.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">&#128276;</div>
				<h3>Configurable escalation</h3>
				<p>
					Define who gets notified based on severity, area, and time of day. Replace the panic
					call tree with intelligent routing.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">&#128269;</div>
				<h3>Incident memory</h3>
				<p>
					When a new incident is declared, Haveri surfaces similar past incidents and what
					resolved them. Your team's experience compounds.
				</p>
				<span class="phase-tag">Coming soon</span>
			</div>

			<div class="feature-card">
				<div class="feature-icon">&#128196;</div>
				<h3>SOP guidance</h3>
				<p>
					Upload your procedures. Haveri retrieves relevant steps during an incident — the right
					information at the right moment.
				</p>
				<span class="phase-tag">Coming soon</span>
			</div>

			<div class="feature-card">
				<div class="feature-icon">&#128200;</div>
				<h3>Trend detection</h3>
				<p>
					Spot patterns across incidents: recurring equipment, common root causes, areas that
					need attention. Move from reactive to proactive.
				</p>
				<span class="phase-tag">Coming soon</span>
			</div>
		</div>
	</div>
</section>

<!-- TIMELINE PREVIEW -->
<section class="timeline-section" id="timeline">
	<div class="section-inner">
		<div class="timeline-split">
			<div class="reveal">
				<span class="section-label">The incident brain</span>
				<h2 class="section-heading">Every incident makes your team <em>smarter</em></h2>
				<p class="section-text">
					Haveri captures the full context of every incident — not just what happened, but who
					was involved, what was tried, and what finally worked. Over time, this becomes your
					most valuable operational asset.
				</p>
				<p class="section-text" style="margin-top: 1rem;">
					The knowledge that used to live in one senior operator's head now lives in the system
					— searchable, referenceable, always available.
				</p>
			</div>
			<div class="reveal">
				<div class="timeline-preview">
					<div class="timeline-preview-header">
						<h4>INC-2847 &middot; Line 2 pressure drop</h4>
						<span class="incident-badge">SEV-2 &middot; RESOLVED</span>
					</div>
					<div class="timeline-events">
						<div class="timeline-event event-declaration">
							<span class="te-time">14:32</span>
							<span class="te-dot"></span>
							<div class="te-content">
								<span class="te-actor">Anna Lindqvist</span> declared incident
								<div class="te-meta">
									Line 2, South Hall &middot; Main valve pressure reading 0.2 bar
									(expected 1.5)
								</div>
							</div>
						</div>
						<div class="timeline-event event-escalation">
							<span class="te-time">14:32</span>
							<span class="te-dot"></span>
							<div class="te-content">
								Shift team B notified via escalation policy
								<div class="te-meta">
									Policy: SEV-2 default &middot; 4 members notified
								</div>
							</div>
						</div>
						<div class="timeline-event">
							<span class="te-time">14:34</span>
							<span class="te-dot"></span>
							<div class="te-content">
								<span class="te-actor">haveri</span> surfaced similar incident INC-2801
								<div class="te-meta">
									Same valve, 3 weeks ago — seal failure, replaced in 20 min
								</div>
							</div>
						</div>
						<div class="timeline-event">
							<span class="te-time">14:41</span>
							<span class="te-dot"></span>
							<div class="te-content">
								<span class="te-actor">Anna Lindqvist</span> confirmed seal failure, replacing
							</div>
						</div>
						<div class="timeline-event event-resolution">
							<span class="te-time">14:58</span>
							<span class="te-dot"></span>
							<div class="te-content">
								<span class="te-actor">Anna Lindqvist</span> resolved incident
								<div class="te-meta">
									Duration: 26 min &middot; Root cause: worn valve seal &middot;
									Follow-up: review replacement schedule
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- TRANSFORMATION ARC -->
<section class="transform-section" id="vision">
	<div class="section-inner">
		<div class="reveal">
			<span class="section-label">The journey</span>
			<h2 class="section-heading">From <em>haveri</em> to hardly&nbsp;ever</h2>
			<p class="section-text">
				Haveri isn't just about managing incidents better. It's about building the
				organizational muscle to have fewer of them.
			</p>
		</div>
		<div class="transform-flow reveal">
			<div class="transform-step step-start">
				<div class="step-label">Haveri</div>
				<div class="step-desc">Chaos. No process.</div>
			</div>
			<div class="transform-arrow">&rarr;</div>
			<div class="transform-step step-mid">
				<div class="step-label">Structure</div>
				<div class="step-desc">Clear roles. Calm response.</div>
			</div>
			<div class="transform-arrow">&rarr;</div>
			<div class="transform-step step-mid">
				<div class="step-label">Learning</div>
				<div class="step-desc">Every incident teaches.</div>
			</div>
			<div class="transform-arrow">&rarr;</div>
			<div class="transform-step step-end">
				<div class="step-label">Prevention</div>
				<div class="step-desc">Fewer haverier.</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA -->
<section class="cta-section" id="cta">
	<div class="section-inner">
		<div class="reveal">
			<span class="section-label">Early access</span>
			<h2 class="section-heading">Ready to handle your next&nbsp;<em>haveri</em>?</h2>
			<p class="section-text">
				We're onboarding a small number of teams for early access. If your team manages
				incidents through group chats and phone calls, we'd love to talk.
			</p>

			{#if submitted}
				<div class="email-success">
					<p>You're on the list. We'll be in touch soon.</p>
				</div>
			{:else}
				<form class="email-form" onsubmit={handleEmailSubmit}>
					<input
						type="email"
						bind:value={emailValue}
						placeholder="you@company.com"
						required
						class="email-input"
					/>
					<button type="submit" class="btn-amber" disabled={submitting}>
						{submitting ? 'Sending...' : 'Get early access →'}
					</button>
				</form>
				<p class="email-hint">No spam. We'll reach out to schedule a 15-minute intro call.</p>
			{/if}
		</div>
	</div>
</section>

<style>
	/* ─── HERO ─── */
	.hero {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 8rem 2rem 4rem;
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.85rem;
		background: var(--color-amber-glow);
		border: 1px solid rgba(212, 148, 58, 0.2);
		border-radius: 100px;
		font-size: 0.8rem;
		color: var(--color-amber);
		font-weight: 500;
		margin-bottom: 2rem;
		width: fit-content;
		animation: fadeUp 0.8s ease both;
	}

	.badge-dot {
		width: 6px;
		height: 6px;
		background: var(--color-amber);
		border-radius: 50%;
		animation: pulse 2s ease infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	.hero h1 {
		font-family: var(--font-display);
		font-size: clamp(2.8rem, 6vw, 4.8rem);
		font-weight: 400;
		line-height: 1.1;
		color: var(--color-slate-950);
		letter-spacing: -0.03em;
		max-width: 780px;
		animation: fadeUp 0.8s ease 0.1s both;
	}

	.hero h1 em {
		font-style: italic;
		color: var(--color-amber);
	}

	.hero-sub {
		font-size: 1.15rem;
		line-height: 1.65;
		color: var(--color-slate-500);
		max-width: 520px;
		margin-top: 1.75rem;
		animation: fadeUp 0.8s ease 0.2s both;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2.5rem;
		animation: fadeUp 0.8s ease 0.3s both;
	}

	/* WHO IT'S FOR strip */
	.who-strip {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-top: 2rem;
		flex-wrap: wrap;
		animation: fadeUp 0.8s ease 0.35s both;
	}

	.who-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-slate-400);
	}

	.who-tag {
		font-size: 0.78rem;
		color: var(--color-slate-500);
		padding: 0.2rem 0.6rem;
		background: var(--color-warm-100);
		border-radius: 4px;
	}

	.who-sep {
		color: var(--color-warm-300);
		font-size: 0.7rem;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ─── TEAMS CHAT MOCKUP ─── */
	.hero-visual {
		margin-top: 5rem;
		animation: fadeUp 0.8s ease 0.45s both;
	}

	.teams-window {
		background: var(--color-teams-white);
		border-radius: 12px;
		overflow: hidden;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 8px 40px rgba(26, 29, 35, 0.1),
			0 30px 80px rgba(26, 29, 35, 0.07);
		border: 1px solid var(--color-teams-border);
		display: grid;
		grid-template-columns: 220px 1fr;
		height: 480px;
	}

	.teams-sidebar {
		background: var(--color-teams-sidebar);
		border-right: 1px solid var(--color-teams-border);
		display: flex;
		flex-direction: column;
	}

	.teams-sidebar-header {
		padding: 14px 16px 10px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-teams-text);
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--color-teams-border);
	}

	.teams-sidebar-header .teams-icon-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		color: var(--color-teams-text-secondary);
		font-size: 0.85rem;
	}

	.teams-channel-group {
		padding: 8px 0;
	}

	.teams-channel-group-label {
		padding: 4px 16px;
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--color-teams-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.teams-channel {
		padding: 5px 16px 5px 28px;
		font-size: 0.78rem;
		color: var(--color-teams-text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: background 0.15s;
	}

	.teams-channel:hover {
		background: rgba(0, 0, 0, 0.04);
	}

	.teams-channel.active {
		background: rgba(98, 100, 167, 0.1);
		color: var(--color-teams-purple);
		font-weight: 500;
	}

	.teams-channel .channel-hash {
		font-size: 0.85rem;
		opacity: 0.5;
		font-weight: 400;
	}

	.teams-channel .unread-dot {
		width: 6px;
		height: 6px;
		background: var(--color-teams-purple);
		border-radius: 50%;
		margin-left: auto;
		flex-shrink: 0;
	}

	.teams-chat {
		display: flex;
		flex-direction: column;
		background: var(--color-teams-white);
	}

	.teams-chat-header {
		padding: 12px 20px;
		border-bottom: 1px solid var(--color-teams-border);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.teams-chat-header h3 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-teams-text);
	}

	.teams-sev-badge {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 3px;
		background: rgba(212, 148, 58, 0.15);
		color: #b07a2a;
		letter-spacing: 0.03em;
	}

	.teams-chat-header .header-meta {
		margin-left: auto;
		font-size: 0.72rem;
		color: var(--color-teams-text-secondary);
	}

	.teams-messages {
		flex: 1;
		padding: 16px 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.teams-msg {
		display: grid;
		grid-template-columns: 32px 1fr;
		gap: 10px;
		padding: 6px 8px;
		border-radius: 6px;
		opacity: 0;
		animation: msgAppear 0.35s ease forwards;
		transition: background 0.15s;
	}

	.teams-msg:hover {
		background: var(--color-teams-hover);
	}

	@keyframes msgAppear {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.msg-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.msg-avatar.avatar-anna {
		background: #7b83c4;
	}
	.msg-avatar.avatar-haveri {
		background: var(--color-amber);
	}

	.msg-body {
		min-width: 0;
	}

	.msg-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 2px;
	}

	.msg-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-teams-text);
	}

	.msg-name.name-bot {
		color: var(--color-amber);
	}

	.msg-time {
		font-size: 0.68rem;
		color: var(--color-teams-text-secondary);
	}

	.msg-text {
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-teams-text);
	}

	.msg-text :global(.highlight) {
		background: rgba(212, 148, 58, 0.12);
		padding: 1px 5px;
		border-radius: 3px;
		font-weight: 500;
	}

	.teams-system-msg {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		margin: 4px 0;
		background: var(--color-teams-purple-light);
		border-radius: 6px;
		border-left: 3px solid var(--color-teams-purple);
		font-size: 0.78rem;
		color: var(--color-teams-text);
		opacity: 0;
		animation: msgAppear 0.35s ease forwards;
	}

	.teams-system-msg .sys-icon {
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.teams-system-msg.resolved {
		background: rgba(90, 154, 106, 0.1);
		border-left-color: var(--color-sev3);
	}

	.teams-insight-card {
		margin: 4px 0 4px 42px;
		padding: 10px 14px;
		background: var(--color-amber-glow);
		border: 1px solid rgba(212, 148, 58, 0.18);
		border-radius: 8px;
		font-size: 0.78rem;
		line-height: 1.5;
		color: var(--color-teams-text);
		opacity: 0;
		animation: msgAppear 0.35s ease forwards;
	}

	.teams-insight-card .insight-label {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-amber);
		margin-bottom: 4px;
	}

	.teams-compose {
		padding: 12px 20px;
		border-top: 1px solid var(--color-teams-border);
	}

	.teams-compose-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		background: var(--color-teams-bg);
		border: 1px solid var(--color-teams-border);
		border-radius: 6px;
	}

	.teams-compose-bar span {
		font-size: 0.8rem;
		color: #999;
	}

	.teams-compose-icons {
		margin-left: auto;
		display: flex;
		gap: 8px;
		color: var(--color-teams-text-secondary);
		font-size: 0.85rem;
	}

	/* ─── SECTIONS ─── */
	section {
		padding: 7rem 2rem;
	}

	.section-inner {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* ─── PROBLEM → SOLUTION ─── */
	.problem-section {
		background: var(--color-slate-950);
		color: var(--color-warm-white);
		position: relative;
		overflow: hidden;
	}

	.problem-section::before {
		content: '';
		position: absolute;
		top: -200px;
		right: -200px;
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, rgba(212, 148, 58, 0.06) 0%, transparent 70%);
		pointer-events: none;
	}

	.problem-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6rem;
		margin-top: 4rem;
	}

	.problem-col h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 500;
		margin-bottom: 2rem;
		color: var(--color-slate-400);
	}

	.problem-col h3 span {
		color: var(--color-warm-white);
	}

	.problem-item {
		padding: 1.25rem 0;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-slate-400);
	}

	.problem-item strong {
		color: var(--color-warm-200);
		font-weight: 500;
	}

	.solution-item {
		padding: 1.25rem 0;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-slate-300);
	}

	.solution-item strong {
		color: var(--color-amber-light);
		font-weight: 500;
	}

	.problem-section :global(.section-heading) {
		color: var(--color-warm-white);
	}

	.problem-section :global(.section-text) {
		color: var(--color-slate-400);
	}

	/* ─── FEATURES ─── */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-top: 4rem;
	}

	.feature-card {
		padding: 2.25rem;
		background: var(--color-warm-white);
		border: 1px solid var(--color-warm-200);
		border-radius: 10px;
		transition: all 0.35s;
	}

	.feature-card:hover {
		border-color: var(--color-warm-300);
		box-shadow: 0 8px 40px rgba(26, 29, 35, 0.06);
		transform: translateY(-2px);
	}

	.feature-icon {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
		font-size: 1.1rem;
		background: var(--color-amber-glow);
		color: var(--color-amber);
	}

	.feature-card h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--color-slate-900);
		margin-bottom: 0.65rem;
		letter-spacing: -0.01em;
	}

	.feature-card p {
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--color-slate-500);
	}

	.feature-card .phase-tag {
		display: inline-block;
		margin-top: 1rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-slate-400);
		padding: 0.2rem 0.55rem;
		background: var(--color-warm-100);
		border-radius: 4px;
	}

	/* ─── TIMELINE PREVIEW ─── */
	.timeline-section {
		background: var(--color-warm-100);
	}

	.timeline-split {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 5rem;
		align-items: center;
		margin-top: 3rem;
	}

	.timeline-preview {
		background: white;
		border-radius: 10px;
		border: 1px solid var(--color-warm-200);
		overflow: hidden;
		box-shadow: 0 4px 30px rgba(26, 29, 35, 0.05);
	}

	.timeline-preview-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--color-warm-200);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.timeline-preview-header h4 {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-slate-900);
	}

	.timeline-preview-header .incident-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		background: rgba(212, 148, 58, 0.12);
		color: var(--color-amber);
		letter-spacing: 0.03em;
	}

	.timeline-events {
		padding: 0.5rem 0;
	}

	.timeline-event {
		display: grid;
		grid-template-columns: 70px 20px 1fr;
		padding: 0.75rem 1.5rem;
		align-items: start;
		font-size: 0.85rem;
		transition: background 0.2s;
	}

	.timeline-event:hover {
		background: var(--color-warm-100);
	}

	.timeline-event .te-time {
		color: var(--color-slate-400);
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		padding-top: 0.1rem;
	}

	.timeline-event .te-dot {
		display: flex;
		justify-content: center;
		padding-top: 0.35rem;
	}

	.timeline-event .te-dot::before {
		content: '';
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-warm-300);
	}

	.timeline-event.event-declaration .te-dot::before {
		background: var(--color-sev2);
	}
	.timeline-event.event-escalation .te-dot::before {
		background: var(--color-amber);
	}
	.timeline-event.event-resolution .te-dot::before {
		background: var(--color-sev3);
	}

	.timeline-event .te-content {
		color: var(--color-slate-700);
		line-height: 1.5;
	}

	.timeline-event .te-content .te-actor {
		font-weight: 500;
		color: var(--color-slate-900);
	}

	.timeline-event .te-content .te-meta {
		color: var(--color-slate-400);
		font-size: 0.78rem;
		margin-top: 0.15rem;
	}

	/* ─── TRANSFORMATION ─── */
	.transform-section {
		text-align: center;
	}

	.transform-section :global(.section-heading) {
		margin: 0 auto;
	}

	.transform-section :global(.section-text) {
		margin: 1.25rem auto 0;
		max-width: 560px;
	}

	.transform-flow {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 4rem;
		flex-wrap: wrap;
	}

	.transform-step {
		padding: 1.5rem 2rem;
		border-radius: 10px;
		text-align: center;
		min-width: 140px;
	}

	.transform-step.step-start {
		background: var(--color-slate-900);
		color: var(--color-warm-white);
	}

	.transform-step.step-mid {
		background: var(--color-warm-100);
		border: 1px solid var(--color-warm-200);
	}

	.transform-step.step-end {
		background: var(--color-amber-glow);
		border: 1px solid rgba(212, 148, 58, 0.2);
	}

	.transform-step .step-label {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 500;
	}

	.transform-step .step-desc {
		font-size: 0.78rem;
		margin-top: 0.35rem;
		opacity: 0.65;
	}

	.transform-arrow {
		font-size: 1.2rem;
		color: var(--color-warm-300);
	}

	/* ─── CTA ─── */
	.cta-section {
		background: var(--color-slate-950);
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.cta-section::before {
		content: '';
		position: absolute;
		bottom: -150px;
		left: 50%;
		transform: translateX(-50%);
		width: 800px;
		height: 400px;
		background: radial-gradient(ellipse, rgba(212, 148, 58, 0.08) 0%, transparent 70%);
		pointer-events: none;
	}

	.cta-section :global(.section-heading) {
		color: var(--color-warm-white);
		margin: 0 auto;
		max-width: 500px;
	}

	.cta-section :global(.section-text) {
		color: var(--color-slate-400);
		margin: 1.25rem auto 0;
		max-width: 440px;
	}

	/* Email capture form */
	.email-form {
		display: flex;
		gap: 0.5rem;
		margin-top: 2rem;
		justify-content: center;
		max-width: 460px;
		margin-left: auto;
		margin-right: auto;
	}

	.email-input {
		flex: 1;
		padding: 0.75rem 1rem;
		background: var(--color-slate-800);
		border: 1.5px solid var(--color-slate-600);
		border-radius: 6px;
		color: var(--color-warm-white);
		font-family: var(--font-body);
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.email-input::placeholder {
		color: var(--color-slate-500);
	}

	.email-input:focus {
		border-color: var(--color-amber);
	}

	.email-hint {
		margin-top: 0.75rem;
		font-size: 0.78rem;
		color: var(--color-slate-600);
	}

	.email-success {
		margin-top: 2rem;
		padding: 1rem 1.5rem;
		background: rgba(90, 154, 106, 0.15);
		border: 1px solid rgba(90, 154, 106, 0.25);
		border-radius: 8px;
		display: inline-block;
	}

	.email-success p {
		color: var(--color-sev3);
		font-weight: 500;
		font-size: 0.95rem;
	}

	/* ─── RESPONSIVE ─── */
	@media (max-width: 900px) {
		.teams-window {
			grid-template-columns: 1fr;
			height: auto;
		}
		.teams-sidebar {
			display: none;
		}
		.problem-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}
		.features-grid {
			grid-template-columns: 1fr;
		}
		.timeline-split {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		.transform-flow {
			flex-direction: column;
		}
		.transform-arrow {
			transform: rotate(90deg);
		}
	}

	@media (max-width: 600px) {
		.hero {
			padding: 6rem 1.25rem 3rem;
		}
		section {
			padding: 4rem 1.25rem;
		}
		.hero-actions {
			flex-direction: column;
		}
		.email-form {
			flex-direction: column;
		}
	}
</style>
