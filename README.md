# Cinematic Edge Motion · Living Grain

**Release 1.5.1** · React 19 · TypeScript 6.0.3 · Vite 8 · SCSS · GSAP · Lenis · Bun 1.4.3

A cinematic landing page with fluid design tokens, 3D title choreography, pinned ScrollTrigger chapters, Lenis smooth scrolling, atmospheric canvases, film grain, mirrored glass-edge blur, in-page curtain transitions and responsive navigation. Runtime CSS and JavaScript are bundled locally; no third-party CDN is required.

## Requirements

- Bun 1.4.3
- Node.js 22.13+ (or 24+)

## Install and run on Windows / PowerShell

    bun install --frozen-lockfile
    bun run dev

Open the local URL printed by Vite.

## Quality checks and production build

    bun run validate:project
    bun run lint
    bun run typecheck
    bun run build
    bun run preview

Or run the complete quality gate:

    bun run verify

The build verifies local project contracts, runs ESLint with zero warnings, performs strict TypeScript checking, compiles SCSS and generates the production site in dist/.

## TypeScript compatibility fix

This release pins TypeScript to 6.0.3. typescript-eslint 8.71.1 supports TypeScript versions >=4.8.4 and <6.1.0; TypeScript 7.0.2 was outside that range and caused the peer-dependency warnings shown by Bun.

The checked-in bun.lock is updated to match the package manifest and removes TypeScript 7's platform-specific optional packages. Use bun install --frozen-lockfile for a reproducible install. When deliberately updating a dependency, run bun install and commit both package.json and bun.lock.

## If Bun reports a blocked postinstall

The project trusts only @parcel/watcher, which is needed by the Sass watcher. The install should not broadly trust every dependency. To identify any remaining blocked lifecycle script, run:

    bun run bun:untrusted

Review the reported package and its lifecycle script first. Only if it is trusted and required, approve that specific package with bun pm trust <package-name>, then rerun bun install and bun run verify. Do not use bun pm trust --all as a generic fix.

The PowerShell helper runs installation diagnostics and all quality checks in one command:

    bun run verify:windows

## Motion system

- src/motion/gsapPrimitives.ts contains reusable scrub-scene and curtain-transition helpers.
- src/hooks/useGsapAnimations.ts uses @gsap/react and gsap.matchMedia() for scoped cleanup, 3D titles, pinned chapters and ScrollTrigger scenes.
- src/hooks/useLenisScroll.ts advances Lenis from the GSAP ticker and keeps ScrollTrigger synchronized.
- src/hooks/useCinematicMotion.ts supplies scroll-reactive edge light, a progress indicator and lightweight parallax without intercepting wheel or keyboard events.
- src/hooks/usePageTransitions.ts coordinates in-page curtain transitions and focus transfer.
- Lenis is disabled when prefers-reduced-motion: reduce is active; native scrolling remains available.

## Design and accessibility

src/styles/_tokens.scss defines fluid typography, spacing, colors, surfaces, breakpoints and elevation tokens. The SCSS partials split base styles, edge glass, navigation, page content and responsive rules.

The mobile navigation supports aria-expanded, aria-hidden, inert, Escape handling and viewport reset. A skip link, visible keyboard focus and reduced-motion styles are included.

## SEO and performance

index.html includes description, Open Graph, Twitter, robots, theme and referrer metadata. The public directory includes a local SVG favicon, web manifest and robots.txt. No canonical URL or social-share image is invented without a known production domain and image. Vite emits minified output without production sourcemaps.

## GitHub Actions and GitHub Pages

.github/workflows/deploy.yml installs the exact dependency graph using bun install --frozen-lockfile, runs diagnostics and bun run verify on pull requests, then publishes dist/ only from successful pushes/manual runs on main or master.

For deployment, select GitHub Actions under repository Settings → Pages.

## Structure

    src/
      components/App.tsx
      data/content.json
      data/content.ts
      hooks/useCinematicMotion.ts
      hooks/useGsapAnimations.ts
      hooks/useLenisScroll.ts
      hooks/usePageTransitions.ts
      motion/gsapPrimitives.ts
      styles/main.scss
      styles/_tokens.scss
      styles/_base.scss
      styles/_edges.scss
      styles/_navigation.scss
      styles/_content.scss
      styles/_responsive.scss
    public/
      favicon.svg
      site.webmanifest
      robots.txt
    scripts/
      validate-project.mjs
      verify-windows.ps1
    eslint.config.js
    .github/workflows/deploy.yml
    index.html
    vite.config.ts
    tsconfig.json
    package.json
    bun.lock
