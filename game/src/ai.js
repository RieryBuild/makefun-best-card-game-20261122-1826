// Ember Court — the Warden, the opponent.
// One job: decide what the Warden plays, and telegraph its intent so the
// player can read it and counter it. No rendering, no state mutation
// beyond returning a chosen card.

import { effectivePower, hasAdvantage } from './deck.js';

// Pick the Warden's card for this clash. Greedy by expected outcome:
// an element advantage is worth the most, then raw power, then a Kindle
// chain. One turn in six it bluffs — plays a weak off-element card — so
// its intent line is a tell, not a promise.
export function chooseWardenCard(state, rng) {
  const hand = state.warden.hand;
  if (hand.length === 0) return null;
  if (rng() < 0.16) {
    // Bluff: the weakest card in hand, whatever it is.
    return hand.reduce((a, b) => (a.power <= b.power ? a : b));
  }
  let best = null;
  let bestScore = -Infinity;
  for (const card of hand) {
    const eff = effectivePower(state, 'warden', card);
    let score = eff.power;
    if (state.player.hand.length > 0) {
      // Score against the player's likeliest reply: their strongest card.
      const threat = state.player.hand.reduce((a, b) => (a.power >= b.power ? a : b));
      if (hasAdvantage(card.element, threat.element)) score += 6;
      if (hasAdvantage(threat.element, card.element)) score -= 6;
    }
    if (state.warden.lastElement === card.element) score += 2; // Kindle chain
    if (card.element === 'stone') score += 1; // Guard is worth holding value
    if (score > bestScore) { bestScore = score; best = card; }
  }
  return best;
}

// The telegraphed intent: the element the Warden is eyeing this turn.
// Right about seven times in ten — readable, counterable, never certain.
export function telegraphIntent(state, rng) {
  const hand = state.warden.hand;
  if (hand.length === 0) return null;
  if (rng() < 0.7) {
    const pick = chooseWardenCard(state, rng);
    return pick ? pick.element : null;
  }
  const others = ['flame', 'tide', 'stone', 'gale'].filter(
    (e) => e !== (hand[0] && hand[0].element),
  );
  return others[Math.floor(rng() * others.length)];
}

// A deliberately bad card (for the loss shot): the weakest, always.
export function weakestCard(hand) {
  return hand.reduce((a, b) => (a.power <= b.power ? a : b));
}

// The player's best reply against a known Warden card (for the win shot).
export function bestReply(state, wardenCard) {
  let best = null;
  let bestScore = -Infinity;
  for (const card of state.player.hand) {
    const eff = effectivePower(state, 'player', card);
    let score = eff.power;
    if (hasAdvantage(card.element, wardenCard.element)) score += 6;
    if (hasAdvantage(wardenCard.element, card.element)) score -= 6;
    if (score > bestScore) { bestScore = score; best = card; }
  }
  return best;
}
