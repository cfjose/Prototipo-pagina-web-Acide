import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Efecto de tipeo ROTATIVO, solo para el acento del H1 del Hero (home):
  tipea una frase, espera, la borra, tipea la siguiente de la lista (en
  loop infinito mientras el heading esté en pantalla) — a diferencia de
  text-type.js (que tipea UNA VEZ y se queda, para todo el resto de
  títulos del sitio), este es el único lugar con loop de borrar/re-tipear,
  porque el pedido puntual era que rotaran varias frases que completan
  "Tu próxima gran idea merece el ___". Por eso vive en su propio
  archivo en vez de una opción más de text-type.js — text-type.js
  ignora explícitamente el heading que tenga [data-hero-rotating-word]
  adentro para que los dos no compitan por el mismo texto.

  Las frases salen de data-words (JSON) en el propio HTML, no
  hardcodeadas aquí, para que cambiarlas sea editar el .astro y no el
  script.
*/
const TYPE_MS = 45;
const DELETE_MS = 28;
const HOLD_MS = 1800;
const GAP_MS = 300;
const CARET_HTML = `<span class="text-type-caret" style="background-color:var(--color-navy)"></span>`;

export function initHeroRotatingWord() {
  const el = document.querySelector("[data-hero-rotating-word]");
  if (!el) return;

  let words = [];
  try {
    words = JSON.parse(el.dataset.words || "[]");
  } catch {
    words = [];
  }
  if (!words.length) return;

  if (prefersReducedMotion()) {
    el.textContent = words[0];
    return;
  }

  let wordIndex = 0;
  let charIndex = 0;
  let phase = "typing"; // typing | holding | deleting | gap
  let waitUntil = 0;
  let last = 0;
  let rafId = null;

  const render = () => {
    el.innerHTML = `${words[wordIndex].slice(0, charIndex)}${CARET_HTML}`;
  };

  const tick = (now) => {
    if (phase === "holding" || phase === "gap") {
      if (now >= waitUntil) phase = phase === "holding" ? "deleting" : "typing";
      rafId = requestAnimationFrame(tick);
      return;
    }

    const interval = phase === "typing" ? TYPE_MS : DELETE_MS;
    if (now - last > interval) {
      last = now;
      if (phase === "typing") {
        charIndex++;
        render();
        if (charIndex >= words[wordIndex].length) {
          phase = "holding";
          waitUntil = now + HOLD_MS;
        }
      } else {
        charIndex--;
        render();
        if (charIndex <= 0) {
          wordIndex = (wordIndex + 1) % words.length;
          phase = "gap";
          waitUntil = now + GAP_MS;
        }
      }
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId !== null) return;
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  render();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    },
    { threshold: 0.1 }
  );
  observer.observe(el);
}
