/**
 * When everything happens, in film seconds: the one place the picture (film.js), the words
 * and the sound (score.js, or the music's grid) agree on. Cut on beats or on the voice's lines:
 * if there's a voice-over, take its times from `tools/voice.mjs --at V`.
 */
export const DURATION = 16;
export const V = 0.8; // where the voice starts, if there is one

/** The shots, in order: each runs until the next starts. */
export const SHOT = {
  open: 0,     // the problem, in a line, over cards drifting in depth
  product: 4,  // the product on a glass panel; its moment plays out
  end: 11.5,   // the wordmark and the tagline
};

/** The product's moment, 0 → 1, plays out between these (film.js passes it to drawWindow). */
export const MOMENT = [6.2, 9.4];
