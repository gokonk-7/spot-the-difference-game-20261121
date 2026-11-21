// A tiny seeded random generator (mulberry32) so a scene can be staged the
// same way every time a screenshot is taken, while normal play still feels
// varied. A seed of 0 means "use the clock", any other seed is deterministic.
export function makeRng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an integer in [min, max) from a generator.
export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min));
}

// Pick one element of an array from a generator.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
