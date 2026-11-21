// The difference table for every level. Each difference names the thing that
// changes, where it sits in panel space (0..560 wide, 0..400 tall), how close
// a click must land, and a short label the game shows when it is found. The
// scene painters in scenes.js read the same table, so the picture on the
// right changes exactly where the table says it does. Every difference is a
// fair one: the same object, changed — never pixel noise.
//
// A difference entry:
//   id     stable key, also used by the painter to apply the change
//   x, y   centre in panel coordinates
//   r      hit radius in panel pixels
//   label  short human name, shown on find
export const DIFFERENCES = [
  // Level 1 — Lantern Market at Dusk: 7 differences, 180 seconds.
  [
    { id: 'moon', x: 72, y: 52, r: 30, label: 'the moon' },
    { id: 'cat-tail', x: 468, y: 322, r: 30, label: "the cat's tail" },
    { id: 'lantern-colour', x: 296, y: 92, r: 28, label: 'a lantern colour' },
    { id: 'apples', x: 118, y: 252, r: 30, label: 'an apple' },
    { id: 'bunting-flag', x: 282, y: 128, r: 26, label: 'a bunting flag' },
    { id: 'price-sign', x: 72, y: 201, r: 28, label: 'the price sign' },
    { id: 'puddle-star', x: 428, y: 368, r: 28, label: 'a star in the puddle' },
  ],
  // Level 2 — Koi Pond Garden: 8 differences, 150 seconds.
  [
    { id: 'koi-count', x: 306, y: 296, r: 30, label: 'a koi fish' },
    { id: 'lily-flower', x: 152, y: 282, r: 28, label: 'the lily flower' },
    { id: 'lantern-glow', x: 482, y: 178, r: 28, label: 'the stone lantern' },
    { id: 'dragonfly', x: 398, y: 108, r: 28, label: 'the dragonfly' },
    { id: 'petals', x: 498, y: 88, r: 28, label: 'a falling petal' },
    { id: 'bridge-plank', x: 282, y: 202, r: 28, label: 'a bridge plank' },
    { id: 'frog', x: 92, y: 332, r: 30, label: 'the frog' },
    { id: 'stepping-stone', x: 202, y: 362, r: 28, label: 'a stepping stone' },
  ],
  // Level 3 — Rooftop Observatory: 10 differences, 120 seconds.
  [
    { id: 'telescope-angle', x: 142, y: 182, r: 30, label: 'the telescope' },
    { id: 'constellation', x: 422, y: 72, r: 28, label: 'a constellation star' },
    { id: 'mug-steam', x: 302, y: 298, r: 28, label: 'the mug steam' },
    { id: 'poster-rocket', x: 522, y: 202, r: 30, label: 'the poster rocket' },
    { id: 'book-stack', x: 202, y: 332, r: 30, label: 'a book' },
    { id: 'saturn-ring', x: 482, y: 108, r: 28, label: "Saturn's ring" },
    { id: 'city-window', x: 62, y: 122, r: 26, label: 'a city window' },
    { id: 'moon-phase', x: 352, y: 92, r: 26, label: 'a moon phase' },
    { id: 'hat-star', x: 252, y: 152, r: 26, label: 'the hat star' },
    { id: 'clock-hands', x: 502, y: 302, r: 30, label: 'the clock hands' },
  ],
];

// Find the difference whose circle contains a click in panel space, or null.
export function differenceAt(levelIndex, px, py) {
  for (const diff of DIFFERENCES[levelIndex]) {
    const dx = px - diff.x;
    const dy = py - diff.y;
    if (dx * dx + dy * dy <= diff.r * diff.r) return diff;
  }
  return null;
}
