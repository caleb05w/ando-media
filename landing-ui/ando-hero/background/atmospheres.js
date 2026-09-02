/* ANDŌ atmospheres - "sora" generative cloud-sky · raw WebGL2 runtime
   ════════════════════════════════════════════════════════════════════════
   A vague-cumulus sky against sunlit blue: a single procedural HDR pass →
   aperture defocus → threshold bloom (dual-Kawase) → ACES tonemap → split-tone
   grade → vignette → grain. No scene graph, no geometry - every stage is a
   fullscreen triangle, so this is hand-written WebGL2 with inline GLSL ES 3.00
   rather than a three.js dependency.

   Performance posture (it paints behind the hero, always-on):
     · DPR is capped (1.5), with a one-shot drop to 1.0 if frames run long.
     · The sky + lens passes render at half resolution; the defocus blur and the
       final grade hide the upscale, while bloom/grain/vignette stay full-res.
     · setOcclusion(rect) skips the sky + lens fragment work behind the app
       window (it is ~80% opaque, so the hidden core only shows a flat tint).
     · The render loop is throttled to ~20fps - clouds drift slowly enough that
       it reads as continuous, cutting continuous GPU cost.
     · An IntersectionObserver pauses rendering when the canvas scrolls off
       screen; `visibilitychange` pauses it when the tab is hidden.
     · `play(false)` (used for prefers-reduced-motion) stops the loop entirely,
       holding the last composited frame.

   Usage:
     import { mount } from './atmospheres.js';
     const sky = mount(canvasEl, configJSON);   // see sora-config.json
     sky.play(false);   // freeze · sky.dispose();
   ════════════════════════════════════════════════════════════════════════ */

const SORA_DEFAULTS = {
  sunX: 0.92, sunY: 0.02, glow: 0.91, warm: 0.22,
  coverage: 0.48, soft: 0.50, scale: 0.74, billow: 0.10, cirrus: 0.35,
  drift: 0.57, haze: 0.63,
  ev: 0.0, bloom: 0.65, grain: 0.145, vig: 0.32,
};

/* the lens - only the defocus stage survives in the sora-only pipeline */
const CAMERA_DEFAULTS = {
  type: 0,          // 0 spherical · 1 bladed iris · 2 anamorphic
  defocus: 0.0,     // overall bokeh blur
  edge: 0.0,        // 0 uniform … 1 sharp centre, melting edges
  highlights: 0.5,  // bokeh energy - how hard bright points punch through
};

const DPR_CAP = 1.5;
const TARGET_FPS = 20;
const TAPS = 8;

// Occlusion: when the app window covers the sky, skip the procedural sky + lens
// fragment work it hides (see setOcclusion). OCC_CORNER_CSS matches the window's
// rounded-[10px] corners - a ring of real sky that wide is kept just inside the
// window edge so the corners (and the defocus reach) sample clouds, not the flat
// fill. OCCLUDED_TINT (linear HDR, pre-tonemap) is what shows at ~20% through the
// ~80%-opaque window, so it only needs to read as a faint mid-sky wash; tunable.
const OCC_CORNER_CSS = 10;
const OCCLUDED_TINT = [0.5, 0.62, 0.9];

/* ───────────────────────────── shaders ────────────────────────────────── */

const VERT_SRC = `#version 300 es
layout(location = 0) in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

const FS_HEAD = `#version 300 es
precision highp float;
out vec4 fragColor;
`;

const COMMON = /* glsl */`
#define TAU 6.28318530718
float hash21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i),              hash21(i + vec2(1, 0)), u.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
float fbm2(vec2 p){ return vnoise(p) * 0.62 + vnoise(p * 2.13 + 7.7) * 0.38; }
mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
`;

/* ── sora · cumulus against a sunlit sky, flat and graphic ─────────────── */
const SORA_FRAG = FS_HEAD + COMMON + /* glsl */`
uniform vec2  u_res;
uniform float u_time;       // drift-scaled clock
uniform float u_seed;
uniform vec2  u_sunPos;     // 0..1 screen space
uniform float u_glow;
uniform float u_warm;
uniform float u_coverage;
uniform float u_soft;
uniform float u_scale;
uniform float u_billow;
uniform float u_cirrus;
uniform float u_haze;

