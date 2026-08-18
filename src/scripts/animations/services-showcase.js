import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Carrusel infinito: [data-showcase-track] tiene 2 copias idénticas del
  grid una al lado de la otra ([data-showcase-copy] x2). Animamos su
  posición x desde -distancia hasta 0 en loop (ease "none", sin
  aceleración/frenado, para que se sienta como una cinta continua) —
  cuando termina un ciclo, la copia 2 quedó exactamente donde estaba la
  copia 1 al empezar, así que el reinicio de GSAP es invisible.
  "distancia" = ancho real del viewport (medido, no inventado) + el gap
  entre copias, para que el ancho de la copia siempre calce con lo que
  se ve en pantalla sin importar el tamaño real del monitor.

  El hover que apaga el resto del collage mientras resalta la tarjeta
  bajo el mouse es el mismo patrón que ya usábamos acá (antes con Ken
  Burns) y en historias de clientes — corre igual, independiente de si
  el carrusel está animando o no.
*/
const DIM_OPACITY = 0.25;
const PX_PER_SECOND = 45;
const COPY_GAP = 12;

export function initServicesShowcase() {
  const showcase = document.querySelector("[data-showcase]");
  if (!showcase) return;

  const viewport = showcase.querySelector("[data-showcase-viewport]");
  const track = showcase.querySelector("[data-showcase-track]");
  const copies = showcase.querySelectorAll("[data-showcase-copy]");
  const tiles = showcase.querySelectorAll("[data-showcase-tile]");
  const title = showcase.querySelector("[data-type-heading]");
  const gapRows = showcase.querySelectorAll("[data-showcase-gap-row]");
  if (!viewport || !track || copies.length < 2 || !tiles.length) return;

  const reduced = prefersReducedMotion();
  let marqueeTween = null;

  // La fila vacía del medio (data-showcase-gap-row) tiene que medir AL
  // MENOS lo que mide el texto+padding real (title es position:absolute,
  // así que medirlo no depende del propio grid — sin ciclo). Separado de
  // measure() porque el alto del texto no solo cambia con el resize: el
  // título se TIPEA letra por letra (text-type.js) y mientras tipea
  // puede pasar por un estado de una sola línea antes de completar las
  // dos — medir solo una vez al cargar (o solo en resize) deja la fila
  // con el alto de un momento intermedio, más chico que el final, y las
  // fotos vecinas terminan tapadas igual (bug reportado que persistía).
  // Un ResizeObserver reacciona a CUALQUIER cambio real de tamaño del
  // texto, tipeo incluido, sin importar la causa.
  const applyGapHeight = () => {
    if (!title || !gapRows.length) return;
    const gapHeight = Math.ceil(title.getBoundingClientRect().height);
    gapRows.forEach((row) => {
      row.style.height = `${gapHeight}px`;
    });
  };

  if (title && gapRows.length && "ResizeObserver" in window) {
    new ResizeObserver(applyGapHeight).observe(title);
  }

  const measure = () => {
    const width = viewport.getBoundingClientRect().width;
    copies.forEach((copy) => {
      copy.style.width = `${width}px`;
    });

    applyGapHeight();

    if (marqueeTween) marqueeTween.kill();
    if (reduced) {
      gsap.set(track, { x: 0 });
      return;
    }

    const distance = width + COPY_GAP;
    gsap.set(track, { x: -distance });
    marqueeTween = gsap.to(track, {
      x: 0,
      duration: distance / PX_PER_SECOND,
      ease: "none",
      repeat: -1,
    });
  };

  measure();
  window.addEventListener("resize", measure);

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
