// Renders the cover as a movie poster: a press strip on top, a grid of
// photo panels each with its cast role, then the big striped title overlapping
// the panels, a neon script subtitle and a billing strip at the bottom. One
// function draws both the live preview and the exported PNG, so what you see
// is what you share.

import { drawScene } from './scene.js';

/** Panel names in order, per layout. */
export const LAYOUT_NAMES = {
  poster: ['Hero', 'Top right', 'Bottom right'],
  grid: ['Top left', 'Top right', 'Bottom left', 'Bottom right'],
  trio: ['Left', 'Middle', 'Right'],
};

/** Default cast role for each panel, per layout. */
export const LAYOUT_ROLES = {
  poster: ['THE QUEEN', 'THE BOSS', 'THE FIXER'],
  grid: ['THE QUEEN', 'THE BOSS', 'THE FIXER', 'THE LOOKOUT'],
  trio: ['THE QUEEN', 'THE BOSS', 'THE FIXER'],
};

/** The cast role that belongs to a sample photo, by file name. Street
 *  photos have no cast member, so they get no role tag. A role always
 *  follows its photo, never its panel slot: dealing the Boss's photo into
 *  the Queen's slot must not leave a "THE QUEEN" tag on the Boss. */
export const PHOTO_ROLES = {
  'cast-queen.jpg': 'THE QUEEN',
  'cast-boss.jpg': 'THE BOSS',
  'cast-fixer.jpg': 'THE FIXER',
  'cast-lookout.jpg': 'THE LOOKOUT',
};

/** The role tag for a photo file name, or '' when the photo has no cast role. */
export function roleForPhoto(name) {
  return PHOTO_ROLES[name] ?? '';
}

/** Panel rects as fractions of the panel zone (below the press strip, above
 *  the title band). */
