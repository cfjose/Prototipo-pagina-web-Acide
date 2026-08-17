import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Adaptado de case-study-results.js — mismo mecanismo de pin + cruce de
  texto/imagen + barra de progreso, acá con 2 ítems (misión/visión) en
  vez de 4. Mismo texto "cinta continua" (el que sale sigue subiendo/
  bajando mientras se desvanece, el que entra viene del lado
  contrario) e imagen con cross-fade + zoom.

  Atributos con prefijo "about-mv-" — mismo motivo de siempre: no
  chocar con los otros gallery-pin de la página (ver el comentario en
  AboutMissionVision.astro).
*/
const TEXT_RISE = 90;

export function initAboutMissionVision() {
  const pinTarget = document.querySelector("[data-about-mv-pin]");
  const pinContent = document.querySelector("[data-about-mv-pin-content]");
  const bars = document.querySelector("[data-about-mv-bars]");
  const textItems = document.querySelectorAll("[data-about-mv-text-item]");
  const mediaItems = document.querySelectorAll("[data-about-mv-media-item]");
  const barFills = document.querySelectorAll("[data-about-mv-bar-fill]");
  if (!pinTarget || !textItems.length || !mediaItems.length) return;

  const checkBarsFit = () => {
    if (!pinContent || !bars) return;
    bars.style.display = "";
    const contentHeight = pinContent.getBoundingClientRect().height;
    const barsMarginTop = parseFloat(getComputedStyle(bars).marginTop) || 0;
    const barsHeight = bars.getBoundingClientRect().height;
    const fits = contentHeight + barsMarginTop + barsHeight <= window.innerHeight;
    bars.style.display = fits ? "" : "none";
  };

  const count = textItems.length;
  const reduced = prefersReducedMotion();
  let current = 0;
  let scrollTrigger = null;

  const updateBars = (progress) => {
    barFills.forEach((fill, i) => {
      const segStart = i / count;
      const segEnd = (i + 1) / count;
      let local = 0;
      if (progress >= segEnd) local = 1;
      else if (progress > segStart) local = (progress - segStart) / (segEnd - segStart);
      fill.style.width = `${local * 100}%`;
    });
  };

  const goTo = (index) => {
    if (index === current) return;
    const direction = index > current ? 1 : -1;
    current = index;

    textItems.forEach((item, i) => {
      gsap.killTweensOf(item);
      if (reduced) {
        gsap.set(item, { opacity: i === index ? 1 : 0, y: 0 });
        return;
      }
      if (i === index) {
        gsap.set(item, { zIndex: 2 });
        gsap.fromTo(item, { opacity: 0, y: TEXT_RISE * direction }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" });
      } else {
        gsap.to(item, { opacity: 0, y: -TEXT_RISE * direction, duration: 0.6, ease: "power2.out", zIndex: 1 });
      }
    });

    mediaItems.forEach((media, i) => {
      gsap.killTweensOf(media);
      if (reduced) {
        gsap.set(media, { opacity: i === index ? 1 : 0, zIndex: i === index ? 2 : 1 });
        return;
      }
      if (i === index) {
        gsap.set(media, { zIndex: 2 });
        gsap.fromTo(media, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" });
      } else {
        gsap.to(media, { opacity: 0, duration: 0.4, ease: "power2.out", zIndex: 1 });
      }
    });
  };

  gsap.set(textItems, { opacity: (i) => (i === 0 ? 1 : 0), y: 0, zIndex: (i) => (i === 0 ? 2 : 1) });
  gsap.set(mediaItems, { opacity: (i) => (i === 0 ? 1 : 0), zIndex: (i) => (i === 0 ? 2 : 1) });
  updateBars(0);

  barFills.forEach((fill, i) => {
    const bar = fill.parentElement;
    bar.addEventListener("click", () => {
      if (scrollTrigger) {
        const target = i / count + 0.5 / count;
        const y = scrollTrigger.start + target * (scrollTrigger.end - scrollTrigger.start);
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      } else {
        goTo(i);
        updateBars((i + 0.5) / count);
      }
    });
  });

  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    checkBarsFit();
    window.addEventListener("resize", checkBarsFit);

    scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "center center",
      end: () => `+=${(count - 1) * 600}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        const index = Math.min(count - 1, Math.floor(self.progress * count));
        goTo(index);
        updateBars(self.progress);
      },
    });

    return () => {
      window.removeEventListener("resize", checkBarsFit);
      scrollTrigger = null;
    };
  });
}
