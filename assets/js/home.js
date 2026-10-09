/* =========================================================================
   home.js — fills the home page from data/*.json:
    typewriter tagline, recurring meeting line, workshop and event logs, socials,
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

  /* ---- Workshops and events --------------------------------------------- */
  function renderSchedule(items, listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    const now = new Date();

    // All-day and unspecified times remain upcoming through the event date.
    const endsAt = e => {
      const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec((e.date || '').trim());
      if (!d) return null;
      const times = (e.time || '').match(/\d{1,2}:\d{2}/g);
      const [hh, mm] = times ? times[times.length - 1].split(':').map(Number) : [23, 59];
      return new Date(+d[1], +d[2] - 1, +d[3], hh, mm);
    };

    const dated = items.map(e => ({ e, end: endsAt(e) })).filter(x => x.end);
    dated.sort((a, b) => a.end - b.end);
    const past = dated.filter(x => x.end < now).slice(-2);
    const upcoming = dated.filter(x => x.end >= now);
    const show = [...past, ...upcoming];

    if (!show.length) {
      list.innerHTML = '<li class="muted">no sessions scheduled yet — watch Discord.</li>';
      return;
    }
    let nextMarked = false;
    list.innerHTML = show.map(({ e, end }) => {
      const isPast = end < now;
      let cls = isPast ? 'past' : '';
      if (!isPast && !nextMarked) { cls = 'next'; nextMarked = true; }
      const title = e.link
        ? `<a href="${HC.esc(e.link)}" target="_blank" rel="noopener">${HC.esc(e.title)}</a>`
        : HC.esc(e.title);
      return `<li class="${cls}">
        <span class="ts">${HC.esc(e.date)} ${HC.esc(e.time || '')}</span>
        <span class="title">${title}</span>
        <span class="meta">
        ${HC.esc(e.location || '')}${e.description ? ' — ' + HC.esc(e.description) : ''}
        ${e.requirements ? `<br><span class="muted">Requirements: ${HC.esc(e.requirements)}</span>` : ''}
        </span>
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
      `<a class="card sponsor" href="${HC.esc(s.url || 'sponsors')}" target="_blank" rel="noopener">
        ${s.logo ? `<img src="${HC.esc(s.logo)}" alt="${HC.esc(s.name)}">` : ''}
        <span class="name">${HC.esc(s.name)}</span>
      </a>`).join('');
  }

  /* ---- Past resources: completed boxes --------------------------------- */
  function renderBoxes(boxes) {
    const list = document.getElementById('boxes-list');
    const entries = Array.isArray(boxes) ? boxes.filter(b => b && b.name && b.platform) : [];
    if (!entries.length) {
      list.innerHTML = '<li class="muted">no boxes listed yet.</li>';
      return;
    }
    list.innerHTML = entries.map(box => `
      <li>
        <span class="title">${HC.esc(box.name)}</span>
        <span class="meta">${HC.esc(box.platform)}</span>
      </li>`).join('');
  }

  /* ---- CTFs (ctftime.json is auto-fetched; ctfs.json is hand-edited extras) ---- */
  function renderCtfs(ct, extras, site) {
    const url = ct?.url || site.ctftime?.url;
    if (url) document.getElementById('ctftime-link').href = url;

    const years = {};
    for (const [y, v] of Object.entries(ct?.years || {})) {
      years[y] = { ...v, events: v.events.map(e => ({ ...e, ctftime: true })) };
    }
    for (const e of extras || []) {
      if (!e.name) continue;
      const y = String(e.year);
      years[y] = years[y] || { events: [] };
      years[y].events.push(e);
    }

    const el = document.getElementById('ctf-years');
    const keys = Object.keys(years).sort().reverse();
    if (!keys.length) { el.innerHTML = '<p class="muted">no results yet.</p>'; return; }

    const placeCls = p => !p ? 'muted' : p <= 10 ? 'accent' : p <= 50 ? 'amber' : '';
    el.innerHTML = keys.map(y => {
      const v = years[y];
      const stats = [
        v.country_place ? `UK #${v.country_place}` : '',
        v.rating_place ? `global #${v.rating_place}` : '',
        v.rating_points ? `${v.rating_points.toFixed(1)} rating pts` : '',
      ].filter(Boolean).join(' · ');
      const rows = [...v.events].sort((a, b) => (a.place || 1e9) - (b.place || 1e9)).map(e => `
        <li>
          <span class="place ${placeCls(e.place)}">${e.place ? '#' + e.place : '—'}</span>
          <span class="name">${e.url ? `<a href="${HC.esc(e.url)}" target="_blank" rel="noopener">${HC.esc(e.name)}</a>` : HC.esc(e.name)}${e.note ? ` <span class="muted">— ${HC.esc(e.note)}</span>` : ''}</span>
          <span class="pts">${e.points != null ? HC.esc(Math.round(e.points)) + ' pts' : ''}</span>
          <span class="rating">${e.rating_points ? '+' + e.rating_points.toFixed(2) : ''}</span>
        </li>`).join('');
      return `
        <div class="ctf-year">
          <div class="ctf-year__head"><b>${HC.esc(y)}</b>${stats ? `<span class="muted">${HC.esc(stats)}</span>` : ''}</div>
          <ul class="ctf-list">${rows}</ul>
        </div>`;
    }).join('');

    // logo marquee — every CTF, most recent first; duplicated so the loop is seamless
    const all = keys.flatMap(y => years[y].events);
    if (all.length) {
      const tile = e => `
        <a class="marquee__item" href="${HC.esc(e.url || '#')}" target="_blank" rel="noopener" tabindex="-1" title="${HC.esc(e.name)}">
          ${e.logo ? `<img src="${HC.esc(e.logo)}" alt="" loading="lazy">` : `<span class="marquee__text">${HC.esc(e.name)}</span>`}
        </a>`;
      const track = document.getElementById('ctf-marquee-track');
      track.innerHTML = all.map(tile).join('') + all.map(tile).join('');
      track.style.animationDuration = `${all.length * 5}s`;
      document.getElementById('ctf-marquee').hidden = false;
    }

    if (ct?.fetched) {
      document.getElementById('ctf-fetched').textContent = `pulled from ctftime.org on ${HC.fmtDate(ct.fetched.slice(0, 10))}; refreshes weekly`;
    }
  }

  HC.ready(async site => {
    typewrite(document.getElementById('typewriter'), site.tagline);
    renderSocials(site);
    const meeting = site.meeting || {};
    const recurring = document.getElementById('recurring');
    if (meeting.day || meeting.time || meeting.location) {
      recurring.hidden = false;
      recurring.innerHTML = `<b class="accent">every ${HC.esc(meeting.day)}</b> ${HC.esc(meeting.time)} · ${HC.esc(meeting.location)}`
        + (meeting.note ? `<br><span class="muted">${HC.esc(meeting.note)}</span>` : '');
    } else {
      recurring.remove();
    }
    HC.json('data/workshops.json').then(items => renderSchedule(items, 'workshops-log')).catch(console.error);
    HC.json('data/events.json').then(items => renderSchedule(items, 'events-log')).catch(console.error);
    HC.json('data/resources.json').then(renderBoxes).catch(console.error);
    HC.json('data/sponsors.json').then(renderSponsorStrip).catch(console.error);
    Promise.all([
      HC.json('data/ctftime.json').catch(() => null),
      HC.json('data/ctfs.json').catch(() => []),
    ]).then(([ct, extras]) => renderCtfs(ct, extras, site)).catch(console.error);
  });
})();
