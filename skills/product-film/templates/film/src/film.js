/**
 * The film: one three.js scene, every frame a pure function of time (renderFrame(t)), the words a
 * sharp DOM layer on top, light or dark. Three sample shots show the pattern; replace them with
 * the film's own (timeline.js holds when each starts):
 *
 *   open     cards drifting in depth, the problem in a headline
 *   product  the product on a glass slab, its moment playing out on the word that names it
 *   end      the wordmark and the tagline. No call to action.
 *
 * URL flags: ?size=1080x1080 (the frame: 1920x1080 by default; social posts want the square first),
 * ?theme=light, ?t=6 (open on a moment), ?clean (no words: for store images and posters), ?export (no
 * player; the exporter drives renderFrame).
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { canvas, drawCard, drawWindow, setMode } from './draw.js';
import { DURATION, V, SHOT, MOMENT } from './timeline.js';

const params = new URLSearchParams(location.search);
// The frame. Every frame size keeps the height (1080), so words keep their size; a wider frame shows
// more at the sides, a square one less: lay each shot out for the square first when it's for social.
const [W, H] = (params.get('size') || '1920x1080').split('x').map(Number);
const stageEl = document.getElementById('stage'), glEl = document.getElementById('gl');
Object.assign(stageEl.style, { width: `${W}px`, height: `${H}px` });
glEl.width = W; glEl.height = H; Object.assign(glEl.style, { width: `${W}px`, height: `${H}px` });
const EXPORT = params.has('export');
const LIGHT = params.get('theme') === 'light';
const CLEAN = params.has('clean');
if (CLEAN) document.getElementById('words').style.display = 'none';
if (EXPORT) document.body.classList.add('export');
if (LIGHT) { document.body.classList.add('light'); setMode('light'); }

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
/** 0 before a, 1 after b, linear between: the building block of every move. */
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = {
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  out: (k) => 1 - Math.pow(1 - k, 3),
  outQuart: (k) => 1 - Math.pow(1 - k, 4),
  inOutQuint: (k) => (k < 0.5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2),
};
/** Seeded randomness: every render of a frame is the same. Never Math.random(). */
function seeded(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const deg = (d) => (d * Math.PI) / 180;

/* ---------- renderer, scene, post ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: glEl, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 500);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const key = new THREE.DirectionalLight(0xffffff, LIGHT ? 1.8 : 1.4); key.position.set(-4, 6, 8); scene.add(key);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.001, maxblur: 0.009 });
composer.addPass(bokeh);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), LIGHT ? 0.12 : 0.4, 0.8, 1.02));
// A vignette and an invisible dither against banding. No film grain: it reads as TV noise and
// multiplies the file size. No colour fringe either: it splits white UI's edges into red and blue near
// the frame's sides.
const finish = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, vignette: { value: LIGHT ? 0.14 : 0.42 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float vignette; varying vec2 vUv;
    float rand(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float d = dot(c, c);
      vec4 col = vec4(texture2D(tDiffuse, vUv).rgb, 1.0);
      col.rgb *= 1.0 - vignette * smoothstep(0.08, 0.62, d * 1.6);
      col.rgb += (rand(gl_FragCoord.xy) - 0.5) / 255.0;
      gl_FragColor = col;
    }`,
});
composer.addPass(finish);
composer.addPass(new OutputPass());
/** How far a point is in front of the camera: the bokeh's focus distance. */
const depthOf = (p) => { camera.updateMatrixWorld(); return -p.clone().applyMatrix4(camera.matrixWorldInverse).z; };

/* ---------- textures, grounds, glass ---------- */
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }
/** A background: a soft radial light, one per mood. */
function ground(x, y, colors) {
  const c = canvas(W, H), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, Math.max(W, H) * 0.85);
  colors.forEach(([at, col]) => g.addColorStop(at, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  return tex(c);
}
const GROUNDS = LIGHT ? {
  night: ground(0.5, 0.42, [[0, '#ffffff'], [0.5, '#f1f1f4'], [1, '#dcdce3']]),
  violet: ground(0.55, 0.35, [[0, '#fbf8ff'], [0.5, '#eeeaf6'], [1, '#d8d4e6']]),
  dawn: ground(0.5, 0.75, [[0, '#fff7f0'], [0.45, '#f2eef2'], [1, '#dcd9e2']]),
} : {
  night: ground(0.5, 0.42, [[0, '#1a1f33'], [0.45, '#0b0e18'], [1, '#040508']]),
  violet: ground(0.55, 0.35, [[0, '#2a1f45'], [0.5, '#0f0c1c'], [1, '#050409']]),
  dawn: ground(0.5, 0.75, [[0, '#3b2a3a'], [0.4, '#141220'], [1, '#050508']]),
};
const FADE = (() => {
  const c = canvas(8, 256), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#000'); g.addColorStop(0.55, '#000'); g.addColorStop(1, '#fff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 256);
  return new THREE.CanvasTexture(c);
})();
const GLOW = (() => {
  const c = canvas(256, 256), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.35, 'rgba(255,255,255,.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
/**
 * The glass: a rounded rectangle with the face's own corner radius, extruded with a slight bevel. (A
 * RoundedBoxGeometry can only be as round as it is thin, so square-ish corners poke out behind a face
 * with rounder ones.)
 */
function roundedBody(w, h, depth, r) {
  const b = 0.012, x = -w / 2 + b, y = -h / 2 + b, W2 = w - 2 * b, H2 = h - 2 * b, R = Math.max(0.001, r - b);
  const s = new THREE.Shape();
  s.moveTo(x + R, y); s.lineTo(x + W2 - R, y); s.absarc(x + W2 - R, y + R, R, -Math.PI / 2, 0);
  s.lineTo(x + W2, y + H2 - R); s.absarc(x + W2 - R, y + H2 - R, R, 0, Math.PI / 2);
  s.lineTo(x + R, y + H2); s.absarc(x + R, y + H2 - R, R, Math.PI / 2, Math.PI);
  s.lineTo(x, y + R); s.absarc(x + R, y + R, R, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 24 });
  g.translate(0, 0, -(depth - 2 * b) / 2);
  return g;
}
/**
 * Glass with a drawn face, and its reflection on the floor. The product always sits on one of these.
 * `radius` is the face's corner radius in world units (the drawing's corner radius × w / its width), so
 * the glass and the face meet cleanly. `body` is the glass's colour: for a white window, its own light
 * grey, so the edge reads as the window's thickness rather than a dark rim.
 */
function slab(face, w, h, { depth = 0.14, radius = 0.1, reflect = true, body = LIGHT ? 0xe4e5ea : 0x1a1b20 } = {}) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(roundedBody(w, h, depth, radius),
    new THREE.MeshPhysicalMaterial({ color: body, metalness: LIGHT ? 0.2 : 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.25 })));
  const map = tex(face);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false }));
  front.position.z = depth / 2 + 0.002;
  g.add(front);
  if (reflect) {
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, opacity: LIGHT ? 0.12 : 0.16, alphaMap: FADE, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
    mirror.scale.y = -1; mirror.position.set(0, -h - 0.04, depth / 2);
    g.add(mirror);
  }
  g.userData = { map, face, w, h };
  return g;
}
/** Specks of light drifting in depth: they sell the space. */
function dust(count, spread, seed, color) {
  const rnd = seeded(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { pos[i * 3] = (rnd() - 0.5) * spread.x; pos[i * 3 + 1] = (rnd() - 0.5) * spread.y; pos[i * 3 + 2] = -rnd() * spread.z + spread.z0; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.06, map: GLOW, transparent: true, depthWrite: false, color: LIGHT ? 0x8a86a6 : color, opacity: LIGHT ? 0.35 : 0.55, blending: LIGHT ? THREE.NormalBlending : THREE.AdditiveBlending }));
}

