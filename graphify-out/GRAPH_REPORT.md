# Graph Report - mcu-watch-order  (2026-11-02)

## Corpus Check
- 139 files · ~86,770 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: (none) 9, .scss 6, .css 4)

## Summary
- 1332 nodes · 1808 edges · 120 communities (92 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c05871c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- catalog-client.tsx
- frontend/package.json
- mcu.controller.ts
- User
- dependencies
- app/app.module.ts
- CookieTokenService
- dependencies
- MainComponent
- web/package.json
- devDependencies
- scripts
- compilerOptions
- SignInComponent
- compilerOptions
- package.json
- app.controller.ts
- next
- typeorm
- backend/package.json
- import-catalog-seed.ts
- serve
- options
- frontend/src/main.ts
- brandkit/SKILL.md
- jest
- mcu/mcu.service.ts
- CORE DIRECTIVE: IMAGE-FIRST WEBSITE DESIGN TO CODE
- scripts/validate-catalog-seed.js
- frontend
- import-catalog-seed.js
- auth/auth.service.ts
- production
- CORE DIRECTIVE: PREMIUM MOBILE APP IMAGE DIRECTION
- development
- TempComponent
- angular.json
- High-Agency Frontend Skill
- Dashboard Delivery Phases
- Appendix B - Canonical Sources (read these before reinventing)
- tsconfig.build.json
- nest-cli.json
- Design Audit
- Analysis & Synthesis Instructions
- local-dashboard.tsx
- Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)
- bcryptjs
- dotenv@^16.0.0
- dashboard.ts
- SKILL: Industrial Brutalism & Tactical Telemetry UI
- Next.js And Supabase Migration Plan
- title-filter-groups.ts
- rxjs@^7.2.0
- @typescript-eslint/parser@^5.0.0
- environment.prod.ts
- Design System: Taste Standard
- CORE DIRECTIVE: AWWWARDS-LEVEL IMAGE ART DIRECTION
- 2. THE COMBINATORIAL VARIATION ENGINE
- 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)
- sound-toggle.tsx
- 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)
- tasteskill: Anti-Slop Frontend Skill
- CORE DIRECTIVE: AWWWARDS-LEVEL DESIGN ENGINEERING
- 22. STYLE VARIATION ENGINE
- Protocol: Premium Utilitarian Minimalism UI Architect
- Catalog And Progress Model
- angular-material.module.ts
- 11. COMPONENT EXECUTION GUIDELINES
- 18. EXTRA CREATIVITY & IMPLEMENTATION EDGE
- 9. AI TELLS (Forbidden Patterns)
- 12. THE COMBINATORIAL VARIATION ENGINE
- 8. ANTI-AI-SLOP RULES
- backend/README.md
- Frontend
- 11. REDESIGN PROTOCOL
- 3. DEFAULT ARCHITECTURE & CONVENTIONS
- 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS
- Full-Output Enforcement
- 33. CATEGORY-SPECIFIC BIAS
- 13. COLOR & MATERIAL RULES
- 4. HERO MINIMALISM RULES
- 29. ANTI-AI-SLOP RULES
- 5. IMAGE COUNT & PAGE SLICING
- scripts
- 0. BRIEF INFERENCE (Read the Room Before Anything Else)
- 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)
- 5. CONTEXT-AWARE PROACTIVITY
- 8. DARK MODE PROTOCOL
- 21. MOBILE ANTI-AI-TELLS RULE
- 7. DIAL DEFINITIONS (Technical Reference)
- 33. DEFAULT SECTION PACKS
- 14. HERO MINIMALISM RULES
- 37. EXAMPLE INTERPRETATIONS
- 2. PLATFORM MODE RULE
- 37. EXAMPLE INTERPRETATIONS
- 15. DEFAULT SITE PACKS
- 20. EXAMPLE INTERPRETATIONS
- Asset Sources
- web/README.md
- imagegen-frontend-web/SKILL.md
- AGENTS.md
- eslint-plugin-prettier@^4.0.0
- jest@^27.2.5
- eslint@^8.0.1
- ts-jest@^27.0.3
- @nestjs/schematics@^8.0.0
- tsconfig-paths@^3.10.1
- @types/passport-jwt@^3.0.6
- @typescript-eslint/eslint-plugin@^5.0.0
- seed/README.md
- data/README.md
- web/AGENTS.md
- source-map-support@^0.5.20
- createClient
- NormalizedCatalog1760000001000
- catalog/README.md

