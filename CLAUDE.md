# Supply Chain app — notes for Claude Code

Owner: Amey (JSR Enterprises). He has no coding background. Explain things in very simple English, short answers, and use 12-hour AM/PM times.

## What this is
An offline iPad web app (PWA) that shows supply chains (who makes what, who depends on whom), a world map and "What if?" domino effects for stocks (India NSE + world).
Live at: https://ameychavhan01-boop.github.io/supply-chain/
Deep links: `#chain=chips`, `#chain=oil`, `#chain=power`, `#chain=wires`, and `&node=<id>`.

## Folder layout
- Repo root: the published files — `index.html`, `manifest.json`, `sw.js`, `icon-180.png`, `icon-512.png`. **Never edit `index.html` by hand.** It is generated.
- `app-source/` — the real source:
  - `src/data.js` — chips chain, top-10 country info, place notes, sea chokepoints (SC_SPOTS), trade routes, the top-100 GDP list (IMF), "Did you know" facts, chain list (SC_CHAIN_LIST with `ready` flags), data version (SC_DATA_VERSION).
  - `src/energy.js` — Oil & Gas, Power, Wires & Cables chains.
  - `src/world.js` — generated world map shapes (Natural Earth, India's official borders). Do not edit by hand; rebuild with `scripts/mkmap.py` only if the map itself must change (needs the Natural Earth repo cloned).
  - `src/app.js` — all app logic (world map module `W`, chain view `CV`, what-if, saved, settings).
  - `src/style.css`, `src/index.template.html`.
  - `build.py` — joins everything into the root `index.html` (+ manifest, service worker, icons).

## How to make any update
1. Edit files in `app-source/src/`.
2. Run `python3 app-source/build.py` (needs Python + Pillow). It writes the files to the repo root.
3. If anything cached changes, bump the cache name in `build.py` (`supply-chain-vN`) so iPads get the new version.
4. Update `SC_DATA_VERSION` in `data.js` to today's date.
5. Commit and push to `main`. GitHub Pages updates in about 1 minute.

## Data rules (very important — Amey said "do not add anything wrong")
- Research before adding facts. Every number (market share, % stock move, output) needs a real source: use `SH(value, text, SR(sourceName, url, date), approx)` for shares and `moves` + `src`/`url` in history events.
- If a number is not exact or not certain, mark it approx (`ap: true` / 4th argument `true`).
- Never invent companies, links, numbers or events. If unsure, leave it out.
- Links between companies (`needs`) mean typical supply relationships, not confirmed contracts.

## Chain format (see energy.js for full examples)
Chain: `id, name, short, summary, linkNote, roles {key:{name,color}}, hub, weak [ids], levels [{id,name,icon}], nodes [...], history [...], keyPoints [...]`.
Node: `id, lv (level id), n (name), c (2-letter country code), l (listed true/false), x (exchange: ticker), nse (NSE ticker), r (role key), d (what it does), w (why it gets affected), s (market share via SH), mc (size band: Mega/Large/Mid/Small), cu (customers), su (suppliers), needs [ids it depends on, same chain], alt [ids that gain if it fails]`.
- Node ids must be unique inside a chain; the same company can appear in several chains with the same id.
- Every id in `needs`, `alt`, `weak`, `hub` must exist in that chain.
- To add a new chain: add it to `window.SC_CHAINS` (new file or energy.js), make sure its id is in `SC_CHAIN_LIST` in data.js, and it becomes ready automatically. Add the new file to `build.py` if you create one.
- Icons available: globe link star gear search back tree spider bolt clock list share compare plus minus x copy fit chip drop cable factory gem pill car battery leaf cart thread cube flask rock box phone pin folder trash down up sound routes note check info warn.

## Before pushing — check
- Run a quick Node check that all `needs`/`alt`/`weak` ids exist.
- Open the built `index.html` in a browser (Playwright if available) at 1376×1032 and confirm no console errors.
- Tell Amey in simple words what changed, then give him "Key points" to copy into Apple Notes.

## Linked things
- Notion database "🌐 Supply Chain Daily News" (Amey OS) is filled every day at 6:36 AM by a scheduled task. Its "Today's chain" links open chains in this app. If a new chain is added, tell Amey so the daily task's chain links can be updated.
