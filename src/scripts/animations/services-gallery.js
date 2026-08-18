import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Scroll-driven, estilo fantasy.co/work/kohler — pero fijo, no un
  scroll normal: la sección se "pinea" en el viewport (mismo mecanismo
  que Testimonials, ScrollTrigger con pin:true) y el scroll dentro de
  ese tramo avanza entre los 4 servicios, cruzando texto e imagen en el
  mismo lugar. Recién se libera hacia la siguiente sección después de
  pasar por los 4. Solo en desktop — en mobile es una lista normal sin
  pin (el scroll-jacking se siente mal en touch).

  El texto sube de forma continua atado al scroll (no un salto discreto
  disparado al cruzar un umbral) — mismo espíritu que
  results-carousel.js: cada frame de onUpdate interpola directo la
  posición según el progreso exacto, así el usuario siente que arrastra
  el texto con su propio gesto de scroll. El texto entrante "emerge"
  literalmente desde la posición real de la barra de progreso (medida
  en pantalla, no un offset inventado) — [data-gallery-text-stack] tiene
  overflow-hidden para que se corte ahí, más un fundido de opacidad
  angosto solo cerca del borde de recorte (no en todo el trayecto, para
  no sentirse como el crossfade viejo).

  La imagen SÍ sigue siendo un swap discreto (mismo crossfade de
  siempre) pero ahora se dispara en el PUNTO MEDIO entre dos pasos
  (Math.round del índice virtual), no al arrancar el paso — coincide
  con el momento en que el texto entrante llega al centro de la
  pantalla.
