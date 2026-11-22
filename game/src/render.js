// Ember Court — everything the eye sees, drawn on one canvas.
// One job: paint the table, the cards, the HUD and the screens. It reads
// game state and never changes it.

import { CARD_H, CARD_W, ELEMENTS, PALETTE, VIEW_H, VIEW_W } from './config.js';
import { elementName, keywordOf } from './deck.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, weight = 'bold', align = 'center', font = 'Georgia, serif') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- element icons: shape as well as colour ----
export function drawIcon(ctx, element, cx, cy, s, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (element === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.bezierCurveTo(s * 0.42, -s * 0.18, s * 0.34, s * 0.28, s * 0.12, s * 0.42);
    ctx.bezierCurveTo(s * 0.3, s * 0.2, s * 0.05, s * 0.05, -s * 0.02, -s * 0.12);
    ctx.bezierCurveTo(-s * 0.08, s * 0.08, -s * 0.28, s * 0.12, -s * 0.3, s * 0.3);
    ctx.bezierCurveTo(-s * 0.42, s * 0.05, -s * 0.3, -s * 0.3, 0, -s * 0.55);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 120, 0.9)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.18, s * 0.11, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (element === 'tide') {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, i * s * 0.28);
      ctx.quadraticCurveTo(-s * 0.25, i * s * 0.28 - s * 0.26, 0, i * s * 0.28);
      ctx.quadraticCurveTo(s * 0.25, i * s * 0.28 + s * 0.26, s * 0.5, i * s * 0.28);
      ctx.stroke();
    }
  } else if (element === 'stone') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, s * 0.45);
    ctx.lineTo(-s * 0.12, -s * 0.5);
    ctx.lineTo(s * 0.18, s * 0.05);
    ctx.lineTo(s * 0.42, -s * 0.28);
    ctx.lineTo(s * 0.58, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, -s * 0.5);
    ctx.lineTo(s * 0.05, -s * 0.22);
    ctx.lineTo(-s * 0.28, -s * 0.18);
    ctx.closePath();
    ctx.fill();
  } else {
    // gale: three sweeping arcs, a swirl
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, (i - 1) * s * 0.26, s * (0.42 - i * 0.09), Math.PI * 0.15, Math.PI * 1.25);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.32, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- felt table, pre-rendered once ----
let feltCache = null;
export function feltCanvas() {
  if (feltCache) return feltCache;
  const c = document.createElement('canvas');
  c.width = VIEW_W; c.height = VIEW_H;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(640, 330, 80, 640, 360, 760);
  grad.addColorStop(0, PALETTE.feltLight);
  grad.addColorStop(0.55, PALETTE.felt);
  grad.addColorStop(1, PALETTE.feltDeep);
  g.fillStyle = grad;
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  // woven felt speckle
  let seed = 1234567;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * VIEW_W, y = rnd() * VIEW_H;
    g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    g.fillRect(x, y, 1.6, 1.6);
  }
  // faint diamond weave
  g.strokeStyle = 'rgba(246, 217, 138, 0.05)';
  g.lineWidth = 1;
  for (let x = -VIEW_H; x < VIEW_W + VIEW_H; x += 46) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + VIEW_H, VIEW_H); g.stroke();
    g.beginPath(); g.moveTo(x + VIEW_H, 0); g.lineTo(x, VIEW_H); g.stroke();
  }
  // gold inlay border, double line
  g.strokeStyle = PALETTE.gold;
  g.lineWidth = 4;
  roundRect(g, 14, 14, VIEW_W - 28, VIEW_H - 28, 26);
  g.stroke();
  g.strokeStyle = 'rgba(217, 164, 65, 0.4)';
  g.lineWidth = 1.5;
  roundRect(g, 26, 26, VIEW_W - 52, VIEW_H - 52, 20);
  g.stroke();
  // corner flourishes
  g.fillStyle = PALETTE.gold;
  for (const [cx, cy] of [[40, 40], [1240, 40], [40, 680], [1240, 680]]) {
    g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill();
  }
  feltCache = c;
  return c;
}

