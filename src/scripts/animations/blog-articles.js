/*
  Carrusel de destacadas (flechas con vuelta al llegar al final,
  mismo truco w-max que about-history.js para que scrollWidth se
  calcule bien) + filtro de categorías que retitula el bloque "Blog"
  y filtra las tarjetas de "Últimas publicaciones", ver el comentario
  largo en BlogArticles.astro para el porqué de este reparto.
*/
export function initBlogCarousel() {
  const viewport = document.querySelector("[data-blog-carousel-viewport]");
  const track = document.querySelector("[data-blog-carousel-track]");
  const items = document.querySelectorAll("[data-blog-carousel-item]");
  const prevBtn = document.querySelector("[data-blog-carousel-prev]");
  const nextBtn = document.querySelector("[data-blog-carousel-next]");
  const alignRef = document.querySelector("[data-blog-title]");
  if (!viewport || !items.length) return;

  // El carrusel vive fuera del ".wrapper" (rompe el ancho de 1312px a
  // propósito, ver el comentario en BlogArticles.astro) — para que
  // arranque alineado con el título de arriba igual le copiamos, en
  // cada resize, el inset izquierdo real del wrapper en vez de tratar
  // de replicarlo a mano con breakpoints (eso no sobrevivía la cascada
  // de Tailwind de forma confiable).
  const syncAlignment = () => {
    if (!alignRef) return;
    viewport.style.paddingLeft = `${alignRef.getBoundingClientRect().left}px`;
  };
  syncAlignment();
  window.addEventListener("resize", syncAlignment);

  const stepWidth = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return items[0].getBoundingClientRect().width + gap;
  };
  const maxScroll = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  let target = 0;

  nextBtn?.addEventListener("click", () => {
    const max = maxScroll();
    target = target >= max - 4 ? 0 : Math.min(target + stepWidth(), max);
    viewport.scrollTo({ left: target, behavior: "smooth" });
  });

  prevBtn?.addEventListener("click", () => {
    const max = maxScroll();
    target = target <= 4 ? max : Math.max(target - stepWidth(), 0);
    viewport.scrollTo({ left: target, behavior: "smooth" });
  });
}

export function initBlogFilters() {
  const buttons = document.querySelectorAll("[data-blog-filter]");
  const titleEl = document.querySelector("[data-blog-title]");
  const descEl = document.querySelector("[data-blog-description]");
  const countEl = document.querySelector("[data-blog-count]");
  const posts = document.querySelectorAll("[data-blog-post]");
  const copyEl = document.querySelector("[data-blog-copy]");
  if (!buttons.length || !copyEl) return;

  const copy = JSON.parse(copyEl.textContent);

  const applyFilter = (category) => {
    buttons.forEach((btn) => {
      const active = btn.dataset.category === category;
      btn.setAttribute("aria-pressed", String(active));
      btn.classList.toggle("bg-navy", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("bg-mist", !active);
      btn.classList.toggle("text-secondary", !active);
    });

    const entry = copy[category] ?? copy.Todos;
    titleEl.textContent = entry.title;
    descEl.textContent = entry.description;

    let visible = 0;
    posts.forEach((post) => {
      const match = category === "Todos" || post.dataset.category === category;
      post.classList.toggle("hidden", !match);
      if (match) visible += 1;
    });
    countEl.textContent = `${visible} ${visible === 1 ? "artículo" : "artículos"} en esta categoría`;
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.category));
  });

  applyFilter("Todos");
}
