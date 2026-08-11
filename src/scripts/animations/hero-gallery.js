import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Carrusel vertical infinito: columna izquierda sube sin parar, columna
  derecha baja sin parar — no es un bobbing/yoyo, es scroll continuo.
  Cada columna duplica sus imágenes 2x en el markup (ver Hero.astro);
  medimos la altura real de UN set (la mitad del track) y animamos ese
  recorrido exacto en loop. Como el segundo set es idéntico al primero,
  el salto de vuelta al reiniciar el loop es invisible.

  Hover sobre una imagen puntual: pausa el scroll de toda su columna y
  hace zoom solo a esa imagen; al salir, retoma.
*/
const PX_PER_SECOND = 26;

export function initHeroGallery() {
  if (prefersReducedMotion()) return;

  const viewports = document.querySelectorAll("[data-hero-viewport]");
  if (!viewports.length) return;

  viewports.forEach((viewport) => {
    const track = viewport.querySelector("[data-hero-track]");
    if (!track) return;

    // No usamos scrollHeight/2: con `gap` entre tiles, la mitad del alto
    // total no cae exactamente donde empieza el set duplicado (el gap no
    // se reparte parejo). Medimos directo la posición real del primer
    // tile duplicado — así el loop encastra sin salto, sin importar el gap.
    const tiles = track.children;
    const half = tiles.length / 2;
    if (!half || !tiles[half]) return;
    const setDistance = tiles[half].offsetTop - tiles[0].offsetTop;
    if (!setDistance) return;

    const duration = setDistance / PX_PER_SECOND;
    const isUp = track.dataset.heroCol === "up";

    if (!isUp) {
      gsap.set(track, { y: -setDistance });
    }

    const tween = gsap.to(track, {
      y: isUp ? -setDistance : 0,
      duration,
      ease: "none",
      repeat: -1,
    });

    track.querySelectorAll("[data-hero-image]").forEach((tile) => {
      const media = tile.querySelector("img");
      if (!media) return;

      tile.addEventListener("mouseenter", () => {
        tween.pause();
        gsap.to(media, { scale: 1.06, duration: 0.4, ease: "power2.out" });
      });
      tile.addEventListener("mouseleave", () => {
        tween.play();
        gsap.to(media, { scale: 1, duration: 0.4, ease: "power2.out" });
      });
    });
  });
}
