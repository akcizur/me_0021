import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createCurtainTransition } from '../motion/gsapPrimitives';

gsap.registerPlugin(ScrollTrigger);

export function usePageTransitions(
  rootRef: RefObject<HTMLDivElement | null>,
  lenisRef: RefObject<Lenis | null>,
): void {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const curtain = root?.querySelector<HTMLElement>('.page-transition');
    if (!root || !curtain) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let destroyed = false;

    const scrollToTarget = (target: HTMLElement, href: string): void => {
      if (lenisRef.current && !reducedMotion.matches) {
        lenisRef.current.scrollTo(target, { offset: -36, immediate: true, force: true });
      } else {
        window.scrollTo({
          top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 36),
          behavior: 'auto',
        });
      }

      if (href !== window.location.hash) window.history.pushState(null, '', href);
      const focusTarget = target.matches('h1, h2, h3') ? target : target.querySelector<HTMLElement>('h1, h2, h3') ?? target;
      const hadTabIndex = focusTarget.hasAttribute('tabindex');
      if (!hadTabIndex) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
      if (!hadTabIndex) focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const onClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const targetElement = event.target;
      const link = targetElement instanceof Element
        ? targetElement.closest<HTMLAnchorElement>('.nav a[href^="#"], .hero-scroll-cue[href^="#"]')
        : null;
      if (!link || !root.contains(link)) return;
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      let id: string;
      try {
        id = decodeURIComponent(href.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      timelineRef.current?.kill();
      timelineRef.current = null;

      if (reducedMotion.matches) {
        scrollToTarget(target, href);
        return;
      }

      timelineRef.current = createCurtainTransition(curtain, () => {
        if (!destroyed) scrollToTarget(target, href);
      });
    };

    root.addEventListener('click', onClick);
    return () => {
      destroyed = true;
      root.removeEventListener('click', onClick);
      timelineRef.current?.kill();
      timelineRef.current = null;
      gsap.set(curtain, { clearProps: 'all' });
    };
  }, [rootRef, lenisRef]);
}
