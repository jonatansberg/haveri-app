<script lang="ts">
  import type { ActionData } from './$types';

  export let form: ActionData | null = null;
</script>

<svelte:head>
  <title>Contact Haveri</title>
  <meta name="description" content="Get in touch with the Haveri team." />
</svelte:head>

<section class="mx-auto max-w-3xl space-y-6 py-10">
  <h1 class="text-4xl font-semibold text-slate-900">Contact</h1>

  <form method="POST" action="?/submit" class="grid gap-3 rounded-xl border border-slate-300 bg-white p-4">
    <input name="name" required placeholder="Name" class="rounded-md border border-slate-300 px-3 py-2" />
    <input name="email" type="email" required placeholder="Email" class="rounded-md border border-slate-300 px-3 py-2" />
    <input name="company" required placeholder="Company" class="rounded-md border border-slate-300 px-3 py-2" />
    <input name="role" required placeholder="Role" class="rounded-md border border-slate-300 px-3 py-2" />
    <input name="teamSize" required placeholder="Team size" class="rounded-md border border-slate-300 px-3 py-2" />
    <textarea
      name="message"
      required
      rows="5"
      placeholder="What are you trying to improve?"
      class="rounded-md border border-slate-300 px-3 py-2"
    ></textarea>
    <button type="submit" class="rounded-md bg-slate-900 px-4 py-2 text-white">Send</button>
  </form>

  {#if form?.submitted}
    <p class="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      Thanks. We received your message.
    </p>
  {/if}

  {#if form?.error}
    <p class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      Please check required fields and try again.
    </p>
  {/if}
</section>
