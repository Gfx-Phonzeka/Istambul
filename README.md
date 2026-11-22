# Istanbul 2027 · Right Holders Portal

Private portal for Right Holders and partners of the 4th European Games Istanbul 2027 (Host Broadcaster: Medialuso).

**Stage 1 (Base):** authentication, registration with approval, roles (Right Holder, Partner, Editor, Administrator),
EN/TR interface, layout and navigation, simple dashboard, user backoffice, activity log, email log.

**Stage 2 (Content):** handbook (chapters/sections, sticky contents, previous/next, shareable anchors, PDF export
of the whole handbook / one chapter / selected sections in EN or TR, pre-generated complete PDF rebuilt on publish),
notices archive, FAQ, glossary, contacts, legal pages, global search, "what changed since your last visit".
Backoffice → Content: one generic editor for every content type with draft → preview → publish workflow
(edits to published items wait as a draft until published) and a rich-text editor (headings, lists, links,
images, tables, YouTube/Vimeo videos).

**Stage 3 (Media):** Briefings (video library by category, in-site player with EN/TR WebVTT subtitles,
watched / not watched per user) and Media Hub (categories, previews, technical specs, NEW / UPDATED badges,
filters and search, material terms accepted before the first download, signed links, every download logged,
"download selection" as a ZIP built in the browser, versions with archive visible to administrators only).
Uploads from the backoffice are resumable (TUS, 6 MB parts) and go straight from the browser to Supabase Storage.
Note: the Supabase Free plan limits each file to 50 MB; broadcast files of several GB need the Pro plan.

**Stage 4 (Venues & camera maps):** venue list with a schematic map of the three clusters (Europe North,
Europe South, Anatolian), filters by cluster and sport, venue sheets (sports and dates, level, capacity, photos,
commentary positions, unilateral facilities, access & OB vans, contacts, documents). Camera maps per venue + sport
+ configuration: conceptual SVG map generated from the camera data (field drawings in `src/components/fields`,
one replaceable component per shape) side by side with the architecture PDF (pdf.js viewer with zoom), camera
table with cross-highlighting, counters, overview of all maps with filters, PDF export per map (map + table +
drawing appended) and a ZIP pack of all maps. Backoffice: drag & drop camera editor, copy cameras between maps,
drawing upload with numbering check before publication, versioned drawings (archive visible to admins).

## Stack
- Next.js 15 (App Router) + TypeScript
- Supabase (Auth, Postgres with Row Level Security) — migrations in `supabase/migrations`
- Vercel hosting

## Where things live
| What | Where |
|---|---|
| Design tokens (colours, fonts, spacing, radii) | `src/styles/tokens.css` |
| Reusable components (cards, badges, tabs, modal, empty state) | `src/components/ui` |
| Translations EN / TR | `src/lib/i18n/en.ts`, `src/lib/i18n/tr.ts` |
| Navigation | `src/lib/nav.ts` |
| Database schema & security | `supabase/migrations/*.sql` |
| Content types & fields (backoffice) | `src/lib/content/registry.ts` |
| Handbook PDF layout | `src/lib/pdf/handbook.ts` |
| Example content `[EXEMPLO]` | `supabase/seed/seed.sql`, `seed_stage2_content.sql`, `seed_stage3_media.sql`, `seed_stage4_venues.sql` (files in buckets under `seed/`) |
| Demo accounts (passwords) | `supabase/seed/demo-accounts.local.sql` — **not in git** (public repository) |

## Environment variables
See `.env.example`. `EMAIL_DISPATCH_SECRET` must match the value stored in `private.config` (`email_dispatch_secret`).
Without `RESEND_API_KEY`, emails are not delivered and are listed in **Backoffice → Email log**.

## Old proposal site
The previous React proposal site was moved, unchanged, to `legacy/proposal-site/`.
