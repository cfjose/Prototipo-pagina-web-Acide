import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Sección de pantalla completa, fondo navy: al llegar solo se ve la
  primera imagen (Investigación) con su texto. El scroll (dentro del
  pin, la sección no se mueve) va revelando el resto de a una — cada
  imagen nueva entra desde abajo y se apila arriba de las anteriores,
  en su propio ángulo fijo. Si el usuario scrollea hacia atrás, la
  última imagen revelada vuelve a bajar y desaparecer (reversible en
  los dos sentidos, no solo se acumula hacia adelante). El texto se
  reemplaza igual — solo el del paso actual está visible, con el mismo
  blur/fade/slide que usamos en Servicios.

  Solo en desktop — en mobile es una lista vertical normal sin pin (ver
  ServiceProcess.astro), el scroll-jacking se siente mal en touch.
*/
const REST_TRANSFORMS = [
  { rotate: -7, x: -18, y: 10 },
  { rotate: 5, x: 14, y: -8 },
  { rotate: -4, x: 10, y: 14 },
  { rotate: 8, x: -12, y: -6 },
];

export function initServiceProcess() {
  const pinTarget = document.querySelector("[data-process-pin]");
  const textItems = document.querySelectorAll("[data-process-text-item]");
  const mediaItems = document.querySelectorAll("[data-process-media-item]");
  if (!pinTarget || !textItems.length || !mediaItems.length) return;

  const count = mediaItems.length;
  const reduced = prefersReducedMotion();
  let currentText = 0;
  const revealed = mediaItems.length ? [true, ...Array(count - 1).fill(false)] : []; // la primera nace visible

  const restFor = (i) => REST_TRANSFORMS[i % REST_TRANSFORMS.length];

  // Estado inicial: solo la imagen 0 en su lugar (revelada), el resto
  // esperando debajo, listas para entrar cuando les toque.
  mediaItems.forEach((media, i) => {
    const rest = restFor(i);
    if (i === 0) {
      gsap.set(media, { rotate: rest.rotate, x: rest.x, y: rest.y, opacity: 1, zIndex: i + 1 });
    } else {
      gsap.set(media, { rotate: rest.rotate, x: rest.x, y: rest.y + 120, opacity: 0, zIndex: i + 1 });
    }
  });
  gsap.set(textItems, { opacity: (i) => (i === 0 ? 1 : 0), zIndex: (i) => (i === 0 ? 2 : 1) });

  const revealImage = (i) => {
    const media = mediaItems[i];
    const rest = restFor(i);
    gsap.killTweensOf(media);
    if (reduced) {
      gsap.set(media, { opacity: 1, x: rest.x, y: rest.y, rotate: rest.rotate });
      return;
    }
    gsap.to(media, { opacity: 1, x: rest.x, y: rest.y, rotate: rest.rotate, duration: 0.7, ease: "power2.out" });
  };

  const hideImage = (i) => {
    const media = mediaItems[i];
    const rest = restFor(i);
    gsap.killTweensOf(media);
    if (reduced) {
      gsap.set(media, { opacity: 0, y: rest.y + 120 });
      return;
    }
    gsap.to(media, { opacity: 0, y: rest.y + 120, duration: 0.5, ease: "power2.in" });
  };

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
    mediaItems.forEach((_, i) => revealImage(i));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    const STEPS = count - 1;

    const scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "top top",
      end: () => `+=${STEPS * 600}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        const phase = self.progress * STEPS;

        // El texto avanza por paso (0..count-1) — mismo umbral que las
        // imágenes (floor, no round) para que cambien juntos: antes el
        // texto saltaba en la mitad del paso y la imagen recién al
        // final, medio paso desincronizados.
        const textIndex = Math.min(count - 1, Math.floor(phase + 0.001));
        goToText(textIndex);

        // Cada imagen 1..count-1 tiene su propio umbral de scroll — si
        // el scroll ya lo pasó debe estar revelada, si no, oculta.
        // Se recalcula siempre en los dos sentidos (no solo hacia
        // adelante), así al volver hacia arriba las imágenes bajan de
        // nuevo en el mismo orden en que aparecieron.
        for (let i = 1; i < count; i++) {
          const shouldBeRevealed = phase >= i - 0.001;
          if (shouldBeRevealed && !revealed[i]) {
            revealImage(i);
            revealed[i] = true;
          } else if (!shouldBeRevealed && revealed[i]) {
            hideImage(i);
            revealed[i] = false;
          }
        }
      },
    });

    return () => {
      scrollTrigger.kill();
    };
  });
}
