---
name: hb-portal-design
description: Design system of the Host Broadcaster portals (Lima 2027 / Istanbul 2027 HB Portal). Use it whenever you build or change any screen of a site that must look like the HB Portal — for example the Lima 2027 RHB booking site — so colours, type, layout, components and behaviour match the portal exactly. Covers the design tokens, the app shell (dark navigation rail, top bar, bottom nav on mobile), every base component, the competition day-calendar, copy rules and the quality checklist the portal was built and reviewed against.
---

# HB Portal design system

The HB Portal (Lima 2027 and Istanbul 2027) is a private, professional tool for broadcasters. A sister site (such as the RHB booking site) must feel like the **same product**: a user going from one to the other should not notice a change of brand, type, spacing or behaviour.

This skill compiles everything the portal was designed and reviewed with:

1. **The portal's own design system** — tokens, shell and components, copied from the production code (`references/tokens.css`, `references/components.css`).
2. **frontend-design** (Anthropic) — the visual direction.
3. **impeccable** — the critique / typeset / layout / polish passes the portal went through.
4. **baseline-ui** (ibelick) — component and interaction baseline.
5. **web-design-guidelines** (Vercel) — accessibility, forms, typography, i18n.

Items 2–5 are condensed into `references/rules.md`. Read it before writing UI, and use it as the review checklist at the end.

## How to apply it

1. **Copy the tokens first.** Put `references/tokens.css` in the project as the single source of colours, type, spacing, radii, shadows, z-index and layout sizes. Never hard-code a value that exists as a token. If the project uses Tailwind, map the theme to these CSS variables instead of Tailwind's palette.
2. **Choose the event theme.** Set `<html data-event="lima">` for Lima 2027 (navy / blue / orange identity). Without the attribute you get the Istanbul theme (teal). Booking site for Lima → always `data-event="lima"`.
3. **Load the font.** Instrument Sans Variable (OFL, files in `assets/fonts/`, licence included), weights 400–700, width 75–100 %. Preload the Latin file. Body at 100 % width; `h1`, display numbers and the brand mark at 82 % width (`--stretch-display`).
4. **Reuse the component classes** in `references/components.css` (`.btn`, `.card`, `.badge`, `.alert`, `.field`/`.input`, `.table`, `.tabs`, `.modal`, `.empty`, `.shell`/`.sidebar`/`.topbar`/`.bottomnav`, `.page-header`, `.prose`, `.cal-*`). Port them as-is or rebuild them in your stack with the same values. Do not invent new variants when one exists.
5. **Build pages with the patterns below**, then **run the checklist** in `references/rules.md` on every page (desktop 1440 px and mobile 390 px).

## Visual language in one page

**Mood:** control-room calm. Light grey canvas, white cards without borders or shadows, one dark navigation rail, one accent colour. Dense information, generous spacing, no decoration.

**Colour (Lima theme)**

| Role | Token | Lima | Use |
|---|---|---|---|
| Canvas | `--color-bg` | `#eef0f5` | page background |
| Surface | `--color-surface` | `#ffffff` | cards, inputs, tables |
| Muted surface | `--color-surface-muted` | `#f3f4f6` | hover, nested cards, zebra rows |
| Text | `--color-text` | `#16202e` | body |
| Secondary text | `--color-text-muted` | `#5b6676` | meta, labels, hints |
| Ink (rail) | `--color-ink` | `#1d1f4a` | navigation rail, active tab, account pill |
| Accent | `--color-primary` | `#2d5196` | primary buttons, links, active nav, focus |
| Alert | `--color-accent` | `#e8541e` | **only** urgent / live / unread (notification dot) |
| States | `--color-success/warning/danger/info` + `-soft` | | badges and alerts, always the pair text + soft background |

Rules: one accent per view; the orange/red accent is never decorative; status colour always comes with a word (never colour alone); no gradients, glows or coloured side-stripes.

**Type scale:** 12 / 14 / 16 / 18 / 22 / 32 px (`--text-xs` … `--text-2xl`), line-height 1.55, weights 400 / 500 / 600 / 700. Headings `text-wrap: balance`, paragraphs `text-wrap: pretty`, numbers `tabular-nums`. Don't change letter-spacing except the small uppercase labels already defined.

**Spacing:** 4 · 8 · 12 · 16 · 24 · 32 · 48 px (`--space-1…7`). Page sections are separated by `--space-5`; cards have `--space-5` padding.

**Radii by hierarchy:** frame/rail/modal 24 px > card 18 px > control 12 px > small control 10 px > chip/pill 999 px.

