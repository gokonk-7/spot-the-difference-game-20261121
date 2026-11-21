// The three scenes, drawn entirely with Canvas 2D vector shapes — no raster
// assets, no images from the network. Each painter draws its scene into a
// panel rectangle; `variant` 0 draws the original, 1 draws the altered side,
// applying exactly the changes the difference table in differences.js names.
// The painters share small shape helpers so a scene reads like a list of
// props, each with its place and colour.
import { DIFFERENCES } from './differences.js';
import { makeRng } from './random.js';

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, stroke, width) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function text(ctx, s, x, y, size, fill, align = 'center', weight = 'bold') {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function changedSet(levelIndex, variant) {
  if (variant !== 1) return new Set();
  return new Set(DIFFERENCES[levelIndex].map((d) => d.id));
}

// ---------------------------------------------------------------------------
// Level 1 — Lantern Market at Dusk
// ---------------------------------------------------------------------------
function drawMarket(ctx, ox, oy, variant, rng) {
  const changed = changedSet(0, variant);
  // Dusk sky.
  const sky = ctx.createLinearGradient(0, oy, 0, oy + 400);
  sky.addColorStop(0, '#2b1d4e');
  sky.addColorStop(0.55, '#7a3b6e');
  sky.addColorStop(1, '#e8833a');
  ctx.fillStyle = sky;
  ctx.fillRect(ox, oy, 560, 400);
  // Early stars.
  for (let i = 0; i < 26; i++) {
    const sx = ox + 12 + rng() * 536;
    const sy = oy + 10 + rng() * 120;
    circle(ctx, sx, sy, 1 + rng() * 1.4, 'rgba(255, 244, 200, 0.85)');
  }
  // Moon: crescent on the left, full on the right.
  if (changed.has('moon')) {
    circle(ctx, ox + 72, oy + 52, 22, '#ffe9a8');
    circle(ctx, ox + 72, oy + 52, 20, 'rgba(255, 233, 168, 0.25)');
  } else {
    circle(ctx, ox + 72, oy + 52, 22, '#ffe9a8');
    circle(ctx, ox + 84, oy + 46, 19, '#2b1d4e');
  }
  // Distant rooftops.
  poly(ctx, [[ox, oy + 300], [ox + 90, oy + 238], [ox + 180, oy + 300]], '#241636');
  poly(ctx, [[ox + 380, oy + 300], [ox + 470, oy + 244], [ox + 560, oy + 300]], '#241636');
  // Street.
  rect(ctx, ox, oy + 300, 560, 100, '#4a3550');
  rect(ctx, ox, oy + 300, 560, 6, '#5d4465');
  // String lights across the top.
  ctx.strokeStyle = '#1c1226';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox, oy + 66);
  ctx.quadraticCurveTo(ox + 280, oy + 96, ox + 560, oy + 66);
  ctx.stroke();
  const bulbColours = ['#ffd166', '#ff6b6b', '#6ec6ff', '#9dff8a'];
  for (let i = 0; i < 11; i++) {
    const bx = ox + 26 + i * 51;
    const by = oy + 66 + Math.sin((i / 10) * Math.PI) * 22;
    line(ctx, bx, by - 4, bx, by + 2, '#1c1226', 2);
    circle(ctx, bx, by + 8, 6, bulbColours[i % 4]);
    circle(ctx, bx, by + 8, 9, 'rgba(255, 220, 120, 0.18)');
  }
  // Bunting flags below the lights.
  const flagColours = ['#ff6b6b', '#ffd166', '#6ec6ff', '#9dff8a', '#ff9de2'];
  for (let i = 0; i < 9; i++) {
    if (changed.has('bunting-flag') && i === 4) continue; // middle flag missing
    const fx = ox + 30 + i * 62;
    poly(ctx, [[fx, oy + 118], [fx + 26, oy + 118], [fx + 13, oy + 142]], flagColours[i % 5]);
  }
  line(ctx, ox, oy + 118, ox + 560, oy + 118, '#1c1226', 2);
  // Hanging paper lanterns.
  const lanternXs = [120, 200, 296, 380, 470];
  lanternXs.forEach((lx, i) => {
    const isChangedOne = lx === 296;
    const colour = isChangedOne && changed.has('lantern-colour') ? '#57c465' : '#e8483f';
    line(ctx, ox + lx, oy + 66, ox + lx, oy + 78, '#1c1226', 2);
    ellipse(ctx, ox + lx, oy + 92, 17, 20, colour);
    ellipse(ctx, ox + lx, oy + 92, 17, 20, 'rgba(255,255,255,0.12)');
    rect(ctx, ox + lx - 7, oy + 70, 14, 6, '#f7c948');
    rect(ctx, ox + lx - 7, oy + 110, 14, 6, '#f7c948');
    if (i % 2 === 0) circle(ctx, ox + lx, oy + 92, 5, 'rgba(255, 240, 180, 0.9)');
  });
  drawFruitStall(ctx, ox, oy, changed);
  drawLanternStall(ctx, ox, oy);
  drawToyStall(ctx, ox, oy);
  drawVendor(ctx, ox, oy);
  drawMarketCat(ctx, ox, oy, changed);
  // Puddle with a star reflection.
  ellipse(ctx, ox + 428, oy + 368, 46, 10, 'rgba(120, 90, 160, 0.75)');
  ellipse(ctx, ox + 428, oy + 368, 38, 7, 'rgba(190, 150, 220, 0.5)');
  if (!changed.has('puddle-star')) {
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.moveTo(ox + 428, oy + 360);
    ctx.lineTo(ox + 431, oy + 367);
    ctx.lineTo(ox + 438, oy + 367);
    ctx.lineTo(ox + 433, oy + 371);
    ctx.lineTo(ox + 435, oy + 378);
    ctx.lineTo(ox + 428, oy + 374);
    ctx.lineTo(ox + 421, oy + 378);
    ctx.lineTo(ox + 423, oy + 371);
    ctx.lineTo(ox + 418, oy + 367);
    ctx.lineTo(ox + 425, oy + 367);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFruitStall(ctx, ox, oy, changed) {
  // Awning.
  for (let i = 0; i < 5; i++) {
    poly(ctx, [[ox + 40 + i * 28, oy + 168], [ox + 68 + i * 28, oy + 168], [ox + 54 + i * 28, oy + 186]], i % 2 ? '#f2ead8' : '#d94f3d');
  }
  rect(ctx, ox + 40, oy + 168, 140, 8, '#d94f3d');
  // Counter and legs.
  rect(ctx, ox + 44, oy + 236, 132, 60, '#7a4a2b');
  rect(ctx, ox + 44, oy + 236, 132, 8, '#9c6a42');
  rect(ctx, ox + 50, oy + 296, 8, 26, '#5d361f');
  rect(ctx, ox + 162, oy + 296, 8, 26, '#5d361f');
  // Apples: five on the left, four on the right.
  const appleXs = [66, 92, 118, 144, 166];
  appleXs.forEach((ax, i) => {
    if (changed.has('apples') && i === 2) return; // one apple missing
    circle(ctx, ox + ax, oy + 252, 11, '#e8483f');
    circle(ctx, ox + ax - 3, oy + 249, 3, 'rgba(255,255,255,0.5)');
    line(ctx, ox + ax, oy + 242, ox + ax + 3, oy + 236, '#3d7a2e', 2);
  });
  // Oranges in a basket beside them.
  ellipse(ctx, ox + 96, oy + 276, 34, 12, '#b07a3a');
  circle(ctx, ox + 82, oy + 270, 8, '#ff9f1c');
  circle(ctx, ox + 98, oy + 268, 8, '#ff9f1c');
  circle(ctx, ox + 112, oy + 270, 8, '#ff9f1c');
  // Price sign hanging from the awning's left end: 5000 on the left, 5500
  // on the right. It hangs clear of the vendor so both read at a glance.
  line(ctx, ox + 58, oy + 186, ox + 58, oy + 192, '#1c1226', 2);
  line(ctx, ox + 86, oy + 186, ox + 86, oy + 192, '#1c1226', 2);
  rect(ctx, ox + 52, oy + 192, 40, 18, '#f2ead8');
  ctx.strokeStyle = '#7a4a2b';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox + 52, oy + 192, 40, 18);
  text(ctx, changed.has('price-sign') ? '5500' : '5000', ox + 72, oy + 202, 12, '#33302a');
}

function drawLanternStall(ctx, ox, oy) {
  for (let i = 0; i < 5; i++) {
    poly(ctx, [[ox + 218 + i * 26, oy + 168], [ox + 244 + i * 26, oy + 168], [ox + 231 + i * 26, oy + 186]], i % 2 ? '#f2ead8' : '#3f7fb8');
  }
  rect(ctx, ox + 218, oy + 168, 130, 8, '#3f7fb8');
  rect(ctx, ox + 222, oy + 240, 122, 56, '#5d4a2b');
  rect(ctx, ox + 222, oy + 240, 122, 8, '#8a6a42');
  // Little lanterns for sale on the counter.
  const cols = ['#ffd166', '#ff6b6b', '#6ec6ff', '#9dff8a'];
  for (let i = 0; i < 4; i++) {
    ellipse(ctx, ox + 244 + i * 28, oy + 228, 11, 13, cols[i]);
    rect(ctx, ox + 237 + i * 28, oy + 212, 14, 5, '#f7c948');
  }
}

function drawToyStall(ctx, ox, oy) {
  for (let i = 0; i < 5; i++) {
    poly(ctx, [[ox + 396 + i * 26, oy + 168], [ox + 422 + i * 26, oy + 168], [ox + 409 + i * 26, oy + 186]], i % 2 ? '#f2ead8' : '#57a773');
  }
  rect(ctx, ox + 396, oy + 168, 130, 8, '#57a773');
  rect(ctx, ox + 400, oy + 240, 122, 56, '#6a4a2b');
  rect(ctx, ox + 400, oy + 240, 122, 8, '#8a6a42');
  // Pinwheel, ball and kite on the counter.
  line(ctx, ox + 424, oy + 212, ox + 424, oy + 240, '#c9b18a', 2);
  poly(ctx, [[ox + 424, oy + 212], [ox + 436, oy + 200], [ox + 436, oy + 224]], '#ff6b6b');
  poly(ctx, [[ox + 424, oy + 212], [ox + 412, oy + 200], [ox + 412, oy + 224]], '#6ec6ff');
  circle(ctx, ox + 470, oy + 226, 12, '#ff9f1c');
  circle(ctx, ox + 470, oy + 226, 12, 'rgba(255,255,255,0.25)');
  poly(ctx, [[ox + 496, oy + 214], [ox + 514, oy + 226], [ox + 496, oy + 238]], '#ff9de2');
}

function drawVendor(ctx, ox, oy) {
  // The vendor behind the fruit stall, apron and smile.
  circle(ctx, ox + 112, oy + 196, 16, '#f2c79b');
  ctx.fillStyle = '#3a2f52';
  ctx.beginPath();
  ctx.arc(ox + 112, oy + 196, 16, Math.PI, 0);
  ctx.fill();
  rect(ctx, ox + 88, oy + 210, 48, 32, '#3f7fb8');
  rect(ctx, ox + 96, oy + 210, 32, 26, '#f2ead8');
  circle(ctx, ox + 106, oy + 194, 2, '#241636');
  circle(ctx, ox + 118, oy + 194, 2, '#241636');
  ctx.strokeStyle = '#8a4a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox + 112, oy + 200, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawMarketCat(ctx, ox, oy, changed) {
  // A grey cat sitting on a crate, tail curled — or missing on the right.
  rect(ctx, ox + 440, oy + 322, 56, 22, '#8a6a42');
  rect(ctx, ox + 440, oy + 322, 56, 5, '#a8825a');
  ellipse(ctx, ox + 468, oy + 312, 20, 14, '#9aa0a8');
  circle(ctx, ox + 468, oy + 292, 13, '#9aa0a8');
  poly(ctx, [[ox + 458, oy + 282], [ox + 462, oy + 270], [ox + 468, oy + 282]], '#9aa0a8');
  poly(ctx, [[ox + 468, oy + 282], [ox + 474, oy + 270], [ox + 478, oy + 282]], '#9aa0a8');
  if (!changed.has('cat-tail')) {
    ctx.strokeStyle = '#9aa0a8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(ox + 486, oy + 318);
    ctx.quadraticCurveTo(ox + 502, oy + 316, ox + 500, oy + 300);
    ctx.stroke();
  }
  circle(ctx, ox + 464, oy + 290, 2, '#241636');
  circle(ctx, ox + 472, oy + 290, 2, '#241636');
}

// ---------------------------------------------------------------------------
// Level 2 — Koi Pond Garden
// ---------------------------------------------------------------------------
function drawGarden(ctx, ox, oy, variant, rng) {
  const changed = changedSet(1, variant);
  // Pale morning sky and grass.
  const sky = ctx.createLinearGradient(0, oy, 0, oy + 400);
  sky.addColorStop(0, '#cfe8c0');
  sky.addColorStop(0.5, '#a8d8a0');
  sky.addColorStop(1, '#7fb069');
  ctx.fillStyle = sky;
  ctx.fillRect(ox, oy, 560, 400);
  rect(ctx, ox, oy + 300, 560, 100, '#5d8a4a');
  // Bamboo stalks on the left.
  for (let i = 0; i < 4; i++) {
    const bx = ox + 24 + i * 14;
    rect(ctx, bx, oy + 20, 7, 290, '#4e8a3a');
    line(ctx, bx, oy + 80, bx + 7, oy + 80, '#3a6a2a', 2);
    line(ctx, bx, oy + 160, bx + 7, oy + 160, '#3a6a2a', 2);
    line(ctx, bx, oy + 240, bx + 7, oy + 240, '#3a6a2a', 2);
    ellipse(ctx, bx + 16, oy + 60 + i * 8, 14, 5, '#6fae4e');
  }
  // Cherry-blossom branch across the top right.
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(ox + 560, oy + 20);
  ctx.quadraticCurveTo(ox + 470, oy + 34, ox + 400, oy + 70);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const px = ox + 420 + i * 14 + rng() * 6;
    const py = oy + 26 + rng() * 46;
    circle(ctx, px, py, 7, '#f7a8c4');
    circle(ctx, px, py, 3, '#fde3ee');
  }
  // Falling petals: three on the left, two on the right.
  const petalSpots = [[498, 88], [520, 120], [470, 140]];
  petalSpots.forEach(([px, py], i) => {
    if (changed.has('petals') && i === 2) return;
    ellipse(ctx, ox + px, oy + py, 7, 4, '#f7a8c4');
  });
  // Dragonfly, present on the left only.
  if (!changed.has('dragonfly')) {
    ellipse(ctx, ox + 398, oy + 108, 12, 4, '#7ec8e3');
    ellipse(ctx, ox + 386, oy + 100, 9, 3, 'rgba(200, 235, 255, 0.8)');
    ellipse(ctx, ox + 386, oy + 116, 9, 3, 'rgba(200, 235, 255, 0.8)');
    circle(ctx, ox + 410, oy + 108, 3, '#2b4a5a');
  }
  // Stone lantern.
  rect(ctx, ox + 462, oy + 150, 40, 12, '#8a8a7a');
  rect(ctx, ox + 470, oy + 162, 24, 30, '#9a9a8a');
  // Its window glows on the left, dark on the right.
  rect(ctx, ox + 478, oy + 170, 8, 14, changed.has('lantern-glow') ? '#3a3a32' : '#ffd166');
  if (!changed.has('lantern-glow')) circle(ctx, ox + 482, oy + 177, 10, 'rgba(255, 209, 102, 0.35)');
  poly(ctx, [[ox + 456, oy + 150], [ox + 482, oy + 128], [ox + 508, oy + 150]], '#7a7a6a');
  rect(ctx, ox + 474, oy + 192, 16, 40, '#8a8a7a');
  rect(ctx, ox + 464, oy + 232, 36, 10, '#7a7a6a');
  // The pond.
  ellipse(ctx, ox + 280, oy + 300, 250, 92, '#4a90c2');
  ellipse(ctx, ox + 280, oy + 300, 250, 92, 'rgba(255,255,255,0.08)');
  ellipse(ctx, ox + 280, oy + 300, 210, 74, '#3d7fb0');
  // Lily pads and the lily flower: pink on the left, white on the right.
  ellipse(ctx, ox + 152, oy + 282, 34, 12, '#4e8a3a');
  ellipse(ctx, ox + 210, oy + 320, 30, 11, '#4e8a3a');
  ellipse(ctx, ox + 380, oy + 330, 28, 10, '#4e8a3a');
  const flowerColour = changed.has('lily-flower') ? '#f5f0e6' : '#ff8fb8';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ellipse(ctx, ox + 152 + Math.cos(a) * 8, oy + 278 + Math.sin(a) * 5, 7, 4, flowerColour);
  }
  circle(ctx, ox + 152, oy + 278, 4, '#ffd166');
  // Koi: five on the left, four on the right.
  const koiSpots = [
    [180, 300, '#ff7f2a', 0.3],
    [260, 330, '#f5f0e6', -0.4],
    [306, 296, '#ff7f2a', 0.9],
    [350, 318, '#ffd166', 0.1],
    [430, 296, '#f5f0e6', -0.9],
  ];
  koiSpots.forEach(([kx, ky, col, ang], i) => {
    if (changed.has('koi-count') && i === 2) return;
    ctx.save();
    ctx.translate(ox + kx, oy + ky);
    ctx.rotate(ang);
    ellipse(ctx, 0, 0, 18, 8, col);
    poly(ctx, [[16, 0], [28, -8], [28, 8]], col);
    circle(ctx, -12, -3, 2, '#241636');
    ctx.restore();
  });
  // Arched bridge over the pond.
  ctx.strokeStyle = '#8a5a2e';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(ox + 200, oy + 250);
  ctx.quadraticCurveTo(ox + 280, oy + 168, ox + 360, oy + 250);
  ctx.stroke();
  // Bridge planks: the middle one is brown on the left, teal on the right.
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const bx = ox + 200 + t * 160;
    const by = oy + 250 - Math.sin(t * Math.PI) * 62;
    const isChangedPlank = i === 3;
    rect(ctx, bx - 8, by - 18, 16, 8, isChangedPlank && changed.has('bridge-plank') ? '#2e8a8a' : '#a86a3a');
  }
  line(ctx, ox + 200, oy + 232, ox + 360, oy + 232, '#6b4a2f', 3);
  // Frog on a stone, present on the left only.
  if (!changed.has('frog')) {
    ellipse(ctx, ox + 92, oy + 340, 22, 10, '#8a8a7a');
    circle(ctx, ox + 86, oy + 322, 11, '#57a773');
    circle(ctx, ox + 100, oy + 322, 11, '#57a773');
    circle(ctx, ox + 86, oy + 314, 4, '#f5f0e6');
    circle(ctx, ox + 100, oy + 314, 4, '#f5f0e6');
    circle(ctx, ox + 86, oy + 315, 2, '#241636');
    circle(ctx, ox + 100, oy + 315, 2, '#241636');
  }
  // Stepping stones across the grass: four on the left, three on the right.
  const stoneSpots = [[150, 362], [202, 362], [254, 362], [306, 362]];
  stoneSpots.forEach(([sx, sy], i) => {
    if (changed.has('stepping-stone') && i === 1) return;
    ellipse(ctx, ox + sx, oy + sy, 20, 8, '#b8b0a0');
  });
}

