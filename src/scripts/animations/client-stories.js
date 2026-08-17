import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

import wavecraftLogo from "../../assets/img/client-logos/wavecraft.png";
import nexusLogo from "../../assets/img/client-logos/nexus.png";
import innovateLogo from "../../assets/img/client-logos/innovate.png";
import novatechLogo from "../../assets/img/client-logos/novatech.png";
import auroraLogo from "../../assets/img/client-logos/aurora.png";
import cloudoxLogo from "../../assets/img/client-logos/cloudox.png";
import nexosTechLogo from "../../assets/img/client-logos/nexos-tech.png";
import nexosTech2Logo from "../../assets/img/client-logos/nexos-tech-2.png";
import zenithLogo from "../../assets/img/client-logos/zenith.png";
import asanaPrimeLogo from "../../assets/img/client-logos/asana-prime.png";
import innovatexLogo from "../../assets/img/client-logos/innovatex.png";
import novusLogo from "../../assets/img/client-logos/novus.png";
import vortexLogo from "../../assets/img/client-logos/vortex.png";
import prismLogo from "../../assets/img/client-logos/prism.png";
import axisLogo from "../../assets/img/client-logos/axis.png";
import helixLogo from "../../assets/img/client-logos/helix.png";
import novaLogo from "../../assets/img/client-logos/nova.png";
import crestLogo from "../../assets/img/client-logos/crest.png";
import pulseLogo from "../../assets/img/client-logos/pulse.png";
import stratosLogo from "../../assets/img/client-logos/stratos.png";
import vertexLogo from "../../assets/img/client-logos/vertex.png";
import cirrusLogo from "../../assets/img/client-logos/cirrus.png";
import terraLogo from "../../assets/img/client-logos/terra.png";
import lucentLogo from "../../assets/img/client-logos/lucent.png";

/*
  Grilla de clientes con dos comportamientos, inspirados en referencias
  que pasó el cliente:

  1. Rotación automática por casillero (instrument.com/client-list-rotator):
     cada una de las 12 casillas visibles tiene su propio mini-pool de
     empresas y va cambiando sola, con timing escalonado entre casillas
     para que no se sienta sincronizado/robótico.

  2. Hover con descripción (ramotion.com + el mockup de Figma): al pasar
     el mouse sobre una tarjeta, esa se queda quieta, su fondo pasa a gris
     y muestra qué se hizo para ese cliente; el resto de la grilla baja a
     15% de opacidad.
*/

