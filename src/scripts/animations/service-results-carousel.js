import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Slider real, no un zoom in-place: 5 posiciones a lo largo de la
  pantalla (0=fuera por la izquierda, 1=costado izquierdo, 2=centro,
  3=costado derecho, 4=fuera por la derecha). Tamaños: centro 996x553,
  costados 683x384, gap 24px fijo (igual criterio de escalado que antes
  si no entra en pantalla).

  Los costados (1 y 3) no entran completos: se recortan contra el
  borde de la pantalla, mostrando 3/4 de la imagen y dejando 1/4 fuera
  (cortado por el overflow-hidden de la sección) — por eso el ancho
  disponible para escalar se calcula contra el ancho VISIBLE de la fila
  (3/4 de cada costado, no el costado completo), lo que además permite
  una escala más grande que antes sin que dejen de entrar en pantalla.

  La posición de cada tarjeta es continua, no un salto discreto: en vez
  de un "bucket" entero que dispara una animación completa a la
  siguiente posición fija, cada frame del scroll interpola directamente
  entre las 5 posiciones según el progreso exacto del scroll (ver
  applyContinuousPositions) — el usuario siente que arrastra las
  tarjetas con el propio gesto de scroll, no que dispara una animación
  aparte. Como solo hay 3 proyectos, el índice virtual nunca sale del
  rango [0, 2], así que ninguna tarjeta necesita salir de las 5
  posiciones para volver a entrar por el otro lado — no hace falta el
  truco de teletransporte que tendría un carrusel infinito.

  Al soltar el scroll a medio camino, el snap de ScrollTrigger (ver
  scrollTrigger.snap más abajo) anima la posición de scroll al proyecto
  más cercano — es la única sección del sitio que usa esa opción de
  ScrollTrigger; el resto de los carruseles con pin (ServicesGallery,
  testimonial-carousel, etc.) avanzan por "bucket" discreto y no
  necesitan snap porque no hay posición intermedia que resolver.

  Mismo pin+scroll que el resto — ver ResultsCarousel.astro para la
  versión genérica de /servicios (misma lógica, mismos tamaños de acá
  no aplican ahí, tiene los suyos propios).
*/
const SIDE_VISIBLE_FRACTION = 0.75;
const GAP = 24;
const CENTER_W = 996;
const CENTER_H = 553;
const SIDE_W = 683;
const SIDE_H = 384;

