import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";
import { splitWords, playWordReveal } from "./text-reveal.js";

/*
  Acordeón de servicios: un solo item expandido a la vez, por CLICK (no
  hover) — click en el título o en el ícono +/- abre ese item y cierra el
  resto. Si nadie toca nada, avanza solo al siguiente cada
  AUTO_ADVANCE_MS, con UNA sola barra de progreso compartida por todo el
  acordeón (no una por item) que el JS reubica dentro del item activo en
  cada cambio — así nunca hay dos barras visibles a la vez.

  La imagen no usa un crossfade suave: la que entra aparece desde abajo
  del cuadro y se asienta en su lugar (yPercent 100 → 0), sin animar
  opacidad — es un reemplazo directo, no una disolución.

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
    const progressBar = accordion.parentElement.querySelector("[data-accordion-progress]");
    const progressFill = progressBar?.querySelector("[data-accordion-progress-fill]");
    // Color del item activo — configurable por instancia, ej. data-accordion="navy"
    const activeColor = `text-${accordion.dataset.accordion || "navy"}`;

    const descriptionWords = [...items].map((item) => {
      const description = item.querySelector("[data-accordion-description]");
      return description ? splitWords(description) : null;
    });

    let activeIndex = [...items].findIndex((item) => item.dataset.active === "true");
    if (activeIndex < 0) activeIndex = 0;
    let advanceTimer = null;

    // Posición inicial de las imágenes vía GSAP (no CSS): la activa en su
    // lugar, el resto esperando justo debajo del cuadro, listas para
    // "entrar" cuando les toque.
    if (images.length) {
      images.forEach((img, i) => {
        gsap.set(img, { yPercent: i === activeIndex ? 0 : 100, zIndex: i === activeIndex ? 2 : 1 });
      });
    }

    const moveProgressBar = (index) => {
      if (!progressBar) return;
      const panelContent = items[index]?.querySelector("[data-accordion-panel] > div");
      panelContent?.appendChild(progressBar);
    };

    const scheduleAdvance = () => {
      clearTimeout(advanceTimer);
      if (reduced || !progressFill) return;

      progressFill.style.transition = "none";
      progressFill.style.width = "0%";
      // Fuerza reflow para que el navegador registre el 0% antes de animar al 100%.
      void progressFill.offsetWidth;
      progressFill.style.transition = `width ${AUTO_ADVANCE_MS}ms linear`;
      progressFill.style.width = "100%";

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
        const iconVertical = item.querySelector("[data-accordion-icon-vertical]");

        trigger.classList.toggle(activeColor, isActive);
        trigger.classList.toggle("text-ink", !isActive);
        panel.classList.toggle("grid-rows-[1fr]", isActive);
        panel.classList.toggle("grid-rows-[0fr]", !isActive);
        iconVertical?.classList.toggle("scale-y-0", isActive);
        iconVertical?.classList.toggle("scale-y-100", !isActive);
      });

      if (descriptionWords[index]) {
        playWordReveal(descriptionWords[index], { delay: reduced ? 0 : 0.15 });
      }

      moveProgressBar(index);
      scheduleAdvance();

      if (!images.length) return;

      images.forEach((img, i) => {
        gsap.killTweensOf(img);
        if (reduced) {
          gsap.set(img, { yPercent: i === index ? 0 : 100, zIndex: i === index ? 2 : 1 });
          return;
        }
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
    // HTML — ubicamos la barra ahí, reproducimos su reveal y arrancamos
    // el auto-avance.
    moveProgressBar(activeIndex);
    if (descriptionWords[activeIndex]) playWordReveal(descriptionWords[activeIndex]);
    scheduleAdvance();
  });
}
