import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonTranslations, pageTranslations } from './english-translations.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const productionOrigin = 'https://luckyroll13.com';
const assetVersion = '20260923-1';

const routes = [
  { key: 'home', he: '/', en: '/en/', file: 'index.html' },
  { key: 'boxing', he: '/boxing/', en: '/en/boxing/', file: 'boxing/index.html' },
  { key: 'women-boxing', he: '/women-boxing/', en: '/en/women-boxing/', file: 'women-boxing/index.html' },
  { key: 'bjj', he: '/bjj/', en: '/en/bjj/', file: 'bjj/index.html' },
  { key: 'kids', he: '/kids/', en: '/en/kids/', file: 'kids/index.html' },
  { key: 'mma', he: '/mma/', en: '/en/mma/', file: 'mma/index.html' },
  { key: 'adults', he: '/adults/', en: '/en/adults/', file: 'adults/index.html' },
  { key: 'about', he: '/about/', en: '/en/about/', file: 'about/index.html' },
  { key: 'collaborations', he: '/collaborations/', en: '/en/collaborations/', file: 'collaborations/index.html' },
  { key: 'events', he: '/events/', en: '/en/events/', file: 'events/index.html' },
  { key: 'javier-zaruski-seminar', he: '/javier-zaruski-seminar/', en: '/en/javier-zaruski-seminar/', file: 'javier-zaruski-seminar/index.html' },
  { key: 'kiryat-motzkin', he: '/kiryat-motzkin/', en: '/en/kiryat-motzkin/', file: 'kiryat-motzkin/index.html' },
  { key: 'contact', he: '/contact/', en: '/en/contact/', file: 'contact/index.html' },
  { key: 'accessibility', he: '/accessibility/', en: '/en/accessibility/', file: 'accessibility/index.html' }
];

const navItems = [
  ['/', 'דף הבית', 'Home'],
  ['/bjj/', 'ג׳יו־ג׳יטסו', 'Brazilian Jiu-Jitsu'],
  ['/boxing/', 'אגרוף', 'Boxing'],
  ['/women-boxing/', 'אגרוף נשים', "Women's Boxing"],
  ['/kids/', 'ילדים ונוער', 'Kids and Youth'],
  ['/mma/', 'MMA', 'MMA'],
  ['/adults/', 'אימונים אישיים', 'Personal Training'],
  ['/about/', 'עלינו', 'About'],
  ['/collaborations/', 'שיתופי פעולה', 'Collaborations'],
  ['/events/', 'סמינרים ואירועים', 'Seminars and Events'],
  ['/kiryat-motzkin/', 'קריית מוצקין', 'Kiryat Motzkin'],
  ['/contact/', 'צור קשר', 'Contact']
];

function languageHeader(route, language) {
  const english = language === 'en';
  const logoHome = english ? '/en/' : '/';
  const navLinks = navItems.map(([hePath, heLabel, enLabel]) => {
    const itemRoute = routes.find((candidate) => candidate.he === hePath);
    const href = english ? itemRoute.en : hePath;
    const label = english ? enLabel : heLabel;
    const current = (english ? route.en : route.he) === href ? ' aria-current="page"' : '';
    const className = hePath === '/contact/' ? ' class="cta"' : '';
    return `        <a${className} href="${href}"${current}>${label}</a>`;
  }).join('\n');

  const heCurrent = english ? '' : ' aria-current="page"';
  const enCurrent = english ? ' aria-current="page"' : '';
  const languageLabel = english ? 'Choose language' : 'בחירת שפה';
  const menuLabel = english ? 'Open navigation menu' : 'פתיחת תפריט ניווט';
  const menuCloseLabel = english ? 'Close navigation menu' : 'סגירת תפריט ניווט';
  const navLabel = english ? 'Primary navigation' : 'ניווט ראשי';
  const closeText = english ? 'Close' : 'סגירה';

  return `<header class="top">
  <div class="wrap nav">
    <a class="brand-link" href="${logoHome}" aria-label="Lucky Roll13${english ? ' English home' : ' דף הבית'}">
      <img class="logo" src="/assets/images/luckyroll13-header-logo.webp" alt="Lucky Roll13 - Boxing &amp; Jiu-Jitsu" width="1431" height="359">
    </a>
    <div class="header-tools">
      <div class="language-switcher" aria-label="${languageLabel}">
        <a href="${route.he}" hreflang="he" lang="he"${heCurrent}>עברית</a>
        <span class="language-switcher-separator" aria-hidden="true">|</span>
        <a href="${route.en}" hreflang="en" lang="en"${enCurrent}>English</a>
      </div>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="${menuLabel}" data-open-label="${menuLabel}" data-close-label="${menuCloseLabel}">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
        </svg>
      </button>
    </div>
    <nav id="primary-navigation" class="links" aria-label="${navLabel}">
      <button class="menu-close" type="button"><span>${closeText}</span><span class="menu-close-icon" aria-hidden="true">×</span></button>
${navLinks}
    </nav>
  </div>
</header>`;
}

