import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Resalta el link activo del nav pegajoso del artículo mientras se
  scrollea (la posición en sí ya la resuelve position:sticky en CSS,
  esto solo se encarga de qué sección está "activa" — mismo criterio
  que el ArticleNavigation de la referencia que pasó el cliente) y
  anima el scroll al hacer click en un link, en vez del salto brusco
  por defecto de los anchors.

  El salto usa window.__lenis.scrollTo (ver smooth-scroll.js) porque
  Lenis reemplaza el scroll nativo del sitio — un scrollIntoView normal
  movería el scrollbar real pero Lenis lo pisaría en el siguiente
  frame, así que hay que pedirle el scroll a Lenis mismo. Con motion
  reducido (o si Lenis no se inicializó) cae a scrollIntoView nativo.
*/
const HEADER_OFFSET = 120;

export function initArticleNav() {
  const links = document.querySelectorAll("[data-article-nav-link]");
  const sections = document.querySelectorAll("[data-article-section]");
  if (!links.length || !sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.dataset.target === id;
      link.classList.toggle("text-navy", active);
      link.classList.toggle("font-bold", active);
      link.classList.toggle("text-secondary", !active);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.getElementById(link.dataset.target);
      if (!target) return;
      e.preventDefault();

      if (window.__lenis) {
        window.__lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      }

      history.pushState(null, "", `#${link.dataset.target}`);
    });
  });
}