// ---- a single face-up card ----
export function drawCard(ctx, card, x, y, w = CARD_W, h = CARD_H, opts = {}) {
  const el = ELEMENTS[card.element];
  const scale = w / CARD_W;
  ctx.save();
  if (opts.lift) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10; }
  else { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5; }
  // face
  const face = ctx.createLinearGradient(x, y, x, y + h);
  face.addColorStop(0, '#fffaf0');
  face.addColorStop(1, PALETTE.cream);
  roundRect(ctx, x, y, w, h, 14 * scale);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // element band across the top
  const band = ctx.createLinearGradient(x, y, x + w, y);
  band.addColorStop(0, el.deep);
  band.addColorStop(0.5, el.colour);
  band.addColorStop(1, el.deep);
  ctx.save();
  roundRect(ctx, x, y, w, h, 14 * scale);
  ctx.clip();
  ctx.fillStyle = band;
  ctx.fillRect(x, y, w, 44 * scale);
  ctx.restore();
  // element wash across the lower face + a faint icon watermark
  const wash = ctx.createLinearGradient(x, y + 44 * scale, x, y + h);
  wash.addColorStop(0, 'rgba(255,255,255,0)');
  wash.addColorStop(1, el.colour + '22');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y + 44 * scale, w, h - 44 * scale);
  ctx.save();
  ctx.globalAlpha = 0.08;
  drawIcon(ctx, card.element, x + w / 2, y + 96 * scale, 108 * scale, el.colour);
  ctx.restore();
  // gold rim
  ctx.strokeStyle = opts.gold ? PALETTE.goldLight : 'rgba(138, 100, 32, 0.7)';
  ctx.lineWidth = opts.gold ? 3.5 : 2;
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 13 * scale);
  ctx.stroke();
  // inner hairline
  ctx.strokeStyle = 'rgba(138, 100, 32, 0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 6 * scale, y + 6 * scale, w - 12 * scale, h - 12 * scale, 9 * scale);
  ctx.stroke();
  // name + icon in the band
  text(ctx, el.name.toUpperCase(), x + w / 2, y + 16 * scale, 15 * scale, '#fff8e6', 'bold');
  drawIcon(ctx, card.element, x + w / 2, y + 82 * scale, 52 * scale, el.colour);
  // big power numeral
  text(ctx, String(card.power), x + w / 2, y + 128 * scale, 44 * scale, PALETTE.ink, 'bold');
  // keyword banner
  ctx.fillStyle = el.deep;
  roundRect(ctx, x + 10 * scale, y + h - 30 * scale, w - 20 * scale, 20 * scale, 9 * scale);
  ctx.fill();
  text(ctx, keywordOf(card).toUpperCase(), x + w / 2, y + h - 20 * scale, 11.5 * scale, '#ffe9a8', 'bold');
  if (opts.dim) { ctx.fillStyle = 'rgba(10, 30, 28, 0.45)'; roundRect(ctx, x, y, w, h, 14 * scale); ctx.fill(); }
  ctx.restore();
}

// ---- patterned card back ----
export function drawCardBack(ctx, x, y, w = CARD_W, h = CARD_H, small = false) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  const back = ctx.createLinearGradient(x, y, x + w, y + h);
  back.addColorStop(0, '#5c1a12');
  back.addColorStop(0.5, '#7a2415');
  back.addColorStop(1, '#4a130c');
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = back;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 11);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(246, 217, 138, 0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 8);
  ctx.stroke();
  if (!small) {
    // gold ember diamond emblem
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(-22, -22, 44, 44);
    ctx.fillStyle = '#7a2415';
    ctx.fillRect(-15, -15, 30, 30);
    ctx.restore();
    ctx.fillStyle = PALETTE.goldLight;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✦', x + w / 2, y + h / 2);
  }
  ctx.restore();
}

function heartRow(ctx, cx, y, life, max = 20) {
  // heart pips: one pip per 2 life, half-pip for an odd remainder
  const pips = Math.ceil(max / 2);
  const filled = life / 2;
  const w = 15;
  const x0 = cx - (pips * w) / 2;
  for (let i = 0; i < pips; i++) {
    const fx = x0 + i * w + w / 2;
    ctx.save();
    ctx.translate(fx, y);
    ctx.scale(0.62, 0.62);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-11, -4, -6, -12, 0, -5);
    ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
    ctx.closePath();
    if (i < Math.floor(filled)) ctx.fillStyle = '#ff5a4e';
    else if (i < filled) ctx.fillStyle = 'rgba(255, 90, 78, 0.45)';
    else ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fill();
    ctx.restore();
  }
}

