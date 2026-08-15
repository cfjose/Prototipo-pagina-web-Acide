import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Sección de pantalla completa, fondo navy: las 4 imágenes están
  SIEMPRE en opacidad 100% (nunca invisibles/con fundido, nunca con
  fundido de entrada) — la que todavía no le toca su turno queda
  completamente fuera de vista (nada asoma) y aparece recién cuando el
  scroll la trae, subiendo desde abajo del stack hasta su lugar, atada
  directamente al scroll (scrub continuo, no una animación de duración
  fija) — igual que las cartas de referencia que pasó el cliente. Cada
  imagen (incluida la primera) tiene su propio tramo de scroll para
  subir; una vez arriba queda apilada sobre las anteriores, no se
  reemplaza. Es reversible: si el usuario scrollea hacia atrás, vuelve
  a bajar y esconderse en el mismo tramo en que subió.

  El texto sí se reemplaza (no se apila): solo el del paso actual está
  visible, con blur/fade/slide — eso incluye el primero, que ahora
  también entra con esa animación en vez de aparecer de una.

  Solo en desktop — en mobile es una lista vertical normal sin pin (ver
  ServiceProcess.astro), el scroll-jacking se siente mal en touch.
*/
const REST_TRANSFORMS = [
  { rotate: -7, x: -14, y: 8 },
  { rotate: 5, x: 11, y: -6 },
  { rotate: -4, x: 8, y: 11 },
  { rotate: 8, x: -9, y: -5 },
];

const RISE_OFFSET = 700; // más que el alto del stack (620px) — arranca totalmente fuera de vista

export function initServiceProcess() {
  const pinTarget = document.querySelector("[data-process-pin]");
  const textItems = document.querySelectorAll("[data-process-text-item]");
  const mediaItems = document.querySelectorAll("[data-process-media-item]");
  if (!pinTarget || !textItems.length || !mediaItems.length) return;

  const count = mediaItems.length;
  const reduced = prefersReducedMotion();
  let currentText = -1;

  const restFor = (i) => REST_TRANSFORMS[i % REST_TRANSFORMS.length];

  // Y de la imagen i según la fase global de scroll (0..count):
  // - ya le tocó y terminó de subir (phase >= i+1): asentada en su lugar.
  // - le toca ahora (i <= phase < i+1): sube desde fuera de vista a asentada.
  // - todavía no le toca: completamente escondida, nada asoma.
  const yFor = (i, phase) => {
    const rest = restFor(i);
    if (phase >= i + 1) return rest.y;
    if (phase >= i) return rest.y + RISE_OFFSET * (1 - (phase - i));
    return rest.y + RISE_OFFSET;
  };

  // Estado inicial: todas las imágenes visibles (opacidad 100%), cada
  // una en su Y correspondiente a fase 0.
  mediaItems.forEach((media, i) => {
    const rest = restFor(i);
    gsap.set(media, { rotate: rest.rotate, x: rest.x, y: yFor(i, 0), opacity: 1, zIndex: i + 1 });
  });
  gsap.set(textItems, { opacity: 0, zIndex: 1 });

  const goToText = (index) => {
    if (index === currentText) return;
    currentText = index;

    textItems.forEach((item, i) => {
      gsap.killTweensOf(item);
      if (reduced) {
        gsap.set(item, { opacity: i === index ? 1 : 0 });
        return;
      }
      if (i === index) {
        gsap.set(item, { zIndex: 2 });
        gsap.fromTo(
          item,
          { opacity: 0, y: 24, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power2.out" },
        );
      } else {
        gsap.to(item, { opacity: 0, duration: 0.35, ease: "power2.out", zIndex: 1 });
      }
    });
  };

  if (reduced) {
    mediaItems.forEach((media, i) => gsap.set(media, { y: restFor(i).y }));
    goToText(0);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    const STEPS = count;

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "top top",
      end: () => `+=${STEPS * 600}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onEnter: () => goToText(0),
      onEnterBack: () => goToText(0),
      onUpdate: (self) => {
        const phase = self.progress * STEPS;

        const textIndex = Math.min(count - 1, Math.floor(phase + 0.001));
        goToText(textIndex);

        mediaItems.forEach((media, i) => {
          gsap.set(media, { y: yFor(i, phase) });
        });
      },
    });

    return () => {
      scrollTrigger.kill();
    };
  });
}
