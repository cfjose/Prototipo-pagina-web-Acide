import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  No tenemos herramienta de generación de video, así que estas imágenes
  "actúan" como video con un loop lento de zoom/pan (Ken Burns) por
  imagen — no es video real, es la imagen estática animada con GSAP,
  con un delay/duración distinto por tile para que no se muevan todas
  en sincro. Al pasar el mouse por una, esa se agranda un poco (además
  del Ken Burns, que sigue corriendo) y el resto del collage baja su
  opacidad — mismo patrón de "una en foco, el resto se apaga" que
  usamos en historias de clientes.
*/
const DIM_OPACITY = 0.25;

export function initServicesShowcase() {
  const showcase = document.querySelector("[data-showcase]");
  if (!showcase) return;

  const tiles = showcase.querySelectorAll("[data-showcase-tile]");
  if (!tiles.length) return;

  const reduced = prefersReducedMotion();

  tiles.forEach((tile, i) => {
    const media = tile.querySelector("[data-showcase-media]");
    if (!media) return;

    if (!reduced) {
      gsap.to(media, {
        scale: 1.12,
        xPercent: i % 2 === 0 ? 3 : -3,
        yPercent: i % 3 === 0 ? -3 : 3,
        duration: 9 + (i % 4) * 2,
        delay: i * 0.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }

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
