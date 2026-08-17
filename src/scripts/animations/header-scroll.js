import { gsap } from "gsap";

/*
  Header fijo con una sola versión visual (blanca) — replica la
  posición/animación del header de ramotion.com/about: SIEMPRE
  position:fixed en top:0 (no hay estado "default en flujo" vs
  "floating", eso quedó descartado), y solo se traslada hacia arriba
  para ocultarse al scrollear hacia abajo, y vuelve a translateY(0)
  al scrollear hacia arriba. Se oculta trasladando EXACTAMENTE su
  propio alto (+ margen), no un valor fijo adivinado — así sea cual
  sea el alto real del header, queda completamente afuera de la
  pantalla.

  Solo en desktop (xl+, ver Header.astro) — en mobile/tablet el header
  se queda estático en flujo normal, sin este comportamiento.

  Sin GSAP para el toggle en sí (es nada más un translateY, no una
  animación que necesite scrub ni timeline) — pero SÍ hace falta
  enganchar la detección al ticker de GSAP en vez de
  "window.addEventListener('scroll', ...)": Lenis (smooth-scroll.js)
  no dispara el evento scroll nativo, así que cualquier código que
  dependa de él simplemente nunca corre. El resto del sitio ya lidia
  con esto escuchando "lenis.on('scroll', ...)" — acá usamos
  gsap.ticker (que ya corre en cada frame para el propio raf de
  Lenis) y comparamos window.scrollY manualmente, más simple que
  exponer la instancia de Lenis solo para esto.
*/
export function initHeaderScroll() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const desktopQuery = window.matchMedia("(min-width: 1280px)");
  let lastScrollY = window.scrollY;
  let active = false;

  const setHidden = (isHidden) => {
    const value = String(isHidden);
    if (header.dataset.headerHidden === value) return;
    header.dataset.headerHidden = value;
    if (isHidden) {
      const hideDistance = header.offsetHeight + 40;
      header.style.transform = `translateY(-${hideDistance}px)`;
    } else {
      header.style.transform = "";
    }
  };

  const tick = () => {
    const y = window.scrollY;

    // Arriba del todo: siempre visible, sin importar hacia dónde se venía scrolleando.
    if (y <= 0) {
      setHidden(false);
      lastScrollY = y;
      return;
    }

    const delta = y - lastScrollY;
    if (delta > 5) {
      setHidden(true);
    } else if (delta < -5) {
      setHidden(false);
    }
    lastScrollY = y;
  };

  const enable = () => {
    if (active) return;
    active = true;
    lastScrollY = window.scrollY;
    gsap.ticker.add(tick);
    tick();
  };

  const disable = () => {
    if (!active) return;
    active = false;
    gsap.ticker.remove(tick);
    header.dataset.headerHidden = "false";
    header.style.transform = "";
  };

  const syncToViewport = () => (desktopQuery.matches ? enable() : disable());

  syncToViewport();
  desktopQuery.addEventListener("change", syncToViewport);
}
