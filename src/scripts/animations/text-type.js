import { prefersReducedMotion } from "../utils/reduced-motion.js";

/*
  Animación de tipeo (referencia: text-type.html que pasó el cliente) —
  reemplaza el reveal palabra-por-palabra en TODO h1/h2 del sitio que
  tenga texto en navy o teal (los títulos en negro/gris/secondary
  siguen con el reveal de siempre, ver la exclusión en text-reveal.js).

  Solo se tipea la PARTE con color de acento (navy o teal) — el resto
  del título se muestra siempre entero. El hueco del acento se reserva
  con un sizer invisible (misma lógica que el H1 del hero), así el
  layout no salta: el texto se escribe "al lado" en su sitio.

  Tipea UNA VEZ y se queda. Si el usuario sale de la sección y vuelve,
  se repite desde cero.
*/
const TYPE_MS = 45;
const ACCENT_COLORS = { navy: "var(--color-navy)", teal: "var(--color-teal)" };

const escapeHtml = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

  if (!segments.some((seg) => seg.accent)) {
    const ownAccent = el.classList.contains("text-navy") ? "navy" : el.classList.contains("text-teal") ? "teal" : null;
    if (ownAccent) segments.forEach((seg) => (seg.accent = ownAccent));
  }

  return segments;
};

const reserveAccentSpace = (el, segments) => {
  let html = "";
  segments.forEach((seg, i) => {
    const escaped = escapeHtml(seg.text);
    if (!seg.accent) {
      html += seg.className ? `<${seg.tag} class="${seg.className}">${escaped}</${seg.tag}>` : escaped;
      return;
    }
    const tag = seg.tag || "span";
    const cls = seg.className || "";
    html += `<span class="relative inline-grid items-start justify-items-start">`;
    html += `<span class="invisible col-start-1 row-start-1 ${cls}" aria-hidden="true">${escaped}</span>`;
    html += `<${tag} class="col-start-1 row-start-1 self-start ${cls}" data-type-accent="${i}"></${tag}>`;
    html += `</span>`;
  });
  el.innerHTML = html;
};

const renderAccents = (el, segments, n, caretHTML) => {
  const lastAccentIndex = segments.reduce((last, seg, i) => (seg.accent ? i : last), -1);
  let remaining = n;

  segments.forEach((seg, i) => {
    if (!seg.accent) return;
    const node = el.querySelector(`[data-type-accent="${i}"]`);
    if (!node) return;
    const take = Math.min(remaining, seg.text.length);
    remaining -= take;
    node.textContent = seg.text.slice(0, take);
  });

  el.querySelectorAll(".text-type-caret").forEach((caret) => caret.remove());
  const lastNode = el.querySelector(`[data-type-accent="${lastAccentIndex}"]`);
  if (lastNode && caretHTML) lastNode.insertAdjacentHTML("beforeend", caretHTML);
};

const setupTypewriter = (el) => {
  const segments = buildSegments(el);
  const totalLength = segments.filter((seg) => seg.accent).reduce((sum, seg) => sum + seg.text.length, 0);
  if (!totalLength) return;

  const lastAccent = [...segments].reverse().find((seg) => seg.accent)?.accent ?? "navy";
  const caretColor = ACCENT_COLORS[lastAccent];
  const caretHTML = `<span class="text-type-caret" style="color:${caretColor}"></span>`;

  reserveAccentSpace(el, segments);

  if (prefersReducedMotion()) {
    renderAccents(el, segments, totalLength, "");
    return;
  }

  let n = 0;
  let last = 0;
  let rafId = null;

  const tick = (now) => {
    if (now - last > TYPE_MS) {
      n++;
      last = now;
      renderAccents(el, segments, n, caretHTML);
      if (n >= totalLength) {
        stop();
        return;
      }
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId !== null) return;
    n = 0;
    renderAccents(el, segments, 0, caretHTML);
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  renderAccents(el, segments, 0, caretHTML);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    },
    { threshold: 0.1 },
  );
  observer.observe(el);
};

export function initTextType() {
  const headings = document.querySelectorAll("h1, h2, [data-type-heading]");
  headings.forEach((el) => {
    if (el.querySelector("[data-hero-rotating-word]")) return;
    const hasAccent = el.matches(".text-navy, .text-teal") || !!el.querySelector(".text-navy, .text-teal");
    if (!hasAccent) return;
    setupTypewriter(el);
  });
}