*/
export function initServicesGallery() {
  const pinTarget = document.querySelector("[data-gallery-pin]");
  const pinContent = document.querySelector("[data-gallery-pin-content]");
  const textStack = document.querySelector("[data-gallery-text-stack]");
  const bars = document.querySelector("[data-gallery-bars]");
  const textItems = document.querySelectorAll("[data-gallery-text-item]");
  const mediaItems = document.querySelectorAll("[data-gallery-media-item]");
  const barFills = document.querySelectorAll("[data-gallery-bar-fill]");
  const link = document.querySelector("[data-gallery-link]");
  const cursor = document.querySelector("[data-gallery-cursor]");
  const mediaStack = document.querySelector("[data-gallery-media-stack]");
  if (!pinTarget || !textItems.length || !mediaItems.length) return;

  const count = textItems.length;
  const reduced = prefersReducedMotion();
  let scrollTrigger = null;
  let lastVirtualIndex = 0;
  let lastNearestIndex = 0;

  let riseDown = 300;
  let riseUp = 300;

  // Blur máximo (px) en los extremos del recorrido (offset ±1) — el
  // desenfoque hace de "colchón" visual para el tramo en que dos ítems
  // todavía se superponen en pantalla, sin depender de recortar con
  // overflow-hidden (ver por qué más abajo).
  const MAX_BLUR = 14;

  /*
    Las barras de progreso llevan 80px de separación arriba, pero solo
    si entran: si sumarlas hace que el stage completo pase el alto del
    viewport se rompe el pin (algo queda cortado), así que se esconden
    enteras en vez de recortarse.

    [data-gallery-text-stack] YA NO tiene overflow-hidden: recortar ahí
    cortaba el texto contra la caja chica del propio bloque (bug visto
    en pantalla — el texto se sentía "encerrado en un frame" en vez de
    salir/entrar de la pantalla real). Ahora el texto viaja libre y solo
    se oculta al salir físicamente del viewport (arriba) o al fundirse/
    desenfocarse (abajo, ver applyContinuousTextPosition).

    Dos distancias, no una — bajar y subir no son simétricas:
    - riseDown: el texto entrante viaja hacia abajo desde su posición
      asentada hasta la barra de progreso (medido en pantalla), para que
      nazca ahí literalmente, como pidió el usuario.
    - riseUp: el texto saliente viaja hacia arriba hasta salir del todo
      por el borde superior del viewport (no de la caja del texto) —
      stackRect.bottom ES esa distancia (viewport-relative, con la
      sección ya pineada): trasladar el bloque exactamente esa cantidad
      lleva su borde inferior a y=0.
  */
  const measureLayout = () => {
    if (!pinContent || !bars || !textStack) return;
    bars.style.display = "";
    const contentHeight = pinContent.getBoundingClientRect().height;
    const barsMarginTop = parseFloat(getComputedStyle(bars).marginTop) || 0;
    const barsRect = bars.getBoundingClientRect();
    const fits = contentHeight + barsMarginTop + barsRect.height <= window.innerHeight;
    bars.style.display = fits ? "" : "none";

    const stackRect = textStack.getBoundingClientRect();
    riseDown = Math.max(140, barsRect.top - stackRect.bottom);
    riseUp = Math.max(140, stackRect.bottom * 1.05);
  };
  measureLayout();

  const updateBars = (progress) => {
    barFills.forEach((fill, i) => {
      const segStart = i / count;
      const segEnd = (i + 1) / count;
      let local = 0;
      if (progress >= segEnd) local = 1;
      else if (progress > segStart) local = (progress - segStart) / (segEnd - segStart);
      fill.style.width = `${local * 100}%`;
    });
  };

  /*
    Posición continua del texto: offset 0 = asentado, +1 = esperando
    abajo (todavía no le toca), -1 = ya pasó, saliendo arriba.

    Blur gaussiano + fundido de opacidad, los dos proporcionales a TODO
    el recorrido — el texto entra desenfocado y transparente desde la
    barra, se enfoca y aparece de golpe al asentarse, y al salir se
    desenfoca/transparenta otra vez en vez de cortarse en seco.
  */
  const applyContinuousTextPosition = (virtualIndex) => {
    textItems.forEach((item, i) => {
      const offset = i - virtualIndex;
      const clamped = Math.max(-1, Math.min(1, offset));
      const y = clamped >= 0 ? clamped * riseDown : clamped * riseUp;
      const absOffset = Math.abs(clamped);
      const opacity = 1 - absOffset;
      const blur = absOffset * MAX_BLUR;
      gsap.set(item, { y, opacity, filter: `blur(${blur}px)`, zIndex: absOffset < 0.5 ? 2 : 1 });
    });
  };

  const goToImage = (index) => {
    mediaItems.forEach((media, i) => {
      gsap.killTweensOf(media);
      if (reduced) {
        gsap.set(media, { opacity: i === index ? 1 : 0, zIndex: i === index ? 2 : 1 });
        return;
      }
      if (i === index) {
        gsap.set(media, { zIndex: 2 });
        gsap.fromTo(media, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" });
      } else {
        gsap.to(media, { opacity: 0, duration: 0.4, ease: "power2.out", zIndex: 1 });
      }
    });
    if (link) link.href = textItems[index]?.dataset.href || "#contacto";
  };

  // Estado inicial: el primer servicio asentado, el resto esperando abajo.
  applyContinuousTextPosition(0);
  gsap.set(mediaItems, { opacity: (i) => (i === 0 ? 1 : 0), zIndex: (i) => (i === 0 ? 2 : 1) });
  updateBars(0);
  if (link) link.href = textItems[0]?.dataset.href || "#contacto";

  // Cursor a medida "Ver más información" sobre toda la fila (texto +
  // imagen) — mismo mecanismo que [data-results-cursor] en
  // ResultsCarousel, solo que acá reemplaza al botón que había por ítem.
  if (link && cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const quickX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
    const quickY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

    window.addEventListener("mousemove", (e) => {
      quickX(e.clientX);
      quickY(e.clientY);
    });

    link.addEventListener("mouseenter", () => {
      link.classList.add("cursor-none");
      gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
    });
    link.addEventListener("mouseleave", () => {
      link.classList.remove("cursor-none");
      gsap.to(cursor, { opacity: 0, scale: 0.75, duration: 0.25, ease: "power2.out" });
    });

    // Sobre la imagen el texto navy no contrasta — blanco ahí, navy en
    // el resto de la fila (fondo blanco).
    if (mediaStack) {
      mediaStack.addEventListener("mouseenter", () => {
        cursor.classList.remove("text-navy");
        cursor.classList.add("text-white");
      });
      mediaStack.addEventListener("mouseleave", () => {
        cursor.classList.remove("text-white");
        cursor.classList.add("text-navy");
      });
    }
  }

  barFills.forEach((fill, i) => {
    const bar = fill.parentElement;
    bar.addEventListener("click", () => {
      if (scrollTrigger) {
        const target = i / count + 0.5 / count;
        const y = scrollTrigger.start + target * (scrollTrigger.end - scrollTrigger.start);
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      } else {
        lastNearestIndex = i;
        applyContinuousTextPosition(i);
        goToImage(i);
        updateBars((i + 0.5) / count);
      }
    });
  });

  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    measureLayout();
    window.addEventListener("resize", measureLayout);

    scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "center center",
      end: () => `+=${(count - 1) * 600}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onRefresh: measureLayout,
      onUpdate: (self) => {
        const virtualIndex = self.progress * (count - 1);
        applyContinuousTextPosition(virtualIndex);
        updateBars(self.progress);
        lastVirtualIndex = virtualIndex;

        const nearest = Math.round(virtualIndex);
        if (nearest !== lastNearestIndex) {
          lastNearestIndex = nearest;
          goToImage(nearest);
        }
      },
    });

    return () => {
      window.removeEventListener("resize", measureLayout);
      scrollTrigger = null;
    };
  });
}
