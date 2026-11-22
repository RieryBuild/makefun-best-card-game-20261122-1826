// Ember Court — the game loop and turn flow.
// One job: own the state machine (title → play → clash → win/loss),
// run one turn when a card is played or a pass is taken, and drive the
// canvas animation. Rules live in deck.js, choices in ai.js, paint in
// render.js, sound in audio.js.

import { CARD_H, CARD_W, ELEMENTS, START_LIFE } from './config.js';
import {
  drawCards, effectivePower, freshState, keywordOf, resolveClash,
} from './deck.js';
import { bestReply, chooseWardenCard, telegraphIntent, weakestCard } from './ai.js';
import { drawEnd, drawTable, drawTitle } from './render.js';
import { makeInput } from './input.js';
import { sfx } from './audio.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot');

let state = freshState(seed);
let screen = 'title'; // title | play | end
let hoverIndex = -1;
let hotButton = null;
let muted = false;
let clashAnim = null; // 0..1 slide-in for the clash pair
let toast = null;
let toastUntil = 0;
let clashTimer = null;

// embers drift up the table, seeded so shots are stable
const embers = [];
{
  let s = 987654321;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 42; i++) {
    embers.push({ x: rnd() * 1280, y: rnd() * 720, r: 1 + rnd() * 2.2, speed: 0.008 + rnd() * 0.02, phase: rnd() * 900 });
  }
}

function say(line) { statusEl.textContent = line; }

function newDuel() {
  // Shot mode replays the same fixed seed; live duels re-seed from time.
  state = shot ? freshState(seed) : freshState((Date.now() % 2147483646) + 1);
  screen = 'play';
  clashAnim = null;
  toast = null;
  state.intent = telegraphIntent(state, state.rng);
  say(`Duel begins. You have ${START_LIFE} life. The Warden eyes the ${state.intent}.`);
}

function endIfOver() {
  if (state.player.life <= 0 || state.warden.life <= 0) {
    state.phase = 'over';
    state.winner = state.player.life > 0 ? 'player' : 'warden';
    screen = 'end';
    if (state.winner === 'player') sfx.win(); else sfx.lose();
    say(state.winner === 'player' ? 'You win. The court is yours.' : 'The Warden prevails.');
    return true;
  }
  return false;
}

// One full clash: the player card is already chosen; the Warden answers,
// damage lands, keywords pay out, then both sides draw back up.
function playCard(card, opts = {}) {
  if (screen !== 'play' || state.phase !== 'play') return;
  const hand = state.player.hand;
  const idx = hand.indexOf(card);
  if (idx === -1) return;
  hand.splice(idx, 1);

  const wardenCard = opts.wardenCard || chooseWardenCard(state, state.rng);
  if (!wardenCard) return;
  state.warden.hand.splice(state.warden.hand.indexOf(wardenCard), 1);

  const outcome = resolveClash(state, card, wardenCard);
  const kindled = state.player.lastElement === card.element || state.warden.lastElement === wardenCard.element;
  if (kindled) state.stats.kindles++;
  state.clash = {
    playerCard: card, wardenCard, winner: outcome.winner, damage: outcome.damage,
    text: outcome.text, playerPower: outcome.playerPower, wardenPower: outcome.wardenPower,
  };
  state.stats.clashes++;
  clashAnim = 0;

  // keywords that fire on the card itself
  if (card.element === 'stone') state.player.guard = true;
  if (wardenCard.element === 'stone') state.warden.guard = true;

  // damage, with Guard eating it whole
  if (outcome.winner === 'player' && outcome.damage > 0) {
    if (state.warden.guard) {
      state.warden.guard = false;
      toast = 'Warden\'s Guard blocks the damage!';
      sfx.guard();
    } else {
      state.warden.life = Math.max(0, state.warden.life - outcome.damage);
      toast = `You deal ${outcome.damage} damage!`;
      sfx.clashWin();
    }
    if (card.element === 'tide') { drawCards(state, 'player', 1); toast += ' Flow draws a card.'; }
  } else if (outcome.winner === 'warden' && outcome.damage > 0) {
    if (state.player.guard) {
      state.player.guard = false;
      toast = 'Your Guard blocks the damage!';
      sfx.guard();
    } else {
      state.player.life = Math.max(0, state.player.life - outcome.damage);
      toast = `The Warden deals ${outcome.damage} damage!`;
      sfx.clashLose();
    }
    if (wardenCard.element === 'tide') drawCards(state, 'warden', 1);
  } else if (outcome.winner === null) {
    toast = 'Exact tie — both cards burn away.';
    sfx.tie();
  }
  if (kindled) { toast = `KINDLE +2! ${toast}`; sfx.kindle(); }
  toastUntil = performance.now() + 2600;

  state.discard.push(card, wardenCard);
  state.player.lastElement = card.element;
  state.player.lastPower = outcome.playerPower;
  state.warden.lastElement = wardenCard.element;
  state.warden.lastPower = outcome.wardenPower;
  state.phase = 'clash';
  say(`Clash: your ${card.element} ${card.power} against the Warden's ${wardenCard.element} ${wardenCard.power}. ${outcome.text}.`);

  clearTimeout(clashTimer);
  const advance = () => {
    if (endIfOver()) return;
    state.turn++;
    drawCards(state, 'player', 1);
    drawCards(state, 'warden', 1);
    state.intent = telegraphIntent(state, state.rng);
    state.phase = 'play';
    say(`Turn ${state.turn}. The Warden eyes the ${state.intent}.`);
  };
  // A held clash freezes on the clash frame (the play screenshot). Shot
  // mode otherwise advances synchronously so a screenshot can be taken of
  // the settled state; live play lets the clash sit for a beat first.
  if (opts.hold) { /* stay on the clash */ }
  else if (opts.instant || shot) advance();
  else clashTimer = setTimeout(advance, 1500);
}

