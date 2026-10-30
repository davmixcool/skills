/**
 * A score made in Web Audio and rendered offline, on the film's own timeline: a pad under it all,
 * a soft boom and a bell on each cut, a whoosh into the product, a chime on each step of its
 * moment, and a chord under the wordmark. Seeded noise, so every render sounds the same.
 *
 * Use it when the film has no music of its own (or a mood the stock tracks don't have: a
 * Halloween clip). With a music file instead, delete this and pass `--audio` to the exporter.
 */
import { DURATION, SHOT, MOMENT } from './timeline.js';
import { ITEMS } from './draw.js';

const SR = 48000;
function seeded(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/** The whole score as an AudioBuffer (stereo, 48 kHz). */
export async function renderScore() {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * DURATION), SR);
  const rnd = seeded(7);
  const noise = (len) => { const b = ctx.createBuffer(1, Math.ceil(SR * len), SR); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; return b; };
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ctx.destination);
  const master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp);
  const verb = ctx.createConvolver();
  { const len = 3, ir = ctx.createBuffer(2, SR * len, SR); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 3); } verb.buffer = ir; }
  const verbIn = ctx.createGain(); verbIn.gain.value = 0.5; verbIn.connect(verb).connect(master);
  const out = (node, dry = 1, wet = 0.3) => { const d = ctx.createGain(); d.gain.value = dry; node.connect(d).connect(master); const w = ctx.createGain(); w.gain.value = wet; node.connect(w).connect(verbIn); };
  const env = (g, at, peak, a, r) => { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + a + r); };

  // the pad: a soft minor chord, filtered, rising a little into the product
  {
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, 0); g.gain.exponentialRampToValueAtTime(0.06, 1.5);
    g.gain.setValueAtTime(0.06, DURATION - 2); g.gain.exponentialRampToValueAtTime(0.0001, DURATION);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, 0); lp.frequency.linearRampToValueAtTime(1400, SHOT.product + 1); lp.frequency.linearRampToValueAtTime(700, DURATION);
    for (const f of [110, 130.8, 164.8, 220.6]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(lp); o.start(0); o.stop(DURATION); }
    lp.connect(g); out(g, 0.8, 0.6);
  }
  const boom = (at, peak = 0.5) => {
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(62, at); o.frequency.exponentialRampToValueAtTime(32, at + 1.2);
    const g = ctx.createGain(); env(g, at, peak, 0.01, 1.3); o.connect(g); out(g, 1, 0.3); o.start(at); o.stop(at + 1.5);
  };
  const bell = (at, f, peak = 0.08, ring = 2.4) => [[1, 1], [2.76, 0.5], [5.4, 0.25]].forEach(([m, v], i) => {
    const o = ctx.createOscillator(); o.frequency.value = f * m; const g = ctx.createGain(); env(g, at, peak * v, 0.004, ring / (1 + i * 0.6));
    o.connect(g); out(g, 0.7, 0.9); o.start(at); o.stop(at + ring + 0.2);
  });
  const whoosh = (at, len, from, to, peak = 0.08) => {
    const n = ctx.createBufferSource(); n.buffer = noise(len + 0.1);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1; bp.frequency.setValueAtTime(from, at); bp.frequency.exponentialRampToValueAtTime(to, at + len);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + len * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    n.connect(bp).connect(g); out(g, 1, 0.35); n.start(at);
  };

  boom(SHOT.product, 0.45); whoosh(SHOT.product - 0.5, 0.7, 400, 2600); bell(SHOT.product + 0.02, 220, 0.08);
  ITEMS.forEach((_, i) => bell(MOMENT[0] + ((MOMENT[1] - MOMENT[0]) * (i + 0.5)) / ITEMS.length, [523.3, 587.3, 659.3, 784][i % 4], 0.05, 1.2));
  boom(SHOT.end, 0.45);
  [[110, 0.1], [164.8, 0.08], [220, 0.07], [261.6, 0.06]].forEach(([f, p]) => bell(SHOT.end + 0.03, f, p, 3.2));
  return ctx.startRendering();
}

/** An AudioBuffer as a 16-bit WAV, base64, for the exporter (window.scoreWav). */
export function wavBase64(buf) {
  const ch = buf.numberOfChannels, n = buf.length, bytes = 44 + n * ch * 2;
  const dv = new DataView(new ArrayBuffer(bytes));
  const str = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
  dv.setUint16(22, ch, true); dv.setUint32(24, buf.sampleRate, true); dv.setUint32(28, buf.sampleRate * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
  const u8 = new Uint8Array(dv.buffer); let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(bin);
}
