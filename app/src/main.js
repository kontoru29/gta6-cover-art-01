// Wires the Vice Cover editor: photo tray, layout and size pickers, per-panel
// crop and grade controls, caption editing, PNG export, and the fixed ?shot=
// scenes the screenshots use. The cover itself is drawn by cover.js.

import { drawCover, defaultState, layoutPanels, parseSize } from './cover.js';

const canvas = document.getElementById('cover');
const tray = document.getElementById('tray');
const status = document.getElementById('status');
const state = defaultState();

// Photos the editor knows: the two samples first, then anything the user adds.
const photos = [];
const photoNames = [];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhoto(url, name) {
  const img = await loadImage(url);
  photos.push(img);
  photoNames.push(name);
  return photos.length - 1;
}

function redraw() {
  // The preview canvas keeps the export aspect, capped at 1080 on its long side.
  const { w, h } = parseSize(state.size);
  const scale = Math.min(1, 1080 / Math.max(w, h));
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const readout = document.getElementById('sizeReadout');
  if (readout) readout.textContent = `Preview: ${w} × ${h} — export PNG`;
  drawCover(canvas, state, photos, true);
}

/** Frames every repeated photo differently, so a poster never shows the
 *  same shot twice. The first use of a photo keeps its framing; later uses
 *  cycle through the varied framings. */
function varyRepeatFraming() {
  state.panels.forEach((p, i) => {
    const seen = state.panels.slice(0, i).filter((q) => q.photo === p.photo).length;
    if (seen > 0 && p.photo != null) {
      const f = REPEAT_FRAMINGS[1 + ((i + seen - 1) % (REPEAT_FRAMINGS.length - 1))];
      p.zoom = f.zoom;
      p.panX = f.panX;
      p.panY = f.panY;
    }
  });
}

/** Rebuilds the photo tray and the panel photo dropdown from the photo list. */
function refreshPhotoUI() {
  tray.innerHTML = '';
  photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = photoNames[i];
    thumb.title = photoNames[i];
    thumb.classList.toggle('on', state.panels[state.selected]?.photo === i);
    thumb.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      refreshPhotoUI();
      redraw();
    });
    tray.appendChild(thumb);
  });
  const sel = document.getElementById('panelPhoto');
  sel.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'No photo';
  sel.appendChild(none);
  photos.forEach((img, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = photoNames[i];
    sel.appendChild(opt);
  });
  const cur = state.panels[state.selected]?.photo;
  sel.value = cur == null ? '' : String(cur);
}

/** Shows the selected panel's controls. */
function refreshPanelUI() {
  const panel = state.panels[state.selected];
  const names = { poster: ['Hero', 'Street', 'Night'], grid: ['Top left', 'Top right', 'Bottom left', 'Bottom right'], trio: ['Left', 'Middle', 'Right'] }[state.layout];
  document.getElementById('panelName').textContent = `Panel ${state.selected + 1} — ${names?.[state.selected] ?? ''}`;
  document.getElementById('zoom').value = panel.zoom;
  document.getElementById('zoomVal').textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById('panX').value = panel.panX;
  document.getElementById('panXVal').textContent = panel.panX.toFixed(2);
  document.getElementById('panY').value = panel.panY;
  document.getElementById('panYVal').textContent = panel.panY.toFixed(2);
  document.getElementById('grade').value = panel.grade;
  refreshPhotoUI();
}

function bindSegmented(id, attr, apply) {
  document.getElementById(id).addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    for (const b of e.currentTarget.querySelectorAll('button')) b.classList.toggle('on', b === btn);
    apply(btn.dataset[attr]);
  });
}

bindSegmented('layouts', 'layout', (layout) => {
  state.layout = layout;
  const count = { poster: 3, grid: 4, trio: 3 }[layout];
  while (state.panels.length < count) {
    state.panels.push({ photo: state.panels[0]?.photo ?? null, zoom: 1, panX: 0, panY: 0, grade: 'sunset', anchorY: 0.24 });
  }
  state.panels.length = count;
  state.selected = Math.min(state.selected, count - 1);
  refreshPanelUI();
  redraw();
});

bindSegmented('sizes', 'size', (size) => {
  state.size = size;
  redraw();
});

bindSegmented('skies', 'sky', (sky) => {
  state.sky = sky;
  redraw();
});

document.getElementById('panelPhoto').addEventListener('change', (e) => {
  state.panels[state.selected].photo = e.target.value === '' ? null : Number(e.target.value);
  refreshPhotoUI();
  redraw();
});

document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value);
  document.getElementById('zoomVal').textContent = `${state.panels[state.selected].zoom.toFixed(2)}×`;
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  state.panels[state.selected].panX = Number(e.target.value);
  document.getElementById('panXVal').textContent = state.panels[state.selected].panX.toFixed(2);
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  state.panels[state.selected].panY = Number(e.target.value);
  document.getElementById('panYVal').textContent = state.panels[state.selected].panY.toFixed(2);
  redraw();
});
document.getElementById('grade').addEventListener('change', (e) => {
  state.panels[state.selected].grade = e.target.value;
  redraw();
});

document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('titleSize').addEventListener('input', (e) => {
  state.titleScale = Number(e.target.value) / 100;
  document.getElementById('titleSizeVal').textContent = `${e.target.value}%`;
  redraw();
});

document.getElementById('photos').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const idx = await addPhoto(URL.createObjectURL(file), file.name);
    state.panels[state.selected].photo = idx;
  }
  refreshPhotoUI();
  redraw();
  status.textContent = `${e.target.files.length} photo(s) added.`;
});

