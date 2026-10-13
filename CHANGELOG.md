# Changelog

## 1.5.0 — Production toolkit, smooth scrolling and transitions

- Added shared fluid design tokens for typography, spacing, colors, surfaces, breakpoints and motion.
- Added reusable GSAP primitives, scoped `@gsap/react` cleanup, and three act-based ScrollTrigger scenes.
- Added Lenis smooth scrolling synchronized to the GSAP ticker, with native scrolling for reduced-motion users.
- Added in-page curtain transitions and keyboard focus transfer for navigation.
- Improved mobile navigation with `aria-expanded`, `aria-hidden`, `inert`, Escape handling and viewport reset.
- Added skip navigation, focus visibility, reduced-motion support, SEO metadata, a local favicon, web manifest and robots policy.
- Added ESLint, strict TypeScript, local-source validation and a single `npm run verify` quality gate.
- Added GitHub Actions pull-request verification and push/manual GitHub Pages deployment, including a temporary first-run lockfile artifact.

## 1.4.0 — Cinematic story choreography

- Structured GSAP motion as a prologue, three chapter beats and an epilogue.
- Added staggered title lines, chapter-specific arrival/hold/release motion and a scroll cue.
- Paused the orbital outro when it leaves the viewport.
- Expanded edge fade, haze and glow with regression validation.