/* ---------- 1. Open: cards drifting in depth ---------- */
const CARDS = [
  ['Inbox (12)', '#ea4335'], ['Q4 roadmap', '#111111'], ['Launch plan', '#1a73e8'], ['Design review', '#a259ff'],
  ['Weekly sync', '#0f9d58'], ['Billing settings', '#635bff'], ['Bug triage', '#24292f'], ['Release notes', '#f4b400'],
  ['Customer call', '#00a2ff'], ['Hiring pipeline', '#ff7a59'], ['Budget 2027', '#188038'], ['Metrics review', '#ff6d01'],
];
const cardCanvases = CARDS.map(() => canvas(640, 128));
const cardTex = cardCanvases.map(tex);
const paintCards = () => cardCanvases.forEach((c, i) => { drawCard(c.getContext('2d'), { title: CARDS[i][0], color: CARDS[i][1] }); cardTex[i].needsUpdate = true; });
const open = new THREE.Group();
scene.add(open);
const openCards = [];
{
  const rnd = seeded(7), geo = new THREE.PlaneGeometry(2.7, 0.54);
  for (let i = 0; i < 60; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: cardTex[i % CARDS.length], transparent: true, toneMapped: false, side: THREE.DoubleSide }));
    m.userData = { x: (rnd() - 0.5) * 26, y: (rnd() - 0.5) * 11, z: -rnd() * 30, spin: (rnd() - 0.5) * 0.6, phase: rnd() * 6 };
    open.add(m); openCards.push(m);
  }
  open.add(dust(700, { x: 40, y: 16, z: 40, z0: 6 }, 3, 0xbfc8ff));
}

