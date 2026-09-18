/* =========================================================================
   site.js — shared bits for every page.
   - injects the nav and footer (edit them here, once)
   - loads data/site.json and exposes helpers on window.HC
   ========================================================================= */

const HC = {
  site: null,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  async json(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
    return res.json();
  },

  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  // Runs fn() only after site.json is loaded.
  ready(fn) {
    this._ready = this._ready || this.json('data/site.json').then(s => (this.site = s));
    return this._ready.then(fn);
  }
};
window.HC = HC;

/* ---- Nav ---------------------------------------------------------------- */
const NAV_LINKS = [
  { href: '/',    label: 'home' },
  { href: 'writeups', label: 'writeups' },
  { href: 'sponsors', label: 'sponsors' },
];

function currentPage() {
  const file = location.pathname.split('/').pop() || 'index.html';
  return file === '' ? 'index.html' : file;
}

function renderNav() {
  const here = currentPage();
  const dir = NAV_LINKS.find(l => l.href === here)?.label;
  const cwd = dir && dir !== 'home' ? `~/${dir}` : '~';

  const nav = document.createElement('header');
  nav.className = 'nav';
  nav.innerHTML = `
    <div class="wrap">
      <a class="nav__prompt" href="/" aria-label="Hackchester home">
        <img src="assets/img/logo.png" alt="">
        <span><span class="u">hackchester</span>@<span class="h">uom</span>:<span class="d">${cwd}</span>$</span>
      </a>
      <button class="nav__toggle" aria-expanded="false" aria-controls="nav-links">menu</button>
      <nav class="nav__links" id="nav-links" aria-label="Main">
        ${NAV_LINKS.map(l =>
          `<a href="${l.href}"${l.href === here ? ' aria-current="page"' : ''}>${l.label}</a>`
        ).join('')}
      </nav>
    </div>`;
  document.body.prepend(nav);

  const toggle = nav.querySelector('.nav__toggle');
  const links = nav.querySelector('.nav__links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

/* ---- Footer ------------------------------------------------------------- */
function renderFooter(site) {
  const m = site.meeting || {};
  const socials = (site.socials || [])
    .map(s => `<a href="${HC.esc(s.url)}" target="_blank" rel="noopener">${HC.esc(s.name.toLowerCase())}</a>`)
    .join('');
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="wrap">
      <span class="seg">[0] hackchester</span>
      ${(m.day || m.time || m.location) ? `<span class="seg">${HC.esc((m.day || '').slice(0, 3).toLowerCase())} ${HC.esc(m.time || '')} ${HC.esc((m.location || '').toLowerCase())}</span>` : ''}
      <span class="seg seg--links">${socials}${site.contact ? `<a href="mailto:${HC.esc(site.contact)}">email</a>` : ''}</span>
      <span class="seg">&copy; ${new Date().getFullYear()} hackchester · <a href="https://github.com/Hackchester/website" target="_blank" rel="noopener">src</a></span>
    </div>`;
  document.body.append(footer);
}

/* ---- Konami → amber theme ---------------------------------------------- */
(function konami() {
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let i = 0;
  window.addEventListener('keydown', e => {
    i = e.key === seq[i] ? i + 1 : (e.key === seq[0] ? 1 : 0);
    if (i === seq.length) {
      i = 0;
      const root = document.documentElement;
      root.dataset.theme = root.dataset.theme === 'amber' ? '' : 'amber';
    }
  });
})();

/* ---- Boot --------------------------------------------------------------- */
renderNav();
HC.ready(renderFooter).catch(err => console.error('site.json failed:', err));
