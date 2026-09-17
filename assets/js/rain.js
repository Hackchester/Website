/* =========================================================================
   rain.js — falling-glyph canvas behind the hero. No dependencies.
   Off under prefers-reduced-motion; pauses when the tab is hidden.
   ========================================================================= */
(function () {
  const canvas = document.getElementById('rain');
  if (!canvas || HC.reducedMotion) return;

  const ctx = canvas.getContext('2d');
  const GLYPHS = '0123456789ABCDEFｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ{}[]<>/\\|;:$#@';
  const FONT = 14;
  const FPS = 24;

  let cols = 0, drops = [], w = 0, h = 0, raf = 0, last = 0;

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = r.width;
    h = canvas.height = r.height;
    cols = Math.floor(w / FONT);
    drops = Array.from({ length: cols }, () => Math.random() * -h / FONT);
    ctx.font = `${FONT}px ${getComputedStyle(document.body).fontFamily}`;
  }

  function accent() {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#39ff8a';
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (t - last < 1000 / FPS) return;
    last = t;

    ctx.fillStyle = 'rgba(6, 9, 9, 0.18)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent();

    for (let i = 0; i < cols; i++) {
      const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      ctx.fillText(ch, i * FONT, drops[i] * FONT);
      if (drops[i] * FONT > h && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.6 + Math.random() * 0.4;
    }
  }

  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  function stop()  { cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  resize();
  start();
})();
