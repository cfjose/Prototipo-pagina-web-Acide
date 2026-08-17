import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Hero de /blog: 4 publicaciones que rotan solas, estilo Instagram
  Stories — una barra por slide que se llena en rojo con el paso del
  tiempo (SLIDE_DURATION segundos) y al completarse pasa a la
  siguiente. La entrante empuja a la saliente hacia la izquierda
  (entra desde xPercent 100 hasta 0, la saliente va de 0 a -100),
  pedido explícito del cliente. Click en cualquier barra (están
  duplicadas dentro de cada slide, ver BlogHero.astro) salta directo a
  ese slide y reinicia el temporizador.

  Con "prefers-reduced-motion" no animamos ni rotamos: se queda fijo
  en el primer slide con su barra llena, sin timer.
*/
const SLIDE_DURATION = 6;

export function initBlogHero() {
  const slides = document.querySelectorAll("[data-blog-hero-slide]");
  const bars = document.querySelectorAll("[data-blog-hero-bar]");
  if (!slides.length) return;

  const count = slides.length;
  const reduced = prefersReducedMotion();

  const setBars = (index, progress = 0) => {
    const fills = slides[index].querySelectorAll("[data-blog-hero-bar-fill]");
    fills.forEach((fill, i) => {
      if (i < index) fill.style.width = "100%";
      else if (i === index) fill.style.width = `${progress * 100}%`;
      else fill.style.width = "0%";
    });
  };

  if (reduced) {
    setBars(0, 1);
    return;
  }

  let current = 0;
  let rafId = null;

  const goTo = (index) => {
    if (index === current) return;
    const incoming = slides[index];
    const outgoing = slides[current];

    gsap.killTweensOf(incoming);
    gsap.killTweensOf(outgoing);
    gsap.set(incoming, { xPercent: 100 });
    gsap.to(incoming, { xPercent: 0, duration: 0.9, ease: "power3.inOut" });
    gsap.to(outgoing, { xPercent: -100, duration: 0.9, ease: "power3.inOut" });

    current = index;
    setBars(current, 0);
  };

  const clearTimer = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const startTimer = () => {
    clearTimer();
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 1000 / SLIDE_DURATION);
      setBars(current, progress);
      if (progress >= 1) {
        goTo((current + 1) % count);
        startTimer();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  bars.forEach((bar) => {
    bar.addEventListener("click", () => {
      goTo(Number(bar.dataset.index));
      startTimer();
    });
  });

  gsap.set(slides[0], { xPercent: 0 });
  setBars(0, 0);
  startTimer();
}
