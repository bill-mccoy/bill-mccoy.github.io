const VERTEX = `#version 300 es
in vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_time;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 pm = u_mouse - 0.5;
  float t = u_time;

  vec3 col = vec3(0.0);

  // ambient glow
  col += vec3(0.0, 0.9, 1.0) * 0.055 * exp(-2.2 * length(p - vec2(0.55, -0.25)));
  col += vec3(1.0, 0.42, 0.17) * 0.03 * exp(-2.2 * length(p - vec2(-0.65, 0.5)));

  // scrolling blueprint grid
  {
    float s = t * 0.06;
    vec2 gp = p * 1.7;
    vec2 g = abs(fract(gp + vec2(s * 0.8, s)) - 0.5);
    vec2 d = fwidth(gp);
    vec2 l = 1.0 - abs(g * 2.0 - 1.0);
    float line = step(d.x, l.x) + step(d.y, l.y);
    float breathe = 0.7 + 0.3 * sin(t * 0.5);
    col += vec3(0.44, 0.56, 0.66) * line * (0.17 * breathe);
  }

  // fine cyan grid with mouse parallax
  {
    vec2 gp = p * 4.0 - pm * 0.06;
    vec2 g = abs(fract(gp - t * vec2(0.012, 0.02)) - 0.5);
    vec2 d = fwidth(gp);
    vec2 l = 1.0 - abs(g * 2.0 - 1.0);
    float line = step(d.x, l.x) + step(d.y, l.y);
    col += vec3(0.0, 0.9, 1.0) * line * 0.05;
  }

  // drifting particles
  {
    float cells = 11.0;
    vec2 c = floor(p * cells);
    vec2 fp = fract(p * cells) - 0.5;
    float h = hash(c);
    vec2 pc = vec2(h, hash(c + 17.13)) - 0.5;
    float dist = length(fp - pc);
    float pt = smoothstep(0.06, 0.0, dist);
    float pulse = 0.5 + 0.5 * sin(t * (0.6 + h * 1.8) + h * 40.0);
    vec3 cPart = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.42, 0.17), step(0.62, h));
    col += cPart * pt * pulse * 0.4;
  }

  // scanline sweep
  {
    float sweep = 0.5 + 0.5 * sin(uv.y * 3.0 - t * 0.35);
    col += vec3(0.0, 0.9, 1.0) * sweep * sweep * 0.02;
  }

  // vignette
  float vig = 1.0 - 0.45 * smoothstep(0.55, 1.5, length(p));

  // radial fade so the canvas melts into the page background
  float mask = 0.92 * exp(-length(p) * 0.6);
  col *= vig * mask;
  col += vec3(0.0, 0.9, 1.0) * 0.1 * exp(-length(p) * 1.4);

  outColor = vec4(col * mask, mask);
}
`;

export interface HeroBackdropHandle {
  stop: () => void;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[hero-backdrop] shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function startHeroBackdrop(
  canvas: HTMLCanvasElement,
): HeroBackdropHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[hero-backdrop] program link failed:", gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "u_res");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uMouse = gl.getUniformLocation(program, "u_mouse");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let raf = 0;
  let visible = true;
  let docHidden = document.hidden;
  const start = performance.now();
  const mouse = { x: 0.5, y: 0.25 };
  const target = { ...mouse };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const pw = Math.max(1, Math.floor(w * dpr));
    const ph = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    gl.viewport(0, 0, pw, ph);
  };

  const draw = () => {
    if (!canvas.isConnected) return;
    resize();
    if (!canvas.width || !canvas.height) return;
    mouse.x += (target.x - mouse.x) * 0.06;
    mouse.y += (target.y - mouse.y) * 0.06;
    gl.useProgram(program);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced ? 0 : (performance.now() - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const tick = () => {
    if (!canvas.isConnected || reduced) return;
    raf = requestAnimationFrame(tick);
    if (!visible || docHidden) return;
    draw();
  };

  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (visible && !docHidden && !reduced) {
            cancelAnimationFrame(raf);
            tick();
          }
        }
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);
  }

  const onVis = () => {
    docHidden = document.hidden;
    if (!docHidden && visible && !reduced) {
      cancelAnimationFrame(raf);
      tick();
    }
  };
  document.addEventListener("visibilitychange", onVis);

  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    target.x = (e.clientX - rect.left) / rect.width;
    target.y = (e.clientY - rect.top) / rect.height;
  };
  canvas.addEventListener("pointermove", onMove, { passive: true });

  let ro: ResizeObserver | null = null;
  if ("ResizeObserver" in window) {
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
  }

  resize();
  draw();

  if (!reduced) tick();

  return {
    stop: () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", onMove);
    },
  };
}