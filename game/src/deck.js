// Ember Court — deck, seeded chance and the clash rules.
// One job: pure game logic. No canvas, no DOM, no sound, so Node can import
// this file directly and simulate whole games headlessly.

// A tiny deterministic generator: same seed, same shuffle, same game.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace(rng, list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

let nextCardId = 1;

// The court deck: every element carries powers 1..9, twice over, plus one
// extra 5 of each element — 76 cards, so long duels still have a deck.
export function buildDeck() {
  const cards = [];
  for (const element of ['flame', 'tide', 'stone', 'gale']) {
    for (let copy = 0; copy < 2; copy++) {
      for (let power = 1; power <= 9; power++) {
        cards.push({ id: nextCardId++, element, power });
      }
    }
    cards.push({ id: nextCardId++, element, power: 5 });
  }
  return cards;
}

export function freshState(seed) {
  const rng = mulberry32(seed);
  const deck = shuffleInPlace(rng, buildDeck());
  const state = {
    seed,
    rng,
    deck,
    discard: [],
    turn: 1,
    phase: 'play', // play | clash | over
    player: { life: 20, hand: [], lastElement: null, lastPower: 0, guard: false },
    warden: { life: 20, hand: [], lastElement: null, lastPower: 0, guard: false },
    clash: null, // { playerCard, wardenCard, winner, damage, text, kindled, ... }
    log: [],
    winner: null,
    intent: null, // the element the Warden is telegraphing this turn
    stats: { clashes: 0, kindles: 0, passes: 0 },
  };
  for (let i = 0; i < 5; i++) {
    state.player.hand.push(deck.pop());
    state.warden.hand.push(deck.pop());
  }
  return state;
}

export function drawCards(state, side, count) {
  const hand = state[side].hand;
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) return;
      state.deck = shuffleInPlace(state.rng, state.discard.splice(0));
    }
    if (hand.length < 7) hand.push(state.deck.pop());
  }
}

// Element advantage: true when a's element beats b's on the wheel.
export function hasAdvantage(a, b) {
  const wheel = { flame: 'gale', gale: 'stone', stone: 'tide', tide: 'flame' };
  return wheel[a] === b;
}

// Effective power of a card in this clash, with every bonus spelled out.
export function effectivePower(state, side, card) {
  const me = state[side];
  let power = card.power;
  const bonuses = [];
  if (me.lastElement && me.lastElement === card.element) {
    power += 2;
    bonuses.push('Kindle +2');
  }
  if (card.element === 'flame' && me.life <= 10) {
    power += 2;
    bonuses.push('Surge +2');
  }
  if (card.element === 'gale' && me.lastPower > 0) {
    power += me.lastPower;
    bonuses.push(`Echo +${me.lastPower}`);
  }
  return { power, bonuses };
}

// Resolve one clash. Returns the outcome; the caller applies damage.
// Advantage wins outright; same element goes to higher power; an exact
// tie deals nothing and both cards are discarded.
export function resolveClash(state, playerCard, wardenCard) {
  const p = effectivePower(state, 'player', playerCard);
  const w = effectivePower(state, 'warden', wardenCard);
  const pAdv = hasAdvantage(playerCard.element, wardenCard.element);
  const wAdv = hasAdvantage(wardenCard.element, playerCard.element);
  let winner = null;
  let damage = 0;
  let text = '';
  if (pAdv) {
    winner = 'player';
    damage = Math.max(1, Math.abs(p.power - w.power));
    text = `Flame answers ${wardenCard.element} — element advantage wins`;
  } else if (wAdv) {
    winner = 'warden';
    damage = Math.max(1, Math.abs(p.power - w.power));
    text = `The Warden's ${wardenCard.element} answers your ${playerCard.element}`;
  } else if (p.power > w.power) {
    winner = 'player';
    damage = p.power - w.power;
    text = `Your ${p.power} overpowers ${w.power}`;
  } else if (w.power > p.power) {
    winner = 'warden';
    damage = w.power - p.power;
    text = `The Warden's ${w.power} overpowers ${p.power}`;
  } else {
    winner = null;
    damage = 0;
    text = `Exact tie at ${p.power} — both cards burn away, no damage`;
  }
  return { winner, damage, text, playerPower: p.power, wardenPower: w.power, playerBonuses: p.bonuses, wardenBonuses: w.bonuses };
}

export function elementName(element) {
  return { flame: 'Flame', tide: 'Tide', stone: 'Stone', gale: 'Gale' }[element] ?? element;
}

export function keywordOf(card) {
  return { flame: 'Surge', tide: 'Flow', stone: 'Guard', gale: 'Echo' }[card.element];
}
