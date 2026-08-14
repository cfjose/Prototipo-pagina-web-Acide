import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  La imagen del hero de /proyectos arranca al 75% de ancho (1/4 más
  angosta que su tamaño completo) y crece a 100% a medida que el
  usuario la scrollea — no es un reveal on/off, es un ancho atado
  directo al scroll (scrub), como si "tomara su lugar" mientras pasás
  por ella.
*/
export function initProjectsHero() {
  const wrapper = document.querySelector("[data-projects-hero-image]");
  if (!wrapper) return;

  if (prefersReducedMotion()) {
    gsap.set(wrapper, { width: "100%" });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(
    wrapper,
    { width: "75%" },
    {
      width: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: "top -20%",
        scrub: 0.5,
      },
    },
  );
}
