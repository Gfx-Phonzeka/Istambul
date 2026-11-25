# HB Portal · Instructions for any AI agent working on this project

This project is worked on in turns by two AI coding agents (Claude Code and Google Antigravity). Whoever has the turn
follows exactly these rules. Read this file, then `docs/ESTADO-DO-PROJETO.md` (rules, decisions, pending work), before
doing anything.

---

## 1. How to talk to the project owner (most important)

The owner manages broadcast production for multi-sport Games. **He does not code** and does not want technical answers.

- **Language:** always European Portuguese (PT-PT), plain and friendly. (Content for Lima in Portuguese is Brazilian
  Portuguese, but your replies to the owner are in PT-PT.)
- **No technical talk:** no code, no commands, no file paths, no error messages, no jargon (commit, push, deploy, RLS,
  migration, build, API…) unless he asks. Say what changed **on the site**, in his words: "a página das sedes já mostra a
  foto", not "inseri uma linha em venue_files".
- **Lead with the answer.** First sentence = what was done or what you found. Then the detail, short.
- **Short:** short sentences, short paragraphs. Use a small table or a list when there are several items
  (e.g. sede → foto, o que fiz → onde ver).
- **After a piece of work, always say:** what changed, where he can see it (page name or link), what is still missing.
  When useful, add "o que testar" as 2–4 simple steps ("abre a página Sedes e vê a foto do Estádio Nacional").
- **Decisions are his.** When something needs a decision (cost, deleting, changing official content, an unclear
  photo or venue), ask ONE clear question with the options, and wait. Don't ask what you can find out yourself.
- **Be honest.** If something failed, say so plainly and what you will try next. Never say something is done or
  working unless you checked it on the live site. If you are not sure (e.g. which venue a photo shows), say it and ask.
- **Never** write passwords, keys or tokens in the chat.
- Mark unknown official information as **[POR CONFIRMAR]** (ES) / **[A CONFIRMAR]** (PT) / **[TBC]** (EN), example data
  as **[EJEMPLO]** / **[EXEMPLO]**. Never invent official facts (dates, names, numbers, contacts).

Example of a good reply:
> Já estão as fotos de 5 sedes no portal de Lima: Velódromo, Agua Dulce, Los Yuyos, Equitação e Golfe.
> Faltam 9 sedes (lista abaixo). Os créditos das fotos ficaram "[POR CONFIRMAR]" até me dizeres a fonte.

---

## 2. Project rules (from the owner)

- **Do not touch hblima2027.info.**
- **Supabase: nothing that costs money** (plan upgrades, paid add-ons) without the owner's explicit approval. The projects
  are on the Free plan (files ≤ 50 MB, no automatic backups).
- **Public repository:** never commit personal or confidential data, passwords, keys, `.env*` files, `*.local.sql`,
  backups, third-party photos, or the Production Guidelines source texts (`scripts/guidelines/*.md`, already ignored).
- Deploy tested work straight to production ("avança já no oficial") — but only following §4.
- Lima: Portuguese is **Brazilian**; translation is done outside the site (no machine translation in Lima).
  Lima graphics language: Spanish.
- Do not change `docs/ROADMAP.md` unless asked.

---

## 3. Turn protocol (two agents, one at a time)

Only ONE agent works at a time. The owner tells you when your turn starts and ends.

**At the start of your turn:**
1. Get the latest code: `git fetch origin && git checkout claude/new-session-f0n2oe && git pull`.
2. Read `docs/ESTADO-DO-PROJETO.md`, especially the last entry of "Registo de turnos".
3. Do NOT start if the last entry says the other agent left something half done; tell the owner first.

**During your turn:** commit small, working steps. Only you touch the databases and deploy.

**At the end of your turn (before telling the owner you are done):**
1. Make a safety copy of both databases: `node scripts/backup/backup.mjs lima` and `node scripts/backup/backup.mjs istanbul`
   (output goes to `~/HB-backups/`, outside the project; never into the repo).
2. Commit and push everything to `claude/new-session-f0n2oe`. Nothing left only on your machine.
3. Add an entry to "Registo de turnos" in `docs/ESTADO-DO-PROJETO.md` (date, agent, what was done, what is half done,
   database changes made, deploy done yes/no) and update the pending list. Commit and push that too.
