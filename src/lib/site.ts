import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/** Build an internal link that works under a GitHub Pages sub-path (e.g. /lab-website/). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}

export const nav = [
  { href: '', label: 'Home' },
  { href: 'people/', label: 'People' },
  { href: 'research/', label: 'Research' },
  { href: 'teaching/', label: 'Teaching' },
  { href: 'outreach/', label: 'Training & Outreach' },
  { href: 'publications/', label: 'Publications' },
  { href: 'news/', label: 'News' },
  { href: 'contact/', label: 'Contact' },
];

export async function getSettings() {
  const entry = await getEntry('settings', 'settings');
  if (!entry) throw new Error('Missing src/content/site/settings.yml');
  return entry.data;
}

/** Single-file page content, e.g. getPage('home') -> src/content/pages/home.yml */
type PageCollection = 'home' | 'research' | 'teaching' | 'outreach' | 'alumni' | 'publications_page';

export async function getPage<C extends PageCollection>(collection: C): Promise<CollectionEntry<C>['data']> {
  const [entry] = (await getCollection(collection)) as CollectionEntry<C>[];
  if (!entry) throw new Error(`Missing content for "${collection}" in src/content/pages`);
  return entry.data;
}

export async function getPublishedNews() {
  const posts = await getCollection('news', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const roleOrder = [
  'Principal Investigator',
  'Postdoctoral Researcher',
  'Staff',
  'Visiting Scholar',
  'Graduate Student',
  'Undergraduate Student',
] as const;

export const roleHeading: Record<(typeof roleOrder)[number], string> = {
  'Principal Investigator': 'Principal Investigator',
  'Postdoctoral Researcher': 'Postdoctoral Researchers',
  Staff: 'Staff',
  'Visiting Scholar': 'Visiting Scholars',
  'Graduate Student': 'Graduate Students',
  'Undergraduate Student': 'Undergraduate Students',
};

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** Split editor text on blank lines into paragraphs. */
export function paragraphs(text?: string) {
  return (text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function mailto(email: string) {
  return `mailto:${email}`;
}
