# MCU Watch Order Design System

## Product Direction

MCU Watch Order is a tracking-first catalog for people who want a clear answer to three questions: what should I watch next, how much have I finished, and where does this title sit in a larger viewing order.

The interface should feel like a monitor inside Avengers headquarters: a dense,
purposeful sci-fi tracking console with real data visualizations, precision
numerals, and controlled neon signal colors on a midnight surface. It is not a
fan wiki, a generic SaaS dashboard, or a media landing page. The dashboard is
the product.

The first screen should never be a marketing page. It should open directly into
the analytical dashboard: overall progress, current continuation, progress by
title/season, order controls, and a link to the full catalog table.

The product has two deliberately different working surfaces:

- `/dashboard` is the Avengers-monitor command screen. It explains progress
  through real analytical views, including radial completion, season matrices,
  content-type split, and a compact continuation panel.
- `/catalog` is the flat operational inventory. It renders every watch unit in
  a dense table first, keeps watched rows visible and editable, and offers a
  card-grid view as an alternate inspection mode.

## Design Plan

```text
seed = len(prompt) % 97 = 64
random.choice(hero) -> Artistic Asymmetry; random.choice(font) -> Geist
random.sample(components, 3) -> Gapless telemetry matrix, radial progress instrument, compact continuation queue
random.sample(motion, 2) -> data-channel draw-in, focused panel transition
```

AIDA structure for future pages:

- Navigation: compact command bar with order switcher, dashboard/catalog route
  switch, search/filter controls, and account/sync action.
- Attention: immediate telemetry band with a radial overall-progress
  instrument, current continuation, and order state. This is data, never a
  promotional hero.
- Interest: gapless telemetry matrix of title/season completion, media split,
  completion distribution, and continuation queue.
- Desire: focused title inspection panel that expands a show into seasons and
  related titles; it is analytical context, not an editorial story section.
- Action: account merge/sync panel, shown only when it has a real state to
  communicate.

Hero math:

- Dashboard headings are compact operational labels, not large marketing
  headlines. Use `clamp(1.5rem, 2.8vw, 2.75rem)` with a wide data rail.
- Large type is reserved for primary numerical instruments, such as `58%` or
  `17 / 20`, not sentence-length copy.
- No stamps, decorative badges, marketing CTAs, or filler copy.

Bento density:

- Desktop grid: 12 columns, dense flow, fixed row rhythm.
- Required dashboard composition: primary radial instrument `span 4 x 2`,
  continuation panel `span 4 x 2`, content split `span 4 x 2`; season/title
  telemetry `span 8 x 3`, current queue `span 4 x 3`; filter and order rail
  `span 12 x 1`.
- Occupancy: rows 1-2 are 4 + 4 + 4 = 12 columns; rows 3-5 are 8 + 4 = 12;
  the control rail is 12. Zero empty cells.
- CSS modules should use `grid-auto-flow: dense`; if Tailwind is introduced later, use `grid-flow-dense`.

Label and contrast sweep:

- Avoid cheap meta labels like "SECTION 01", "QUESTION 05", "ABOUT US", or decorative label spam.
- Buttons must have explicit foreground/background pairs. Never rely on inherited color for primary actions.

## Principles

1. Tracking beats decoration. Every screen should make progress, next actions, and filtering obvious.
2. Media is selective. Use backdrops, poster crops, and tiny inline stills as accents, not as a wall of thumbnails.
3. Dense, not cramped. The dashboard can show many things at once, but spacing must preserve scanability.
4. Anonymous first. Local progress, undo, and continuation must feel complete before account sync appears.
5. Curated chronology is editorial. The UI must explain that chronological order is chosen data, not inferred dates.
6. Motion clarifies state. Animations should show progress, grouping, queue movement, and panel focus.

## Visual Identity

The product defaults to a midnight tactical interface. Use a blue-black console
surface, layered panels, restrained grid lines, and distinct cyan, magenta,
cobalt, and red data channels. A light theme can be evaluated later, but it is
not the default or a Phase 2 concern.

```css
:root {
  --color-ink: #e9f1ff;
  --color-ink-soft: #c2ccdc;
  --color-surface: #080b1a;
  --color-panel: #0f1428;
  --color-panel-dark: #070916;
  --color-line: #28314e;
  --color-muted: #8290ad;
  --color-muted-dark: #b8c4dc;
  --color-accent: #b51e2f;
  --color-accent-strong: #861421;
  --color-cyan: #24d7ff;
  --color-magenta: #f42ab9;
  --color-cobalt: #6077ff;
  --color-teal: #32bfc0;
  --color-success: #38d48e;
  --color-warning: #f0ad45;
  --color-danger: #b51e2f;
}
```

