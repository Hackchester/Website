# hackchester.net

The Hackchester website. Plain HTML/CSS/JS, hosted for free on GitHub Pages —
**no build step**. Edit a file, push to `main`, it's live in about a minute.

## How to edit things

| I want to…                         | Edit this                                              |
|------------------------------------|--------------------------------------------------------|
| set / clear the regular session    | `data/site.json` → `meeting` (empty = hidden)          |
| add / remove a social link         | `data/site.json` → `socials` (icon goes in `assets/img/`) |
| change the tagline or contact email| `data/site.json`                                       |
| add an event                       | `data/events.json` — add an object, keep the date `YYYY-MM-DD`. Past events fade out automatically; the next one is highlighted |
| add a sponsor                      | `data/sponsors.json` — put the logo in `assets/img/sponsors/`, add `{name, logo, url, blurb}` under the right tier. Empty tiers are hidden |
| link the sponsorship pack PDF      | `data/sponsors.json` → `pack` (e.g. `assets/docs/pack.pdf`) |
| change the "members / workshops" numbers on the sponsors page | `data/site.json` → `stats` |
| edit the About text                | `index.html` — it's just HTML in the `~/about.md` window |
| edit the sponsor pitch text        | `sponsors.html`                                        |
| add a nav link                     | `assets/js/site.js` → `NAV_LINKS`                      |
| change the colours                 | `assets/css/theme.css` → the `:root` block (8 variables) |
| change the boot-splash lines       | `assets/js/boot.js` → `LINES`                          |
| add a command to the hidden shell  | `assets/js/terminal.js` → `CMDS`                       |
| publish a writeup                  | not here — push to the **[writeups repo](https://github.com/Hackchester/writeups)** |

## Writeups

`writeups.html` fetches `index.json` from
`https://raw.githubusercontent.com/Hackchester/writeups/main/` at page load and
renders the Markdown in the browser (marked + DOMPurify + highlight.js from CDN).
Nothing in this repo changes when a writeup is added. The base URL lives in
`data/site.json` → `writeups`.

GitHub's raw endpoint caches for ~5 minutes, so a new writeup can take that long
to appear after the Action in the writeups repo has committed `index.json`.

## Run locally

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

`?noboot` on the home URL skips the boot splash. To test the writeups page
against a local clone of the writeups repo, serve that clone with CORS enabled
and run this once in the browser console:

```js
localStorage.setItem('hc-writeups-base', 'http://localhost:8001/')
// localStorage.removeItem('hc-writeups-base') to go back
```

## Layout

```
index.html / writeups.html / sponsors.html / 404.html
data/           site.json, events.json, sponsors.json   ← most edits happen here
assets/css/     theme.css (tokens + effects), site.css (layout + components)
assets/js/      site.js (nav/footer/helpers), boot.js, rain.js, home.js,
                writeups.js, sponsors.js, terminal.js
assets/img/     logo, social icons, favicon.svg, og.png, sponsors/
CNAME           hackchester.net — don't delete
```

## Easter eggs

There's a flag in the page source, a hidden shell on `` ` ``, and the Konami
code does something. Add your own.
