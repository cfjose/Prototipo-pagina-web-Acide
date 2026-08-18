/*
  Efecto de "revelado en píxeles" para transicionar entre dos imágenes
  del mismo cuadro (referencia: pixel-transition.html que pasó el
  cliente) — un <canvas> se superpone al cuadro, sus celdas se van
  llenando en un orden random hasta tapar todo (fase "cover"); en ese
  instante exacto se hace el swap real de imagen (invisible, ya está
  todo tapado, ver el callback onCovered), y después las celdas se
  destapan en OTRO orden random (fase "reveal"), dejando ver la imagen
  nueva debajo.

  A diferencia del demo original (que loopeaba sin parar de fondo),
  acá es UNA sola pasada por transición, disparada a demanda — no hay
  animación mientras nadie hace click.

  El tamaño de celda se recalcula en cada corrida a partir del tamaño
  real del canvas en pantalla (no fijo en 18px como en la referencia)
  para que se vea proporcional tanto en el cuadro chico de mobile como
  en el grande de desktop.
*/
const COVER_MS = 380;
const REVEAL_MS = 380;
const CELL_SIZE = 32;
const TILE_COLOR = "#ffffff";

const shuffledIndices = (count) => {
  const order = [...Array(count).keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

export function createPixelWipe(canvas) {
  const ctx = canvas.getContext("2d");
  let rafId = null;

  const stop = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const draw = (W, H, cols, cell, order, count) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = TILE_COLOR;
    for (let i = 0; i < count; i++) {
      const idx = order[i];
      const cx = (idx % cols) * cell;
      const cy = ((idx / cols) | 0) * cell;
      ctx.fillRect(cx, cy, cell, cell);
    }
  };

  // onCovered: callback disparado en el instante en que el cuadro queda
  // 100% tapado — ahí es seguro cambiar qué imagen está visible debajo,
  // el cambio queda oculto por el propio wipe.
  const play = (onCovered) => {
    stop();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Celda de tamaño FIJO (no ajustada al ancho del contenedor): con
    // cols/rows redondeados hacia arriba por separado pero un cell
    // derivado solo del ancho, la altura podía quedar corta y dejar una
    // franja sin tapar abajo (bug real, reportado) — con un tamaño fijo,
    // cols*cell siempre ≥ W y rows*cell siempre ≥ H, así que la
    // cobertura total queda garantizada sin importar la proporción del
    // cuadro (el sobrante cae afuera del canvas, sin efecto visible).
    const cell = CELL_SIZE;
    const cols = Math.max(1, Math.ceil(W / cell));
    const rows = Math.max(1, Math.ceil(H / cell));
    const total = cols * rows;
    const coverOrder = shuffledIndices(total);
    const revealOrder = shuffledIndices(total);

    let coveredFired = false;
    const t0 = performance.now();

    const tick = (now) => {
      const elapsed = now - t0;

      if (elapsed < COVER_MS) {
        const p = elapsed / COVER_MS;
        draw(W, H, cols, cell, coverOrder, Math.ceil(p * total));
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (!coveredFired) {
        coveredFired = true;
        draw(W, H, cols, cell, coverOrder, total);
        onCovered?.();
      }

      const revealElapsed = elapsed - COVER_MS;
      if (revealElapsed >= REVEAL_MS) {
        ctx.clearRect(0, 0, W, H);
        stop();
        return;
      }

      const p = revealElapsed / REVEAL_MS;
      const revealedCount = Math.floor(p * total);
      const stillFilled = revealOrder.slice(revealedCount);
      draw(W, H, cols, cell, stillFilled, stillFilled.length);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  };

  return { play, stop };
}
