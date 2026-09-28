import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const failures = [];

const primaryPages = [
  ['index.html', 'https://luckyroll13.com/'],
  ['bjj/index.html', 'https://luckyroll13.com/bjj/'],
  ['boxing/index.html', 'https://luckyroll13.com/boxing/'],
  ['women-boxing/index.html', 'https://luckyroll13.com/women-boxing/'],
  ['kids/index.html', 'https://luckyroll13.com/kids/'],
  ['mma/index.html', 'https://luckyroll13.com/mma/'],
  ['adults/index.html', 'https://luckyroll13.com/adults/'],
  ['about/index.html', 'https://luckyroll13.com/about/'],
  ['collaborations/index.html', 'https://luckyroll13.com/collaborations/'],
  ['contact/index.html', 'https://luckyroll13.com/contact/'],
  ['events/index.html', 'https://luckyroll13.com/events/'],
  ['kiryat-motzkin/index.html', 'https://luckyroll13.com/kiryat-motzkin/'],
  ['javier-zaruski-seminar/index.html', 'https://luckyroll13.com/javier-zaruski-seminar/'],
  ['accessibility/index.html', 'https://luckyroll13.com/accessibility/']
];

const englishPages = primaryPages.map(([file, url]) => {
  const englishFile = file === 'index.html' ? 'en/index.html' : `en/${file}`;
  const englishUrl = url === 'https://luckyroll13.com/'
    ? 'https://luckyroll13.com/en/'
    : url.replace('https://luckyroll13.com/', 'https://luckyroll13.com/en/');
  return [englishFile, englishUrl];
});

const allIndexablePages = [...primaryPages, ...englishPages];

function fail(message) {
  failures.push(message);
}

function parseAttributes(tag) {
  const attributes = {};
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;

  while ((match = pattern.exec(tag))) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? '';
  }

  return attributes;
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
}

function meta(html, key, value) {
  return tags(html, 'meta')
    .map(parseAttributes)
    .find((attributes) => attributes[key] === value)?.content;
}

function canonical(html) {
  return tags(html, 'link')
    .map(parseAttributes)
    .find((attributes) => attributes.rel === 'canonical')?.href;
}

function alternate(html, language) {
  return tags(html, 'link')
    .map(parseAttributes)
    .find((attributes) => attributes.rel === 'alternate' && attributes.hreflang === language)?.href;
}

function jsonLd(html, file) {
  const blocks = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (error) {
      fail(`${file}: invalid JSON-LD (${error.message})`);
    }
  }

  return blocks;
}

function flattenSchemas(blocks) {
  return blocks.flatMap((block) => Array.isArray(block['@graph']) ? block['@graph'] : [block]);
}

