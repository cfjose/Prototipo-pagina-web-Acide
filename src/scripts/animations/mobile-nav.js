/*
  Menú mobile/tablet: transición simple de alto vía CSS grid-template-rows
  (0fr → 1fr), sin GSAP — no aporta nada usar una lib de animación pesada
  para esto y así el toggle es instantáneo, sin medir alturas en JS.
*/
export function initMobileNav() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-mobile-nav]");
  if (!toggle || !panel) return;

  const iconOpen = toggle.querySelector("[data-menu-icon-open]");
  const iconClose = toggle.querySelector("[data-menu-icon-close]");

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("grid-rows-[1fr]", open);
    panel.classList.toggle("grid-rows-[0fr]", !open);
    iconOpen.classList.toggle("hidden", open);
    iconClose.classList.toggle("hidden", !open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
}
