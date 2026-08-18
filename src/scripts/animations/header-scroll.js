import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Un subrayado único que viaja entre los links del header (hover,
  foco y página actual). Si hay una posición guardada de la página
  anterior, arranca desde ahí para que el salto de ruta se sienta
  continuo. Lenis no hace falta: esto no depende del scroll.
*/
const STORAGE_KEY = "acide-nav-underline";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function initHeaderScroll() {
  const nav = document.querySelector("[data-header-nav]");
  const line = document.querySelector("[data-nav-underline]");
  if (!nav || !line) return;

  const links = [...nav.querySelectorAll("[data-nav-link]")];
  const reduced = prefersReducedMotion();
  const current = links.find((link) => link.getAttribute("aria-current") === "page");

  const measure = (el) => {
    const navBox = nav.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return { x: box.left - navBox.left, scaleX: Math.max(box.width, 1) };
  };

  const moveTo = (el, { duration = 0.4 } = {}) => {
    const { x, scaleX } = measure(el);
    gsap.to(line, {
      x,
      scaleX,
      duration: reduced ? 0 : duration,
      ease: EASE,
      overwrite: "auto",
    });
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ x, scaleX }));
    } catch {
      /* private mode */
    }
  };

  const hide = () => {
    gsap.to(line, {
      scaleX: 0,
      duration: reduced ? 0 : 0.22,
      ease: "power1.in",
      overwrite: "auto",
    });
  };

  gsap.set(line, { x: 0, scaleX: 0, transformOrigin: "left center" });

  if (current) {
    const next = measure(current);
    let from = null;
    try {
      from = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      from = null;
    }

    if (from && Number.isFinite(from.x) && Number.isFinite(from.scaleX) && !reduced) {
      gsap.fromTo(
        line,
        { x: from.x, scaleX: from.scaleX },
        { x: next.x, scaleX: next.scaleX, duration: 0.45, ease: EASE },
      );
    } else {
      gsap.set(line, next);
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  }

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => moveTo(link));
    link.addEventListener("focus", () => moveTo(link));
  });

  nav.addEventListener("mouseleave", () => {
    if (current) moveTo(current, { duration: 0.35 });
    else hide();
  });

  nav.addEventListener("focusout", (event) => {
    if (nav.contains(event.relatedTarget)) return;
    if (current) moveTo(current, { duration: 0.35 });
    else hide();
  });
}