**Shadows:** none on cards. `--shadow-md` only for things that float (dropdowns, modals, drawer).

**Motion:** 160 ms ease on colour/background only; the drawer slides in 200 ms ease-out. Nothing else animates; respect `prefers-reduced-motion`.

## App shell

```
┌─────────────┐ ┌───────────────────────────────────────────────┐
│  LOGO  HB   │ │ [ search……………… ]        ES EN PT  🔔  (LR ▾) │  ← top bar 72px, translucent canvas, sticky
│             │ ├───────────────────────────────────────────────┤
│ Group title │ │ H1 page title                                  │
│ ▸ Link      │ │ Muted one-line description                     │
│ ▸ Link ■    │ │                                                │
│             │ │ [card] [card]                                  │  ← content max 1240px, centred
│ Group title │ │ [wide card]                                    │
│ ▸ Link      │ │                                                │
└─────────────┘ └───────────────────────────────────────────────┘
 dark rail 252px, floating 12px from the edges, radius 24px
```

- **Rail** (`.sidebar`): ink background, logo + product name at the top, links grouped under small muted group titles (`.nav-group-title`), active link filled with the accent (`aria-current="page"`). Icons 20 px, labels 14 px medium.
- **Top bar** (`.topbar`): global search (pill input), language switch (pill segmented control, active = ink), notification bell (icon button with orange count dot), account pill (ink, avatar in accent).
- **≤ 900 px:** rail hidden; logo moves into the top bar; menu opens as a left drawer (Radix Dialog); a **bottom nav** with 4–5 main destinations appears (translucent white, active item in accent). Respect `env(safe-area-inset-*)`.
- **Public pages** (sign-in, register): two columns — ink panel with the Games name and what the site contains, form on a white card. On mobile the panel stacks above.

For the booking site keep the same shell. Its menu should mirror the portal's naming (the portal calls this area **Booking**, in its own menu group) and include a link back to the HB Portal.

## Page patterns

- **Page header:** `h1` (32 px, 700, 82 % width) + one muted sentence (max 72ch). Actions on the right on desktop, below on mobile.
- **Lists:** cards or `.table` inside `.table-wrap`. Table headers small and muted, rows hover in `#f7f8fa`, numbers tabular. Long tables scroll horizontally inside their wrapper, never the page.
- **Filters:** segmented `.tabs` for 2–5 options; selects for more. Put the state in the URL (query params).
- **Forms:** one column on mobile, `.form-grid` on desktop; label above each field; hint below; error next to the field; primary action bottom-right, disabled only while saving ("Saving…").
- **Empty states:** icon circle + one sentence + one clear action.
- **Loading:** structural skeleton of the page, never a lone spinner.
- **Destructive actions:** confirmation dialog (`.modal-sm`, danger button) — never immediate.
- **Day calendar / availability grid:** use the `.cal-*` pattern — sticky first column, small uppercase labels, one rounded tile per day (20 px, 4 px radius, empty tiles outlined), colours = competition purple `#7b3f98`, women `#e0338a`, men `#2f9e74`, ceremony `#7fb2c8`, legend below with "*Sujeto a cambios". On mobile hide secondary columns. Give the scroll wrapper `position: relative` so screen-reader-only labels don't widen the page.

## Content and language

- Languages: **ES / EN / PT** (Lima). Portuguese is **Brazilian**. Spanish is the default. Every string translated; no machine-translated UI left in another language.
- Tone: plain, direct, second person, active voice. Short sentences. Specific button labels ("Request booking", not "Continue").
- Dates and numbers with `Intl` in the user's language; Lima time is **PET (UTC−5)** and must be labelled.
- Unknown official facts are never invented: mark them `[POR CONFIRMAR]` (ES) / `[A CONFIRMAR]` (PT) / `[TBC]` (EN); example data marked `[EJEMPLO]` / `[EXEMPLO]`.
- Use `…` (not `...`), curly quotes, non-breaking space between number and unit.

## Files

- `references/tokens.css` — all tokens, both event themes, font-face (paths point to `fonts/`).
- `references/components.css` — base, buttons, cards, badges, alerts, forms, tables, tabs, modal, empty state, app shell, auth pages, dashboard/list items, rich text, day calendar.
- `references/rules.md` — condensed rules from frontend-design, impeccable, baseline-ui and web-design-guidelines + final review checklist.
- `assets/fonts/` — Instrument Sans Variable woff2 + OFL licence.
- `assets/brand/lima2027-logo.png` — Lima 2027 logo used in the rail (white plate, 78 px wide in the rail, 96 px on public pages).
