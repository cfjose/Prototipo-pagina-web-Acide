import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  La línea roja del hero ahora la pinta hero-rotating-word.js al
  terminar cada frase. Acá solo queda la descripción, si existe.
*/
export function initHeroIntro() {
  const description = document.querySelector("[data-hero-description]");
  if (!description) return;

  if (prefersReducedMotion()) {
    gsap.set(description, { opacity: 1 });
    return;
  }

  gsap.to(description, { opacity: 1, duration: 1.1, delay: 0.35, ease: "power1.out" });
}
