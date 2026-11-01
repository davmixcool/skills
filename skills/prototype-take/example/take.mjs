// The example take: the launcher opened with its shortcut, "no" typed to narrow it to Notes, Enter.
//   node ../scripts/take.mjs take.mjs out/launcher.mp4 --size 1080x1080
//   node ../scripts/take.mjs take.mjs out/launcher.mp4 --stills 1.2,3,4.6 --scale 1
export default {
  page: 'prototype.html',
  stage: { width: 1200, height: 750 },   // the prototype's own coordinates: the camera moves and scales #stage
  camera: { selector: '#stage' },
  duration: 6,
  pointer: { x: 760, y: 560 },
  // Where the camera looks, and how close (page-side, every frame): the launcher when it's open.
  focus: () => (document.querySelector('#panel').classList.contains('on')
    ? { x: 600, y: 300, k: 1.55 }
    : document.querySelector('#note').classList.contains('on') ? { x: 980, y: 140, k: 1.6 } : { x: 600, y: 420, k: 1.0 }),
  actions: [
    { at: 0.3, to: { x: 640, y: 520 }, dur: 0.6 },
    { at: 1.0, keys: ['⌥', 'Space'], press: { code: 'Space', key: ' ', alt: true } },
    { at: 1.8, type: 'no', every: 0.12 },
    { at: 2.6, to: "__take.at('#list li')", dur: 0.5 },
    { at: 3.4, keys: ['↩'], press: { code: 'Enter', key: 'Enter' } },
    { at: 4.2, to: { x: 1000, y: 160 }, dur: 0.7 },
  ],
};
