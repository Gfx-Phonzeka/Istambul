---
name: hb-portal-design
description: Visual style of the HB Portal (Lima 2027 / Istanbul 2027) — colour scheme, typography and the look of interface components (buttons, cards, forms, tables, badges, alerts, tabs, dialogs). Use it to restyle an existing site, such as the Lima 2027 RHB booking site, so it looks like the HB Portal. It changes appearance only and never touches the site's structure, pages, navigation, markup hierarchy, features or texts.
---

# HB Portal — interface design and colour scheme

Use this skill to give an existing site the **look** of the HB Portal. It is a skin: colours, type, borders, radii, padding inside components and interaction states.

## Hard limits — what this skill must NOT change

- **No structural changes.** Keep every page, route, URL, menu, navigation order, layout grid, column, section order, component tree and HTML hierarchy exactly as it is.
- **No functional changes.** Don't add, remove or move features, fields, buttons, steps, filters or data. Don't change logic, validation, APIs or state.
- **No content changes.** Don't rewrite, translate, shorten or add texts, labels or messages.
- **No new dependencies or frameworks.** Work with the site's current CSS approach (plain CSS, Sass, Tailwind theme, CSS-in-JS). If the site uses Tailwind, map its theme to the tokens; don't migrate.
- If a visual change would require one of the above, **don't do it** — list it as a suggestion for the site owner instead.

Allowed: CSS variables, colours, fonts, font sizes and weights, line height, borders, border radius, shadows, padding/gaps *inside* a component, hover/focus/active/disabled states, and adding a class or a `data-event` attribute when that is the only way to apply a style.

## How to apply

1. Add `references/tokens.css` (CSS variables) to the site's global styles. Never hard-code a value that exists as a token.
2. Add `data-event="lima"` to `<html>` to get the **Lima 2027** colours (navy / blue / orange). Without it the variables give the Istanbul palette (teal).
3. Load the font **Instrument Sans Variable** (`assets/fonts/`, OFL licence included): weights 400–700, width 75–100 %. Body at 100 % width; large titles at 82 % width (`font-stretch: var(--stretch-display)`).
4. Restyle the site's existing elements with the declarations in `references/components.css`: either add the portal class names to existing elements or copy the declarations onto the site's own selectors. Match each existing element to its closest portal component (see the table below); don't change what the element is.
5. Check every page with `references/rules.md` (visual checklist), on desktop and on a phone, and compare before/after: same structure, same content, new look.

## Colour scheme (Lima 2027 theme)

| Role | Token | Value | Use |
|---|---|---|---|
| Page background | `--color-bg` | `#eef0f5` | canvas behind the content |
| Surface | `--color-surface` | `#ffffff` | cards, inputs, tables, dialogs |
| Muted surface | `--color-surface-muted` | `#f3f4f6` | hover, zebra rows, card inside card |
| Border | `--color-border` / `--color-border-strong` | `#e1e4e9` / `#c5cad3` | dividers / input borders |
| Text | `--color-text` | `#16202e` | body text |
| Secondary text | `--color-text-muted` | `#5b6676` | labels, meta, hints |
| Dark (ink) | `--color-ink` | `#1d1f4a` | dark menus/side panels, selected tab, selected language |
| Text on ink | `--color-ink-text` / `--color-ink-muted` | `#cfd3ea` / `#9196bd` | links and labels on dark backgrounds |
| Primary | `--color-primary` (+ `-hover`, `-soft`) | `#2d5196` (`#233f78`, `#e2e9f6`) | primary buttons, links, active item, focus ring |
| Alert accent | `--color-accent` | `#e8541e` | only live / urgent / unread (e.g. notification count) |
| Success | `--color-success` / `-soft` | `#19754a` / `#e0f1e7` | confirmed, approved |
| Warning | `--color-warning` / `-soft` | `#8f5600` / `#fbefd9` | pending, to confirm |
| Danger | `--color-danger` / `-soft` | `#c42f23` / `#fbe6e3` | errors, cancel, delete |
| Info | `--color-info` / `-soft` | `#2a5aa8` / `#e4ecf8` | neutral notices |

Status colours are always used as a pair: coloured text on its soft background. One primary colour per view; the orange accent is never decorative. No gradients, glows or coloured side stripes.

## Typography

- Family: Instrument Sans Variable, fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Sizes: 12 / 14 / 16 / 18 / 22 / 32 px (`--text-xs` … `--text-2xl`); body 16 px, line height 1.55.
- Weights: 400 body · 500 nav and table headers · 600 labels, buttons, headings · 700 page titles.
- Page title 32 px / 700 at 82 % width; section titles 22 px; card titles 17 px.
- `text-wrap: balance` on titles, `pretty` on paragraphs, `font-variant-numeric: tabular-nums` on numbers, dates, times and table figures.

## Shape, depth and motion

- Radii by level: large panels/dialogs 24 px · cards 18 px · inputs and buttons 12 px · small buttons 10 px · badges, pills, segmented controls 999 px.
- Cards: white, **no border, no shadow**. Shadow (`--shadow-md`) only on things that float: dropdowns, popovers, dialogs.
- Transitions: 160 ms ease on colour/background/border only. Respect `prefers-reduced-motion`.

## Matching existing elements to portal components

| Existing element on the site | Portal style (`references/components.css`) |
|---|---|
| Main / secondary / delete / text button | `.btn-primary` / `.btn` / `.btn-danger` / `.btn-ghost`; small: `.btn-sm` |
| Box, panel, tile | `.card` (title `.card-title`); clickable: `.card-link` |
| Status tag, label | `.badge` + `-success` / `-warning` / `-danger` / `-info` / `-primary` |
| Message box | `.alert` + `-info` / `-success` / `-warning` / `-danger` |
| Form label / input / select / textarea / help text | `.field label`, `.input`, `.select`, `.textarea`, `.hint` |
| Checkbox, radio | `.checkbox`, `accent-color: var(--color-primary)` |
| Data table | `.table` (inside `.table-wrap` if it already has a wrapper) |
| Tabs, segmented filter | `.tabs` / `.tab` (selected = ink) |
| Dialog | `.modal`, `.modal-title`, `.modal-text`, `.modal-footer` |
| Empty list message | `.empty`, `.empty-icon`, `.empty-text` |
| Long formatted text | `.prose` |
| Dark menu/sidebar (if the site already has one) | background `--color-ink`, links `--color-ink-text`, hover `--color-ink-2`, current item `--color-primary` with white text, radius 12 px |
| Light top bar (if it exists) | canvas colour at 86 % opacity; search and icons on white pill controls; language switch as `.tabs`-like pill |

## Files

- `references/tokens.css` — all colour, type, spacing, radius and shadow variables; Lima theme under `html[data-event="lima"]`; font-face (paths point to `fonts/`).
- `references/components.css` — visual styles of the components above (no page layout).
- `references/rules.md` — visual rules and the before/after checklist.
- `assets/fonts/` — Instrument Sans Variable woff2 + OFL licence.
- `assets/brand/lima2027-logo.png` — Lima 2027 logo, only if the site already shows a logo in that place.
