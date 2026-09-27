# MCU Watch Order Design System

## Product Direction

MCU Watch Order is a tracking-first catalog for people who want a clear answer to three questions: what should I watch next, how much have I finished, and where does this title sit in a larger viewing order.

The interface should feel closer to a premium media control room than a fan wiki. It can borrow the confidence of Plex, the tracking clarity of Trakt, the cinematic restraint of film distribution sites, and the compactness of MBUI-style media dashboards, but it must stay lightweight enough for repeated use. The dashboard is the product.

The first screen should never be a marketing page. It should open directly into the catalog, progress, next item, order switcher, and filters.

## Design Plan

```text
seed = len(prompt) % 97 = 64
random.choice(hero) -> Artistic Asymmetry; random.choice(font) -> Geist
random.sample(components, 3) -> Gapless dashboard bento, horizontal filter rail, compact continuation queue
random.sample(motion, 2) -> scroll-pinned progress story, image scale/fade scroll
```

AIDA structure for future pages:

- Navigation: compact split bar with order switcher, search, account/sync action, and minimal icon controls.
- Attention: dashboard hero with asymmetric next-up panel and progress summary.
- Interest: gapless bento of totals, filters, queue, and catalog health.
- Desire: pinned progress/story section for order comparison, title relationships, and continuation context.
- Action: account merge/sync panel or final footer action, depending on auth state.

Hero math:

- Use a wide H1 container: `max-width: 72rem`.
- H1 size: `clamp(2.75rem, 6vw, 6rem)` with `line-height: .9`.
- Copy target: 6 to 9 words so the heading resolves in 2 to 3 lines on mobile and 1 to 2 lines on desktop.
- No stamp icons, random badges, stat clutter, or pill-tag stacks in the hero.

Bento density:

- Desktop grid: 12 columns, dense flow, fixed row rhythm.
- Required first dashboard composition: next-up panel `span 7 x 2`, progress panel `span 5 x 2`, filters `span 4 x 2`, continuation queue `span 8 x 2`, stats strip `span 12 x 1`.
- Occupancy: rows 1-2 are 7 + 5 = 12 columns; rows 3-4 are 4 + 8 = 12 columns; row 5 is 12 columns. Zero empty cells.
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

The palette should feel cinematic without becoming all-black. Use a warm near-black for focus, an off-white surface for clarity, a precise red accent for MCU recognition, and small amounts of teal/steel for system states.

```css
:root {
  --color-ink: #15161a;
  --color-ink-soft: #262a31;
  --color-surface: #f5f2eb;
  --color-panel: #fffaf1;
  --color-panel-dark: #1b1d22;
  --color-line: #d8d1c3;
  --color-muted: #6e6a62;
  --color-muted-dark: #a8a096;
  --color-accent: #b51e2f;
  --color-accent-strong: #861421;
  --color-gold: #c5a15c;
  --color-teal: #2e7a78;
  --color-success: #247653;
  --color-warning: #b46a16;
  --color-danger: #b51e2f;
}
```

Do not let the product become a single red theme. Red is for action, active state, and the most important progress mark. Teal is for filters/sync system feedback. Gold is a rare editorial accent for chronology and relationship details.

## Typography

Primary font: Geist.

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
  background:
    radial-gradient(circle at 15% 0%, rgba(181, 30, 47, .14), transparent 28rem),
    radial-gradient(circle at 88% 12%, rgba(46, 122, 120, .14), transparent 24rem),
    var(--color-surface);
  color: var(--color-ink);
}
```

Use a `min(100% - 2rem, 88rem)` content rail for dashboards. Detail pages can widen to `92rem` when relationship graphs or season grids need space.

Major sections should use `padding-block: clamp(4rem, 9vw, 9rem)` on content pages. The dashboard may be tighter, but no page should feel like stacked default cards.

## Navigation

The nav is a functional toolbar, not a brand billboard.

Desktop:

- Left: wordmark plus selected order.
- Center: segmented order switcher when enough width exists.
- Right: search icon button, filter icon button, sync/account button.

Mobile:

- Top row: wordmark, search, account.
- Second row: horizontally scrollable order switcher and filter chips.

Use lucide icons when implementation adds the icon dependency: `Search`, `SlidersHorizontal`, `UserRound`, `Cloud`, `Check`, `Undo2`, `ListFilter`, `CalendarDays`, `Film`, `Tv`, `ChevronDown`, `ArrowRight`.

## Dashboard Anatomy

The dashboard should contain these surfaces in the first viewport on desktop:

- Overall progress with watched/total and percentage.
- Next unwatched watch unit with one primary action.
- Order switcher for release and chronological.
- Filter rail for media kind, series, title, season, and watched state.
- Continuation queue with compact rows.

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

### Progress Hero

Use asymmetry:

- Left: huge progress number, selected order, completion copy.
- Right: next-up title, metadata, primary action, and a small backdrop strip.

Do not place raw stats inside the main heading. Stats belong in metric tiles.

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

Use GSAP when the UI moves beyond simple hover transitions. Add `gsap` and `@gsap/react` only when implementing those sections.

Required motion patterns:

- Hover physics: clickable rows and image strips scale inner media to `1.04` over `600ms`.
- Watch action: check icon scales from `.75` to `1`, row background flashes success, progress bar advances.
- Image scale/fade scroll: title backdrops enter at `scale(.92)` and settle to `1`.
- Scroll-pinned progress story: on catalog explainer pages, pin the order summary while release/chronological examples scroll.

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
- Keep the old Angular app visually untouched unless explicitly migrating it.
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
