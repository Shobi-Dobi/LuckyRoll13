const sitemapOrigin = 'https://luckyroll13.com';

// Explicit content revision dates keep sitemap generation deterministic. Update
// only the affected route when its visible content, metadata or structured data
// changes; a build by itself must not make every URL appear newly modified.
export const sitemapLastModifiedByRoute = Object.freeze({
  home: '2026-11-21',
  boxing: '2026-11-17',
  'women-boxing': '2026-11-17',
  bjj: '2026-11-17',
  kids: '2026-11-17',
  mma: '2026-11-17',
  adults: '2026-11-17',
  about: '2026-11-17',
  collaborations: '2026-11-17',
  events: '2026-11-17',
  'javier-zaruski-seminar': '2026-11-17',
  'kiryat-motzkin': '2026-11-17',
  goshen: '2026-11-17',
  schedule: '2026-11-17',
  contact: '2026-11-17',
  accessibility: '2026-11-17',
  guide: '2026-11-17'
});

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function renderSitemap(routes) {
  const entries = ['he', 'en'].flatMap((language) => routes.map((route) => {
    const lastModified = sitemapLastModifiedByRoute[route.key];
    if (!lastModified) throw new Error(`Missing sitemap revision date for route: ${route.key}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastModified)) throw new Error(`Invalid sitemap revision date for route: ${route.key}`);

    return {
      url: new URL(route[language], sitemapOrigin).href,
      lastModified
    };
  }));

  const urls = entries.map(({ url }) => url);
  if (new Set(urls).size !== urls.length) throw new Error('Duplicate sitemap URL generated');

  const rows = entries.map(({ url, lastModified }) =>
    `  <url><loc>${escapeXml(url)}</loc><lastmod>${lastModified}</lastmod></url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}
