// Ember Court — sound, synthesized live, no audio files.
// One job: WebAudio bleeps for play, clash, damage, win and loss. Nothing
// is fetched; every note is an oscillator built at call time.

let ctx = null;
let muted = false;
let unlocked = false; // true only after a user gesture (click/key), per autoplay policy

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, when, dur, type, gain) {
  if (!unlocked) return; // never probe audio before a gesture: no console noise
  const ac = audioCtx();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, ac.currentTime + when);
  amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + when + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + dur + 0.05);
}

export const sfx = {
  unlock() { unlocked = true; audioCtx(); },
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
  deal() { tone(520, 0, 0.09, 'triangle', 0.12); tone(660, 0.07, 0.09, 'triangle', 0.1); },
  playCard() { tone(392, 0, 0.1, 'square', 0.08); tone(523, 0.08, 0.12, 'square', 0.08); },
  kindle() { tone(330, 0, 0.08, 'sawtooth', 0.07); tone(440, 0.07, 0.08, 'sawtooth', 0.07); tone(660, 0.14, 0.14, 'sawtooth', 0.07); },
  clashWin() { tone(523, 0, 0.1, 'triangle', 0.14); tone(659, 0.09, 0.1, 'triangle', 0.14); tone(784, 0.18, 0.18, 'triangle', 0.14); },
  clashLose() { tone(220, 0, 0.14, 'sawtooth', 0.1); tone(165, 0.12, 0.2, 'sawtooth', 0.1); },
  tie() { tone(440, 0, 0.08, 'sine', 0.1); tone(440, 0.1, 0.08, 'sine', 0.1); },
  guard() { tone(196, 0, 0.16, 'sine', 0.14); tone(294, 0.1, 0.2, 'sine', 0.12); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.22, 'triangle', 0.15)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.26, 'sawtooth', 0.09)); },
};
