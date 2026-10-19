/**
 * Builds responsive WebP + a JPEG fallback for every photograph into images/build/.
 * Run: node scripts/optimize-images.mjs
 */
import { readdir, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'images/build');
const WIDTHS = [640, 800, 1024, 1400, 2000, 2400];
const WEBP_Q = 72;
const FALLBACK_MAX = 1400;

async function sources() {
  const dirs = [path.join(ROOT, 'images'), path.join(ROOT, 'images/lucca')];
  const out = [];
  for (const dir of dirs) {
    let files = [];
    try { files = await readdir(dir); } catch { continue; }
    for (const f of files) if (/\.jpe?g$/i.test(f)) out.push(path.join(dir, f));
  }
  return out;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  let total = 0;
  for (const file of await sources()) {
    const base = path.basename(file, path.extname(file));
    const img = sharp(file, { failOn: 'none' });
    const meta = await img.metadata();
    const widths = WIDTHS.filter((w) => w <= meta.width);
    if (!widths.length) widths.push(meta.width);

    for (const w of widths) {
      const dest = path.join(OUT, `${base}-${w}.webp`);
      await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: WEBP_Q }).toFile(dest);
      total += (await stat(dest)).size;
    }
    // one JPEG fallback per source
    const fw = Math.min(FALLBACK_MAX, meta.width);
    const jdest = path.join(OUT, `${base}-fallback.jpg`);
    await sharp(file).resize({ width: fw, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(jdest);
    total += (await stat(jdest)).size;

    console.log(`${base.padEnd(24)} ${meta.width}x${meta.height} -> [${widths.join(', ')}] webp`);
  }
  console.log(`\nTotal images/build: ${(total / 1e6).toFixed(2)} MB (all sizes, all sources)`);
}

main();
