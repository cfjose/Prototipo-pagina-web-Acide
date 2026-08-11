import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Animación de entrada del hero, una sola vez al cargar:
  1. La línea roja se "dibuja" de izquierda a derecha (scaleX 0 → 1,
     origin-left — más liviano que animar un stroke-dashoffset sobre
     este path, que es un shape con fill, no un trazo).
  2. La descripción aparece lentamente (opacity 0 → 1), superpuesta al
     final del dibujo de la línea para que se sienta como una secuencia,
     no dos animaciones sueltas.
*/
export function initHeroIntro() {
  const underline = document.querySelector("[data-hero-underline]");
  const description = document.querySelector("[data-hero-description]");
  const title = document.querySelector("[data-hero-title]");
  if (!underline && !description) return;

  if (prefersReducedMotion()) {
    if (underline) gsap.set(underline, { scaleX: 1 });
    if (description) gsap.set(description, { opacity: 1 });
    return;
  }

  const tl = gsap.timeline({ delay: 0.2 });

  if (underline) {
    tl.to(underline, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 0);
  }
  if (description) {
    tl.to(description, { opacity: 1, duration: 1.1, ease: "power1.out" }, 0.35);
  }

  // Al pasar el mouse por el título, la línea se vuelve a "dibujar" desde cero.
  if (underline && title) {
    title.addEventListener("mouseenter", () => {
      gsap.fromTo(
        underline,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.7, ease: "power3.inOut", overwrite: true }
      );
    });
  }
}
