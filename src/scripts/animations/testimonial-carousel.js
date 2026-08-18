import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/reduced-motion.js";
import { splitWords, playWordReveal } from "./text-reveal.js";

/*
  Carrusel de testimonios atado al scroll, sin timer. En desktop la
  tarjeta se centra en el viewport y se fija ahí mientras el usuario
  scrollea — recién se libera hacia la siguiente sección después de
  recorrer los 4 testimonios. Las barras de progreso (una por testimonio,
  estilo Instagram Stories) se llenan en tiempo real según el scroll:
  la barra activa va llenándose a medida que avanza el scroll dentro de
  su tramo, las anteriores quedan completas, las siguientes en cero.

  En mobile no fijamos nada (el scroll-jacking se siente mal con touch)
  — ahí las barras solo sirven para saltar de testimonio con un click.

  El quote usa el mismo reveal palabra por palabra que el resto del sitio
  (text-reveal.js), disparado a mano en cada cambio. La imagen se cruza
  con fade + scale, igual que en las secciones de servicios.
*/
export function initTestimonialCarousel() {
  const pinTarget = document.querySelector("[data-testimonial-pin]");
  const images = document.querySelectorAll("[data-testimonial-image]");
  const quotes = document.querySelectorAll("[data-testimonial-quote]");
  const authors = document.querySelectorAll("[data-testimonial-author]");
  const bars = document.querySelectorAll("[data-testimonial-bar]");
  const barFills = document.querySelectorAll("[data-testimonial-bar-fill]");
  const videos = document.querySelectorAll("[data-testimonial-video]");
  if (!pinTarget || !images.length) return;

  const count = images.length;
  const reduced = prefersReducedMotion();
  let current = 0;
  let scrollTrigger = null;
  let sectionInView = false;

  const quoteWords = [...quotes].map((el) => splitWords(el));

  /*
    Videos embebidos de Drive (iframe). No hay API play/pause: al
    activar un testimonio se carga su preview y al salir se descarga
    para que no sigan 4 reproductores a la vez.
  */
  const loadActiveEmbed = () => {
    videos.forEach((frame, i) => {
      const src = frame.dataset.src;
      if (!src) return;
      if (i === current && sectionInView) {
        if (!frame.getAttribute("src")) frame.src = src;
      } else if (frame.getAttribute("src")) {
        frame.removeAttribute("src");
      }
    });
  };

  if (videos.length) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionInView = entry.isIntersecting;
        loadActiveEmbed();
      },
      { threshold: 0.35 },
    );
    observer.observe(pinTarget);
  }

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
      img.style.pointerEvents = i === index ? "auto" : "none";
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

    videos.forEach((frame, i) => {
      const src = frame.dataset.src;
      if (!src) return;
      if (i === index) {
        if (sectionInView) frame.src = src;
      } else if (frame.getAttribute("src")) {
        frame.removeAttribute("src");
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
  };

  bars.forEach((bar, i) => {
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

  // Reveal inicial del primer quote, igual que el resto del texto del sitio.
  playWordReveal(quoteWords[0]);
  updateBars(0);

  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    scrollTrigger = ScrollTrigger.create({
      trigger: pinTarget,
      start: "center center",
      end: () => `+=${(count - 1) * 480}`,
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
      scrollTrigger = null;
    };
  });
}
