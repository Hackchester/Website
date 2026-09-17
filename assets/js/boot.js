/* =========================================================================
   boot.js — the "Linux boot" splash on the home page.
   Plays once per browser session; any key / click / tap skips it.
   Edit the LINES array to change what it prints.
   ========================================================================= */
(function () {
  const el = document.getElementById('boot');
  const out = document.getElementById('boot-text');
  if (!el || !out) return;

  const KEY = 'hc-booted';
  let played = false;
  try { played = sessionStorage.getItem(KEY) === '1'; } catch (_) {}
  // ?noboot in the URL skips the splash (handy when developing)
  if (played || HC.reducedMotion || location.search.includes('noboot')) return;

  // [status, text, delay-after-ms]
  const LINES = [
    ['',           'Hackchester OS 4.0.4 (kernel 6.x-hardened)', 250],
    ['[  OK  ]',   'Mounting root filesystem', 90],
    ['[  OK  ]',   'Loading essential drivers', 80],
    ['[  OK  ]',   'Starting firewall', 120],
    ['[FAILED]',   'Failed to start network services (eth0: not trusted)', 260],
    ['[  OK  ]',   'Starting sshd', 80],
    ['[  OK  ]',   'Starting ctf-training.service', 90],
    ['[ INFO ]',   'Checking disk: 1337 flags, 0 errors', 150],
    ['[  OK  ]',   'Starting hackchester.net', 200],
    ['',           '', 100],
    ['',           'login: root', 220],
    ['',           'password: ********', 350],
    ['',           'Access granted.', 400],
  ];

  el.hidden = false;
  document.body.style.overflow = 'hidden';
  let stopped = false;

  function finish() {
    if (stopped) return;
    stopped = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
    el.classList.add('is-done');
    document.body.style.overflow = '';
    window.removeEventListener('keydown', finish);
    setTimeout(() => el.remove(), 600);
  }
  window.addEventListener('keydown', finish);
  el.addEventListener('click', finish);
  el.addEventListener('touchstart', finish, { passive: true });

  const cls = { '[  OK  ]': 'ok', '[FAILED]': 'failed', '[ INFO ]': 'info' };
  (async () => {
    for (const [status, text, delay] of LINES) {
      if (stopped) return;
      const tag = status ? `<span class="${cls[status]}">${status}</span> ` : '';
      out.innerHTML += `${tag}${text}\n`;
      await new Promise(r => setTimeout(r, delay));
    }
    setTimeout(finish, 250);
  })();
})();
