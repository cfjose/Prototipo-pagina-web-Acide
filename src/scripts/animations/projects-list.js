/*
  Filtros (rubro/servicio) + toggle de vista (Stack/Grid) para
  /proyectos. El hover que revela la descripción es CSS puro
  (group-hover:opacity), no necesita nada acá. El fade-in de cada
  tarjeta al hacer scroll tampoco — usan [data-reveal-fade], el mismo
  sistema del resto del sitio (scroll-reveal.js).

  Namespacing con prefijo "p" (data-pfilter-*, data-pview-*, etc.) para
  no chocar con los filtros de ClientStories en la home, que usan
  nombres parecidos pero es una sección totalmente distinta.
*/
export function initProjectsList() {
  const filtersBar = document.querySelector("[data-projects-filters]");
  if (!filtersBar) return;

  const cards = document.querySelectorAll("[data-pproject-card]");
  const filters = { rubro: null, servicio: null };

  const applyFilters = () => {
    cards.forEach((card) => {
      const matches = (!filters.rubro || card.dataset.rubro === filters.rubro) && (!filters.servicio || card.dataset.servicio === filters.servicio);
      card.classList.toggle("hidden", !matches);
    });
  };

  const resetBtn = document.querySelector("[data-pfilter-reset]");
  const updateResetButtonState = () => {
    if (!resetBtn) return;
    const noFilters = !filters.rubro && !filters.servicio;
    resetBtn.classList.toggle("bg-navy", noFilters);
    resetBtn.classList.toggle("text-white", noFilters);
    resetBtn.classList.toggle("bg-[#f0f0f0]", !noFilters);
    resetBtn.classList.toggle("text-ink", !noFilters);
  };

  document.querySelectorAll("[data-pfilter-option]").forEach((opt) => {
    opt.addEventListener("click", () => {
      const { filterType, filterValue } = opt.dataset;
      filters[filterType] = filterValue;
      const label = document.querySelector(`[data-pdropdown-label="${filterType}"]`);
      if (label) label.textContent = filterValue;
      updateResetButtonState();
      applyFilters();
      document.querySelectorAll("[data-pdropdown-panel]").forEach((p) => p.classList.add("hidden"));
    });
  });

  resetBtn?.addEventListener("click", () => {
    filters.rubro = null;
    filters.servicio = null;
    document.querySelectorAll("[data-pdropdown-label]").forEach((el) => {
      el.textContent = el.dataset.defaultLabel;
    });
    updateResetButtonState();
    applyFilters();
  });

  // Dropdowns
  document.querySelectorAll("[data-pdropdown-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = trigger.nextElementSibling;
      const willOpen = panel.classList.contains("hidden");
      document.querySelectorAll("[data-pdropdown-panel]").forEach((p) => p.classList.add("hidden"));
      panel.classList.toggle("hidden", !willOpen);
    });
  });
  document.addEventListener("click", () => {
    document.querySelectorAll("[data-pdropdown-panel]").forEach((p) => p.classList.add("hidden"));
  });

  // Vista Stack / Grid
  const stackView = document.querySelector("[data-pview-stack]");
  const gridView = document.querySelector("[data-pview-grid]");
  const viewBtns = document.querySelectorAll("[data-pview-btn]");

  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.pviewBtn;
      const isStack = view === "stack";
      stackView.classList.toggle("hidden", !isStack);
      stackView.classList.toggle("flex", isStack);
      gridView.classList.toggle("hidden", isStack);
      gridView.classList.toggle("grid", !isStack);

      viewBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("bg-navy", active);
        b.classList.toggle("text-white", active);
        b.classList.toggle("bg-[#f0f0f0]", !active);
        b.classList.toggle("text-ink", !active);
        b.setAttribute("aria-pressed", String(active));
      });
    });
  });
}
