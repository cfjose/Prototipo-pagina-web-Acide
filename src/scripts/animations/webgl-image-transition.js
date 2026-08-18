import { gsap } from "gsap";

/*
  Transición de imagen por WebGL — mismo shader del demo 5 de "WebGL
  Image Transitions" (Codrops/tympanus, referencia que pasó el
  cliente): NO es un crossfade simple, cada imagen desplaza
  verticalmente a la otra según su propio brillo (luminancia) mientras
  se cruzan, dando un efecto de "derretido" líquido. El shader es una
  copia casi literal del original (misma fórmula), pero portado a
  WebGL puro en vez de Three.js — no lo necesitamos para dibujar un
  solo quad de pantalla completa, y evita sumar esa librería entera al
  bundle por un solo efecto.

  Uniforms que el shader original declaraba pero nunca usaba en el
  fragment (time, width, scaleX/Y, transition, radius, displacement)
  se sacaron — solo quedan los que realmente entran en la fórmula.
*/
const VERTEX_SRC = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SRC = `
  precision mediump float;
  uniform float progress;
  uniform float intensity;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform vec4 resolution;
  varying vec2 vUv;

  void main() {
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);

    vec4 d1 = texture2D(texture1, newUV);
    vec4 d2 = texture2D(texture2, newUV);

    float displace1 = (d1.r + d1.g + d1.b) * 0.33;
    float displace2 = (d2.r + d2.g + d2.b) * 0.33;

    vec4 t1 = texture2D(texture1, vec2(newUV.x, newUV.y + progress * (displace2 * intensity)));
    vec4 t2 = texture2D(texture2, vec2(newUV.x, newUV.y + (1.0 - progress) * (displace1 * intensity)));

    gl_FragColor = mix(t1, t2, progress);
  }
`;

const INTENSITY = 0.3; // mismo valor por default del demo original
const DURATION = 1; // segundos, mismo default del demo original (Power2.easeInOut)

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Error compilando shader: ${info}`);
  }
  return shader;
};

const loadTexture = (gl, url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // WebGL carga las texturas con el origen abajo-a-la-izquierda (al
      // revés de cómo el <canvas> 2D/HTML interpreta una imagen normal)
      // — sin esto, cada foto queda espejada verticalmente (bug
      // reportado: "las imágenes están de cabeza").
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve({ texture, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = reject;
    image.src = url;
  });

// Devuelve null (en vez de tirar error) si WebGL no está disponible o
// alguna imagen no carga — quien llama cae de vuelta al swap normal.
export async function createImageTransition(canvas, urls) {
  if (!urls?.length) return null;

  const gl = canvas.getContext("webgl", { alpha: false }) || canvas.getContext("experimental-webgl", { alpha: false });
  if (!gl) return null;

  let loaded;
  try {
    loaded = await Promise.all(urls.map((url) => loadTexture(gl, url)));
  } catch (err) {
    console.error("webgl-image-transition: fallo cargando texturas", err, urls);
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("webgl-image-transition: fallo linkeando el programa", gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  // Quad de pantalla completa en NDC (-1..1), como TRIANGLE_STRIP —
  // no hace falta cámara ni matrices, es siempre un rectángulo plano.
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const positionLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const uvLoc = gl.getAttribLocation(program, "uv");
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

  const progressLoc = gl.getUniformLocation(program, "progress");
  const intensityLoc = gl.getUniformLocation(program, "intensity");
  const resolutionLoc = gl.getUniformLocation(program, "resolution");
  const texture1Loc = gl.getUniformLocation(program, "texture1");
  const texture2Loc = gl.getUniformLocation(program, "texture2");

  gl.uniform1f(intensityLoc, INTENSITY);
  gl.uniform1f(progressLoc, 0);

  const textures = loaded.map((t) => t.texture);
  // Todas las imágenes de un mismo acordeón comparten proporción (mismo
  // width/height pedido al componente Image) — el "cover" se calcula
  // una sola vez a partir de la primera, no hace falta recalcularlo
  // por imagen como si pudieran variar.
  const imageAspect = loaded[0].height / loaded[0].width;

  let currentIndex = 0;
  let nextIndex = 0;
  let isRunning = false;

  const render = () => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[currentIndex]);
    gl.uniform1i(texture1Loc, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[nextIndex]);
    gl.uniform1i(texture2Loc, 1);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    let a1;
    let a2;
    if (h / w > imageAspect) {
      a1 = (w / h) * imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = h / w / imageAspect;
    }
    gl.uniform4f(resolutionLoc, w, h, a1, a2);
    render();
  };

  resize();
  window.addEventListener("resize", resize);

  const goTo = (index) => {
    if (isRunning || index === currentIndex) return;
    isRunning = true;
    nextIndex = index;
    const state = { progress: 0 };
    gsap.to(state, {
      progress: 1,
      duration: DURATION,
      ease: "power2.inOut",
      onUpdate: () => {
        gl.uniform1f(progressLoc, state.progress);
        render();
      },
      onComplete: () => {
        currentIndex = index;
        gl.uniform1f(progressLoc, 0);
        isRunning = false;
        render();
      },
    });
  };

  return { goTo };
}
