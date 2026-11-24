# Visual rules and checklist

Visual rules only, condensed from the four skills the HB Portal was designed and reviewed with (frontend-design, impeccable, baseline-ui, web-design-guidelines). Anything about structure, navigation, features, content or code architecture in those skills is deliberately left out: this skill restyles, it does not rebuild.

## Colour

- Neutrals + one primary colour. One primary action colour per view.
- The orange/red accent only for live, urgent or unread; never as decoration.
- Status = coloured text on its soft background, plus the word (never colour alone).
- NEVER gradients, purple/multicolour gradients, glows, or coloured left stripes on cards and alerts.
- Text and placeholders ≥ 4.5:1 contrast (placeholder `#687282`, not lighter). Small labels on light surfaces use `--color-text-muted`.
- A card inside a card uses `--color-surface-muted`, never the same white.

## Typography

- One family (Instrument Sans) with weight and width contrast; no extra fonts.
- Clear steps between levels: 32 → 22 → 18 → 16 → 14 → 12 px. Body lines ≤ 72 characters when the existing layout allows it.
- `text-wrap: balance` on titles, `pretty` on paragraphs; `tabular-nums` on numbers.
- Don't change letter-spacing (except small uppercase labels: 0.04–0.08 em).
- Text inside small UI elements ≥ 11 px on mobile.

## Shape and depth

- Radii by level (24 / 18 / 12 / 10 / pill); the same element type always has the same radius.
- Cards without borders or shadows; shadows only on floating elements (menus, popovers, dialogs).
- Icon sizes consistent: 20 px in menus, 16–18 px inline.

## States

- Every control has hover, `:focus-visible` (2 px primary outline, 2 px offset), active and disabled (50 % opacity, not-allowed cursor) states.
- NEVER `outline: none` without a visible replacement.
- Inputs: 1 px `--color-border-strong`, hover `--color-text-muted`, focus = primary border + 3 px `--color-primary-soft` ring.
- Selected tab / language / segmented option: ink background, white text.
- Table rows hover in `#f7f8fa`; highlighted row in `--color-primary-soft`.

## Motion

- Only colour, background and border transitions, 160 ms ease; never `transition: all`.
- Only `transform`/`opacity` if something must move; ≤ 200 ms; respect `prefers-reduced-motion`.
- No new animations, no animated blur.

## Before / after checklist (each page, desktop and mobile)

- [ ] Same pages, same menus, same order of sections, same fields and buttons, same texts as before. Nothing added, removed or moved.
- [ ] Tokens loaded, `data-event="lima"` set, Instrument Sans showing (check in the browser's font panel).
- [ ] Page background `#eef0f5`, content on white cards without borders or shadows.
- [ ] Primary buttons and links in `#2d5196`; orange only on alerts/counters.
- [ ] Badges and alerts use the text + soft background pairs.
- [ ] Inputs, buttons and cards use the radii by level.
- [ ] Hover, focus, active and disabled visible on every control; keyboard focus ring visible.
- [ ] Contrast ≥ 4.5:1 for text and placeholders.
- [ ] Numbers, dates and times in tabular figures.
- [ ] No horizontal scroll introduced by the new styles on a 390 px wide phone.
- [ ] Anything that would need a structural change is listed as a suggestion, not done.
