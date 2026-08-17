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
    Video: autoplay muteado solo mientras la sección de testimonios está
    en pantalla (IntersectionObserver) y solo el video del testimonio
    activo — el resto queda pausado en 0. El click sobre el video activo
    alterna play/pausa a mano; como goTo() no se vuelve a llamar mientras
    el índice no cambia, esa pausa manual se mantiene hasta que el
    usuario avanza al siguiente testimonio (scroll o click en la barra).
  */
  const playActiveVideo = () => {
    const video = videos[current];
    if (!video || !sectionInView) return;
    video.play().catch(() => {});
  };

  if (videos.length) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionInView = entry.isIntersecting;
        if (sectionInView) {
          playActiveVideo();
        } else {
          videos.forEach((v) => v.pause());
        }
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

    videos.forEach((v, i) => {
      if (i === index) {
        v.currentTime = 0;
        playActiveVideo();
      } else {
        v.pause();
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

  /*
    Click sobre el video activo alterna play/pausa. Hover: se apaga el
    cursor nativo (cursor-none en el wrapper, ver Testimonials.astro) y en
    su lugar sigue al mouse una etiqueta "Play"/"Pausa" con su ícono, más
    un overlay semitransparente que oscurece el video mientras está en
    hover — un solo cursor/overlay reutilizado para los 4 videos porque
    solo uno es interactivo (pointer-events) a la vez.
  */
  const cursor = document.querySelector("[data-testimonial-cursor]");
  const cursorText = document.querySelector("[data-testimonial-cursor-text]");
  const cursorPlayIcon = document.querySelector("[data-testimonial-cursor-icon-play]");
  const cursorPauseIcon = document.querySelector("[data-testimonial-cursor-icon-pause]");
  const wrappers = document.querySelectorAll("[data-testimonial-video-wrapper]");

  const updateCursorState = (video) => {
    if (!cursor) return;
    const paused = video.paused;
    cursorText.textContent = paused ? "Play" : "Pausa";
    cursorPlayIcon.classList.toggle("hidden", !paused);
    cursorPauseIcon.classList.toggle("hidden", paused);
  };

  wrappers.forEach((wrapper, i) => {
    const video = videos[i];
    const overlay = wrapper.querySelector("[data-testimonial-video-overlay]");
    if (!video) return;

    wrapper.addEventListener("click", () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      updateCursorState(video);
    });

    wrapper.addEventListener("mouseenter", () => {
      if (cursor) cursor.classList.remove("hidden");
      if (cursor) cursor.classList.add("flex");
      if (overlay) overlay.classList.replace("bg-black/0", "bg-black/25");
      updateCursorState(video);
    });

    wrapper.addEventListener("mousemove", (e) => {
      if (!cursor) return;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });

    wrapper.addEventListener("mouseleave", () => {
      if (cursor) cursor.classList.add("hidden");
      if (cursor) cursor.classList.remove("flex");
      if (overlay) overlay.classList.replace("bg-black/25", "bg-black/0");
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
