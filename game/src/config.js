// Ember Court — table and element constants.
// One job: every number, colour and name the rest of the game shares.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const MAX_HAND = 7;

// The four elements. Colour AND shape tell them apart, never text alone.
export const ELEMENTS = {
  flame: {
    key: 'flame', name: 'Flame', colour: '#e8491d', deep: '#8f1d05',
    light: '#ffb347', keyword: 'Surge', keywordText: 'Surge: +2 when your life is 10 or less',
  },
  tide: {
    key: 'tide', name: 'Tide', colour: '#1d7fe8', deep: '#0a3d7a',
    light: '#7fd4ff', keyword: 'Flow', keywordText: 'Flow: draw an extra card when it wins a clash',
  },
  stone: {
    key: 'stone', name: 'Stone', colour: '#8a7d5a', deep: '#4a4230',
    light: '#e8d9a0', keyword: 'Guard', keywordText: 'Guard: blocks the next damage to you entirely',
  },
  gale: {
    key: 'gale', name: 'Gale', colour: '#1fae7a', deep: '#0a5c3c',
    light: '#8ff5c8', keyword: 'Echo', keywordText: 'Echo: repeats your last card\'s power as a bonus',
  },
};
export const ELEMENT_KEYS = ['flame', 'tide', 'stone', 'gale'];

// Element wheel: Flame > Gale > Stone > Tide > Flame.
export const BEATS = { flame: 'gale', gale: 'stone', stone: 'tide', tide: 'flame' };

export const PALETTE = {
  felt: '#0d3f3a',
  feltDeep: '#072723',
  feltLight: '#14655c',
  gold: '#d9a441',
  goldLight: '#f6d98a',
  goldDeep: '#8a6420',
  cream: '#f7efdc',
  ink: '#241d12',
  ember: '#ff7a2f',
  panel: 'rgba(6, 32, 29, 0.82)',
  panelEdge: 'rgba(217, 164, 65, 0.55)',
};

export const CARD_W = 132;
export const CARD_H = 186;
