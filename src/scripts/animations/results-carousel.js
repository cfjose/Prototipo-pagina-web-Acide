import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Carrusel de resultados: 3 tarjetas en fila (chica-grande-chica) con
  SIEMPRE 24px de separación entre ellas, sin importar el tamaño. El
  tamaño de referencia es el del Figma (centro 1184x664, costados
  683x384) — si esos tamaños completos no entran en el viewport
  (ancho o alto disponible), se escalan hacia abajo parejo hasta el
  máximo que sí entra, pero el gap de 24px nunca se toca, es fijo.

  El "activo" siempre ocupa el centro-grande; el anterior y el
  siguiente (módulo 3) ocupan los costados-chicos. Igual que Servicios:
  la sección se fija (pin) en el viewport y el scroll hace avanzar el
  índice activo, con un zoom suave entre tamaños en vez de un corte.

  Solo en desktop — en mobile es una franja con scroll-snap nativo
  (ver ResultsCarousel.astro), nada de esto corre ahí.
*/
const GAP = 24;
const CENTER_W = 1184;
const CENTER_H = 664;
const SIDE_W = 683;
const SIDE_H = 384;

export function initResultsCarousel() {
  const pinTarget = document.querySelector("[data-results-pin]");
  const stage = document.querySelector("[data-results-stage]");
  const titleBlock = pinTarget?.querySelector("h2");
  const captionsBlock = document.querySelector("[data-results-caption]")?.parentElement;
  const cards = document.querySelectorAll("[data-results-card]");
  const captions = document.querySelectorAll("[data-results-caption]");
  const cursor = document.querySelector("[data-results-cursor]");
  if (!pinTarget || !stage || !cards.length) return;

  const count = cards.length;
  const reduced = prefersReducedMotion();
  let current = 1; // TechGroup, tal cual está centrado por default en el Figma.

  // Escala máxima que hace entrar la fila completa (2 chicas + 1
  // grande + 2 gaps de 24px fijos) en el ancho de pantalla, Y la
  // tarjeta grande (la más alta) en el alto disponible del pin.
  const computeScale = () => {
    const availWidth = window.innerWidth - 48; // margen de seguridad a los bordes
    const widthScale = (availWidth - GAP * 2) / (SIDE_W * 2 + CENTER_W);

    const titleH = titleBlock ? titleBlock.getBoundingClientRect().height : 0;
    const captionsH = captionsBlock ? captionsBlock.getBoundingClientRect().height : 0;
    // 64px (mt-16 antes del stage) + 40px (mt-10 antes de las captions) + 40px de aire.
    const reserved = titleH + captionsH + 64 + 40 + 40;
    const availHeight = window.innerHeight - reserved;
    const heightScale = availHeight / CENTER_H;

    return Math.max(0.2, Math.min(1, widthScale, heightScale));
  };

  const slotFor = (index, activeIndex) => {
    if (index === activeIndex) return "center";
    const before = (activeIndex - 1 + count) % count;
    return index === before ? "left" : "right";
  };

  const layout = (animate) => {
    const scale = computeScale();
    const sideW = SIDE_W * scale;
    const sideH = SIDE_H * scale;
    const centerW = CENTER_W * scale;
    const centerH = CENTER_H * scale;
    const rowWidth = sideW + GAP + centerW + GAP + sideW;
    const startX = (stage.getBoundingClientRect().width - rowWidth) / 2;

    stage.style.height = `${centerH}px`;

    const xFor = {
      left: startX,
      center: startX + sideW + GAP,
      right: startX + sideW + GAP + centerW + GAP,
    };

    cards.forEach((card, i) => {
      const slot = slotFor(i, current);
      const isCenter = slot === "center";
      const vars = {
        width: isCenter ? centerW : sideW,
        height: isCenter ? centerH : sideH,
        top: "50%",
        yPercent: -50,
        left: xFor[slot],
        zIndex: isCenter ? 2 : 1,
      };
      if (!animate || reduced) {
        gsap.set(card, vars);
        return;
      }
      gsap.to(card, { ...vars, duration: 0.7, ease: "power2.inOut" });
    });
  };

  const goTo = (index) => {
    if (index === current) return;
    current = index;
    layout(true);

    captions.forEach((caption, i) => {
      gsap.to(caption, { opacity: i === index ? 1 : 0, duration: 0.4, ease: "power2.out" });
    });
  };

  // Pintado inicial sin animación (ya nace en su lugar).
  layout(false);
  captions.forEach((caption, i) => gsap.set(caption, { opacity: i === current ? 1 : 0 }));

  // Cursor a medida "Ver proyecto" sobre cualquiera de las 3 tarjetas.
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const quickX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
    const quickY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

    window.addEventListener("mousemove", (e) => {
      quickX(e.clientX);
      quickY(e.clientY);
    });

    cards.forEach((card) => {
      const overlay = card.querySelector("[data-results-overlay]");
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
    const resizeHandler = () => layout(false);
    window.addEventListener("resize", resizeHandler);

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "center center",
      end: () => `+=${(count - 1) * 1000}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        // Arranca en TechGroup (índice 1), avanza al resto en orden.
        const sequence = [1, 2, 0];
        const bucket = Math.min(count - 1, Math.floor(self.progress * count));
        goTo(sequence[bucket]);
      },
    });

    return () => {
      window.removeEventListener("resize", resizeHandler);
      scrollTrigger.kill();
    };
  });
}
