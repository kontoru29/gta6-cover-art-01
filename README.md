[![Vice Cover on make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kontoru29/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kontoru29/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover

Vice Cover turns your own photos into GTA style cover art, right in the browser. Pick a layout, drop photos into the panels, write a big bold title, and export a PNG ready to post.

## What it makes

A multi panel poster in the Vice City sunset look: a hero panel over two smaller ones, or a 2 by 2 grid, or three tall strips. Behind the panels sits a sky the app draws itself, a slatted sun sinking over a two layer skyline with lit windows, framed by palm silhouettes and a warm horizon glow. The title runs across the bottom in tall condensed capitals with a warm gradient fill, a hard outline and a neon glow, and the subtitle sits on its own dark strip so it always reads over the skyline.

Photos get a real sunset or neon grade, not a plain filter: a stronger warm or magenta tint so a daytime photo reads as golden hour. When one photo fills several panels, each panel frames it differently, so the poster never shows the same shot twice. A Surprise me button picks a fresh layout, sky and grades in one tap.

## How to use it

1. Open `app/index.html` in a desktop browser. No server and no network needed.
2. Add your photos, or use the two samples already inside.
3. Click a panel on the cover to select it, then set its photo, zoom, position and colour grade. Press Surprise me for a fresh layout, sky and grades in one tap.
4. Pick a layout, a sky (sunset or neon night) and an export size: 1080 by 1080, 1080 by 1350, or 1920 by 1080. The preview always shows the export size.
5. Type your title and subtitle, then press Export PNG.

When one photo fills several panels, each panel frames it differently, so the poster never repeats the same shot. Your photos are read on your own machine and never uploaded anywhere.

## What is inside

* `app/index.html` and `app/style.css` — the editor page and its dark neon look.
* `app/src/main.js` — the editor: photo tray, panel controls, export.
* `app/src/cover.js` — the cover renderer: panels, grades, title.
* `app/src/scene.js` — the procedural sunset sky, sun, skyline and palms.
* `app/fonts/Anton-Regular.ttf` — the display font, under the SIL Open Font License (see `app/fonts/OFL.txt`).
* `app/samples/` — two sample photos, free to use.
* `main.ts` — hands the app in: it copies `app/` and `screenshots/` to the output folder and writes `dossier.json`.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

To build the hand in bundle locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT. See `LICENSE`. The Anton font is under the SIL Open Font License, see `app/fonts/OFL.txt`.
