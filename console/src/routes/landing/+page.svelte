<script lang="ts">
  import type { ActionData } from './$types';

  export let form: ActionData | null = null;
</script>

<svelte:head>
  <title>Haveri | Incident Response for Operations</title>
  <meta
    name="description"
    content="Declare incidents, route escalation, and close follow-ups without leaving Teams."
  />
</svelte:head>

<section class="mx-auto max-w-4xl space-y-8 py-10">
  <div class="space-y-4">
    <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Haveri</p>
    <h1 class="text-4xl font-semibold text-slate-900">Incident response for frontline operations</h1>
    <p class="text-lg text-slate-600">
      Declare faster, escalate with clear ownership, and close with follow-ups that actually land.
    </p>
  </div>

  <form method="POST" action="?/captureEmail" class="grid gap-3 rounded-xl border border-slate-300 bg-white p-4 md:grid-cols-[1fr_auto]">
    <input
      type="email"
      name="email"
      required
      placeholder="you@company.com"
      class="rounded-md border border-slate-300 px-3 py-2"
    />
    <button type="submit" class="rounded-md bg-slate-900 px-4 py-2 text-white">Join waitlist</button>
  </form>

  {#if form?.captured}
    <p class="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      Thanks. You are on the list.
    </p>
  {/if}

  {#if form?.error}
    <p class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      Enter a valid email address.
    </p>
  {/if}
</section>
