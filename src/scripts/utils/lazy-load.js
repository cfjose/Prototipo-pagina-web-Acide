/*
  Lazy loading para casos que <img loading="lazy"> nativo no cubre:
  - background-images (data-bg)
  - <video> (data-src en <source>, evita descargar video fuera de viewport)
  Los <img> normales deben usar loading="lazy" + width/height directamente
  en el HTML; no necesitan pasar por acá.
*/
export function initLazyMedia(root = document) {
  const targets = root.querySelectorAll("[data-bg], video[data-src]");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;

        if (el.dataset.bg) {
          el.style.backgroundImage = `url(${el.dataset.bg})`;
          el.removeAttribute("data-bg");
        }

        if (el.tagName === "VIDEO" && el.dataset.src) {
          el.src = el.dataset.src;
          el.load();
          el.removeAttribute("data-src");
        }

        obs.unobserve(el);
      });
    },
    { rootMargin: "200px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}