## God Nodes (most connected - your core abstractions)
1. `CORE DIRECTIVE: IMAGE-FIRST WEBSITE DESIGN TO CODE` - 39 edges
2. `CORE DIRECTIVE: PREMIUM MOBILE APP IMAGE DIRECTION` - 39 edges
3. `@angular/core` - 22 edges
4. `LocalDashboard()` - 22 edges
5. `CORE DIRECTIVE: AWWWARDS-LEVEL IMAGE ART DIRECTION` - 22 edges
6. `CatalogClient()` - 21 edges
7. `CookieTokenService` - 20 edges
8. `scripts` - 19 edges
9. `compilerOptions` - 18 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Phase 2: Command Dashboard System` --references--> `CommandNav()`  [INFERRED]
  docs/DASHBOARD_DELIVERY_PHASES.md → web/src/app/dashboard/local-dashboard.tsx
- `POST()` --calls--> `getSupabaseConfig()`  [EXTRACTED]
  web/src/app/auth/signout/route.ts → web/src/lib/supabase/config.ts
- `CatalogClient()` --calls--> `SoundToggle()`  [EXTRACTED]
  web/src/app/catalog/catalog-client.tsx → web/src/components/sound-toggle.tsx
- `CatalogClient()` --calls--> `buildMovieTitleFilterGroups()`  [EXTRACTED]
  web/src/app/catalog/catalog-client.tsx → web/src/lib/catalog/title-filter-groups.ts
- `CatalogClient()` --calls--> `parseLocalProgress()`  [EXTRACTED]
  web/src/app/catalog/catalog-client.tsx → web/src/lib/progress/local-progress.ts

## Import Cycles
- None detected.

## Communities (120 total, 28 thin omitted)

### Community 0 - "catalog-client.tsx"
Cohesion: 0.10
Nodes (25): Account, CatalogCard(), CatalogClient(), saveWatched(), updateSelected(), CatalogRow(), FilterMenu(), FilterOption (+17 more)

### Community 1 - "frontend/package.json"
Cohesion: 0.10
Nodes (28): devDependencies, @angular/cli@~13.3.0, @angular/compiler-cli@~13.3.0, @angular-devkit/build-angular@~13.3.0, jasmine-core@~4.0.0, karma@~6.3.0, karma-chrome-launcher@~3.1.0, karma-coverage@~2.1.0 (+20 more)

### Community 2 - "mcu.controller.ts"
Cohesion: 0.09
Nodes (6): FilterMcuDto, SecretKeyDto, McuController, McuService, @nestjs/passport, @nestjs/testing

### Community 3 - "User"
Cohesion: 0.12
Nodes (4): User, AuthService, JwtStrategy, JwtPayload

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @nestjs/common@^8.0.0, @nestjs/core@^8.0.0, @nestjs/jwt@^8.0.0, @nestjs/passport@^8.2.1, @nestjs/platform-express@^8.0.0, @nestjs/swagger@^5.2.1, @nestjs/typeorm@^8.1.4 (+17 more)

### Community 5 - "app/app.module.ts"
Cohesion: 0.21
Nodes (7): AppComponent, AppRoutingModule, routes, AuthGuard, @angular/core, @angular/forms, @angular/router

### Community 6 - "CookieTokenService"
Cohesion: 0.12
Nodes (3): TokenInterceptor, NavBarComponent, CookieTokenService

### Community 7 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @angular/animations@~13.3.0, @angular/compiler@~13.3.0, @angular/core@~13.3.0, @angular/flex-layout@^13.0.0-beta.38, @angular/forms@~13.3.0, @angular/platform-browser@~13.3.0, @angular/router@~13.3.0 (+14 more)

### Community 8 - "MainComponent"
Cohesion: 0.20
Nodes (4): MainComponent, Mcu, McuFilter, McuService

### Community 9 - "web/package.json"
Cohesion: 0.05
Nodes (41): eslint-config-next, geist, gsap, @gsap/react, lucide-react, react, react-dom, @supabase/supabase-js (+33 more)

### Community 10 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, eslint-config-prettier@^8.3.0, @nestjs/cli@^8.0.0, @nestjs/testing@^8.0.0, supertest@^6.1.3, ts-loader@^9.2.3, ts-node@^10.0.0, @types/jest@27.4.1 (+12 more)

### Community 11 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, catalog:import, catalog:validate, format, lint, migration:revert, migration:run (+11 more)

### Community 12 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+10 more)

### Community 13 - "SignInComponent"
Cohesion: 0.16
Nodes (4): Login, Register, AuthService, SignInComponent

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "package.json"
Cohesion: 0.14
Nodes (16): dependencies, dotenv@^18.0.4, pg@^8.23.0, devDependencies, supabase@2.118.0, dotenv, pg, name (+8 more)

### Community 17 - "next"
Cohesion: 0.22
Nodes (8): next, @supabase/ssr, nextConfig, POST(), getSupabaseConfig(), updateSession(), config, proxy()

### Community 18 - "typeorm"
Cohesion: 0.21
Nodes (3): InitialPostgresSchema1760000000000, Mcu, typeorm

### Community 19 - "backend/package.json"
Cohesion: 0.15
Nodes (12): author, description, prettier@^2.3.2, @types/express@^4.17.13, engines, node, license, name (+4 more)

### Community 20 - "import-catalog-seed.ts"
Cohesion: 0.17
Nodes (10): bulkUpsert(), catalog, CatalogSeed, Episode, importCatalog(), MovieOrSpecial, Season, seedPath (+2 more)

### Community 21 - "serve"
Cohesion: 0.17
Nodes (13): extract-i18n, serve, test, builder, options, architect, browserTarget, proxyConfig (+5 more)

### Community 22 - "options"
Cohesion: 0.26
Nodes (12): options, assets, index, inlineStyleLanguage, karmaConfig, main, outputPath, polyfills (+4 more)

### Community 23 - "frontend/src/main.ts"
Cohesion: 0.18
Nodes (6): @angular/platform-browser-dynamic@~13.3.0, zone.js@~0.11.4, AppModule, environment, @angular/platform-browser-dynamic, zone.js

### Community 24 - "brandkit/SKILL.md"
Cohesion: 0.05
Nodes (43): 1. Logo Cover, 1. Monogram + Meaning, 2 × 3 REFERENCE-STYLE LAYOUT, 2. Logo Construction, 2. Product Action, 3. Digital Application, 3. Metaphor Fusion, 4. Brand Essence (+35 more)

### Community 25 - "jest"
Cohesion: 0.18
Nodes (11): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, testEnvironment, testRegex (+3 more)

### Community 26 - "mcu/mcu.service.ts"
Cohesion: 0.16
Nodes (10): AppModule, AuthModule, ENVIRONMENT, Exceptions, Data, PasswordService, McuModule, @nestjs/common (+2 more)

### Community 28 - "CORE DIRECTIVE: IMAGE-FIRST WEBSITE DESIGN TO CODE"
Cohesion: 0.06
Nodes (34): 10. IMAGE-FIRST CODEX WEBSITE WORKFLOW, 11. WHEN TO TRIGGER IMAGE GENERATION FIRST, 13. WEBSITE REFERENCE RULE, 15. RESPONSIVE FIRST-VIEW RULE, 16. ANTI-NESTED-BOX RULE, 17. REDUCE MICRO-UI CLUTTER RULE, 18. SECTION IMAGE GENERATION RULE, 19. WEBSITE IMAGE SYSTEM RULE (+26 more)

### Community 29 - "scripts/validate-catalog-seed.js"
Cohesion: 0.18
Nodes (7): episodes, relationKeys, relationTypes, seasons, titleIds, titles, watchUnits

### Community 30 - "frontend"
Cohesion: 0.20
Nodes (10): prefix, projectType, root, schematics, sourceRoot, frontend, strict, style (+2 more)

### Community 31 - "import-catalog-seed.js"
Cohesion: 0.22
Nodes (6): bulkUpsert(), catalog, { Client }, fs, importCatalog(), path

### Community 32 - "auth/auth.service.ts"
Cohesion: 0.22
Nodes (4): AuthController, CreateUserDto, LoginDto, @nestjs/swagger

### Community 33 - "production"
Cohesion: 0.22
Nodes (9): build, builder, configurations, defaultConfiguration, production, browserTarget, budgets, fileReplacements (+1 more)

### Community 34 - "CORE DIRECTIVE: PREMIUM MOBILE APP IMAGE DIRECTION"
Cohesion: 0.06
Nodes (34): 10. DEVICE MOCKUP FRAME RULE, 11. ONBOARDING FLOW RULE, 12. FIRST SCREEN CLEANLINESS RULE, 13. SAFE AREA AND SYSTEM REGION RULE, 14. NAVIGATION RULE, 15. CLEAN LAYOUT RULE, 16. CREATIVE IMAGE DIRECTION RULE, 17. BACKGROUND TEXTURE AND SURFACE RULE (+26 more)

### Community 35 - "development"
Cohesion: 0.25
Nodes (8): development, browserTarget, buildOptimizer, extractLicenses, namedChunks, optimization, sourceMap, vendorChunk

### Community 37 - "angular.json"
Cohesion: 0.33
Nodes (5): defaultProject, newProjectRoot, projects, $schema, version

### Community 38 - "High-Agency Frontend Skill"
Cohesion: 0.06
Nodes (30): 10. FINAL PRE-FLIGHT CHECK, 1. ACTIVE BASELINE CONFIGURATION, 2. DEFAULT ARCHITECTURE & CONVENTIONS, 3. DESIGN ENGINEERING DIRECTIVES (Bias Correction), 4. CREATIVE PROACTIVITY (Anti-Slop Implementation), 5. PERFORMANCE GUARDRAILS, 6. TECHNICAL REFERENCE (Dial Definitions), 7. AI TELLS (Forbidden Patterns) (+22 more)

### Community 39 - "Dashboard Delivery Phases"
Cohesion: 0.08
Nodes (22): 1. J.A.R.V.I.S. Boot Sequence, 2. Scroll Transition, 3. Archive Dashboard, 4. Catalog, Color and Light, Experience Architecture, Implementation Notes, Interaction Rules (+14 more)

### Community 40 - "Appendix B - Canonical Sources (read these before reinventing)"
Cohesion: 0.09
Nodes (21): APPENDICES - Real Source-Backed Reference Material, Appendix A - Install Commands per Design System, Appendix B - Canonical Sources (read these before reinventing), Appendix C - Apple Liquid Glass: Honest Web Approximation, Apple Liquid Glass (Apple platforms only), Atlassian, Bootstrap, Carbon (+13 more)

### Community 41 - "tsconfig.build.json"
Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

### Community 43 - "Design Audit"
Cohesion: 0.10
Nodes (19): Code Quality, Color and Surfaces, Component Patterns, Content, Design Audit, Fix Priority, How This Works, Iconography (+11 more)

### Community 44 - "Analysis & Synthesis Instructions"
Cohesion: 0.11
Nodes (18): 1. Define the Atmosphere, 2. Map the Color Palette, 3. Establish Typography Rules, 4. Define the Hero Section, 5. Describe Component Stylings, 6. Define Layout Principles, 7. Define Responsive Rules, 8. Encode Motion Philosophy (+10 more)

### Community 45 - "local-dashboard.tsx"
Cohesion: 0.13
Nodes (26): Account, AccountPanel(), CommandNav(), formatDate(), label(), LocalDashboard(), mergeProgress(), setWatched() (+18 more)

### Community 46 - "Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)"
Cohesion: 0.11
Nodes (17): 1. Meta Information & Core Directive, 2. THE "ABSOLUTE ZERO" DIRECTIVE (STRICT ANTI-PATTERNS), 3. THE CREATIVE VARIANCE ENGINE, 4. HAPTIC MICRO-AESTHETICS (COMPONENT MASTERY), 5. MOTION CHOREOGRAPHY (FLUID DYNAMICS), 6. PERFORMANCE GUARDRAILS, 7. EXECUTION PROTOCOL, 8. PRE-OUTPUT CHECKLIST (+9 more)

### Community 49 - "dashboard.ts"
Cohesion: 0.18
Nodes (14): CatalogPage(), dynamic, setWatchProgress(), DashboardPage(), dynamic, DashboardUnit, EpisodeRow, getReleaseOrderCatalog() (+6 more)

### Community 50 - "SKILL: Industrial Brutalism & Tactical Telemetry UI"
Cohesion: 0.12
Nodes (16): 1. Skill Meta, 2.1 Swiss Industrial Print, 2.2 Tactical Telemetry & CRT Terminal, 2. Visual Archetypes, 3.1 Macro-Typography (Structural Headers), 3.2 Micro-Typography (Data & Telemetry), 3.3 Textural Contrast (Artistic Disruption), 3. Typographic Architecture (+8 more)

### Community 51 - "Next.js And Supabase Migration Plan"
Cohesion: 0.12
Nodes (14): Current State, Decision, Next.js And Supabase Migration Plan, Phase 0: Audit And Baseline, Phase 1: Move Database Ownership To Supabase, Phase 2: Catalog Queries And Database Functions, Phase 3: Build The Next.js Application, Phase 4: Testing And Deployment (+6 more)

### Community 52 - "title-filter-groups.ts"
Cohesion: 0.27
Nodes (5): buildMovieTitleFilterGroups(), CatalogRelationship, CatalogTitle, genericCollectionTitle(), TitleFilterGroup

### Community 56 - "Design System: Taste Standard"
Cohesion: 0.13
Nodes (14): 1. Visual Theme & Atmosphere, 2. Color Palette & Roles, 3. Typography Rules, 4. Component Stylings, 5. Hero Section, 6. Layout Principles, 7. Responsive Rules, 8. Motion & Interaction (Code-Phase Intent) (+6 more)

### Community 59 - "CORE DIRECTIVE: AWWWARDS-LEVEL IMAGE ART DIRECTION"
Cohesion: 0.14
Nodes (14): 10. SECTION RHYTHM RULE, 12. DENSITY & SPACING DISCIPLINE, 14. IMAGE / MEDIA DIRECTION, 16. MULTI-IMAGE CONSISTENCY RULE, 17. CLARITY CHECK, 19. RESPONSE BEHAVIOR, 1. ACTIVE BASELINE CONFIGURATION, 21. FINAL GOAL (+6 more)

### Community 60 - "2. THE COMBINATORIAL VARIATION ENGINE"
Cohesion: 0.14
Nodes (14): 2. THE COMBINATORIAL VARIATION ENGINE, Background Character, Background Mode (per-section), Composition Anchor (per-section), CTA Variation, Hero Architecture, Hero Scale (per-page), Motion-Implied Language (+6 more)

### Community 61 - "4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)"
Cohesion: 0.17
Nodes (12): 4.10 Quotes & Testimonials, 4.11 Page Theme Lock (Light / Dark Mode Consistency), 4.1 Typography, 4.2 Color Calibration, 4.3 Layout Diversification, 4.4 Materiality, Shadows, Cards, 4.5 Interactive UI States, 4.6 Data & Form Patterns (+4 more)

### Community 62 - "sound-toggle.tsx"
Cohesion: 0.54
Nodes (6): SoundToggle(), toggle(), getAudioContext(), playScrollChime(), setSoundEnabled(), soundEnabled()

### Community 63 - "10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)"
Cohesion: 0.20
Nodes (10): 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know), Animation Library Choice, Cards & Containers, Galleries & Media, Hero Paradigms, Layout & Grids, Micro-Interactions & Effects, Navigation & Menus (+2 more)

### Community 64 - "tasteskill: Anti-Slop Frontend Skill"
Cohesion: 0.20
Nodes (10): 13. OUT OF SCOPE, 14. FINAL PRE-FLIGHT CHECK, 1.A Dial Inference (design read → dial values), 1.B Use-Case Presets, 1.C How the Dials Drive Output, 1. THE THREE DIALS (Core Configuration), 2.A When to reach for a real design system (use official packages), 2.B When the brief is an aesthetic, not a system (+2 more)

### Community 65 - "CORE DIRECTIVE: AWWWARDS-LEVEL DESIGN ENGINEERING"
Cohesion: 0.20
Nodes (9): 1. PYTHON-DRIVEN TRUE RANDOMIZATION (BREAKING THE LOOP), 2. AIDA STRUCTURE & SPACING, 3. HERO ARCHITECTURE & THE 2-LINE IRON RULE, 4. THE GAPLESS BENTO GRID, 5. ADVANCED GSAP MOTION & HOVER PHYSICS, 6. COMPONENT ARSENAL & CREATIVITY, 7. CONTENT, ASSETS & STRICT BANS, 8. MANDATORY PRE-FLIGHT <design_plan> (+1 more)

### Community 66 - "22. STYLE VARIATION ENGINE"
Cohesion: 0.20
Nodes (10): 22. STYLE VARIATION ENGINE, Decorative Asset Set, Image Art Direction Bias, Motion-Implied Language, Palette Logic, Signature Component Set, Structure Bias, Texture / Surface Treatment (+2 more)

### Community 67 - "Protocol: Premium Utilitarian Minimalism UI Architect"
Cohesion: 0.20
Nodes (9): 1. Protocol Overview, 2. Absolute Negative Constraints (Banned Elements), 3. Typographic Architecture, 4. Color Palette (Warm Monochrome + Spot Pastels), 5. Component Specifications, 6. Iconography & Imagery Directives, 7. Subtle Motion & Micro-Animations, 8. Execution Protocol (+1 more)

### Community 68 - "Catalog And Progress Model"
Cohesion: 0.20
Nodes (9): Anonymous-First Tracking, Canonical Catalog, Catalog And Progress Model, Dashboard Contract, Data Pipeline, Delivery Order, Goal, Ordering Rules (+1 more)

### Community 69 - "angular-material.module.ts"
Cohesion: 0.20
Nodes (8): @angular/cdk@^13.3.1, @angular/common@~13.3.0, @angular/material@^13.3.1, AngularMaterialModule, materialModules, @angular/cdk, @angular/common, @angular/material

### Community 70 - "11. COMPONENT EXECUTION GUIDELINES"
Cohesion: 0.22
Nodes (9): 11. COMPONENT EXECUTION GUIDELINES, 3D Cascading Card Deck, Diagonal Staggered Square Masonry, Hover-Accordion Slice Layout, Off-Grid Editorial Layout, Pristine Gapless Bento Grid, Product UI Panel Stack, Turning Polaroid Arc (+1 more)

### Community 71 - "18. EXTRA CREATIVITY & IMPLEMENTATION EDGE"
Cohesion: 0.22
Nodes (9): 18. EXTRA CREATIVITY & IMPLEMENTATION EDGE, Composition variety check, Conversion focus, Cross-section contrast, CTA specificity, Cultural / tonal alignment, Data-viz restraint, Image variety inside one comp (+1 more)

### Community 72 - "9. AI TELLS (Forbidden Patterns)"
Cohesion: 0.25
Nodes (8): 9.A Visual & CSS, 9. AI TELLS (Forbidden Patterns), 9.B Typography, 9.C Layout & Spacing, 9.D Content & Data ("Jane Doe" Effect), 9.E External Resources & Components, 9.F Production-Test Tells (banned outright), 9.G EM-DASH BAN (the single most-violated Tell)

### Community 73 - "12. THE COMBINATORIAL VARIATION ENGINE"
Cohesion: 0.25
Nodes (8): 12. THE COMBINATORIAL VARIATION ENGINE, Background Character, Hero Architecture, Motion-Implied Language, Section System, Signature Component Set, Theme Paradigm, Typography Character

### Community 74 - "8. ANTI-AI-SLOP RULES"
Cohesion: 0.25
Nodes (8): 8. ANTI-AI-SLOP RULES, Carousel / marquee slop (layout), Content slop, Data / KPI slop, Density slop, Layout slop, Typography slop, Visual slop

### Community 75 - "backend/README.md"
Cohesion: 0.25
Nodes (7): Description, Installation, License, Running the app, Stay in touch, Support, Test

### Community 76 - "Frontend"
Cohesion: 0.25
Nodes (7): Build, Code scaffolding, Development server, Frontend, Further help, Running end-to-end tests, Running unit tests

### Community 77 - "11. REDESIGN PROTOCOL"
Cohesion: 0.29
Nodes (7): 11.A Detect the Mode (first action), 11.B Audit Before Touching, 11.C Preservation Rules, 11.D Modernisation Levers (priority order), 11.E Decision Tree: Targeted Evolution vs Full Redesign, 11.F What Never Changes Silently, 11. REDESIGN PROTOCOL

### Community 78 - "3. DEFAULT ARCHITECTURE & CONVENTIONS"
Cohesion: 0.29
Nodes (7): 3.A Stack, 3.B State, 3.C Icons, 3.D Emoji Policy, 3. DEFAULT ARCHITECTURE & CONVENTIONS, 3.E Responsiveness & Layout Mechanics, 3.F Dependency Verification (mandatory)

### Community 79 - "6. PERFORMANCE & ACCESSIBILITY GUARDRAILS"
Cohesion: 0.29
Nodes (7): 6.A Hardware Acceleration, 6.B Reduced Motion (mandatory), 6.C Dark Mode (mandatory for any consumer-facing page), 6.D Core Web Vitals Targets, 6.E DOM Cost, 6.F Z-Index Restraint, 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### Community 80 - "Full-Output Enforcement"
Cohesion: 0.29
Nodes (6): Banned Output Patterns, Baseline, Execution Process, Full-Output Enforcement, Handling Long Outputs, Quick Check

### Community 81 - "33. CATEGORY-SPECIFIC BIAS"
Cohesion: 0.29
Nodes (7): 33. CATEGORY-SPECIFIC BIAS, Commerce, Fintech, Health / Fitness, Productivity, Social, Wellness / Lifestyle

### Community 82 - "13. COLOR & MATERIAL RULES"
Cohesion: 0.29
Nodes (7): 13. COLOR & MATERIAL RULES, Background Confidence Rule, Background-image harmony, Gradient Discipline, Materiality, Palette Discipline, Strong guidance

### Community 83 - "4. HERO MINIMALISM RULES"
Cohesion: 0.29
Nodes (7): 4. HERO MINIMALISM RULES, Absolute Hero Rules, Graphic Restraint, Headline Rule, Hero Composition Bias, Pre-output check, Typography Execution

### Community 84 - "29. ANTI-AI-SLOP RULES"
Cohesion: 0.33
Nodes (6): 29. ANTI-AI-SLOP RULES, Content slop, Density slop, Layout slop, Typography slop, Visual slop

### Community 85 - "5. IMAGE COUNT & PAGE SLICING"
Cohesion: 0.33
Nodes (6): 5. IMAGE COUNT & PAGE SLICING, Continuity Rule, Counting rule, Format, Section size variety, THIS IS THE PRIMARY OUTPUT RULE

### Community 86 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, ng, start, test, watch

### Community 87 - "0. BRIEF INFERENCE (Read the Room Before Anything Else)"
Cohesion: 0.40
Nodes (5): 0.A Read these signals first, 0.B Output a one-line "Design Read" before generating, 0. BRIEF INFERENCE (Read the Room Before Anything Else), 0.C If the brief is ambiguous, ask one question, do not guess, 0.D Anti-Default Discipline

### Community 88 - "12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)"
Cohesion: 0.40
Nodes (5): 12.A File Location, 12.B Required Frontmatter, 12.C Required Body Sections, 12.D Block-Library Discipline, 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)

### Community 89 - "5. CONTEXT-AWARE PROACTIVITY"
Cohesion: 0.40
Nodes (5): 5.A Sticky-Stack - Canonical Skeleton, 5.B Horizontal-Pan - Canonical Skeleton, 5.C Scroll-Reveal Stagger - Canonical Skeleton (lighter alternative), 5. CONTEXT-AWARE PROACTIVITY, 5.D Forbidden Animation Patterns

### Community 90 - "8. DARK MODE PROTOCOL"
Cohesion: 0.40
Nodes (5): 8.A Token Strategy (pick one, stick to it), 8.B Do Not Prescribe Specific Colors Here, 8.C Default Mode, 8.D Test in Both Modes Before Finishing, 8. DARK MODE PROTOCOL

### Community 91 - "21. MOBILE ANTI-AI-TELLS RULE"
Cohesion: 0.40
Nodes (5): 21. MOBILE ANTI-AI-TELLS RULE, Copy AI tells, Layout AI tells, UI clutter tells, Visual AI tells

### Community 92 - "7. DIAL DEFINITIONS (Technical Reference)"
Cohesion: 0.50
Nodes (4): 7. DIAL DEFINITIONS (Technical Reference), DESIGN_VARIANCE (Level 1-10), MOTION_INTENSITY (Level 1-10), VISUAL_DENSITY (Level 1-10)

### Community 93 - "33. DEFAULT SECTION PACKS"
Cohesion: 0.50
Nodes (4): 12-section pack, 33. DEFAULT SECTION PACKS, 4-section pack, 8-section pack

### Community 94 - "14. HERO MINIMALISM RULES"
Cohesion: 0.50
Nodes (4): 14. HERO MINIMALISM RULES, Absolute Hero Rules, Headline Rule, Hero Cleanliness Rule

### Community 95 - "37. EXAMPLE INTERPRETATIONS"
Cohesion: 0.50
Nodes (4): 37. EXAMPLE INTERPRETATIONS, Example 1, Example 2, Example 3

### Community 96 - "2. PLATFORM MODE RULE"
Cohesion: 0.50
Nodes (4): 2. PLATFORM MODE RULE, Android-native premium, Cross-platform premium neutral, iOS-native premium

### Community 97 - "37. EXAMPLE INTERPRETATIONS"
Cohesion: 0.50
Nodes (4): 37. EXAMPLE INTERPRETATIONS, Example 1, Example 2, Example 3

### Community 98 - "15. DEFAULT SITE PACKS"
Cohesion: 0.50
Nodes (4): 12-section pack, 15. DEFAULT SITE PACKS, 4-section pack, 8-section pack

### Community 99 - "20. EXAMPLE INTERPRETATIONS"
Cohesion: 0.50
Nodes (4): 20. EXAMPLE INTERPRETATIONS, Example 1, Example 2, Example 3

### Community 100 - "Asset Sources"
Cohesion: 0.50
Nodes (3): Asset Sources, Avengers Archive Mark, Iron Man Archive Signal

### Community 101 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 117 - "createClient"
Cohesion: 0.39
Nodes (5): LoginPage(), handleSubmit(), Mode, validatePasswordReset(), createClient()

## Knowledge Gaps
- **1 isolated node(s):** `./tsconfig.json`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 775 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `typeorm` connect `typeorm` to `auth/auth.service.ts`, `dependencies`, `backend/package.json`, `import-catalog-seed.ts`, `NormalizedCatalog1760000001000`, `mcu/mcu.service.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `LocalDashboard()` (e.g. with `serverSnapshot()` and `snapshot()`) actually correct?**
  _`LocalDashboard()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `./tsconfig.json` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `catalog-client.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `catalog-client.tsx`, `web/package.json`, `local-dashboard.tsx`, `dashboard.ts`, `createClient`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `app/app.module.ts` to `frontend/package.json`, `TempComponent`, `angular-material.module.ts`, `dependencies`, `MainComponent`, `SignInComponent`, `frontend/src/main.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._