/* ---------- 2. Product: the window on glass ---------- */
const windowCanvas = canvas(2400, 1500);
const WIN_W = 6.4, WIN_H = WIN_W * (1500 / 2400);
// drawWindow's corner radius is 24 at 1600 wide
const productSlab = slab(windowCanvas, WIN_W, WIN_H, { radius: WIN_W * 24 / 1600 });
const product = new THREE.Group();
product.add(productSlab, dust(400, { x: 18, y: 10, z: 16, z0: 4 }, 11, 0xd9c6ff));
scene.add(product);
// No glowing halo behind the product by default: many people find glows cheap. Light the object itself,
// and add a halo only when someone asks for one.
let drawnK = -1;
/** Repaint only when the moment moved: canvas uploads are the slow part of a frame. */
function paintWindow(k) {
  const q = Math.round(k * 600) / 600;
  if (q === drawnK) return;
  drawnK = q;
  drawWindow(windowCanvas.getContext('2d'), q);
  productSlab.userData.map.needsUpdate = true;
}

/* ---------- 3. End ---------- */
const end = new THREE.Group();
end.add(dust(500, { x: 30, y: 14, z: 20, z0: 4 }, 21, 0xffe2c8));
scene.add(end);

/* ---------- words ---------- */
const words = document.getElementById('words');
/** The product's mark, inline SVG in currentColor. Replace with the real one. */
const MARK = '<svg viewBox="0 0 64 64" width="84" height="84" aria-hidden="true"><rect x="8" y="8" width="48" height="48" rx="14" fill="currentColor"/></svg>';
/** Each line: when it comes in (at) and goes (to), its HTML, its classes (index.html), and its top in px. Time `at` to the voice's words (timeline.js). */
const LINES = [
  { at: V + 0.1, to: SHOT.product - 0.2, html: 'Too much to keep track of?', cls: 'lg grad', top: 200 },
  { at: SHOT.product + 0.4, to: SHOT.end - 0.25, html: 'Your product,<br>doing its one thing.<div class="md" style="margin-top:24px">Say what it does,<br>in the words it uses.</div>', cls: 'left lg', top: 360 },
  { at: SHOT.end + 0.4, to: 99, html: `<div class="brand lg">${MARK}<span>Product</span></div>`, cls: '', top: 420 },
  { at: SHOT.end + 1.2, to: 99, html: 'The tagline, and nothing after it.', cls: 'md', top: 560 },
];
for (const l of LINES) { const el = document.createElement('div'); el.className = `w ${l.cls}`; el.innerHTML = l.html; el.style.top = `${l.top}px`; words.append(el); l.el = el; }
/** Words come in from a blur and rise a little; they leave the same way, quicker. */
function paintWords(t) {
  for (const l of LINES) {
    const kIn = ease.outQuart(seg(t, l.at, l.at + 0.55)), kOut = ease.out(seg(t, l.to - 0.35, l.to));
    const k = kIn * (1 - kOut);
    l.el.style.display = k <= 0.001 ? 'none' : '';
    if (k <= 0.001) continue;
    l.el.style.opacity = k.toFixed(3);
    l.el.style.filter = `blur(${((1 - kIn) * 14 + kOut * 10).toFixed(2)}px)`;
    l.el.style.transform = `translateY(${((1 - kIn) * 26 - kOut * 12).toFixed(1)}px)`;
  }
}