4. Tell the owner in plain words: what changed, what is pending, that the turn can be handed over.

---

## 4. Safety rules

- **Databases (Supabase) are the riskiest part: there is no undo.**
  - Before any bulk change or delete, run the backup script for that portal.
  - Never delete data in bulk without the owner's OK.
  - Structure changes (new tables/columns/policies) go in a new file in `supabase/migrations/NNNN_name.sql` (shared) or
    `supabase/lima/` (Lima only), committed, then applied to the database(s) concerned. Shared migrations go to BOTH
    databases (Istanbul and Lima use the same code).
- **Deploy only what is pushed.** Always deploy the latest commit of `claude/new-session-f0n2oe` after `git pull`.
  Never deploy from local changes that are not pushed (it would remove the other agent's work from the live site).
  The code is shared: deploy BOTH portals after a code change.
- **Test before saying done:** `npx tsc --noEmit -p .` must pass; check the changed pages on the live site after deploy
  (desktop and phone width, no horizontal scroll, no page errors).
- If something breaks on the live site: in Vercel, promote the previous deployment (instant rollback), then fix.

---

## 5. Technical map (for you, not for the owner)

| | Istanbul 2027 | Lima 2027 |
|---|---|---|
| Live site | hbistambul2027.info · istanbul2027-rhb-portal.vercel.app | lima2027-hb-portal.vercel.app |
| Supabase project ref | tnrpoymjmktbpygiqccm (eu-central-1) | qhsyvhnzvblazfkuwnim (sa-east-1) |
| Vercel project | istanbul2027-rhb-portal (fra1) | lima2027-hb-portal (gru1) |
| Local env file | `.env.local` | `.env.lima.local` (`NEXT_PUBLIC_EVENT=lima`) |
| Demo accounts (passwords) | `supabase/seed/demo-accounts.local.sql` | `supabase/seed/lima-demo-accounts.local.sql` |

- Vercel team: `team_Y8IcKNVHIHC8Yzo3awnCapQd`. Work branch: `claude/new-session-f0n2oe` (deployments are made from it).
- Stack: Next.js 15 (App Router, TypeScript), Supabase (Postgres + RLS, Auth, Storage), Vercel. One codebase; the event is
  chosen by `NEXT_PUBLIC_EVENT`; differences live in `src/lib/event.ts`.
- Run locally: `set -a; . ./.env.lima.local; set +a; npm run build && npx next start -p 3100` (Istanbul: `.env.local`).
- Design: tokens in `src/styles/tokens.css` (Lima theme under `html[data-event="lima"]`), components in
  `src/styles/globals.css`. Keep the look consistent; reuse existing classes and components.
- Translations: `src/lib/i18n/{en,es,pt,tr}.ts` — every new UI string in every language of each event.
- Content columns per language: `<field>_<locale>` (Lima: es/en/pt; Istanbul: en/tr).
- Visibility of content: `all | rhb | partners | production | internal`.
- Data scripts (sign in as the demo admin through `LIMA_URL`, `LIMA_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`; read the password
  from the local seed file, never print it):
  - `scripts/lima/parse_plans.mjs` + `scripts/lima/import_plans.mjs` — camera plans from the HTML dossiers.
  - `scripts/lima/venue_photos.mjs <dir> slug=file.jpg@Credit` — venue photos.
  - `scripts/lima/load_guide.mjs`, `load_handbook.mjs`, `seed_calendar.py`, `glossary.py`, `content.py`.
  - `scripts/guidelines/medal_storyboard.mjs` — medal ceremony storyboard frames.
  - `scripts/backup/backup.mjs <lima|istanbul> [--files]` — safety copy.
- Deploy options: Vercel CLI (`vercel deploy --prod` in a folder linked to the right project, with the owner's Vercel
  login) or the Vercel dashboard (project → Deployments → deploy the latest commit of the branch → Promote to Production).
- Database access: the Supabase MCP server (official, with the owner's personal access token) or the Supabase dashboard
  SQL editor. Ask the owner to approve any SQL that changes data.
- Commit messages: short English summary + body. Never include secrets.
