import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  La imagen del hero de /proyectos arranca en 912px de ancho (69.51%
  del wrapper de 1312px) y crece a su ancho completo (1312px / 100%)
  a medida que el usuario la scrollea. El H1 y la imagen ya están en
  su posición final desde que carga la página (separados por un
  margin-top real de 54px, ver ProjectsHero.astro) — no hay ninguna
  animación de entrada ni de posición, solo el ancho crece con el
  scroll normal, sin fijar la pantalla.

  El trigger arranca apenas el usuario empieza a scrollear (scroll 0,
  atado a la página completa, no a la imagen) y termina en el momento
  exacto en que la imagen entra COMPLETA en la pantalla (su borde
  inferior llega al borde inferior del viewport) — calculado en
  runtime porque depende de dónde cae la imagen y de qué tan alto es
  el viewport. Así el usuario ve la imagen entera, ya en su tamaño
  final, antes de que empiece a salirse por arriba y pasar a la
  siguiente sección.

  El alto de la imagen (829px, fijo) nunca se anima — solo el ancho.
  Si se animara el alto también (aspect-ratio fijo), el crecimiento se
  ve "raro" porque el recorte de la imagen cambia constantemente; por
  eso el contenedor usa una altura fija y el <img> hace el object-cover.
*/
export function initProjectsHero() {
  const wrapper = document.querySelector("[data-projects-hero-image]");
  if (!wrapper) return;

  if (prefersReducedMotion()) {
    gsap.set(wrapper, { width: "100%" });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(
    wrapper,
    { width: "69.51%" },
    {
      width: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: () => {
          const rect = wrapper.getBoundingClientRect();
          const absoluteBottom = rect.bottom + window.scrollY;
          return `+=${Math.max(absoluteBottom - window.innerHeight, 0)}`;
        },
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    },
  );
}
