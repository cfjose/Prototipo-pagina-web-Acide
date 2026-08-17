import { gsap } from "gsap";

/*
  "Nuestra historia" — dos topes de scroll distintos, a propósito:

  - navMax: la posición "en reposo" donde el último año REAL (no el
    espaciador) queda pegado al borde derecho — siempre hay 4 años
    completos visibles acá. Es el tope que usan las FLECHAS (nunca se
    navega más allá) y la posición a la que todo vuelve al salir de un
    hover.

  - hoverMax: el tope real de scroll (incluye el espaciador del final).
    Mientras se está haciendo HOVER sobre una columna, si su
    descripción no entra empujando hacia la derecha, la franja SÍ
    puede scrollear más allá de navMax (empujando los años anteriores
    hacia la izquierda, tal como pidió el cliente) — la regla de "4
    años siempre visibles" aplica al estado en REPOSO, no a mitad de
    un hover. Por eso cada hover guarda la posición de antes
    (restingScroll) y la restaura entera al hacer mouseleave.

  1. Cursor a medida "Hover" — mismo patrón que "Ver proyecto" de
     results-carousel.js.
  2. Auto-scroll en hover + restaurar posición al salir.
  3. Flechas de navegación, sin pasar nunca de navMax.
*/
const DESCRIPTION_EXTRA_WIDTH = 320 + 36;

export function initAboutHistory() {
  const cursor = document.querySelector("[data-history-cursor]");
  const items = document.querySelectorAll("[data-history-item]");
  const scrollEl = document.querySelector("[data-history-scroll]");
  const prevBtn = document.querySelector("[data-history-prev]");
  const nextBtn = document.querySelector("[data-history-next]");
  const track = document.querySelector("[data-history-track]");
  const spacer = track?.lastElementChild; // el espaciador que reserva lugar para el hover del último año

  if (!scrollEl || !items.length) return;

  // Ambos topes se miden UNA sola vez al cargar (scrollLeft en 0, sin
  // animación en curso) — medirlos de nuevo en cada evento leería
  // scrollLeft en pleno scroll-smooth y daría un valor viejo (por eso
  // targetScroll tampoco se relee del DOM, ver más abajo).
  const navMax = (() => {
    if (!spacer) return scrollEl.scrollWidth - scrollEl.clientWidth;
    const scrollRect = scrollEl.getBoundingClientRect();
    const spacerRect = spacer.getBoundingClientRect();
    const spacerOffset = spacerRect.left - scrollRect.left + scrollEl.scrollLeft;
    return Math.max(0, spacerOffset - scrollEl.clientWidth);
  })();
  const hoverMax = scrollEl.scrollWidth - scrollEl.clientWidth;

  // El destino del scroll se lleva en esta variable propia, no leyendo
  // scrollEl.scrollLeft en cada click/hover — si el scroll-smooth anterior
  // todavía está animando, scrollLeft está a mitad de camino y un segundo
  // evento "rápido" calcularía mal el siguiente paso.
  let targetScroll = 0;
  const scrollToClamped = (target, max) => {
    targetScroll = Math.min(Math.max(target, 0), max);
    scrollEl.scrollTo({ left: targetScroll, behavior: "smooth" });
  };

  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const quickX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
    const quickY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

    window.addEventListener("mousemove", (e) => {
      quickX(e.clientX);
      quickY(e.clientY);
    });

    items.forEach((item) => {
      let restingScroll = 0;

      item.addEventListener("mouseenter", () => {
        item.classList.add("cursor-none");
        gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });

        restingScroll = targetScroll; // dónde estábamos ANTES de este hover — se restaura al salir

        const containerRect = scrollEl.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const overflowRight = itemRect.right + DESCRIPTION_EXTRA_WIDTH - containerRect.right;
        const overflowLeft = containerRect.left - itemRect.left;

        if (overflowRight > 0) {
          scrollToClamped(targetScroll + overflowRight + 24, hoverMax);
        } else if (overflowLeft > 0) {
          scrollToClamped(targetScroll - overflowLeft - 24, hoverMax);
        }
      });
      item.addEventListener("mouseleave", () => {
        item.classList.remove("cursor-none");
        gsap.to(cursor, { opacity: 0, scale: 0.75, duration: 0.25, ease: "power2.out" });
        scrollToClamped(restingScroll, navMax);
      });
    });
  }

  const stepWidth = () => {
    const first = items[0];
    const divider = first.nextElementSibling; // el separador vertical entre columnas
    const gap = parseFloat(getComputedStyle(first.parentElement).columnGap) || 0;
    const dividerWidth = divider ? divider.getBoundingClientRect().width : 0;
    return first.getBoundingClientRect().width + gap * 2 + dividerWidth;
  };

  prevBtn?.addEventListener("click", () => {
    scrollToClamped(targetScroll - stepWidth(), navMax);
  });
  nextBtn?.addEventListener("click", () => {
    scrollToClamped(targetScroll + stepWidth(), navMax);
  });
}
