// Renders the cover: the procedural sky behind a grid of photo panels, then the
// big GTA-style title across the bottom band. One function draws both the live
// preview and the exported PNG, so what you see is what you share.

import { drawScene } from './scene.js';

/** Panel names in order, per layout. */
export const LAYOUT_NAMES = {
  poster: ['Hero', 'Street', 'Night'],
  grid: ['Top left', 'Top right', 'Bottom left', 'Bottom right'],
  trio: ['Left', 'Middle', 'Right'],
};

/** Panel rects as fractions of the panel zone (the top 80% of the cover). */
const LAYOUT_RECTS = {
  poster: [
    [0, 0, 1, 0.54],
    [0, 0.54, 0.56, 0.46],
    [0.56, 0.54, 0.44, 0.46],
  ],
  grid: [
    [0, 0, 0.5, 0.5],
    [0.5, 0, 0.5, 0.5],
    [0, 0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5],
  ],
  trio: [
    [0, 0, 0.34, 1],
    [0.34, 0, 0.33, 1],
    [0.67, 0, 0.33, 1],
  ],
};

/** The title band: the bottom 20% of the cover. */
export function titleBand(w, h) {
  return { x: 0, y: h * 0.8, w, h: h * 0.2 };
}

/** Panel rects in pixels for a layout, with a white gutter between them. */
export function layoutPanels(layout, w, h) {
  const zoneH = h * 0.8;
  const gut = Math.max(4, w * 0.007);
  const names = LAYOUT_NAMES[layout] ?? LAYOUT_NAMES.poster;
  return (LAYOUT_RECTS[layout] ?? LAYOUT_RECTS.poster).map(([fx, fy, fw, fh], i) => ({
    x: fx * w + gut / 2,
    y: fy * zoneH + gut / 2,
    w: fw * w - gut,
    h: fh * zoneH - gut,
    name: names[i] ?? `Panel ${i + 1}`,
  }));
}

/** The default state of a fresh cover. */
export function defaultState() {
  const panel = (photo) => ({ photo, zoom: 1, panX: 0, panY: 0, grade: 'sunset', anchorY: 0.12 });
  return {
    layout: 'poster',
    size: '1080x1350',
    sky: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'TWO OUTLAWS. ONE CITY.',
    titleScale: 1,
    selected: 0,
    panels: [panel(0), panel(1), panel(0)],
  };
}

/** Parses an export size label like "1080x1350" into pixels. */
export function parseSize(size) {
  const [w, h] = size.split('x').map(Number);
  return { w: w || 1080, h: h || 1080 };
}

const GRADE_FILTERS = {
  sunset: 'saturate(1.35) contrast(1.08) sepia(0.28) hue-rotate(-12deg)',
  neon: 'saturate(1.9) contrast(1.12) hue-rotate(28deg)',
  mono: 'grayscale(1) contrast(1.12) brightness(1.06)',
  original: 'none',
};

const GRADE_TINTS = {
  sunset: ['rgba(255, 122, 60, 0.16)', 'rgba(200, 40, 120, 0.22)'],
  neon: ['rgba(255, 79, 216, 0.14)', 'rgba(55, 230, 255, 0.14)'],
  mono: null,
  original: null,
};

/** Draws one photo into a panel rect, cover-fit, with zoom, pan and grade.
 *  The vertical anchor keeps faces in frame: wide panels crop a photo's height
 *  hard, and faces usually sit in its top third, so the default anchor looks
 *  near the top instead of the dead centre. */
function drawPanelPhoto(ctx, rect, img, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const s = base * panel.zoom;
  const dw = iw * s;
  const dh = ih * s;
  const anchorY = panel.anchorY ?? 0.12;
  const dx = rect.x + (rect.w - dw) / 2 + panel.panX * rect.w * 0.45;
  const dy = rect.y - (dh - rect.h) * anchorY + panel.panY * rect.h * 0.45;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = GRADE_FILTERS[panel.grade] ?? 'none';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  const tint = GRADE_TINTS[panel.grade];
  if (tint) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, tint[0]);
    g.addColorStop(1, tint[1]);
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
}

/** An empty panel: dark glass with an invitation, never a blank hole. */
function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#2c1230');
  g.addColorStop(1, '#12081f');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `${Math.max(14, rect.w * 0.07)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
}

/** Draws the title and subtitle across the bottom band. */
function drawTitle(ctx, w, h, band, title, subtitle, scale) {
  const text = (title || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (text) {
    let size = h * 0.104 * scale;
    ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
    while (ctx.measureText(text).width > w * 0.94 && size > 14) {
      size -= 2;
      ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
    }
    const ty = band.y + band.h * 0.58;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12081f';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(text, w / 2, ty);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.65)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.03;
    ctx.fillText(text, w / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const size = Math.max(12, h * 0.026 * scale);
    ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(2, size * 0.22)}px`;
    } catch {
      // Older engines ignore letter spacing; the subtitle still draws.
    }
    ctx.fillStyle = '#ffe9a8';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(sub, w / 2, band.y + band.h * 0.88);
    ctx.shadowBlur = 0;
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // No-op.
    }
  }
}

/** Draws the whole cover. `photos` is an array of loaded images (or nulls).
 *  When `highlight` is true, the selected panel gets a dashed outline (preview
 *  only; exports pass false). */
export function drawCover(canvas, state, photos, highlight = false) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const band = titleBand(w, h);
  drawScene(ctx, w, h, state.sky, band);
  const panels = layoutPanels(state.layout, w, h);
  panels.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: null, zoom: 1, panX: 0, panY: 0, grade: 'sunset' };
    const img = panel.photo == null ? null : photos[panel.photo] ?? null;
    if (img) drawPanelPhoto(ctx, rect, img, panel);
    else drawEmptyPanel(ctx, rect);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = Math.max(2, w * 0.0035);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (highlight && i === state.selected) {
      ctx.save();
      ctx.setLineDash([Math.max(6, w * 0.012), Math.max(5, w * 0.008)]);
      ctx.strokeStyle = '#ffb03a';
      ctx.lineWidth = Math.max(3, w * 0.005);
      ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
      ctx.restore();
    }
  });
  drawTitle(ctx, w, h, band, state.title, state.subtitle, state.titleScale);
  // A thin white frame around the whole cover, so it reads as a poster.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(2, w * 0.005);
  ctx.strokeRect(0, 0, w, h);
}
