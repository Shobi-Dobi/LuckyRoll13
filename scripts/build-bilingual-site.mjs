import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonTranslations, pageTranslations } from './english-translations.mjs';
import { businessSchema } from './locations-schedule-data.mjs';
import { renderGeneratedPage, renderSharedFooter } from './location-pages.mjs';
import { pageMetadataOverrides, socialImageByRoute } from './seo-metadata.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const productionOrigin = 'https://luckyroll13.com';
const styleAssetVersion = '20261024-2';
const scriptAssetVersion = '20261026-1';
const eventAssetVersion = '20260928-1';

const serviceGuideRoutes = new Set(['boxing', 'women-boxing', 'bjj', 'kids', 'mma', 'adults']);

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
  { key: 'goshen', he: '/goshen-kiryat-motzkin/', en: '/en/goshen-kiryat-motzkin/', file: 'goshen-kiryat-motzkin/index.html', generated: true },
  { key: 'schedule', he: '/schedule/', en: '/en/schedule/', file: 'schedule/index.html', generated: true },
  { key: 'contact', he: '/contact/', en: '/en/contact/', file: 'contact/index.html' },
  { key: 'accessibility', he: '/accessibility/', en: '/en/accessibility/', file: 'accessibility/index.html' },
  { key: 'guide', he: '/guide/', en: '/en/guide/', file: 'guide/index.html', staticBilingual: true }
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
  ['/goshen-kiryat-motzkin/', 'סניף גושן', 'Goshen Location'],
  ['/schedule/', 'מערכת שעות', 'Schedule'],
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
      <img class="logo" src="/assets/images/luckyroll13-header-logo-1200.webp" alt="Lucky Roll13 - Boxing &amp; Jiu-Jitsu" width="1200" height="292">
    </a>
    <div class="header-tools">
      <nav class="language-switcher" aria-label="${languageLabel}">
        <a href="${route.he}" hreflang="he" lang="he"${heCurrent}>עברית</a>
        <span class="language-switcher-separator" aria-hidden="true">|</span>
        <a href="${route.en}" hreflang="en" lang="en"${enCurrent}>English</a>
      </nav>
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

