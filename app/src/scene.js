// Draws the cover's own Vice City sky: a sunset or neon night gradient, a slatted
// synthwave sun, a lit skyline and palm silhouettes. Everything is drawn from code,
// so it is the same on every machine and at every export size. All randomness is
// seeded, so the preview and the exported PNG match exactly.

/** A small deterministic random generator: same seed, same skyline every time. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKIES = {
  sunset: {
    stops: [[0, '#2a1052'], [0.34, '#8a2a7d'], [0.58, '#e1437e'], [0.78, '#ff7a3c'], [1, '#ffb03a']],
    sun: '#ffd76a',
    sunCore: '#fff3c4',
    glow: 'rgba(255, 122, 60, 0.55)',
    building: '#1c0a2e',
    far: '#452064',
    window: '#ffd76a',
    palm: '#160722',
    star: 'rgba(255, 255, 255, 0.7)',
  },
  neon: {
    stops: [[0, '#05021a'], [0.36, '#1d0b4d'], [0.6, '#6d1e7a'], [0.8, '#c62d7e'], [1, '#ff5e8a']],
    sun: '#ff4fd8',
    sunCore: '#ffe3f6',
    glow: 'rgba(255, 79, 216, 0.5)',
    building: '#0a0318',
    far: '#2c1156',
    window: '#37e6ff',
    palm: '#070213',
    star: 'rgba(255, 255, 255, 0.85)',
  },
};

/** The palette for a sky name; falls back to sunset for an unknown name. */
export function skyPalette(sky) {
  return SKIES[sky] ?? SKIES.sunset;
}

/** Paints the sky, sun, skyline and palms across the whole cover. `band` is the
 *  title band rect {x, y, w, h} where the sun and skyline sit. */
export function drawScene(ctx, w, h, sky, band) {
  const pal = skyPalette(sky);
  const rand = seededRandom(sky === 'neon' ? 20261119 : 19111926);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of pal.stops) grad.addColorStop(at, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // A few faint stars high in the sky.
  ctx.fillStyle = pal.star;
  for (let i = 0; i < 42; i++) {
    const sx = rand() * w;
    const sy = rand() * h * 0.3;
    const r = (0.6 + rand() * 1.4) * (w / 1080);
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A few tiny birds crossing the upper sky, for a lived-in feel.
  ctx.strokeStyle = 'rgba(20, 6, 30, 0.55)';
  ctx.lineWidth = Math.max(1.5, w * 0.0016);
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const bx = w * (0.08 + rand() * 0.6);
    const by = h * (0.05 + rand() * 0.16);
    const span = w * (0.008 + rand() * 0.008);
    ctx.beginPath();
    ctx.moveTo(bx - span, by);
    ctx.quadraticCurveTo(bx - span * 0.4, by - span * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + span * 0.4, by - span * 0.7, bx + span, by);
    ctx.stroke();
  }

  // The sun: a big disc high over the title band, slatted across its lower
  // half. It sits right of centre and high enough that the title below it
  // never swallows it whole, and its slats never cross the lettering.
  const sunR = band.h * 0.62;
  const sunX = w * 0.8;
  const sunY = band.y + band.h * 0.2;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.1);
  halo.addColorStop(0, pal.glow);
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - sunR * 2.2, sunY - sunR * 2.2, sunR * 4.4, sunR * 4.4);
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, pal.sunCore);
  sunGrad.addColorStop(0.55, pal.sun);
  sunGrad.addColorStop(1, '#ff5e3c');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Slats: sky-coloured bars that thicken towards the bottom of the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  let slatY = sunY + sunR * 0.05;
  let thick = Math.max(2, h * 0.004);
  while (slatY < sunY + sunR) {
    const t = (slatY - sunY) / sunR;
    ctx.fillStyle = gradientAt(pal, t);
    ctx.fillRect(sunX - sunR, slatY, sunR * 2, thick);
    slatY += thick + Math.max(3, h * 0.016);
    thick *= 1.45;
  }
  ctx.restore();

  // A warm glow hugging the horizon, so the skyline sits in light instead
  // of against a flat gradient.
  const horizon = ctx.createLinearGradient(0, band.y + band.h * 0.35, 0, band.y + band.h);
  horizon.addColorStop(0, 'rgba(255, 122, 60, 0)');
  horizon.addColorStop(1, pal.glow);
  ctx.fillStyle = horizon;
  ctx.fillRect(0, band.y + band.h * 0.35, w, band.h * 0.65);

  // Skyline in two layers: a lighter far row of towers, then the dark near
  // row in front of it, both standing on the band's floor. The far layer
  // gives the band depth instead of one flat black strip.
  const floorY = band.y + band.h;
  skylineRow(ctx, rand, w, band, band.y + band.h * 0.62, pal.far, pal.window, 46, 0.18, 0.4, false);
  skylineRow(ctx, rand, w, band, band.y + band.h * 0.55, pal.building, pal.window, 90, 0.3, 0.55, true);

  // Two palm silhouettes framing the band, left and right.
  drawPalm(ctx, w * 0.045, floorY, band.h * 0.95, -0.22, pal.palm);
  drawPalm(ctx, w * 0.955, floorY, band.h * 0.8, 0.2, pal.palm);

  // A soft dark vignette so the title text reads over the sky.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(10, 2, 20, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** One row of skyline towers with lit windows, standing on the band's floor.
 *  `baseY` is where the row's feet sit; towers rise `minH` to `maxH` of the
 *  band above it, and `aerials` adds thin antennae to some towers. */