/*
  24 logos reales que subió el cliente (src/assets/img/client-logos/).
  "Nexos Tech" viene duplicado en el material original (mismo archivo dos
  veces) — lo dejamos como dos empresas distintas que comparten el mismo
  isotipo porque no hay un logo propio para la 24ª, pero avisar si se
  consigue uno nuevo para reemplazar nexos-tech-2.png.

  3 rubros x 2 servicios x 4 empresas cada uno = 24. Las descripciones son
  copy modelo (no hay casos reales todavía) — mismo tono que el resto del
  sitio. Reemplazar por los textos reales cuando estén.
*/
const COMPANIES = [
  // Restaurantes — Digitalización
  { name: "WaveCraft", logo: wavecraftLogo, rubro: "Restaurantes", servicio: "Digitalización", description: "WaveCraft manejaba sus pedidos por WhatsApp y perdía la cuenta cada fin de semana. Le armamos un sistema de pedidos online con seguimiento en tiempo real — el delivery subió 35%." },
  { name: "Nexus", logo: nexusLogo, rubro: "Restaurantes", servicio: "Digitalización", description: "Nexus todavía tomaba reservas por teléfono. Hoy tiene reservas online y una carta digital que se actualiza sola, sin errores de stock." },
  { name: "Innovate", logo: innovateLogo, rubro: "Restaurantes", servicio: "Digitalización", description: "Innovate necesitaba un sitio a la altura de su cocina. Le construimos una web con menú visual y reservas integradas." },
  { name: "NovaTech", logo: novatechLogo, rubro: "Restaurantes", servicio: "Digitalización", description: "NovaTech imprimía el menú cada vez que cambiaba un precio. Con la carta digital por QR se terminaron las cartas desactualizadas." },
  // Restaurantes — Consultoría
  { name: "Aurora", logo: auroraLogo, rubro: "Restaurantes", servicio: "Consultoría", description: "Aurora no sabía por qué perdía clientes en hora pico. La auditoría reveló cuellos de botella en el flujo de caja — hoy atienden 20% más mesas por turno." },
  { name: "Cloudox", logo: cloudoxLogo, rubro: "Restaurantes", servicio: "Consultoría", description: "Cloudox manejaba varios locales con sistemas distintos. Unificamos procesos y reportes para que decidan con datos, no con intuición." },
  { name: "Nexos Tech", logo: nexosTechLogo, rubro: "Restaurantes", servicio: "Consultoría", description: "Nexos Tech quería expandirse pero no sabía a dónde. El diagnóstico de operación le mostró qué sucursal replicar primero." },
  { name: "Zenith", logo: zenithLogo, rubro: "Restaurantes", servicio: "Consultoría", description: "Zenith no sabía si le convenía abrir a mediodía. El análisis de rentabilidad por turno mostró que estaban perdiendo plata en el almuerzo." },
  // Agencias de turismo — Digitalización
  { name: "Asana Prime", logo: asanaPrimeLogo, rubro: "Agencias de turismo", servicio: "Digitalización", description: "Asana Prime armaba itinerarios a mano, uno por uno. Le construimos una plataforma de cotización automática — de días a minutos." },
  { name: "InnovateX", logo: innovatexLogo, rubro: "Agencias de turismo", servicio: "Digitalización", description: "InnovateX dependía 100% de agentes para vender. Hoy un motor de reservas propio genera el 40% de sus ventas." },
  { name: "Novus", logo: novusLogo, rubro: "Agencias de turismo", servicio: "Digitalización", description: "Novus tenía la mejor oferta de la región pero nadie la encontraba online. Rediseñamos su presencia digital de punta a punta." },
  { name: "Vortex", logo: vortexLogo, rubro: "Agencias de turismo", servicio: "Digitalización", description: "Vortex cotizaba cada paquete a mano en Excel. El armado de un paquete pasó de 2 horas a 10 minutos." },
  // Agencias de turismo — Consultoría
  { name: "Prism", logo: prismLogo, rubro: "Agencias de turismo", servicio: "Consultoría", description: "Prism no entendía por qué sus campañas no convertían. El diagnóstico mostró que le vendían el destino equivocado a la audiencia equivocada." },
  { name: "Axis", logo: axisLogo, rubro: "Agencias de turismo", servicio: "Consultoría", description: "Axis quería sumar turismo corporativo pero no sabía por dónde empezar. Armamos la hoja de ruta completa, de la oferta al pricing." },
  { name: "Helix", logo: helixLogo, rubro: "Agencias de turismo", servicio: "Consultoría", description: "Helix crecía rápido pero sin estructura. Ordenamos sus procesos internos antes de que el crecimiento se les fuera de las manos." },
  { name: "Nova", logo: novaLogo, rubro: "Agencias de turismo", servicio: "Consultoría", description: "Nova no sabía cuál de sus paquetes era realmente rentable. El análisis mostró que varios perdían plata en cada venta." },
  // Hotelera — Digitalización
  { name: "Crest", logo: crestLogo, rubro: "Hotelera", servicio: "Digitalización", description: "Crest perdía reservas directas por comisiones de OTAs. Le construimos un motor de reservas propio — el 30% ya no paga comisión." },
  { name: "Pulse", logo: pulseLogo, rubro: "Hotelera", servicio: "Digitalización", description: "Pulse no tenía presencia digital más allá de redes. Le armamos un sitio con disponibilidad en tiempo real." },
  { name: "Stratos", logo: stratosLogo, rubro: "Hotelera", servicio: "Digitalización", description: "Stratos necesitaba una experiencia de reserva a la altura de sus habitaciones. Rediseñamos todo el flujo, de la búsqueda al checkout." },
  { name: "Vertex", logo: vertexLogo, rubro: "Hotelera", servicio: "Digitalización", description: "Vertex gestionaba la disponibilidad en un cuaderno. Migramos todo a un sistema conectado a las OTAs — se terminaron los overbookings." },
  // Hotelera — Consultoría
  { name: "Cirrus", logo: cirrusLogo, rubro: "Hotelera", servicio: "Consultoría", description: "Cirrus operaba varias propiedades sin ningún dato centralizado. Diseñamos un tablero de control único para decidir pricing en tiempo real." },
  { name: "Terra", logo: terraLogo, rubro: "Hotelera", servicio: "Consultoría", description: "Terra quería subir su tarifa promedio sin perder ocupación. El análisis de pricing le mostró exactamente dónde tenía margen." },
  { name: "Lucent", logo: lucentLogo, rubro: "Hotelera", servicio: "Consultoría", description: "Lucent no sabía si convenía seguir dependiendo de agencias o vender directo. Armamos el análisis que le faltaba para decidir con números." },
  { name: "Nexos Tech", logo: nexosTech2Logo, rubro: "Hotelera", servicio: "Consultoría", description: "Nexos Tech no entendía por qué la ocupación bajaba fuera de temporada. Nunca había ajustado su estrategia de precios por estacionalidad." },
];

const SLOT_COUNT = 12;
const ROTATE_BASE_MS = 3400;
const ROTATE_STAGGER_MS = 280;
const DIM_OPACITY = 0.15;

