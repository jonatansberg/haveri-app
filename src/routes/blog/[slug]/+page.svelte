<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>{data.post.title} | Haveri Blog</title>
  <meta property="og:title" content={data.post.title} />
  <meta property="og:description" content={data.post.summary} />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={data.post.title} />
  <meta name="twitter:description" content={data.post.summary} />
</svelte:head>

<article class="mx-auto max-w-3xl space-y-6 py-10">
  <a href="/blog" class="text-sm text-slate-500 hover:underline">Back to blog</a>
  <header class="space-y-2">
    <h1 class="text-4xl font-semibold text-slate-900">{data.post.title}</h1>
    <p class="text-sm text-slate-500">{data.post.publishedAt} · {data.post.author} · {data.readTimeMinutes} min read</p>
  </header>

  <div class="space-y-4 text-slate-800">
    {#each data.post.content as paragraph}
      <p>{paragraph}</p>
    {/each}
  </div>
</article>
