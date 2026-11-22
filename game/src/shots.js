// Ember Court — screenshot scenes.
// One job: for ?shot=title|play|win|loss, drive the REAL game forward from
// the fixed seed with a scripted autopilot, and hand back the screen to
// photograph. Nothing here is composited: every frame is a state the rules
// actually reached. The autopilot's strategy is the only difference
// between scenes — best replies for a win, worst cards for a loss.

// Play one turn: the Warden picks first (so the reply can be chosen
// against it), then the player answers. `hold` freezes the final clash.
function oneTurn(api, playerPick, hold) {
  const state = api.getState();
  if (state.phase === 'over') return false;
  const wardenCard = api.chooseWardenCard(state, state.rng);
  if (!wardenCard) return false;
  const card = playerPick(state, wardenCard);
  if (!card) return false;
  api.playCard(card, { wardenCard, instant: true, hold: !!hold });
  return true;
}

// Best reply: the strongest answer to the Warden's known card.
function bestReplyPick(api) {
  return (state, wardenCard) => api.bestReply(state, wardenCard);
}

// Worst card: the weakest in hand, every time.
function worstPick(api) {
  return (state) => api.weakestCard(state.player.hand);
}

export function setupShot(shot, seed, api) {
  if (shot === 'title') return 'title';

  api.newDuel();
  const state = api.getState();

  if (shot === 'play') {
    // Four settled turns, then a fifth clash held on screen: a mid-duel
    // table with a live clash, both hands, life totals and the Warden's
    // telegraphed intent all visible at once.
    for (let i = 0; i < 4; i++) {
      if (!oneTurn(api, bestReplyPick(api), false)) break;
      if (api.getState().phase === 'over') break;
    }
    oneTurn(api, bestReplyPick(api), true);
    return 'play';
  }

  if (shot === 'win') {
    // The player answers every Warden card with its best reply while the
    // Warden plays its weakest — the rules, played well, end in a win.
    for (let i = 0; i < 80; i++) {
      const st = api.getState();
      if (st.phase === 'over') break;
      // Warden plays its weakest card this scene.
      const wardenCard = api.weakestCard(st.warden.hand);
      const card = api.bestReply(st, wardenCard);
      if (!card) break;
      api.playCard(card, { wardenCard, instant: true });
    }
    return api.getState().phase === 'over' ? 'end' : 'play';
  }

  if (shot === 'loss') {
    // The player throws its weakest card every turn while the Warden plays
    // greedy — the rules, played badly, end in a loss.
    for (let i = 0; i < 80; i++) {
      const st = api.getState();
      if (st.phase === 'over') break;
      if (!oneTurn(api, worstPick(api), false)) break;
    }
    return api.getState().phase === 'over' ? 'end' : 'play';
  }

  return 'title';
}
