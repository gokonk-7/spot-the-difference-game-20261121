// Bootstrap, game loop and state machine for the spot-the-difference game.
// Screens: menu → playing → levelComplete → win, plus a pause overlay.
// main.js owns all mutable state; render.js only paints it, input.js only
// reports clicks and keys. A small `window.__game` hook exposes the state and
// a clickAt() helper so the game can be driven and asserted by an automated
// test, and `?selftest=1` runs those assertions in the page and writes the
// result into document.title.
import { CANVAS_H, CANVAS_W, COLORS, LEVEL_NAMES, LEVEL_SUBTITLES, LEVEL_TIMES, PANEL, SCORE } from './config.js';
import { SoundBank } from './audio.js';
import { DIFFERENCES, differenceAt } from './differences.js';
import { BUTTONS, attachInput, overlayButtons, panelFromPoint, pointInRect } from './input.js';
import { drawFoundMarker, drawHintPulse, drawHud, drawMissFlash, drawOverlayCard, drawPanelFrames, drawToast, starRow, starsForTimeLeft } from './render.js';
import { drawScene } from './scenes.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const seedParam = Number(params.get('seed') || 0);
const shotParam = params.get('shot');
const selftestParam = params.get('selftest') === '1';

export class SpotGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sounds = new SoundBank();
    this.state = this.freshState();
    this.lastTick = performance.now();
    this.missFlash = null;
    this.toast = null;
    this.hover = { x: -1, y: -1 };
    this.bestScore = Number(localStorage.getItem('spot-best-score') || 0);
  }

  freshState() {
    return {
      screen: 'menu',
      levelIndex: 0,
      found: new Set(),
      timeLeft: LEVEL_TIMES[0],
      timeTotal: LEVEL_TIMES[0],
      score: 0,
      combo: 0,
      bestCombo: 0,
      hintsLeft: SCORE.hintsPerLevel,
      hint: null,
      muted: false,
      paused: false,
      frozen: false,
      stars: [0, 0, 0],
      timeBonus: 0,
      levelScore: 0,
      lastTickSecond: -1,
    };
  }

  // -- level flow ----------------------------------------------------------
  selectLevel(index) {
    if (index < 0 || index > 2) return;
    this.state = this.freshState();
    this.state.levelIndex = index;
    this.state.timeLeft = LEVEL_TIMES[index];
    this.state.timeTotal = LEVEL_TIMES[index];
    this.state.screen = 'menu';
  }

  startPlaying() {
    const s = this.state;
    s.screen = 'playing';
    s.paused = false;
    s.found = new Set();
    s.timeLeft = LEVEL_TIMES[s.levelIndex];
    s.timeTotal = LEVEL_TIMES[s.levelIndex];
    s.combo = 0;
    s.hintsLeft = SCORE.hintsPerLevel;
    s.hint = null;
    s.levelScore = 0;
    s.timeBonus = 0;
    s.lastTickSecond = -1;
    this.missFlash = null;
    this.toast = null;
  }

  // -- finds, misses, hints ------------------------------------------------
  applyFind(diff) {
    const s = this.state;
    if (s.found.has(diff.id)) return false;
    s.found.add(diff.id);
    s.combo += 1;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    const points = SCORE.baseFind * s.combo;
    s.score += points;
    s.levelScore += points;
    this.toast = { label: diff.label, points, life: 2.2 };
    this.sounds.pluck();
    if (s.found.size === DIFFERENCES[s.levelIndex].length) {
      this.completeLevel();
    }
    return true;
  }

  handleClick(x, y, silent = false) {
    const s = this.state;
    if (s.screen === 'menu') {
      this.handleMenuClick(x, y);
      return;
    }
    if (s.screen === 'levelComplete') {
      this.handleOverlayClick(x, y, 'levelComplete');
      return;
    }
    if (s.screen === 'win') {
      this.handleOverlayClick(x, y, 'win');
      return;
    }
    if (s.screen !== 'playing' || s.paused || s.frozen) return;
    this.sounds.ensure();
    // Hint and mute buttons live under the panels.
    if (pointInRect(x, y, BUTTONS.hint.x, BUTTONS.hint.y, BUTTONS.hint.w, BUTTONS.hint.h)) {
      this.useHint();
      return;
    }
    if (pointInRect(x, y, BUTTONS.mute.x, BUTTONS.mute.y, BUTTONS.mute.w, BUTTONS.mute.h)) {
      this.toggleMute();
      return;
    }
    const hit = panelFromPoint(x, y);
    if (!hit) return;
    const diff = differenceAt(s.levelIndex, hit.px, hit.py);
    if (diff && !s.found.has(diff.id)) {
      this.applyFind(diff);
    } else if (diff && s.found.has(diff.id)) {
      // Clicking an already-found difference is harmless, not a miss.
      return;
    } else {
      s.combo = 0;
      s.timeLeft = Math.max(0, s.timeLeft - SCORE.missPenaltySeconds);
      this.missFlash = { x, y, life: 0.7 };
      if (!silent) this.sounds.thud();
    }
  }

  handleMenuClick(x, y) {
    // Level cards: three rows under the title.
    const s = this.state;
    for (let i = 0; i < 3; i++) {
      const cardY = 300 + i * 84;
      if (pointInRect(x, y, 390, cardY, 500, 68)) {
        this.sounds.ensure();
        this.sounds.click();
        s.levelIndex = i;
        this.startPlaying();
        return;
      }
    }
  }

  handleOverlayClick(x, y, screen) {
    const s = this.state;
    const cardH = screen === 'win' ? 120 + 6 * 34 + 66 : 120 + 4 * 34 + 66;
    const cardY = (CANVAS_H - cardH) / 2;
    const buttons = overlayButtons(screen === 'win' ? 2 : 1, cardY, cardH);
    buttons.forEach((btn, i) => {
      if (!pointInRect(x, y, btn.x, btn.y, btn.w, btn.h)) return;
      this.sounds.click();
      if (screen === 'win') {
        if (i === 0) {
          this.selectLevel(0);
          this.startPlaying();
        } else {
          this.selectLevel(0);
        }
      } else {
        this.nextLevel();
      }
    });
  }

  handleHover(x, y) {
    this.hover = { x, y };
  }

  useHint() {
    const s = this.state;
    if (s.screen !== 'playing' || s.paused || s.frozen) return;
    if (s.hintsLeft <= 0 || s.hint) return;
    const remaining = DIFFERENCES[s.levelIndex].filter((d) => !s.found.has(d.id));
    if (!remaining.length) return;
    const diff = remaining[Math.floor(Math.random() * remaining.length)];
    s.hintsLeft -= 1;
    s.score = Math.max(0, s.score - SCORE.hintCost);
    s.hint = { diff, phase: 0, life: 2 };
    this.sounds.shimmer();
  }

  toggleMute() {
    this.state.muted = this.sounds.toggleMute();
  }

  togglePause() {
    const s = this.state;
    if (s.screen !== 'playing') return;
    s.paused = !s.paused;
  }

  restartLevel() {
    const s = this.state;
    if (s.screen === 'win') {
      this.selectLevel(0);
      this.startPlaying();
      return;
    }
    if (s.screen === 'playing' || s.screen === 'levelComplete') {
      const level = s.levelIndex;
      this.selectLevel(level);
      this.startPlaying();
    }
  }

  confirm() {
    const s = this.state;
    if (s.screen === 'menu') this.startPlaying();
    else if (s.screen === 'levelComplete') this.nextLevel();
    else if (s.screen === 'win') this.selectLevel(0);
  }

  nextLevel() {
    const s = this.state;
    if (s.screen === 'levelComplete') {
      const next = s.levelIndex + 1;
      if (next > 2) {
        s.screen = 'win';
        return;
      }
      this.selectLevel(next);
      this.startPlaying();
    }
  }

  completeLevel() {
    const s = this.state;
    const stars = starsForTimeLeft(s.timeLeft);
    s.stars[s.levelIndex] = stars;
    s.timeBonus = Math.round(s.timeLeft) * SCORE.timeBonusPerSecond;
    s.score += s.timeBonus;
    s.screen = 'levelComplete';
    this.sounds.fanfare();
    if (s.levelIndex === 2) {
      // The final level's overlay is the win screen; keep the state.
      s.screen = 'win';
      if (s.score > this.bestScore) {
        this.bestScore = s.score;
        try {
          localStorage.setItem('spot-best-score', String(s.score));
        } catch {
          // Storage may be unavailable; the score still shows this session.
        }
      }
    }
  }

  // -- loop ----------------------------------------------------------------
  tick(now) {
    const dt = Math.min(0.1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const s = this.state;
    if (s.screen === 'playing' && !s.paused && !s.frozen) {
      s.timeLeft -= dt;
      const whole = Math.ceil(s.timeLeft);
      if (whole !== s.lastTickSecond) {
        s.lastTickSecond = whole;
        if (whole <= 30 && whole > 0) this.sounds.tick();
      }
      if (s.timeLeft <= 0) {
        s.timeLeft = 0;
        s.screen = 'menu';
        s.found = new Set();
        s.combo = 0;
        this.toast = { label: 'Time ran out!', points: 0, life: 2.2 };
      }
    }
    if (this.missFlash) {
      this.missFlash.life -= dt;
      if (this.missFlash.life <= 0) this.missFlash = null;
    }
    if (this.toast) {
      this.toast.life -= dt;
      if (this.toast.life <= 0) this.toast = null;
    }
    if (s.hint) {
      s.hint.phase += dt * 4;
      s.hint.life -= dt;
      if (s.hint.life <= 0) s.hint = null;
    }
    this.renderFrame(now);
  }

  renderFrame(now) {
    const ctx = this.ctx;
    const s = this.state;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.page;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (s.screen === 'menu') {
      this.renderMenu();
      return;
    }

    const levelIndex = s.levelIndex;
    drawScene(ctx, levelIndex, 0, PANEL.leftX, PANEL.y, seedParam);
    drawScene(ctx, levelIndex, 1, PANEL.rightX, PANEL.y, seedParam);
    drawPanelFrames(ctx, s);

    // Found markers on both panels.
    for (const diff of DIFFERENCES[levelIndex]) {
      if (!s.found.has(diff.id)) continue;
      drawFoundMarker(ctx, PANEL.leftX, diff);
      drawFoundMarker(ctx, PANEL.rightX, diff);
    }
    // Hint pulse on both panels.
    if (s.hint) {
      drawHintPulse(ctx, PANEL.leftX, s.hint.diff, s.hint.phase);
      drawHintPulse(ctx, PANEL.rightX, s.hint.diff, s.hint.phase);
    }
    if (this.missFlash) {
      drawMissFlash(ctx, this.missFlash.x, this.missFlash.y, Math.min(1, this.missFlash.life * 2));
    }
    drawHud(ctx, { ...s, muted: this.sounds.muted });
    drawToast(ctx, this.toast);

    if (s.paused) {
      drawOverlayCard(
        ctx,
        [
          { text: 'Paused', size: 34 },
          { text: 'Press P or Esc to keep hunting', size: 16, colour: COLORS.hudMuted },
        ],
        [{ label: 'Resume (P)' }],
      );
      return;
    }
    if (s.screen === 'levelComplete') {
      const stars = s.stars[s.levelIndex];
      drawOverlayCard(
        ctx,
        [
          { text: 'Level complete!', size: 34 },
          { text: starRow(stars), size: 30, colour: COLORS.gold },
          { text: `You found all ${DIFFERENCES[levelIndex].length} differences`, size: 18 },
          { text: `Time bonus +${s.timeBonus} · Score ${s.score}`, size: 18, colour: COLORS.hudMuted },
        ],
        [{ label: 'Next level (N)' }],
      );
    }
    if (s.screen === 'win') {
      const totalStars = s.stars.reduce((a, b) => a + b, 0);
      drawOverlayCard(
        ctx,
        [
          { text: 'You found them all!', size: 34 },
          { text: `${starRow(s.stars[0])}  ${starRow(s.stars[1])}  ${starRow(s.stars[2])}`, size: 24, colour: COLORS.gold },
          { text: `${totalStars} of 9 stars across three scenes`, size: 18 },
          { text: `Final score ${s.score} · Best combo ×${s.bestCombo}`, size: 18 },
          { text: `Time bonus +${s.timeBonus}`, size: 16, colour: COLORS.hudMuted },
          { text: 'Thanks for playing — every scene was drawn for this game.', size: 15, colour: COLORS.hudMuted },
        ],
        [{ label: 'Play again (R)' }, { label: 'Menu (Enter)' }],
      );
    }
  }

  renderMenu() {
    const ctx = this.ctx;
    const s = this.state;
    // A painted backdrop: the first scene, dimmed, behind the menu card.
    drawScene(ctx, 0, 0, PANEL.leftX, PANEL.y, seedParam);
    drawScene(ctx, 0, 1, PANEL.rightX, PANEL.y, seedParam);
    ctx.fillStyle = 'rgba(12, 8, 22, 0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPOT THE DIFFERENCE', CANVAS_W / 2, 92);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = COLORS.hudMuted;
    ctx.fillText('Two pictures, a few quiet changes. Find them all before the clock runs out.', CANVAS_W / 2, 132);
    ctx.fillText('Click a difference on either picture — it is marked on both. H costs 50 points. A miss costs 5 seconds.', CANVAS_W / 2, 160);
    if (this.bestScore > 0) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`Best score ${this.bestScore}`, CANVAS_W / 2, 190);
    }
    // Level cards.
    for (let i = 0; i < 3; i++) {
      const cardY = 300 + i * 84;
      const selected = s.levelIndex === i;
      ctx.fillStyle = selected ? '#3d2f5e' : '#221a38';
      ctx.beginPath();
      ctx.roundRect(390, cardY, 500, 68, 12);
      ctx.fill();
      ctx.strokeStyle = selected ? COLORS.gold : COLORS.panelFrame;
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(390, cardY, 500, 68, 12);
      ctx.stroke();
      ctx.fillStyle = COLORS.hudText;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Level ${i + 1} — ${LEVEL_NAMES[i]}`, 414, cardY + 26);
      ctx.fillStyle = COLORS.hudMuted;
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText(LEVEL_SUBTITLES[i], 414, cardY + 50);
      ctx.textAlign = 'right';
      ctx.fillStyle = COLORS.gold;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(i === s.levelIndex ? '▶ click to play' : 'press ' + (i + 1), 866, cardY + 34);
      ctx.textAlign = 'center';
    }
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Keys: 1 / 2 / 3 choose a level · H hint · P pause · R restart · M sound', CANVAS_W / 2, 580);
  }
}

// -- boot -------------------------------------------------------------------
const canvas = document.getElementById('game');
const game = new SpotGame(canvas);
attachInput(canvas, game);

// Test hook: the automated click test drives the game through this object.
window.__game = {
  state: () => game.state,
  clickAt: (x, y) => game.handleClick(x, y),
  start: (level) => {
    game.selectLevel(level);
    game.startPlaying();
  },
  hint: () => game.useHint(),
  restart: () => game.restartLevel(),
  differences: DIFFERENCES,
  panel: PANEL,
};

function loop(now) {
  game.tick(now);
  requestAnimationFrame(loop);
}

if (shotParam) {
  stageShot(game, shotParam);
} else if (selftestParam) {
  runSelfTest(game);
} else {
  requestAnimationFrame(loop);
}

// -- in-page self test -------------------------------------------------------
// Runs the same assertions an external driver would: click every listed
// difference on each level and check the found count reaches the total,
// click an empty spot and check the miss, spend a hint and check it lands,
// and walk the level-complete → win flow. Writes PASS or FAIL into the title.
function runSelfTest(game) {
  const results = [];
  const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  try {
    for (let level = 0; level < 3; level++) {
      game.selectLevel(level);
      game.startPlaying();
      const diffs = DIFFERENCES[level];
      for (const diff of diffs) {
        window.__game.clickAt(PANEL.leftX + diff.x, PANEL.y + diff.y);
      }
      check(`level ${level + 1} all ${diffs.length} found`, game.state.found.size === diffs.length);
      check(`level ${level + 1} score > 0`, game.state.score > 0);
    }
    check('win screen after level 3', game.state.screen === 'win');
    // Miss: click an empty corner of the left panel on level 1.
    game.selectLevel(0);
    game.startPlaying();
    const before = game.state.timeLeft;
    window.__game.clickAt(PANEL.leftX + 540, PANEL.y + 20);
    check('miss costs 5 seconds', game.state.timeLeft <= before - 4.9);
    check('miss resets combo', game.state.combo === 0);
    // Hint: spend one, check it points at an unfound difference.
    const hintsBefore = game.state.hintsLeft;
    game.useHint();
    check('hint spends one hint', game.state.hintsLeft === hintsBefore - 1);
    check('hint targets an unfound difference', game.state.hint && !game.state.found.has(game.state.hint.diff.id));
    // Restart: find one, restart, found set is empty again.
    const first = DIFFERENCES[0][0];
    window.__game.clickAt(PANEL.leftX + first.x, PANEL.y + first.y);
    game.restartLevel();
    check('restart clears found set', game.state.found.size === 0);
    check('restart resets timer', game.state.timeLeft === LEVEL_TIMES[0]);
    // Pause toggles.
    game.togglePause();
    check('pause on', game.state.paused === true);
    game.togglePause();
    check('pause off', game.state.paused === false);
  } catch (err) {
    results.push(`FAIL exception: ${err.message}`);
  }
  const failed = results.some((r) => r.startsWith('FAIL'));
  document.title = failed ? `SELFTEST FAIL: ${results.filter((r) => r.startsWith('FAIL')).join(' | ')}` : 'SELFTEST PASS';
  document.body.dataset.selftest = results.join('\n');
  // Keep one frame rendering so a screenshot of the test still shows the game.
  game.renderFrame(0);
}
