# Cinematic Edge Motion · Living Grain

**Release 1.5.0** · React 19 · TypeScript 7 · Vite 8 · SCSS · GSAP · Lenis

A standalone cinematic landing page with fluid design tokens, 3D title choreography, pinned ScrollTrigger chapters, Lenis smooth scrolling, atmospheric canvases, film grain, mirrored glass-edge blur, in-page curtain transitions and responsive navigation. Runtime styling and JavaScript are bundled locally; the page does not depend on a third-party CDN.

## Requirements

- Node.js `22.13+` (or `24+`)
- npm `10+`

## Install and run

```bash
npm install
npm run dev
```

## Quality gates and production build

```bash
npm run validate:project
npm run lint
npm run typecheck
npm run build
npm run preview
```

Or run the entire sequence:

```bash
npm run verify
```

`npm run build` validates local source, contents, SCSS tokens/imports and motion integrations, runs ESLint and strict TypeScript, then produces a minified Vite release in `dist/`.

## Dependency lockfile

The release does not fabricate an incomplete npm lockfile. Run `npm install` from a machine with npm registry access and commit the generated `package-lock.json`. GitHub Actions uses `npm ci` whenever the lockfile is committed. For a first run without a lockfile, the workflow temporarily resolves dependencies and uploads a `package-lock-bootstrap` artifact retained for 7 days; download and commit it so later CI runs are reproducible.

```bash
npm run lockfile:generate
```

## Motion system

- `src/motion/gsapPrimitives.ts` contains reusable scrub-scene and curtain-transition helpers.
- `src/hooks/useGsapAnimations.ts` uses `@gsap/react` and `gsap.matchMedia()` for scoped cleanup, 3D titles, pinned chapters and ScrollTrigger scenes.
- `src/hooks/useLenisScroll.ts` advances Lenis from the GSAP ticker and keeps ScrollTrigger synchronized.
- `src/hooks/useCinematicMotion.ts` supplies scroll-reactive edge light, a progress indicator and lightweight parallax; it does not intercept wheel or keyboard input.
- `src/hooks/usePageTransitions.ts` coordinates anchor navigation with a reversible GSAP curtain wipe and focus transfer.
- Lenis is disabled when `prefers-reduced-motion: reduce` is active; native scrolling remains available.

## Design and accessibility

`src/styles/_tokens.scss` defines the shared fluid type scale, spacing system, colors, surfaces, breakpoints and elevation tokens. The SCSS partials split base styles, edges, navigation, page content and responsive rules.

The mobile navigation supports `aria-expanded`, hidden/inert closed links, focus behavior, Escape and viewport changes. A visible-on-focus skip link, clear keyboard focus and reduced-motion styles are included.

## SEO and performance

`index.html` includes description, Open Graph, Twitter, robots, theme and referrer metadata. The public directory includes a local SVG favicon, PWA manifest and `robots.txt`. No canonical URL or social share image is invented because this project does not have a known production domain/image. Vite emits minified output without production sourcemaps.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` runs on pushes, pull requests and manual dispatch. Every run installs dependencies, validates sources, lints, type-checks and builds. Pull requests do not deploy; successful push/workflow runs upload `dist/` and deploy through GitHub Pages.

Push to `main` or `master`, then select **GitHub Actions** in repository **Settings → Pages**.

## Structure

```text
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
scripts/validate-project.mjs
eslint.config.js
.github/workflows/deploy.yml
index.html
vite.config.ts
tsconfig.json
package.json
package-lock.json (generate via npm install and commit)
