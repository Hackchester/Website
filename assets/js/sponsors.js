/* =========================================================================
   sponsors.js — fills the sponsors page from data/sponsors.json and the
   stats from data/site.json. Empty tiers are hidden; no sponsors at all
   shows a "your logo here" placeholder.
   ========================================================================= */
(function () {
  const $ = id => document.getElementById(id);

  function sponsorCard(s) {
    const inner = `
      ${s.logo ? `<img src="${HC.esc(s.logo)}" alt="${HC.esc(s.name)} logo">` : ''}
      <span class="name">${HC.esc(s.name)}</span>
      ${s.blurb ? `<span class="blurb">${HC.esc(s.blurb)}</span>` : ''}`;
    return s.url
      ? `<a class="card sponsor" href="${HC.esc(s.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="card sponsor">${inner}</div>`;
  }

  function render(data, site) {
    // contact + pack
    const mail = data.contact || site.contact;
    if (mail) $('contact-btn').href = `mailto:${mail}?subject=Sponsoring%20Hackchester`;
    if (data.pack) { $('pack-btn').href = data.pack; $('pack-btn').hidden = false; }

    // tiers
    const tiers = (data.tiers || []).filter(t => (t.sponsors || []).length);
    if (!tiers.length) {
      $('tiers').innerHTML = `
        <div class="grid">
          <div class="card sponsor sponsor--placeholder">
            <span class="name">// your logo here</span>
            <span class="blurb">we're looking for sponsors for this academic year</span>
          </div>
        </div>`;
    } else {
      $('tiers').innerHTML = tiers.map(t => `
        <section class="tier tier--${HC.esc(t.name.toLowerCase())}">
          <div class="tier__name">${HC.esc(t.name)}</div>
          <div class="grid">${t.sponsors.map(sponsorCard).join('')}</div>
        </section>`).join('');
    }

    // past sponsors
    if ((data.past || []).length) {
      $('past').hidden = false;
      $('past-list').innerHTML = data.past.map(s =>
        s.url ? `<a href="${HC.esc(s.url)}" target="_blank" rel="noopener">${HC.esc(s.name)}</a>` : `<span>${HC.esc(s.name)}</span>`
      ).join('');
    }
  }

  HC.ready(site =>
    HC.json('data/sponsors.json').then(data => render(data, site))
  ).catch(e => {
    console.error(e);
    $('tiers').innerHTML = `<div class="empty"><span class="danger">cat: sponsors.json: ${HC.esc(e.message)}</span></div>`;
  });
})();