// Normalized fBm; rim sample runs cheaper (3 oct) than the density (5 oct).
float fbmN(vec2 p, int oct){
  float a = 0.5, s = 0.0, n = 0.0;
  for(int i = 0; i < 5; i++){
    if(i >= oct) break;
    s += a * vnoise(p);
    n += a; a *= 0.52; p = p * 2.07 + 13.7;
  }
  return s / n;
}

float cloudField(vec2 q, int oct){
  vec2 p = q + vec2(u_time * 0.045, u_time * 0.006);
  // Skip the domain warp at billow=0 (its 2 fbm2 calls would just multiply by 0).
  if(u_billow > 0.001){
    vec2 w = vec2(fbm2(q * 0.55 + u_time * 0.020 + u_seed),
                  fbm2(q * 0.55 + 9.1 - u_time * 0.016));
    p += (w - 0.5) * (2.6 * u_billow);
  }
  return fbmN(p, oct);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 pa = vec2(uv.x * aspect, uv.y);
  vec2 sa = vec2(u_sunPos.x * aspect, u_sunPos.y);

  float w = u_warm;
  vec3 zen  = mix(vec3(0.150, 0.355, 0.795), vec3(0.34, 0.36, 0.62), w * 0.8);
  vec3 hor  = mix(vec3(0.60, 0.74, 0.94),    vec3(0.95, 0.74, 0.58), w);
  vec3 sunC = mix(vec3(1.00, 0.97, 0.90),    vec3(1.00, 0.66, 0.34), w);

  /* sky gradient + atmospheric haze toward the horizon */
  float hz = pow(1.0 - uv.y, 1.6);
  vec3 sky = mix(zen, hor, clamp(hz + u_haze * (1.0 - uv.y) * 0.7, 0.0, 1.0)) * 1.12;

  /* sun - bright core, restrained forward-scatter halo */
  float sd = distance(pa, sa);
  float halo = exp(-sd * sd * 11.0) * 0.55 + exp(-sd * 2.6) * 0.16;
  sky += sunC * halo * (u_glow * 1.15);

  /* cumulus */
  vec2 q = pa * (2.1 * u_scale) + vec2(u_seed * 0.37, u_seed * 0.61);
  float d = mix(0.5, cloudField(q, 5), 1.22);       // contrast - defined masses
  float thr  = mix(0.66, 0.38, u_coverage);
  float band = 0.07 + 0.20 * u_soft;
  float c = smoothstep(thr, thr + band, d);

  /* lighting: sample density toward the sun for silver-lined edges */
  vec2 toSun = normalize(sa - pa + 1e-4);
  float dLit = cloudField(q + toSun * 0.11, 3);     // rim only - 3 oct is enough
  float rim  = clamp((d - dLit) * 9.0, -1.0, 1.0);

  float dense = smoothstep(thr + band * 0.6, thr + band * 1.9, d);
  vec3 litC    = sunC * (1.18 + 0.55 * u_glow * exp(-sd * 1.4));
  vec3 shadeC  = mix(vec3(0.66, 0.72, 0.85), vec3(0.72, 0.64, 0.68), w) * 0.96;
  vec3 cloudC  = mix(litC, shadeC, clamp(dense * 0.85 - rim * 0.45, 0.0, 1.0));
  cloudC = mix(cloudC, litC * 1.06, clamp(rim, 0.0, 1.0) * (1.0 - dense * 0.55));

  /* thin veil where density is just below threshold - vague, flat */
  float veil = smoothstep(thr - 0.13, thr, d) * (1.0 - c);
  sky = mix(sky, mix(sky, litC, 0.45), veil * 0.28);

  vec3 col = mix(sky, cloudC, c * 0.96);

  /* cirrus - stretched wisps high above */
  if(u_cirrus > 0.005){
    vec2 cq = rot2(-0.18) * (pa * vec2(1.3, 4.2) * u_scale) + vec2(u_time * 0.10, u_seed);
    float ci = fbmN(cq, 5);
    float wisp = smoothstep(0.56, 0.78, ci) * u_cirrus;
    col = mix(col, mix(sunC, vec3(1.0), 0.5) * 1.05, wisp * 0.42 * (1.0 - c));
  }

  /* gentle top-of-frame deepening (cos⁴ sky falloff) */
  col *= 1.0 - 0.10 * pow(uv.y, 2.0) * (1.0 - u_warm * 0.5);

  fragColor = vec4(col, 1.0);
}
`;

/* ── lens · defocus - aperture-shaped bokeh in linear HDR ──────────────── */
const DEFOCUS_FRAG = FS_HEAD + COMMON + /* glsl */`
uniform sampler2D u_tex;
uniform vec2  u_res;
uniform float u_amount;       // max CoC radius, fraction of frame height
uniform float u_edge;         // radial growth - centre stays in focus
uniform float u_hi;           // highlight (bokeh) energy
uniform float u_type;         // 0 spherical · 1 bladed · 2 anamorphic
uniform int   u_taps;

