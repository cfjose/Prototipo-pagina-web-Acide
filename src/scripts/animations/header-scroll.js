import { gsap } from "gsap";

/*
  Header con dos estados, solo en desktop (xl+, ver Header.astro):

  - Mientras el scroll está dentro del hero (la primera sección de
    cada página, detectada genéricamente como el primer hijo de
    <main>): header "default" — transparente, pegado arriba.
  - Pasado el hero: header "floating" — fondo navy sólido + sombra,
    mismo ancho de 1312px que el default pero con su propio padding
    (12px parejo), texto y logo blancos. Ahí se oculta scrolleando
    hacia abajo y reaparece flotando a 28px del borde superior al
    scrollear hacia arriba.

  Sin GSAP para el toggle en sí (es un cambio de atributos consumido
  por CSS, no una animación que necesite scrub ni timeline) — pero SÍ
  hace falta enganchar la detección al ticker de GSAP en vez de
  "window.addEventListener('scroll', ...)": Lenis (smooth-scroll.js)
  no dispara el evento scroll nativo, así que cualquier código que
  dependa de él simplemente nunca corre. El resto del sitio ya lidia
  con esto escuchando "lenis.on('scroll', ...)" — acá usamos
  gsap.ticker (que ya corre en cada frame para el propio raf de
  Lenis) y comparamos window.scrollY manualmente, más simple que
  exponer la instancia de Lenis solo para esto.
*/
// Barra interna: en "default" ocupa los 1312px del wrapper (padding
// estándar del sitio, px-5/sm:px-8, py-6, transparente); en "floating"
// también son 1312px pero con su propio padding (12px parejo), fondo
// navy sólido, y sombra — por eso son dos sets de clases que se pisan
// entre sí, no algo resoluble solo con variantes data-[...] de
// Tailwind.
const BAR_DEFAULT_CLASSES = ["wrapper", "py-6"];
const BAR_FLOATING_CLASSES = [
  "mx-auto",
  "max-w-[1312px]",
  "w-full",
  "p-[12px]",
  "bg-navy",
  "drop-shadow-[0px_1px_2px_rgba(0,0,0,0.39)]",
];

export function initHeaderScroll() {
  const header = document.querySelector("[data-header]");
  const bar = document.querySelector("[data-header-bar]");
  const heroEl = document.querySelector("main > :first-child");
  if (!header || !bar) return;

  const desktopQuery = window.matchMedia("(min-width: 1280px)");
  let heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
  let lastScrollY = window.scrollY;
  let active = false;

  const measure = () => {
    heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
  };

  /*
    Medir una sola vez al cargar no alcanza: si en ese momento el
    layout todavía no se había asentado (fuentes, imágenes, el pin de
    GSAP insertando su spacer), heroHeight queda con un valor viejo
    para siempre y el header nunca pasa a "floating". Con
    ResizeObserver se recalcula automáticamente cada vez que el hero
    cambia de tamaño de verdad, sin depender de que el usuario
    resizee la ventana.
  */
  const resizeObserver = typeof ResizeObserver !== "undefined" && heroEl ? new ResizeObserver(measure) : null;

  const setMode = (mode) => {
    if (header.dataset.headerMode === mode) return;
    header.dataset.headerMode = mode;
    if (mode === "floating") {
      bar.classList.remove(...BAR_DEFAULT_CLASSES);
      bar.classList.add(...BAR_FLOATING_CLASSES);
    } else {
      bar.classList.remove(...BAR_FLOATING_CLASSES);
      bar.classList.add(...BAR_DEFAULT_CLASSES);
    }
  };
  const setHidden = (isHidden) => {
    const value = String(isHidden);
    if (header.dataset.headerHidden !== value) header.dataset.headerHidden = value;
  };

  const reset = () => {
    setMode("default");
    setHidden(false);
  };

  const tick = () => {
    const y = window.scrollY;
    const pastHero = y > heroHeight;

    if (!pastHero) {
      reset();
      lastScrollY = y;
      return;
    }

    setMode("floating");

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
    measure();
    lastScrollY = window.scrollY;
    gsap.ticker.add(tick);
    window.addEventListener("resize", measure);
    resizeObserver?.observe(heroEl);
    tick();
  };

  const disable = () => {
    if (!active) return;
    active = false;
    gsap.ticker.remove(tick);
    window.removeEventListener("resize", measure);
    resizeObserver?.disconnect();
    reset();
  };

  const syncToViewport = () => (desktopQuery.matches ? enable() : disable());

  syncToViewport();
  desktopQuery.addEventListener("change", syncToViewport);
}
