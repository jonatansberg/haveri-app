import { error } from '@sveltejs/kit';
import { estimateReadTimeMinutes, getBlogPost } from '$lib/marketing/blog-posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const post = getBlogPost(params.slug);
  if (!post) {
    throw error(404, 'Post not found');
  }

  return {
    post,
    readTimeMinutes: estimateReadTimeMinutes(post.content)
  };
};
