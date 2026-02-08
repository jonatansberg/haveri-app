<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
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
</svelte:head>

<div class="relative min-h-screen">
  {#if data.user}
    <header class="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div class="flex items-center gap-3">
          <a href="/" class="font-display text-2xl text-slate-950">Haveri</a>
          <Badge variant="secondary" class="hidden md:inline-flex">{data.user.email}</Badge>
        </div>

        <nav class="flex items-center gap-2">
          <Button href="/" variant="ghost">Dashboard</Button>
          <Button variant="outline" onclick={signOut}>Sign out</Button>
        </nav>
      </div>
      <Separator />
    </header>
  {/if}

  <main class="mx-auto max-w-7xl p-4 md:p-6">
    <slot />
  </main>
</div>
