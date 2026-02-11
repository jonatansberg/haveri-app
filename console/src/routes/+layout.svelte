<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authClient } from '$lib/auth-client';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  async function signOut(): Promise<void> {
    await authClient.signOut();
    await goto('/login');
  }
</script>

<svelte:head>
  <title>Haveri</title>
  {#if data.plausibleDomain}
    <script
      defer
      data-domain={data.plausibleDomain}
      src="https://plausible.io/js/script.js"
    ></script>
  {/if}
</svelte:head>

<div class="relative min-h-screen">
  {#if data.user}
    <header class="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div class="flex items-center gap-3">
          <a href="/" class="font-display text-2xl text-slate-950 decoration-amber/30 underline decoration-2 underline-offset-4">Haveri</a>
          <Badge variant="secondary" class="hidden md:inline-flex">{data.organizationSlug}</Badge>
        </div>

        <nav class="flex items-center gap-2">
          <Button href="/" variant="ghost" class={$page.url.pathname === '/' ? 'bg-warm-100 text-slate-900 font-semibold' : ''}>Dashboard</Button>
          <Button href="/followups" variant="ghost" class={$page.url.pathname === '/followups' ? 'bg-warm-100 text-slate-900 font-semibold' : ''}>Follow-ups</Button>
          <Button href="/settings" variant="ghost" class={$page.url.pathname === '/settings' ? 'bg-warm-100 text-slate-900 font-semibold' : ''}>Settings</Button>
          <Button variant="outline" onclick={signOut}>Sign out</Button>
        </nav>
      </div>
      <Separator />
    </header>
  {:else}
    <header class="border-b border-border/80 bg-background/95">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <a href="/landing" class="font-display text-2xl text-slate-950">Haveri</a>
        <nav class="flex items-center gap-2">
          <Button href="/about" variant="ghost">About</Button>
          <Button href="/blog" variant="ghost">Blog</Button>
          <Button href="/contact" variant="ghost">Contact</Button>
          <Button href="/login" variant="outline">Sign in</Button>
        </nav>
      </div>
      <Separator />
    </header>
  {/if}

  <main class="mx-auto max-w-7xl p-4 md:p-6">
    <slot />
  </main>
</div>
