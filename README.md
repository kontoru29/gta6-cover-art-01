[![Vice Cover on make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kontoru29/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kontoru29/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover

Vice Cover turns your own photos into GTA style cover art, right in the browser. Pick a layout, drop photos into the panels, write a big bold title, and export a PNG ready to post.

## What it makes

A multi panel movie poster in the Vice City sunset look: a press strip on top (five gold stars, a press quote, a VOL. 1 chip), a hero panel beside two stacked ones, or a 2 by 2 grid, or three tall strips. Every panel carries its own cast role tag (THE QUEEN, THE BOSS, THE FIXER, THE LOOKOUT), and every panel shows a different photo, so the poster never repeats the same shot. Behind the panels sits a sky the app draws itself, a slatted sun sinking over a two layer skyline with lit windows, framed by palm silhouettes and a warm horizon glow. The title runs across the panels in huge condensed capitals filled with horizontal sunset bands, a hard dark outline and a neon glow, with a hand lettered neon script subtitle underneath and a billing strip at the bottom (production credits, COMING SOON, a barcode and a BEST CAST gold seal).

Photos get a real sunset or neon grade, not a plain filter: a stronger warm or magenta tint so a daytime photo reads as golden hour. When one photo fills several panels, each panel frames it differently, so the poster never shows the same shot twice. A Surprise me button picks a fresh layout, sky and grades in one tap.

## How to use it

1. Open `app/index.html` in a desktop browser. No server and no network needed.
2. Add your photos, or use the six samples already inside: four fictional cast portraits made with an image model, plus two street photos.
3. Click a panel on the cover to select it, then set its photo, cast role, zoom, position and colour grade. Press Surprise me for a fresh layout, sky and grades in one tap.
4. Pick a layout, a sky (sunset or neon night) and an export size: 1080 by 1080, 1080 by 1350, or 1920 by 1080. The preview always shows the export size.
5. Type your title and subtitle, then press Export PNG.

When one photo fills several panels, each panel frames it differently, so the poster never repeats the same shot. Your photos are read on your own machine and never uploaded anywhere.

## What is inside

* `app/index.html` and `app/style.css` — the editor page and its dark neon look.
* `app/src/main.js` — the editor: photo tray, panel controls, export.
* `app/src/cover.js` — the cover renderer: press strip, panels, cast roles, striped title, script subtitle, billing.
* `app/src/scene.js` — the procedural sunset sky, sun, skyline and palms.
* `app/fonts/Anton-Regular.ttf` — the display font, under the SIL Open Font License (see `app/fonts/OFL.txt`).
* `app/fonts/Yellowtail-Regular.woff2` — the script font for the subtitle, also under the SIL Open Font License.
* `app/samples/` — six sample photos, free to use: four cast portraits made with an image model (fictional people, not real) and two street photos.
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

MIT. See `LICENSE`. The Anton and Yellowtail fonts are under the SIL Open Font License, see `app/fonts/OFL.txt`.

## Round 3

Compared with the top entries on the dev board, Round 2's cover was too sparse: only two sample photos, so every panel repeated the same shot; a small flat title in a plain band; and no poster furniture. Round 3 rebuilds the cover as a movie poster: four new cast portraits (image model, fictional people), a striped gradient title overlapping the panels, a neon script subtitle, cast role tags, a press strip, a billing strip with barcode, and a BEST CAST seal. Every staged shot now deals a different photo to each panel. Two rendering bugs found while re-shooting were fixed: the title's thick outline closed Anton's counters and turned each word into a solid bar, so the outline is now thin and drawn after the gradient fill; and role tags followed the panel slot instead of the photo, so the Queen's tag could land on the Boss — roles now follow their photo everywhere (photo picker, tray, layout switch, Surprise me, staged shots), and street photos get no tag.
