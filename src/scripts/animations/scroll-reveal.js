import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
  Revela elementos [data-reveal] / [data-reveal-fade] / [data-reveal-scale]
  al entrar en viewport. Usa ScrollTrigger.batch para agrupar elementos
  cercanos en una sola animación y evitar recalcular layout por cada uno.
*/
export function initScrollReveal() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      reduced: "(prefers-reduced-motion: reduce)",
      full: "(prefers-reduced-motion: no-preference)",
    },
    (context) => {
      const { reduced } = context.conditions;

      if (reduced) {
        gsap.set(
          "[data-reveal], [data-reveal-fade], [data-reveal-scale]",
          { opacity: 1, y: 0, scale: 1 }
        );
        return;
      }

      const setup = (selector, vars) => {
        const els = gsap.utils.toArray(selector);
        if (!els.length) return;

        ScrollTrigger.batch(els, {
          start: "top 85%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              ...vars,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.12,
              overwrite: true,
            }),
        });
      };

      setup("[data-reveal]", { opacity: 1, y: 0 });
      setup("[data-reveal-fade]", { opacity: 1 });
      setup("[data-reveal-scale]", { opacity: 1, scale: 1 });
    }
  );
}