const LAYOUT_RECTS = {
  poster: [
    [0, 0, 0.54, 1],
    [0.54, 0, 0.46, 0.5],
    [0.54, 0.5, 0.46, 0.5],
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

/** The press strip: the top 4.5% of the cover, stars and quote live here. */
export function topStripH(h) {
  return h * 0.045;
}

/** The title band: the bottom 30% of the cover. */
export function titleBand(w, h) {
  return { x: 0, y: h * 0.7, w, h: h * 0.3 };
}

/** Panel rects in pixels for a layout, with a white gutter between them. */
export function layoutPanels(layout, w, h) {
  const zoneY = topStripH(h);
  const zoneH = h * 0.7 - zoneY;
  const gut = Math.max(4, w * 0.007);
  const names = LAYOUT_NAMES[layout] ?? LAYOUT_NAMES.poster;
  return (LAYOUT_RECTS[layout] ?? LAYOUT_RECTS.poster).map(([fx, fy, fw, fh], i) => ({
    x: fx * w + gut / 2,
    y: zoneY + fy * zoneH + gut / 2,
    w: fw * w - gut,
    h: fh * zoneH - gut,
    name: names[i] ?? `Panel ${i + 1}`,
  }));
}

/** The default state of a fresh cover. */
export function defaultState() {
  // The anchor sits a third down the photo's overflow: the cast portraits
  // are square with the face near the middle, so the default anchor frames
  // the face instead of the forehead or the chin.
  const panel = (photo, role) => ({ photo, zoom: 1, panX: 0, panY: 0, grade: 'sunset', anchorY: 0.3, role });
  return {
    layout: 'poster',
    size: '1080x1350',
    sky: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'TWO OUTLAWS. ONE CITY.',
    titleScale: 1,
    selected: 0,
    panels: [panel(0, 'THE QUEEN'), panel(1, 'THE BOSS'), panel(2, 'THE FIXER')],
  };
}

/** Parses an export size label like "1080x1350" into pixels. */
export function parseSize(size) {
  const [w, h] = size.split('x').map(Number);
  return { w: w || 1080, h: h || 1080 };
}

const GRADE_FILTERS = {
  sunset: 'saturate(1.55) contrast(1.12) sepia(0.48) hue-rotate(-18deg) brightness(1.03)',
  neon: 'saturate(2.1) contrast(1.14) hue-rotate(28deg) brightness(1.02)',
  mono: 'grayscale(1) contrast(1.12) brightness(1.06)',
  original: 'none',
};

const GRADE_TINTS = {
  sunset: ['rgba(255, 122, 60, 0.26)', 'rgba(200, 40, 120, 0.3)'],
  neon: ['rgba(255, 79, 216, 0.2)', 'rgba(55, 230, 255, 0.2)'],
  mono: null,
  original: null,
};

/** Draws one photo into a panel rect, cover-fit, with zoom, pan and grade.
 *  The vertical anchor keeps faces in frame: wide panels crop a photo's
 *  height hard, and faces usually sit near the middle, so the default anchor
 *  looks a third of the way down instead of the dead centre. */
function drawPanelPhoto(ctx, rect, img, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const s = base * panel.zoom;
  const dw = iw * s;
  const dh = ih * s;
  const anchorY = panel.anchorY ?? 0.3;
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

/** One five-pointed star, filled. */
function drawStar(ctx, cx, cy, r, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The press strip: five gold stars, a press quote, and a VOL. 1 chip. */
function drawTopStrip(ctx, w, stripH) {
  ctx.fillStyle = 'rgba(10, 2, 20, 0.88)';
  ctx.fillRect(0, 0, w, stripH);
  const r = stripH * 0.27;
  let sx = w * 0.018 + r;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx, stripH / 2, r, '#ffd94d');
    sx += r * 2.35;
  }
  ctx.font = `${Math.max(11, stripH * 0.4)}px Anton, "Arial Narrow", sans-serif`;
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('"PURE GOLDEN-HOUR MAYHEM" — THE HARBOR GAZETTE', w / 2, stripH / 2 + 1);
  const chip = 'VOL. 1';
  ctx.font = `${Math.max(11, stripH * 0.42)}px Anton, "Arial Narrow", sans-serif`;
  const tw = ctx.measureText(chip).width;
  const pad = stripH * 0.32;
  const cw = tw + pad * 2;
  const ch = stripH * 0.72;
  const cx = w - w * 0.018 - cw;
  const cy = (stripH - ch) / 2;
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(cx, cy, cw, ch);
  ctx.fillStyle = '#1a0526';
  ctx.textAlign = 'center';
  ctx.fillText(chip, cx + cw / 2, stripH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** A cast role chip at a panel's top-left corner: dark chip, gold bar. */
function drawRoleTag(ctx, rect, role) {
  if (!role) return;
  const text = String(role).toUpperCase();
  const h = Math.max(18, rect.w * 0.068);
  ctx.font = `${Math.round(h * 0.52)}px Anton, "Arial Narrow", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = h * 0.45;
  const bw = tw + pad * 2 + h * 0.3;
  const x = rect.x + Math.max(6, rect.w * 0.03);
  const y = rect.y + Math.max(6, rect.h * 0.035);
  ctx.fillStyle = 'rgba(10, 2, 20, 0.88)';
  ctx.fillRect(x, y, bw, h);
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(x, y, h * 0.3, h);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + h * 0.3 + pad * 0.55, y + h / 2 + 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

/** The title and subtitle across the title band. The title is drawn on an
 *  offscreen canvas so its letters can be filled with horizontal sunset
 *  bands, then stamped over the panels like a movie poster title. */
function drawTitle(ctx, w, h, band, title, subtitle, scale) {
  const text = (title || '').trim().toUpperCase();
  const sub = (subtitle || '').trim();
  if (text) {
    let size = h * 0.155 * scale;
    ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
    while (ctx.measureText(text).width > w * 0.96 && size > 14) {
      size -= 2;
      ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
    }
    const tw = ctx.measureText(text).width;
    const pad = Math.ceil(size * 0.24);
    const off = document.createElement('canvas');
    off.width = Math.ceil(tw + pad * 2);
    off.height = Math.ceil(size * 1.5);
    const o = off.getContext('2d');
    o.font = `${size}px Anton, "Arial Narrow", sans-serif`;
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.lineJoin = 'round';
    o.fillStyle = '#ffffff';
    o.fillText(text, off.width / 2, off.height / 2);
    // Horizontal sunset bands, clipped to the letters alone.
    o.globalCompositeOperation = 'source-atop';
    const bands = o.createLinearGradient(0, 0, 0, off.height);
    bands.addColorStop(0, '#ffe95e');
    bands.addColorStop(0.28, '#ffb03a');
    bands.addColorStop(0.5, '#ff7a3c');
    bands.addColorStop(0.68, '#ff2e88');
    bands.addColorStop(0.86, '#b04dff');
    bands.addColorStop(1, '#ff2e88');
    o.fillStyle = bands;
    o.fillRect(0, 0, off.width, off.height);
    o.globalCompositeOperation = 'source-over';
    // The dark outline goes on LAST and stays thin (4.5% of the size): a
    // thick outline drawn first closes Anton's counters and turns each word
    // into a solid bar, which is what Round 3's first capture showed.
    o.strokeStyle = '#1a0526';
    o.lineWidth = Math.max(3, size * 0.045);
    o.strokeText(text, off.width / 2, off.height / 2);
    // The title's centre straddles the panel/band boundary, so the letters
    // overlap the photos instead of sitting in a band of their own.
    const cx = w / 2;
    const cy = band.y + band.h * 0.16;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 46, 136, 0.75)';
    ctx.shadowBlur = size * 0.22;
    ctx.shadowOffsetY = size * 0.04;
    ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
    ctx.restore();
  }
  if (sub) {
    // Neon script under the title, tilted a touch like hand lettering.
    const size = Math.max(14, h * 0.052 * scale);
    ctx.save();
    ctx.translate(w / 2, band.y + band.h * 0.55);
    ctx.rotate(-0.035);
    ctx.font = `${size}px Yellowtail, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 79, 216, 0.9)';
    ctx.shadowBlur = size * 0.5;
    ctx.fillStyle = '#ff9de2';
    ctx.fillText(sub, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd7f2';
    ctx.fillText(sub, 0, -size * 0.04);
    ctx.restore();
  }
}

/** A deterministic barcode: seeded bars, so the export matches the preview. */
function drawBarcode(ctx, x, y, w, h, seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  ctx.fillStyle = '#f5eef7';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#12081f';
  let bx = x + w * 0.04;
  while (bx < x + w * 0.96) {
    const bw = w * (0.008 + next() * 0.03);
    if (next() > 0.45) ctx.fillRect(bx, y + h * 0.08, bw, h * 0.84);
    bx += bw + w * 0.012;
  }
}

/** The billing strip at the very bottom: credits, COMING SOON, barcode. */
function drawBilling(ctx, w, h, band) {
  const y = band.y + band.h * 0.93;
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(10, h * 0.013)}px Anton, "Arial Narrow", sans-serif`;
  ctx.fillStyle = 'rgba(255, 233, 168, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('A VICE COVER PICTURE · STARRING YOUR CREW · SHOT ON YOUR OWN CAMERA', w / 2, y);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffb03a';
  ctx.font = `${Math.max(12, h * 0.02)}px Anton, "Arial Narrow", sans-serif`;
  ctx.fillText('COMING SOON', w * 0.02, y);
  drawBarcode(ctx, w * 0.9, y - h * 0.016, w * 0.08, h * 0.032, 20261120);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

/** A gold seal overlapping the top-right panel's corner: BEST CAST. */
function drawSeal(ctx, w, h, stripH, zoneH) {
  const r = Math.max(26, w * 0.042);
  const cx = w * 0.935;
  const cy = stripH + zoneH * 0.24;
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#ffe95e');
  g.addColorStop(1, '#e8960c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4d00';
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  drawStar(ctx, cx, cy - r * 0.52, r * 0.14, '#7a4d00');
  ctx.fillStyle = '#5a3600';
  ctx.font = `${Math.round(r * 0.32)}px Anton, "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BEST', cx, cy - r * 0.08);
  ctx.fillText('CAST', cx, cy + r * 0.3);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Draws the whole cover. `photos` is an array of loaded images (or nulls).
 *  When `highlight` is true, the selected panel gets a dashed outline (preview
 *  only; exports pass false). */
export function drawCover(canvas, state, photos, highlight = false) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const band = titleBand(w, h);
  const stripH = topStripH(h);
  const zoneH = h * 0.7 - stripH;
  drawScene(ctx, w, h, state.sky, band);
  drawTopStrip(ctx, w, stripH);
  const panels = layoutPanels(state.layout, w, h);
  panels.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: null, zoom: 1, panX: 0, panY: 0, grade: 'sunset', role: '' };
    const img = panel.photo == null ? null : photos[panel.photo] ?? null;
    if (img) drawPanelPhoto(ctx, rect, img, panel);
    else drawEmptyPanel(ctx, rect);
    drawRoleTag(ctx, rect, panel.role);
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
  drawSeal(ctx, w, h, stripH, zoneH);
  drawTitle(ctx, w, h, band, state.title, state.subtitle, state.titleScale);
  drawBilling(ctx, w, h, band);
  // A thin neon rule where the panels meet the title band, tying the
  // poster together instead of letting the two halves just butt up.
  const rule = ctx.createLinearGradient(0, 0, w, 0);
  rule.addColorStop(0, 'rgba(255, 46, 136, 0)');
  rule.addColorStop(0.5, 'rgba(255, 46, 136, 0.85)');
  rule.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.fillStyle = rule;
  ctx.fillRect(0, band.y - Math.max(2, w * 0.002), w, Math.max(2, w * 0.004));
  // A thin white frame around the whole cover, so it reads as a poster.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(2, w * 0.005);
  ctx.strokeRect(0, 0, w, h);
}
