/* =========================================================================
   home.js — fills the home page from data/*.json:
   typewriter tagline, recurring meeting line, events log, socials,
   and the sponsors strip (only if there are sponsors).
   ========================================================================= */
(function () {

  /* ---- Typewriter tagline ---------------------------------------------- */
  function typewrite(el, text) {
    if (HC.reducedMotion) { el.textContent = text; return; }
    let i = 0;
    (function tick() {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 28 + Math.random() * 40);
    })();
  }

  /* ---- Events ------------------------------------------------------------ */
  function renderEvents(events, site) {
    const rec = document.getElementById('recurring');
    const m = site.meeting || {};
    if (m.day || m.time || m.location) {
      rec.hidden = false;
      rec.innerHTML = `<b class="accent">every ${HC.esc(m.day)}</b> ${HC.esc(m.time)} · ${HC.esc(m.location)}`
        + (m.note ? `<br><span class="muted">${HC.esc(m.note)}</span>` : '');
    } else {
      rec.remove();
    }

    const list = document.getElementById('events-log');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = sorted.filter(e => new Date(e.date) >= today);
    const past = sorted.filter(e => new Date(e.date) < today).slice(-2);
    const show = [...past, ...upcoming];

    if (!show.length) {
      list.innerHTML = '<li class="muted">no events scheduled yet — watch Discord.</li>';
      return;
    }
    let nextMarked = false;
    list.innerHTML = show.map(e => {
      const isPast = new Date(e.date) < today;
      let cls = isPast ? 'past' : '';
      if (!isPast && !nextMarked) { cls = 'next'; nextMarked = true; }
      const title = e.link
        ? `<a href="${HC.esc(e.link)}" target="_blank" rel="noopener">${HC.esc(e.title)}</a>`
        : HC.esc(e.title);
      return `<li class="${cls}">
        <span class="ts">${HC.esc(e.date)} ${HC.esc(e.time || '')}</span>
        <span class="title">${title}</span>
        <span class="meta">${HC.esc(e.location || '')}${e.description ? ' — ' + HC.esc(e.description) : ''}</span>
      </li>`;
    }).join('');
  }

  /* ---- Socials ----------------------------------------------------------- */
  function renderSocials(site) {
    const el = document.getElementById('socials-list');
    el.innerHTML = (site.socials || []).map(s =>
      `<a href="${HC.esc(s.url)}" target="_blank" rel="noopener">
        ${s.icon ? `<img src="${HC.esc(s.icon)}" alt="">` : ''}${HC.esc(s.name)}
      </a>`).join('');
    const discord = site.socials?.find(s => /discord/i.test(s.name));
    if (discord) document.getElementById('cta-discord').href = discord.url;

    // contact email (from site.json) — in the about/socials text and as a socials chip
    if (site.contact) {
      document.querySelectorAll('#contact-email, #contact-email-2').forEach(a => {
        a.href = `mailto:${site.contact}`;
        a.textContent = site.contact;
      });
      el.insertAdjacentHTML('beforeend',
        `<a href="mailto:${HC.esc(site.contact)}"><img src="assets/img/Mail.svg" alt="">Email</a>`);
    }
  }

  /* ---- Sponsors strip ---------------------------------------------------- */
  function renderSponsorStrip(data) {
    const all = (data.tiers || []).flatMap(t => t.sponsors || []);
    if (!all.length) return;
    document.getElementById('sponsor-strip').hidden = false;
    document.getElementById('sponsor-strip-grid').innerHTML = all.map(s =>
      `<a class="card sponsor" href="${HC.esc(s.url || 'sponsors.html')}" target="_blank" rel="noopener">
        ${s.logo ? `<img src="${HC.esc(s.logo)}" alt="${HC.esc(s.name)}">` : ''}
        <span class="name">${HC.esc(s.name)}</span>
      </a>`).join('');
  }

  HC.ready(async site => {
    typewrite(document.getElementById('typewriter'), site.tagline);
    renderSocials(site);
    HC.json('data/events.json').then(ev => renderEvents(ev, site)).catch(console.error);
    HC.json('data/sponsors.json').then(renderSponsorStrip).catch(console.error);
  });
})();
