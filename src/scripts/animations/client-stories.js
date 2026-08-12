import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

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

  No tenemos logos reales (son 36 empresas inventadas) ni herramienta de
  generación de imágenes — en vez de dejarlo solo en texto, generamos una
  marca abstracta por empresa (color + forma geométrica, determinístico
  por nombre) para que cada tarjeta tenga una imagen real de "logo", no
  solo tipografía. El día que haya logos de verdad, se reemplazan acá
  mismo por <img src="...">.
*/

const LOGO_COLORS = ["#14416a", "#119da4", "#f43159", "#6a8d92", "#6a4c93", "#e08a2b", "#2a9d8f", "#8d5a4c"];

const LOGO_SHAPES = [
  (c) => `<circle cx="32" cy="32" r="15" fill="${c}"/>`,
  (c) => `<path d="M32 15 L48 43 L16 43 Z" fill="${c}"/>`,
  (c) => `<rect x="19" y="19" width="26" height="26" fill="${c}" transform="rotate(45 32 32)"/>`,
  (c) => `<polygon points="32,13 47,22 47,42 32,51 17,42 17,22" fill="${c}"/>`,
  (c) => `<circle cx="25" cy="32" r="11" fill="none" stroke="${c}" stroke-width="5"/><circle cx="41" cy="32" r="11" fill="none" stroke="${c}" stroke-width="5" opacity="0.6"/>`,
  (c) => `<path d="M15 40 L32 18 L49 40" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  (c) => `<path d="M12 34 Q 22 16 32 34 T 52 34" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  (c) => `<path d="M32 14 V50 M14 32 H50" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  (c) => `<rect x="16" y="16" width="32" height="32" rx="8" fill="none" stroke="${c}" stroke-width="5"/>`,
  (c) => `<path d="M18 44 L18 24 L32 14 L46 24 L46 44 Z" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/>`,
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createLogoMark(name) {
  const hash = hashString(name);
  const color = LOGO_COLORS[hash % LOGO_COLORS.length];
  const shape = LOGO_SHAPES[Math.floor(hash / LOGO_COLORS.length) % LOGO_SHAPES.length];
  return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${shape(color)}</svg>`;
}

