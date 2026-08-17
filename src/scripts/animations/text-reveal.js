import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

gsap.registerPlugin(SplitText, ScrollTrigger);

/*
  Reveal de texto palabra por palabra (blur + fade + leve desplazamiento),
  estilo agencia — referencia: fantasy.co. Se usa en dos formas:

  1. initTextReveal(): automático vía [data-text-reveal] — se dispara al
     entrar en viewport Y CADA VEZ que se vuelve a pasar por esa zona
     (scrolleando para abajo o para arriba), no solo la primera vez.

  2. splitWords()/playWordReveal(): para reveals disparados a mano por
     otro módulo (ej. una descripción de acordeón que aparece al hacer
     hover, o el texto de un testimonio que cambia) — mismo look, pero
     el que llama decide CUÁNDO se repite.
*/
export function splitWords(el) {
  const split = SplitText.create(el, { type: "words", autoSplit: true });
  return split.words;
}

export function playWordReveal(words, { stagger = 0.025, duration = 0.8, delay = 0 } = {}) {
  if (!words?.length) return;

  if (prefersReducedMotion()) {
    gsap.set(words, { opacity: 1, filter: "blur(0px)", y: 0 });
    return;
  }

  gsap.fromTo(
    words,
    { opacity: 0, filter: "blur(10px)", y: 14 },
    { opacity: 1, filter: "blur(0px)", y: 0, duration, stagger, delay, ease: "power2.out", overwrite: true }
  );
}

/*
  Los h1/h2 en navy o teal usan la animación de tipeo (ver text-type.js)
  en vez de este reveal palabra-por-palabra — así que si un elemento
  con [data-text-reveal] es un h1/h2 con color navy/teal, lo salteamos
  acá para no animarlo dos veces.
*/
const isTypewriterHeading = (el) => {
  if (!/^H[12]$/.test(el.tagName)) return false;
  return el.matches(".text-navy, .text-teal") || !!el.querySelector(".text-navy, .text-teal");
};

export function initTextReveal() {
  const els = document.querySelectorAll("[data-text-reveal]");
  if (!els.length) return;

  if (prefersReducedMotion()) return;

  els.forEach((el) => {
    if (isTypewriterHeading(el)) return;
    const words = splitWords(el);

    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      end: "bottom 12%",
      onEnter: () => playWordReveal(words),
      onEnterBack: () => playWordReveal(words),
    });
  });
}