Do not turn this into a purple-gradient interface. Cyan, magenta, cobalt, and
teal represent separate data channels, not decoration: for example overall
completion, films, series/episodes, and sync/system state. Red remains an MCU
action color, not the dominant palette. Backgrounds use subtle grid texture and
panel contrast, never floating gradient orbs.

Dark-mode contrast rules:

- Primary text on `--color-panel` uses `--color-ink`; supporting text uses
  `--color-muted` and must remain readable at small metadata sizes.
- Primary actions are white text on red. Active filter/order states must never
  use a light foreground on a light background.
- Hairline borders establish panels and rows; shadows are secondary and kept
  subtle.

## Typography

Primary font: Geist. Use Geist Mono for numerical instruments, tabular values,
axis labels, and compact status data.

Fallback stack:

```css
font-family: Geist, "Geist Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Type scale:

- Display: `clamp(2.75rem, 6vw, 6rem)`, line-height `.9`, weight `760`.
- Page title: `clamp(2rem, 4vw, 4rem)`, line-height `.95`, weight `740`.
- Section heading: `clamp(1.35rem, 2vw, 2rem)`, line-height `1.05`, weight `720`.
- Card title: `1rem` to `1.2rem`, line-height `1.2`, weight `700`.
- Body: `0.95rem`, line-height `1.55`, weight `430`.
- Metadata: `0.78rem` to `0.85rem`, line-height `1.35`, weight `560`.

Letter spacing should stay at `0` for almost all text. Use uppercase sparingly for compact metadata only, never as a repeated section-label pattern.

## Layout

Global page shell:

```css
.appShell {
  min-height: 100svh;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  background-color: var(--color-surface);
  background-image:
    linear-gradient(rgba(96, 119, 255, .045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 119, 255, .045) 1px, transparent 1px);
  background-size: 28px 28px;
  color: var(--color-ink);
}
```

Use a `min(100% - 2rem, 88rem)` content rail for dashboards. Detail pages can widen to `92rem` when relationship graphs or season grids need space.

Major sections should use `padding-block: clamp(4rem, 9vw, 9rem)` on content pages. The dashboard may be tighter, but no page should feel like stacked default cards.

## Navigation

The nav is a functional toolbar, not a brand billboard.

Desktop:

- Left: wordmark plus dashboard/catalog route switch.
- Center: segmented order switcher and terse system state.
- Right: search icon button, filter icon button, sync/account button.

Mobile:

- Top row: wordmark, search, account.
- Second row: horizontally scrollable order switcher and filter chips.

Use lucide icons when implementation adds the icon dependency: `Search`, `SlidersHorizontal`, `UserRound`, `Cloud`, `Check`, `Undo2`, `ListFilter`, `CalendarDays`, `Film`, `Tv`, `ChevronDown`, `ArrowRight`.

## Dashboard Anatomy

The dashboard should contain these analytical surfaces in the first viewport on
desktop:

- A radial overall-progress instrument with watched/total and percentage.
- A content split instrument for films, episodes, and completed titles.
- A compact next-unwatched continuation panel with one primary action.
- A season/title telemetry matrix. Each show receives segmented season status,
  such as `S1 13/13`, `S2 13/13`, `S3 4/13`; films use a single completion
  marker rather than a long progress bar.
- A short continuation queue and an order/filter command rail.

The first implementation can be CSS modules. Use these component names consistently:

- `DashboardShell`
- `CommandNav`
- `OrderSwitcher`
- `ProgressHero`
- `DashboardBento`
- `MetricTile`
- `FilterRail`
- `ContinuationQueue`
- `WatchUnitRow`
- `TitleProgressPanel`
- `AccountMergePanel`

## Components

### Buttons

Buttons are small, sharp, and icon-led. Use `border-radius: 6px` or less.

Primary:

- Background: `--color-accent`
- Text: white
- Hover: `--color-accent-strong`
- Use for `Mark watched`, `Sync progress`, and `Merge progress`.

Secondary:

- Background: transparent or `rgba(21, 22, 26, .04)`
- Border: `--color-line`
- Text: `--color-ink`
- Use for filters, undo, and order controls.

Watched:

- Background: `--color-success`
- Text: white
- Icon: check mark
- Undo should be adjacent or revealed on hover/focus; do not make watched rows look disabled.

### Filter Rail

Filters should be dense and tactile:

- Segmented controls for order and watched state.
- Menu buttons for series/title/season.
- Icon-only reset button with tooltip.
- Active filters appear as small chips below the rail only when active.

Avoid a full sidebar until the catalog has enough data to justify it.

### Telemetry Instruments

- Use radial rings only for whole-to-total measures: overall completion,
  films, episodes, and a selected title.
- Use short segmented blocks for season completion. Each block has a text
  equivalent and uses data-channel color deliberately.
- Use sparklines or line charts only when the underlying sequence is useful,
  such as completion by release era or episodes completed over time.
- Do not use a wide single-line progress bar as the main visualization for a
  show or the full catalog. It communicates too little at dashboard scale.
- Every visual needs visible text values; color is never the only state signal.

### Continuation Queue

Rows should be compact, keyboard-friendly, and resilient to long titles:

- Position number.
- Title and season/episode metadata.
- Release date.
- Media kind icon.
- Primary action.
- Optional disclosure for title relationships.

Rows should animate when marked watched: the check appears first, the row compresses slightly, then moves to recently watched.

### Gapless Bento

Use 3 to 5 high-value tiles:

- Progress summary.
- Next up.
- Filters.
- Queue.
- Scoped totals.

Avoid nested cards. A tile can contain rows or controls, but do not put a card inside another card for decoration.

### Title Detail

Title detail is where imagery can carry more weight:

- Wide but shallow backdrop crop.
- Title progress.
- Season accordion for series.
- Relationship graph for sequel, prequel, spin-off, and crossover.
- Watch units with per-episode controls.

Images should be masked or cropped, not used as huge posters everywhere.

## Images

This project should use some images, not image overload.

Recommended usage:

- One soft backdrop crop in the dashboard hero.
- Tiny inline stills or poster slivers in selected queue rows.
- Backdrop header on title detail.
- Optional thumbnail in relationship cards.

Avoid:

- Poster grids as the main dashboard.
- Full-bleed random images behind tables.
- Image-only navigation.
- Stock-photo atmosphere that hides the catalog data.

Until a real image pipeline exists, development placeholders may use seeded images:

```text
https://picsum.photos/seed/mcu-command-center/1920/1080
https://picsum.photos/seed/cinematic-archive/1200/800
https://picsum.photos/seed/timeline-console/900/900
```

Apply `grayscale(.15) contrast(1.1) saturate(.85)` and a dark radial overlay so the media sits behind the interface.

## Motion

Use GSAP when the UI moves beyond simple hover transitions. The motion should
feel like a monitor receiving a real signal, not a landing-page scroll show.

Required motion patterns:

- Hover physics: clickable rows and instruments brighten their border/data
  channel briefly; do not move the layout.
- Watch action: check icon resolves from `.75` to `1`, the affected season
  segment fills, and radial totals tick forward.
- Telemetry draw-in: charts and radial arcs animate from empty to their real
  values on first entry, then update from the prior value.
- Panel focus: selecting a show sharpens its telemetry panel while surrounding
  panels soften slightly. No automatic long-form scroll story on the dashboard.

Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
}
```

