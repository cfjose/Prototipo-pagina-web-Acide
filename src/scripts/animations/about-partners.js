import { gsap } from "gsap";

/*
  "Socios estratégicos" — grilla estática de 6 logos reales (2 filas x
  3), sin rotación (a diferencia de client-stories.js, acá hay
  exactamente un socio por casilla, no un pool que rotar). Al pasar el
  mouse sobre una casilla, esa se queda quieta, el logo se desvanece y
  aparece la descripción de la alianza — el resto de la grilla baja a
  15% de opacidad, mismo criterio que "Historias que nos enorgullecen".

  Atributos con prefijo "about-partner-" — no chocar con data-client-*
  (client-stories.js corre en TODAS las páginas vía main.js).
*/
const DIM_OPACITY = 0.15;

export function initAboutPartners() {
  const grid = document.querySelector("[data-about-partner-grid]");
  if (!grid) return;

  const slots = [...grid.querySelectorAll("[data-about-partner-slot]")];

  slots.forEach((slot, i) => {
    const logoWrap = slot.querySelector("[data-slot-logo-wrap]");
    const descLayer = slot.querySelector("[data-slot-desc]");

    slot.addEventListener("mouseenter", () => {
      slots.forEach((s, j) => {
        gsap.to(s, { opacity: j === i ? 1 : DIM_OPACITY, duration: 0.4, ease: "power2.out" });
      });
      gsap.to(slot, { backgroundColor: "#e5e5e5", duration: 0.4, ease: "power2.out" });
      gsap.to(logoWrap, { opacity: 0, duration: 0.25, ease: "power2.out" });
      gsap.to(descLayer, { opacity: 1, duration: 0.4, delay: 0.1, ease: "power2.out" });
    });

    slot.addEventListener("mouseleave", () => {
      slots.forEach((s) => gsap.to(s, { opacity: 1, duration: 0.4, ease: "power2.out" }));
      gsap.to(slot, { backgroundColor: "#f5f5f6", duration: 0.4, ease: "power2.out" });
      gsap.to(logoWrap, { opacity: 1, duration: 0.3, delay: 0.1, ease: "power2.out" });
      gsap.to(descLayer, { opacity: 0, duration: 0.25, ease: "power2.out" });
    });
  });
}
