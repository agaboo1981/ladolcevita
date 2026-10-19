/**
 * Downloads a CURATED set of real, freely-licensed pictures of Lucca - the
 * subject's own world - from Wikimedia Commons, with full provenance recorded
 * in images/lucca/CREDITS.json. Only commercial-use licences.
 *
 * Run: node scripts/fetch-commons.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('images/lucca');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'LaDolceVitaPortfolio/1.0 (demo build; contact: portfolio)' };

const strip = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** local id -> Commons file title */
const PICKS = {
  'lucca-walls':      'File:Mura di Lucca.jpg',
  'lucca-walls-dusk': 'File:Sulle mura di Lucca al tramonto.jpg',
  'lucca-anfiteatro': "File:Piazza dell' Anfiteatro- Amphitheater - Lucca - panoramio.jpg",
  'lucca-tower':      'File:Lucca - Torre Guinigi from Campanile.jpg',
  'lucca-rooftops':   'File:Lucca Panorama.jpg',
  'lucca-street':     'File:Lucca, Via Fillungo (1).jpg',
  'lucca-wall-path':  'File:Lucca vista dalle Mura - lato interno.jpg',
  'lucca-night':      'File:Mura di Lucca in notturna.jpg',
};

async function info(title) {
  const url = `${API}?action=query&titles=${encodeURIComponent(title)}` +
    `&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=2400&format=json&origin=*`;
  const res = await fetch(url, { headers: UA });
  const data = await res.json();
  const page = Object.values(data?.query?.pages || {})[0] || {};
  const i = page.imageinfo?.[0];
  if (!i) return null;
  const m = i.extmetadata || {};
  return {
    title: page.title,
    url: i.thumburl || i.url,
    width: i.thumbwidth || i.width,
    height: i.thumbheight || i.height,
    license: strip(m.LicenseShortName?.value),
    licenseUrl: strip(m.LicenseUrl?.value),
    artist: strip(m.Artist?.value) || 'Unknown',
    page: i.descriptionurl,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const credits = [];
  for (const [id, title] of Object.entries(PICKS)) {
    try {
      const meta = await info(title);
      if (!meta) { console.warn(`- ${id}: not found (${title})`); continue; }
      const res = await fetch(meta.url, { headers: UA });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ext = /\.png$/i.test(meta.url) ? 'png' : 'jpg';
      const file = `${id}.${ext}`;
      await pipeline(res.body, createWriteStream(path.join(OUT_DIR, file)));
      credits.push({ id, file, ...meta });
      console.log(`OK  ${file}  ${meta.width}x${meta.height}  ${meta.license}  ${meta.artist}`);
    } catch (err) {
      console.warn(`! ${id}: ${err.message}`);
    }
  }
  await writeFile(path.join(OUT_DIR, 'CREDITS.json'), JSON.stringify(credits, null, 2));
  console.log(`\n${credits.length} image(s) -> images/lucca/`);
}

main();
