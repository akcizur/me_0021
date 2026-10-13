import { gsap } from 'gsap';

export interface ScrubSceneOptions {
  start: string;
  end: string;
  scrub: number | boolean;
  pin?: boolean;
  pinSpacing?: boolean;
  anticipatePin?: number;
}

export function createScrubScene(trigger: Element, options: ScrubSceneOptions): gsap.core.Timeline {
  return gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger,
      start: options.start,
      end: options.end,
      scrub: options.scrub,
      pin: options.pin ?? false,
      pinSpacing: options.pinSpacing ?? true,
      anticipatePin: options.anticipatePin ?? 1,
      invalidateOnRefresh: true,
    },
  });
}

export function createCharacterReveal(
  targets: HTMLElement[] | NodeListOf<HTMLElement>,
  compact: boolean,
): gsap.core.Tween {
  return gsap.fromTo(
    targets,
    {
      yPercent: 118,
      rotationX: compact ? -56 : -72,
      z: compact ? -44 : -80,
      autoAlpha: 0,
      filter: compact ? 'blur(5px)' : 'blur(9px)',
    },
    {
      yPercent: 0,
      rotationX: 0,
      z: 0,
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: compact ? 0.8 : 1,
      stagger: { amount: compact ? 0.16 : 0.26 },
      ease: 'expo.out',
      clearProps: 'filter',
    },
  );
}

export function createCurtainTransition(curtain: HTMLElement, onCovered: () => void): gsap.core.Timeline {
  return gsap.timeline({
    defaults: { overwrite: 'auto' },
    onComplete: () => gsap.set(curtain, { autoAlpha: 0, scaleY: 0, clearProps: 'filter' }),
  })
    .set(curtain, { autoAlpha: 1, scaleY: 0, transformOrigin: 'bottom center' })
    .to(curtain, { scaleY: 1, duration: 0.34, ease: 'power4.in' })
    .add(onCovered)
    .set(curtain, { transformOrigin: 'top center' })
    .to(curtain, { scaleY: 0, duration: 0.52, ease: 'power4.out' });
}
