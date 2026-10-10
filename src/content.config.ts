/**
 * Content schemas. Everything editable in the admin panel (.pages.yml) lives in
 * src/content and is validated here at build time — a missing required field
 * fails the build instead of breaking the live site.
 *
 * When you add or rename a field here, mirror it in .pages.yml.
 */
import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The CMS may save empty optional fields as "" or null; treat those as absent.
const blankToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);
const text = () => z.preprocess(blankToUndefined, z.string().trim().optional());
const list = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v == null ? [] : v), z.array(item));

const photo = ({ image }: SchemaContext) =>
  z.object({
    image: image(),
    alt: z.string().min(1, 'Describe the photo for screen readers'),
    caption: text(),
  });

/** An optional single photo; clearing its image in the CMS hides it even if the description is left behind. */
const optionalPhoto = (ctx: SchemaContext) =>
  z.preprocess(
    (v) => (v && typeof v === 'object' && !blankToUndefined((v as { image?: unknown }).image) ? undefined : blankToUndefined(v)),
    photo(ctx).optional(),
  );

/** One YAML file per page, e.g. src/content/pages/home.yml -> id "home". */
const page = <S extends z.ZodType>(id: string, schema: (ctx: SchemaContext) => S) =>
  defineCollection({ loader: glob({ pattern: `${id}.yml`, base: './src/content/pages' }), schema });

const seo = {
  seo_title: text(),
  seo_description: text(),
};

export const collections = {
  settings: defineCollection({
    loader: glob({ pattern: 'settings.yml', base: './src/content/site' }),
    schema: ({ image }) =>
      z.object({
        name: z.string(),
        short_name: z.string(),
        tagline: z.string(),
        description: z.string(),
        affiliation: z.string(),
        university_name: z.string(),
        university_url: text(),
        pi_name: z.string(),
        pi_title: text(),
        departments: list(z.string()),
        email: z.string(),
        phone: text(),
        office: text(),
        address: z.string(),
        map_query: text(),
        google_scholar: text(),
        linkedin: text(),
        twitter: text(),
        social_image: z.preprocess(blankToUndefined, image().optional()),
      }),
  }),

  home: page('home', (ctx) =>
    z.object({
      ...seo,
      hero_title: z.string(),
      hero_subtitle: z.string(),
      carousel: list(photo(ctx)).refine((v) => v.length > 0, 'Add at least one carousel photo'),
      intro: z.string(),
      mission_title: z.string(),
      mission: z.string(),
      discovery: z.preprocess(
        blankToUndefined,
        z
          .object({
            eyebrow: text(),
            title: z.string(),
            tagline: text(),
            stages: list(
              z.object({
                name: z.string(),
                icon: z.enum(['understand', 'control', 'inform', 'empower', 'impact']).default('understand'),
                points: list(z.string()),
              }),
            ),
            explore_label: text(),
            original_image: optionalPhoto(ctx),
          })
          .optional(),
      ),
      join_title: text(),
      join_text: text(),
    }),
  ),

  research: page('research', (ctx) =>
    z.object({
      ...seo,
      title: z.string(),
      subtitle: z.string(),
      intro: z.string(),
      directions: text(),
      framework_title: text(),
      framework: z.preprocess(
        blankToUndefined,
        z
          .object({
            title: z.string(),
            subtitle: text(),
            system_label: text(),
            stages: list(z.string()),
            flow_note: text(),
            core_label: text(),
            core_title: z.string(),
            core_note: text(),
            areas: list(z.object({ name: z.string(), title: z.string(), question: text() })),
            practice_label: text(),
            practice: list(z.string()),
            impact_title: text(),
            impact: list(z.string()),
            original_image: optionalPhoto(ctx),
          })
          .optional(),
      ),
      decision_cycle: z.preprocess(
        blankToUndefined,
        z
          .object({
            title: z.string(),
            subtitle: text(),
            hub_label: text(),
            hub_title: z.string(),
            hub_note: text(),
            steps: list(z.object({ title: z.string(), details: list(z.string()) })),
            outcomes_label: text(),
            outcomes: list(z.string()),
            original_image: optionalPhoto(ctx),
          })
          .optional(),
      ),
      pillars: list(
        z.object({
          label: z.string(),
          title: z.string(),
          summary: z.string(),
          show_decision_cycle: z.preprocess(blankToUndefined, z.boolean().default(false)),
          photos: list(photo(ctx)),
        }),
      ),
      closing_title: text(),
      closing_text: text(),
    }),
  ),

  teaching: page('teaching', (ctx) =>
    z.object({
      ...seo,
      title: z.string(),
      subtitle: z.string(),
      intro: z.string(),
      feature_photo: optionalPhoto(ctx),
      approach_title: text(),
      approach: list(z.object({ title: z.string(), text: z.string() })),
      courses_title: text(),
      courses: list(z.object({ code: z.string(), title: z.string(), level: text(), description: text() })),
      gallery_title: text(),
      gallery: list(photo(ctx)),
      mentoring_title: text(),
      mentoring_text: text(),
      mentoring_photos: list(photo(ctx)),
    }),
  ),

  outreach: page('outreach', (ctx) =>
    z.object({
      ...seo,
      title: z.string(),
      subtitle: z.string(),
      intro: text(),
      feature_photo: optionalPhoto(ctx),
      highlights: list(z.object({ title: z.string(), text: z.string() })),
      gallery_title: text(),
      gallery: list(photo(ctx)),
    }),
  ),

  alumni: page('alumni', () =>
    z.object({
      graduate: list(
        z.object({ name: z.string(), degree: z.string(), current_position: text() }),
      ),
      undergraduate: list(z.object({ name: z.string(), program: text() })),
    }),
  ),

  publications_page: page('publications', () =>
    z.object({
      ...seo,
      title: z.string(),
      intro: text(),
    }),
  ),

  people: defineCollection({
    loader: glob({ pattern: '**/*.yml', base: './src/content/people' }),
    schema: ({ image }) =>
      z.object({
        name: z.string(),
        honorific: text(),
        role: z.enum(['Principal Investigator', 'Postdoctoral Researcher', 'Staff', 'Graduate Student', 'Undergraduate Student', 'Visiting Scholar']),
        position: z.string(),
        order: z.preprocess(blankToUndefined, z.number().default(100)),
        photo: z.preprocess(blankToUndefined, image().optional()),
        education: list(z.string()),
        research_interests: text(),
        current_research: list(z.string()),
        outside_the_lab: text(),
        email: text(),
        linkedin: text(),
        google_scholar: text(),
        website: text(),
      }),
  }),

  news: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        date: z.coerce.date(),
        summary: z.string(),
        cover: z.preprocess(blankToUndefined, image().optional()),
        cover_alt: text(),
        tags: list(z.string()),
        draft: z.preprocess(blankToUndefined, z.boolean().default(false)),
      }),
  }),

  publications: defineCollection({
    loader: glob({ pattern: '**/*.yml', base: './src/content/publications' }),
    schema: z.object({
      title: z.string(),
      authors: z.string(),
      venue: text(),
      volume: text(),
      issue: text(),
      pages: text(),
      year: z.coerce.number().int(),
      type: z.enum(['Journal article', 'Book chapter', 'Conference', 'Extension publication', 'Report', 'Thesis', 'Other']).default('Journal article'),
      doi: text(),
      url: text(),
    }),
  }),
};
