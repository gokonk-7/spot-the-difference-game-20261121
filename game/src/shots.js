// Screenshot staging: `?shot=` drives the REAL game into a chosen state and
// renders one frozen frame, so every screenshot is a true render of the
// game's own code. Found differences are marked through the same code path
// a player's click takes (game.applyFind), the timer and score are set to
// the staged values, and the clock is frozen so headless Chrome captures a
// deterministic frame. Nothing here fakes pixels.
//
// Stagings, from shots.json:
//   cover — level 1, 3 of 7 found, timer ~132 s, score 320, combo x2
//   mid   — level 2, 5 of 8 found, a hint pulse on one unfound difference
//   hard  — level 3, 2 of 10 found, timer 28 s (red bar)
//   win   — level 3 finished, 3 stars, time bonus, win overlay
import { PANEL } from './config.js';
import { DIFFERENCES } from './differences.js';

export const SHOT_STAGES = {
  cover: {
    level: 0,
    foundIds: ['moon', 'cat-tail', 'lantern-colour'],
    timeLeft: 132,
    score: 320,
    combo: 2,
    hintId: null,
  },
  mid: {
    level: 1,
    foundIds: ['koi-count', 'lily-flower', 'lantern-glow', 'dragonfly', 'petals'],
    timeLeft: 74,
    score: 640,
    combo: 3,
    hintId: 'frog',
  },
  hard: {
    level: 2,
    foundIds: ['telescope-angle', 'constellation'],
    timeLeft: 28,
    score: 210,
    combo: 1,
    hintId: null,
  },
  win: {
    level: 2,
    foundIds: DIFFERENCES[2].map((d) => d.id),
    timeLeft: 65,
    score: 1420,
    combo: 4,
    hintId: null,
    win: true,
  },
};

// Drive the game into a staged state. `game` is the live game object from
// main.js; this calls its public methods exactly as a player would.
export function stageShot(game, name) {
  const stage = SHOT_STAGES[name];
  if (!stage) return false;
  game.selectLevel(stage.level);
  game.startPlaying();
  for (const id of stage.foundIds) {
    const diff = DIFFERENCES[stage.level].find((d) => d.id === id);
    if (!diff) continue;
    // Click the difference on the left panel, through the real click path.
    game.handleClick(PANEL.leftX + diff.x, PANEL.y + diff.y, true);
  }
  game.state.timeLeft = stage.timeLeft;
  game.state.score = stage.score;
  game.state.combo = stage.combo;
  game.state.bestCombo = Math.max(game.state.bestCombo, stage.combo);
  if (stage.hintId) {
    const diff = DIFFERENCES[stage.level].find((d) => d.id === stage.hintId);
    if (diff) game.state.hint = { diff, phase: 0, life: 2 };
  }
  if (stage.win) {
    game.state.stars = [3, 3, 3];
    game.state.timeBonus = stage.timeLeft * 5;
    game.state.screen = 'win';
    game.state.frozen = true;
  } else {
    game.state.frozen = true;
  }
  game.renderFrame(0);
  return true;
}
