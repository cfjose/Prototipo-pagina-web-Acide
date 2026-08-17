import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

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

/*
  Variante reversible de [data-reveal]: en vez de revelar una sola vez
  (once:true), se re-anima cada vez que el elemento vuelve a entrar en
  viewport — hacia abajo entra normal, hacia arriba se revierte (fade +
  baja en vez de subir), y si se vuelve a bajar se repite. Va aparte de
  initScrollReveal/ScrollTrigger.batch porque batch no ofrece
  toggleActions por elemento — acá es un ScrollTrigger individual por
  elemento (son pocos: las tarjetas de "Lo que nos hace únicos" y "Lo
  que desarrollamos", no toda la página).

  start/end cubren TODO el paso del elemento por el viewport ("top
  bottom" a "bottom top": desde que el borde superior asoma por abajo
  hasta que el borde inferior desaparece por arriba) — a propósito, el
  rango más ancho posible. Sin un "end" explícito el trigger por
  defecto termina 1px después del "start", así que entrar y salir pasan
  casi en el mismo punto: un scroll rápido (rueda del mouse, salto de
  trackpad) puede cruzar ese punto de ida y vuelta en un solo evento y
  la imagen parpadea (aparece/desaparece). Con el rango completo eso es
  prácticamente imposible de saltar de un solo scroll.
*/
export function initScrollRevealToggle() {
  const els = gsap.utils.toArray("[data-reveal-toggle]");
  if (!els.length) return;

  if (prefersReducedMotion()) {
    gsap.set(els, { opacity: 1, y: 0 });
    return;
  }

  els.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        toggleActions: "play reverse play reverse",
      },
    });
  });
}
