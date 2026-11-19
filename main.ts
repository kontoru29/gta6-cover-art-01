// Hands in the Vice Cover entry (Node 22, standard library only).
//
// The entry is the app/ folder beside this file: plain static files that a
// desktop browser opens offline, plus the screenshots/ folder. This program
// copies both into the output folder and writes dossier.json there, using the
// vendored make.fun library, so the sealed scorer can check the entry and the
// judge can read it. Run it locally with:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The folder this file lives in, and the folder the entry goes to.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copies a file or a whole directory tree, making folders as needed. */
function copyTree(from, to) {
  const info = statSync(from);
  if (info.isDirectory()) {
    mkdirSync(to, { recursive: true });
    for (const name of readdirSync(from)) copyTree(join(from, name), join(to, name));
  } else {
    mkdirSync(join(to, '..'), { recursive: true });
    copyFileSync(from, to);
  }
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));

// The scorer's own caps for this bounty: the text cap shapes the dossier's
// bytes, the rest refuse an entry the scorer would refuse anyway (too many
// screenshots, one too large, or an app/ past its file and size caps).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
