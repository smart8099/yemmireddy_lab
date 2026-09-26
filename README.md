# Yemmireddy Lab website

Static website for the Yemmireddy Lab (Food Safety & Food Microbiology, UTRGV).

- **Framework:** [Astro](https://astro.build) — static HTML, optimised images, near-zero JS
- **Content:** YAML / Markdown in `src/content/`, validated by `src/content.config.ts`
- **Admin panel for non-developers:** [Pages CMS](https://pagescms.org), configured in `.pages.yml`
- **Hosting:** GitHub Pages via `.github/workflows/deploy.yml` (every push to `main` deploys)

Lab members: see **[MAINTAINING.md](MAINTAINING.md)** for how to edit content.

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs dist/
npm run preview   # serve the built site
npm run check     # type-check .astro/.ts files
```

Requires Node 22+.

## Project layout

```
.pages.yml                  admin-panel forms (mirror of the content schemas)
src/content.config.ts       content schemas — build fails on invalid content
src/content/
  site/settings.yml         name, contact details, social links
  pages/*.yml               one file per page (home, research, teaching, outreach, alumni, publications)
  people/*.yml              one file per current member
  news/*.md                 news posts
  publications/*.yml        one file per publication
src/assets/images/          all photos (resized + converted to WebP/AVIF at build)
src/components/             Header, Footer, Carousel, Gallery, PersonCard, SEO, …
src/pages/                  routes
src/styles/global.css       design tokens (colours, type, spacing) + base styles
scripts/import-content/     one-time import of the original Word docs + photos
```

To change the colour scheme or fonts, edit the tokens at the top of
`src/styles/global.css`.

When you add or rename a content field, update **both** `src/content.config.ts`
and `.pages.yml`.

**Troubleshooting:** if a new content field doesn't show up in `npm run dev`
(but does after `npm run build`), Astro's content cache is stale. Stop the dev
server, run `rm -rf .astro`, and start it again.

## First deployment (GitHub Pages)

1. Create a repository on GitHub (e.g. under a lab organisation) and push this
   project to the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow builds and deploys automatically. The site will be at
   `https://<owner>.github.io/<repo>/`.
4. Connect the admin panel (one time, by the site owner):
   1. Go to <https://app.pagescms.org> and **Sign in with GitHub**.
   2. **Install the Pages CMS GitHub App** on the account/organisation that owns
      the repo (you can limit it to just this repository).
   3. Open the repository — the forms from `.pages.yml` appear.
5. Invite editors **by email** from the repository's collaborator settings in
   Pages CMS. They don't need GitHub accounts; they sign in with an emailed link.
   (Developers can instead be added as GitHub collaborators and sign in with GitHub.)

`SITE_URL` and `BASE_PATH` are provided by `actions/configure-pages`, so canonical
URLs, the sitemap, and all internal links adapt to the sub-path automatically.

## Moving to a custom domain later

1. Buy the domain and add a DNS `CNAME` record pointing to `<owner>.github.io`
   (or `A` records for an apex domain — see GitHub's Pages docs).
2. In the repo: **Settings → Pages → Custom domain**, enter the domain, and tick
   *Enforce HTTPS*.
3. Re-run the deploy workflow. `configure-pages` now reports the new origin and
   an empty base path, so no code changes are needed.
4. Submit `https://<domain>/sitemap-index.xml` in Google Search Console.

### Using Netlify instead

Build command `npm run build`, publish directory `dist`, and set the
environment variable `SITE_URL` to the Netlify URL (leave `BASE_PATH` unset).

## Images

All photos live in `src/assets/images/` and are committed to the repo (admin-panel
uploads land there too). The build generates optimised WebP copies for visitors.

To keep the repo small, `.github/workflows/compress-images.yml` automatically
shrinks any image added or changed in a push (longest side > 2400px or file > 1 MB)
and commits the smaller version back — same filename and format, so no content
changes. To run it yourself on every image: `npm run images:compress`.

## SEO

- Per-page titles, descriptions, canonical URLs, Open Graph / Twitter cards (`src/components/SEO.astro`)
- JSON-LD: `ResearchOrganization` (home), `Person` (profiles), `NewsArticle`, `ScholarlyArticle`
- `sitemap-index.xml` and `robots.txt` generated at build

## Syncing publications from Google Scholar

```sh
python3 scripts/import-content/import_scholar.py mpOZAYAAAAAJ
```

Adds new papers to `src/content/publications/`; existing files (and admin-panel
edits) are never overwritten. Review the new files before committing — Scholar
data can be incomplete (e.g. truncated titles) or duplicated.

## Re-running the content import

Only needed if you want to rebuild images from the original zip:

```sh
python3 scripts/import-content/extract_docx_images.py "<unzipped folder>" /tmp/docimg
# convert Pictures/ to JPEG named p-<lowercase-name>.jpg in /tmp/pics (e.g. with macOS `sips`)
node scripts/import-content/prepare_images.mjs /tmp/docimg /tmp/pics
```
