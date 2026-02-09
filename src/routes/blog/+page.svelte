<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Haveri Blog</title>
  <meta name="description" content="Product and operational incident response writing from Haveri." />
</svelte:head>

<section class="mx-auto max-w-3xl space-y-6 py-10">
  <h1 class="text-4xl font-semibold text-slate-900">Blog</h1>

  <div class="space-y-4">
    {#each data.posts as post}
      <article class="rounded-lg border border-slate-300 bg-white p-4">
        <a href={`/blog/${post.slug}`} class="text-xl font-semibold text-slate-900 hover:underline">{post.title}</a>
        <p class="mt-1 text-sm text-slate-500">{post.publishedAt} · {post.author} · {post.readTimeMinutes} min read</p>
        <p class="mt-2 text-slate-700">{post.summary}</p>
      </article>
    {/each}
  </div>
</section>
