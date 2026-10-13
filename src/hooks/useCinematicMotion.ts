import { useEffect } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';

interface ParallaxItem {
  element: HTMLElement;
  speed: number;
  depth: number;
  top: number;
  height: number;
  y: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;

/**
 * Adds edge response and restrained parallax on top of Lenis/native scrolling.
 * It never intercepts wheel, keyboard or anchor events; Lenis owns scroll input.
 */
export function useCinematicMotion(rootRef: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const rootStyle = document.documentElement.style;
    const progress = root.querySelector<HTMLElement>('.scroll-progress span');
    const topEdge = root.querySelector<HTMLElement>('.edge--top');
    const bottomEdge = root.querySelector<HTMLElement>('.edge--bottom');
    const topGlow = root.querySelector<HTMLElement>('.edge--top .edge__glow');
    const bottomGlow = root.querySelector<HTMLElement>('.edge--bottom .edge__glow');
    const topMist = root.querySelector<HTMLElement>('.edge--top .edge__mist');
    const bottomMist = root.querySelector<HTMLElement>('.edge--bottom .edge__mist');

    const parallaxItems: ParallaxItem[] = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]')).map((element, index) => ({
      element,
      speed: Number.parseFloat(element.dataset.parallax ?? '0') || 0,
      depth: Number.parseFloat(element.dataset.depth ?? String((index % 3) + 1)) || 1,
      top: 0,
      height: 0,
      y: 0,
    }));

    const setTopGlowX = topGlow ? gsap.quickSetter(topGlow, 'x', 'px') : null;
    const setTopGlowY = topGlow ? gsap.quickSetter(topGlow, 'y', 'px') : null;
    const setBottomGlowX = bottomGlow ? gsap.quickSetter(bottomGlow, 'x', 'px') : null;
    const setBottomGlowY = bottomGlow ? gsap.quickSetter(bottomGlow, 'y', 'px') : null;

    let lastScroll = window.scrollY;
    let pendingDelta = 0;
    let rafId = 0;
    let destroyed = false;
    let edgeEnergy = 0;
    let topEnergy = 0;
    let bottomEnergy = 0;
    let parallaxIsSettling = false;

    const measure = (): void => {
      parallaxItems.forEach((item) => {
        const rect = item.element.getBoundingClientRect();
        item.top = rect.top + window.scrollY;
        item.height = rect.height;
      });
    };

    const applyMotion = (scrollY: number, scrollDelta: number): void => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const scrollRatio = maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1) : 0;
      const energy = reducedMotion.matches ? 0 : clamp(Math.abs(scrollDelta) / 34, 0, 1);

      edgeEnergy = lerp(edgeEnergy, energy, scrollDelta === 0 ? 0.12 : 0.32);
      topEnergy = lerp(topEnergy, energy * (scrollDelta < 0 ? 1 : 0.16), scrollDelta === 0 ? 0.12 : 0.34);
      bottomEnergy = lerp(bottomEnergy, energy * (scrollDelta > 0 ? 1 : 0.16), scrollDelta === 0 ? 0.12 : 0.34);

      rootStyle.setProperty('--edge-energy', edgeEnergy.toFixed(3));
      rootStyle.setProperty('--edge-energy-top', topEnergy.toFixed(3));
      rootStyle.setProperty('--edge-energy-bottom', bottomEnergy.toFixed(3));
      rootStyle.setProperty('--scroll-position', scrollRatio.toFixed(5));

      const viewportCenter = scrollY + window.innerHeight * 0.5;
      parallaxIsSettling = false;
      parallaxItems.forEach((item) => {
        if (reducedMotion.matches) {
          item.element.style.removeProperty('transform');
          item.y = 0;
          return;
        }
        const elementCenter = item.top + item.height * 0.5;
        const viewportOffset = clamp((elementCenter - viewportCenter) / Math.max(1, window.innerHeight), -1.25, 1.25);
        const inertialOffset = clamp(scrollDelta * item.speed * (2.5 + item.depth * 0.38), -22, 22);
        const destinationY = viewportOffset * item.speed * 72 + inertialOffset;
        if (Math.abs(destinationY - item.y) > 0.25) parallaxIsSettling = true;
        item.y = lerp(item.y, destinationY, 0.14);
        const rotation = clamp(item.speed * scrollDelta * 0.008, -0.35, 0.35);
        const scale = 1 + edgeEnergy * Math.abs(item.speed) * 0.006;
        item.element.style.transform = `translate3d(0, ${item.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      });

      topEdge?.style.setProperty('--edge-drift', `${(-scrollDelta * 0.045).toFixed(2)}px`);
      bottomEdge?.style.setProperty('--edge-drift', `${(scrollDelta * 0.045).toFixed(2)}px`);

      setTopGlowX?.(scrollDelta * 0.055);
      setTopGlowY?.(-edgeEnergy * 13);
      setBottomGlowX?.(-scrollDelta * 0.05);
      setBottomGlowY?.(edgeEnergy * 13);
      topMist?.style.setProperty('--mist-drift', `${(-scrollDelta * 0.009 - edgeEnergy * 1.1).toFixed(2)}px`);
      bottomMist?.style.setProperty('--mist-drift', `${(scrollDelta * 0.009 + edgeEnergy * 1.1).toFixed(2)}px`);

      if (progress) progress.style.transform = `scaleY(${scrollRatio.toFixed(5)})`;
    };

    const render = (): void => {
      rafId = 0;
      if (destroyed) return;
      const delta = pendingDelta;
      pendingDelta = 0;
      applyMotion(window.scrollY, delta);

      const stillSettling = edgeEnergy > 0.008 || topEnergy > 0.008 || bottomEnergy > 0.008 || parallaxIsSettling;
      if (delta !== 0 || stillSettling) rafId = window.requestAnimationFrame(render);
    };

    const requestRender = (): void => {
      if (!rafId) rafId = window.requestAnimationFrame(render);
    };

    const onScroll = (): void => {
      const nextScroll = window.scrollY;
      pendingDelta = nextScroll - lastScroll;
      lastScroll = nextScroll;
      requestRender();
    };

    const onResize = (): void => {
      measure();
      pendingDelta = 0;
      requestRender();
    };

    const onMotionPreferenceChange = (): void => {
      parallaxItems.forEach((item) => item.element.style.removeProperty('transform'));
      edgeEnergy = topEnergy = bottomEnergy = 0;
      pendingDelta = 0;
      measure();
      applyMotion(window.scrollY, 0);
    };

    measure();
    applyMotion(window.scrollY, 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    reducedMotion.addEventListener('change', onMotionPreferenceChange);

    return () => {
      destroyed = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      reducedMotion.removeEventListener('change', onMotionPreferenceChange);
      parallaxItems.forEach((item) => item.element.style.removeProperty('transform'));
      ['--edge-energy', '--edge-energy-top', '--edge-energy-bottom', '--scroll-position'].forEach((property) => rootStyle.removeProperty(property));
    };
  }, [rootRef]);
}