function doPass() {
  if (screen !== 'play' || state.phase !== 'play') return;
  state.stats.passes++;
  drawCards(state, 'player', 1);
  state.player.life = Math.min(START_LIFE, state.player.life + 1);
  state.warden.life = Math.max(0, state.warden.life - 0); // pass deals nothing
  // the Warden still answers a pass with a free look: it draws too
  drawCards(state, 'warden', 1);
  state.turn++;
  state.intent = telegraphIntent(state, state.rng);
  toast = 'Pass — you draw 1 and mend 1 life.';
  toastUntil = performance.now() + 2200;
  sfx.deal();
  say(`Turn ${state.turn}. You passed, drew a card and mended 1 life.`);
}

function doMend() {
  if (screen !== 'play' || state.phase !== 'play') return;
  if (state.player.life >= START_LIFE) return;
  state.player.life = Math.min(START_LIFE, state.player.life + 1);
  state.turn++;
  drawCards(state, 'warden', 1);
  state.intent = telegraphIntent(state, state.rng);
  toast = 'Mend — +1 life, turn passes.';
  toastUntil = performance.now() + 2200;
  sfx.deal();
}

function pointIn(rect, x, y) {
  return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

let ui = { handRects: [], buttons: {}, embers, time: 0, hoverIndex: -1, hotButton: null, muted: false, clashAnim: null, toast: null, callouts: false };

function handleClick(p) {
  sfx.unlock();
  if (screen === 'title') { newDuel(); return; }
  if (screen === 'end') { newDuel(); return; }
  if (state.phase !== 'play') return;
  for (const r of ui.handRects) {
    if (pointIn(r, p.x, p.y)) { playCard(state.player.hand[r.index]); return; }
  }
  if (pointIn(ui.buttons.pass, p.x, p.y)) { doPass(); return; }
  if (pointIn(ui.buttons.mend, p.x, p.y)) { doMend(); return; }
  if (pointIn(ui.buttons.sound, p.x, p.y)) { muted = sfx.toggleMute(); ui.muted = muted; }
}

function handleHover(p) {
  hoverIndex = -1;
  hotButton = null;
  if (screen !== 'play') return;
  for (const r of ui.handRects) {
    if (pointIn(r, p.x, p.y)) { hoverIndex = r.index; break; }
  }
  if (pointIn(ui.buttons.pass, p.x, p.y)) hotButton = 'pass';
  else if (pointIn(ui.buttons.mend, p.x, p.y)) hotButton = 'mend';
  canvas.style.cursor = hoverIndex >= 0 || hotButton ? 'pointer' : 'default';
}

makeInput(canvas, {
  click: handleClick,
  hover: handleHover,
  playIndex(i) { if (screen === 'play' && state.player.hand[i]) playCard(state.player.hand[i]); },
  pass: doPass,
  mend: doMend,
  confirm() { if (screen !== 'play') newDuel(); },
  toggleSound() { muted = sfx.toggleMute(); ui.muted = muted; },
});

// ---- screenshot mode: play the real rules forward from the seed ----
if (shot) {
  screen = setupShot(shot, seed, {
    newDuel, playCard, doPass,
    chooseWardenCard, bestReply, weakestCard,
    getState: () => state,
  });
  document.title = `SHOT_READY:${shot}`;
}

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 1280 * dpr;
  canvas.height = 720 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

fitCanvas();
window.addEventListener('resize', fitCanvas);

let last = performance.now();
function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;
  ui.time = now;
  ui.hoverIndex = hoverIndex;
  ui.hotButton = hotButton;
  ui.muted = muted;
  ui.clashAnim = clashAnim;
  ui.toast = now < toastUntil ? toast : null;
  ui.callouts = shot === 'play';
  if (clashAnim !== null && clashAnim < 1) clashAnim = Math.min(1, clashAnim + dt / 260);
  ctx.clearRect(0, 0, 1280, 720);
  if (screen === 'title') drawTitle(ctx, ui);
  else if (screen === 'end') drawEnd(ctx, state, ui);
  else drawTable(ctx, state, ui);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
