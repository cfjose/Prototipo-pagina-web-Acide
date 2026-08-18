import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Tipeo rotativo del acento del H1. El layout no salta: un sizer
  invisible con la frase más larga reserva el espacio. Cuando una
  frase termina, la línea (gruesa a la izquierda, fina a la derecha)
  se pinta de izq. a der. con clip-path.
*/
const TYPE_MS = 45;
const DELETE_MS = 28;
const HOLD_MS = 4200;
const GAP_MS = 450;
const PAINT_S = 0.75;
const ERASE_S = 0.22;

export function initHeroRotatingWord() {
  const el = document.querySelector("[data-hero-rotating-word]");
  if (!el) return;

  const textEl = el.querySelector("[data-hero-rotating-text]");
  const caretEl = el.querySelector("[data-hero-caret]");
  const underline = el.querySelector("[data-hero-underline]");

  let words = [];
  try {
    words = JSON.parse(el.dataset.words || "[]");
  } catch {
    words = [];
  }
  if (!words.length || !textEl) return;

  const CLIP_HIDDEN = "inset(0 100% 0 0)";
  const CLIP_SHOWN = "inset(0 0% 0 0)";

  if (underline) gsap.set(underline, { clipPath: CLIP_HIDDEN });

  if (prefersReducedMotion()) {
    textEl.textContent = words[0];
    if (caretEl) caretEl.hidden = true;
    if (underline) gsap.set(underline, { clipPath: CLIP_SHOWN });
    return;
  }

  let wordIndex = 0;
  let charIndex = 0;
  let phase = "typing";
  let waitUntil = 0;
  let last = 0;
  let rafId = null;

  const paintLine = () => {
    if (!underline) return;
    gsap.fromTo(
      underline,
      { clipPath: CLIP_HIDDEN },
      { clipPath: CLIP_SHOWN, duration: PAINT_S, ease: "power2.inOut", overwrite: true },
    );
  };

  const eraseLine = () => {
    if (!underline) return;
    gsap.to(underline, {
      clipPath: CLIP_HIDDEN,
      duration: ERASE_S,
      ease: "power1.in",
      overwrite: true,
    });
  };

  const render = ({ caret = true } = {}) => {
    textEl.textContent = words[wordIndex].slice(0, charIndex);
    if (caretEl) caretEl.hidden = !caret;
  };

  const tick = (now) => {
    if (phase === "holding" || phase === "gap") {
      if (now >= waitUntil) {
        if (phase === "holding") {
          eraseLine();
          phase = "deleting";
          last = now;
        } else {
          phase = "typing";
        }
      }
      rafId = requestAnimationFrame(tick);
      return;
    }

    const interval = phase === "typing" ? TYPE_MS : DELETE_MS;
    if (now - last > interval) {
      last = now;
      if (phase === "typing") {
        charIndex++;
        render({ caret: true });
        if (charIndex >= words[wordIndex].length) {
          render({ caret: false });
          paintLine();
          phase = "holding";
          waitUntil = now + HOLD_MS;
        }
      } else {
        charIndex--;
        render({ caret: true });
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

  render({ caret: true });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((event) => (event.isIntersecting ? start() : stop()));
    },
    { threshold: 0.1 },
  );
  observer.observe(el);
}
