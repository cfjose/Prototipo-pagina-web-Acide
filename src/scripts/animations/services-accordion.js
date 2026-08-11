import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";
import { splitWords, playWordReveal } from "./text-reveal.js";

/*
  Acordeón de servicios: un solo item expandido a la vez (patrón que ya
  trae Figma — el primer item abierto por default). Se activa con hover
  en desktop y con click/Enter (accesible, sirve para touch y teclado).

  La imagen cambia por completo según el item activo: están todas
  apiladas (position absolute, una por item) y se cruzan con un
  fade + scale suave — la que entra arranca un poco más grande y se
  asienta a su tamaño real; la que sale solo se desvanece.

  La descripción que se abre usa el mismo reveal palabra por palabra que
  el resto del sitio (ver text-reveal.js) — pero acá lo disparamos a mano
  cada vez que el item se activa, no solo la primera vez que se ve la
  sección, para que se sienta viva cada vez que el usuario hace hover.

  Soporta varias instancias en la misma página (cada [data-accordion] se
  resuelve contra las imágenes dentro de su propia sección, no globales).
*/
export function initServicesAccordion() {
  const accordions = document.querySelectorAll("[data-accordion]");
  if (!accordions.length) return;

  const reduced = prefersReducedMotion();

  accordions.forEach((accordion) => {
    const scope = accordion.closest("section") ?? document;
    const items = accordion.querySelectorAll("[data-accordion-item]");
    const images = scope.querySelectorAll("[data-service-image-item]");
    // Color del item activo — configurable por instancia, ej. data-accordion="navy"
    const activeColor = `text-${accordion.dataset.accordion || "navy"}`;

    const descriptionWords = [...items].map((item) => {
      const description = item.querySelector("[data-accordion-description]");
      return description ? splitWords(description) : null;
    });

    const setActive = (index) => {
      items.forEach((item, i) => {
        const isActive = i === index;
        item.dataset.active = String(isActive);

        const trigger = item.querySelector("[data-accordion-trigger-text]");
        const panel = item.querySelector("[data-accordion-panel]");

        trigger.classList.toggle(activeColor, isActive);
        trigger.classList.toggle("font-bold", isActive);
        trigger.classList.toggle("text-ink", !isActive);
        trigger.classList.toggle("font-medium", !isActive);
        panel.classList.toggle("grid-rows-[1fr]", isActive);
        panel.classList.toggle("grid-rows-[0fr]", !isActive);
      });

      if (descriptionWords[index]) {
        playWordReveal(descriptionWords[index], { delay: reduced ? 0 : 0.15 });
      }

      if (reduced || !images.length) return;

      images.forEach((img, i) => {
        gsap.killTweensOf(img);
        if (i === index) {
          gsap.set(img, { zIndex: 2 });
          gsap.fromTo(
            img,
            { opacity: 0, scale: 1.09 },
            { opacity: 1, scale: 1, duration: 1.1, ease: "power3.out" }
          );
        } else {
          gsap.to(img, { opacity: 0, duration: 0.6, ease: "power2.out", zIndex: 1 });
        }
      });
    };

    items.forEach((item, i) => {
      const trigger = item.querySelector("[data-accordion-trigger]");

      trigger.addEventListener("click", () => setActive(i));
      item.addEventListener("mouseenter", () => setActive(i));
    });

    // El item activo por default (i=0) ya está expandido en el HTML inicial —
    // reproducimos su reveal una vez al cargar, igual que el resto del texto.
    if (descriptionWords[0]) {
      playWordReveal(descriptionWords[0]);
    }
  });
}
