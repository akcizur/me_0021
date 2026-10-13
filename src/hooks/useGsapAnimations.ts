import { useGSAP } from '@gsap/react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScrubScene } from '../motion/gsapPrimitives';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface MotionConditions {
  reducedMotion?: boolean;
  compact?: boolean;
}

/**
 * Builds a cinematic three-act sequence inside one GSAP matchMedia context.
 * All timelines, ScrollTriggers and temporary inline styles are reverted when
 * the component unmounts or motion/breakpoint conditions change.
 */
export function useGsapAnimations(rootRef: RefObject<HTMLDivElement | null>): void {
  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const media = gsap.matchMedia();
    media.add(
      {
        reducedMotion: '(prefers-reduced-motion: reduce)',
        compact: '(max-width: 760px)',
      },
      (context) => {
        const conditions = context.conditions as MotionConditions | undefined;
        if (!conditions) return undefined;

        const compact = Boolean(conditions.compact);
        const allChars = root.querySelectorAll<HTMLElement>('.title-char');
        const nav = root.querySelector<HTMLElement>('.nav');
        const ambient = root.querySelector<HTMLElement>('.ambient-wash');
        const hero = root.querySelector<HTMLElement>('.hero');
        const heroTitle = root.querySelector<HTMLElement>('.hero-title');
        const heroLines = Array.from(root.querySelectorAll<HTMLElement>('.hero-title .title-line'));
        const eyebrow = root.querySelector<HTMLElement>('.eyebrow');
        const heroCopy = root.querySelector<HTMLElement>('.hero-inner > p');
        const cue = root.querySelector<HTMLElement>('.hero-scroll-cue');
        const cueLine = root.querySelector<HTMLElement>('.hero-scroll-cue__line');
        const edgeGlows = root.querySelectorAll<HTMLElement>('.edge__glow');
        const edgeHaze = root.querySelectorAll<HTMLElement>('.edge__haze');
        const chapters = Array.from(root.querySelectorAll<HTMLElement>('.section[data-chapter]'));
        const visual = root.querySelector<HTMLElement>('.visual');
        const footer = root.querySelector<HTMLElement>('.footer');

        // Reduced motion keeps every meaningful element visible and avoids all
        // scrubbed, continuous, and 3D motion. MatchMedia handles live changes.
        if (conditions.reducedMotion) {
          const resetTargets = [nav, eyebrow, heroTitle, heroCopy, cue, visual, footer]
            .filter((element): element is HTMLElement => element !== null);
          resetTargets.push(...allChars);
          gsap.set(resetTargets, { clearProps: 'all' });
          gsap.set(root.querySelectorAll<HTMLElement>('.chapter-atmosphere'), {
            clearProps: 'all',
          });
          return undefined;
        }

        const perspective = compact ? 640 : 1000;
        gsap.set(allChars, {
          transformPerspective: perspective,
          transformOrigin: '50% 100%',
          force3D: true,
        });

        // PROLOGUE — let the atmosphere arrive first, then the interface, then
        // three offset title lines. Copy and cue land last, like an end-title card.
        const opening = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (ambient) {
          opening.fromTo(
            ambient,
            { autoAlpha: 0, filter: 'blur(16px)' },
            { autoAlpha: 1, filter: 'blur(0px)', duration: 1.65, clearProps: 'filter' },
            0,
          );
        }

        if (nav) {
          opening.fromTo(
            nav,
            { y: -18, autoAlpha: 0, filter: 'blur(8px)' },
            { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.8, clearProps: 'filter' },
            0.08,
          );
          const navItems = nav.querySelectorAll<HTMLElement>('.brand, .nav-links a');
          if (navItems.length) {
            opening.fromTo(
              navItems,
              { y: 9, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.56, stagger: 0.065, clearProps: 'transform' },
              0.2,
            );
          }
        }

        if (eyebrow) {
          opening.fromTo(
            eyebrow,
            { y: 18, autoAlpha: 0, letterSpacing: '0.34em', filter: 'blur(6px)' },
            { y: 0, autoAlpha: 1, letterSpacing: '0.2em', filter: 'blur(0px)', duration: 0.78, clearProps: 'filter' },
            0.18,
          );
        }

        heroLines.forEach((line, lineIndex) => {
          const chars = line.querySelectorAll<HTMLElement>('.title-char');
          if (!chars.length) return;
          const side = lineIndex % 2 === 0 ? 1 : -1;
          opening.fromTo(
            chars,
            {
              yPercent: 128,
              rotationX: compact ? -58 : -76,
              rotationY: side * (compact ? 5 : 9),
              z: compact ? -48 : -92,
              autoAlpha: 0,
              filter: compact ? 'blur(6px)' : 'blur(11px)',
            },
            {
              yPercent: 0,
              rotationX: 0,
              rotationY: 0,
              z: 0,
              autoAlpha: 1,
              filter: 'blur(0px)',
              duration: compact ? 0.92 : 1.08,
              stagger: { amount: compact ? 0.18 : 0.28, from: lineIndex === 1 ? 'center' : 'start' },
              ease: 'expo.out',
              clearProps: 'filter',
            },
            0.28 + lineIndex * (compact ? 0.18 : 0.23),
          );
        });

        if (heroCopy) {
          opening.fromTo(
            heroCopy,
            { y: 24, autoAlpha: 0, filter: 'blur(7px)' },
            { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.86, clearProps: 'filter' },
            compact ? 1.25 : 1.43,
          );
        }

        if (cue) {
          opening.fromTo(
            cue,
            { y: 12, autoAlpha: 0 },
            { y: 0, autoAlpha: 0.78, duration: 0.68, clearProps: 'transform' },
            compact ? 1.58 : 1.82,
          );
        }

        // A moving line is the quiet visual bridge between opening and chapter I.
        if (cueLine) {
          const cuePulse = gsap.to(cueLine, {
            scaleY: 0.42,
            y: 7,
            transformOrigin: 'top center',
            duration: 1.15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            paused: true,
          });
          ScrollTrigger.create({
            trigger: hero ?? root,
            start: 'top top',
            end: 'bottom top',
            onEnter: () => cuePulse.play(),
            onEnterBack: () => cuePulse.play(),
            onLeave: () => cuePulse.pause(),
            onLeaveBack: () => cuePulse.pause(),
          });
        }

        // CHAPTERS — each chapter has a distinct entry direction but shares a
        // single grammar: reveal, breathe, dissolve. Every track is scroll-scrubbed.
        chapters.forEach((chapter, index) => {
          const chars = chapter.querySelectorAll<HTMLElement>('.title-char');
          const kicker = chapter.querySelector<HTMLElement>('.chapter-kicker');
          const copy = chapter.querySelector<HTMLElement>('.section-copy');
          const atmosphere = chapter.querySelector<HTMLElement>('.chapter-atmosphere');
          if (!chars.length) return;

          const reverse = chapter.classList.contains('section--reverse');
          const enterRotation = reverse ? -11 : 11;
          const leaveRotation = reverse ? 6 : -6;
          const copyOffset = reverse ? -44 : 44;
          const chapterTimeline = createScrubScene(chapter, {
            start: compact ? 'top 84%' : 'top top+=72',
            end: compact ? 'bottom 18%' : '+=115%',
            scrub: compact ? 0.52 : 0.78,
            pin: !compact,
            pinSpacing: true,
            anticipatePin: 1,
          });

          chapterTimeline.addLabel('arrival', 0);

          if (atmosphere) {
            chapterTimeline.fromTo(
              atmosphere,
              { autoAlpha: 0, scale: 0.78, filter: 'blur(26px)' },
              { autoAlpha: 0.72, scale: 1.08, filter: 'blur(0px)', duration: 0.34, ease: 'none' },
              'arrival',
            );
          }

          if (kicker) {
            chapterTimeline.fromTo(
              kicker,
              { y: 18, autoAlpha: 0, letterSpacing: '0.34em' },
              { y: 0, autoAlpha: 0.82, letterSpacing: '0.17em', duration: 0.22, ease: 'none' },
              'arrival+=0.025',
            );
          }

          chapterTimeline.fromTo(
            chars,
            {
              yPercent: 124,
              rotationX: compact ? -60 : -78,
              rotationY: enterRotation,
              z: compact ? -48 : -88,
              autoAlpha: 0,
              filter: compact ? 'blur(6px)' : 'blur(10px)',
            },
            {
              yPercent: 0,
              rotationX: 0,
              rotationY: 0,
              z: 0,
              autoAlpha: 1,
              filter: 'blur(0px)',
              duration: 0.3,
              stagger: { amount: compact ? 0.16 : 0.23, from: reverse ? 'end' : 'start' },
              ease: 'power3.out',
            },
            'arrival+=0.035',
          );

          if (copy) {
            chapterTimeline.fromTo(
              copy,
              { x: copyOffset, y: 18, autoAlpha: 0, filter: 'blur(9px)' },
              { x: 0, y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.26, ease: 'power2.out', clearProps: 'filter' },
              'arrival+=0.14',
            );
          }

          chapterTimeline.addLabel('hold', 0.55 + index * 0.015);
          chapterTimeline.to({}, { duration: 0.2 }, 'hold');
          chapterTimeline.addLabel('release', 0.77 + index * 0.015);
          chapterTimeline.to(
            chars,
            {
              yPercent: -112,
              rotationX: compact ? 44 : 60,
              rotationY: leaveRotation,
              z: compact ? -42 : -72,
              autoAlpha: 0,
              filter: compact ? 'blur(5px)' : 'blur(9px)',
              duration: 0.24,
              stagger: { amount: compact ? 0.13 : 0.19, from: reverse ? 'start' : 'end' },
              ease: 'power2.in',
              immediateRender: false,
            },
            'release',
          );

          if (copy) {
            chapterTimeline.to(
              copy,
              { x: -copyOffset * 0.32, y: -20, autoAlpha: 0, filter: 'blur(7px)', duration: 0.21, ease: 'power1.in' },
              'release+=0.025',
            );
          }

          if (kicker) {
            chapterTimeline.to(kicker, { y: -8, autoAlpha: 0, duration: 0.16, ease: 'none' }, 'release+=0.015');
          }

          if (atmosphere) {
            chapterTimeline.to(atmosphere, { scale: 1.2, autoAlpha: 0, filter: 'blur(22px)', duration: 0.25, ease: 'none' }, 'release');
          }
        });

        // The edge light subtly expands as the visual story moves from impact
        // into refraction, then relaxes as the last chapter leaves the viewport.
        const demo = root.querySelector<HTMLElement>('.demo');
        if (demo && edgeGlows.length) {
          gsap.fromTo(
            edgeGlows,
            { scale: 0.92 },
            {
              scale: 1.12,
              ease: 'none',
              stagger: 0.08,
              scrollTrigger: {
                trigger: demo,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.1,
                invalidateOnRefresh: true,
              },
            },
          );
        }

        if (demo && edgeHaze.length) {
          gsap.fromTo(
            edgeHaze,
            { scale: 0.97 },
            {
              scale: 1.045,
              ease: 'none',
              scrollTrigger: { trigger: demo, start: 'top bottom', end: 'bottom top', scrub: 1.3 },
            },
          );
        }

        // EPILOGUE — the glass sculpture only starts its long rotations when it
        // enters the frame, so idle tabs and off-screen sections do no extra work.
        if (visual) {
          gsap.fromTo(
            visual,
            { autoAlpha: 0, filter: 'blur(12px)' },
            {
              autoAlpha: 1,
              filter: 'blur(0px)',
              duration: 1,
              ease: 'power2.out',
              clearProps: 'filter',
              scrollTrigger: { trigger: visual, start: 'top 88%', toggleActions: 'play none none reverse' },
            },
          );

          const orbitOne = visual.querySelector<HTMLElement>('.visual-orbit--one');
          const orbitTwo = visual.querySelector<HTMLElement>('.visual-orbit--two');
          const cardValue = visual.querySelector<HTMLElement>('.card strong');
          const outroMotions: gsap.core.Animation[] = [];

          if (orbitOne) outroMotions.push(gsap.to(orbitOne, { rotation: '+=360', duration: 42, repeat: -1, ease: 'none', paused: true }));
          if (orbitTwo) outroMotions.push(gsap.to(orbitTwo, { rotation: '-=360', duration: 56, repeat: -1, ease: 'none', paused: true }));
          if (cardValue) outroMotions.push(gsap.to(cardValue, { opacity: 0.72, duration: 3.4, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }));

          if (outroMotions.length) {
            const playOutro = (): void => outroMotions.forEach((motion) => motion.play());
            const pauseOutro = (): void => outroMotions.forEach((motion) => motion.pause());
            ScrollTrigger.create({
              trigger: visual,
              start: 'top 96%',
              end: 'bottom top',
              onEnter: playOutro,
              onEnterBack: playOutro,
              onLeave: pauseOutro,
              onLeaveBack: pauseOutro,
            });
          }
        }

        if (footer) {
          gsap.fromTo(
            footer.children,
            { y: 20, autoAlpha: 0, filter: 'blur(5px)' },
            {
              y: 0,
              autoAlpha: 1,
              filter: 'blur(0px)',
              duration: 0.72,
              stagger: 0.1,
              ease: 'power2.out',
              clearProps: 'filter',
              scrollTrigger: { trigger: footer, start: 'top 94%', toggleActions: 'play none none reverse' },
            },
          );
        }

        // Fonts affect line height and title width. Refresh triggers once font
        // metrics settle; the matchMedia context reverts this callback on cleanup.
        document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => undefined);
        ScrollTrigger.refresh();

        return undefined;
      },
    );

    return () => media.revert();
  }, { scope: rootRef });
}
