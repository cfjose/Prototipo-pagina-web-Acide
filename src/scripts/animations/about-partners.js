import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Adaptado de client-stories.js — misma idea (marca abstracta generada
  por JS + rotación automática por casillero + hover con historia),
  sin los filtros por rubro/servicio (el Figma de "Socios estratégicos"
  no los trae). 24 socios ficticios (no hay alianzas reales todavía)
  repartidos en las 12 casillas, 2 por casillero.

  Atributos con prefijo "about-partner-" — no chocar con
  data-client-* (client-stories.js corre en TODAS las páginas vía
  main.js).
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
  (c) => `<rect x="16" y="16" width="32" height="32" rx="0" fill="none" stroke="${c}" stroke-width="5"/>`,
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

const PARTNERS = [
  { name: "NubeCore", description: "Nuestro proveedor de infraestructura cloud — cada proyecto que entregamos corre sobre su plataforma, con monitoreo y escalado automático incluidos." },
  { name: "PagoDirecto", description: "Pasarela de pagos que integramos en la mayoría de los e-commerce que construimos — liquidación en 24h y soporte técnico directo, sin intermediarios." },
  { name: "DataForge", description: "Socio de analítica y datos — nos ayudan a instrumentar cada plataforma que lanzamos para que el cliente vea resultados medibles desde el día uno." },
  { name: "SegurIT", description: "Auditoría de seguridad externa para los proyectos que lo requieren — un segundo par de ojos antes de que cualquier sistema entre en producción." },
  { name: "DiseñaMás", description: "Estudio de branding aliado — cuando un proyecto necesita identidad visual desde cero, trabajamos codo a codo con su equipo de diseño." },
  { name: "CloudSur", description: "Hosting y despliegue para clientes del sector público — cumplen con los requisitos de soberanía de datos que exigen ciertas licitaciones." },
  { name: "MarketingLab", description: "Agencia de performance digital — cuando un cliente necesita campañas además de plataforma, los conectamos con su equipo de pauta." },
  { name: "LegalTech Perú", description: "Estudio jurídico especializado en tecnología — nos asesoran en contratos de software y protección de datos para proyectos regulados." },
  { name: "ServerPro", description: "Proveedor de servidores dedicados para clientes que necesitan infraestructura propia en vez de cloud compartido." },
  { name: "UX Studio Lima", description: "Consultora de investigación de usuarios — sumamos su equipo cuando un proyecto necesita testing con usuarios reales antes de lanzar." },
  { name: "FinanTech Andina", description: "Especialistas en integraciones bancarias — nos apoyan en proyectos que requieren conexión directa con sistemas financieros." },
  { name: "CapacitaDigital", description: "Academia de formación técnica — les derivamos a los equipos de nuestros clientes cuando necesitan capacitación adicional post-lanzamiento." },
  { name: "InfraRed", description: "Redes y conectividad empresarial — para clientes que necesitan garantizar uptime en oficinas propias, no solo en la nube." },
  { name: "QA Total", description: "Equipo externo de testing — sumamos su capacidad en proyectos grandes que necesitan un ciclo de pruebas más exhaustivo antes de salir." },
  { name: "Contenido Norte", description: "Estudio de fotografía y video — cuando un cliente no tiene material propio, los conectamos para producir contenido real para su plataforma." },
  { name: "APIntegra", description: "Consultora de integraciones — nos ayudan cuando un proyecto necesita conectar sistemas legados que no fueron pensados para hablar entre sí." },
];

const SLOT_COUNT = 12;
const ROTATE_BASE_MS = 3400;
const ROTATE_STAGGER_MS = 280;
const DIM_OPACITY = 0.15;

export function initAboutPartners() {
  const grid = document.querySelector("[data-about-partner-grid]");
  if (!grid) return;

  const slots = [...grid.querySelectorAll("[data-about-partner-slot]")];
  const reduced = prefersReducedMotion();
  let assignments = [];
  let timers = [];
  let hovering = false;

  const buildAssignments = () => {
    assignments = Array.from({ length: SLOT_COUNT }, (_, i) => {
      const list = [];
      for (let k = i; k < PARTNERS.length; k += SLOT_COUNT) list.push(PARTNERS[k]);
      if (!list.length) list.push(PARTNERS[i % PARTNERS.length]);
      return { list, pointer: 0 };
    });
  };

  const renderSlot = (index, animate) => {
    const slot = slots[index];
    const { list, pointer } = assignments[index];
    const partner = list[pointer];
    const iconEl = slot.querySelector("[data-slot-icon]");
    const logoEl = slot.querySelector("[data-slot-logo]");
    const descText = slot.querySelector("[data-slot-desc-text]");

    slot.dataset.partnerName = partner.name;
    descText.textContent = partner.description;

    const apply = () => {
      iconEl.innerHTML = createLogoMark(partner.name);
      logoEl.textContent = partner.name;
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
        }, ROTATE_BASE_MS + i * ROTATE_STAGGER_MS),
      );
    });
  };

  buildAssignments();
  slots.forEach((_, i) => renderSlot(i, false));
  startRotation();

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
}
