const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

const normalizeSiteUrl = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return 'https://example.com';
  }

  return trimmed.replace(/\/+$/, '');
};

const siteUrl = normalizeSiteUrl(process.env.SITE_URL);
const lastmod = (process.env.SITEMAP_LASTMOD || new Date().toISOString().slice(0, 10)).trim();

const routes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/menu.html', changefreq: 'monthly', priority: '0.9' },
  { path: '/reservations.html', changefreq: 'monthly', priority: '0.9' },
  { path: '/gallery.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/order.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/checkout.html', changefreq: 'monthly', priority: '0.6' }
];

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(({ path: routePath, changefreq, priority }) => {
    return [
      '  <url>',
      `    <loc>${siteUrl}${routePath}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>'
    ].join('\n');
  }),
  '</urlset>',
  ''
].join('\n');

const robotsTxt = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`,
  ''
].join('\n');

fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsTxt, 'utf8');

if (siteUrl === 'https://example.com') {
  console.warn('SEO files generated with default SITE_URL=https://example.com. Set SITE_URL for deployment.');
} else {
  console.log(`SEO files generated for ${siteUrl}`);
}
