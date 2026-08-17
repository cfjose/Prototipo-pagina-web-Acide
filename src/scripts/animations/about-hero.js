import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Igual que projects-hero.js pero con otro ancho de arranque (582/1312
  = 44.36%, no 69.51%) — por eso es un script separado en vez de
  reusar el mismo, que trae el 69.51% hardcodeado.
*/
export function initAboutHero() {
  const wrapper = document.querySelector("[data-about-hero-image]");
  if (!wrapper) return;

  if (prefersReducedMotion()) {
    gsap.set(wrapper, { width: "100%" });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(
    wrapper,
    { width: "44.36%" },
    {
      width: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: () => {
          const rect = wrapper.getBoundingClientRect();
          const absoluteBottom = rect.bottom + window.scrollY;
          return `+=${Math.max(absoluteBottom - window.innerHeight, 0)}`;
        },
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    },
  );
}
