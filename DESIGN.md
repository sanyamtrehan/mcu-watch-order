# MCU Watch Order Design Direction

## Product Character

MCU Watch Order is a personal viewing archive presented as a J.A.R.V.I.S.
system. It should feel like a high-resolution Avengers workstation: cinematic
on entry, precise while in use, and always rooted in the viewer's actual
watching data.

The product is neither a fan wiki nor a generic SaaS dashboard. It uses
Marvel-scale spectacle to make the transition into a practical tool feel
special, then gets out of the way so a viewer can mark titles, inspect
progress, and find what to watch next. The interface is soft, orbital, and
highly dimensional: curved glass instruments and concentric systems, not an
angular control-room pastiche.

## Experience Architecture

### 1. J.A.R.V.I.S. Boot Sequence

`/dashboard` opens with a full-viewport initialization scene. The scene is a
live system display, not a disconnected marketing hero:

- Display `J.A.R.V.I.S. / Watch Order Protocol` and the current archive
  completion value.
- Use a central arc-reactor-inspired core made from native interface geometry:
  concentric rings, orbit markers, technical grids, and emitted cyan light.
- Show real system state, total resolved units, and the actual next title.
- Keep navigation present and usable while the scene is visible.

The visual direction can take inspiration from highly choreographed interactive
sites: one persistent object, deliberate camera-like transformation, and a
clear transition between chapters. Do not copy another site's assets, copy, or
visual identity.

### 2. Scroll Transition

The boot sequence is pinned briefly. As the user scrolls:

1. Boot copy fades upward and becomes secondary.
2. The reactor's orbit rotates and the core compresses toward the archive.
3. The technical grid recedes.
4. The analytical dashboard enters below.

Use GSAP `ScrollTrigger` with a scrubbed timeline. Dashboard and catalog
sections must continue the motion language after their heroes through
depth-based reveals, orbital movement, and focused panel transitions. Respect
`prefers-reduced-motion`: skip pinning and transformations while keeping all
content visible in normal document flow. Motion must clarify the hand-off into
the tracker, not delay access to it.

### 3. Archive Dashboard

After the cinematic entry, the experience becomes a dense analytical command
surface. It answers:

- How much of the MCU archive is complete?
- Is the viewer progressing through films, episodes, and specials differently?
- Which release eras are covered?
- Which shows are partway through, and at what season?
- What is next in release order?

The current dashboard uses a 12-column dense grid:

- Three compact top metrics: total completion, archive mix, and completed
  titles.
- A larger release-sequence coverage visualization with an area trace and
  vertical comparison bars.
- An active-title diagnostic list that ranks partially watched stories.
- A season completion map with explicit `S1 13/13` style values.
- A continuation queue with a direct mark-watched action and a route to the
  full catalog.

Visualizations must be truthful. Release coverage can use release-order bins;
personal viewing trends require per-unit `watched_at` history and must not be
invented from a boolean watched state.

### 4. Catalog

`/catalog` remains the operational surface. It is a flat, editable inventory
of all watch units with filters for title, series, season, kind, and watched
state. Watched rows stay visible by default. A table is the primary mode; a
card grid is an alternate inspection mode, not a replacement for the table.

## Visual Language

### Color and Light

The default environment is deep blue-black, with layered indigo panels and
hairline technical borders. Cyan is emitted system light and the primary data
channel. Magenta, cobalt, teal, green, and MCU red have distinct roles:

- Cyan: archive status, primary telemetry, and active system focus.
- Magenta: partial completion and a contrasting analytical channel.
- Cobalt: episode/media grouping and secondary telemetry.
- Teal or green: healthy state and successful synchronization.
- MCU red: decisive actions such as completing the next unit.

Neon is a signal, never wall-to-wall decoration. Avoid purple-gradient themes,
soft floating blobs, and vague "sci-fi" backgrounds. Use grids, radial traces,
edge lines, controlled glow, and deep contrast instead.

### Surfaces

Panels are rounded glass instruments arranged around circular and orbital
geometry, rather than rigid rectangular control-room cards:

- Use generous `20px` to `32px` radii for primary modules and `999px` for
  compact controls, status chips, and table rows.
- Use fine blue hairlines, translucent indigo surfaces, and restrained glass
  blur to establish depth.
- Prefer concentric rings, radial readouts, circular status counters, and
  soft arc traces to diagonal cuts and repeated sharp corners.
- No cards nested inside decorative cards.
- Glow belongs to a core, chart trace, active edge, or actionable signal.

### Typography

Use Geist for interface copy and Geist Mono for percentages, axes, dates,
positions, system labels, and compact metadata. The boot sequence may use very
large two-line display type. The analytical dashboard should reserve large type
for numerical values, not headlines.

Use uppercase only for compact system labels. Avoid repeated labels such as
`SECTION 01` or decorative technical jargon that conveys no real state.

## Interaction Rules

- The boot core is atmospheric; it is not a required control.
- Dashboard controls must remain keyboard-accessible and obvious.
- `Mark watched` updates local progress for anonymous visitors and persists to
  Supabase for authenticated visitors.
- The next-up action always refers to the first unwatched release-order unit.
- Undo remains available through recent marks and the catalog.
- Sync/account state appears only when it communicates a real condition.
- The speaker control is opt-in. When enabled, scrolling past a hero may play
  one quiet, locally synthesized two-tone transition chime. Never autoplay
  music, fetch third-party audio, or play repeated sounds on every scroll.

## Responsive Behavior

On small screens, preserve the J.A.R.V.I.S. sequence but prioritize legibility:

- Keep boot type within two lines and move the reactor partially off-canvas
  rather than shrinking it into an unreadable ornament.
- Stack dashboard modules into a single column.
- Keep navigation controls horizontally reachable without forcing text to
  overlap.
- Retain textual values for every visualization; color never carries state by
  itself.

## Implementation Notes

- Keep the interface in CSS modules and GSAP; avoid adding a visual library
  merely for ornamental charts.
- CSS/SVG geometry is preferred for the J.A.R.V.I.S. core and data charts.
- Use real Marvel imagery only once a deliberate image source and attribution
  approach are defined. Do not fill the experience with unrelated stock media.
- Any new visualization needs a named data source and a useful decision it
  supports.
