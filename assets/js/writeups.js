/* =========================================================================
   writeups.js — the writeups page.

   Reads index.json from the writeups repo (github.com/Hackchester/writeups),
   whose layout is:  writeups/<year>/<CTF>/<challenge>.md  with YAML frontmatter
   (title, author, date, categories, tags, partial_solve, used_ai).

   List view:   filter chips + search over index.json.
   Reader view: ?id=<year>/<CTF>/<challenge> → fetch the .md, strip frontmatter,
                render (marked → DOMPurify → highlight.js).

   Local dev: point at a local clone with
     localStorage.setItem('hc-writeups-base', 'http://localhost:8003/')
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
    $('spec-link').href = `${REPO}/blob/main/README.md`;
  }

  // raw URL for a repo-relative path, with each segment percent-encoded (paths have spaces)
  const rawURL = p => BASE + p.split('/').map(encodeURIComponent).join('/');
  const blobURL = p => `${REPO}/blob/main/${p.split('/').map(encodeURIComponent).join('/')}`;

  const catBadge = c => `<span class="badge badge--${HC.esc((c || 'misc').toLowerCase())}">${HC.esc(c || 'misc')}</span>`;
  const flags = w => [
    w.partial_solve ? '<span class="badge badge--partial">partial</span>' : '',
    w.used_ai ? '<span class="badge badge--usedai">AI-assisted</span>' : '',
  ].join(' ');

  function fail(el, err, what) {
    el.innerHTML = `<div class="empty"><span class="danger">curl: (7) Failed to fetch ${HC.esc(what)}</span>${HC.esc(err.message)}</div>`;
    console.error(err);
  }

  /* ======================= LIST VIEW ======================= */
  async function showList() {
    $('list-view').hidden = false;
    $('reader-view').hidden = true;

    let idx;
    try { idx = await HC.json(BASE + 'index.json'); }
    catch (e) { return fail($('list-status'), e, 'index.json'); }

    const all = idx.writeups || [];
    $('list-status').textContent = '';

    const state = {
      q: params.get('q') || '',
      cat: params.get('cat') || '',
      ctf: params.get('ctf') || '',
    };

    const cats = [...new Set(all.map(w => w.category))].filter(Boolean).sort();
    const ctfs = idx.ctfs || [...new Set(all.map(w => w.ctf))].map(c => ({ slug: c, name: c }));

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
        (!q || [w.title, w.ctf, w.excerpt, ...(w.tags || []), ...(w.authors || [])].join(' ').toLowerCase().includes(q))
      );

      const p = new URLSearchParams();
      if (state.q) p.set('q', state.q);
      if (state.cat) p.set('cat', state.cat);
      if (state.ctf) p.set('ctf', state.ctf);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));

      $('list-count').textContent = `${rows.length}/${all.length} files`;
      if (!all.length) {
        $('cards').innerHTML = '';
        $('list-status').innerHTML = `<span class="danger">ls: no writeups yet</span>be the first — see the <a href="${REPO}/blob/main/README.md" target="_blank" rel="noopener">submission guide</a>.`;
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
            ${catBadge(w.category)} ${flags(w)}
            <span>${HC.esc(w.ctf)}</span>
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
  function stripFrontmatter(md) {
    const lines = md.split('\n');
    if (lines[0]?.trim() !== '---') return md;
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
    return end === -1 ? md : lines.slice(end + 1).join('\n');
  }

  async function showReader(id) {
    $('list-view').hidden = true;
    $('reader-view').hidden = false;

    const back = new URLSearchParams(params);
    back.delete('id');
    $('back-link').href = 'writeups.html' + (back.toString() ? '?' + back : '');

    // resolve the writeup through index.json (also keeps ?id safe from path traversal)
    let meta;
    try {
      const idx = await HC.json(BASE + 'index.json');
      meta = (idx.writeups || []).find(w => w.id === id);
    } catch (e) { return fail($('reader-body'), e, 'index.json'); }
    if (!meta) return fail($('reader-body'), new Error(`no such writeup: ${id}`), 'writeup');

    const folder = new URL('.', rawURL(meta.path)).href;
    $('reader-path').textContent = `~/writeups/${meta.id}`;
    $('source-link').href = blobURL(meta.path);
    $('source-link').textContent = 'source ↗';

    let md;
    try {
      const res = await fetch(rawURL(meta.path), { cache: 'no-cache' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      md = await res.text();
    } catch (e) { return fail($('reader-body'), e, meta.path); }

    document.title = `${meta.title} — Hackchester writeups`;
    $('reader-title').textContent = meta.title;

    const kv = (k, v) => !v ? '' : `<span>${k ? `<span class="k">${k}:</span> ` : ''}<span class="v">${v}</span></span>`;
    $('reader-meta').innerHTML = [
      kv('ctf', `<a href="writeups.html?ctf=${encodeURIComponent(meta.ctf)}">${HC.esc(meta.ctf)}</a>`),
      kv('category', catBadge(meta.category)),
      kv('author', HC.esc((meta.authors || []).join(', '))),
      kv('date', HC.esc(HC.fmtDate(meta.date))),
      kv('', flags(meta)),
      kv('tags', (meta.tags || []).map(t => `<span class="tag">${HC.esc(t)}</span>`).join(' ')),
    ].join('');

    // relative image/link paths resolve against the writeup's folder on GitHub raw
    const renderer = new marked.Renderer();
    const abs = href => /^([a-z]+:|\/|#)/i.test(href) ? href : new URL(href, folder).href;
    const origImage = renderer.image.bind(renderer);
    const origLink = renderer.link.bind(renderer);
    renderer.image = tok => origImage({ ...tok, href: abs(tok.href) });
    renderer.link = tok => {
      let href = tok.href;
      if (!/^([a-z]+:|\/|#)/i.test(href)) {
        // a link to another writeup opens on this site; anything else opens on GitHub.
        // strip BASE first — the repo path also contains "writeups", so a bare
        // /writeups\/.../ match would capture the repo prefix too.
        const absHref = new URL(href, folder).href;
        const rel = absHref.startsWith(BASE) ? decodeURIComponent(absHref.slice(BASE.length)) : '';
        const m = rel.match(/^writeups\/(.+)\.md$/i);
        href = m ? `writeups.html?id=${encodeURIComponent(m[1])}` : absHref;
      }
      return origLink({ ...tok, href });
    };

    const html = marked.parse(stripFrontmatter(md), { renderer, gfm: true, breaks: false });
    $('reader-body').innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
    $('reader-body').querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
    $('reader-body').querySelectorAll('pre code').forEach(el => { try { hljs.highlightElement(el); } catch (_) {} });
  }

  /* ======================= BOOT ======================= */
  HC.ready(site => {
    config(site);
    const id = params.get('id');
    return id ? showReader(id) : showList();
  }).catch(e => fail($('list-status'), e, 'site.json'));
})();
