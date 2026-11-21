// Everything drawn on top of the two scene panels: the title bar, the found
// counter with progress dots, the timer bar, score and combo, the hint and
// mute buttons, the gold rings on found differences, the hint pulse, the red
// X on a wrong click, and the menu / level-complete / win / pause overlays.
// render.js never owns game state — it only paints what main.js hands it.
import { CANVAS_W, CANVAS_H, COLORS, LEVEL_NAMES, LEVEL_SUBTITLES, PANEL } from './config.js';
import { DIFFERENCES } from './differences.js';

function text(ctx, s, x, y, size, fill, align = 'center', weight = 'bold') {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// A gold ring with a check mark, drawn on both panels over a found difference.
export function drawFoundMarker(ctx, panelX, diff, pulse = 0) {
  const cx = panelX + diff.x;
  const cy = PANEL.y + diff.y;
  const r = diff.r + 4 + pulse;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 201, 77, 0.35)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy);
  ctx.lineTo(cx - 2, cy + 8);
  ctx.lineTo(cx + 11, cy - 8);
  ctx.stroke();
}

// A dashed expanding circle over a difference the hint is pointing at.
export function drawHintPulse(ctx, panelX, diff, phase) {
  const cx = panelX + diff.x;
  const cy = PANEL.y + diff.y;
  const r = diff.r + 6 + Math.sin(phase) * 5;
  ctx.strokeStyle = COLORS.hintBlue;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// A red X that flashes where a wrong click landed.
export function drawMissFlash(ctx, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = COLORS.missRed;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 12);
  ctx.lineTo(x + 12, y + 12);
  ctx.moveTo(x + 12, y - 12);
  ctx.lineTo(x - 12, y + 12);
  ctx.stroke();
  ctx.restore();
}

// The top bar: title, level name, found counter, timer bar, score, combo.
export function drawHud(ctx, state) {
  const levelIndex = state.levelIndex;
  const diffs = DIFFERENCES[levelIndex];
  const found = state.found.size;
  const total = diffs.length;
  const timeLeft = state.timeLeft;
  const timeTotal = state.timeTotal;

  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, CANVAS_W, 140);
  text(ctx, 'SPOT THE DIFFERENCE', 40, 34, 30, COLORS.hudText, 'left');
  text(ctx, `Level ${levelIndex + 1} · ${LEVEL_NAMES[levelIndex]}`, 40, 66, 16, COLORS.hudMuted, 'left');
  text(ctx, LEVEL_SUBTITLES[levelIndex], 40, 88, 13, COLORS.hudMuted, 'left');

  // Found counter, big and legible.
  text(ctx, `Found ${found} / ${total}`, 640, 40, 30, COLORS.gold);
  // Progress dots.
  for (let i = 0; i < total; i++) {
    const dx = 640 - ((total - 1) * 15) + i * 30;
    ctx.fillStyle = i < found ? COLORS.gold : '#4a3a66';
    ctx.beginPath();
    ctx.arc(dx, 74, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // "n remain" line so the counter reads even when shrunk.
  text(ctx, `${total - found} still hidden`, 640, 102, 14, COLORS.hudMuted);

  // Timer bar.
  const barX = 900;
  const barW = 300;
  const frac = Math.max(0, timeLeft / timeTotal);
  ctx.fillStyle = '#2c2144';
  roundRect(ctx, barX, 22, barW, 18, 9);
  ctx.fill();
  ctx.fillStyle = frac < 0.25 ? COLORS.timerLow : COLORS.timerOk;
  if (frac > 0) {
    roundRect(ctx, barX, 22, barW * frac, 18, 9);
    ctx.fill();
  }
  text(ctx, formatTime(timeLeft), barX + barW / 2, 62, 20, frac < 0.25 ? COLORS.timerLow : COLORS.hudText);
  text(ctx, 'TIME', barX + barW / 2, 84, 12, COLORS.hudMuted);

  // Score and combo.
  text(ctx, `Score ${state.score}`, 900, 116, 20, COLORS.hudText, 'left');
  if (state.combo > 1) {
    text(ctx, `Combo ×${state.combo}`, 1120, 116, 20, COLORS.gold, 'left');
  }

  // Hint and mute buttons, bottom-left under the panels.
  drawButton(ctx, 40, 566 + 88, 120, 30, `Hint (H) · ${state.hintsLeft}`, state.hintsLeft > 0);
  drawButton(ctx, 170, 566 + 88, 120, 30, state.muted ? 'Sound off (M)' : 'Sound on (M)', true);
}

export function drawButton(ctx, x, y, w, h, label, enabled = true) {
  if (!label) return;
  ctx.fillStyle = enabled ? COLORS.button : '#241c38';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelFrame;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 14, enabled ? COLORS.hudText : COLORS.hudMuted);
}

// Panel frames and the "Left / Right" labels under each picture.
export function drawPanelFrames(ctx, state) {
  ctx.strokeStyle = COLORS.panelFrame;
  ctx.lineWidth = 3;
  ctx.strokeRect(PANEL.leftX - 2, PANEL.y - 2, PANEL.w + 4, PANEL.h + 4);
  ctx.strokeRect(PANEL.rightX - 2, PANEL.y - 2, PANEL.w + 4, PANEL.h + 4);
  text(ctx, 'ORIGINAL', PANEL.leftX + PANEL.w / 2, PANEL.y + PANEL.h + 18, 13, COLORS.hudMuted);
  text(ctx, 'SPOT THE CHANGES', PANEL.rightX + PANEL.w / 2, PANEL.y + PANEL.h + 18, 13, COLORS.hudMuted);
}

// The last-found label that pops up briefly under the HUD.
export function drawToast(ctx, toast) {
  if (!toast) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, toast.life * 2);
  if (toast.points > 0) {
    text(ctx, `You found ${toast.label}!  +${toast.points}`, 640, 128, 18, COLORS.gold);
  } else {
    text(ctx, toast.label, 640, 128, 18, COLORS.missRed);
  }
  ctx.restore();
}

// A dim full-screen overlay with a centred card.
export function drawOverlayCard(ctx, lines, buttons) {
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const cardW = 560;
  const cardH = 120 + lines.length * 34 + (buttons.length ? 66 : 0);
  const cx = (CANVAS_W - cardW) / 2;
  const cy = (CANVAS_H - cardH) / 2;
  ctx.fillStyle = '#221a38';
  roundRect(ctx, cx, cy, cardW, cardH, 16);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  roundRect(ctx, cx, cy, cardW, cardH, 16);
  ctx.stroke();
  lines.forEach((line, i) => {
    text(ctx, line.text, CANVAS_W / 2, cy + 52 + i * 34, line.size || 20, line.colour || COLORS.hudText);
  });
  buttons.forEach((btn, i) => {
    const bw = 180;
    const bx = CANVAS_W / 2 - ((buttons.length - 1) * 100) + i * 200 - bw / 2;
    drawButton(ctx, bx, cy + cardH - 58, bw, 40, btn.label);
  });
}

export function starsForTimeLeft(timeLeft) {
  if (timeLeft >= 60) return 3;
  if (timeLeft >= 30) return 2;
  return 1;
}

export function starRow(stars) {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}