export function initClientStories() {
  const grid = document.querySelector("[data-client-grid]");
  if (!grid) return;

  const slots = [...grid.querySelectorAll("[data-client-slot]")];
  const reduced = prefersReducedMotion();
  const filters = { rubro: null, servicio: null };
  let assignments = [];
  let timers = [];
  let hovering = false;

  const filteredPool = () => {
    const pool = COMPANIES.filter(
      (c) => (!filters.rubro || c.rubro === filters.rubro) && (!filters.servicio || c.servicio === filters.servicio)
    );
    return pool.length ? pool : COMPANIES;
  };

  const buildAssignments = () => {
    const pool = filteredPool();
    assignments = Array.from({ length: SLOT_COUNT }, (_, i) => {
      const list = [];
      for (let k = i; k < pool.length; k += SLOT_COUNT) list.push(pool[k]);
      if (!list.length) list.push(pool[i % pool.length]);
      return { list, pointer: 0 };
    });
  };

  const renderSlot = (index, animate) => {
    const slot = slots[index];
    const { list, pointer } = assignments[index];
    const company = list[pointer];
    const logoEl = slot.querySelector("[data-slot-logo]");
    const descText = slot.querySelector("[data-slot-desc-text]");

    slot.dataset.companyName = company.name;
    descText.textContent = company.description;

    const apply = () => {
      logoEl.src = company.logo.src ?? company.logo;
      logoEl.alt = `Logo de ${company.name}`;
    };

    if (reduced || !animate) {
      apply();
      return;
    }

    const wrap = slot.querySelector("[data-slot-logo-wrap]");
    gsap.to(wrap, {
      opacity: 0,
      y: -6,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        apply();
        gsap.fromTo(wrap, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
      },
    });
  };

  const stopRotation = () => {
    timers.forEach(clearInterval);
    timers = [];
  };

  const startRotation = () => {
    stopRotation();
    if (reduced) return;
    assignments.forEach((a, i) => {
      if (a.list.length < 2) return;
      timers.push(
        setInterval(() => {
          if (hovering) return;
          a.pointer = (a.pointer + 1) % a.list.length;
          renderSlot(i, true);
        }, ROTATE_BASE_MS + i * ROTATE_STAGGER_MS)
      );
    });
  };

  const refresh = () => {
    buildAssignments();
    slots.forEach((_, i) => renderSlot(i, false));
    startRotation();
  };

  // El texto vive DENTRO del cuadro del logo (overlay) — al hacer hover
  // el logo se desvanece y la descripción ocupa su lugar, mismo cuadro.
  slots.forEach((slot, i) => {
    const logoWrap = slot.querySelector("[data-slot-logo-wrap]");
    const descLayer = slot.querySelector("[data-slot-desc]");

    slot.addEventListener("mouseenter", () => {
      hovering = true;
      slots.forEach((s, j) => {
        gsap.to(s, { opacity: j === i ? 1 : DIM_OPACITY, duration: 0.4, ease: "power2.out" });
      });
      gsap.to(slot, { backgroundColor: "#e5e5e5", duration: 0.4, ease: "power2.out" });
      gsap.to(logoWrap, { opacity: 0, duration: 0.25, ease: "power2.out" });
      gsap.to(descLayer, { opacity: 1, duration: 0.4, delay: 0.1, ease: "power2.out" });
    });

    slot.addEventListener("mouseleave", () => {
      hovering = false;
      slots.forEach((s) => gsap.to(s, { opacity: 1, duration: 0.4, ease: "power2.out" }));
      gsap.to(slot, { backgroundColor: "#f5f5f6", duration: 0.4, ease: "power2.out" });
      gsap.to(logoWrap, { opacity: 1, duration: 0.3, delay: 0.1, ease: "power2.out" });
      gsap.to(descLayer, { opacity: 0, duration: 0.25, ease: "power2.out" });
    });
  });

  // Filtros
  document.querySelectorAll("[data-dropdown-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = trigger.nextElementSibling;
      const willOpen = panel.classList.contains("hidden");
      document.querySelectorAll("[data-dropdown-panel]").forEach((p) => p.classList.add("hidden"));
      panel.classList.toggle("hidden", !willOpen);
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll("[data-dropdown-panel]").forEach((p) => p.classList.add("hidden"));
  });

  // El botón "Destacados" solo se ve activo (navy) cuando no hay ningún
  // filtro aplicado — apenas se elige rubro o servicio, pasa a inactivo.
  const resetBtn = document.querySelector("[data-filter-reset]");
  const updateResetButtonState = () => {
    if (!resetBtn) return;
    const noFilters = !filters.rubro && !filters.servicio;
    resetBtn.classList.toggle("bg-navy", noFilters);
    resetBtn.classList.toggle("text-white", noFilters);
    resetBtn.classList.toggle("bg-[#e5e5e5]", !noFilters);
    resetBtn.classList.toggle("text-ink", !noFilters);
  };

  document.querySelectorAll("[data-filter-option]").forEach((opt) => {
    opt.addEventListener("click", () => {
      const { filterType, filterValue } = opt.dataset;
      filters[filterType] = filterValue;
      const label = document.querySelector(`[data-dropdown-label="${filterType}"]`);
      if (label) label.textContent = filterValue;
      updateResetButtonState();
      refresh();
    });
  });

  resetBtn?.addEventListener("click", () => {
    filters.rubro = null;
    filters.servicio = null;
    document.querySelectorAll("[data-dropdown-label]").forEach((el) => {
      el.textContent = el.dataset.defaultLabel;
    });
    updateResetButtonState();
    refresh();
  });

  refresh();
}