function lifePanel(ctx, label, life, x, y, w, alignLeft) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, 74, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, 74, 12);
  ctx.stroke();
  const cx = x + w / 2;
  text(ctx, label, cx, y + 15, 12, PALETTE.goldLight, 'bold');
  text(ctx, String(life), cx - 76, y + 46, 34, life <= 5 ? '#ff6a5e' : '#fff8e6', 'bold');
  heartRow(ctx, cx + 30, y + 48, life);
}

function button(ctx, x, y, w, h, label, sub, enabled, hot) {
  ctx.save();
  ctx.fillStyle = enabled ? (hot ? '#e8b64c' : '#c99a35') : 'rgba(120, 110, 90, 0.5)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldLight;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 - (sub ? 8 : 0), 17, '#241d12', 'bold');
  if (sub) text(ctx, sub, x + w / 2, y + h / 2 + 12, 11, '#4a3a1a', 'bold');
  ctx.restore();
  return { x, y, w, h };
}

function deckPile(ctx, x, y, count, label) {
  for (let i = 2; i >= 0; i--) drawCardBack(ctx, x + i * 3, y - i * 3, 74, 104, true);
  text(ctx, label, x + 37, y + 122, 12, PALETTE.goldLight, 'bold');
  text(ctx, `${count} left`, x + 37, y + 140, 11, 'rgba(255,248,230,0.75)', 'bold');
}

