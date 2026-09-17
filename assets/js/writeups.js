/* =========================================================================
   writeups.js — the writeups page.
   List view: fetches <base>/index.json from the writeups repo, filters.
   Reader view (?id=<ctf>/<category>/<challenge>): fetches WRITEUP.md,
   renders Markdown (marked → DOMPurify → highlight.js).

   Local dev: point at a local clone with
     localStorage.setItem('hc-writeups-base', 'http://localhost:8001/')
   ========================================================================= */
(function () {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);

  let BASE, REPO;
  function config(site) {
    let override = null;
    try { override = localStorage.getItem('hc-writeups-base'); } catch (_) {}
    BASE = override || site.writeups.base;
    REPO = site.writeups.repo.replace(/\/$/, '');
    if (!BASE.endsWith('/')) BASE += '/';
    $('repo-link').href = REPO;
    $('spec-link').href = `${REPO}/blob/main/WRITEUP_SPEC.md`;
  }

  const catBadge = c => `<span class="badge badge--${HC.esc(c || 'misc')}">${HC.esc(c || 'misc')}</span>`;
  const diffSpan = d => d ? `<span class="diff diff--${HC.esc(d)}">${HC.esc(d)}</span>` : '';

  function fail(el, err, what) {
    el.innerHTML = `<div class="empty"><span class="danger">curl: (7) Failed to fetch ${HC.esc(what)}</span>${HC.esc(err.message)}</div>`;
    console.error(err);
  }

  /* ======================= LIST VIEW ======================= */
  async function showList() {
    $('list-view').hidden = false;
    $('reader-view').hidden = true;

    let idx;
    try {
      idx = await HC.json(BASE + 'index.json');
    } catch (e) { return fail($('list-status'), e, 'index.json'); }

    const all = idx.writeups || [];
    const ctfNames = Object.fromEntries((idx.ctfs || []).map(c => [c.slug, c.name]));
    $('list-status').textContent = '';

    // filter state lives in the URL so links are shareable
    const state = {
      q: params.get('q') || '',
      cat: params.get('cat') || '',
      ctf: params.get('ctf') || '',
    };

    const cats = (idx.categories || []).filter(c => all.some(w => w.category === c));
    const ctfs = (idx.ctfs || []).filter(c => all.some(w => w.ctf === c.slug));

    function chips(el, items, key) {
      el.innerHTML = [{ value: '', label: 'all' }, ...items]
        .map(i => `<button class="chip" data-v="${HC.esc(i.value)}" aria-pressed="${state[key] === i.value}">${HC.esc(i.label)}</button>`)
        .join('');
      el.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
        state[key] = b.dataset.v;
        el.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b));
        render();
      }));
    }
    chips($('cat-chips'), cats.map(c => ({ value: c, label: c })), 'cat');
    chips($('ctf-chips'), ctfs.map(c => ({ value: c.slug, label: c.name })), 'ctf');
    $('search').value = state.q;
    $('search').addEventListener('input', () => { state.q = $('search').value; render(); });

    function render() {
      const q = state.q.trim().toLowerCase();
      const rows = all.filter(w =>
        (!state.cat || w.category === state.cat) &&
        (!state.ctf || w.ctf === state.ctf) &&
        (!q || [w.title, w.ctf_name, w.excerpt, ...(w.tags || []), ...(w.authors || [])].join(' ').toLowerCase().includes(q))
      );

      const p = new URLSearchParams();
      if (state.q) p.set('q', state.q);
      if (state.cat) p.set('cat', state.cat);
      if (state.ctf) p.set('ctf', state.ctf);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));

      $('list-count').textContent = `${rows.length}/${all.length} files`;
      if (!all.length) {
        $('cards').innerHTML = '';
        $('list-status').innerHTML = `<span class="danger">ls: no writeups yet</span>be the first — see the <a href="${REPO}/blob/main/WRITEUP_SPEC.md" target="_blank" rel="noopener">spec</a>.`;
        return;
      }
      if (!rows.length) {
        $('cards').innerHTML = '';
        $('list-status').innerHTML = `<span class="danger">grep: no matches</span>try fewer filters.`;
        return;
      }
      $('list-status').textContent = '';
      $('cards').innerHTML = rows.map(w => `
        <a class="card" href="writeups.html?id=${encodeURIComponent(w.id)}">
          <div class="card__top">
            ${catBadge(w.category)} ${diffSpan(w.difficulty)}
            <span>${HC.esc(ctfNames[w.ctf] || w.ctf_name || w.ctf)}</span>
            <span style="margin-left:auto">${HC.esc(HC.fmtDate(w.date))}</span>
          </div>
          <h3>${HC.esc(w.title)}</h3>
          ${w.excerpt ? `<p class="card__excerpt">${HC.esc(w.excerpt)}</p>` : ''}
          <div class="card__tags">${(w.tags || []).map(t => `<span class="tag">${HC.esc(t)}</span>`).join('')}</div>
          ${w.authors?.length ? `<p class="muted" style="margin:10px 0 0;font-size:.8rem">by ${HC.esc(w.authors.join(', '))}</p>` : ''}
        </a>`).join('');
    }
    render();
  }

  /* ======================= READER VIEW ======================= */
  function stripHeader(md) {
    // drop the leading "# Title" and the metadata table — the page shows them itself
    const lines = md.split('\n');
    let i = 0;
    while (i < lines.length && !lines[i].trim()) i++;
    if (lines[i]?.startsWith('# ')) i++;
    while (i < lines.length && !lines[i].trim()) i++;
    while (i < lines.length && lines[i].trim().startsWith('|')) i++;
    return lines.slice(i).join('\n');
  }

  async function showReader(id) {
    $('list-view').hidden = true;
    $('reader-view').hidden = false;

    // keep the list's filters when going back
    const back = new URLSearchParams(params);
    back.delete('id');
    $('back-link').href = 'writeups.html' + (back.toString() ? '?' + back : '');

    if (!/^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) {
      return fail($('reader-body'), new Error('bad id — expected <ctf>/<category>/<challenge>'), id);
    }

    const folder = `${BASE}${id}/`;
    const mdUrl = `${folder}WRITEUP.md`;
    $('reader-path').textContent = `~/writeups/${id}/WRITEUP.md`;
    $('source-link').href = `${REPO}/tree/main/${id}`;
    $('files-path').textContent = id + '/';

    let md, meta = null;
    try {
      const [res, idx] = await Promise.all([
        fetch(mdUrl, { cache: 'no-cache' }),
        HC.json(BASE + 'index.json').catch(() => null),
      ]);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      md = await res.text();
      meta = idx?.writeups?.find(w => w.id === id) || null;
    } catch (e) { return fail($('reader-body'), e, 'WRITEUP.md'); }

    const [ctf, category] = id.split('/');
    const title = meta?.title || (md.match(/^#\s+(.+)$/m) || [])[1] || id.split('/').pop();
    document.title = `${title} — Hackchester writeups`;
    $('reader-title').textContent = title;

    const kv = (k, v) => v ? `<span><span class="k">${k}:</span> <span class="v">${v}</span></span>` : '';
    $('reader-meta').innerHTML = [
      kv('ctf', `<a href="writeups.html?ctf=${encodeURIComponent(ctf)}">${HC.esc(meta?.ctf_name || ctf)}</a>`),
      kv('category', catBadge(category)),
      kv('difficulty', diffSpan(meta?.difficulty)),
      kv('points', meta?.points != null ? HC.esc(meta.points) : ''),
      kv('author', HC.esc((meta?.authors || []).join(', '))),
      kv('date', HC.esc(HC.fmtDate(meta?.date))),
      kv('tags', (meta?.tags || []).map(t => `<span class="tag">${HC.esc(t)}</span>`).join(' ')),
    ].join('');

    // relative links/images resolve against the challenge folder on GitHub raw
    const renderer = new marked.Renderer();
    const abs = href => /^([a-z]+:|\/|#)/i.test(href) ? href : new URL(href, folder).href;
    const origImage = renderer.image.bind(renderer);
    const origLink = renderer.link.bind(renderer);
    renderer.image = tok => origImage({ ...tok, href: abs(tok.href) });
    renderer.link = tok => {
      let href = tok.href;
      if (!/^([a-z]+:|\/|#)/i.test(href)) {
        // relative → resolve against this challenge folder; other writeups open on this site,
        // anything else opens on GitHub
        const p = new URL(href, `https://x/${id}/`).pathname.replace(/^\//, '');
        const m = p.match(/^([a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+)\/WRITEUP\.md$/i);
        href = m ? `writeups.html?id=${m[1]}` : `${REPO}/blob/main/${p}`;
      }
      return origLink({ ...tok, href });
    };

    const html = marked.parse(stripHeader(md), { renderer, gfm: true, breaks: false });
    $('reader-body').innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
    $('reader-body').querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
    $('reader-body').querySelectorAll('pre code').forEach(el => {
      try { hljs.highlightElement(el); } catch (_) {}
    });

    const files = (meta?.files || []);
    if (files.length) {
      $('reader-files').hidden = false;
      $('files-list').innerHTML = files.map(f =>
        `<a class="chip" href="${REPO}/tree/main/${id}/${encodeURIComponent(f)}" target="_blank" rel="noopener">${HC.esc(f)}</a>`
      ).join('');
    }
  }

  /* ======================= BOOT ======================= */
  HC.ready(site => {
    config(site);
    const id = params.get('id');
    return id ? showReader(id) : showList();
  }).catch(e => fail($('list-status'), e, 'site.json'));
})();
