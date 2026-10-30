/**
 * The product, drawn: canvases that become textures in the 3D scene. Never screenshots: a drawing
 * stays sharp at any size, animates (a function of `k`), and switches light and dark (setMode).
 *
 * Replace the sample drawings with the product's own UI: an app window, a panel, a popup, a
 * card. Keep them faithful to the real product: the same words, layout and colours.
 */
export const FONT = 'Inter, system-ui, sans-serif';

/** Colours for both looks; P holds the current one (setMode). Add the product's own. */
const DARK = {
  window: '#1b1c20', bar: '#24252b', ink: '#eef0f3', sub: '#9aa0aa', line: 'rgba(255,255,255,.1)',
  card: '#26272d', cardEdge: 'rgba(255,255,255,.14)', accent: '#8ab4f8', accentFill: 'rgba(138,180,248,.16)', edge: 'rgba(255,255,255,.14)',
};
const LIGHT = {
  window: '#ffffff', bar: '#f3f4f6', ink: '#16181d', sub: '#6b7280', line: '#eceef1',
  card: '#ffffff', cardEdge: 'rgba(0,0,0,.1)', accent: '#1a73e8', accentFill: 'rgba(26,115,232,.1)', edge: 'rgba(0,0,0,.12)',
};
export const P = { ...DARK };
export const MODE = { light: false };
export function setMode(mode) {
  MODE.light = mode === 'light';
  Object.assign(P, MODE.light ? LIGHT : DARK);
}

export const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function font(ctx, size, weight = 500) { ctx.font = `${weight} ${size}px ${FONT}`; }
/** Text cut to a width with an ellipsis. */
export function fit(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ctx.measureText(`${text.slice(0, mid)}…`).width <= max) lo = mid; else hi = mid - 1; }
  return `${text.slice(0, lo).trimEnd()}…`;
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

/** A small card: an icon square in a colour, a title. The ribbon in the opening is made of these. */
export function drawCard(ctx, { title, color = '#5e6ad2', letter = title[0] }) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  rr(ctx, 2, 2, W - 4, H - 4, H * 0.28); ctx.fillStyle = P.card; ctx.fill();
  ctx.strokeStyle = P.cardEdge; ctx.lineWidth = 2; ctx.stroke();
  const s = H * 0.42;
  rr(ctx, H * 0.3, (H - s) / 2, s, s, s * 0.24); ctx.fillStyle = color; ctx.fill();
  font(ctx, s * 0.58, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(letter.toUpperCase(), H * 0.3 + s / 2, H / 2 + 1); ctx.textAlign = 'left';
  font(ctx, H * 0.27, 500); ctx.fillStyle = P.ink;
  ctx.fillText(fit(ctx, title, W - H * 0.3 - s - H * 0.5), H * 0.3 + s + H * 0.22, H / 2 + 1);
}

/**
 * The product's window, its moment played out by `k` (0 → 1). The sample: a list where items
 * are ticked off one by one and a progress bar fills. Replace it with the product's real UI,
 * designed at 1600 wide (it scales to the canvas).
 */
export const ITEMS = ['Plan the launch', 'Write the announcement', 'Record the demo', 'Ship it'];
export function drawWindow(ctx, k = 0) {
  const s = ctx.canvas.width / 1600, H = ctx.canvas.height / s;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, 1600, H);
  rr(ctx, 0, 0, 1600, H, 24); ctx.save(); ctx.clip();
  ctx.fillStyle = P.window; ctx.fillRect(0, 0, 1600, H);
  ctx.fillStyle = P.bar; ctx.fillRect(0, 0, 1600, 64);
  [['#ff5f57', 30], ['#febc2e', 56], ['#28c840', 82]].forEach(([c, x]) => { ctx.beginPath(); ctx.arc(x, 32, 8, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
  font(ctx, 24, 600); ctx.fillStyle = P.ink; ctx.textBaseline = 'middle'; ctx.fillText('Your product', 120, 33);
  // the list, ticked off in turn
  ITEMS.forEach((item, i) => {
    const y = 150 + i * 160;
    const done = ease(clamp(k * ITEMS.length - i));
    rr(ctx, 120, y, 1360, 120, 22); ctx.fillStyle = done > 0 ? P.accentFill : 'transparent'; ctx.globalAlpha = 0.4 + 0.6 * done; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = P.line; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(184, y + 60, 22, 0, Math.PI * 2); ctx.fillStyle = done > 0.5 ? P.accent : 'transparent'; ctx.fill();
    ctx.strokeStyle = done > 0.5 ? P.accent : P.sub; ctx.stroke();
    if (done > 0.5) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(174, y + 60); ctx.lineTo(181, y + 68); ctx.lineTo(195, y + 51); ctx.stroke(); }
    font(ctx, 38, 500); ctx.fillStyle = done > 0.5 ? P.sub : P.ink; ctx.fillText(item, 236, y + 61);
  });
  // progress
  rr(ctx, 120, H - 110, 1360, 16, 8); ctx.fillStyle = P.line; ctx.fill();
  rr(ctx, 120, H - 110, 1360 * clamp(k), 16, 8); ctx.fillStyle = P.accent; ctx.fill();
  ctx.restore();
  rr(ctx, 1, 1, 1598, H - 2, 24); ctx.strokeStyle = P.edge; ctx.lineWidth = 2; ctx.stroke();
}
