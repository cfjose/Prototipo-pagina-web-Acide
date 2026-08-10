/*
  Microinteracción simple: setea data-scrolled en el nav pasado un umbral
  (Tailwind lo consume vía data-[scrolled=true]:*), usando un solo listener
  con rAF-throttle en vez de recalcular en cada evento de scroll.
*/
export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  let ticking = false;

  const update = () => {
    nav.dataset.scrolled = window.scrollY > 8;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
}
