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

#define CYAN   vec3(0.04, 0.85, 1.0)
#define CYAN_S vec3(0.02, 0.45, 0.62)
#define ORANGE vec3(1.0, 0.42, 0.17)
#define STEEL  vec3(0.44, 0.56, 0.66)
#define NIGHT  vec3(0.015, 0.04, 0.065)

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}
mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}
mat3 rotZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

// distance to a 3D line-segment tube (wireframe edge)
float sdSegment(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

// wireframe glow of a single edge
float edgeGlow(float d) {
  return exp(-d * 150.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y; // aspect-corrected
  vec2 pm = u_mouse - 0.5;
  float t = u_time;

  vec3 col = NIGHT;
  col += CYAN_S * 0.25 * exp(-2.0 * length(p - vec2(0.3, -0.45)));
  col += ORANGE * 0.08 * exp(-2.5 * length(p - vec2(-0.7, 0.15)));

  // camera sways with the cursor -> obvious mouse response
  vec3 ro = vec3(pm * 1.25, 0.95 + pm.y * 0.4, 4.4);
  vec3 rd = normalize(vec3(p + pm * 0.5, pm.y * 0.35 - 2.0));

  float fog = 1.0;

  // ---- perspective grid floor (infinite plane y = -1.2) ----
  {
    float tF = (-1.2 - ro.y) / rd.y;
    if (tF > 0.0) {
      vec3 hit = ro + rd * tF;
      vec2 gp = hit.xz * vec2(1.1, 1.1) + vec2(0.0, t * 0.7);
      vec2 g = abs(fract(gp) - 0.5);
      vec2 dw = fwidth(gp);
      float lx = 1.0 - smoothstep(0.0, dw.x * 2.5, min(g.x, 1.0 - g.x) * 2.0);
      float lz = 1.0 - smoothstep(0.0, dw.y * 2.5, min(g.y, 1.0 - g.y) * 2.0);
      float line = clamp(lx + lz, 0.0, 1.0);
      float depthFade = exp(-max(0.0, ro.z - hit.z) * 0.24);
      float sideFade = exp(-abs(hit.x) * 0.45);
      float hFade = smoothstep(-1.4, -0.3, hit.y); // fades out below screen bottom
      col += STEEL * (line * 0.42 * depthFade * sideFade * hFade);
      col += CYAN * (lx * lz * 0.5 * depthFade * sideFade * hFade); // nodes
      // soft center axis line (orange)
      float axis = 1.0 - smoothstep(0.0, dw.y * 3.0, min(abs(hit.x) * 8.0, 1.0));
      col += ORANGE * (axis * 0.16 * depthFade * hFade);
    }
  }

  // ---- floating wireframe cube ----
  {
    vec3 c = vec3(0.95, 0.42, 0.15);
    vec3 q = p - c;
    q = rotZ(sin(t * 0.45) * 0.35) * q;
    q = rotY(t * 0.6) * q;
    float h = 0.36;
    float d = 1e9;
    // build 12 cube edges
    d = min(d, sdSegment(q, vec3(-h, -h, -h), vec3(h, -h, -h), 0.008));
    d = min(d, sdSegment(q, vec3(-h, h, -h), vec3(h, h, -h), 0.008));
    d = min(d, sdSegment(q, vec3(-h, -h, h), vec3(h, -h, h), 0.008));
    d = min(d, sdSegment(q, vec3(-h, h, h), vec3(h, h, h), 0.008));
    d = min(d, sdSegment(q, vec3(-h, -h, -h), vec3(-h, h, -h), 0.008));
    d = min(d, sdSegment(q, vec3(h, -h, -h), vec3(h, h, -h), 0.008));
    d = min(d, sdSegment(q, vec3(-h, -h, h), vec3(-h, h, h), 0.008));
    d = min(d, sdSegment(q, vec3(h, -h, h), vec3(h, h, h), 0.008));
    d = min(d, sdSegment(q, vec3(-h, -h, -h), vec3(-h, -h, h), 0.008));
    d = min(d, sdSegment(q, vec3(h, -h, -h), vec3(h, -h, h), 0.008));
    d = min(d, sdSegment(q, vec3(-h, h, -h), vec3(-h, h, h), 0.008));
    d = min(d, sdSegment(q, vec3(h, h, -h), vec3(h, h, h), 0.008));
    float glow = edgeGlow(d);
    float depthD = exp(-length(p - c) * 1.1);
    col += CYAN * glow * (0.75 * depthD);
    col += CYAN * 0.08 * exp(-length(q) * 1.6); // soft halo around shape
  }

  // ---- floating wireframe octahedron ----
  {
    vec3 c = vec3(-1.05, 1.2, -0.25);
    vec3 q = p - c;
    q = rotX(t * 0.4 + pm.x) * q;
    q = rotY(t * 0.5) * q;
    float r = 0.62;
    float d = 1e9;
    vec3 X = vec3(r, 0.0, 0.0);
    vec3 xX = vec3(-r, 0.0, 0.0);
    vec3 Y = vec3(0.0, r, 0.0);
    vec3 yY = vec3(0.0, -r, 0.0);
    vec3 Z = vec3(0.0, 0.0, r);
    vec3 zZ = vec3(0.0, 0.0, -r);
    d = min(d, sdSegment(q, X, Y, 0.008));
    d = min(d, sdSegment(q, X, yY, 0.008));
    d = min(d, sdSegment(q, X, Z, 0.008));
    d = min(d, sdSegment(q, X, zZ, 0.008));
    d = min(d, sdSegment(q, xX, Y, 0.008));
    d = min(d, sdSegment(q, xX, yY, 0.008));
    d = min(d, sdSegment(q, xX, Z, 0.008));
    d = min(d, sdSegment(q, xX, zZ, 0.008));
    d = min(d, sdSegment(q, Y, Z, 0.008));
    d = min(d, sdSegment(q, Y, zZ, 0.008));
    d = min(d, sdSegment(q, yY, Z, 0.008));
    d = min(d, sdSegment(q, yY, zZ, 0.008));
    float glow = edgeGlow(d);
    float depthD = exp(-length(p - c) * 1.1);
    col += ORANGE * glow * (0.7 * depthD);
    col += ORANGE * 0.07 * exp(-length(q) * 1.6);
  }

  // ---- tilted neon ring ----
  {
    vec3 c = vec3(0.35, -0.55, 1.1);
    vec3 q = p - c;
    q = rotX(1.05) * q;
    q = rotZ(sin(t * 0.3) * 0.12) * q;
    float d = sdTorus(q, vec2(0.62, 0.028));
    float ring = exp(-abs(d) * 160.0);
    float depthD = exp(-length(p - c) * 1.4);
    col += CYAN * ring * (0.65 * depthD);
    col += CYAN_S * 0.12 * exp(-abs(d) * 60.0) * depthD;
  }

  // ---- floating dust with per-layer parallax ----
  {
    for (int i = 0; i < 3; i++) {
      float lf = float(i) / 2.0;
      float scale = mix(6.0, 17.0, lf);
      float par = mix(0.1, 0.45, lf);
      vec2 sp = p * scale - pm * par;
      vec2 cell = floor(sp);
      vec2 f = fract(sp);
      float h = hash(cell + vec2(float(i) * 57.0));
      vec2 pt = vec2(h, hash(cell + vec2(132.7 + float(i) * 31.0))) - 0.5;
      float dotGlow = smoothstep(0.07, 0.0, length(f - pt));
      float pulse = 0.6 + 0.4 * sin(t * (0.8 + h * 1.6) + h * 24.0);
      vec3 dust = mix(CYAN, ORANGE, step(0.7, h));
      col += dust * dotGlow * pulse * 0.45;
    }
  }

  // ---- cursor halo (direct, in screen space) ----
  {
    vec2 cp = vec2(u_mouse.x - 0.5, 0.5 - u_mouse.y) *
              vec2(u_res.x / u_res.y, 1.0);
    float md = length(p - cp);
    col += CYAN * 0.4 * exp(-3.5 * md);
    col += ORANGE * 0.14 * exp(-8.0 * md);
  }

  // ---- atmosphere ----
  // soft scan lines
  col *= 0.982 + 0.018 * sin(uv.y * u_res.y * 0.5);
  // moving haze band near the horizon
  col += CYAN_S * 0.05 * exp(-length(uv - vec2(0.5, 0.42)) * 4.0);
  // vignette
  col *= 1.0 - 0.55 * smoothstep(0.7, 1.7, length(p));

  // alpha: stronger towards the bottom so text stays readable on top
  float a = clamp(0.32 + 0.68 * smoothstep(0.08, -0.75, p.y), 0.0, 1.0);

  outColor = vec4(col * a, a);
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
    console.warn(
      "[hero-backdrop] shader compile failed:",
      gl.getShaderInfoLog(shader),
    );
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
    console.warn(
      "[hero-backdrop] program link failed:",
      gl.getProgramInfoLog(program),
    );
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
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    mouse.x += (target.x - mouse.x) * 0.07;
    mouse.y += (target.y - mouse.y) * 0.07;
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

  // track the pointer on the whole window: the backdrop sits behind content
  // with pointer-events none, so it must read the cursor from the outside
  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    if (nx >= -0.25 && nx <= 1.25 && ny >= -0.25 && ny <= 1.25) {
      target.x = nx;
      target.y = ny;
    } else {
      // cursor left the hero: ease back to neutral
      target.x = 0.5;
      target.y = 0.5;
    }
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  const onLeave = () => {
    target.x = 0.5;
    target.y = 0.5;
  };
  window.addEventListener("pointerleave", onLeave, { passive: true });

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
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    },
  };
}