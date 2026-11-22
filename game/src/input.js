// Ember Court — mouse and keyboard input.
// One job: turn pointer and key events into game intents (play a card,
// pass, mend, start, restart, mute). It never draws and never owns rules;
// it hands coordinates to main.js, which decides what was hit.

export function makeInput(canvas, handlers) {
  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('click', (event) => {
    handlers.click(toGameCoords(event));
  });
  canvas.addEventListener('mousemove', (event) => {
    handlers.hover(toGameCoords(event));
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '7') handlers.playIndex(Number(key) - 1);
    else if (key === 'p') handlers.pass();
    else if (key === 'm') handlers.mend();
    else if (key === 'enter' || key === ' ') handlers.confirm();
    else if (key === 's') handlers.toggleSound();
  });
}