export function initServiceResultsCarousel() {
  const pinTarget = document.querySelector("[data-sresults-pin]");
  const stage = document.querySelector("[data-sresults-stage]");
  const titleBlock = pinTarget?.querySelector("h2");
  const captionsBlock = document.querySelector("[data-sresults-caption]")?.parentElement;
  const cards = document.querySelectorAll("[data-sresults-card]");
  const captions = document.querySelectorAll("[data-sresults-caption]");
  const cursor = document.querySelector("[data-sresults-cursor]");
  if (!pinTarget || !stage || !cards.length) return;

  const count = cards.length;
  const reduced = prefersReducedMotion();

  // Estado continuo: 0 = proyecto0 al centro, 1 = proyecto1 al centro, etc.
  // (equivalente a "qué bucket" en el sistema viejo, pero acá es un float,
  // no un entero — ver applyContinuousPositions).
  let lastVirtualIndex = 0;
  let lastNearestIndex = 0;

  const slotVars = (scale) => {
    const sideW = SIDE_W * scale;
    const sideH = SIDE_H * scale;
    const centerW = CENTER_W * scale;
    const centerH = CENTER_H * scale;
    const visibleSide = sideW * SIDE_VISIBLE_FRACTION;
    const visibleRowWidth = visibleSide * 2 + GAP * 2 + centerW;
    const startVisibleX = (window.innerWidth - visibleRowWidth) / 2;
    const leftX = startVisibleX - (sideW - visibleSide);
    const centerX = leftX + sideW + GAP;
    const rightX = centerX + centerW + GAP;
    return {
      0: { left: leftX - sideW - 40, width: sideW, height: sideH },
      1: { left: leftX, width: sideW, height: sideH },
      2: { left: centerX, width: centerW, height: centerH },
      3: { left: rightX, width: sideW, height: sideH },
      4: { left: rightX + sideW + 40, width: sideW, height: sideH },
    };
  };

  const computeScale = () => {
    // El ancho disponible se mide contra la fila VISIBLE (3/4 de cada
    // costado, no completos) — por eso puede quedar más grande que
    // antes, que forzaba a que los costados enteros entraran.
    const visibleWidthAtScale1 = SIDE_W * SIDE_VISIBLE_FRACTION * 2 + GAP * 2 + CENTER_W;
    const widthScale = window.innerWidth / visibleWidthAtScale1;

    const titleH = titleBlock ? titleBlock.getBoundingClientRect().height : 0;
    const captionsH = captionsBlock ? captionsBlock.getBoundingClientRect().height : 0;
    const reserved = titleH + captionsH + 64 + 40 + 40;
    const availHeight = window.innerHeight - reserved;
    const heightScale = availHeight / CENTER_H;

    return Math.max(0.2, Math.min(1.4, widthScale, heightScale));
  };

  const updateCaption = (activeProject) => {
    captions.forEach((caption, i) => {
      gsap.to(caption, { opacity: i === activeProject ? 1 : 0, duration: 0.4, ease: "power2.out" });
    });
  };

  // Posiciona las 3 tarjetas de forma continua según virtualIndex (float,
  // 0..count-1): cada proyecto i tiene su propio "slot flotante" =
  // (i - virtualIndex) + 2, interpolado entre los 2 slots enteros más
  // cercanos de slotVars. gsap.set (no .to) porque el suavizado ya lo da
  // el scrub del ScrollTrigger al interpolar el progreso cuadro a cuadro.
  const applyContinuousPositions = (virtualIndex, vars) => {
    for (let i = 0; i < count; i++) {
      const slotFloat = Math.max(0, Math.min(4, i - virtualIndex + 2));
      const lo = Math.floor(slotFloat);
      const hi = Math.min(4, lo + 1);
      const t = slotFloat - lo;

      const left = vars[lo].left + (vars[hi].left - vars[lo].left) * t;
      const width = vars[lo].width + (vars[hi].width - vars[lo].width) * t;
      const height = vars[lo].height + (vars[hi].height - vars[lo].height) * t;
      const zIndex = Math.abs(slotFloat - 2) < 0.5 ? 2 : 1;

      gsap.set(cards[i], { left, width, height, top: "50%", yPercent: -50, zIndex });
    }
  };

  // Pintado inicial (o tras un resize): sin animación, directo a la
  // posición que corresponda a virtualIndex (por defecto la actual, no
  // siempre 0 — si se pinta de nuevo a mitad de un scroll no hay que
  // saltar al primer proyecto).
  const paintInitial = (virtualIndex = lastVirtualIndex) => {
    const vars = slotVars(computeScale());
    stage.style.height = `${vars[2].height}px`;
    applyContinuousPositions(virtualIndex, vars);
    const nearest = Math.round(virtualIndex);
    captions.forEach((caption, i) => gsap.set(caption, { opacity: i === nearest ? 1 : 0 }));
  };

  paintInitial();

  // Cursor a medida "Ver proyecto" sobre cualquiera de las 3 tarjetas.
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const quickX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
    const quickY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

    window.addEventListener("mousemove", (e) => {
      quickX(e.clientX);
      quickY(e.clientY);
    });

    cards.forEach((card) => {
      const overlay = card.querySelector("[data-sresults-overlay]");
      card.addEventListener("mouseenter", () => {
        card.classList.add("cursor-none");
        gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
        if (overlay) gsap.to(overlay, { backgroundColor: "rgba(0,0,0,0.35)", duration: 0.3, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        card.classList.remove("cursor-none");
        gsap.to(cursor, { opacity: 0, scale: 0.75, duration: 0.25, ease: "power2.out" });
        if (overlay) gsap.to(overlay, { backgroundColor: "rgba(0,0,0,0)", duration: 0.25, ease: "power2.out" });
      });
    });
  }

  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    // vars se recalcula solo al iniciar y en cada resize (depende del
    // ancho/alto de pantalla, no del scroll) — recalcularlo en cada
    // frame de onUpdate sería trabajo de layout innecesario 60x/seg.
    let vars = slotVars(computeScale());
    const resizeHandler = () => {
      vars = slotVars(computeScale());
      paintInitial(lastVirtualIndex);
    };
    window.addEventListener("resize", resizeHandler);

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "center center",
      end: () => `+=${(count - 1) * 1000}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      snap: {
        snapTo: 1 / (count - 1),
        duration: { min: 0.2, max: 0.5 },
        ease: "power1.inOut",
      },
      onUpdate: (self) => {
        const virtualIndex = self.progress * (count - 1);
        applyContinuousPositions(virtualIndex, vars);
        lastVirtualIndex = virtualIndex;

        const nearest = Math.round(virtualIndex);
        if (nearest !== lastNearestIndex) {
          lastNearestIndex = nearest;
          updateCaption(nearest);
        }
      },
    });

    return () => {
      window.removeEventListener("resize", resizeHandler);
      scrollTrigger.kill();
    };
  });
}
