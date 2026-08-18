import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";
import { splitWords, playWordReveal } from "./text-reveal.js";
import { createImageTransition } from "./webgl-image-transition.js";

/*
  Acordeón de servicios: un solo item expandido a la vez, por CLICK en el
  título — el ícono circular de al lado es un link directo a la página
  del servicio, no togglea el acordeón. Si nadie toca nada, avanza solo
  al siguiente cada AUTO_ADVANCE_MS.

  La línea que separa un item del siguiente ES la barra de progreso de
  ese item: en reposo es gris estática (divisor), y cuando el item está
  activo se rellena de color animando su ancho 0% → 100% — no hay un
  elemento de progreso separado ni se reubica nada en el DOM.

  La imagen cambia con la transición WebGL del demo de referencia (ver
  webgl-image-transition.js: cada imagen desplaza a la otra según su
  propio brillo mientras se cruzan) si el cuadro tiene un
  [data-service-image-canvas] y el navegador soporta WebGL — la carga
  de texturas es asíncrona, así que si alguien hace click ANTES de que
  termine de cargar, ese click puntual cae al reemplazo por
  deslizamiento de siempre (yPercent 100 → 0); los siguientes ya usan
  WebGL una vez listo. Mismo fallback si el cuadro no tiene canvas, o
  si WebGL no está disponible.

  La descripción que se abre usa el mismo reveal palabra por palabra que
  el resto del sitio (text-reveal.js), disparado a mano cada vez que el
  item se activa.

  Soporta varias instancias en la misma página (cada [data-accordion] se
  resuelve contra las imágenes dentro de su propia sección, no globales).
*/
const AUTO_ADVANCE_MS = 6000;

export function initServicesAccordion() {
  const accordions = document.querySelectorAll("[data-accordion]");
  if (!accordions.length) return;

  const reduced = prefersReducedMotion();

  accordions.forEach((accordion) => {
    const scope = accordion.closest("section") ?? document;
    const items = accordion.querySelectorAll("[data-accordion-item]");
    const images = scope.querySelectorAll("[data-service-image-item]");
    const canvas = scope.querySelector("[data-service-image-canvas]");
    const lineFills = [...items].map((item) => item.querySelector("[data-accordion-line-fill]"));
    // Color del item activo — configurable por instancia, ej. data-accordion="navy"
    const activeColor = `text-${accordion.dataset.accordion || "navy"}`;

    const descriptionWords = [...items].map((item) => {
      const description = item.querySelector("[data-accordion-description]");
      return description ? splitWords(description) : null;
    });

    let activeIndex = [...items].findIndex((item) => item.dataset.active === "true");
    if (activeIndex < 0) activeIndex = 0;
    let advanceTimer = null;
    let glTransition = null;

    if (canvas && images.length && !reduced) {
      const urls = [...images].map((item) => {
        const img = item.querySelector("img");
        return img?.currentSrc || img?.src;
      });
      createImageTransition(canvas, urls)
        .then((transition) => {
          glTransition = transition;
        })
        .catch((err) => console.error("createImageTransition failed", err));
    }

    // Posición inicial de las imágenes vía GSAP (no CSS): la activa en su
    // lugar, el resto esperando justo debajo del cuadro, listas para
    // "entrar" cuando les toque (fallback sin WebGL). Con WebGL, el
    // canvas queda encima y tapa este stack por completo una vez cargado
    // — este estado solo se ve de refilón mientras cargan las texturas.
    if (images.length) {
      images.forEach((img, i) => {
        gsap.set(img, { yPercent: i === activeIndex ? 0 : 100, zIndex: i === activeIndex ? 2 : 1 });
      });
    }

    const resetLine = (index) => {
      const fill = lineFills[index];
      if (!fill) return;
      fill.style.transition = "none";
      fill.style.width = "0%";
    };

    const scheduleAdvance = () => {
      clearTimeout(advanceTimer);
      lineFills.forEach((fill, i) => {
        if (i !== activeIndex) resetLine(i);
      });

      const fill = lineFills[activeIndex];
      if (reduced || !fill) return;

      fill.style.transition = "none";
      fill.style.width = "0%";
      // Fuerza reflow para que el navegador registre el 0% antes de animar al 100%.
      void fill.offsetWidth;
      fill.style.transition = `width ${AUTO_ADVANCE_MS}ms linear`;
      fill.style.width = "100%";

      advanceTimer = setTimeout(() => {
        setActive((activeIndex + 1) % items.length);
      }, AUTO_ADVANCE_MS);
    };

    const setActive = (index) => {
      if (index === activeIndex) return;
      const previousIndex = activeIndex;
      activeIndex = index;

      items.forEach((item, i) => {
        const isActive = i === index;
        item.dataset.active = String(isActive);

        const trigger = item.querySelector("[data-accordion-trigger-text]");
        const panel = item.querySelector("[data-accordion-panel]");
        const iconOutline = item.querySelector("[data-accordion-icon-outline]");
        const iconFill = item.querySelector("[data-accordion-icon-fill]");

        trigger.classList.toggle(activeColor, isActive);
        trigger.classList.toggle("text-ink", !isActive);
        panel.classList.toggle("grid-rows-[1fr]", isActive);
        panel.classList.toggle("grid-rows-[0fr]", !isActive);
        // Cerrado: ícono solo con línea (outline), sin color de marca.
        // Activo: ícono relleno, con el color de acento.
        iconOutline?.classList.toggle("opacity-0", isActive);
        iconOutline?.classList.toggle("opacity-100", !isActive);
        iconFill?.classList.toggle("opacity-100", isActive);
        iconFill?.classList.toggle("opacity-0", !isActive);
      });

      if (descriptionWords[index]) {
        playWordReveal(descriptionWords[index], { delay: reduced ? 0 : 0.15 });
      }

      scheduleAdvance();

      if (!images.length) return;

      if (reduced) {
        images.forEach((img, i) => {
          gsap.killTweensOf(img);
          gsap.set(img, { yPercent: i === index ? 0 : 100, zIndex: i === index ? 2 : 1 });
        });
        return;
      }

      if (glTransition) {
        glTransition.goTo(index);
        return;
      }

      images.forEach((img, i) => {
        gsap.killTweensOf(img);
        if (i === index) {
          gsap.set(img, { yPercent: 100, zIndex: 2 });
          gsap.to(img, { yPercent: 0, duration: 0.6, ease: "power2.inOut" });
        } else if (i === previousIndex) {
          // La que sale se va para arriba (no se queda quieta atrás) —
          // así el cambio se siente como un empuje, no un corte brusco.
          gsap.set(img, { zIndex: 1 });
          gsap.to(img, { yPercent: -100, duration: 0.6, ease: "power2.inOut" });
        } else {
          gsap.set(img, { yPercent: 100, zIndex: 1 });
        }
      });
    };

    items.forEach((item, i) => {
      const trigger = item.querySelector("[data-accordion-trigger]");
      trigger.addEventListener("click", () => setActive(i));
    });

    // Estado inicial: el item activo por default ya está expandido en el
    // HTML — reproducimos su reveal y arrancamos el auto-avance.
    if (descriptionWords[activeIndex]) playWordReveal(descriptionWords[activeIndex]);
    scheduleAdvance();
  });
}
