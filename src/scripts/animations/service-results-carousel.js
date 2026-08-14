import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Slider real, no un zoom in-place: 5 posiciones a lo largo de la
  pantalla (0=fuera por la izquierda, 1=costado izquierdo, 2=centro,
  3=costado derecho, 4=fuera por la derecha). Al avanzar, el proyecto
  del costado izquierdo (1) sale por el borde izquierdo (1→0) y
  automáticamente "teletransporta" al otro lado (0→4, instantáneo, no
  se ve porque las dos posiciones están fuera de pantalla) para volver
  a entrar por la derecha (4→3) — así nunca cruza por detrás de los
  otros dos, que solo se corren un lugar (2→1, 3→2). Retroceder hace lo
  mismo espejado. Tamaños: centro 996x553, costados 683x384, gap 24px
  fijo (igual criterio de escalado que antes si no entra en pantalla).

  Los costados (1 y 3) no entran completos: se recortan contra el
  borde de la pantalla, mostrando 3/4 de la imagen y dejando 1/4 fuera
  (cortado por el overflow-hidden de la sección) — por eso el ancho
  disponible para escalar se calcula contra el ancho VISIBLE de la fila
  (3/4 de cada costado, no el costado completo), lo que además permite
  una escala más grande que antes sin que dejen de entrar en pantalla.

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

  // slotAssignment[slot] = índice del proyecto que ocupa ese costado/centro.
  // Arranca [0,1,2]: proyecto0 a la izquierda, proyecto1 (TechGroup) al
  // centro, proyecto2 a la derecha — igual que el Figma por default.
  let slotAssignment = [0, 1, 2];

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

  const updateCaption = () => {
    const activeProject = slotAssignment[1];
    captions.forEach((caption, i) => {
      gsap.to(caption, { opacity: i === activeProject ? 1 : 0, duration: 0.4, ease: "power2.out" });
    });
  };

  // Pintado inicial sin animación: cada proyecto directo a su slot.
  const paintInitial = () => {
    const vars = slotVars(computeScale());
    stage.style.height = `${vars[2].height}px`;
    slotAssignment.forEach((projectIndex, slot) => {
      gsap.set(cards[projectIndex], { ...vars[slot + 1], top: "50%", yPercent: -50, zIndex: slot === 1 ? 2 : 1 });
    });
    captions.forEach((caption, i) => gsap.set(caption, { opacity: i === slotAssignment[1] ? 1 : 0 }));
  };

  const moveTo = (card, target, vars, duration = 0.7) => {
    if (reduced) {
      gsap.set(card, { ...vars[target], zIndex: target === 2 ? 2 : 1 });
      return;
    }
    gsap.to(card, { ...vars[target], zIndex: target === 2 ? 2 : 1, duration, ease: "power2.inOut" });
  };

  const wrapAround = (card, exitSlot, enterSlot, vars) => {
    if (reduced) {
      gsap.set(card, { ...vars[enterSlot], zIndex: 1 });
      return;
    }
    gsap
      .timeline()
      .to(card, { ...vars[exitSlot], zIndex: 1, duration: 0.4, ease: "power2.in" })
      .set(card, { ...vars[exitSlot === 0 ? 4 : 0] })
      .to(card, { ...vars[enterSlot], zIndex: 1, duration: 0.4, ease: "power2.out" });
  };

  const next = () => {
    const scale = computeScale();
    const vars = slotVars(scale);
    stage.style.height = `${vars[2].height}px`;

    const [leftProject, centerProject, rightProject] = slotAssignment;
    moveTo(cards[centerProject], 1, vars);
    moveTo(cards[rightProject], 2, vars);
    wrapAround(cards[leftProject], 0, 3, vars);

    slotAssignment = [centerProject, rightProject, leftProject];
    updateCaption();
  };

  const prev = () => {
    const scale = computeScale();
    const vars = slotVars(scale);
    stage.style.height = `${vars[2].height}px`;

    const [leftProject, centerProject, rightProject] = slotAssignment;
    moveTo(cards[centerProject], 3, vars);
    moveTo(cards[leftProject], 2, vars);
    wrapAround(cards[rightProject], 4, 1, vars);

    slotAssignment = [rightProject, leftProject, centerProject];
    updateCaption();
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
    const resizeHandler = () => paintInitial();
    window.addEventListener("resize", resizeHandler);

    let currentBucket = 0;

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "center center",
      end: () => `+=${(count - 1) * 1000}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        const bucket = Math.min(count - 1, Math.floor(self.progress * count));
        while (bucket > currentBucket) {
          next();
          currentBucket += 1;
        }
        while (bucket < currentBucket) {
          prev();
          currentBucket -= 1;
        }
      },
    });

    return () => {
      window.removeEventListener("resize", resizeHandler);
      scrollTrigger.kill();
    };
  });
}