/** Framings that keep one photo from looking cloned across panels: each
 *  panel gets its own zoom and pan, so the same photo reads as a new shot. */
const REPEAT_FRAMINGS = [
  { zoom: 1, panX: 0, panY: 0 },
  { zoom: 1.5, panX: -0.3, panY: 0.1 },
  { zoom: 1.25, panX: 0.35, panY: -0.1 },
  { zoom: 1.7, panX: 0.1, panY: 0.15 },
];

/** Syncs the segmented buttons with the state (used after a surprise pick). */
function syncSegments() {
  for (const [id, attr, value] of [['layouts', 'layout', state.layout], ['sizes', 'size', state.size], ['skies', 'sky', state.sky]]) {
    for (const b of document.getElementById(id).querySelectorAll('button')) {
      b.classList.toggle('on', b.dataset[attr] === value);
    }
  }
}

document.getElementById('fillAll').addEventListener('click', () => {
  const photo = state.panels[state.selected].photo;
  if (photo == null) {
    status.textContent = 'Pick a photo for the selected panel first.';
    return;
  }
  for (const [i, p] of state.panels.entries()) {
    p.photo = photo;
    const f = REPEAT_FRAMINGS[i % REPEAT_FRAMINGS.length];
    p.zoom = f.zoom;
    p.panX = f.panX;
    p.panY = f.panY;
  }
  refreshPhotoUI();
  redraw();
  status.textContent = 'Every panel now uses the selected photo, each framed differently.';
});

// One click: a new layout, a new sky and fresh grades, so a cover is one
// tap away when the user does not want to fiddle with every control.
document.getElementById('surprise').addEventListener('click', () => {
  const layouts = ['poster', 'grid', 'trio'];
  const skies = ['sunset', 'neon'];
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.sky = skies[Math.floor(Math.random() * skies.length)];
  const count = { poster: 3, grid: 4, trio: 3 }[state.layout];
  while (state.panels.length < count) {
    state.panels.push({ photo: state.panels[0]?.photo ?? null, zoom: 1, panX: 0, panY: 0, grade: 'sunset', anchorY: 0.24 });
  }
  state.panels.length = count;
  state.selected = Math.min(state.selected, count - 1);
  state.panels.forEach((p, i) => {
    const f = REPEAT_FRAMINGS[i % REPEAT_FRAMINGS.length];
    p.zoom = f.zoom;
    p.panX = f.panX;
    p.panY = f.panY;
    p.grade = Math.random() > 0.5 ? 'sunset' : 'neon';
  });
  syncSegments();
  refreshPanelUI();
  redraw();
  status.textContent = `Surprise: ${state.layout} layout, ${state.sky} sky.`;
});

// Clicking the preview picks the panel under the pointer.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const hit = panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  if (hit >= 0) {
    state.selected = hit;
    refreshPanelUI();
    redraw();
  }
});

/** Renders the cover at full export size and downloads it as a PNG. */
function exportPNG() {
  const { w, h } = parseSize(state.size);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, photos, false);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed. Try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${w}x${h}.png (${Math.round(blob.size / 1024)} KB).`;
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', exportPNG);

// Exposed for the screenshot smoke test: renders and reports the PNG size.
window.__exportPNG = function exportForTest() {
  return new Promise((resolve) => {
    const { w, h } = parseSize(state.size);
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, state, photos, false);
    off.toBlob((blob) => resolve(blob ? blob.size : 0), 'image/png');
  });
};

/** Fixed scenes for screenshots: ?shot=cover shows the cover alone, ?shot=editor
 *  the editor with a sample photo. Query params pick the sample, caption, size,
 *  layout and sky. window.__shotReady fires once the scene has painted. */
async function runShot(query) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const photo = query.get('photo') ?? 'pier';
  const photoIdx = photoNames.findIndex((n) => n.startsWith(photo));
  state.title = query.get('title') ?? state.title;
  state.subtitle = query.get('subtitle') ?? state.subtitle;
  state.size = query.get('size') ?? state.size;
  state.layout = query.get('layout') ?? state.layout;
  state.sky = query.get('sky') ?? state.sky;
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  const count = { poster: 3, grid: 4, trio: 3 }[state.layout];
  while (state.panels.length < count) state.panels.push({ photo: photoIdx, zoom: 1, panX: 0, panY: 0, grade: 'sunset', anchorY: 0.24 });
  state.panels.length = count;
  // Alternate the two sample photos across the panels, so the cover never
  // repeats the same photo in every panel, and frame each repeat
  // differently so no two panels show the same shot.
  const other = photoNames.findIndex((n) => !n.startsWith(photo));
  state.panels.forEach((p, i) => {
    p.photo = i % 2 === 0 ? photoIdx : (other >= 0 ? other : photoIdx);
    p.grade = query.get('grade') ?? p.grade;
  });
  varyRepeatFraming();
  refreshPanelUI();
  // In cover mode the canvas draws at full export size for a crisp shot.
  if (shot === 'cover') {
    const { w, h } = parseSize(state.size);
    canvas.width = w;
    canvas.height = h;
    drawCover(canvas, state, photos, false);
  } else {
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

const query = new URLSearchParams(location.search);
(async () => {
  await addPhoto('samples/boulevard.jpg', 'boulevard.jpg');
  await addPhoto('samples/pier.jpg', 'pier.jpg');
  try {
    await document.fonts.load('40px Anton');
    await document.fonts.ready;
  } catch {
    // The Anton file is local; if it fails the cover still draws in fallback type.
  }
  if (query.get('shot')) await runShot(query);
  else {
    varyRepeatFraming();
    refreshPanelUI();
    redraw();
  }
})();
