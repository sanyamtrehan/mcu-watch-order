# Dashboard Delivery Phases

This plan implements [DESIGN.md](../DESIGN.md) as a tracking-first Next.js
dashboard. Each phase is independently buildable and committed after its
verification passes.

## Phase 1: Anonymous Tracker Foundation

- Allow anonymous, read-only access to the curated catalog through Supabase RLS.
- Remove the dashboard's authentication redirect.
- Add a versioned `localStorage` progress store keyed by stable watch-unit IDs.
- Render progress, next-up, and watch/unwatch controls from local progress.
- Preserve the current Supabase Auth implementation for the later sync phase;
  it is no longer the default entry path.

Acceptance: a fresh browser can use the tracker without an account; a reload
preserves its choices; no local progress is sent to Supabase.

## Phase 2: Command Dashboard System

- Implement `DashboardShell`, `CommandNav`, `OrderSwitcher`, `ProgressHero`,
  `DashboardBento`, `MetricTile`, and `ContinuationQueue` from `DESIGN.md`.
- Apply Geist typography, the cinematic palette, dense 12-column desktop grid,
  compact mobile toolbar, and accessible icon controls.
- Keep release order functional and show chronological order as unavailable
  until its editorial positions exist.

Acceptance: the first viewport answers progress, next item, current ordering,
and primary tracking action without a login or marketing screen.

## Phase 2.5: Dark Visual Foundation

- Make the cinematic dark palette in `DESIGN.md` the application default.
- Retune panel, border, metadata, action, active-control, and image-overlay
  contrast for prolonged dashboard use.
- Keep the existing dashboard layout and tracking behavior unchanged; a light
  theme is deferred until it earns a concrete user need.

Acceptance: all dashboard controls and text meet a deliberate dark-surface
contrast system, including active filters, disabled chronology, progress bars,
and local-progress states.

## Phase 3: Tracking Controls And Catalog Navigation

- Add the horizontal filter rail for media kind, watched state, series, title,
  and season.
- Add compact continuation rows, recently watched undo, title detail, season
  grouping, and relationship context.
- Keep all calculations based on `watch_units` and the chosen `ordering`.

Acceptance: users can find, mark, undo, and inspect any catalog unit with
keyboard-accessible controls and accurate scoped totals.

## Phase 4: Motion And Media Context

- Add `gsap` and `@gsap/react` for watch-state transitions, backdrop scale/fade
  behavior, and the scroll-pinned order context described in `DESIGN.md`.
- Add selective development backdrops, then replace them with a maintained
  catalog image source when available.
- Respect reduced-motion preferences and verify desktop/mobile layouts.

Acceptance: motion explains queue and context changes without obscuring the
tracker; the dashboard remains usable with reduced motion.

## Phase 5: Optional Account Sync

- Add a quiet `Sync` account action rather than a login gate.
- On sign-in, compare local IDs with the user's RLS-protected Supabase rows and
  present an explicit union/merge choice.
- Upload only confirmed watched IDs; show saved, saving, and conflict states.

Acceptance: a new or returning user can merge anonymous history without losing
either local or cloud progress, and two authenticated users remain isolated by
RLS.

## Phase 6: Release And Legacy Retirement

- Add verification for local progress, merge behavior, RLS isolation, and
  dashboard calculations.
- Deploy the `web/` app to Vercel and validate the public anonymous flow plus
  optional Supabase sync.
- Retire Angular, Nest, TypeORM, and obsolete environment variables only after
  the Next app has production parity.

Acceptance: the deployed Next/Supabase experience fully replaces the old
application without losing catalog or progress behavior.
