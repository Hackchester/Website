# hackchester.net

The Hackchester website. Plain HTML/CSS/JS, hosted for free on GitHub Pages —
**no build step**. Edit a file, push to `main`, it's live in about a minute.

## How to edit things

| I want to…                         | Edit this                                              |
|------------------------------------|--------------------------------------------------------|
| set / clear the regular session    | `data/site.json` → `meeting` (empty = hidden)          |
| add / remove a social link         | `data/site.json` → `socials` (icon goes in `assets/img/`) |
| change the tagline or contact email| `data/site.json`                                       |
| add a CTF that isn't on CTFtime    | `data/ctfs.json`. CTFtime results + logos land in `data/ctftime.json` / `assets/img/ctfs/` automatically (weekly Action; `python3 scripts/fetch_ctftime.py` refreshes now). Add a `logo` path to a `ctfs.json` entry to put it in the marquee |
| add a workshop                    | `data/workshops.json` — add an object, keep the date `YYYY-MM-DD`. Past workshops fade out automatically; the next one is highlighted |
| add an event                       | `data/events.json` — add an object, keep the date `YYYY-MM-DD`; use `all day` for full-day events and `TBC` for unknown locations. Past events fade out automatically; the next one is highlighted |
| add a completed box                | `data/resources.json` — add `{ "name": "Box name", "platform": "Platform" }` to the array |
| add a sponsor                      | `data/sponsors.json` — put the logo in `assets/img/sponsors/`, add `{name, logo, url, blurb}` under the right tier. Empty tiers are hidden |
| link the sponsorship pack PDF      | `data/sponsors.json` → `pack` (e.g. `assets/docs/pack.pdf`) |
| edit the About text                | `index.html` — it's just HTML in the `~/about.md` window |
| edit the sponsor pitch text        | `sponsors.html`                                        |
| add a nav link                     | `assets/js/site.js` → `NAV_LINKS`                      |
| change the colours                 | `assets/css/theme.css` → the `:root` block (8 variables) |
| change the boot-splash lines       | `assets/js/boot.js` → `LINES`                          |
| publish a writeup                  | not here — PR to the **[writeups repo](https://github.com/Hackchester/writeups)** (`writeups/<year>/<CTF>/<challenge>.md`, YAML frontmatter) |
| add a video writeup                | `data/video-writeups.json` — add an object with the video details (see below) |

## Writeups

`writeups.html` fetches `index.json` from
`https://raw.githubusercontent.com/Hackchester/writeups/main/` at page load and
renders the Markdown in the browser (marked + DOMPurify + highlight.js from CDN).
Nothing in this repo changes when a writeup is added. The base URL lives in
`data/site.json` → `writeups`.

GitHub's raw endpoint caches for ~5 minutes, so a new writeup can take that long
to appear after the Action in the writeups repo has committed `index.json`.

### Add a video writeup

Edit `data/video-writeups.json` and add an object to its array. Keep the commas
between objects and use double quotes, as required by JSON:

```json
[
  {
    "title": "Solving the example web challenge",
    "categories": ["web"],
    "ctf": "Example CTF",
    "author": "Alex",
    "date": "2026-10-26",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "description": "A short optional summary of the approach."
  }
]
```

Replace `VIDEO_ID` with the 11-character ID from the YouTube video URL. A normal
watch URL (`youtube.com/watch?v=…`), short link (`youtu.be/…`), Shorts URL, or
YouTube embed URL is accepted. The page embeds the video using YouTube's
privacy-enhanced `youtube-nocookie.com` player. `title` and `url` are required.
`categories` is an optional array of category names such as `web`, `pwn`, `rev`,
`crypto`, `forensics`, or `osint`. A video can have multiple categories; the
page shows each as a badge and adds category filter chips. `ctf`, `author`,
`date` and `description` are also optional. Add more objects by
separating them with commas. To remove a video, delete its object; use `[]` when
there are no videos. Invalid or non-YouTube URLs are skipped.

Commit the JSON change and push it to `main`; the video appears with the site
deployment. The video itself stays hosted on YouTube.

## Run locally

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

`?noboot` on the home URL skips the boot splash, `?boot` forces it to replay. To test the writeups page
against a local clone of the writeups repo, serve that clone with CORS enabled
and run this once in the browser console:

```js
localStorage.setItem('hc-writeups-base', 'http://localhost:8001/')
// localStorage.removeItem('hc-writeups-base') to go back
```

## Layout

```
index.html / writeups.html / sponsors.html / 404.html
data/           site.json, workshops.json, events.json, sponsors.json   ← most edits happen here
assets/css/     theme.css (tokens + effects), site.css (layout + components)
assets/js/      site.js (nav/footer/helpers), boot.js, rain.js, home.js,
                writeups.js, sponsors.js
assets/img/     logo, social icons, favicon.svg, og.png, sponsors/
scripts/        fetch_ctftime.py (run by .github/workflows/ctftime.yml)
CNAME           hackchester.net — don't delete
```

