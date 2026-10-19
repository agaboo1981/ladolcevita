/** Lists Wikimedia Commons candidates (title, size, aspect, licence) for review. */
const API = 'https://commons.wikimedia.org/w/api.php';
const queries = process.argv.slice(2);

const strip = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

for (const q of queries) {
  const url = `${API}?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}` +
    `&gsrnamespace=6&gsrlimit=14&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=2400&format=json&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': 'LaDolceVitaPortfolio/1.0 (demo build)' } });
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {});
  console.log(`\n### ${q}  (${pages.length})`);
  for (const p of pages) {
    const i = p.imageinfo?.[0] || {};
    const m = i.extmetadata || {};
    const w = i.width, h = i.height;
    const aspect = w && h ? (w / h).toFixed(2) : '?';
    console.log(`${p.title.replace('File:', '')}  | ${w}x${h} a${aspect} | ${strip(m.LicenseShortName?.value)} | ${strip(m.Artist?.value).slice(0, 40)}`);
  }
}