## States

Anonymous:

- Show local progress as fully capable.
- Account action says `Sync`.
- Merge prompt appears only after sign-in if local progress exists.

Signed in:

- Show account indicator quietly.
- Sync state appears as saved, saving, or conflict.
- Do not force a modal unless a merge decision is required.

Empty catalog:

- Show a precise setup message with import/seed guidance.

Chronological unavailable:

- Keep the option visible but disabled with concise copy: `Needs curated positions`.

Complete:

- Replace next-up with a completion panel and keep recently watched/edit controls available.

## Accessibility

- Every icon-only button needs an accessible label and tooltip.
- Progress bars need text equivalents.
- Watch rows must work with keyboard submission.
- Color can reinforce status but cannot be the only signal.
- Hit targets should be at least `40px` high on desktop and `44px` on touch screens.
- Never hide undo behind hover only.

## Implementation Guardrails

- Use the Next `web/` app as the future UI surface.
- The Next `web/` application is the only user interface surface.
- Prefer CSS modules until a Tailwind decision is made.
- If adding dependencies for the new UI, likely additions are `lucide-react`, `gsap`, and `@gsap/react`.
- Keep server data contracts aligned with `docs/CATALOG_AND_PROGRESS_MODEL.md`.
- The dashboard should eventually stop redirecting anonymous users to login; anonymous local progress is part of the product model.

## Pre-Implementation Checklist

Before building or redesigning a screen:

- The H1 is 2 to 3 lines, not a narrow wrapped wall.
- The first screen contains a real tool, not a landing page.
- Bento grids have no empty cells and use dense flow.
- Buttons have explicit contrast.
- Filters are compact and icon-led.
- The UI shows anonymous progress without shame or friction.
- Images support recognition, not decoration.
- Motion explains state changes and respects reduced motion.
- No meta labels, decorative badges, or generic section numbering appear.