function replaceFooter(html, route, language) {
  const footerPattern = /<footer\b[^>]*class=["'][^"']*\bfooter\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i;
  if (!footerPattern.test(html)) throw new Error(`Missing shared footer in ${route.file}`);
  return html.replace(footerPattern, renderSharedFooter(language));
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function metaTagPattern(attribute, key) {
  return new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapeRegularExpression(key)}["'])[^>]*>`, 'i');
}

function upsertMeta(html, attribute, key, content, anchorAttribute = attribute, anchorKey = key) {
  const pattern = metaTagPattern(attribute, key);
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}">`;
  if (pattern.test(html)) return html.replace(pattern, tag);

  const anchorPattern = metaTagPattern(anchorAttribute, anchorKey);
  if (!anchorPattern.test(html)) throw new Error(`Missing ${anchorKey} metadata anchor`);
  return html.replace(anchorPattern, (anchor) => `${anchor}\n  ${tag}`);
}

function applyPageMetadata(html, route, language) {
  const metadata = pageMetadataOverrides[route.key]?.[language];
  if (!metadata) return html;

  if (metadata.title) {
    if (!/<title>[\s\S]*?<\/title>/i.test(html)) throw new Error(`Missing title in ${route.file}`);
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`);
    html = upsertMeta(html, 'property', 'og:title', metadata.title);
    html = upsertMeta(html, 'name', 'twitter:title', metadata.title);
  }

  if (metadata.description) {
    html = upsertMeta(html, 'name', 'description', metadata.description);
    html = upsertMeta(html, 'property', 'og:description', metadata.description);
    html = upsertMeta(html, 'name', 'twitter:description', metadata.description);
  }

  return html.replace(
    /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (fullMatch, openingTag, rawJson, closingTag) => {
      let data;
      try {
        data = JSON.parse(rawJson.replace(/&amp;/g, '&'));
      } catch (error) {
        throw new Error(`Invalid JSON-LD in ${route.file}: ${error.message}`);
      }

      let changed = false;
      const visit = (value) => {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) {
          value.forEach(visit);
          return;
        }

        const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
        if (types.includes('WebPage')) {
          if (metadata.title) value.name = metadata.title;
          if (metadata.description) value.description = metadata.description;
          changed = true;
        }
        Object.values(value).forEach(visit);
      };
      visit(data);

      return changed
        ? `${openingTag}\n${JSON.stringify(data, null, 2)}\n${closingTag}`
        : fullMatch;
    }
  );
}

function applySocialImageMetadata(html, route, language) {
  const socialImage = socialImageByRoute[route.key];
  if (!socialImage) throw new Error(`Missing social image configuration for ${route.key}`);

  html = upsertMeta(html, 'property', 'og:image', socialImage.url);
  html = upsertMeta(html, 'property', 'og:image:type', socialImage.type, 'property', 'og:image');
  html = upsertMeta(html, 'property', 'og:image:width', String(socialImage.width), 'property', 'og:image');
  html = upsertMeta(html, 'property', 'og:image:height', String(socialImage.height), 'property', 'og:image');
  html = upsertMeta(html, 'property', 'og:image:alt', socialImage.alt[language], 'property', 'og:image');
  html = upsertMeta(html, 'name', 'twitter:image', socialImage.url);
  html = upsertMeta(html, 'name', 'twitter:image:alt', socialImage.alt[language], 'name', 'twitter:image');
  return html;
}

function normalizeBusinessStructuredData(html, language, route) {
  return html.replace(
    /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (fullMatch, openingTag, rawJson, closingTag) => {
      let data;
      try {
        data = JSON.parse(rawJson.replace(/&amp;/g, '&'));
      } catch (error) {
        throw new Error(`Invalid JSON-LD in ${route.file}: ${error.message}`);
      }

      const normalizedBusiness = businessSchema(language);
      let changed = false;
      const visit = (value) => {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) {
          value.forEach(visit);
          return;
        }

        const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
        if (value['@id'] === normalizedBusiness['@id'] && types.includes('SportsActivityLocation')) {
          value.name = normalizedBusiness.name;
          value.alternateName = normalizedBusiness.alternateName;
          value.url = normalizedBusiness.url;
          value.telephone = normalizedBusiness.telephone;
          value.logo = normalizedBusiness.logo;
          value.image = normalizedBusiness.image;
          value.address = normalizedBusiness.address;
          value.containedInPlace = normalizedBusiness.containedInPlace;
          value.areaServed = normalizedBusiness.areaServed;
          value.sameAs = normalizedBusiness.sameAs;
          value.hasMap = normalizedBusiness.hasMap;
          changed = true;
        }

        Object.values(value).forEach(visit);
      };
      visit(data);

      return changed
        ? `${openingTag}\n${JSON.stringify(data, null, 2)}\n${closingTag}`
        : fullMatch;
    }
  );
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

  html = html.replace(/\/assets\/style\.css(?:\?v=[^"']*)?/g, `/assets/style.css?v=${styleAssetVersion}`);
  html = html.replace(/\/assets\/site\.js(?:\?v=[^"']*)?/g, `/assets/site.js?v=${scriptAssetVersion}`);
  html = html.replace(/\/assets\/events\.css(?:\?v=[^"']*)?/g, `/assets/events.css?v=${eventAssetVersion}`);
  html = html.replace(/\/assets\/events\.js(?:\?v=[^"']*)?/g, `/assets/events.js?v=${eventAssetVersion}`);
  html = html.replace(/\/assets\/tracking\.js(?:\?v=[^"']*)?/g, `/assets/tracking.js?v=${scriptAssetVersion}`);
  html = html.replace(
    /<a\b(?![^>]*\bdata-trial-cta\b)([^>]*)>(\s*[^<]*(?:אימון ניסיון|trial class)[^<]*\s*)<\/a>/gi,
    '<a data-trial-cta$1>$2</a>'
  );
  html = html.replace(
    /<a\b(?![^>]*\bdata-trial-cta\b)([^>]*\bhref=["']#lead-form["'][^>]*)>/gi,
    '<a data-trial-cta$1>'
  );
  html = applyPageMetadata(html, route, language);
  html = applySocialImageMetadata(html, route, language);
  html = html.replace(/^[ \t]+$/gm, '');

  return html;
}

function addServiceGuideLink(html, route, language) {
  if (!serviceGuideRoutes.has(route.key)) return html;

  const existingBlock = /\s*<section\b[^>]*\bdata-contextual-guide(?:=["'][^"']*["'])?[^>]*>[\s\S]*?<\/section>\s*/gi;
  html = html.replace(existingBlock, '\n');

  const english = language === 'en';
  const href = english ? '/en/guide/' : '/guide/';
  const copy = english
    ? `Not sure which class is right for you? <a href="${href}">Read our martial arts selection guide</a> and compare the programs by age, goal, and training style.`
    : `לא בטוחים איזה אימון מתאים לכם? <a href="${href}">קראו את המדריך לבחירת אומנות לחימה</a> והשוו בין המסלולים לפי גיל, מטרה וסגנון האימון.`;
  const block = `<section class="section" data-contextual-guide><div class="wrap content"><p>${copy}</p></div></section>`;

  if (!/<\/main>/i.test(html)) throw new Error(`Missing main element in ${route.file}`);
  return html.replace(/<\/main>/i, `${block}\n</main>`);
}

function translateEnglish(html, route) {
  const translations = Object.entries({ ...commonTranslations, ...(pageTranslations[route.key] || {}) })
    .sort(([left], [right]) => right.length - left.length);

  for (const [hebrew, english] of translations) html = html.split(hebrew).join(english);
  html = html.replace(/<span aria-hidden="true">←<\/span>/g, '<span aria-hidden="true">→</span>');

  html = html.replace(/href=(["'])\/(boxing|women-boxing|bjj|kids|mma|adults|about|collaborations|events|javier-zaruski-seminar|kiryat-motzkin|goshen-kiryat-motzkin|schedule|contact|accessibility|guide)\//g, 'href=$1/en/$2/');
  html = html.replace(/href=(["'])\/\1/g, 'href=$1/en/$1');
  html = html.replace(/action=(["'])\/thank-you\.html\1/g, 'action=$1/en/thank-you/$1');
  html = html.replace(/name=(["'])language\1\s+value=(["'])he\2/g, 'name=$1language$1 value=$2en$2');

  const pageUrl = productionOrigin + route.en;

  if (route.he === '/') {
    html = html.replace(/("@type"\s*:\s*"WebPage"[\s\S]*?"@id"\s*:\s*)"https:\/\/luckyroll13\.com\/#webpage"/, `$1"${productionOrigin}/en/#webpage"`);
    html = html.replace(/("@type"\s*:\s*"WebPage"[\s\S]*?"url"\s*:\s*)"https:\/\/luckyroll13\.com\/"/, `$1"${pageUrl}"`);
  } else {
    html = html.replace(new RegExp(`${productionOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${route.he.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), pageUrl);
  }
  for (const linkedRoute of routes.filter((candidate) => candidate.he !== '/')) {
    html = html.split(productionOrigin + linkedRoute.he).join(productionOrigin + linkedRoute.en);
  }
  html = html.replace(/"item"\s*:\s*"https:\/\/luckyroll13\.com\/"/g, '"item":"https://luckyroll13.com/en/"');
  html = html.replace(/"inLanguage"\s*:\s*"he-IL"/g, '"inLanguage":"en-US"');

  const whatsappMessage = encodeURIComponent(pageTranslations.whatsapp[route.key] || 'Hi Lucky Roll13, I would like more information.').replace(/'/g, '%27');
  html = html.replace(/href="https:\/\/wa\.me\/972546420206\?text=[^"]*"/g, `href="https://wa.me/972546420206?text=${whatsappMessage}"`);

  html = html.replace(
    /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (_, openingTag, json, closingTag) => `${openingTag}${json.replace(/&amp;/g, '&')}${closingTag}`
  );

  return html;
}

for (const route of routes) {
  const sourcePath = path.join(root, route.file);
  const destination = path.join(root, route.en.replace(/^\//, ''), 'index.html');

  if (route.generated) {
    const pageOptions = {
      assetVersions: {
        style: styleAssetVersion,
        script: scriptAssetVersion
      }
    };
    let hebrew = renderGeneratedPage(route.key, 'he', {
      ...pageOptions,
      header: languageHeader(route, 'he'),
      footer: renderSharedFooter('he')
    });
    hebrew = addLanguageSeo(hebrew, route, 'he');
    hebrew = normalizeBusinessStructuredData(hebrew, 'he', route);

    let english = renderGeneratedPage(route.key, 'en', {
      ...pageOptions,
      header: languageHeader(route, 'en'),
      footer: renderSharedFooter('en')
    });
    english = addLanguageSeo(english, route, 'en');
    english = normalizeBusinessStructuredData(english, 'en', route);

    await mkdir(path.dirname(sourcePath), { recursive: true });
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(sourcePath, hebrew);
    await writeFile(destination, english);
    continue;
  }

  if (route.staticBilingual) {
    const hebrewOriginal = await readFile(sourcePath, 'utf8');
    let hebrew = replaceHeader(hebrewOriginal, route, 'he');
    hebrew = replaceFooter(hebrew, route, 'he');
    hebrew = addLanguageSeo(hebrew, route, 'he');
    hebrew = normalizeBusinessStructuredData(hebrew, 'he', route);
    await writeFile(sourcePath, hebrew);

    const englishOriginal = await readFile(destination, 'utf8');
    let english = replaceHeader(englishOriginal, route, 'en');
    english = replaceFooter(english, route, 'en');
    english = addLanguageSeo(english, route, 'en');
    english = normalizeBusinessStructuredData(english, 'en', route);
    await writeFile(destination, english);
    continue;
  }

  const original = await readFile(sourcePath, 'utf8');

  let hebrew = replaceHeader(original, route, 'he');
  hebrew = replaceFooter(hebrew, route, 'he');
  hebrew = addServiceGuideLink(hebrew, route, 'he');
  hebrew = addLanguageSeo(hebrew, route, 'he');
  hebrew = normalizeBusinessStructuredData(hebrew, 'he', route);
  await writeFile(sourcePath, hebrew);

  let english = translateEnglish(original, route);
  english = replaceHeader(english, route, 'en');
  english = replaceFooter(english, route, 'en');
  english = addServiceGuideLink(english, route, 'en');
  english = addLanguageSeo(english, route, 'en');
  english = normalizeBusinessStructuredData(english, 'en', route);

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, english);
}

console.log(`Built ${routes.length} Hebrew/English route pairs with style version ${styleAssetVersion} and script version ${scriptAssetVersion}.`);
