import { useEffect, useRef, useState } from 'react';
import content from '../data/content';
import { useCinematicMotion } from '../hooks/useCinematicMotion';
import { useLenisScroll } from '../hooks/useLenisScroll';
import { useGsapAnimations } from '../hooks/useGsapAnimations';
import { usePageTransitions } from '../hooks/usePageTransitions';

interface MotionTitleProps {
  as?: 'h1' | 'h2';
  lines: string[];
  className?: string;
}

function MotionTitle({ as: Tag = 'h2', lines, className = '' }: MotionTitleProps) {
  const accessibleTitle = lines.join(' ');
  let characterIndex = 0;

  return (
    <Tag className={className} aria-label={accessibleTitle}>
      {lines.map((line, lineIndex) => (
        <span className="title-line" key={`${line}-${lineIndex}`} aria-hidden="true">
          {line.split(/(\s+)/).filter(Boolean).map((part, partIndex) => {
            if (/^\s+$/.test(part)) return <span key={`space-${partIndex}`}>{part}</span>;
            return (
              <span className="title-word" key={`${part}-${partIndex}`}>
                {Array.from(part).map((character) => {
                  const index = characterIndex++;
                  return (
                    <span className="title-char" key={`${character}-${index}`}>
                      {character}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

function FilmGrainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const textures: ImageData[] = [];
    let frame = 0;
    let rafId = 0;
    let lastFrame = 0;
    let width = 1;
    let height = 1;
    let stopped = document.hidden || reducedMotion.matches;

    const buildTexture = (): ImageData => {
      const image = context.createImageData(width, height);
      for (let index = 0; index < image.data.length; index += 4) {
        const sample = Math.random();
        if (sample > 0.986) {
          const shade = 168 + Math.random() * 87;
          image.data[index] = shade;
          image.data[index + 1] = shade;
          image.data[index + 2] = shade;
          image.data[index + 3] = 34 + Math.random() * 26;
        } else if (sample > 0.93) {
          const shade = 80 + Math.random() * 115;
          image.data[index] = shade;
          image.data[index + 1] = shade;
          image.data[index + 2] = shade;
          image.data[index + 3] = 10 + Math.random() * 12;
        } else if (sample < 0.012) {
          image.data[index] = 18;
          image.data[index + 1] = 18;
          image.data[index + 2] = 18;
          image.data[index + 3] = 16 + Math.random() * 14;
        }
      }
      return image;
    };

    const resize = (): void => {
      // Half-resolution grain keeps the canvas light on high-DPI displays.
      width = Math.max(1, Math.ceil((window.innerWidth + 100) * 0.5));
      height = Math.max(1, Math.ceil((window.innerHeight + 100) * 0.5));
      canvas.width = width;
      canvas.height = height;
      textures.length = 0;
      if (!reducedMotion.matches) {
        for (let index = 0; index < 6; index += 1) textures.push(buildTexture());
        context.putImageData(textures[0], 0, 0);
      }
    };

    const draw = (now: number): void => {
      rafId = 0;
      if (stopped || reducedMotion.matches) return;
      if (now - lastFrame < 1000 / 24) {
        rafId = window.requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;
      const jitter = [0, 1, -1, 0.7][frame % 4] + (Math.random() * 1.2 - 0.6);
      canvas.style.transform = `translate3d(${jitter.toFixed(2)}px, ${(Math.random() * 2 - 1).toFixed(2)}px, 0)`;
      if (frame % 2 === 0 && textures.length > 0) context.putImageData(textures[frame % textures.length]!, 0, 0);
      frame += 1;
      rafId = window.requestAnimationFrame(draw);
    };

    const start = (): void => {
      if (stopped || rafId || reducedMotion.matches) return;
      rafId = window.requestAnimationFrame(draw);
    };
    const onVisibilityChange = (): void => {
      stopped = document.hidden || reducedMotion.matches;
      if (stopped && rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      if (!stopped) start();
    };
    const onMotionChange = (): void => {
      stopped = document.hidden || reducedMotion.matches;
      if (stopped && rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      canvas.hidden = reducedMotion.matches;
      if (!stopped) {
        resize();
        start();
      }
    };

    resize();
    canvas.hidden = reducedMotion.matches;
    start();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.addEventListener('change', onMotionChange);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotion.removeEventListener('change', onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="film-grain" aria-hidden="true" />;
}

interface AtmosphereLight {
  x: number; y: number; radius: number; alpha: number;
  swayX: number; swayY: number; speed: number; phase: number;
}
interface DustParticle {
  x: number; y: number; vx: number; vy: number; size: number;
  alpha: number; phase: number; frequency: number; depth: number;
}

function AtmosphereCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const random = (min: number, max: number): number => min + Math.random() * (max - min);
    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let rafId = 0;
    let lastFrame = 0;
    let running = !document.hidden && !reducedMotion.matches;
    let dust: DustParticle[] = [];
    const lights: AtmosphereLight[] = [
      { x: 0.18, y: 0.16, radius: 0.22, alpha: 0.035, swayX: 0.035, swayY: 0.022, speed: 0.00011, phase: 0.2 },
      { x: 0.82, y: 0.34, radius: 0.18, alpha: 0.028, swayX: 0.045, swayY: 0.03, speed: 0.000085, phase: 2.1 },
      { x: 0.48, y: 0.88, radius: 0.25, alpha: 0.02, swayX: 0.032, swayY: 0.045, speed: 0.00007, phase: 4.3 },
    ];

    const seedDust = (): void => {
      const count = width < 820 ? 22 : 40;
      dust = Array.from({ length: count }, () => ({
        x: random(-20, width + 20), y: random(-20, height + 20),
        vx: random(-0.28, 0.3), vy: random(-0.16, 0.18),
        size: random(0.42, 1.25), alpha: random(0.045, 0.15),
        phase: random(0, Math.PI * 2), frequency: random(0.00018, 0.00048), depth: random(0.45, 1),
      }));
    };
    const resize = (): void => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.15);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      seedDust();
    };
    const draw = (now: number): void => {
      rafId = 0;
      if (!running || reducedMotion.matches) return;
      if (now - lastFrame < 1000 / 24) {
        rafId = window.requestAnimationFrame(draw);
        return;
      }
      const delta = Math.min(2.2, Math.max(0.6, (now - (lastFrame || now)) / 16.6667));
      lastFrame = now;
      context.clearRect(0, 0, width, height);
      for (const light of lights) {
        const time = now * light.speed + light.phase;
        const x = (light.x + Math.sin(time) * light.swayX) * width;
        const y = (light.y + Math.cos(time * 0.83) * light.swayY) * height;
        const radius = Math.min(width, height) * light.radius;
        const pulse = 0.94 + Math.sin(time * 1.17) * 0.06;
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255,255,255,${(light.alpha * pulse).toFixed(4)})`);
        gradient.addColorStop(0.34, `rgba(255,255,255,${(light.alpha * 0.28 * pulse).toFixed(4)})`);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      for (const particle of dust) {
        const phase = now * particle.frequency + particle.phase;
        particle.x += (particle.vx * particle.depth + Math.sin(phase * 1.31) * 0.065) * delta;
        particle.y += (particle.vy * particle.depth + Math.cos(phase * 0.91) * 0.045) * delta;
        if (particle.x < -12) particle.x = width + 12;
        else if (particle.x > width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = height + 12;
        else if (particle.y > height + 12) particle.y = -12;
        const twinkle = 0.72 + 0.28 * ((Math.sin(phase * 1.6) + 1) * 0.5);
        context.fillStyle = `rgba(255,255,255,${(particle.alpha * twinkle).toFixed(4)})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
      rafId = window.requestAnimationFrame(draw);
    };
    const start = (): void => {
      if (!running || rafId || reducedMotion.matches) return;
      lastFrame = 0;
      rafId = window.requestAnimationFrame(draw);
    };
    const updateMotion = (): void => {
      running = !document.hidden && !reducedMotion.matches;
      if (!running && rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      canvas.hidden = reducedMotion.matches;
      if (running) start();
    };

    resize();
    canvas.hidden = reducedMotion.matches;
    start();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', updateMotion);
    reducedMotion.addEventListener('change', updateMotion);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', updateMotion);
      reducedMotion.removeEventListener('change', updateMotion);
    };
  }, []);

  return <canvas ref={canvasRef} className="atmosphere-canvas" aria-hidden="true" />;
}

function EdgeLayers() {
  return (
    <>
      <div className="edge edge--top" aria-hidden="true">
        <div className="edge__drop-shadow" /><div className="edge__haze" /><div className="edge__glow" /><div className="edge__shine" /><div className="edge__mist" />
      </div>
      <div className="edge edge--bottom" aria-hidden="true">
        <div className="edge__drop-shadow" /><div className="edge__haze" /><div className="edge__glow" /><div className="edge__shine" /><div className="edge__mist" />
      </div>
    </>
  );
}

function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const navRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const linksRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const onViewportChange = (event: MediaQueryListEvent): void => {
      setIsMobile(event.matches);
      if (!event.matches) setIsOpen(false);
    };
    media.addEventListener('change', onViewportChange);
    return () => media.removeEventListener('change', onViewportChange);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return undefined;
    linksRef.current?.querySelector<HTMLElement>('a[href]')?.focus();

    const onPointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isMobile]);

  const closeMenu = (): void => setIsOpen(false);
  return (
    <nav className="nav" aria-label={content.nav.ariaLabel} ref={navRef}>
      <div className="nav-inner">
        <a className="brand" href="#landing" onClick={closeMenu}>{content.nav.brand}</a>
        <button
          ref={toggleRef}
          className={`nav-menu-toggle${isOpen ? ' is-open' : ''}`}
          type="button"
          aria-controls="mobile-navigation-panel"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="menu-line" aria-hidden="true" />
          <span className="menu-line" aria-hidden="true" />
          <span className="menu-line" aria-hidden="true" />
        </button>
        <div
          ref={linksRef}
          id="mobile-navigation-panel"
          className={`nav-links${isOpen ? ' is-open' : ''}`}
          aria-hidden={isMobile && !isOpen}
          inert={isMobile && !isOpen}
        >
          <a href="#landing" onClick={closeMenu}>{content.nav.links.landing}</a>
          <a href="#gradient" onClick={closeMenu}>{content.nav.links.gradient}</a>
          <a href="#fade" onClick={closeMenu}>{content.nav.links.fade}</a>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useLenisScroll(rootRef);
  useCinematicMotion(rootRef);
  useGsapAnimations(rootRef);
  usePageTransitions(rootRef, lenisRef);

  useEffect(() => {
    document.title = content.meta.title;
  }, []);

  return (
    <div className="page-shell" ref={rootRef}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="page-transition" aria-hidden="true" />
      <div className="ambient-wash" aria-hidden="true" />
      <AtmosphereCanvas />
      <FilmGrainCanvas />
      <EdgeLayers />
      <div className="scroll-progress" aria-hidden="true"><span /></div>
      <MobileNavigation />
      <main id="main-content" tabIndex={-1}>
        <section className="hero" id="landing">
          <div className="parallax-stage" aria-hidden="true">
            <div className="parallax-layer parallax-layer--1" data-parallax="0.11" data-depth="1" />
            <div className="parallax-layer parallax-layer--2" data-parallax="-0.18" data-depth="2" />
            <div className="parallax-layer parallax-layer--3" data-parallax="0.28" data-depth="3" />
          </div>
          <div className="hero-inner" data-parallax="-0.03" data-depth="4">
            <span className="eyebrow">{content.hero.eyebrow}</span>
            <MotionTitle as="h1" className="hero-title" lines={[content.hero.title.line1, content.hero.title.line2, content.hero.title.line3]} />
            <p>{content.hero.description}</p>
          </div>
          <a className="hero-scroll-cue" href="#blur" aria-label="Scroll to the first chapter">
            <span className="hero-scroll-cue__line" aria-hidden="true" />
            <span className="hero-scroll-cue__label">SCROLL TO ENTER</span>
          </a>
        </section>
        <section className="demo" aria-label="Motion effects">
          <article className="section" id="blur" data-chapter="impact">
            <div className="chapter-atmosphere" aria-hidden="true" />
            <div className="section-grid">
              <div className="chapter-heading">
                <span className="chapter-kicker">ACT I <i /> THE FIRST IMPACT</span>
                <MotionTitle lines={[content.sections.blur.number, content.sections.blur.title]} />
              </div>
              <div className="section-copy"><p>{content.sections.blur.description}</p></div>
            </div>
          </article>
          <article className="section section--reverse" id="gradient" data-chapter="refraction">
            <div className="chapter-atmosphere" aria-hidden="true" />
            <div className="section-grid">
              <div className="section-copy"><p>{content.sections.gradient.description}</p></div>
              <div className="chapter-heading">
                <span className="chapter-kicker">ACT II <i /> LIGHT IN MOTION</span>
                <MotionTitle lines={[content.sections.gradient.number, content.sections.gradient.title]} />
              </div>
            </div>
          </article>
          <article className="section" id="fade" data-chapter="afterimage">
            <div className="chapter-atmosphere" aria-hidden="true" />
            <div className="section-grid">
              <div className="chapter-heading">
                <span className="chapter-kicker">ACT III <i /> THE AFTERIMAGE</span>
                <MotionTitle lines={[content.sections.fade.number, content.sections.fade.title]} />
              </div>
              <div className="section-copy"><p>{content.sections.fade.description}</p></div>
            </div>
          </article>
          <div className="visual" data-outro="true" data-parallax="-0.025" data-depth="1">
            <div className="visual-orbit visual-orbit--one" aria-hidden="true" />
            <div className="visual-orbit visual-orbit--two" aria-hidden="true" />
            <div className="card" data-parallax="0.035" data-depth="2">
              <small>{content.card.label}</small><strong>{content.card.value}</strong>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer"><span>{content.footer.primary}</span><em>{content.footer.secondary}</em></footer>
    </div>
  );
}