function replaceHeader(html, route, language) {
  const headerPattern = /<header\b[^>]*class=["'][^"']*\btop\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i;
  if (!headerPattern.test(html)) throw new Error(`Missing shared header in ${route.file}`);
  return html.replace(headerPattern, languageHeader(route, language));
}

function addLanguageSeo(html, route, language) {
  const english = language === 'en';
  const canonicalPath = english ? route.en : route.he;
  const canonicalUrl = productionOrigin + canonicalPath;
  const alternateMarkup = `<link rel="alternate" hreflang="he" href="${productionOrigin + route.he}">
  <link rel="alternate" hreflang="en" href="${productionOrigin + route.en}">
  <link rel="alternate" hreflang="x-default" href="${productionOrigin + route.he}">`;

  html = html.replace(/<html\b[^>]*>/i, `<html lang="${english ? 'en' : 'he'}" dir="${english ? 'ltr' : 'rtl'}">`);
  html = html.replace(/\s*<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["'](?:he|en|x-default)["'][^>]*>\s*/gi, '\n  ');

  const canonicalPattern = /<link\b(?=[^>]*rel=["']canonical["'])(?=[^>]*href=["'][^"']+["'])[^>]*>/i;
  if (!canonicalPattern.test(html)) throw new Error(`Missing canonical in ${route.file}`);
  html = html.replace(canonicalPattern, `<link rel="canonical" href="${canonicalUrl}">\n  ${alternateMarkup}`);

  html = html.replace(/(<meta\b(?=[^>]*property=["']og:url["'])(?=[^>]*content=["'])[^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${canonicalUrl}$2`);
  html = html.replace(/(<meta\b(?=[^>]*property=["']og:locale["'])(?=[^>]*content=["'])[^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${english ? 'en_US' : 'he_IL'}$2`);
  html = html.replace(/"inLanguage"\s*:\s*"he-IL"/g, `"inLanguage":"${english ? 'en-US' : 'he-IL'}"`);

  if (!html.includes("document.documentElement.classList.add('js-enabled')")) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n  <script>document.documentElement.classList.add('js-enabled');</script>`);
  }

  html = html.replace(/\/assets\/style\.css(?:\?v=[^"']*)?/g, `/assets/style.css?v=${assetVersion}`);
  html = html.replace(/\/assets\/site\.js(?:\?v=[^"']*)?/g, `/assets/site.js?v=${assetVersion}`);
  html = html.replace(/\/assets\/events\.js(?:\?v=[^"']*)?/g, `/assets/events.js?v=${assetVersion}`);
  html = html.replace(/\/assets\/tracking\.js(?:\?v=[^"']*)?/g, `/assets/tracking.js?v=${assetVersion}`);
  html = html.replace(/^[ \t]+$/gm, '');

  return html;
}

function translateEnglish(html, route) {
  const translations = Object.entries({ ...commonTranslations, ...(pageTranslations[route.key] || {}) })
    .sort(([left], [right]) => right.length - left.length);

  for (const [hebrew, english] of translations) html = html.split(hebrew).join(english);

  html = html.replace(/href=(["'])\/(boxing|women-boxing|bjj|kids|mma|adults|about|collaborations|events|javier-zaruski-seminar|kiryat-motzkin|contact|accessibility)\//g, 'href=$1/en/$2/');
  html = html.replace(/href=(["'])\/\1/g, 'href=$1/en/$1');
  html = html.replace(/action=(["'])\/thank-you\.html\1/g, 'action=$1/en/thank-you/$1');

  const pageUrl = productionOrigin + route.en;
  html = html.replace(new RegExp(`${productionOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${route.he.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), pageUrl);
  for (const linkedRoute of routes.filter((candidate) => candidate.he !== '/')) {
    html = html.split(productionOrigin + linkedRoute.he).join(productionOrigin + linkedRoute.en);
  }
  html = html.replace(/"item"\s*:\s*"https:\/\/luckyroll13\.com\/"/g, '"item":"https://luckyroll13.com/en/"');
  html = html.replace(/"inLanguage"\s*:\s*"he-IL"/g, '"inLanguage":"en-US"');

  const whatsappMessage = encodeURIComponent(pageTranslations.whatsapp[route.key] || 'Hi Lucky Roll13, I would like more information.').replace(/'/g, '%27');
  html = html.replace(/href="https:\/\/wa\.me\/972546420206\?text=[^"]*"/g, `href="https://wa.me/972546420206?text=${whatsappMessage}"`);

  return html;
}

for (const route of routes) {
  const sourcePath = path.join(root, route.file);
  const original = await readFile(sourcePath, 'utf8');

  let hebrew = replaceHeader(original, route, 'he');
  hebrew = addLanguageSeo(hebrew, route, 'he');
  await writeFile(sourcePath, hebrew);

  let english = translateEnglish(original, route);
  english = replaceHeader(english, route, 'en');
  english = addLanguageSeo(english, route, 'en');

  const destination = path.join(root, route.en.replace(/^\//, ''), 'index.html');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, english);
}

console.log(`Built ${routes.length} Hebrew/English route pairs with asset version ${assetVersion}.`);
