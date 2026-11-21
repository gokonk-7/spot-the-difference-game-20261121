// Mouse and keyboard input. input.js knows where the clickable things are —
// the two panels, the hint and mute buttons, and the overlay buttons — and
// turns raw events into calls on the game object main.js owns. It never
// changes game state itself.
import { CANVAS_H, CANVAS_W, PANEL } from './config.js';
import { differenceAt } from './differences.js';

export function panelFromPoint(x, y) {
  if (y < PANEL.y || y > PANEL.y + PANEL.h) return null;
  if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.w) {
    return { panel: 0, px: x - PANEL.leftX, py: y - PANEL.y };
  }
  if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.w) {
    return { panel: 1, px: x - PANEL.rightX, py: y - PANEL.y };
  }
  return null;
}

export function pointInRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

// Button rectangles, shared with render.js so clicks land where the paint is.
export const BUTTONS = {
  hint: { x: 40, y: 654, w: 120, h: 30 },
  mute: { x: 170, y: 654, w: 120, h: 30 },
};

// Overlay button rectangles, laid out exactly as render.drawOverlayCard does:
// centred card, buttons in a row near the card's bottom edge.
export function overlayButtons(count, cardY, cardH) {
  const buttons = [];
  for (let i = 0; i < count; i++) {
    const bw = 180;
    const bx = CANVAS_W / 2 - ((count - 1) * 100) + i * 200 - bw / 2;
    buttons.push({ x: bx, y: cardY + cardH - 58, w: bw, h: 40 });
  }
  return buttons;
}

export function attachInput(canvas, game) {
  const toCanvas = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  canvas.addEventListener('click', (event) => {
    const { x, y } = toCanvas(event);
    game.handleClick(x, y);
  });

  canvas.addEventListener('mousemove', (event) => {
    const { x, y } = toCanvas(event);
    game.handleHover(x, y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'h') game.useHint();
    else if (key === 'm') game.toggleMute();
    else if (key === 'p' || key === 'escape') game.togglePause();
    else if (key === 'r') game.restartLevel();
    else if (key === 'n') game.nextLevel();
    else if (key === '1' || key === '2' || key === '3') game.selectLevel(Number(key) - 1);
    else if (key === 'enter' || key === ' ') game.confirm();
  });
}

// Pure helper for the automated test: given a click in canvas space, say
// which difference it would hit (or that it misses), without touching state.
export function classifyClick(levelIndex, x, y) {
  const hit = panelFromPoint(x, y);
  if (!hit) return { type: 'outside' };
  const diff = differenceAt(levelIndex, hit.px, hit.py);
  if (!diff) return { type: 'miss', x, y };
  return { type: 'found', diff, x, y };
}
