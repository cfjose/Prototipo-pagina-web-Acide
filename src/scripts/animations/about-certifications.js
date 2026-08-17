import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Adaptado de case-study-solution.js — mismo mecanismo exacto (fotos
  siempre en opacidad 100%, suben desde fuera de vista atadas al
  scroll, texto en crossfade), acá con 3 certificaciones en vez de 4.

  Atributos con prefijo "about-cert-" — no chocar con data-solution-*
  (case-study-solution.js corre en TODAS las páginas vía main.js).
*/
const REST_TRANSFORMS = [
  { rotate: -3, x: -10, y: 6 },
  { rotate: 3, x: 8, y: -6 },
  { rotate: -2, x: 6, y: 8 },
];

export function initAboutCertifications() {
  const pinTarget = document.querySelector("[data-about-cert-pin]");
  const mediaStack = document.querySelector("[data-about-cert-media-stack]");
  const textItems = document.querySelectorAll("[data-about-cert-text-item]");
  const mediaItems = document.querySelectorAll("[data-about-cert-media-item]");
  if (!pinTarget || !textItems.length || !mediaItems.length) return;

  const count = mediaItems.length;
  const reduced = prefersReducedMotion();
  let currentText = -1;

  const restFor = (i) => REST_TRANSFORMS[i % REST_TRANSFORMS.length];

  let riseOffset = 900;
  const measureRiseOffset = () => {
    if (mediaStack) riseOffset = mediaStack.offsetHeight + 200;
  };
  measureRiseOffset();

  const yFor = (i, phase) => {
    const rest = restFor(i);
    if (phase >= i + 1) return rest.y;
    if (phase >= i) return rest.y + riseOffset * (1 - (phase - i));
    return rest.y + riseOffset;
  };

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
      onRefresh: measureRiseOffset,
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