// ---- the whole table ----
export function drawTable(ctx, state, ui) {
  ctx.drawImage(feltCanvas(), 0, 0);
  const t = ui.time;

  // drifting embers
  for (const e of ui.embers) {
    const alpha = 0.25 + 0.55 * Math.abs(Math.sin((t + e.phase) / 900));
    ctx.fillStyle = `rgba(255, ${122 + Math.floor(60 * Math.sin(e.phase))}, 47, ${alpha})`;
    ctx.beginPath();
    ctx.arc(e.x, ((e.y - t * e.speed) % 760 + 760) % 760, e.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // top bar
  ctx.fillStyle = 'rgba(4, 22, 19, 0.72)';
  ctx.fillRect(28, 28, VIEW_W - 56, 44);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28, 28, VIEW_W - 56, 44);
  text(ctx, 'EMBER COURT', 48, 51, 22, PALETTE.goldLight, 'bold', 'left');
  text(ctx, 'an elemental duel', 218, 53, 13, 'rgba(255,248,230,0.7)', 'bold', 'left');
  text(ctx, `TURN ${state.turn}`, 640, 51, 17, '#fff8e6', 'bold');
  text(ctx, state.phase === 'over' ? (state.winner === 'player' ? 'YOU WIN' : 'WARDEN WINS') : 'your move — click a card, or pass', 1232, 51, 13, 'rgba(255,248,230,0.8)', 'bold', 'right');

  // life panels
  lifePanel(ctx, 'THE WARDEN', state.warden.life, 40, 88, 250);
  lifePanel(ctx, 'YOU', state.player.life, 990, 88, 250);
  if (state.player.guard) text(ctx, '🛡 GUARD UP — next damage blocked', 1115, 178, 12, '#8ff5c8', 'bold');
  if (state.warden.guard) text(ctx, '🛡 WARDEN GUARDED', 165, 178, 12, '#8ff5c8', 'bold');

  // Warden hand: face-down backs, fanned
  const wHand = state.warden.hand;
  const wStart = 640 - ((wHand.length - 1) * 46) / 2 - 37;
  wHand.forEach((c, i) => {
    const x = wStart + i * 46;
    const y = 92 + Math.abs(i - (wHand.length - 1) / 2) * 7;
    drawCardBack(ctx, x, y, 74, 104, true);
  });
  text(ctx, `Warden's hand · ${wHand.length} cards`, 640, 216, 12, 'rgba(255,248,230,0.7)', 'bold');

  // Warden intent telegraph — shown on your turn, and held on the play
  // screenshot so the frame itself teaches the tell.
  if (state.intent && (state.phase === 'play' || ui.callouts)) {
    const el = ELEMENTS[state.intent];
    ctx.fillStyle = 'rgba(6, 32, 29, 0.85)';
    roundRect(ctx, 440, 232, 400, 34, 17);
    ctx.fill();
    ctx.strokeStyle = el.colour;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 440, 232, 400, 34, 17);
    ctx.stroke();
    drawIcon(ctx, state.intent, 468, 249, 22, el.light);
    text(ctx, `The Warden eyes the ${el.name}…`, 640, 250, 15, '#fff8e6', 'bold');
  }

  // court circle: a faint gold ring + ember glow behind the clash zone
  ctx.save();
  const glow = ctx.createRadialGradient(640, 395, 20, 640, 395, 210);
  glow.addColorStop(0, 'rgba(255, 122, 47, 0.10)');
  glow.addColorStop(1, 'rgba(255, 122, 47, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(430, 185, 420, 420);
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.16)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(640, 395, 128, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.10)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(640, 395, 142, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // clash zone
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  roundRect(ctx, 330, 282, 620, 226, 18);
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, '— CLASH —', 640, 298, 12, PALETTE.goldLight, 'bold');
  if (state.clash) {
    const cl = state.clash;
    const anim = ui.clashAnim; // 0..1 slide-in
    const slide = anim == null ? 0 : (1 - anim) * 90;
    drawCard(ctx, cl.playerCard, 470 - slide, 306, 112, 158, { gold: cl.winner === 'player' });
    drawCard(ctx, cl.wardenCard, 698 + slide, 306, 112, 158, { gold: cl.winner === 'warden' });
    text(ctx, 'VS', 640, 384, 26, PALETTE.goldLight, 'bold');
    const resultY = 500;
    if (cl.winner === 'player') text(ctx, `YOU WIN THE CLASH  ·  ${cl.damage} damage`, 640, resultY - 16, 16, '#8ff5c8', 'bold');
    else if (cl.winner === 'warden') text(ctx, `WARDEN WINS THE CLASH  ·  ${cl.damage} damage`, 640, resultY - 16, 16, '#ff8a7a', 'bold');
    else text(ctx, 'EXACT TIE — both cards burn away', 640, resultY - 16, 16, '#ffe9a8', 'bold');
    text(ctx, cl.text, 640, resultY + 6, 13, 'rgba(255,248,230,0.85)', 'bold');
  } else {
    text(ctx, 'Play a card into the clash — or pass to draw & mend', 640, 392, 15, 'rgba(255,248,230,0.65)', 'bold');
    text(ctx, 'Flame > Gale > Stone > Tide > Flame', 640, 418, 13, PALETTE.goldLight, 'bold');
  }

  // deck + discard piles
  deckPile(ctx, 52, 330, state.deck.length, 'DECK');
  const top = state.discard[state.discard.length - 1];
  if (top) drawCard(ctx, top, 1120, 330, 74, 104, {});
  else { ctx.strokeStyle = 'rgba(255,248,230,0.3)'; ctx.lineWidth = 1.5; roundRect(ctx, 1120, 330, 74, 104, 10); ctx.stroke(); }
  text(ctx, 'DISCARD', 1157, 452, 12, PALETTE.goldLight, 'bold');
  text(ctx, `${state.discard.length} cards`, 1157, 470, 11, 'rgba(255,248,230,0.75)', 'bold');

  // legend panel (left rail, under the Warden's life panel)
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 40, 172, 250, 150, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 40, 172, 250, 150, 12);
  ctx.stroke();
  text(ctx, 'THE WHEEL', 165, 190, 13, PALETTE.goldLight, 'bold');
  const wheel = [['flame', 'beats', 'gale'], ['gale', 'beats', 'stone'], ['stone', 'beats', 'tide'], ['tide', 'beats', 'flame']];
  wheel.forEach((row, i) => {
    const y = 212 + i * 22;
    drawIcon(ctx, row[0], 78, y, 18, ELEMENTS[row[0]].light);
    text(ctx, '>', 118, y, 14, '#fff8e6', 'bold');
    drawIcon(ctx, row[2], 158, y, 18, ELEMENTS[row[2]].light);
    text(ctx, elementName(row[0]), 205, y, 12, '#fff8e6', 'bold', 'left');
  });
  text(ctx, 'KINDLE: same element twice = +2', 165, 308, 12, '#ffb347', 'bold');

  // status panel (right rail)
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 1020, 500, 220, 196, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  roundRect(ctx, 1020, 500, 220, 196, 12);
  ctx.stroke();
  text(ctx, 'STATUS', 1130, 520, 13, PALETTE.goldLight, 'bold');
  const last = state.clash ? state.clash.text : 'No clash yet — open the duel.';
  text(ctx, `Turn ${state.turn}  ·  Deck ${state.deck.length}`, 1130, 548, 13, '#fff8e6', 'bold');
  text(ctx, `You ${state.player.life}  ·  Warden ${state.warden.life}`, 1130, 572, 13, '#fff8e6', 'bold');
  text(ctx, `Kindles ${state.stats.kindles}  ·  Passes ${state.stats.passes}`, 1130, 596, 13, 'rgba(255,248,230,0.85)', 'bold');
  wrapText(ctx, `Last clash: ${last}`, 1036, 622, 188, 13, 'rgba(255,248,230,0.85)', 3);

  // player hand, fanned along the bottom, centred right of the buttons
  const hand = state.player.hand;
  const spacing = hand.length > 1 ? Math.min(140, (700 - CARD_W) / (hand.length - 1)) : 0;
  const handW = CARD_W + spacing * (hand.length - 1);
  const hx0 = 660 - handW / 2;
  const hy = 512;
  ui.handRects = [];
  hand.forEach((card, i) => {
    const fan = (i - (hand.length - 1) / 2);
    const x = hx0 + i * spacing;
    const y = hy + Math.abs(fan) * 9 - (ui.hoverIndex === i ? 26 : 0);
    const rot = fan * 0.03;
    ctx.save();
    ctx.translate(x + CARD_W / 2, y + CARD_H / 2);
    ctx.rotate(rot);
    ctx.translate(-CARD_W / 2, -CARD_H / 2);
    drawCard(ctx, card, 0, 0, CARD_W, CARD_H, { lift: ui.hoverIndex === i, gold: ui.hoverIndex === i });
    ctx.restore();
    ui.handRects.push({ x, y, w: CARD_W, h: CARD_H, index: i });
  });
  // (The hand hint lives on the left rail and the title screen, so the
  // bottom edge stays clean — the fanned cards reach y≈698.)


  // action buttons (left rail, below the legend — clear of the hand fan)
  ui.buttons = {
    pass: button(ctx, 40, 500, 220, 52, 'PASS', 'draw 1 · mend 1', state.phase === 'play', ui.hotButton === 'pass'),
    mend: button(ctx, 40, 562, 220, 52, 'MEND', 'heal 1 · no draw', state.phase === 'play' && state.player.life < 20, ui.hotButton === 'mend'),
    sound: button(ctx, 40, 624, 220, 30, ui.muted ? 'SOUND OFF' : 'SOUND ON', '', true, false),
  };
  text(ctx, 'Keys 1–7 play · P pass · M mend', 150, 682, 12, 'rgba(255,248,230,0.7)', 'bold');

  // in-frame callouts (shot mode / teaching layer)
  if (ui.callouts) {
    callout(ctx, 640, 288, 'KINDLE: same element twice in a row = +2 power');
  }

  // (The clash result line inside the clash zone already reports damage;
  // a floating toast would sit on top of the Warden's hand, so there is none.)
}

