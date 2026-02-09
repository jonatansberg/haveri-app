import { blogPosts, estimateReadTimeMinutes } from '$lib/marketing/blog-posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const posts = [...blogPosts]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map((post) => ({
      ...post,
      readTimeMinutes: estimateReadTimeMinutes(post.content)
    }));

  return { posts };
};
