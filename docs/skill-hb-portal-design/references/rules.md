# Rules the HB Portal was built and reviewed against

Condensed from the four skills used on the portal. MUST = required, NEVER = forbidden, SHOULD = default unless there is a reason.

## 1. Direction (frontend-design)

- Commit to one clear direction and keep it everywhere: for the HB Portal it is **"broadcast control room"** — calm canvas, one dark rail, one accent, dense but airy information.
- Typography carries the hierarchy: one distinctive family (Instrument Sans) used with width and weight contrast, not many fonts or colours.
- Colour is rationed: neutrals + one accent; the alert colour only for live/urgent/unread.
- Composition before decoration: alignment, spacing rhythm and grouping do the work; no ornaments, no gradients, no glassmorphism, no stock illustrations.
- Design for the real content (long venue names, three languages, 60-row tables), not for lorem ipsum.

## 2. Passes from impeccable (critique → typeset → layout → polish)

The portal scored 28/40 on the first critique; the fixes below are now rules.

- **Hierarchy:** each page has one obvious entry point (h1 + key action). Don't duplicate the navigation as a wall of shortcut cards on the home page.
- **Typeset:** clear steps between levels (32 → 22 → 18 → 16 → 14 → 12); display text at 82 % width; body ≤ 72ch per line.
- **Layout:** the sign-in page explains the product (ink panel) instead of a lone generic card; the navigation rail must scroll on short screens (≤ 900 px tall) — nothing hidden below the fold.
- **Contrast:** text and placeholders ≥ 4.5:1 (placeholder `#687282`, not lighter); small labels on light surfaces use `--color-text-muted`.
- **No side-stripes:** status is shown with a badge or a soft background, never a coloured left border on cards/alerts.
- **No nested cards** of the same colour (a card inside a card uses `--color-surface-muted`).
- **Small UI text ≥ 11 px on mobile** (brand mark included).
- **No stragglers:** `text-wrap: balance` on headings and `pretty` on paragraphs so a single word never sits alone on the last line.
- **Polish:** consistent radii by level, consistent icon size (20 px nav, 16–18 px inline), aligned baselines, hover/focus/active/disabled states on every control, no raw codes shown to users (map them to words).

## 3. Components and interaction (baseline-ui)

- MUST use accessible primitives for anything with keyboard/focus behaviour (the portal uses **Radix**: Dialog, Popover, Dropdown). NEVER mix primitive systems in one surface; NEVER rebuild focus/keyboard handling by hand.
- MUST put an `aria-label` on icon-only buttons.
- MUST use a confirmation dialog for destructive or irreversible actions.
- SHOULD use structural skeletons for loading.
- NEVER `h-screen`/`100vh` → use `100dvh`. MUST respect `safe-area-inset` on fixed elements.
- MUST show errors next to where the action happens. NEVER block paste.
- Animation: NEVER add it unless needed; only `transform`/`opacity`; ≤ 200 ms for feedback; `ease-out` on entrance; respect `prefers-reduced-motion`; NEVER animate layout properties or large blur/backdrop surfaces.
- Typography: `text-balance` headings, `text-pretty` body, `tabular-nums` for data, truncate/line-clamp in dense UI, don't touch letter-spacing.
- Layout: fixed z-index scale only (`--z-sticky 10`, `--z-floating 20`, `--z-header 30`, `--z-rail 40`, `--z-overlay 50`, `--z-modal 60`).
- Design: NEVER gradients, purple/multicolour gradients or glow as affordance; one accent per view; empty states with one clear next action; use existing tokens before adding colours.

## 4. Web interface guidelines (Vercel)

**Accessibility:** semantic HTML first (`<button>` for actions, `<a>` for navigation, `<label>`, `<table>`); images with `alt` (decorative `alt=""`), decorative icons `aria-hidden`; async messages `aria-live="polite"`; headings in order; skip link to main content; `scroll-margin-top` on anchors (top bar is sticky).

**Focus:** visible `:focus-visible` ring (2 px accent, 2 px offset) on everything interactive; NEVER `outline: none` without a replacement; sticky bars must not cover the focused element.

**Forms:** correct `type`, `inputmode` and `autocomplete`; clickable labels; no spellcheck on emails/codes; submit enabled until the request starts, then "Saving…"; errors inline, focus the first error; placeholders end with "…" and show an example; warn before leaving with unsaved changes.

**Typography & copy:** `…` not `...`; curly quotes; non-breaking spaces in "10 MB", "PET (UTC−5)"; loading labels end with "…"; active voice; specific button labels; error messages say how to fix; numerals for counts.

**Content handling:** containers survive long text (`min-width: 0` on flex children, `overflow-wrap: anywhere`); handle empty arrays/strings; test short, average and very long content.

**Images:** explicit `width`/`height`; lazy below the fold; priority for the logo/hero.

**Performance:** virtualise or paginate lists > 50 items; no layout reads during render; preload the main font; `preconnect` to the storage/CDN domain; prefetch only the links that matter (long link lists: no prefetch).

**Navigation & state:** URL reflects filters, tabs and pagination; links are real links (Cmd/Ctrl-click works); destructive actions need confirmation or undo.

**Touch:** `touch-action: manipulation`; `overscroll-behavior: contain` in drawers/modals; every gesture has a tap/keyboard alternative; no `autoFocus` on mobile.

**Layout:** no horizontal page scroll at 390 px (wide tables scroll inside their own wrapper); safe areas on full-bleed/fixed elements.

**i18n:** `Intl.DateTimeFormat` / `Intl.NumberFormat`; language from the user's choice / `Accept-Language`; brand names and codes `translate="no"`.

**Anti-patterns to flag:** zoom disabled, `transition: all`, `outline: none` without replacement, `<div onClick>`, images without dimensions, inputs without labels, icon buttons without `aria-label`, hard-coded date formats.

## 5. Final review checklist (run on every page, desktop 1440 px and mobile 390 px)

- [ ] Only tokens used; `data-event="lima"` set; Instrument Sans loaded with the right widths.
- [ ] Shell identical to the portal: floating ink rail (desktop), translucent top bar, drawer + bottom nav (mobile), language switch ES/EN/PT.
- [ ] One h1 and one muted description; one primary action per view; one accent colour.
- [ ] Cards without borders/shadows; radii by level; no side-stripes; no nested same-colour cards.
- [ ] Every control has hover, focus-visible, active and disabled states; icon buttons labelled.
- [ ] Contrast ≥ 4.5:1 for text and placeholders; no colour-only status.
- [ ] Forms: labels, hints, inline errors, correct input types, "Saving…" state, unsaved-changes warning.
- [ ] Empty, loading (skeleton) and error states designed.
- [ ] No horizontal page scroll on mobile; tables scroll inside their wrapper; safe areas respected.
- [ ] All text in ES/EN/PT (PT = Brazilian); dates/times via `Intl`, Lima time labelled PET (UTC−5).
- [ ] No invented facts: `[POR CONFIRMAR]` / `[A CONFIRMAR]` / `[TBC]` where unknown.
- [ ] Clicks respond at once (progress bar or skeleton within 100 ms); no page blocked waiting on prefetch.
