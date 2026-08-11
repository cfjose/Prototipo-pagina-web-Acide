import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";
import { splitWords, playWordReveal } from "./text-reveal.js";

/*
  Carrusel de testimonios: en vez de un timer (1.5s), avanza atado al
  scroll. En desktop centramos la tarjeta en el viewport y la fijamos ahí
  mientras el usuario scrollea — recién se libera y pasa a la siguiente
  sección después de recorrer todos los testimonios. En mobile no fijamos
  nada (el scroll-jacking se siente mal con touch) — ahí solo queda la
  navegación manual con los puntos, que también sirven para saltar
  directo a un testimonio en cualquier tamaño de pantalla.

  El quote usa el mismo reveal palabra por palabra que el resto del sitio
  (text-reveal.js), disparado a mano en cada cambio — no solo al cargar.
  La imagen se cruza con fade + scale, igual que en las secciones de
  servicios.
*/
export function initTestimonialCarousel() {
  const pinTarget = document.querySelector("[data-testimonial-pin]");
  const images = document.querySelectorAll("[data-testimonial-image]");
  const quotes = document.querySelectorAll("[data-testimonial-quote]");
  const authors = document.querySelectorAll("[data-testimonial-author]");
  const dots = document.querySelectorAll("[data-testimonial-dot]");
  if (!pinTarget || !images.length) return;

  const count = images.length;
  const reduced = prefersReducedMotion();
  let current = 0;

  const quoteWords = [...quotes].map((el) => splitWords(el));

  const crossfadeAuthor = (index) => {
    authors.forEach((el, i) => {
      gsap.killTweensOf(el);
      if (reduced) {
        gsap.set(el, { opacity: i === index ? 1 : 0, y: 0 });
        return;
      }
      if (i === index) {
        gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.35 });
      } else {
        gsap.to(el, { opacity: 0, y: -10, duration: 0.35, ease: "power2.in" });
      }
    });
  };

  const goTo = (index) => {
    if (index === current) return;
    current = index;

    images.forEach((img, i) => {
      gsap.killTweensOf(img);
      if (reduced) {
        gsap.set(img, { opacity: i === index ? 1 : 0, scale: 1 });
        return;
      }
      if (i === index) {
        gsap.set(img, { zIndex: 2 });
        gsap.fromTo(img, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1, ease: "power3.out" });
      } else {
        gsap.to(img, { opacity: 0, duration: 0.5, ease: "power2.out", zIndex: 1 });
      }
    });

    quotes.forEach((el, i) => {
      gsap.killTweensOf(el.children);
      if (i === index) {
        gsap.set(el, { opacity: 1 });
        playWordReveal(quoteWords[i], { delay: 0.15, duration: 0.6, stagger: 0.012 });
      } else {
        gsap.to(el, { opacity: 0, duration: 0.3, ease: "power2.in" });
      }
    });

    crossfadeAuthor(index);

    dots.forEach((dot, i) => {
      const active = i === index;
      dot.style.width = active ? "28px" : "14px";
      dot.style.backgroundColor = active ? "var(--color-teal)" : "#d9d9d9";
    });
  };

  dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

  // Reveal inicial del primer quote, igual que el resto del texto del sitio.
  playWordReveal(quoteWords[0]);

  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    const trigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "center center",
      end: () => `+=${(count - 1) * 480}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        const index = Math.min(count - 1, Math.floor(self.progress * count));
        goTo(index);
      },
    });

    return () => trigger.kill();
  });
}
