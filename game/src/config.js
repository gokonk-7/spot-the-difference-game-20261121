// Shared constants for the spot-the-difference game: canvas size, panel
// geometry, timings, scores and the palette. One place for every number the
// other modules agree on, so a tweak here moves the whole game together.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// The two picture panels sit side by side with a gutter between them.
export const PANEL = {
  w: 560,
  h: 400,
  y: 150,
  leftX: 40,
  rightX: 680,
};

export const HUD = {
  top: 0,
  height: 140,
  bottomBarY: 566,
};

// Per-level time limits, in seconds.
export const LEVEL_TIMES = [180, 150, 120];

// Scoring.
export const SCORE = {
  baseFind: 100,
  missPenaltySeconds: 5,
  hintCost: 50,
  hintsPerLevel: 3,
  timeBonusPerSecond: 5,
};

// How close a click must land to a difference to count, in panel pixels.
export const HIT_RADIUS_DEFAULT = 30;

// Colours used by the HUD and overlays.
export const COLORS = {
  page: '#14101f',
  hudText: '#f5edd8',
  hudMuted: '#b8a98a',
  gold: '#ffc94d',
  goldDark: '#c98f1b',
  panelFrame: '#3a2f52',
  panelFrameFound: '#ffc94d',
  missRed: '#ff5a5a',
  hintBlue: '#6ec6ff',
  timerOk: '#7ddc7d',
  timerLow: '#ff5a5a',
  overlay: 'rgba(12, 8, 22, 0.82)',
  button: '#2c2144',
  buttonHover: '#3d2f5e',
};

// Level names shown in the menu and HUD.
export const LEVEL_NAMES = [
  'Lantern Market at Dusk',
  'Koi Pond Garden',
  'Rooftop Observatory',
];

export const LEVEL_SUBTITLES = [
  'Easy · 7 differences · 3:00',
  'Medium · 8 differences · 2:30',
  'Hard · 10 differences · 2:00',
];
