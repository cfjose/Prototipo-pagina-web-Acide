import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Recreación del efecto "Vercel Snap Text" — ver CaseStudySnapText.astro
  para la spec exacta (tomada de la doc real del componente pago, no de
  una suposición): mismo tamaño de fuente para todos los ítems, opacity
  = 1 - dist × 0.82 (mínimo 0.15), el activo en la línea del prefijo, y
  el AVANCE ES DISCRETO — cada "paso" de scroll pasa directo al
  siguiente ítem (como scroll-snap nativo), no arrastra la posición
  pixel a pixel. Acá el paso discreto se logra con un patrón de
  "bucket" (igual que results-carousel.js): el scroll solo dispara un
  goTo() cuando cruza el umbral del siguiente ítem, y ESE goTo() es una
  animación con resorte (GSAP, back.out) para el efecto "spring" suave
  entre un paso y el otro.

  El viewport mide 350px (5 filas de 70px) y está centrado en la misma
  fila que el prefijo (ambos usan `items-center` en el flex padre). El
  track se traslada en Y para que el CENTRO de la fila activa caiga
  justo en el centro del viewport — de ahí sale la fórmula en
  trackOffset.
*/
const ROW_HEIGHT = 70;
const VIEWPORT_HEIGHT = 350;

export function initCaseStudySnapText() {
  const pinTarget = document.querySelector("[data-snaptext-pin]");
  const track = document.querySelector("[data-snaptext-track]");
  const items = document.querySelectorAll("[data-snaptext-item]");
  if (!pinTarget || !track || !items.length) return;

  const count = items.length;
  const reduced = prefersReducedMotion();

  const trackOffset = (active) => VIEWPORT_HEIGHT / 2 - ROW_HEIGHT / 2 - active * ROW_HEIGHT;

  const goTo = (active, animate) => {
    const texts = [...items].map((item) => item.querySelector("[data-snaptext-text]"));
    texts.forEach((text, i) => {
      const dist = Math.abs(i - active);
      const opacity = Math.max(0.15, 1 - dist * 0.82);
      if (animate) gsap.to(text, { opacity, duration: 0.5, ease: "power2.out" });
      else gsap.set(text, { opacity });
    });

    if (animate) gsap.to(track, { y: trackOffset(active), duration: 0.6, ease: "back.out(1.4)" });
    else gsap.set(track, { y: trackOffset(active) });
  };

  goTo(0, false); // arranca en "el diseño UX/UI", el primero — sin nada arriba

  if (reduced) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    let currentActive = 0;

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "top top",
      end: () => `+=${(count - 1) * 600}`,
      pin: true,
      onUpdate: (self) => {
        const target = Math.round(self.progress * (count - 1));
        if (target !== currentActive) {
          currentActive = target;
          goTo(currentActive, true);
        }
      },
    });

    return () => {
      scrollTrigger.kill();
    };
  });
}
