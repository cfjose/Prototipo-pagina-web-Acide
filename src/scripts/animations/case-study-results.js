import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Mismo patrón que results-carousel.js (Home) — centro grande + dos
  costados asomando por el borde de pantalla, el que entra crece con
  zoom, el que sale se achica y "teletransporta" al otro lado — pero
  generalizado a 4 tarjetas en vez de 3 (acá SÍ hay una 4ta tarjeta
  "esperando" fuera de pantalla, no son siempre las mismas 3 dando
  vueltas).

  Atributos con prefijo "case-" (data-case-results-*) A PROPÓSITO —
  ResultsCarousel.astro (Home) usa data-results-* y initResultsCarousel()
  corre en TODAS las páginas vía main.js. Usar los mismos nombres acá
  hacía que document.querySelector agarrara estos mismos elementos
  desde LOS DOS scripts a la vez, pineándolos por separado (duración de
  scroll duplicada — 6000px en vez de 3000 — y la sección tapando/
  superponiéndose con el resto de la página). NO volver a usar
  data-results-* sin prefijo acá.

  Estado: `order` es un array de 4 índices [left, center, right,
  waiting] — el que espera está parqueado invisible en el slot 4 (afuera
  a la derecha), listo para entrar. Al avanzar, todo el array rota una
  posición: left sale (slot1→slot0) y se teletransporta a esperar del
  otro lado (slot4); center pasa a left; right pasa a center; waiting
  entra y pasa a right. Retroceder hace lo mismo espejado.

  A diferencia de Home, el título+descripción van DENTRO de cada
  tarjeta (no en una leyenda aparte) y solo se muestran en la que está
  al centro — ver [data-case-results-caption] / [data-case-results-gradient].
*/
const SIDE_VISIBLE_FRACTION = 0.75;
const GAP = 24;
const CENTER_W = 1184;
const CENTER_H = 664;
const SIDE_W = 683;
const SIDE_H = 384;

export function initCaseStudyResults() {
  const pinTarget = document.querySelector("[data-case-results-pin]");
  const stage = document.querySelector("[data-case-results-stage]");
  const titleBlock = pinTarget?.querySelector("h2");
  const cards = document.querySelectorAll("[data-case-results-card]");
  if (!pinTarget || !stage || !cards.length) return;

  const count = cards.length;
  const reduced = prefersReducedMotion();

  // order[0]=left, order[1]=center, order[2]=right, order[3]=esperando (fuera, slot4)
  let order = cards.length === 4 ? [0, 1, 2, 3] : [...Array(count).keys()];

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
    const visibleWidthAtScale1 = SIDE_W * SIDE_VISIBLE_FRACTION * 2 + GAP * 2 + CENTER_W;
    const widthScale = window.innerWidth / visibleWidthAtScale1;

    const titleH = titleBlock ? titleBlock.getBoundingClientRect().height : 0;
    const reserved = titleH + 64 + 40;
    const availHeight = window.innerHeight - reserved;
    const heightScale = availHeight / CENTER_H;

    return Math.max(0.2, Math.min(1.3, widthScale, heightScale));
  };

  const captionFor = (card) => card.querySelector("[data-case-results-caption]");
  const gradientFor = (card) => card.querySelector("[data-case-results-gradient]");

  const updateCaption = (animate) => {
    const centerProject = order[1];
    cards.forEach((card, i) => {
      const isCenter = i === centerProject;
      const vars = { opacity: isCenter ? 1 : 0, duration: 0.4, ease: "power2.out" };
      if (animate) {
        gsap.to(captionFor(card), vars);
        gsap.to(gradientFor(card), vars);
      } else {
        gsap.set(captionFor(card), { opacity: isCenter ? 1 : 0 });
        gsap.set(gradientFor(card), { opacity: isCenter ? 1 : 0 });
      }
    });
  };

  // Pintado inicial sin animación: cada tarjeta directo a su slot (left/center/right/waiting).
  const paintInitial = () => {
    const vars = slotVars(computeScale());
    stage.style.height = `${vars[2].height}px`;
    order.forEach((projectIndex, slot) => {
      gsap.set(cards[projectIndex], { ...vars[slot + 1], top: "50%", yPercent: -50, zIndex: slot === 1 ? 2 : 1 });
    });
    updateCaption(false);
  };

  const moveTo = (card, target, vars, duration = 0.7) => {
    if (reduced) {
      gsap.set(card, { ...vars[target], zIndex: target === 2 ? 2 : 1 });
      return;
    }
    gsap.to(card, { ...vars[target], zIndex: target === 2 ? 2 : 1, duration, ease: "power2.inOut" });
  };

  // La que sale por un lado se teletransporta (invisible, fuera de pantalla) al slot de espera del otro lado.
  const exitAndWait = (card, exitSlot, waitSlot, vars) => {
    if (reduced) {
      gsap.set(card, { ...vars[waitSlot], zIndex: 1 });
      return;
    }
    gsap
      .timeline()
      .to(card, { ...vars[exitSlot], zIndex: 1, duration: 0.4, ease: "power2.in" })
      .set(card, { ...vars[waitSlot] });
  };

  const next = () => {
    const scale = computeScale();
    const vars = slotVars(scale);
    stage.style.height = `${vars[2].height}px`;

    const [leftProject, centerProject, rightProject, waitingProject] = order;
    moveTo(cards[centerProject], 1, vars);
    moveTo(cards[rightProject], 2, vars);
    moveTo(cards[waitingProject], 3, vars);
    exitAndWait(cards[leftProject], 0, 4, vars);

    order = [centerProject, rightProject, waitingProject, leftProject];
    updateCaption(true);
  };

  const prev = () => {
    const scale = computeScale();
    const vars = slotVars(scale);
    stage.style.height = `${vars[2].height}px`;

    const [leftProject, centerProject, rightProject, waitingProject] = order;
    moveTo(cards[leftProject], 2, vars);
    moveTo(cards[centerProject], 3, vars);
    // La derecha sale hacia afuera y pasa a ser la nueva "esperando" (mismo slot4 que usa next()).
    moveTo(cards[rightProject], 4, vars);
    // La que esperaba (parqueada invisible en el slot4) se teletransporta al slot0 y entra como nueva izquierda.
    gsap.set(cards[waitingProject], { ...vars[0] });
    if (reduced) {
      gsap.set(cards[waitingProject], { ...vars[1], zIndex: 1 });
    } else {
      gsap.to(cards[waitingProject], { ...vars[1], zIndex: 1, duration: 0.7, ease: "power2.inOut" });
    }

    order = [waitingProject, leftProject, centerProject, rightProject];
    updateCaption(true);
  };

  paintInitial();

  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    const resizeHandler = () => paintInitial();
    window.addEventListener("resize", resizeHandler);

    let currentBucket = 0;

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "top top",
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
