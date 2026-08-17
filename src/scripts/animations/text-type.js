import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Animación de tipeo (referencia: text-type.html que pasó el cliente) —
  reemplaza el reveal palabra-por-palabra en TODO h1/h2 del sitio que
  tenga texto en navy o teal (los títulos en negro/gris/secondary
  siguen con el reveal de siempre, ver la exclusión en text-reveal.js).

  Solo se tipea/borra la PARTE con color de acento (navy o teal) — el
  resto del título (texto neutro: negro, gris, secondary...) se
  muestra siempre entero, sin animar, tal como pidió el cliente. Se
  arma a partir de los nodos hijos del título (texto plano + <span>/
  <strong> con su clase original intacta, para no perder color ni
  peso de fuente) y se reconstruye de a poco: los segmentos neutros
  van siempre completos, el/los segmento(s) de acento se revelan
  letra por letra. Tipea UNA VEZ y se queda así mientras el título
  sigue a la vista — no hay loop de borrar/re-tipear mientras el
  usuario lo está viendo. Si el usuario sale de la sección y vuelve a
  entrar más tarde, ahí sí se repite desde cero.

  El cursor parpadeante toma el color de acento del ÚLTIMO segmento
  coloreado del título — si un mismo título tuviera navy y teal, gana
  el que aparece más al final de la oración.
*/
const TYPE_MS = 45;
const ACCENT_COLORS = { navy: "var(--color-navy)", teal: "var(--color-teal)" };

const escapeHtml = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Descompone los hijos del título en segmentos {text, className, tag, accent} — un
// segmento por nodo hijo directo (nodo de texto = sin clase/acento; <span>/<strong> =
// con su class original intacta, para reconstruirlo igual).
const buildSegments = (el) => {
  const segments = [];
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) segments.push({ text: node.textContent, className: null, tag: null, accent: null });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const className = node.getAttribute("class");
    const accent = node.classList.contains("text-navy") ? "navy" : node.classList.contains("text-teal") ? "teal" : null;
    segments.push({ text: node.textContent, className, tag: node.tagName.toLowerCase(), accent });
  });

  // Si NINGÚN hijo trae su propio color y el título entero es navy/teal
  // (ej. <h2 class="text-teal">...</h2> sin spans adentro), todo el
  // texto es "la parte con acento" — no hay parte neutra que dejar fija.
  if (!segments.some((seg) => seg.accent)) {
    const ownAccent = el.classList.contains("text-navy") ? "navy" : el.classList.contains("text-teal") ? "teal" : null;
    if (ownAccent) segments.forEach((seg) => (seg.accent = ownAccent));
  }

  return segments;
};

// Los segmentos NEUTROS van siempre completos (no animan) — solo los de
// acento se revelan hasta `n` caracteres. El cursor se inserta justo
// después del ÚLTIMO segmento de acento, donde sea que caiga en la
// oración.
const renderSegments = (el, segments, n, caretHTML) => {
  const lastAccentIndex = segments.reduce((last, seg, i) => (seg.accent ? i : last), -1);
  let remaining = n;
  let html = "";
  segments.forEach((seg, i) => {
    let text = seg.text;
    if (seg.accent) {
      const take = Math.min(remaining, seg.text.length);
      text = seg.text.slice(0, take);
      remaining -= take;
    }
    const escaped = escapeHtml(text);
    html += seg.className ? `<${seg.tag} class="${seg.className}">${escaped}</${seg.tag}>` : escaped;
    if (i === lastAccentIndex) html += caretHTML;
  });
  el.innerHTML = html;
};

const setupTypewriter = (el) => {
  const segments = buildSegments(el);
  const totalLength = segments.filter((seg) => seg.accent).reduce((sum, seg) => sum + seg.text.length, 0);
  if (!totalLength) return;

  const lastAccent = [...segments].reverse().find((seg) => seg.accent)?.accent ?? "navy";
  const caretColor = ACCENT_COLORS[lastAccent];
  const caretHTML = `<span class="text-type-caret" style="background-color:${caretColor}"></span>`;

  if (prefersReducedMotion()) {
    renderSegments(el, segments, totalLength, "");
    return;
  }

  let n = 0;
  let last = 0;
  let rafId = null;

  const tick = (now) => {
    if (now - last > TYPE_MS) {
      n++;
      last = now;
      renderSegments(el, segments, n, caretHTML);
      if (n >= totalLength) {
        stop(); // termina de tipear y se queda ahí — nada de borrar/loop mientras sigue a la vista
        return;
      }
    }
    rafId = requestAnimationFrame(tick);
  };

  // Cada vez que entra en pantalla arranca DE CERO — si sigue a la vista
  // cuando termina de tipear, stop() ya cortó el rAF y no hay más que
  // hacer hasta que salga y vuelva a entrar.
  const start = () => {
    if (rafId !== null) return;
    n = 0;
    renderSegments(el, segments, 0, caretHTML);
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  renderSegments(el, segments, 0, caretHTML);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    },
    { threshold: 0.1 }
  );
  observer.observe(el);
};

export function initTextType() {
  const headings = document.querySelectorAll("h1, h2");
  headings.forEach((el) => {
    const hasAccent = el.matches(".text-navy, .text-teal") || !!el.querySelector(".text-navy, .text-teal");
    if (!hasAccent) return;
    setupTypewriter(el);
  });
}