/* ---------- the frame ---------- */
function renderFrame(t) {
  open.visible = t < SHOT.product;
  product.visible = t >= SHOT.product && t < SHOT.end;
  end.visible = t >= SHOT.end;
  let focus = 10, aperture = 0.001;

  if (open.visible) {
    scene.background = GROUNDS.night;
    for (const m of openCards) {
      const u = m.userData;
      m.position.set(u.x + Math.sin(t * 0.3 + u.phase) * 0.3, u.y + Math.sin(t * 0.5 + u.phase) * 0.15, u.z);
      m.rotation.set(Math.sin(t * 0.4 + u.phase) * 0.1, u.spin + Math.sin(t * 0.2 + u.phase) * 0.2, Math.sin(t * 0.3 + u.phase) * 0.05);
    }
    // a slow push through the cards; the camera never stops moving
    camera.position.set(Math.sin(t * 0.2) * 0.6, 0.4, 12 - t * 1.6);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, camera.position.z - 12);
    focus = 9; aperture = 0.0012;
  }

  if (product.visible) {
    scene.background = GROUNDS.violet;
    const local = t - SHOT.product;
    paintWindow(ease.inOut(seg(t, MOMENT[0], MOMENT[1])));
    // arrive from far and above, then drift: a slow push in and a slight turn
    const arrive = ease.outQuart(seg(local, 0, 1.8));
    productSlab.rotation.set(deg(3), deg(-18) + local * 0.012, 0);
    productSlab.position.set(3.3, 0.1 + Math.sin(t * 0.6) * 0.04, 0);
    camera.position.set(-0.4 + local * 0.04, lerp(3, 0.3, arrive), lerp(24, 14.4, arrive) - local * 0.12);
    camera.up.set(0, 1, 0);
    camera.lookAt(1.5, 0.1, 0);
    focus = depthOf(productSlab.position); aperture = 0.0008;
  }

  if (end.visible) {
    scene.background = GROUNDS.night;
    const local = t - SHOT.end;
    camera.position.set(Math.sin(local * 0.12) * 0.8, 0.3, 13 - local * 0.1);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0.3, 0);
    focus = 13; aperture = 0.0012;
  }

  bokeh.uniforms.focus.value = focus;
  bokeh.uniforms.aperture.value = aperture;
  // a wash on the left while words sit beside the product
  document.getElementById('scrim').style.opacity = (seg(t, SHOT.product, SHOT.product + 0.6) * (1 - seg(t, SHOT.end - 0.4, SHOT.end))).toFixed(3);
  paintWords(t);
  composer.render();
}

/* ---------- start ---------- */
let ready = false;
(async () => {
  // Canvases drawn before the font loads keep the fallback font: wait, then draw.
  await Promise.all(['400 16px Inter', '500 16px Inter', '600 16px Inter', '700 16px Inter'].map((f) => document.fonts.load(f)));
  paintCards();
  drawnK = -1;
  ready = true;
  const t0 = Number(params.get('t') || 0);
  renderFrame(t0);
  if (!EXPORT) player(t0);
})();

window.FILM = { DURATION };
window.storyReady = () => ready;
window.renderFrame = renderFrame;
// With a code score (score.js), the exporter takes the audio from here. Delete with score.js.
window.scoreWav = async () => { const { renderScore, wavBase64 } = await import('./score.js'); return wavBase64(await renderScore()); };

/* ---------- the preview player: the soundtrack is the clock ---------- */
async function soundtrack() {
  const file = new Audio('./assets/soundtrack.m4a');
  const found = await new Promise((r) => { file.oncanplaythrough = () => r(true); file.onerror = () => r(false); file.load(); });
  if (found) return file;
  // no soundtrack file: play the code score instead
  const { renderScore } = await import('./score.js');
  const buf = await renderScore();
  const ctx = new AudioContext();
  let src = null, startedAt = 0, offset = 0, playing = false;
  return {
    get currentTime() { return playing ? ctx.currentTime - startedAt : offset; },
    set currentTime(v) { offset = v; if (playing) { this.pause(); this.play(); } },
    get ended() { return this.currentTime >= buf.duration; },
    async play() { await ctx.resume(); src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(0, offset); startedAt = ctx.currentTime - offset; playing = true; },
    pause() { if (!playing) return; offset = this.currentTime; src.stop(); playing = false; },
  };
}
async function player(t0) {
  const fit = () => { const s = Math.min(innerWidth / W, (innerHeight - 40) / H); stageEl.style.transform = `translate(-50%, -50%) scale(${s})`; };
  fit(); addEventListener('resize', fit);
  const scrub = document.getElementById('scrub'), time = document.getElementById('time'), play = document.getElementById('play');
  const audio = await soundtrack();
  scrub.max = DURATION;
  let t = t0, playing = false;
  const show = () => { scrub.value = t; time.textContent = t.toFixed(2); renderFrame(t); };
  scrub.oninput = () => { t = Number(scrub.value); audio.currentTime = t; show(); };
  const toggle = () => {
    playing = !playing; play.textContent = playing ? 'Pause' : 'Play';
    if (playing) { if (t >= DURATION - 0.05) t = 0; audio.currentTime = t; audio.play().catch(() => {}); requestAnimationFrame(loop); } else audio.pause();
  };
  play.onclick = toggle;
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); toggle(); } });
  function loop() {
    if (!playing) return;
    t = audio.currentTime;
    if (audio.ended || t >= DURATION) { t = DURATION; playing = false; play.textContent = 'Play'; audio.pause(); }
    show();
    if (playing) requestAnimationFrame(loop);
  }
  show();
}
