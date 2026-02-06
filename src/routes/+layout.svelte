<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  async function signOut(): Promise<void> {
    await authClient.signOut();
    window.location.href = '/login';
  }
</script>

<svelte:head>
  <title>Haveri</title>
</svelte:head>

{#if data.user}
  <header class="topbar">
    <div>
      <strong>Haveri</strong>
      <span>{data.user.email}</span>
    </div>
    <nav>
      <a href="/">Dashboard</a>
      <button on:click={signOut}>Sign out</button>
    </nav>
  </header>
{/if}

<main>
  <slot />
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
    background: #f6f4ef;
    color: #1f2933;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #d8d4c8;
    background: linear-gradient(90deg, #efe8d6, #f9f7f2);
  }

  .topbar div {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .topbar nav {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  a {
    color: #18453b;
  }

  button {
    border: 1px solid #18453b;
    background: #18453b;
    color: #fff;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
  }
</style>
