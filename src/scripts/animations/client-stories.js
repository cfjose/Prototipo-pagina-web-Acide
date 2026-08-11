import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Grilla de clientes con dos comportamientos, inspirados en referencias
  que pasó el cliente:

  1. Rotación automática por casillero (instrument.com/client-list-rotator):
     cada una de las 12 casillas visibles tiene su propio mini-pool de
     empresas y va cambiando sola, con timing escalonado entre casillas
     para que no se sienta sincronizado/robótico — siempre "hay algo
     actualizándose" en la grilla sin que sea siempre las mismas 12.

  2. Hover con descripción (ramotion.com): al pasar el mouse sobre una
     tarjeta, esa tarjeta se queda quieta, su fondo pasa a gris y muestra
     qué se hizo para ese cliente; el resto de la grilla se opaca — mismo
     patrón que ya está armado en el mockup de Figma (ahí se ve "Aurora"
     activa al 100% y el resto al 12% de opacidad).

  Los filtros (rubro/servicio) recalculan el pool y reparten de nuevo las
  12 casillas.
*/

const COMPANIES = [
  // Restaurantes — Digitalización
  { name: "Sabor & Co", rubro: "Restaurantes", servicio: "Digitalización", description: "Sabor & Co perdía pedidos por WhatsApp cada fin de semana. Les armamos un sistema de pedidos online con seguimiento en tiempo real — las ventas de delivery subieron 35%." },
  { name: "La Fonda Real", rubro: "Restaurantes", servicio: "Digitalización", description: "La Fonda Real todavía tomaba reservas por teléfono. Ahora tienen reservas online y una carta digital que se actualiza sola — cero errores de stock en el menú." },
  { name: "Mesa Norte", rubro: "Restaurantes", servicio: "Digitalización", description: "Mesa Norte necesitaba un sitio a la altura de su cocina. Construimos una web con menú visual y reservas integradas que refleja la experiencia real del lugar." },
  // Restaurantes — Consultoría
  { name: "Cocina Abierta", rubro: "Restaurantes", servicio: "Consultoría", description: "Cocina Abierta no sabía por qué perdía clientes en hora pico. La auditoría reveló cuellos de botella en el flujo de caja — hoy atienden 20% más mesas por turno." },
  { name: "Grupo Andino", rubro: "Restaurantes", servicio: "Consultoría", description: "Grupo Andino manejaba 4 locales con sistemas distintos. Ayudamos a unificar procesos y reportes — ahora deciden con datos, no con intuición." },
  { name: "Sazón Urbano", rubro: "Restaurantes", servicio: "Consultoría", description: "Sazón Urbano quería expandirse pero no sabía a dónde. El diagnóstico de operación les mostró exactamente qué sucursal replicar primero." },
  // Agencias de turismo — Digitalización
  { name: "Rutas Andinas", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Rutas Andinas armaba itinerarios a mano, uno por uno. Les construimos una plataforma de cotización automática — el tiempo de respuesta pasó de días a minutos." },
  { name: "Viaja Sur", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Viaja Sur dependía 100% de agentes para vender. Hoy tienen un motor de reservas propio que ya genera el 40% de sus ventas sin intervención humana." },
  { name: "Andes Trek", rubro: "Agencias de turismo", servicio: "Digitalización", description: "Andes Trek tenía la mejor oferta de trekking de la región pero nadie la encontraba online. Rediseñamos su presencia digital de punta a punta." },
  // Agencias de turismo — Consultoría
  { name: "Costa Libre", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Costa Libre no entendía por qué sus campañas no convertían. El diagnóstico mostró que estaban vendiendo el destino equivocado a la audiencia equivocada." },
  { name: "Explora Grupo", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Explora Grupo quería sumar turismo corporativo pero no sabía por dónde empezar. Armamos la hoja de ruta completa, de la oferta al pricing." },
  { name: "Nativa Tours", rubro: "Agencias de turismo", servicio: "Consultoría", description: "Nativa Tours crecía rápido pero sin estructura. Ordenamos sus procesos internos antes de que el crecimiento se les fuera de las manos." },
  // Hotelera — Digitalización
  { name: "Hotel Presidente", rubro: "Hotelera", servicio: "Digitalización", description: "Hotel Presidente perdía reservas directas por comisiones de OTAs. Les construimos un motor de reservas propio — el 30% de sus reservas ya no paga comisión." },
  { name: "Posada del Valle", rubro: "Hotelera", servicio: "Digitalización", description: "Posada del Valle no tenía presencia digital más allá de redes. Le armamos un sitio con disponibilidad en tiempo real conectado a su sistema de gestión." },
  { name: "Grand Bahía", rubro: "Hotelera", servicio: "Digitalización", description: "Grand Bahía necesitaba una experiencia de reserva a la altura de sus habitaciones. Rediseñamos todo el flujo, de la búsqueda al checkout." },
  // Hotelera — Consultoría
  { name: "Cadena Horizonte", rubro: "Hotelera", servicio: "Consultoría", description: "Cadena Horizonte operaba 6 hoteles sin ningún dato centralizado. Diseñamos un tablero de control único — hoy deciden pricing en tiempo real." },
  { name: "Boutique Aurora", rubro: "Hotelera", servicio: "Consultoría", description: "Boutique Aurora quería subir su tarifa promedio sin perder ocupación. El análisis de pricing les mostró exactamente dónde tenían margen." },
  { name: "Refugio del Lago", rubro: "Hotelera", servicio: "Consultoría", description: "Refugio del Lago no sabía si convenía seguir dependiendo de agencias o vender directo. Armamos el análisis que le faltaba para decidir con números." },
];

const SLOT_COUNT = 12;
const ROTATE_BASE_MS = 3400;
const ROTATE_STAGGER_MS = 280;

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
    const logoLayer = slot.querySelector("[data-slot-logo]");
    const descText = slot.querySelector("[data-slot-desc-text]");

    slot.dataset.companyName = company.name;
    descText.textContent = company.description;

    if (reduced || !animate) {
      logoLayer.textContent = company.name;
      return;
    }

    gsap.to(logoLayer, {
      opacity: 0,
      y: -6,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        logoLayer.textContent = company.name;
        gsap.fromTo(logoLayer, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
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
    const logoLayer = slot.querySelector("[data-slot-logo]");
    const descLayer = slot.querySelector("[data-slot-desc]");

    slot.addEventListener("mouseenter", () => {
      hovering = true;
      slots.forEach((s, j) => {
        gsap.to(s, { opacity: j === i ? 1 : 0.12, duration: 0.4, ease: "power2.out" });
      });
      gsap.to(slot, { backgroundColor: "#e5e5e5", duration: 0.4, ease: "power2.out" });
      gsap.to(logoLayer, { opacity: 0, duration: 0.25, ease: "power2.out" });
      gsap.to(descLayer, { opacity: 1, duration: 0.4, delay: 0.1, ease: "power2.out" });
    });

    slot.addEventListener("mouseleave", () => {
      hovering = false;
      slots.forEach((s) => gsap.to(s, { opacity: 1, duration: 0.4, ease: "power2.out" }));
      gsap.to(slot, { backgroundColor: "#f5f5f6", duration: 0.4, ease: "power2.out" });
      gsap.to(logoLayer, { opacity: 1, duration: 0.3, delay: 0.1, ease: "power2.out" });
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
