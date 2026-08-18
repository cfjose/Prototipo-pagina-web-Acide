import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Dos carruseles infinitos independientes (arriba/abajo del título) —
  arriba se mueve hacia la derecha, abajo hacia la izquierda. Mismo
  truco de "marquee" en ambas: 2 copias idénticas una al lado de la
  otra, el tween anima x entre 0 y -distancia (o al revés, según la
  dirección) en loop; como las copias son iguales, el reinicio es
  invisible.

  El título sigue alineado con JS igual que en la versión de un solo
  grid (no se puede resolver solo con CSS): data-showcase-gap-row es
  una fila real entre ambas pistas, y su alto se saca del alto real
  del texto — el texto se TIPEA letra por letra (text-type.js) y
  mientras tipea puede pasar por un estado de una sola línea antes de
  completar las dos, así que un ResizeObserver reacciona a cualquier
  cambio real de tamaño del texto, tipeo incluido.

  IGUALAR EL ALTO NO ALCANZA: el título arranca con un top fijo en %
  (pensado como fallback), así que si el alto de la fila vacía cambia,
  el título y la fila dejan de coincidir en POSICIÓN aunque midan lo
  mismo. Por eso acá también se mueve el título (top en px, no %) para
  que su borde superior calce exacto con el de la fila vacía.

  El hover que apaga el resto del collage mientras resalta la tarjeta
  bajo el mouse es el mismo patrón de siempre — corre sobre TODAS las
  tarjetas de las dos pistas por igual.
*/
const DIM_OPACITY = 0.25;
const PX_PER_SECOND = 45;
const COPY_GAP = 12;

const setupTrack = (showcase, { viewportSel, trackSel, copySel, direction, reduced }) => {
  const viewport = showcase.querySelector(viewportSel);
  const track = showcase.querySelector(trackSel);
  const copies = showcase.querySelectorAll(copySel);
  if (!viewport || !track || copies.length < 2) return;

  let tween = null;

  const measure = () => {
    const width = viewport.getBoundingClientRect().width;
    copies.forEach((copy) => {
      copy.style.width = `${width}px`;
    });

    if (tween) tween.kill();
    const distance = width + COPY_GAP;

    if (reduced) {
      gsap.set(track, { x: 0 });
      return;
    }

    // direction "right": arranca tapado a la izquierda (-distancia) y
    // entra hacia 0 → el contenido avanza hacia la derecha.
    // direction "left": arranca en 0 y sale hacia -distancia → el
    // contenido avanza hacia la izquierda. Mismo mecanismo, sentido
    // opuesto.
    const from = direction === "right" ? -distance : 0;
    const to = direction === "right" ? 0 : -distance;
    gsap.set(track, { x: from });
    tween = gsap.to(track, {
      x: to,
      duration: distance / PX_PER_SECOND,
      ease: "none",
      repeat: -1,
    });
  };

  measure();
  window.addEventListener("resize", measure);
};

export function initServicesShowcase() {
  const showcase = document.querySelector("[data-showcase]");
  if (!showcase) return;

  const tiles = showcase.querySelectorAll("[data-showcase-tile]");
  if (!tiles.length) return;

  const title = showcase.querySelector("[data-type-heading]");
  const gapRow = showcase.querySelector("[data-showcase-gap-row]");
  const reduced = prefersReducedMotion();

  const applyGapHeight = () => {
    if (!title || !gapRow) return;
    const gapHeight = Math.ceil(title.getBoundingClientRect().height);
    gapRow.style.height = `${gapHeight}px`;

    const showcaseRect = showcase.getBoundingClientRect();
    const gapRect = gapRow.getBoundingClientRect();
    title.style.top = `${gapRect.top - showcaseRect.top}px`;
  };

  if (title && gapRow && "ResizeObserver" in window) {
    new ResizeObserver(applyGapHeight).observe(title);
  }
  applyGapHeight();
  window.addEventListener("resize", applyGapHeight);

  setupTrack(showcase, {
    viewportSel: "[data-showcase-viewport-top]",
    trackSel: "[data-showcase-track-top]",
    copySel: "[data-showcase-copy-top]",
    direction: "right",
    reduced,
  });
  setupTrack(showcase, {
    viewportSel: "[data-showcase-viewport-bottom]",
    trackSel: "[data-showcase-track-bottom]",
    copySel: "[data-showcase-copy-bottom]",
    direction: "left",
    reduced,
  });

  tiles.forEach((tile) => {
    const media = tile.querySelector("[data-showcase-media]");
    if (!media) return;

    tile.addEventListener("mouseenter", () => {
      tiles.forEach((other) => {
        gsap.to(other, { opacity: other === tile ? 1 : DIM_OPACITY, duration: 0.4, ease: "power2.out" });
      });
      gsap.to(tile, { scale: 1.04, zIndex: 2, duration: 0.4, ease: "power2.out" });
    });

    tile.addEventListener("mouseleave", () => {
      tiles.forEach((other) => {
        gsap.to(other, { opacity: 1, duration: 0.4, ease: "power2.out" });
      });
      gsap.to(tile, { scale: 1, zIndex: 1, duration: 0.4, ease: "power2.out" });
    });
  });
}