// 6-blade iris: radius modulation turns the disc into a soft hexagon
float iris(float a){
  return cos(0.5235988) / cos(mod(a, 1.0471976) - 0.5235988);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  if(u_amount < 1e-5){ fragColor = texture(u_tex, uv); return; }

  float aspect = u_res.x / u_res.y;
  vec2  c   = (uv - 0.5) * vec2(aspect, 1.0);
  float rad = length(c) / (0.5 * sqrt(aspect * aspect + 1.0));
  float R   = u_amount * mix(1.0, smoothstep(0.12, 0.95, rad), u_edge);
  if(R < 1e-5){ fragColor = texture(u_tex, uv); return; }

  float phi0 = hash21(gl_FragCoord.xy) * TAU;
  int  type = int(u_type);
  vec3 acc = vec3(0.0); float wsum = 0.0;
  float fN = float(u_taps);
  for(int i = 0; i < 16; i++){
    if(i >= u_taps) break;
    float fi = float(i);
    float r  = sqrt((fi + 0.5) / fN);
    float a  = fi * 2.39996323 + phi0;
    if(type == 1) r *= iris(a);
    vec2 off = r * vec2(cos(a), sin(a));
    if(type == 2) off.x *= 0.52;                    // anamorphic oval
    vec3 s = texture(u_tex, uv + off * R * vec2(1.0 / aspect, 1.0)).rgb;
    // energy weighting: HDR highlights keep their punch through the iris
    float w = 1.0 + u_hi * 5.0 * max(dot(s, vec3(0.2126, 0.7152, 0.0722)) - 0.85, 0.0);
    acc += s * w; wsum += w;
  }
  fragColor = vec4(acc / wsum, 1.0);
}
`;

/* ── post · threshold bloom (dual-Kawase) ──────────────────────────────── */
const BRIGHT_FRAG = FS_HEAD + /* glsl */`
uniform sampler2D u_tex; uniform vec2 u_px;
void main(){
  vec2 uv = gl_FragCoord.xy * u_px;
  vec3 c = texture(u_tex, uv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float w = max(l - 1.02, 0.0) / max(l, 1e-4);
  fragColor = vec4(c * w, 1.0);
}
`;
const DOWN_FRAG = FS_HEAD + /* glsl */`
uniform sampler2D u_tex; uniform vec2 u_px;
void main(){
  vec2 uv = gl_FragCoord.xy * u_px * 2.0;
  vec3 c = texture(u_tex, uv).rgb * 4.0;
  c += texture(u_tex, uv + vec2( u_px.x,  u_px.y)).rgb;
  c += texture(u_tex, uv + vec2(-u_px.x,  u_px.y)).rgb;
  c += texture(u_tex, uv + vec2( u_px.x, -u_px.y)).rgb;
  c += texture(u_tex, uv + vec2(-u_px.x, -u_px.y)).rgb;
  fragColor = vec4(c / 8.0, 1.0);
}
`;
const UP_FRAG = FS_HEAD + /* glsl */`
uniform sampler2D u_low;
uniform sampler2D u_same;
uniform vec2 u_px;
void main(){
  vec2 uv = gl_FragCoord.xy * u_px;
  vec2 o = u_px * 1.6;
  vec3 c  = texture(u_low, uv + vec2(-o.x * 2.0, 0.0)).rgb;
  c += texture(u_low, uv + vec2( o.x * 2.0, 0.0)).rgb;
  c += texture(u_low, uv + vec2(0.0, -o.y * 2.0)).rgb;
  c += texture(u_low, uv + vec2(0.0,  o.y * 2.0)).rgb;
  c += texture(u_low, uv + vec2(-o.x,  o.y)).rgb * 2.0;
  c += texture(u_low, uv + vec2( o.x,  o.y)).rgb * 2.0;
  c += texture(u_low, uv + vec2(-o.x, -o.y)).rgb * 2.0;
  c += texture(u_low, uv + vec2( o.x, -o.y)).rgb * 2.0;
  fragColor = vec4(c / 12.0 + texture(u_same, uv).rgb, 1.0);
}
`;

/* ── post · ACES tonemap → split-tone grade → vignette → grain ─────────── */
const FINAL_FRAG = FS_HEAD + COMMON + /* glsl */`
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform vec2  u_res;
uniform float u_bloomAmt;
uniform float u_ev;
uniform float u_vig;
uniform float u_grain;
uniform float u_gtime;

vec3 aces(vec3 x){
  x *= 0.72;
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec3 hdr = texture(u_scene, uv).rgb;
  hdr += texture(u_bloom, uv).rgb * (u_bloomAmt * 0.55);
  hdr *= exp2(u_ev);

  vec3 col = aces(hdr);

  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col += smoothstep(0.55, 1.0, lum) * vec3(0.014, 0.005, -0.009);
  col += (1.0 - smoothstep(0.0, 0.42, lum)) * vec3(-0.006, 0.002, 0.013);
  col = mix(vec3(lum), col, 1.045);

  vec2 c = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float vig = pow(max(cos(length(c) * 0.86), 0.0), 3.0);
  col *= mix(1.0, vig, u_vig);

  float g = hash21(gl_FragCoord.xy + fract(floor(u_gtime * 24.0) * 0.6180339) * 311.7) - 0.5;
  col += g * u_grain * (0.35 + 0.65 * (1.0 - lum));
  col += (hash21(gl_FragCoord.xy * 1.37 + 91.3) - 0.5) / 255.0;

  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  fragColor = vec4(col, 1.0);
}
`;

/* ─────────────────────────────── engine ───────────────────────────────── */

function compileShader(gl, type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`atmospheres: shader compile failed - ${log}`);
  }
  return sh;
}

function linkProgram(gl, fragSrc){
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`atmospheres: program link failed - ${log}`);
  }
  return prog;
}

function makeProgram(gl, fragSrc, names){
  const id = linkProgram(gl, fragSrc);
  const u = {};
  for(const n of names) u[n] = gl.getUniformLocation(id, n);
  return { id, u };
}

export function mount(canvas, config = {}, opts = {}){
  // Fired once, right after the first frame actually reaches the screen, so the
  // caller can fade the canvas in instead of letting the sky pop on abruptly.
  let onReady = typeof opts.onReady === 'function' ? opts.onReady : null;
  const params = { ...SORA_DEFAULTS, ...(config.params || null) };
  const camera = { ...CAMERA_DEFAULTS, ...(config.camera || null) };
  const seed = Number.isFinite(config.seed)
    ? config.seed
    : (1000 + Math.floor(Math.random() * 89000));

  const gl = canvas.getContext('webgl2', {
    antialias: false, alpha: false, depth: false, stencil: false,
    premultipliedAlpha: false, preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });
  if(!gl){
    // No WebGL2 - the caller shows the static poster instead of the live sky.
    return { failed: true, play(){}, renderOnce(){}, setOcclusion(){}, dispose(){} };
  }
  // RGBA16F render targets must be color-renderable for the HDR pipeline.
  gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');

  let progs = null;
  let vao = null, vbo = null;
  let rts = null;
  let drawW = 0, drawH = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  let lowered = false;
  let occl = null;   // {x0,y0,x1,y1} normalized rect (y from top) the sky is hidden behind, or null

  function buildGL(){
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    progs = {
      sora: makeProgram(gl, SORA_FRAG, ['u_res', 'u_time', 'u_seed', 'u_sunPos',
        'u_glow', 'u_warm', 'u_coverage', 'u_soft', 'u_scale', 'u_billow', 'u_cirrus', 'u_haze']),
      defocus: makeProgram(gl, DEFOCUS_FRAG,
        ['u_tex', 'u_res', 'u_amount', 'u_edge', 'u_hi', 'u_type', 'u_taps']),
      bright: makeProgram(gl, BRIGHT_FRAG, ['u_tex', 'u_px']),
      down: makeProgram(gl, DOWN_FRAG, ['u_tex', 'u_px']),
      up: makeProgram(gl, UP_FRAG, ['u_low', 'u_same', 'u_px']),
      final: makeProgram(gl, FINAL_FRAG, ['u_scene', 'u_bloom', 'u_res',
        'u_bloomAmt', 'u_ev', 'u_vig', 'u_grain', 'u_gtime']),
    };
  }

  function makeRT(w, h){
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
  }

  function freeRTs(){
    if(!rts) return;
    for(const rt of [rts.scene, rts.lens, ...rts.bloomA, ...rts.bloomB]){
      gl.deleteTexture(rt.tex);
      gl.deleteFramebuffer(rt.fbo);
    }
    rts = null;
  }

  function allocRTs(w, h){
    freeRTs();
    // The HDR sky and lens defocus render at half resolution: the procedural
    // cloud pass is the per-frame bottleneck, and the defocus blur + final grade
    // (composited to screen at full res) hide the upscale. The bloom pyramid and
    // the final pass stay full-res, so the glow spread, grain and vignette are
    // unchanged.
    const sw = Math.max(1, w >> 1), sh = Math.max(1, h >> 1);
    // bloom pyramid: half / quarter / eighth res. bloomB needs only [0],[1].
    const bloomA = [], bloomB = [];
    for(let i = 0; i < 3; i++){
      const s = Math.max(1, w >> (i + 1)), t = Math.max(1, h >> (i + 1));
      bloomA.push(makeRT(s, t));
      if(i < 2) bloomB.push(makeRT(s, t));
    }
    rts = { scene: makeRT(sw, sh), lens: makeRT(sw, sh), bloomA, bloomB };
  }

  // Returns true when the backing store actually changed - reassigning
  // canvas.width/height blanks the WebGL drawing buffer, so callers must repaint
  // synchronously (not wait for the next throttled tick) to avoid a flash.
  function resize(){
    const cw = canvas.clientWidth || canvas.width || window.innerWidth;
    const ch = canvas.clientHeight || canvas.height || window.innerHeight;
    const w = Math.max(1, Math.round(cw * dpr));
    const h = Math.max(1, Math.round(ch * dpr));
    if(w === drawW && h === drawH && rts) return false;
    drawW = w; drawH = h;
    canvas.width = w; canvas.height = h;
    allocRTs(w, h);
    uploadConstUniforms();   // u_res + static params changed with the new targets
    return true;
  }

  function begin(prog, target){
    gl.useProgram(prog.id);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.w : drawW, target ? target.h : drawH);
  }
  function bindTex(unit, tex, loc){
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }
  function draw(){ gl.drawArrays(gl.TRIANGLES, 0, 3); }

  // The visible sky is a frame around the app window. Given the window's
  // normalized rect `o` (y measured from the top), return the framebuffer-space
  // scissor bands (origin bottom-left) covering everything EXCEPT a core inset by
  // `m` px - so a ring of real sky survives inside the window edge for its rounded
  // corners and the defocus reach. null => the core swallowed the frame, so the
  // caller should just draw fullscreen.
  function scissorBands(W, H, o, m){
    const x0 = Math.min(W, Math.ceil(o.x0 * W) + m);
    const x1 = Math.max(0, Math.floor(o.x1 * W) - m);
    const yBot = Math.min(H, Math.ceil((1 - o.y1) * H) + m);
    const yTop = Math.max(0, Math.floor((1 - o.y0) * H) - m);
    if(x1 <= x0 || yTop <= yBot) return null;
    const bands = [];
    if(yBot > 0) bands.push([0, 0, W, yBot]);
    if(yTop < H) bands.push([0, yTop, W, H - yTop]);
    if(x0 > 0)   bands.push([0, yBot, x0, yTop - yBot]);
    if(x1 < W)   bands.push([x1, yBot, W - x1, yTop - yBot]);
    return bands;
  }
  // Draw the current program across the whole target, or - when `bands` is set -
  // only those visible bands, with the hidden core cleared to a flat tint. This
  // is what skips the fragment work behind the window.
  function drawOccluded(bands){
    if(!bands){ draw(); return; }
    gl.clearColor(OCCLUDED_TINT[0], OCCLUDED_TINT[1], OCCLUDED_TINT[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);
    for(const [x, y, w, h] of bands){ gl.scissor(x, y, w, h); draw(); }
    gl.disable(gl.SCISSOR_TEST);
  }

  // Static params + resolution: upload once per (re)build/resize, not per frame.
  // render() then only re-sends the per-frame clocks and texture binds.
  function uploadConstUniforms(){
    if(!progs || !rts) return;
    const s = progs.sora;
    gl.useProgram(s.id);
    gl.uniform2f(s.u.u_res, rts.scene.w, rts.scene.h);
    gl.uniform1f(s.u.u_seed, seed);
    gl.uniform2f(s.u.u_sunPos, params.sunX, params.sunY);
    gl.uniform1f(s.u.u_glow, params.glow);
    gl.uniform1f(s.u.u_warm, params.warm);
    gl.uniform1f(s.u.u_coverage, params.coverage);
    gl.uniform1f(s.u.u_soft, params.soft);
    gl.uniform1f(s.u.u_scale, params.scale);
    gl.uniform1f(s.u.u_billow, params.billow);
    gl.uniform1f(s.u.u_cirrus, params.cirrus);
    gl.uniform1f(s.u.u_haze, params.haze);

    const d = progs.defocus;
    gl.useProgram(d.id);
    gl.uniform2f(d.u.u_res, rts.lens.w, rts.lens.h);
    gl.uniform1f(d.u.u_amount, camera.defocus * 0.028);
    gl.uniform1f(d.u.u_edge, camera.edge);
    gl.uniform1f(d.u.u_hi, camera.highlights);
    gl.uniform1f(d.u.u_type, camera.type);
    gl.uniform1i(d.u.u_taps, TAPS);

    const f = progs.final;
    gl.useProgram(f.id);
    gl.uniform2f(f.u.u_res, drawW, drawH);
    gl.uniform1f(f.u.u_bloomAmt, params.bloom);
    gl.uniform1f(f.u.u_ev, params.ev);
    gl.uniform1f(f.u.u_vig, params.vig);
    gl.uniform1f(f.u.u_grain, params.grain);
  }

  let uTime = 40, gTime = 0;   // warm-start the drift clock (matches the original opening frame)
  function render(){
    if(!rts || !progs) return;
    gl.bindVertexArray(vao);

    // Visible bands of the (half-res) sky/lens targets - same dims, so one set
    // serves both passes. Margin = defocus reach + window corner radius + slack.
    const m = occl
      ? Math.ceil(camera.defocus * 0.028 * rts.scene.h
          + OCC_CORNER_CSS * dpr * (rts.scene.h / drawH) + 2)
      : 0;
    const bands = occl ? scissorBands(rts.scene.w, rts.scene.h, occl, m) : null;

    /* 1 · the sky - procedural HDR (skipped behind the app window) */
    const s = progs.sora;
    begin(s, rts.scene);
    gl.uniform1f(s.u.u_time, uTime);
    drawOccluded(bands);

    /* 2 · aperture defocus (also skipped behind the window) */
    let src = rts.scene;
    if(camera.defocus > 0.001){
      const d = progs.defocus;
      begin(d, rts.lens);
      bindTex(0, src.tex, d.u.u_tex);
      drawOccluded(bands);
      src = rts.lens;
    }

    /* 3 · threshold bloom - bright → down×2 → up×2 */
    const b = progs.bright;
    begin(b, rts.bloomA[0]);
    bindTex(0, src.tex, b.u.u_tex);
    gl.uniform2f(b.u.u_px, 1 / rts.bloomA[0].w, 1 / rts.bloomA[0].h);
    draw();
    for(let i = 1; i < 3; i++){
      const dn = progs.down;
      begin(dn, rts.bloomA[i]);
      bindTex(0, rts.bloomA[i - 1].tex, dn.u.u_tex);
      gl.uniform2f(dn.u.u_px, 1 / rts.bloomA[i - 1].w, 1 / rts.bloomA[i - 1].h);
      draw();
    }
    let lower = rts.bloomA[2];
    for(let i = 1; i >= 0; i--){
      const up = progs.up;
      begin(up, rts.bloomB[i]);
      bindTex(0, lower.tex, up.u.u_low);
      bindTex(1, rts.bloomA[i].tex, up.u.u_same);
      gl.uniform2f(up.u.u_px, 1 / rts.bloomB[i].w, 1 / rts.bloomB[i].h);
      draw();
      lower = rts.bloomB[i];
    }

    /* 4 · tonemap + grade + vignette + grain → screen */
    const f = progs.final;
    begin(f, null);
    bindTex(0, src.tex, f.u.u_scene);
    bindTex(1, rts.bloomB[0].tex, f.u.u_bloom);
    gl.uniform1f(f.u.u_gtime, gTime);
    draw();

    // First real frame is on screen - signal the caller once so it can fade in.
    if(onReady){ const cb = onReady; onReady = null; cb(); }
  }

  /* ── loop · throttled to TARGET_FPS, gated on visibility ── */
  const FRAME_MS = 1000 / TARGET_FPS;
  let slowFrames = 0;
  let wantPlay = true;
  // If IntersectionObserver exists it owns visibility (its first callback fires
  // right after observe), so start hidden to avoid a render burst when mounted
  // off-screen. Without IO there's no gate, so assume visible.
  let onScreen = !('IntersectionObserver' in window);
  let pageVisible = !document.hidden;
  let running = false, rafId = 0, lastRender = 0;

  const shouldRun = () => wantPlay && onScreen && pageVisible;

  // Drop DPR to 1.0 only after sustained slowness - a transient stall (one janky
  // frame from unrelated main-thread work) must not permanently degrade quality.
  function adapt(dtMS){
    if(lowered || dpr <= 1.0) return;
    if(dtMS > FRAME_MS * 1.5){
      if(++slowFrames >= 30){ lowered = true; dpr = 1.0; if(resize()) render(); }
    } else {
      slowFrames = 0;
    }
  }

  function loop(now){
    if(!running) return;
    rafId = requestAnimationFrame(loop);
    const elapsed = now - lastRender;
    if(elapsed < FRAME_MS - 1) return;          // skip frames between target-fps ticks
    lastRender = now;
    const dt = Math.min(elapsed / 1000, 0.05);
    uTime += dt * (params.drift ?? 0.5);
    gTime += dt;
    render();
    adapt(elapsed);
  }

  function ensureRunning(){
    if(running || !shouldRun() || !rts) return;
    running = true;
    lastRender = performance.now() - FRAME_MS;  // render on the very next frame
    rafId = requestAnimationFrame(loop);
  }
  function stopLoop(){
    running = false;
    if(rafId){ cancelAnimationFrame(rafId); rafId = 0; }
  }
  function sync(){ if(shouldRun()) ensureRunning(); else stopLoop(); }

  /* ── gates ── */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        sync();
      }, { threshold: 0 })
    : null;
  io?.observe(canvas);

  const onVisibility = () => { pageVisible = !document.hidden; sync(); };
  // Repaint in the same task as the resize so the blanked buffer is never shown
  // (and so a paused/reduced-motion sky survives the resize).
  const onResize = () => { if(resize()) render(); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize);

  /* ── context loss / restore (the one liability three.js handled for us) ── */
  const onLost = (e) => { e.preventDefault(); stopLoop(); };
  const onRestored = () => {
    progs = null; rts = null; drawW = 0; drawH = 0; lowered = false;
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    buildGL();
    resize();
    render();   // repaint immediately; the restored surface starts blank
    sync();
  };
  canvas.addEventListener('webglcontextlost', onLost, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);

  try {
    buildGL();
  } catch {
    // Some GPUs/drivers - notably weaker mobile ones - reject the heavy WebGL2
    // sky shader at compile/link time (often with an empty info log). Degrade to
    // no sky rather than throwing; the hero renders fine without the cloud layer.
    stopLoop();
    io?.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    return { failed: true, play(){}, renderOnce(){}, setOcclusion(){}, dispose(){} };
  }
  resize();
  ensureRunning();

  return {
    play(p){ wantPlay = !!p; sync(); },
    // Mark the rectangle the app window hides (normalized 0..1, y from top), or
    // null to render the full sky. The next frame skips the sky + lens work there;
    // when paused/static, repaint immediately so the change shows.
    setOcclusion(rect){
      if(!rect){
        occl = null;
      } else {
        const x0 = Math.max(0, Math.min(1, rect.x0)), y0 = Math.max(0, Math.min(1, rect.y0));
        const x1 = Math.max(0, Math.min(1, rect.x1)), y1 = Math.max(0, Math.min(1, rect.y1));
        occl = (x1 > x0 && y1 > y0) ? { x0, y0, x1, y1 } : null;
      }
      if(!running && rts && progs) render();
    },
    // Compose exactly one frame, regardless of the loop/gates - used to paint a
    // static sky for prefers-reduced-motion deterministically (no frame-timing race).
    renderOnce(){ render(); },
    dispose(){
      stopLoop();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      freeRTs();
      if(progs){
        for(const k in progs) gl.deleteProgram(progs[k].id);
        progs = null;
      }
      if(vbo) gl.deleteBuffer(vbo);
      if(vao) gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
