# Acide — Prototipo web

Prototipo funcional (Astro + Tailwind + GSAP) para mostrarle al cliente
animaciones y microinteracciones reales, en lugar de simulaciones en Figma.

## Estructura

```
src/
  layouts/
    BaseLayout.astro     → <head>, meta tags, import global de CSS, carga main.js
  pages/
    index.astro           → ruta "/" — cada .astro nuevo acá es una página nueva
                             (ej. src/pages/servicios.astro → /servicios)
  styles/
    main.css              → @import "tailwindcss" + tokens de diseño (@theme) +
                             estados de animación (data-reveal, reduced-motion)
  scripts/
    main.js                → entry point
    animations/             → scroll-reveal.js, smooth-scroll.js (Lenis), nav.js
    utils/                  → lazy-load.js, reduced-motion.js
  assets/
    img/ fonts/ icons/       → assets fuente (Astro los procesa/optimiza si se importan)
public/                     → estáticos servidos tal cual (favicon, robots.txt)
astro.config.mjs
netlify.toml / vercel.json  → config de deploy
```

## Cómo correr el proyecto

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:4321`. Hot reload incluido (Astro + Vite).

```bash
pnpm build     # genera dist/ optimizado (HTML, CSS y JS minificados)
pnpm preview   # sirve dist/ localmente para verificar el build de producción
```

## Por qué Astro

- **Multi-página nativo**: cada archivo en `src/pages/` es una ruta — no hay
  que configurar rutas a mano (ideal para un sitio corporativo de varias
  secciones/páginas).
- **Cero JS por defecto**: Astro solo envía el JS que explícitamente le
  pedís (nuestro `main.js` con GSAP/Lenis) — no hay overhead de un framework
  de UI que no necesitamos para un sitio mayormente estático.
- **Optimización de imágenes integrada** (`astro:assets`) para cuando
  entren los assets reales de Figma.
- Vite corre por debajo, así que HMR, imports de npm (GSAP, Lenis) y
  Tailwind funcionan igual que en cualquier proyecto Vite moderno.

## Tailwind v4

Configurado vía el plugin oficial `@tailwindcss/vite` (el approach que
recomienda Astro para Tailwind v4, en vez de la integración `@astrojs/tailwind`
pensada para v3). Los tokens de diseño viven en `src/styles/main.css` dentro
de un bloque `@theme` — cada `--color-*`, `--font-*`, `--text-*`, `--radius-*`
genera automáticamente sus utilities (`bg-accent`, `text-ink`, `rounded-lg`,
etc.). Son placeholders hoy; se reemplazan por los valores reales al conectar
Figma.

Para casos que no son utilities puras (estados de `[data-reveal]`,
`prefers-reduced-motion`, fallback `.no-js`) hay CSS plano al final de
`main.css`, fuera de cualquier `@layer`, para no competir en especificidad.

## Librería de animación: GSAP + ScrollTrigger

Por qué esta combinación y no otra:

- **Rendimiento**: anima `transform`/`opacity` (acelerado por GPU), no
  layout/paint. Es la opción más rápida para timelines complejos y
  scroll-triggered animations en sitios con muchas secciones.
- **Gratis por completo**: desde 2025 GSAP (Webflow) liberó todos los
  plugins, incluido ScrollTrigger — antes de pago.
- **Control fino**: timelines encadenados, easing custom, `matchMedia()`
  para animaciones responsive/con reduced-motion sin duplicar código.
- **Lenis** (smooth scroll) se suma porque resuelve el scroll suave sin
  interferir con ScrollTrigger — están hechos para sincronizarse (ver
  `src/scripts/animations/smooth-scroll.js`).

Ahora se importan como paquetes npm reales (`import { gsap } from "gsap"`),
no vía CDN — mejor caching, tree-shaking y sin depender de un tercero en
runtime.

## Cómo se usan las animaciones ya armadas

- `data-reveal` / `data-reveal-fade` / `data-reveal-scale` en cualquier
  elemento → aparece animado al entrar en viewport (`scroll-reveal.js`,
  agrupa con `ScrollTrigger.batch` para no recalcular layout por elemento).
- Todo respeta `prefers-reduced-motion` automáticamente (CSS + JS).
- Si JS falla o está bloqueado, `.no-js` en `<html>` deja todo visible
  (no hay contenido invisible "atrapado" esperando animación).
- El nav usa `data-scrolled="true/false"` (seteado por `nav.js`) consumido
  con la variant de Tailwind `data-[scrolled=true]:*` — sin CSS a mano.

## Performance — checklist

Aplicado:
- [x] `prefers-reduced-motion` respetado en CSS y JS
- [x] Animaciones agrupadas con `ScrollTrigger.batch` (menos recálculos)
- [x] Solo `transform`/`opacity` en animaciones (GPU, no repaint)
- [x] Fallback `.no-js` para no dejar contenido oculto
- [x] Astro envía cero JS de framework — solo nuestro bundle de animación
- [x] Build de producción minifica y hashea assets (`pnpm build`)

Pendiente (se resuelve al traer assets reales de Figma):
- [ ] Imágenes: usar `astro:assets` (`<Image />`) para WebP/AVIF automático
      + `loading="lazy"` y dimensiones explícitas (evita layout shift)
- [ ] Fuentes: self-host con `font-display: swap` y `preload` solo de la
      variante crítica (evita FOIT y requests a Google Fonts)
- [ ] Videos de fondo: usar `data-src` en `<source>` (ya soportado por
      `lazy-load.js`) para no descargarlos si no entran en viewport
- [ ] Si una sección tiene animaciones muy pesadas en mobile, desactivarlas
      o simplificarlas con `gsap.matchMedia()` (ya está el patrón armado
      en `scroll-reveal.js`, se replica por sección)

## Deploy (preview para el cliente)

**Netlify**: conectar el repo de Git — `netlify.toml` ya tiene
`command = "pnpm build"` y `publish = "dist"`.

**Vercel**: conectar el repo — detecta Astro y pnpm automáticamente
(por `pnpm-lock.yaml`), no necesita config extra. `vercel.json` solo
define cache headers para los assets con hash.

## Próximo paso

Pasar el link del archivo de Figma para extraer estilos (colores,
tipografía, spacing, assets) y reemplazar los tokens placeholder en
`src/styles/main.css` (`@theme`), y construir la primera sección/página real.