/*
  36 empresas ficticias (3 rubros x 2 servicios x 6 cada uno) — no hay
  clientes/casos reales todavía. Reemplazar por los reales cuando estén;
  la estructura { name, rubro, servicio, description } es lo único que
  hace falta mantener.
*/
const COMPANIES = [
  // Restaurantes — Digitalización
  { name: "Sabor & Co", rubro: "Restaurantes", servicio: "Digitalización", description: "Sabor & Co perdía pedidos por WhatsApp cada fin de semana. Les armamos un sistema de pedidos online con seguimiento en tiempo real — las ventas de delivery subieron 35%." },
  { name: "La Fonda Real", rubro: "Restaurantes", servicio: "Digitalización", description: "La Fonda Real todavía tomaba reservas por teléfono. Ahora tienen reservas online y una carta digital que se actualiza sola — cero errores de stock en el menú." },
  { name: "Mesa Norte", rubro: "Restaurantes", servicio: "Digitalización", description: "Mesa Norte necesitaba un sitio a la altura de su cocina. Construimos una web con menú visual y reservas integradas que refleja la experiencia real del lugar." },
  { name: "El Fogón", rubro: "Restaurantes", servicio: "Digitalización", description: "El Fogón imprimía el menú cada vez que cambiaba un precio. Le armamos una carta digital con QR que se actualiza sola — se terminaron las cartas desactualizadas." },
  { name: "Cantina Sur", rubro: "Restaurantes", servicio: "Digitalización", description: "Cantina Sur no tenía forma de medir qué platos realmente vendían. Con el nuevo sistema de pedidos ahora saben exactamente qué sacar del menú y qué potenciar." },
  { name: "Trattoria Bella", rubro: "Restaurantes", servicio: "Digitalización", description: "Trattoria Bella perdía turnos de fin de semana por no tener reservas online. Hoy el 70% de sus reservas entran solas, sin que nadie atienda el teléfono." },
  // Restaurantes — Consultoría
  { name: "Cocina Abierta", rubro: "Restaurantes", servicio: "Consultoría", description: "Cocina Abierta no sabía por qué perdía clientes en hora pico. La auditoría reveló cuellos de botella en el flujo de caja — hoy atienden 20% más mesas por turno." },
  { name: "Grupo Andino", rubro: "Restaurantes", servicio: "Consultoría", description: "Grupo Andino manejaba 4 locales con sistemas distintos. Ayudamos a unificar procesos y reportes — ahora deciden con datos, no con intuición." },
  { name: "Sazón Urbano", rubro: "Restaurantes", servicio: "Consultoría", description: "Sazón Urbano quería expandirse pero no sabía a dónde. El diagnóstico de operación les mostró exactamente qué sucursal replicar primero." },
  { name: "Parrilla del Puerto", rubro: "Restaurantes", servicio: "Consultoría", description: "Parrilla del Puerto no sabía si le convenía abrir a mediodía. El análisis de rentabilidad por turno mostró que estaban perdiendo plata en el almuerzo." },
  { name: "Casa Miraflores", rubro: "Restaurantes", servicio: "Consultoría", description: "Casa Miraflores quería franquiciar pero no tenía procesos documentados. Armamos el manual operativo que necesitaban antes de vender la primera franquicia." },
  { name: "Bistró Central", rubro: "Restaurantes", servicio: "Consultoría", description: "Bistró Central tenía rotación de personal altísima. La auditoría de procesos encontró el cuello de botella: no era el sueldo, era el caos en cocina." },
  // Agencias de turismo — Digitalización
  { name: "Rutas Andinas", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Rutas Andinas armaba itinerarios a mano, uno por uno. Les construimos una plataforma de cotización automática — el tiempo de respuesta pasó de días a minutos." },
  { name: "Viaja Sur", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Viaja Sur dependía 100% de agentes para vender. Hoy tienen un motor de reservas propio que ya genera el 40% de sus ventas sin intervención humana." },
  { name: "Andes Trek", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Andes Trek tenía la mejor oferta de trekking de la región pero nadie la encontraba online. Rediseñamos su presencia digital de punta a punta." },
  { name: "Horizonte Travel", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Horizonte Travel cotizaba cada paquete a mano en Excel. Les armamos un cotizador online — el tiempo de armado de un paquete pasó de 2 horas a 10 minutos." },
  { name: "Sendero Libre", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Sendero Libre vendía solo por Instagram DM. Hoy tienen un catálogo online con pago integrado — las ventas fuera de horario de oficina se triplicaron." },
  { name: "Cumbre Expediciones", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Cumbre Expediciones perdía reservas por no poder cobrar seña online. Integramos pagos y confirmación automática — cero reservas perdidas por demora en confirmar." },
  // Agencias de turismo — Consultoría
  { name: "Costa Libre", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Costa Libre no entendía por qué sus campañas no convertían. El diagnóstico mostró que estaban vendiendo el destino equivocado a la audiencia equivocada." },
  { name: "Explora Grupo", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Explora Grupo quería sumar turismo corporativo pero no sabía por dónde empezar. Armamos la hoja de ruta completa, de la oferta al pricing." },
  { name: "Nativa Tours", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Nativa Tours crecía rápido pero sin estructura. Ordenamos sus procesos internos antes de que el crecimiento se les fuera de las manos." },
  { name: "Destino Norte", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Destino Norte no sabía cuál de sus 8 paquetes era realmente rentable. El análisis mostró que 3 de ellos perdían plata en cada venta." },
  { name: "Travesía Grupo", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Travesía Grupo quería vender a empresas pero no tenía pricing ni propuesta armada para ese segmento. Se lo construimos de cero." },
  { name: "Ruta Salvaje", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Ruta Salvaje crecía en ventas pero no en rentabilidad. Encontramos que sus proveedores de transporte les estaban comiendo el margen." },
  // Hotelera — Digitalización
  { name: "Hotel Presidente", rubro: "Hotelera", servicio: "Digitalización", description: "Hotel Presidente perdía reservas directas por comisiones de OTAs. Les construimos un motor de reservas propio — el 30% de sus reservas ya no paga comisión." },
  { name: "Posada del Valle", rubro: "Hotelera", servicio: "Digitalización", description: "Posada del Valle no tenía presencia digital más allá de redes. Le armamos un sitio con disponibilidad en tiempo real conectado a su sistema de gestión." },
  { name: "Grand Bahía", rubro: "Hotelera", servicio: "Digitalización", description: "Grand Bahía necesitaba una experiencia de reserva a la altura de sus habitaciones. Rediseñamos todo el flujo, de la búsqueda al checkout." },
  { name: "Hostal Río", rubro: "Hotelera", servicio: "Digitalización", description: "Hostal Río gestionaba la disponibilidad en un cuaderno. Migramos todo a un sistema conectado a las OTAs — se terminaron los overbookings." },
  { name: "Torre Marina", rubro: "Hotelera", servicio: "Digitalización", description: "Torre Marina no tenía forma de vender upgrades de habitación online. Sumamos un flujo de upsell automático que ya genera un ingreso extra por reserva." },
  { name: "Villa Costanera", rubro: "Hotelera", servicio: "Digitalización", description: "Villa Costanera dependía de una sola persona para gestionar reservas. Automatizamos confirmaciones y recordatorios — ahora el proceso funciona solo." },
  // Hotelera — Consultoría
  { name: "Cadena Horizonte", rubro: "Hotelera", servicio: "Consultoría", description: "Cadena Horizonte operaba 6 hoteles sin ningún dato centralizado. Diseñamos un tablero de control único — hoy deciden pricing en tiempo real." },
  { name: "Boutique Aurora", rubro: "Hotelera", servicio: "Consultoría", description: "Boutique Aurora quería subir su tarifa promedio sin perder ocupación. El análisis de pricing les mostró exactamente dónde tenían margen." },
  { name: "Refugio del Lago", rubro: "Hotelera", servicio: "Consultoría", description: "Refugio del Lago no sabía si convenía seguir dependiendo de agencias o vender directo. Armamos el análisis que le faltaba para decidir con números." },
  { name: "Grupo Altamar", rubro: "Hotelera", servicio: "Consultoría", description: "Grupo Altamar no entendía por qué la ocupación bajaba fuera de temporada. Nunca habían ajustado su estrategia de precios por estacionalidad." },
  { name: "Hotel Almendro", rubro: "Hotelera", servicio: "Consultoría", description: "Hotel Almendro quería reformar pero no sabía qué habitaciones priorizar. El análisis de rentabilidad por categoría les dio la respuesta en una semana." },
  { name: "Posadas del Sol", rubro: "Hotelera", servicio: "Consultoría", description: "Posadas del Sol operaba 3 propiedades sin ningún estándar en común. Diseñamos el manual de marca y operación que hoy usan en las tres." },
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
    const iconEl = slot.querySelector("[data-slot-icon]");
    const logoEl = slot.querySelector("[data-slot-logo]");
    const descText = slot.querySelector("[data-slot-desc-text]");

    slot.dataset.companyName = company.name;
    descText.textContent = company.description;

    const apply = () => {
      iconEl.innerHTML = createLogoMark(company.name);
      logoEl.textContent = company.name;
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

  document.querySelectorAll("[data-filter-option]").forEach((opt) => {
    opt.addEventListener("click", () => {
      const { filterType, filterValue } = opt.dataset;
      filters[filterType] = filterValue;
      const label = document.querySelector(`[data-dropdown-label="${filterType}"]`);
      if (label) label.textContent = filterValue;
      refresh();
    });
  });

  document.querySelector("[data-filter-reset]")?.addEventListener("click", () => {
    filters.rubro = null;
    filters.servicio = null;
    document.querySelectorAll("[data-dropdown-label]").forEach((el) => {
      el.textContent = el.dataset.defaultLabel;
    });
    refresh();
  });

  refresh();
}