// ---------------------------------------------------------------------------
// Level 3 — Rooftop Observatory
// ---------------------------------------------------------------------------
function drawObservatory(ctx, ox, oy, variant, rng) {
  const changed = changedSet(2, variant);
  // Night sky.
  const sky = ctx.createLinearGradient(0, oy, 0, oy + 400);
  sky.addColorStop(0, '#0d1230');
  sky.addColorStop(0.6, '#1d2a5e');
  sky.addColorStop(1, '#3a2f52');
  ctx.fillStyle = sky;
  ctx.fillRect(ox, oy, 560, 400);
  // Stars.
  for (let i = 0; i < 40; i++) {
    const sx = ox + 10 + rng() * 540;
    const sy = oy + 8 + rng() * 200;
    circle(ctx, sx, sy, 0.8 + rng() * 1.4, 'rgba(255, 255, 240, 0.9)');
  }
  // Constellation: seven stars on the left, six on the right.
  const stars = [[400, 60], [422, 72], [444, 58], [436, 86], [410, 92], [452, 96], [428, 110]];
  ctx.strokeStyle = 'rgba(180, 210, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  stars.forEach(([sx, sy], i) => {
    if (i === 0) ctx.moveTo(ox + sx, oy + sy);
    else ctx.lineTo(ox + sx, oy + sy);
  });
  ctx.stroke();
  stars.forEach(([sx, sy], i) => {
    if (changed.has('constellation') && i === 5) return;
    circle(ctx, ox + sx, oy + sy, 3, '#ffe9a8');
    circle(ctx, ox + sx, oy + sy, 6, 'rgba(255, 233, 168, 0.25)');
  });
  // Rooftop floor.
  rect(ctx, ox, oy + 300, 560, 100, '#2e2440');
  rect(ctx, ox, oy + 300, 560, 5, '#4a3a66');
  // Window with city lights on the left wall.
  rect(ctx, ox + 36, oy + 96, 56, 66, '#141a38');
  ctx.strokeStyle = '#6a5a8a';
  ctx.lineWidth = 3;
  ctx.strokeRect(ox + 36, oy + 96, 56, 66);
  line(ctx, ox + 64, oy + 96, ox + 64, oy + 162, '#6a5a8a', 2);
  line(ctx, ox + 36, oy + 129, ox + 92, oy + 129, '#6a5a8a', 2);
  const windows = [[48, 108], [76, 108], [48, 140], [76, 140]];
  windows.forEach(([wx, wy], i) => {
    const lit = !(changed.has('city-window') && i === 1);
    rect(ctx, ox + wx, oy + wy, 10, 12, lit ? '#ffd166' : '#1c2340');
  });
  // Moon-phase wall chart.
  rect(ctx, ox + 320, oy + 70, 70, 46, '#f2ead8');
  ctx.strokeStyle = '#7a6a4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox + 320, oy + 70, 70, 46);
  const phases = [[332, 93], [352, 93], [372, 93]];
  phases.forEach(([px, py], i) => {
    if (changed.has('moon-phase') && i === 1) return;
    circle(ctx, ox + px, oy + py, 8, '#2b2a4a');
    if (i === 0) circle(ctx, ox + px + 3, oy + py, 6, '#f2ead8');
    if (i === 2) circle(ctx, ox + px - 3, oy + py, 6, '#f2ead8');
  });
  // Rocket poster on the right wall.
  rect(ctx, ox + 500, oy + 168, 46, 72, '#f2ead8');
  ctx.strokeStyle = '#7a6a4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox + 500, oy + 168, 46, 72);
  const rocketColour = changed.has('poster-rocket') ? '#3f7fb8' : '#d94f3d';
  poly(ctx, [[ox + 523, oy + 180], [ox + 531, oy + 198], [ox + 515, oy + 198]], rocketColour);
  rect(ctx, ox + 515, oy + 198, 16, 18, rocketColour);
  poly(ctx, [[ox + 515, oy + 216], [ox + 511, oy + 226], [ox + 519, oy + 216]], rocketColour);
  poly(ctx, [[ox + 531, oy + 216], [ox + 535, oy + 226], [ox + 527, oy + 216]], rocketColour);
  circle(ctx, ox + 523, oy + 204, 4, '#f2ead8');
  text(ctx, 'MARS', ox + 523, oy + 232, 8, '#33302a');
  // Planet mobile hanging from the top right.
  line(ctx, ox + 482, oy + 30, ox + 482, oy + 84, '#8a7aa8', 2);
  line(ctx, ox + 452, oy + 84, ox + 512, oy + 84, '#8a7aa8', 2);
  line(ctx, ox + 452, oy + 84, ox + 452, oy + 96, '#8a7aa8', 1.5);
  line(ctx, ox + 512, oy + 84, ox + 512, oy + 96, '#8a7aa8', 1.5);
  circle(ctx, ox + 452, oy + 102, 7, '#ff9f1c');
  circle(ctx, ox + 512, oy + 102, 9, '#e8b04b');
  if (!changed.has('saturn-ring')) {
    ctx.strokeStyle = '#f2ead8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(ox + 512, oy + 102, 16, 5, -0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Telescope on its tripod: points up-left on the left, up-right on the right.
  const aimLeft = !changed.has('telescope-angle');
  line(ctx, ox + 142, oy + 210, ox + 118, oy + 300, '#5a4a6a', 5);
  line(ctx, ox + 142, oy + 210, ox + 166, oy + 300, '#5a4a6a', 5);
  line(ctx, ox + 142, oy + 210, ox + 142, oy + 300, '#5a4a6a', 5);
  ctx.save();
  ctx.translate(ox + 142, oy + 182);
  ctx.rotate(aimLeft ? -0.7 : 0.7);
  rect(ctx, -10, -34, 20, 52, '#c9b18a');
  rect(ctx, -13, -40, 26, 10, '#8a6a42');
  rect(ctx, -6, 14, 12, 10, '#3a2f52');
  circle(ctx, 0, -36, 7, '#6ec6ff');
  ctx.restore();
  // The astronomer with a pointed hat.
  circle(ctx, ox + 252, oy + 210, 17, '#f2c79b');
  poly(ctx, [[ox + 234, oy + 200], [ox + 252, oy + 152], [ox + 270, oy + 200]], '#3a2f52');
  poly(ctx, [[ox + 234, oy + 200], [ox + 270, oy + 200], [ox + 270, oy + 206], [ox + 234, oy + 206]], '#2a2140');
  // The star on the hat: present on the left, missing on the right.
  if (!changed.has('hat-star')) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(ox + 252, oy + 164);
    ctx.lineTo(ox + 254, oy + 170);
    ctx.lineTo(ox + 260, oy + 170);
    ctx.lineTo(ox + 255, oy + 174);
    ctx.lineTo(ox + 257, oy + 180);
    ctx.lineTo(ox + 252, oy + 176);
    ctx.lineTo(ox + 247, oy + 180);
    ctx.lineTo(ox + 249, oy + 174);
    ctx.lineTo(ox + 244, oy + 170);
    ctx.lineTo(ox + 250, oy + 170);
    ctx.closePath();
    ctx.fill();
  }
  circle(ctx, ox + 246, oy + 208, 2, '#241636');
  circle(ctx, ox + 258, oy + 208, 2, '#241636');
  rect(ctx, ox + 228, oy + 226, 48, 74, '#5a4a8a');
  rect(ctx, ox + 228, oy + 226, 48, 10, '#6a5a9a');
  // Book stack: four books on the left, three on the right.
  const bookColours = ['#d94f3d', '#3f7fb8', '#57a773', '#f2a93b'];
  bookColours.forEach((col, i) => {
    if (changed.has('book-stack') && i === 1) return;
    const by = oy + 340 - i * 12;
    rect(ctx, ox + 176 + (i % 2) * 6, by, 58, 11, col);
  });
  // Coffee mug with steam: steam present on the left only.
  rect(ctx, ox + 288, oy + 306, 28, 22, '#e8483f');
  rect(ctx, ox + 316, oy + 312, 8, 12, '#e8483f');
  ellipse(ctx, ox + 302, oy + 306, 14, 4, '#f2ead8');
  if (!changed.has('mug-steam')) {
    ctx.strokeStyle = 'rgba(240, 240, 240, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 296, oy + 300);
    ctx.quadraticCurveTo(ox + 292, oy + 290, ox + 296, oy + 282);
    ctx.moveTo(ox + 308, oy + 300);
    ctx.quadraticCurveTo(ox + 312, oy + 290, ox + 308, oy + 282);
    ctx.stroke();
  }
  // Wall clock: 10:10 on the left, 10:20 on the right.
  circle(ctx, ox + 502, oy + 302, 20, '#f2ead8');
  ctx.strokeStyle = '#33302a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox + 502, oy + 302, 20, 0, Math.PI * 2);
  ctx.stroke();
  const minuteAngle = changed.has('clock-hands') ? (4 / 12) * Math.PI * 2 : (2 / 12) * Math.PI * 2;
  line(ctx, ox + 502, oy + 302, ox + 502 + Math.cos(-Math.PI / 2 + (10 / 12) * Math.PI * 2) * 11, oy + 302 + Math.sin(-Math.PI / 2 + (10 / 12) * Math.PI * 2) * 11, '#33302a', 3);
  line(ctx, ox + 502, oy + 302, ox + 502 + Math.cos(-Math.PI / 2 + minuteAngle) * 15, oy + 302 + Math.sin(-Math.PI / 2 + minuteAngle) * 15, '#33302a', 2);
  circle(ctx, ox + 502, oy + 302, 2, '#33302a');
  // Cat asleep on a chair.
  rect(ctx, ox + 400, oy + 330, 60, 8, '#6b4a2f');
  rect(ctx, ox + 404, oy + 338, 6, 30, '#6b4a2f');
  rect(ctx, ox + 450, oy + 338, 6, 30, '#6b4a2f');
  ellipse(ctx, ox + 430, oy + 324, 22, 9, '#c9a86a');
  circle(ctx, ox + 414, oy + 318, 9, '#c9a86a');
  poly(ctx, [[ox + 408, oy + 312], [ox + 410, oy + 304], [ox + 414, oy + 312]], '#c9a86a');
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
// Draw one level into a panel rectangle. `seed` keeps decorative randomness
// stable for a given staging; play uses seed 0 (clock-based) through main.js.
export function drawScene(ctx, levelIndex, variant, ox, oy, seed = 0) {
  const rng = makeRng(seed === 0 ? 1234567 + levelIndex * 7919 : seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, 560, 400);
  ctx.clip();
  if (levelIndex === 0) drawMarket(ctx, ox, oy, variant, rng);
  else if (levelIndex === 1) drawGarden(ctx, ox, oy, variant, rng);
  else drawObservatory(ctx, ox, oy, variant, rng);
  ctx.restore();
}
