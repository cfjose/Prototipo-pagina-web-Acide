import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";
import { splitWords, playWordReveal } from "./text-reveal.js";

/*
  Cabecera de /servicios/sitios-web: la sección se fija (pin) en el
  viewport. Al llegar solo se ve el texto, centrado verticalmente en
  la pantalla — nada de imágenes. El scroll (dentro del pin, no la
  página) hace subir el texto a su lugar final y después revela cada
  imagen desde abajo, una por una (grande, mediana, chica) — recién
  ahí se libera hacia la siguiente sección. Todo pasa en el mismo
  espacio, nunca se "sigue" scrolleando hacia una imagen que está más
  abajo en la página — las imágenes ya están ahí, solo ocultas/movidas,
  y el scroll dispara su entrada.

  4 pasos parejos dentro del pin: 0) el texto sube a su lugar, 1) entra
  la imagen grande, 2) la mediana, 3) la chica.

  Solo en desktop — en mobile es un reveal normal sin pin (ver
  ServiceSitiosWebIntro.astro), el scroll-jacking se siente mal en touch.
*/
const STEPS = 4;

export function initServiceIntroReveal() {
  const pinTarget = document.querySelector("[data-intro-pin]");
  const content = document.querySelector("[data-intro-content]");
  const textBlock = document.querySelector("[data-intro-text]");
  const description = document.querySelector("[data-intro-description]");
  const images = document.querySelectorAll("[data-intro-image]");
  if (!pinTarget || !content || !textBlock || !images.length) return;

  const reduced = prefersReducedMotion();

  if (reduced) {
    gsap.set(content, { y: 0 });
    gsap.set(images, { opacity: 1, y: 0 });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    // Estado inicial: imágenes ocultas debajo de su lugar (no afectan el
    // layout, son absolute) y el texto arrancará centrado — se mide su
    // posición en reposo para calcular cuánto hay que bajarlo.
    gsap.set(images, { opacity: 0, y: 60 });
    gsap.set(content, { y: 0 });

    const pinRect = pinTarget.getBoundingClientRect();
    const textRect = textBlock.getBoundingClientRect();
    const textCenterFromTop = textRect.top - pinRect.top + textRect.height / 2;
    const initialOffsetY = window.innerHeight / 2 - textCenterFromTop;

    gsap.set(content, { y: initialOffsetY });

    let wordsPlayed = false;
    const descriptionWords = description ? splitWords(description) : null;

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "top top",
      end: () => `+=${STEPS * 550}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (!wordsPlayed) {
          wordsPlayed = true;
          if (descriptionWords) playWordReveal(descriptionWords, { duration: 0.6, stagger: 0.012 });
        }

        const phase = self.progress * STEPS;

        const settle = Math.min(1, Math.max(0, phase));
        gsap.set(content, { y: initialOffsetY * (1 - settle) });

        images.forEach((img, i) => {
          const t = Math.min(1, Math.max(0, phase - (i + 1)));
          gsap.set(img, { opacity: t, y: 60 * (1 - t) });
        });
      },
    });

    const resizeHandler = () => {
      gsap.set(content, { y: 0 });
      const newPinRect = pinTarget.getBoundingClientRect();
      const newTextRect = textBlock.getBoundingClientRect();
      const newCenter = newTextRect.top - newPinRect.top + newTextRect.height / 2;
      const newOffset = window.innerHeight / 2 - newCenter;
      const currentProgress = scrollTrigger.progress;
      const settle = Math.min(1, Math.max(0, currentProgress * STEPS));
      gsap.set(content, { y: newOffset * (1 - settle) });
    };
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      scrollTrigger.kill();
    };
  });
}