function skylineRow(ctx, rand, w, band, baseY, color, windowColor, windows, minH, maxH, aerials) {
  ctx.fillStyle = color;
  let bx = 0;
  while (bx < w) {
    const bw = w * (0.05 + rand() * 0.09);
    const bh = band.h * (minH + rand() * (maxH - minH));
    const top = baseY + (band.h * 0.7 - bh);
    ctx.fillRect(bx, top, bw, bh + band.h * 0.3);
    if (aerials && rand() > 0.6) {
      ctx.fillRect(bx + bw / 2 - 1, top - band.h * 0.12, 2, band.h * 0.12);
    }
    bx += bw + w * 0.008;
  }
  ctx.fillStyle = windowColor;
  for (let i = 0; i < windows; i++) {
    const wx = rand() * w;
    const wy = baseY + rand() * band.h * 0.42;
    const ww = Math.max(2, w * 0.004);
    const wh = Math.max(2, band.h * 0.014);
    ctx.globalAlpha = 0.3 + rand() * 0.6;
    ctx.fillRect(wx, wy, ww, wh);
  }
  ctx.globalAlpha = 1;
}

/** The sky colour partway down, used to paint the sun's slats. */
function gradientAt(pal, t) {
  const stops = pal.stops;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [a0, c0] = stops[i - 1];
      const [a1, c1] = stops[i];
      return mixColor(c0, c1, (t - a0) / (a1 - a0));
    }
  }
  return stops[stops.length - 1][1];
}

function mixColor(c0, c1, t) {
  const p0 = [1, 3, 5].map((i) => parseInt(c0.slice(i, i + 2), 16));
  const p1 = [1, 3, 5].map((i) => parseInt(c1.slice(i, i + 2), 16));
  const m = p0.map((v, i) => Math.round(v + (p1[i] - v) * t));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
}

/** One palm: a leaning trunk and seven drooping fronds, all silhouette. */
function drawPalm(ctx, x, groundY, size, lean, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = x + size * lean;
  const topY = groundY - size;
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.quadraticCurveTo(x + size * lean * 0.4, groundY - size * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, size * 0.02);
  for (let i = 0; i < 7; i++) {
    const ang = (-0.25 - i * 0.22) * Math.PI;
    const len = size * (0.42 + (i % 3) * 0.05);
    const ex = topX + Math.cos(ang) * len;
    const ey = topY + Math.abs(Math.sin(ang)) * len * 0.55 + len * 0.12;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(ang) * len * 0.5, topY - len * 0.18, ex, ey);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - size * 0.03, topY + size * 0.04, size * 0.035, 0, Math.PI * 2);
  ctx.arc(topX + size * 0.04, topY + size * 0.05, size * 0.03, 0, Math.PI * 2);
  ctx.fill();
}
