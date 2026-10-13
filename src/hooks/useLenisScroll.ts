import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useLenisScroll(
  rootRef: RefObject<HTMLDivElement | null>,
): RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let destroyLenis: (() => void) | undefined;
    let disposed = false;

    const setup = (): void => {
      destroyLenis?.();
      destroyLenis = undefined;
      lenisRef.current = null;

      // Native scrolling is preferred when the user asks for reduced motion.
      if (reducedMotion.matches || disposed) {
        document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling');
        ScrollTrigger.refresh();
        return;
      }

      const lenis = new Lenis({
        autoRaf: false,
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.86,
        touchMultiplier: 1.05,
        anchors: false,
        overscroll: true,
        prevent: (node) => node instanceof HTMLElement && Boolean(node.closest('[data-native-scroll]')),
      });

      lenisRef.current = lenis;
      const onLenisScroll = (): void => ScrollTrigger.update();
      const ticker = (time: number): void => lenis.raf(time * 1000);

      lenis.on('scroll', onLenisScroll);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      destroyLenis = () => {
        lenis.off('scroll', onLenisScroll);
        gsap.ticker.remove(ticker);
        lenis.destroy();
        if (lenisRef.current === lenis) lenisRef.current = null;
        gsap.ticker.lagSmoothing(500, 33);
        document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling');
      };

      requestAnimationFrame(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
    };

    const onMotionPreferenceChange = (): void => setup();
    reducedMotion.addEventListener('change', onMotionPreferenceChange);
    setup();

    const refreshAfterFonts = (): void => {
      if (!disposed) ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refreshAfterFonts).catch(() => undefined);

    return () => {
      disposed = true;
      reducedMotion.removeEventListener('change', onMotionPreferenceChange);
      destroyLenis?.();
      lenisRef.current = null;
    };
  }, [rootRef]);

  return lenisRef;
}
