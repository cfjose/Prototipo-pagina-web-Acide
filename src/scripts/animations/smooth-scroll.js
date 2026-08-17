import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Lenis provee el scroll suave; se sincroniza con el ticker de GSAP
  para que ScrollTrigger quede perfectamente alineado con la posición
  real de scroll (evita jitter/desfasaje entre ambas libs).
  Se omite por completo si el usuario prefiere motion reducido.

  Se guarda en window.__lenis para que otros scripts (ej. article-nav.js,
  para el scroll animado a cada sección al hacer click en el nav)
  puedan pedirle un scrollTo sin duplicar la instancia — Lenis no
  dispara el evento "scroll" nativo, así que un scrollIntoView/anchor
  normal no basta.
*/
export function initSmoothScroll() {
  if (prefersReducedMotion()) return null;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  window.__lenis = lenis;

  return lenis;
}
