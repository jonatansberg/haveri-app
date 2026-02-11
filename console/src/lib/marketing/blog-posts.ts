export interface BlogPost {
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  summary: string;
  content: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-we-built-haveri',
    title: 'Why We Built Haveri',
    author: 'Haveri Team',
    publishedAt: '2026-02-09',
    summary: 'Why frontline incident response deserves dedicated tooling.',
    content: [
      'Teams on the floor already move fast. The tooling around incidents does not.',
      'We built Haveri so incident declaration, triage, escalation, and follow-up happen in one flow.',
      'The goal is simple: less time spent coordinating, more time spent fixing the problem safely.'
    ]
  },
  {
    slug: 'incident-management-isnt-just-for-tech-companies',
    title: "Incident management isn't just for tech companies",
    author: 'Haveri Team',
    publishedAt: '2026-02-09',
    summary: 'Operational incidents in manufacturing have the same coordination failure modes as software incidents.',
    content: [
      'Manufacturing incidents are high-pressure and cross-functional.',
      'The same patterns from software incident response apply: clear ownership, live timeline, and strong handoff to follow-ups.',
      'Haveri is optimized for those patterns inside Microsoft Teams and industrial workflows.'
    ]
  }
];

export function getBlogPost(slug: string): BlogPost | null {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}

export function estimateReadTimeMinutes(content: string[]): number {
  const words = content.join(' ').split(/\s+/).filter((word) => word.length > 0).length;
  return Math.max(1, Math.round(words / 200));
}