function callout(ctx, x, y, str, align = 'center') {
  ctx.save();
  ctx.font = 'bold 13px Georgia, serif';
  const w = ctx.measureText(str).width + 28;
  const bx = align === 'left' ? x : x - w / 2;
  ctx.fillStyle = 'rgba(20, 12, 4, 0.88)';
  roundRect(ctx, bx, y - 15, w, 30, 15);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  roundRect(ctx, bx, y - 15, w, 30, 15);
  ctx.stroke();
  text(ctx, str, bx + w / 2, y + 1, 13, '#ffe9a8', 'bold');
  ctx.restore();
}

function wrapText(ctx, str, x, y, maxW, size, colour, maxLines) {
  ctx.fillStyle = colour;
  ctx.font = `bold ${size}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const words = str.split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + lines * 17);
      lines++;
      if (lines >= maxLines) return;
      line = word;
    } else line = test;
  }
  if (lines < maxLines) ctx.fillText(line, x, y + lines * 17);
}

// ---- screens ----
export function drawTitle(ctx, ui) {
  ctx.drawImage(feltCanvas(), 0, 0);
  for (const e of ui.embers) {
    ctx.fillStyle = `rgba(255, 140, 60, ${0.3 + 0.5 * Math.abs(Math.sin((ui.time + e.phase) / 900))})`;
    ctx.beginPath();
    ctx.arc(e.x, ((e.y - ui.time * e.speed) % 760 + 760) % 760, e.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // banner
  ctx.fillStyle = 'rgba(6, 32, 29, 0.85)';
  roundRect(ctx, 240, 120, 800, 190, 22);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  roundRect(ctx, 240, 120, 800, 190, 22);
  ctx.stroke();
  text(ctx, '✦ EMBER COURT ✦', 640, 178, 56, PALETTE.goldLight, 'bold');
  text(ctx, 'an elemental duel of cards — outwit the Warden', 640, 226, 18, '#fff8e6', 'bold');
  text(ctx, 'Flame > Gale > Stone > Tide > Flame   ·   first to 0 life loses', 640, 262, 15, 'rgba(255,248,230,0.8)', 'bold');

  // four sample cards fanned across the middle
  const samples = [
    { id: 0, element: 'flame', power: 7 },
    { id: 0, element: 'tide', power: 5 },
    { id: 0, element: 'stone', power: 8 },
    { id: 0, element: 'gale', power: 6 },
  ];
  samples.forEach((card, i) => {
    const x = 640 - 2 * 150 + i * 150 - CARD_W / 2 + (i % 2 ? 6 : -6);
    const y = 360 + (i % 2 ? 14 : 0);
    drawCard(ctx, card, x, y, CARD_W, CARD_H, { lift: true });
  });
  text(ctx, 'Surge · Flow · Guard · Echo — every element has a trick. Kindle a chain for +2.', 640, 590, 15, '#ffe9a8', 'bold');
  text(ctx, 'CLICK or press ENTER to take your seat at the court', 640, 622, 17, '#fff8e6', 'bold');
  text(ctx, 'Keys 1–7 play a card · P pass (draw + mend) · M mend · S sound', 640, 652, 13, 'rgba(255,248,230,0.7)', 'bold');
}

function burst(ctx, cx, cy, t, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + t / 900;
    const len = 150 + 60 * Math.sin(t / 300 + i);
    ctx.strokeStyle = i % 2 ? colour : 'rgba(246, 217, 138, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 40, Math.sin(a) * 40);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawEnd(ctx, state, ui) {
  drawTable(ctx, state, ui);
  ctx.fillStyle = state.winner === 'player' ? 'rgba(10, 40, 20, 0.72)' : 'rgba(40, 10, 8, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (state.winner === 'player') burst(ctx, 640, 300, ui.time, PALETTE.gold);
  text(ctx, state.winner === 'player' ? 'THE COURT IS YOURS' : 'THE WARDEN PREVAILS', 640, 300, 52,
    state.winner === 'player' ? PALETTE.goldLight : '#ff8a7a', 'bold');
  const line = state.winner === 'player'
    ? `You broke the Warden's court in ${state.turn} turns — ${state.stats.kindles} kindles lit.`
    : `The Warden holds the court — ${state.stats.clashes} clashes, and the embers go cold.`;
  text(ctx, line, 640, 356, 17, '#fff8e6', 'bold');
  text(ctx, `Final life — You ${state.player.life} · Warden ${state.warden.life}`, 640, 392, 16, 'rgba(255,248,230,0.85)', 'bold');
  text(ctx, 'CLICK or press ENTER to duel again', 640, 452, 17, PALETTE.goldLight, 'bold');
}