function localTarget(href) {
  const path = href.split(/[?#]/)[0];
  if (!path || path === '/') return resolve(root, 'index.html');
  if (path.endsWith('/')) return resolve(root, path.slice(1), 'index.html');
  return resolve(root, path.slice(1));
}

const titles = new Map();
const descriptions = new Map();
const googleMapsBusinessUrl = 'https://maps.google.com/?cid=8832126799717426719';

for (const [file, expectedCanonical] of allIndexablePages) {
  const fullPath = resolve(root, file);
  if (!existsSync(fullPath)) {
    fail(`${file}: missing primary page`);
    continue;
  }

  const html = readFileSync(fullPath, 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim();
  const description = meta(html, 'name', 'description');
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const robots = meta(html, 'name', 'robots');
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

  const isEnglish = file.startsWith('en/');
  const expectedLanguage = isEnglish ? 'en' : 'he';
  const expectedDirection = isEnglish ? 'ltr' : 'rtl';
  const hebrewUrl = isEnglish ? expectedCanonical.replace('/en/', '/') : expectedCanonical;
  const englishUrl = isEnglish
    ? expectedCanonical
    : expectedCanonical === 'https://luckyroll13.com/'
      ? 'https://luckyroll13.com/en/'
      : expectedCanonical.replace('https://luckyroll13.com/', 'https://luckyroll13.com/en/');

  if (!new RegExp(`<html\\b[^>]*lang=["']${expectedLanguage}["'][^>]*dir=["']${expectedDirection}["']|<html\\b[^>]*dir=["']${expectedDirection}["'][^>]*lang=["']${expectedLanguage}["']`, 'i').test(html)) fail(`${file}: missing ${expectedLanguage}/${expectedDirection} document attributes`);
  if (!title) fail(`${file}: missing title`);
  if (title && titles.has(title)) fail(`${file}: duplicate title with ${titles.get(title)}`);
  if (title) titles.set(title, file);
  if (!description) fail(`${file}: missing meta description`);
  if (description && descriptions.has(description)) fail(`${file}: duplicate meta description with ${descriptions.get(description)}`);
  if (description) descriptions.set(description, file);
  if (canonical(html) !== expectedCanonical) fail(`${file}: canonical mismatch`);
  if (alternate(html, 'he') !== hebrewUrl) fail(`${file}: Hebrew hreflang mismatch`);
  if (alternate(html, 'en') !== englishUrl) fail(`${file}: English hreflang mismatch`);
  if (alternate(html, 'x-default') !== hebrewUrl) fail(`${file}: x-default hreflang mismatch`);
  if (!robots || !robots.includes('index') || robots.includes('noindex')) fail(`${file}: invalid robots directive`);
  if (h1Count !== 1) fail(`${file}: expected one H1, found ${h1Count}`);
  if (duplicateIds.length) fail(`${file}: duplicate IDs: ${duplicateIds.join(', ')}`);
  const eventsPath = isEnglish ? '/en/events/' : '/events/';
  const eventsLabel = isEnglish ? 'Seminars and Events' : 'סמינרים ואירועים';
  if (!new RegExp(`href=["']${eventsPath.replaceAll('/', '\\/')}["'][^>]*>\\s*${eventsLabel}\\s*<\\/a>`, 'i').test(html)) fail(`${file}: missing seminars and events navigation tab`);
  if ((html.match(/class=["'][^"']*menu-toggle[^"']*["']/gi) || []).length !== 1) fail(`${file}: expected one hamburger toggle`);
  if (/>\s*תפריט\s*</.test(html)) fail(`${file}: obsolete visible menu text remains`);
  if (!/<button\b[^>]*class=["'][^"']*menu-toggle[^"']*["'][^>]*type=["']button["'][^>]*aria-expanded=["']false["'][^>]*aria-controls=["']primary-navigation["'][^>]*>[\s\S]*?<svg\b[^>]*aria-hidden=["']true["']/i.test(html)) fail(`${file}: invalid accessible hamburger button`);
  if (!html.includes('class="menu-close"')) fail(`${file}: missing explicit menu close control`);
  if (!html.includes('class="language-switcher"')) fail(`${file}: missing visible language switcher`);
  if (!html.includes(`href="${new URL(hebrewUrl).pathname}"`) || !html.includes(`href="${new URL(englishUrl).pathname}"`)) fail(`${file}: language switcher does not link the translated pair`);
  const navigationMarkup = html.match(/<nav\b[^>]*id=["']primary-navigation["'][^>]*>[\s\S]*?<\/nav>/i)?.[0] || '';
  for (const path of ['/', '/bjj/', '/boxing/', '/women-boxing/', '/kids/', '/mma/', '/adults/', '/about/', '/collaborations/', '/events/', '/kiryat-motzkin/', '/contact/']) {
    const expectedPath = isEnglish ? (path === '/' ? '/en/' : `/en${path}`) : path;
    if (!navigationMarkup.includes(`href="${expectedPath}"`)) fail(`${file}: navigation is missing ${expectedPath}`);
  }
  if (!html.includes(`/assets/style.css?v=20260923-1`) || !html.includes(`/assets/site.js?v=20260923-1`)) fail(`${file}: missing current shared asset cache version`);
  if (!html.includes(`/assets/tracking.js?v=20260923-1`)) fail(`${file}: missing current tracking asset cache version`);
  if (isEnglish && html.replace('>עברית<', '><').match(/[\u0590-\u05ff]/)) fail(`${file}: untranslated Hebrew text remains`);
  if (isEnglish && /translate\.google|googtrans|google\.translate/i.test(html)) fail(`${file}: runtime translation widget detected`);
  if (html.includes('https://luckyroll13.com/en/assets/')) fail(`${file}: production asset URL was incorrectly localized under /en/`);

  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!meta(html, 'property', property)) fail(`${file}: missing ${property}`);
  }

  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!meta(html, 'name', name)) fail(`${file}: missing ${name}`);
  }

  const schemas = jsonLd(html, file);
  if (!schemas.length) fail(`${file}: missing JSON-LD`);

  const localBusiness = flattenSchemas(schemas).find((schema) => schema['@type'] === 'SportsActivityLocation');
  if (localBusiness) {
    if (!Array.isArray(localBusiness.sameAs) || !localBusiness.sameAs.includes(googleMapsBusinessUrl)) fail(`${file}: LocalBusiness does not reference the Google Business Profile`);
    if (localBusiness.hasMap !== googleMapsBusinessUrl) fail(`${file}: LocalBusiness hasMap is not the exact Google Business Profile`);
  }

  if (html.includes('https://www.google.com/maps/search/')) fail(`${file}: still uses a generic Google Maps address search`);

  const internalLinks = [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of internalLinks) {
    if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/.netlify/')) continue;
    if (!existsSync(localTarget(href))) fail(`${file}: broken internal link ${href}`);
  }

  const localAssets = [...html.matchAll(/\b(?:src|href)=["'](\/assets\/[^"'?#]+)["']/gi)].map((match) => match[1]);
  const srcsetAssets = [...html.matchAll(/\bsrcset=["']([^"']+)["']/gi)]
    .flatMap((match) => match[1].split(',').map((candidate) => candidate.trim().split(/\s+/)[0]))
    .filter((asset) => asset.startsWith('/assets/'));
  for (const asset of [...localAssets, ...srcsetAssets]) {
    if (!existsSync(resolve(root, asset.slice(1)))) fail(`${file}: missing asset ${asset}`);
  }

  for (const imageTag of tags(html, 'img')) {
    const attributes = parseAttributes(imageTag);
    if (!Object.hasOwn(attributes, 'alt')) fail(`${file}: image is missing alt text (${attributes.src || 'unknown source'})`);
    if (!attributes.width || !attributes.height) fail(`${file}: image is missing width/height (${attributes.src || 'unknown source'})`);
  }
}

const homeHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
const homeSchemas = flattenSchemas(jsonLd(homeHtml, 'index.html'));
const business = homeSchemas.find((schema) => schema['@type'] === 'SportsActivityLocation');
const website = homeSchemas.find((schema) => schema['@type'] === 'WebSite');
const founder = homeSchemas.find((schema) => schema['@type'] === 'Person' && schema['@id'] === 'https://luckyroll13.com/#shabi-shilon');

if (business?.['@id'] !== 'https://luckyroll13.com/#business') fail('index.html: inconsistent business @id');
if (business?.telephone !== '+972546420206') fail('index.html: inconsistent business telephone');
if (business?.address?.streetAddress !== 'מנחם בגין 26') fail('index.html: inconsistent business address');
if (website?.publisher?.['@id'] !== 'https://luckyroll13.com/#business') fail('index.html: WebSite publisher does not reference business');
if (business?.founder?.['@id'] !== 'https://luckyroll13.com/#shabi-shilon') fail('index.html: business does not reference Shabi Shilon as founder');
if (founder?.name !== 'שבי שילון' || founder?.worksFor?.['@id'] !== 'https://luckyroll13.com/#business') fail('index.html: Shabi Shilon Person entity is incomplete');
if (!homeHtml.includes('href="/about/"><strong>שבי שילון</strong>')) fail('index.html: visible founder identity is missing');
if (homeHtml.includes('data-home-event-promo')) fail('index.html: completed seminar recap must not use the temporary promotion hook');
if (!homeHtml.includes('aria-label="סיכום סמינר Javier Zaruski בישראל"') || !homeHtml.includes('>לסיכום ולתמונות</a>')) fail('index.html: missing completed seminar recap banner');
if (!homeHtml.includes('href="/kiryat-motzkin/"')) fail('index.html: missing Kiryat Motzkin link');

const englishHomeHtml = readFileSync(resolve(root, 'en/index.html'), 'utf8');
const englishHomeSchemas = flattenSchemas(jsonLd(englishHomeHtml, 'en/index.html'));
const englishBusiness = englishHomeSchemas.find((schema) => schema['@type'] === 'SportsActivityLocation');
const englishWebsite = englishHomeSchemas.find((schema) => schema['@type'] === 'WebSite');
const englishWebPage = englishHomeSchemas.find((schema) => schema['@type'] === 'WebPage');
if (englishBusiness?.['@id'] !== 'https://luckyroll13.com/#business') fail('en/index.html: English page changed the stable business identity');
if (englishWebsite?.['@id'] !== 'https://luckyroll13.com/#website') fail('en/index.html: English page changed the stable website identity');
if (englishWebPage?.['@id'] !== 'https://luckyroll13.com/en/#webpage' || englishWebPage?.url !== 'https://luckyroll13.com/en/') fail('en/index.html: English WebPage identity is not localized');
if (englishWebPage?.isPartOf?.['@id'] !== 'https://luckyroll13.com/#website' || englishWebPage?.about?.['@id'] !== 'https://luckyroll13.com/#business') fail('en/index.html: English WebPage does not reference the stable site and business identities');
if (meta(englishHomeHtml, 'property', 'og:image') !== 'https://luckyroll13.com/assets/images/hero.webp') fail('en/index.html: English social image URL is invalid');
const englishFounder = englishHomeSchemas.find((schema) => schema['@type'] === 'Person' && schema['@id'] === 'https://luckyroll13.com/#shabi-shilon');
if (englishFounder?.name !== 'Shabi Shilon' || englishBusiness?.founder?.['@id'] !== 'https://luckyroll13.com/#shabi-shilon') fail('en/index.html: English founder entity is incomplete');

const aboutHtml = readFileSync(resolve(root, 'about/index.html'), 'utf8');
const aboutSchemas = flattenSchemas(jsonLd(aboutHtml, 'about/index.html'));
const aboutFounder = aboutSchemas.find((schema) => schema['@type'] === 'Person' && schema['@id'] === 'https://luckyroll13.com/#shabi-shilon');
if (!aboutFounder || aboutFounder.subjectOf?.length !== 2) fail('about/index.html: founder entity is missing verified competition references');
if (!aboutHtml.includes('ADCC Amateur World Championship') || !aboutHtml.includes('smoothcomp.com/en/event/29650')) fail('about/index.html: verified international competition record is missing');

const englishAboutHtml = readFileSync(resolve(root, 'en/about/index.html'), 'utf8');
const englishAboutSchemas = flattenSchemas(jsonLd(englishAboutHtml, 'en/about/index.html'));
const englishAboutFounder = englishAboutSchemas.find((schema) => schema['@type'] === 'Person' && schema['@id'] === 'https://luckyroll13.com/#shabi-shilon');
if (!englishAboutFounder || englishAboutFounder.name !== 'Shabi Shilon') fail('en/about/index.html: English founder entity is incomplete');

const localSearchChecks = [
  ['index.html', ['אומנויות לחימה בקריות ובנשר', 'אגרוף', 'ג׳יו־ג׳יטסו', 'MMA', 'קריית מוצקין', 'נשר']],
  ['boxing/index.html', ['אימוני אגרוף בקריות ובנשר']],
  ['bjj/index.html', ['ג׳יו־ג׳יטסו בקריות ובנשר']],
  ['kids/index.html', ['אומנויות לחימה לילדים בקריות ובנשר']],
  ['women-boxing/index.html', ['אגרוף לנשים בקריות', 'קריית מוצקין']],
  ['kiryat-motzkin/index.html', ['אומנויות לחימה בקריית מוצקין', 'קריית ביאליק', 'קריית ים', 'קריית אתא', 'קריית חיים']],
  ['en/index.html', ['Martial Arts in Krayot and Nesher', 'Boxing', 'Brazilian Jiu-Jitsu', 'MMA', 'Kiryat Motzkin', 'Nesher']],
  ['en/boxing/index.html', ['Boxing Training in Krayot and Nesher']],
  ['en/bjj/index.html', ['Brazilian Jiu-Jitsu in Krayot and Nesher']],
  ['en/kids/index.html', ['Martial Arts for Kids in Krayot and Nesher']],
  ['en/women-boxing/index.html', ["Women's Boxing in Krayot", 'Kiryat Motzkin']],
  ['en/kiryat-motzkin/index.html', ['Martial Arts in Kiryat Motzkin', 'Kiryat Bialik', 'Kiryat Yam', 'Kiryat Ata', 'Kiryat Haim']]
];
for (const [file, phrases] of localSearchChecks) {
  const pageHtml = readFileSync(resolve(root, file), 'utf8');
  for (const phrase of phrases) {
    if (!pageHtml.includes(phrase)) fail(`${file}: missing approved local-search phrase: ${phrase}`);
  }
}

const seminarHtml = readFileSync(resolve(root, 'javier-zaruski-seminar/index.html'), 'utf8');
const seminarSchemas = flattenSchemas(jsonLd(seminarHtml, 'javier-zaruski-seminar/index.html'));
const eventSchema = seminarSchemas.find((schema) => schema['@type'] === 'Event');
const payboxLinks = [...seminarHtml.matchAll(/href=["'](https:\/\/links\.payboxapp\.com\/[^"']+)["']/g)].map((match) => match[1]);

if (payboxLinks.length !== 0) fail(`seminar: completed event still exposes ${payboxLinks.length} PayBox CTA(s)`);
if (eventSchema?.['@id'] !== 'https://luckyroll13.com/javier-zaruski-seminar/#event') fail('seminar: invalid Event @id');
if (!Array.isArray(eventSchema?.performer?.award) || eventSchema.performer.award.length !== 5) fail('seminar: Event performer is missing Javier awards');
if (eventSchema?.startDate !== '2026-09-25T12:00:00+03:00') fail('seminar: invalid startDate');
if (eventSchema?.endDate !== '2026-09-25T15:00:00+03:00') fail('seminar: invalid endDate');
if (eventSchema?.organizer?.['@id'] !== 'https://luckyroll13.com/#business') fail('seminar: organizer does not reference business');
if (eventSchema?.eventStatus !== 'https://schema.org/EventScheduled') fail('seminar: completed-as-scheduled event must retain EventScheduled status');
if (Object.hasOwn(eventSchema || {}, 'offers')) fail('seminar: completed event must not expose an expired Offer');
if (!Array.isArray(eventSchema?.image) || eventSchema.image.length !== 4) fail('seminar: expected four Event schema images');
if (seminarHtml.includes('data-event-sales') || seminarHtml.includes('data-pricing')) fail('seminar: stale registration or pricing markup remains');
if (!seminarHtml.includes('<section class="section" data-event-history>')) fail('seminar: visible historical message is missing from server-rendered HTML');
if (!seminarHtml.includes('/assets/events.js?v=20260928-1') || !seminarHtml.includes('/assets/events.css?v=20260928-1')) fail('seminar: current event archive assets are not loaded');
if (!seminarHtml.includes('<li><a href="/events/">סמינרים ואירועים</a></li>')) fail('seminar: missing events breadcrumb');
if (meta(seminarHtml, 'property', 'og:image') !== 'https://luckyroll13.com/assets/images/javier-zaruski-jiu-jitsu-seminar-group-1280.webp') fail('seminar: recap group photo is not the social image');
const eventGallery = seminarHtml.match(/<div class="event-recap-gallery"[\s\S]*?<\/div>\s*<article class="event-video-card"/i)?.[0] || '';
if ((eventGallery.match(/<figure\b/gi) || []).length !== 7) fail('seminar: expected seven-image seminar recap gallery');
for (const imageTag of tags(eventGallery, 'img')) {
  const attributes = parseAttributes(imageTag);
  if (!attributes.alt || !attributes.width || !attributes.height) fail(`seminar: incomplete gallery image metadata (${attributes.src || 'unknown source'})`);
  if (attributes.loading !== 'lazy' || attributes.decoding !== 'async') fail(`seminar: gallery image is not deferred correctly (${attributes.src || 'unknown source'})`);
}
const recapAssets = [
  'javier-zaruski-jiu-jitsu-seminar-group-640.webp',
  'javier-zaruski-jiu-jitsu-seminar-group-1280.webp',
  'javier-zaruski-seminar-coaches-group-640.webp',
  'javier-zaruski-seminar-coaches-group-1280.webp',
  'lucky-roll13-javier-zaruski-gym-selfie-640.webp',
  'lucky-roll13-javier-zaruski-gym-selfie-1280.webp',
  'javier-zaruski-jiu-jitsu-technique-demo-480.webp',
  'javier-zaruski-jiu-jitsu-technique-demo-960.webp',
  'javier-zaruski-alliance-jiu-jitsu-seminar-480.webp',
  'javier-zaruski-alliance-jiu-jitsu-seminar-720.webp',
  'lucky-roll13-javier-zaruski-outdoor-selfie-480.webp',
  'lucky-roll13-javier-zaruski-outdoor-selfie-960.webp',
  'javier-zaruski-lucky-roll13-creek-portrait-480.webp',
  'javier-zaruski-lucky-roll13-creek-portrait-960.webp'
];
for (const filename of recapAssets) {
  if (!eventGallery.includes(filename)) fail(`seminar: responsive gallery does not reference ${filename}`);
  if (!existsSync(resolve(root, 'assets/images', filename))) fail(`seminar: missing recap asset ${filename}`);
}
const achievementSection = seminarHtml.match(/<section class="section achievements"[\s\S]*?<\/section>/i)?.[0] || '';
if ((achievementSection.match(/class="achievement-card"/g) || []).length !== 5) fail('seminar: expected five Javier achievement cards');
for (const achievement of ['IBJJF Adult Black Belt World Champion', 'ADCC Veteran', '7× ADCC Open Champion', '18× IBJJF International Open Champion', '4× No-Gi World Champion']) {
  if (!achievementSection.includes(achievement)) fail(`seminar: missing updated Javier achievement: ${achievement}`);
}
for (const staleAchievement of ['Double Gold Champion', '2024 &amp; 2026 Competitor']) {
  if (achievementSection.includes(staleAchievement)) fail(`seminar: stale Javier achievement remains: ${staleAchievement}`);
}
if (!seminarHtml.includes('https://www.youtube-nocookie.com/embed/JFVUv_njAX8?rel=0')) fail('seminar: missing privacy-enhanced YouTube embed');
if (!seminarHtml.includes('href="https://www.youtube.com/watch?v=JFVUv_njAX8"')) fail('seminar: missing original YouTube link');

const tracking = readFileSync(resolve(root, 'assets/tracking.js'), 'utf8');
const events = readFileSync(resolve(root, 'assets/events.js'), 'utf8');

function simulateSeminarExperience(now, search = '?utm_source=instagram&utm_medium=paid_social&utm_campaign=javier_zaruski_north_2026&utm_content=recap', language = 'he') {
  const gaEvents = [];
  const metaEvents = [];
  const handlers = {};
  const bodyClasses = new Set(['seminar-page']);
  const statusNode = {
    classList: { add: (name) => bodyClasses.add(`status:${name}`) },
    innerHTML: '<span aria-hidden="true"></span>הסמינר התקיים'
  };
  const historyNode = { hidden: true };
  const storage = new Map();
  const pageUrl = new URL(`https://luckyroll13.com/javier-zaruski-seminar/${search}`);

  const document = {
    documentElement: { lang: language },
    body: {
      classList: {
        contains: (name) => bodyClasses.has(name),
        add: (name) => bodyClasses.add(name)
      }
    },
    addEventListener: (type, handler) => { handlers[type] = handler; },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: (selector) => ({
      '[data-event-status]': [statusNode],
      '[data-event-history]': [historyNode]
    })[selector] || []
  };

  const window = {
    location: pageUrl,
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    gtag: (...args) => gaEvents.push(args),
    fbq: (...args) => metaEvents.push(args)
  };
  const TestDate = class extends Date { static now() { return now; } };

  runInNewContext(events, { window, document, URL, URLSearchParams, Date: TestDate, Number, Object, JSON });

  const click = (eventName, href) => handlers.click({
    target: {
      closest: (selector) => selector === 'a[data-seminar-track]'
        ? { href, getAttribute: () => eventName }
        : null
    }
  });

  return { bodyClasses, click, gaEvents, historyNode, metaEvents, statusNode };
}

for (const eventName of ['whatsapp_click', 'phone_click', 'maps_click', 'waze_click', 'trial_form_submit']) {
  if (!tracking.includes(eventName)) fail(`tracking: missing ${eventName}`);
}
if (!tracking.includes('__luckyRoll13TrackingSuppressedForQa') || !tracking.includes("qa_no_tracking") || !tracking.includes("window.location.hostname === 'localhost'")) fail('tracking: local-only QA suppression guard is missing');
for (const eventName of ['seminar_page_view', 'seminar_maps_click', 'seminar_video_click']) {
  if (!events.includes(eventName)) fail(`events tracking: missing ${eventName}`);
}
if (!events.includes('ViewContent')) fail('events tracking: missing Meta ViewContent');
for (const staleEvent of ['seminar_paybox_click', 'InitiateCheckout', 'EventCompleted']) {
  if (events.includes(staleEvent)) fail(`events: stale completed-event behavior remains (${staleEvent})`);
}
if (!events.includes("2026-09-25T15:00:00+03:00")) fail('events: missing automatic promotion cutoff');
const eventEnd = Date.parse('2026-09-25T15:00:00+03:00');
if (Date.parse('2026-09-25T14:59:59.999+03:00') >= eventEnd) fail('events: historical state starts before the approved cutoff');
if (Date.parse('2026-09-25T15:00:00+03:00') < eventEnd) fail('events: historical state does not start at the approved cutoff');

const atEventEnd = simulateSeminarExperience(eventEnd);
if (!atEventEnd.bodyClasses.has('event-is-past')) fail('events runtime: historical mode missing at exact event end');
if (atEventEnd.historyNode.hidden || !atEventEnd.statusNode.innerHTML.includes('הסמינר התקיים')) fail('events runtime: historical message missing after event end');
atEventEnd.click('seminar_video_click', 'https://www.youtube.com/watch?v=JFVUv_njAX8');
for (const eventName of ['seminar_page_view', 'seminar_video_click']) {
  if (!atEventEnd.gaEvents.some((entry) => entry[0] === 'event' && entry[1] === eventName && entry[2]?.utm_campaign === 'javier_zaruski_north_2026')) fail(`events runtime: GA4 ${eventName} attribution failed`);
}
if (!atEventEnd.metaEvents.some((entry) => entry[0] === 'track' && entry[1] === 'ViewContent')) fail('events runtime: Meta ViewContent attribution failed');
if (!events.includes("[data-event-card][data-event-end]")) fail('events: missing reusable event archive automation');
if (!events.includes("[data-seminar-promo]")) fail('events: missing long-term seminar promo archive mode');

const englishAtEventEnd = simulateSeminarExperience(eventEnd, '', 'en');
if (!englishAtEventEnd.statusNode.innerHTML.includes('Seminar completed')) fail('events runtime: English historical message failed');

const eventsHubHtml = readFileSync(resolve(root, 'events/index.html'), 'utf8');
if (!eventsHubHtml.includes('data-upcoming-list') || !eventsHubHtml.includes('data-past-list')) fail('events hub: missing upcoming/past collections');
if (!eventsHubHtml.includes('data-event-end="2026-09-25T15:00:00+03:00"')) fail('events hub: Javier card has no archive cutoff');
const upcomingMarkup = eventsHubHtml.match(/<div class="events-list" data-upcoming-list>([\s\S]*?)<\/div>/i)?.[1] || '';
const pastMarkup = eventsHubHtml.match(/<div class="events-list past-events-list" data-past-list>([\s\S]*?)<\/div>\s*<div class="past-empty"/i)?.[1] || '';
if (upcomingMarkup.includes('data-event-card')) fail('events hub: completed seminar remains in upcoming events');
if (!pastMarkup.includes('featured-event-card is-past-event') || !pastMarkup.includes('>לסיכום ולתמונות')) fail('events hub: static recap card is missing from past events');
if (!eventsHubHtml.includes('data-upcoming-empty><') || !eventsHubHtml.includes('data-past-empty hidden')) fail('events hub: static empty states are incorrect');
if (!eventsHubHtml.includes('/assets/events.js?v=20260928-1') || !eventsHubHtml.includes('/assets/events.css?v=20260928-1')) fail('events hub: current event archive assets are not loaded');
if (!eventsHubHtml.includes('מבחני דרגה')) fail('events hub: missing future grade-test scope');

const englishEventsHubHtml = readFileSync(resolve(root, 'en/events/index.html'), 'utf8');
if (!englishEventsHubHtml.includes('featured-event-card is-past-event') || !englishEventsHubHtml.includes('>View recap and photos')) fail('English events hub: static recap card is missing');
if (!englishEventsHubHtml.includes('data-upcoming-empty><') || !englishEventsHubHtml.includes('data-past-empty hidden')) fail('English events hub: static empty states are incorrect');

const notFoundHtml = readFileSync(resolve(root, '404.html'), 'utf8');
if (!/href=["']\/events\/["'][^>]*>\s*סמינרים ואירועים\s*<\/a>/i.test(notFoundHtml)) fail('404.html: missing seminars and events navigation tab');
if (!notFoundHtml.includes(googleMapsBusinessUrl)) fail('404.html: Google Maps link does not use the verified business profile');
if (!notFoundHtml.includes('www.waze.com/ul?q=') || !notFoundHtml.includes('navigate=yes')) fail('404.html: Waze link does not use the verified address query');

const localPageHtml = readFileSync(resolve(root, 'kiryat-motzkin/index.html'), 'utf8');
const localPageSchemas = flattenSchemas(jsonLd(localPageHtml, 'kiryat-motzkin/index.html'));
const localFaq = localPageSchemas.find((schema) => schema['@type'] === 'FAQPage');
if (!localFaq || !Array.isArray(localFaq.mainEntity) || localFaq.mainEntity.length !== 3) fail('kiryat-motzkin: missing matching local FAQ schema');
for (const phrase of ['אגרוף בקריית מוצקין', 'ג׳יו־ג׳יטסו BJJ בקריית מוצקין', 'אגרוף לנשים בקריית מוצקין', 'MMA לילדים ונוער']) {
  if (!localPageHtml.includes(phrase)) fail(`kiryat-motzkin: missing useful local service content: ${phrase}`);
}
if (!localPageHtml.includes('href="/women-boxing/"')) fail('kiryat-motzkin: missing women boxing service link');

const bjjHtml = readFileSync(resolve(root, 'bjj/index.html'), 'utf8');
const bjjGallery = bjjHtml.match(/<div class="bjj-gallery">([\s\S]*?)<\/div>/i)?.[1] || '';
if ((bjjGallery.match(/<img\b/gi) || []).length !== 21) fail('bjj: expected 21 gallery images');
for (let number = 13; number <= 21; number += 1) {
  const filename = `bjj-gallery-${number}.webp`;
  if (!bjjGallery.includes(filename)) fail(`bjj: missing new gallery image ${filename}`);
  if (!existsSync(resolve(root, 'assets/images', filename))) fail(`bjj: missing gallery asset ${filename}`);
}

const womenBoxingHtml = readFileSync(resolve(root, 'women-boxing/index.html'), 'utf8');
const womenBoxingGallery = womenBoxingHtml.match(/<div class="women-gallery">([\s\S]*?)<\/div>/i)?.[1] || '';
if ((womenBoxingGallery.match(/<img\b/gi) || []).length !== 2) fail('women-boxing: expected two gallery images');
for (const filename of ['women-boxing-gallery-01.webp', 'women-boxing-gallery-02.webp']) {
  if (!womenBoxingGallery.includes(filename)) fail(`women-boxing: missing gallery image ${filename}`);
  if (!existsSync(resolve(root, 'assets/images', filename))) fail(`women-boxing: missing gallery asset ${filename}`);
}

const blogHtml = readFileSync(resolve(root, 'blog.html'), 'utf8');
if (!blogHtml.includes('<meta name="robots" content="noindex,follow">')) fail('blog: placeholder must remain noindex,follow');
if (!blogHtml.includes('href="/assets/logo.png"')) fail('blog: missing explicit favicon');
if (!blogHtml.includes('href="/accessibility/"')) fail('blog: missing accessibility statement link');

const thankYouHtml = readFileSync(resolve(root, 'thank-you.html'), 'utf8');
if (!meta(thankYouHtml, 'name', 'description')) fail('thank-you: missing meta description');
if (!thankYouHtml.includes('href="/assets/logo.png"')) fail('thank-you: missing explicit favicon');
const englishThankYouHtml = readFileSync(resolve(root, 'en/thank-you/index.html'), 'utf8');
if (!meta(englishThankYouHtml, 'name', 'description')) fail('English thank-you: missing meta description');
if (!englishThankYouHtml.includes('name="robots" content="noindex,follow"')) fail('English thank-you: must remain noindex,follow');
if (!englishThankYouHtml.includes('href="/en/"')) fail('English thank-you: return link does not stay in English');
for (const formPage of ['en/kids/index.html', 'en/women-boxing/index.html']) {
  if (!readFileSync(resolve(root, formPage), 'utf8').includes('action="/en/thank-you/"')) fail(`${formPage}: form does not use the English success page`);
}

const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
for (const [, url] of allIndexablePages) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail(`sitemap: missing ${url}`);
}
for (const [, url] of allIndexablePages) {
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`<url><loc>${escapedUrl}<\\/loc><lastmod>\\d{4}-\\d{2}-\\d{2}<\\/lastmod><\\/url>`).test(sitemap)) {
    fail(`sitemap: ${url} is missing a valid lastmod date`);
  }
}
if (sitemap.includes('/events/javier-zaruski/')) fail('sitemap: contains redirected seminar URL');
for (const url of [
  'https://luckyroll13.com/',
  'https://luckyroll13.com/bjj/',
  'https://luckyroll13.com/collaborations/',
  'https://luckyroll13.com/events/',
  'https://luckyroll13.com/javier-zaruski-seminar/',
  'https://luckyroll13.com/en/',
  'https://luckyroll13.com/en/bjj/',
  'https://luckyroll13.com/en/collaborations/',
  'https://luckyroll13.com/en/events/',
  'https://luckyroll13.com/en/javier-zaruski-seminar/'
]) {
  if (!sitemap.includes(`<loc>${url}</loc><lastmod>2026-09-28</lastmod>`)) fail(`sitemap: recap update date is missing for ${url}`);
}
if (!sitemap.includes('<loc>https://luckyroll13.com/women-boxing/</loc><lastmod>2026-09-20</lastmod>')) fail('sitemap: women boxing lastmod does not reflect the gallery update');
if (!sitemap.includes('<loc>https://luckyroll13.com/kiryat-motzkin/</loc><lastmod>2026-09-20</lastmod>')) fail('sitemap: Kiryat Motzkin lastmod does not reflect the local content update');

const siteScript = readFileSync(resolve(root, 'assets/site.js'), 'utf8');
const styles = readFileSync(resolve(root, 'assets/style.css'), 'utf8');
if (!siteScript.includes("isEnglish ? '/en/accessibility/' : '/accessibility/'")) fail('site navigation: localized accessibility statement link is not added to public footers');
if (!siteScript.includes('attributionKeys') || !siteScript.includes('utm_')) fail('site navigation: language switching does not preserve campaign attribution');
if (!siteScript.includes("event.key === 'Escape'") || !siteScript.includes('closeButton.addEventListener')) fail('site navigation: keyboard Escape or close control support is missing');
if (!/\.links\s*\{[^}]*display:\s*flex/i.test(styles)) fail('site navigation: no-JavaScript navigation fallback is not visible');
if (!/\.menu-toggle,\s*\.menu-close\s*\{[^}]*display:\s*none/i.test(styles)) fail('site navigation: progressive enhancement controls are visible without JavaScript');
if (!/html\.js-enabled\s+\.links\s*\{[^}]*display:\s*none/i.test(styles)) fail('site navigation: closed enhanced panel is not hidden');
if (!/html\.js-enabled\s+\.links\.is-open\s*\{[^}]*display:\s*flex/i.test(styles)) fail('site navigation: enhanced panel has no open state');

const robots = readFileSync(resolve(root, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://luckyroll13.com/sitemap.xml')) fail('robots.txt: missing sitemap reference');

for (const page of ['bjj/index.html', 'collaborations/index.html']) {
  const pageHtml = readFileSync(resolve(root, page), 'utf8');
  if (!pageHtml.includes('Javier Zaruski – Israel Seminar 🇮🇱')) fail(`${page}: missing approved seminar heading`);
  if (!pageHtml.includes('סמינר עבר · 25.9.2026')) fail(`${page}: past-event label is missing`);
  if (!pageHtml.includes('>לסיכום ולתמונות</a>')) fail(`${page}: recap CTA is missing`);
  if (!pageHtml.includes('href="/javier-zaruski-seminar/"')) fail(`${page}: missing seminar link`);
  if (!pageHtml.includes('data-preserve-utm') || !pageHtml.includes('data-seminar-promo')) fail(`${page}: seminar promotion does not preserve attribution or archive cleanly`);
  if (!pageHtml.includes('/assets/events.js?v=20260928-1')) fail(`${page}: current event-state script version is not loaded`);
}

const englishSeminarHtml = readFileSync(resolve(root, 'en/javier-zaruski-seminar/index.html'), 'utf8');
const englishPayboxLinks = [...englishSeminarHtml.matchAll(/href=["'](https:\/\/links\.payboxapp\.com\/[^"']+)["']/g)].map((match) => match[1]);
if (englishPayboxLinks.length !== 0) fail('English seminar: completed event still exposes PayBox');
const englishEventGallery = englishSeminarHtml.match(/<div class="event-recap-gallery"[\s\S]*?<\/div>\s*<article class="event-video-card"/i)?.[0] || '';
if ((englishEventGallery.match(/<figure\b/gi) || []).length !== 7) fail('English seminar: expected seven-image recap gallery');
if (!englishSeminarHtml.includes('<section class="section" data-event-history>') || !englishSeminarHtml.includes('Registration and payment details were removed')) fail('English seminar: visible archive state is missing');
if (!englishSeminarHtml.includes('IBJJF Adult Black Belt World Champion') || !englishSeminarHtml.includes('7× ADCC Open Champion')) fail('English seminar: approved achievements are missing');

if (failures.length) {
  console.error(`QA failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`QA passed: ${allIndexablePages.length} indexable pages, bilingual metadata, JSON-LD, links, event archive, responsive images, analytics, sitemap and robots.txt.`);
