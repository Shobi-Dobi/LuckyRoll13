import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { business as businessData, locations, scheduleLastUpdated } from './locations-schedule-data.mjs';

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
  ['goshen-kiryat-motzkin/index.html', 'https://luckyroll13.com/goshen-kiryat-motzkin/'],
  ['schedule/index.html', 'https://luckyroll13.com/schedule/'],
  ['javier-zaruski-seminar/index.html', 'https://luckyroll13.com/javier-zaruski-seminar/'],
  ['accessibility/index.html', 'https://luckyroll13.com/accessibility/'],
  ['guide/index.html', 'https://luckyroll13.com/guide/']
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

function imageTagsWithSource(html, source) {
  return tags(html, 'img').filter((tag) => parseAttributes(tag).src === source);
}

function picturesWithClass(html, className) {
  const pictures = [];
  const pattern = /<picture\b([^>]*)>([\s\S]*?)<\/picture>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const attributes = parseAttributes(`<picture${match[1]}>`);
    if ((attributes.class || '').split(/\s+/).includes(className)) {
      pictures.push({ attributes, inner: match[2] });
    }
  }

  return pictures;
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

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(schemaNodes)];
}

function localTarget(href) {
  const path = href.split(/[?#]/)[0];
  if (!path || path === '/') return resolve(root, 'index.html');
  if (path.endsWith('/')) return resolve(root, path.slice(1), 'index.html');
  return resolve(root, path.slice(1));
}

function plainText(fragment) {
  return fragment
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function inlineText(fragment) {
  return fragment
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function countOccurrences(value, phrase) {
  return value.split(phrase).length - 1;
}

function sourceTextFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceTextFiles(fullPath);
    return /\.(?:html|js|mjs|xml|md|txt)$/i.test(entry.name) ? [fullPath] : [];
  });
}

function visibleFaqPairs(html) {
  return [...html.matchAll(/<details\b[^>]*>[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/details>/gi)]
    .map((match) => [plainText(match[1]), plainText(match[2])]);
}

function namedForm(html, name) {
  return [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)]
    .map((match) => ({ attributes: parseAttributes(`<form${match[1]}>`), inner: match[2] }))
    .find((form) => form.attributes.name === name);
}

function daySessions(location, day) {
  return location.dayGroups.find((group) => group.days.includes(day))?.sessions || [];
}

const expectedKiryatAddress = {
  he: 'מנחם בגין 26, קריית מוצקין',
  en: '26 Menachem Begin St., Kiryat Motzkin'
};
const expectedGoshenAddress = {
  he: 'רחוב קק״ל 23א׳, קריית מוצקין — בתוך מתנ״ס גושן',
  en: '23A KKL St., Kiryat Motzkin — inside Matnas Goshen'
};
const tuesdayMma = daySessions(locations.kiryatMotzkin, 'tuesday').filter((session) => session.training.en === 'MMA');
const fridaySessions = daySessions(locations.kiryatMotzkin, 'friday');
const sundaySessions = daySessions(locations.kiryatMotzkin, 'sunday');
const wednesdaySessions = daySessions(locations.kiryatMotzkin, 'wednesday');
const goshenSessions = locations.goshenKiryatMotzkin.dayGroups.flatMap((group) => group.sessions);

if (businessData.name !== 'Lucky Roll13' || businessData.displayPhone !== '054-642-0206' || businessData.schemaPhone !== '+972546420206') fail('central data: business name or phone does not match the approved source of truth');
if (locations.kiryatMotzkin.address.he !== expectedKiryatAddress.he || locations.kiryatMotzkin.address.en !== expectedKiryatAddress.en) fail('central data: Kiryat Motzkin address does not match the approved source of truth');
if (locations.kiryatMotzkin.name.he !== 'נווה גנים, קריית מוצקין' || locations.kiryatMotzkin.name.en !== 'Neve Ganim, Kiryat Motzkin') fail('central data: Neve Ganim location name is missing');
if (locations.kiryatMotzkin.shortLabel.he !== 'נווה גנים' || locations.kiryatMotzkin.shortLabel.en !== 'Neve Ganim' || locations.kiryatMotzkin.scheduleAnchor !== 'schedule-neve-ganim') fail('central data: Neve Ganim label or schedule anchor is inconsistent');
if (!locations.kiryatMotzkin.containedInPlace?.name?.he?.includes('נווה גנים') || !locations.kiryatMotzkin.containedInPlace?.name?.en?.includes('Neve Ganim')) fail('central data: Neve Ganim containing neighborhood is missing');
if (businessData.logo !== 'https://luckyroll13.com/assets/images/luckyroll13-header-logo-1200.webp') fail('central data: current rectangular logo URL is inconsistent');
if (locations.goshenKiryatMotzkin.address.he !== expectedGoshenAddress.he || locations.goshenKiryatMotzkin.address.en !== expectedGoshenAddress.en) fail('central data: Goshen address does not match the approved source of truth');
if (scheduleLastUpdated.iso !== '2026-10-24') fail('central data: lastUpdated must reflect the approved Goshen schedule change');
if (tuesdayMma.length !== 1 || tuesdayMma[0].time !== '14:30–15:30' || tuesdayMma[0].audience.he !== 'גילאי 8–13') fail('central data: Tuesday MMA must remain 14:30–15:30 for ages 8–13');
if (locations.kiryatMotzkin.dayGroups.some((group) => group.days.includes('monday') && group.sessions.some((session) => session.training.en === 'MMA'))) fail('central data: MMA was incorrectly moved to Monday');
if (goshenSessions.length !== 3) fail('central data: Goshen must contain the three approved age-group sessions');
for (const [time, audience] of [['17:00–17:45', 'ילדים בגילאי 5–7'], ['17:45–18:30', 'ילדים בגילאי 8–13'], ['18:30–19:30', 'בוגרים']]) {
  if (!goshenSessions.some((session) => session.time === time && session.audience.he === audience && session.training.he === 'ג׳יו־ג׳יטסו' && session.training.en === 'Brazilian Jiu-Jitsu (BJJ)' && session.service === 'bjj')) fail(`central data: Goshen BJJ session ${time} for ${audience} is missing or inconsistent`);
}
if (locations.goshenKiryatMotzkin.dayGroups.some((group) => group.days.join(',') !== 'monday,thursday')) fail('central data: Goshen classes must be listed only on Monday and Thursday');
for (const [day, sessions] of [['sunday', sundaySessions], ['wednesday', wednesdaySessions]]) {
  if (!sessions.some((session) => session.time === '20:30–21:30' && session.training.he === 'ג׳יו־ג׳יטסו' && session.audience.he === 'נערים ובוגרים')) fail(`central data: ${day} BJJ 20:30–21:30 for teens and adults is missing`);
}
if (!fridaySessions.some((session) => session.time === '08:00–09:00' && session.training.he === 'אימון בוקר' && session.audience.he === '')) fail('central data: Friday 08:00–09:00 must remain generic Morning training');
if (!fridaySessions.some((session) => session.time === '09:00–10:00' && session.training.he === 'אגרוף' && session.audience.he === 'לנשים בלבד')) fail('central data: Friday women-only boxing 09:00–10:00 is missing');

const titles = new Map();
const descriptions = new Map();
const googleMapsBusinessUrl = 'https://maps.google.com/?cid=8832126799717426719';
const expectedBusinessAreas = {
  he: [
    ['City', 'קריית מוצקין'],
    ['City', 'קריית ביאליק'],
    ['City', 'קריית ים'],
    ['City', 'קריית אתא'],
    ['Place', 'קריית חיים'],
    ['Place', 'הקריות']
  ],
  en: [
    ['City', 'Kiryat Motzkin'],
    ['City', 'Kiryat Bialik'],
    ['City', 'Kiryat Yam'],
    ['City', 'Kiryat Ata'],
    ['Place', 'Kiryat Haim'],
    ['Place', 'Krayot']
  ]
};
const contextualLocationLinks = new Map([
  ['boxing/index.html', '/kiryat-motzkin/'],
  ['kids/index.html', '/kiryat-motzkin/'],
  ['mma/index.html', '/kiryat-motzkin/'],
  ['en/boxing/index.html', '/en/kiryat-motzkin/'],
  ['en/kids/index.html', '/en/kiryat-motzkin/'],
  ['en/mma/index.html', '/en/kiryat-motzkin/']
]);
const contextualGuideLinks = new Map([
  ['index.html', '/guide/'],
  ['bjj/index.html', '/guide/'],
  ['boxing/index.html', '/guide/'],
  ['women-boxing/index.html', '/guide/'],
  ['kids/index.html', '/guide/'],
  ['mma/index.html', '/guide/'],
  ['adults/index.html', '/guide/'],
  ['kiryat-motzkin/index.html', '/guide/'],
  ['en/index.html', '/en/guide/'],
  ['en/bjj/index.html', '/en/guide/'],
  ['en/boxing/index.html', '/en/guide/'],
  ['en/women-boxing/index.html', '/en/guide/'],
  ['en/kids/index.html', '/en/guide/'],
  ['en/mma/index.html', '/en/guide/'],
  ['en/adults/index.html', '/en/guide/'],
  ['en/kiryat-motzkin/index.html', '/en/guide/']
]);
const contextualScheduleLinks = new Map([
  ['index.html', '/schedule/'],
  ['bjj/index.html', '/schedule/'],
  ['boxing/index.html', '/schedule/'],
  ['women-boxing/index.html', '/schedule/'],
  ['kids/index.html', '/schedule/'],
  ['mma/index.html', '/schedule/'],
  ['kiryat-motzkin/index.html', '/schedule/'],
  ['goshen-kiryat-motzkin/index.html', '/schedule/'],
  ['contact/index.html', '/schedule/'],
  ['en/index.html', '/en/schedule/'],
  ['en/bjj/index.html', '/en/schedule/'],
  ['en/boxing/index.html', '/en/schedule/'],
  ['en/women-boxing/index.html', '/en/schedule/'],
  ['en/kids/index.html', '/en/schedule/'],
  ['en/mma/index.html', '/en/schedule/'],
  ['en/kiryat-motzkin/index.html', '/en/schedule/'],
  ['en/goshen-kiryat-motzkin/index.html', '/en/schedule/'],
  ['en/contact/index.html', '/en/schedule/']
]);
const contextualGoshenLinks = new Map([
  ['index.html', '/goshen-kiryat-motzkin/'],
  ['bjj/index.html', '/goshen-kiryat-motzkin/'],
  ['boxing/index.html', '/goshen-kiryat-motzkin/'],
  ['kids/index.html', '/goshen-kiryat-motzkin/'],
  ['en/index.html', '/en/goshen-kiryat-motzkin/'],
  ['en/bjj/index.html', '/en/goshen-kiryat-motzkin/'],
  ['en/boxing/index.html', '/en/goshen-kiryat-motzkin/'],
  ['en/kids/index.html', '/en/goshen-kiryat-motzkin/']
]);

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
  const headerLogo = imageTagsWithSource(html, '/assets/images/luckyroll13-header-logo-1200.webp')[0];
  const headerLogoAttributes = headerLogo ? parseAttributes(headerLogo) : {};

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
  if (!headerLogo || headerLogoAttributes.width !== '1200' || headerLogoAttributes.height !== '292') fail(`${file}: current 1200x292 header logo is missing`);
  if (html.includes('src="/assets/images/luckyroll13-header-logo-480.webp"')) fail(`${file}: previous header logo remains`);
  if (html.includes('src="/assets/images/luckyroll13-header-logo.webp"')) fail(`${file}: oversized 1431px header logo remains`);
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
  for (const path of ['/', '/bjj/', '/boxing/', '/women-boxing/', '/kids/', '/mma/', '/adults/', '/about/', '/collaborations/', '/events/', '/kiryat-motzkin/', '/goshen-kiryat-motzkin/', '/schedule/', '/contact/']) {
    const expectedPath = isEnglish ? (path === '/' ? '/en/' : `/en${path}`) : path;
    if (!navigationMarkup.includes(`href="${expectedPath}"`)) fail(`${file}: navigation is missing ${expectedPath}`);
  }
  if (!html.includes(`/assets/style.css?v=20261024-2`) || !html.includes(`/assets/site.js?v=20261021-2`)) fail(`${file}: missing current shared asset cache version`);
  if (!html.includes(`/assets/tracking.js?v=20261021-2`)) fail(`${file}: missing current tracking asset cache version`);
  if (!html.includes(businessData.displayPhone)) fail(`${file}: shared footer does not show the normalized phone number`);
  const telephoneLinks = [...html.matchAll(/href=["'](tel:[^"']+)["']/gi)].map((match) => match[1]);
  if (!telephoneLinks.length || telephoneLinks.some((href) => href !== `tel:${businessData.schemaPhone}`)) fail(`${file}: telephone links must use tel:${businessData.schemaPhone}`);
  if (/ההרשמה לשנת האימונים החדשה פתוחה|registration for the new training year is open/i.test(html)) fail(`${file}: stale training-year registration claim remains`);
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
  if (schemaNodes(schemas).some((schema) => Object.hasOwn(schema, 'openingHoursSpecification'))) fail(`${file}: class timetable must not be represented as business opening hours`);
  const typedSchemaIds = flattenSchemas(schemas)
    .filter((schema) => schema?.['@id'] && schema?.['@type'])
    .map((schema) => schema['@id']);
  const duplicateSchemaIds = [...new Set(typedSchemaIds.filter((id, index) => typedSchemaIds.indexOf(id) !== index))];
  if (duplicateSchemaIds.length) fail(`${file}: duplicate typed JSON-LD @id values: ${duplicateSchemaIds.join(', ')}`);

  for (const video of schemaNodes(schemas).filter((schema) => schema['@type'] === 'VideoObject')) {
    if (!video.name) fail(`${file}: VideoObject is missing name`);
    if (!video.description) fail(`${file}: VideoObject is missing description`);
    if (!video.thumbnailUrl || (Array.isArray(video.thumbnailUrl) && !video.thumbnailUrl.length)) fail(`${file}: VideoObject is missing thumbnailUrl`);
    if (!video.contentUrl && !video.embedUrl) fail(`${file}: VideoObject is missing contentUrl/embedUrl`);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(video.uploadDate || '') || Number.isNaN(Date.parse(video.uploadDate))) fail(`${file}: VideoObject has an invalid uploadDate or no timezone`);
    if (/youtube\.com\/watch/i.test(video.contentUrl || '')) fail(`${file}: VideoObject contentUrl points to a watch page instead of video bytes`);
  }

  const localBusiness = flattenSchemas(schemas).find((schema) => schema['@type'] === 'SportsActivityLocation');
  if (localBusiness) {
    const expectedSameAs = [businessData.facebook, businessData.instagram, businessData.googleMaps];
    if (!Array.isArray(localBusiness.sameAs) || expectedSameAs.some((url) => !localBusiness.sameAs.includes(url))) fail(`${file}: LocalBusiness sameAs is missing an approved profile`);
    if (localBusiness.sameAs?.some((url) => /easy\.co\.il|b144\.co\.il/i.test(url))) fail(`${file}: LocalBusiness references an unapproved conflicting directory`);
    if (localBusiness.hasMap !== googleMapsBusinessUrl) fail(`${file}: LocalBusiness hasMap is not the exact Google Business Profile`);
    if (localBusiness.telephone !== businessData.schemaPhone) fail(`${file}: LocalBusiness telephone is inconsistent`);
    const expectedStreet = isEnglish
      ? locations.kiryatMotzkin.address.streetAddress.en
      : locations.kiryatMotzkin.address.streetAddress.he;
    const expectedLocality = isEnglish
      ? locations.kiryatMotzkin.address.addressLocality.en
      : locations.kiryatMotzkin.address.addressLocality.he;
    if (localBusiness.address?.streetAddress !== expectedStreet || localBusiness.address?.addressLocality !== expectedLocality || localBusiness.address?.addressCountry !== 'IL') fail(`${file}: LocalBusiness address is inconsistent`);
    const actualAreas = Array.isArray(localBusiness.areaServed)
      ? localBusiness.areaServed.map((area) => [area['@type'], area.name])
      : [];
    const expectedAreas = expectedBusinessAreas[isEnglish ? 'en' : 'he'];
    if (JSON.stringify(actualAreas) !== JSON.stringify(expectedAreas)) fail(`${file}: LocalBusiness areaServed is inconsistent`);
  }

  const expectedContextualLocation = contextualLocationLinks.get(file);
  if (expectedContextualLocation) {
    const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
    if (!mainMarkup.includes(`href="${expectedContextualLocation}"`)) fail(`${file}: main content is missing a contextual Kiryat Motzkin link`);
  }

  const expectedContextualGuide = contextualGuideLinks.get(file);
  if (expectedContextualGuide) {
    const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
    if (!mainMarkup.includes(`href="${expectedContextualGuide}"`)) fail(`${file}: main content is missing a contextual training-guide link`);
  }

  const expectedScheduleLink = contextualScheduleLinks.get(file);
  if (expectedScheduleLink) {
    const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
    if (!mainMarkup.includes(`href="${expectedScheduleLink}"`)) fail(`${file}: main content is missing contextual schedule link ${expectedScheduleLink}`);
  }

  const expectedGoshenLink = contextualGoshenLinks.get(file);
  if (expectedGoshenLink) {
    const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
    if (!mainMarkup.includes(`href="${expectedGoshenLink}"`)) fail(`${file}: main content is missing contextual Goshen link ${expectedGoshenLink}`);
  }

  const addressSearchMapLinks = [...html.matchAll(/href=["'](https:\/\/www\.google\.com\/maps\/search\/[^"']+)["']/gi)]
    .map((match) => match[1].replaceAll('&amp;', '&'));
  for (const mapUrl of addressSearchMapLinks) {
    if (mapUrl !== locations.goshenKiryatMotzkin.mapUrl) fail(`${file}: unapproved address-search map URL ${mapUrl}`);
  }

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
if (business?.logo !== businessData.logo) fail('index.html: business logo does not use the current rectangular asset');
if (business?.containedInPlace?.name !== 'שכונת נווה גנים, קריית מוצקין') fail('index.html: Neve Ganim neighborhood is missing from business structured data');
if (website?.publisher?.['@id'] !== 'https://luckyroll13.com/#business') fail('index.html: WebSite publisher does not reference business');
if (website?.logo !== businessData.logo) fail('index.html: WebSite logo does not use the current rectangular asset');
if (homeSchemas.filter((schema) => schema['@type'] === 'SportsActivityLocation' && schema['@id'] === businessData.schemaId).length !== 1) fail('index.html: business structured data is duplicated');
if (business?.founder?.['@id'] !== 'https://luckyroll13.com/#shabi-shilon') fail('index.html: business does not reference Shabi Shilon as founder');
if (founder?.name !== 'שבי שילון' || founder?.worksFor?.['@id'] !== 'https://luckyroll13.com/#business') fail('index.html: Shabi Shilon Person entity is incomplete');
if (!homeHtml.includes('href="/about/"><strong>שבי שילון</strong>')) fail('index.html: visible founder identity is missing');
if (homeHtml.includes('data-home-event-promo')) fail('index.html: completed seminar recap must not use the temporary promotion hook');
if (!homeHtml.includes('aria-label="סיכום סמינר Javier Zaruski בישראל"') || !homeHtml.includes('>לסיכום ולתמונות</a>')) fail('index.html: missing completed seminar recap banner');
if (!homeHtml.includes('href="/kiryat-motzkin/"')) fail('index.html: missing Kiryat Motzkin link');
if (!homeHtml.includes('href="/schedule/#schedule-neve-ganim"')) fail('index.html: missing direct Neve Ganim schedule link');

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
if (!englishHomeHtml.includes('href="/en/schedule/#schedule-neve-ganim"')) fail('en/index.html: missing direct Neve Ganim schedule link');

for (const [page, html] of [['index.html', homeHtml], ['en/index.html', englishHomeHtml]]) {
  const galleryTiles = html.match(/class="gallery-item(?:\s+gallery-item--embedded-letterbox)?"/g) || [];
  if (galleryTiles.length !== 3) fail(`${page}: homepage gallery must use three bounded image tiles`);
  if ((html.match(/gallery-item--embedded-letterbox/g) || []).length !== 1) fail(`${page}: letterboxed homepage image is missing its crop hook`);
}

const aboutHtml = readFileSync(resolve(root, 'about/index.html'), 'utf8');
const aboutSchemas = flattenSchemas(jsonLd(aboutHtml, 'about/index.html'));
const aboutFounder = aboutSchemas.find((schema) => schema['@type'] === 'Person' && schema['@id'] === 'https://luckyroll13.com/#shabi-shilon');
const approvedPersonalAboutCopy = [
  'מספר מילים ממני',
  'זה הבית שפתחתי כאן',
  'פתחתי את ה-Lucky Roll13 למען הקהילה.',
  'המטרה שלי היא להגיע לכמה שיותר לבבות. להיות מורה, לאחד בין אנשים וליצור מקום שבו חברי הקהילה שלי נמצאים שם אחד בשביל השני.',
  'כשפתחתי את Lucky Roll13, לא רציתי להקים עוד מקום שבו לומדים רק להילחם. רציתי להקים בית ספר שמגדל את המורים של העתיד. הילדים שגדלים היום בבית הספר שלי יהיו המורים של המחר ומעבר, אנשי קהילה שמובילים אחרים ועושים טוב סביבם.',
  'Lucky Roll13 הוא בית ספר לאגרוף, ג׳יו־ג׳יטסו ואומנויות לחימה משולבות — MMA. זה בית ספר קטן ואיכותי, עסק משפחתי, שבו הערכים נמצאים לפני הכול.',
  'אני מלמד מתוך ניסיון מתמשך באימון, בתרגול ובתחרות, בארץ ובחו״ל. יש לי ניסיון של ממש ואני זוכה לעשות את מה שתמיד אהבתי למעלה כבר מ 30 שנה.',
  '״דרך ארץ קדמה לתורה״.',
  'חשוב לי שכל מי שנכנס לכאן ידע שיש אדם אמיתי בצד השני. אני זמין. אני לא מערכת ולא בינה מלאכותית.',
  'קוראים לי שבי, אני מורה ומייסד בית הספר לאגרוף ג׳יו-ג׳טסו ו- MMA וזה הבית שפתחתי כאן.',
  'דברו איתי, תגיעו להכיר, ותבואו להיות חלק מהבית שפתחתי כאן.',
  '– המורה שבי'
];
const personalAboutSection = aboutHtml.match(/<div class="wrap about-story">([\s\S]*?)<div class="about-story-photos">/i)?.[1] || '';
const personalAboutEyebrow = personalAboutSection.match(/<div class="eyebrow">([\s\S]*?)<\/div>/i)?.[1];
const personalAboutHeading = personalAboutSection.match(/<h2>([\s\S]*?)<\/h2>/i)?.[1];
const personalAboutParagraphs = [...personalAboutSection.matchAll(/<p(?:\s+class="lead")?>([\s\S]*?)<\/p>/gi)]
  .map((match) => match[1]);
const actualPersonalAboutCopy = [personalAboutEyebrow, personalAboutHeading, ...personalAboutParagraphs]
  .filter((fragment) => fragment !== undefined)
  .map(inlineText);
if (!personalAboutSection) fail('about/index.html: approved personal About section is missing');
if (JSON.stringify(actualPersonalAboutCopy) !== JSON.stringify(approvedPersonalAboutCopy)) {
  fail('about/index.html: personal wording changed from the founder-approved copy');
}
if (!aboutFounder || aboutFounder.subjectOf?.length !== 2) fail('about/index.html: founder entity is missing verified competition references');
if (!aboutHtml.includes('ADCC Amateur World Championship') || !aboutHtml.includes('smoothcomp.com/en/event/29650')) fail('about/index.html: verified international competition record is missing');
if (/"@type"\s*:\s*"VideoObject"/.test(aboutHtml)) fail('about/index.html: incomplete VideoObject schema remains');

const englishAboutHtml = readFileSync(resolve(root, 'en/about/index.html'), 'utf8');
const englishAboutSchemas = flattenSchemas(jsonLd(englishAboutHtml, 'en/about/index.html'));
const englishAboutFounder = englishAboutSchemas.find((schema) => schema['@type'] === 'Person' && schema['@id'] === 'https://luckyroll13.com/#shabi-shilon');
if (!englishAboutFounder || englishAboutFounder.name !== 'Shabi Shilon') fail('en/about/index.html: English founder entity is incomplete');
if (/"@type"\s*:\s*"VideoObject"/.test(englishAboutHtml)) fail('en/about/index.html: incomplete VideoObject schema remains');

const localSearchChecks = [
  ['index.html', ['אומנויות לחימה בקריית מוצקין והקריות', 'אגרוף', 'ג׳יו־ג׳יטסו', 'MMA', 'נווה גנים', 'מתנ״ס גושן']],
  ['boxing/index.html', ['אימוני אגרוף בקריית מוצקין והקריות', 'אגרוף קלאסי']],
  ['bjj/index.html', ['ג׳יו־ג׳יטסו BJJ בקריית מוצקין והקריות']],
  ['kids/index.html', ['אומנויות לחימה לילדים בקריית מוצקין והקריות', 'מתנ״ס גושן']],
  ['women-boxing/index.html', ['אגרוף לנשים בקריות', 'קריית מוצקין']],
  ['kiryat-motzkin/index.html', ['אומנויות לחימה בנווה גנים, קריית מוצקין', 'קריית ביאליק', 'קריית ים', 'קריית אתא', 'קריית חיים']],
  ['goshen-kiryat-motzkin/index.html', ['ג׳יו־ג׳יטסו במתנ״ס גושן, קריית מוצקין', 'קק״ל 23א׳', 'שני וחמישי']],
  ['schedule/index.html', ['מערכת שעות האימונים של Lucky Roll13', 'נווה גנים, קריית מוצקין', 'מתנ״ס גושן']],
  ['guide/index.html', ['איך לבחור אומנות לחימה בקריות', 'אגרוף', 'ג׳יו־ג׳יטסו ברזילאי', 'MMA לילדים ונוער', 'אגרוף לנשים', 'אימון אישי']],
  ['en/index.html', ['Martial Arts in Kiryat Motzkin and Krayot', 'Boxing', 'Brazilian Jiu-Jitsu', 'MMA', 'Neve Ganim', 'Matnas Goshen']],
  ['en/boxing/index.html', ['Boxing Training in Kiryat Motzkin and Krayot', 'Classic Boxing']],
  ['en/bjj/index.html', ['BJJ in Kiryat Motzkin and Krayot']],
  ['en/kids/index.html', ['Martial Arts for Kids in Kiryat Motzkin and Krayot', 'Goshen Community Center']],
  ['en/women-boxing/index.html', ["Women's Boxing in Krayot", 'Kiryat Motzkin']],
  ['en/kiryat-motzkin/index.html', ['Martial Arts in Neve Ganim, Kiryat Motzkin', 'Kiryat Bialik', 'Kiryat Yam', 'Kiryat Ata', 'Kiryat Haim']],
  ['en/goshen-kiryat-motzkin/index.html', ['Brazilian Jiu-Jitsu at Matnas Goshen, Kiryat Motzkin', '23A KKL St.', 'Monday and Thursday']],
  ['en/schedule/index.html', ['Lucky Roll13 Training Schedule', 'Neve Ganim, Kiryat Motzkin', 'Matnas Goshen']],
  ['en/guide/index.html', ['How Do I Choose a Martial Art in Krayot', 'Boxing', 'Brazilian Jiu-Jitsu', 'MMA for kids and youth', "Women's Boxing", 'Personal Training']]
];
for (const [file, phrases] of localSearchChecks) {
  const pageHtml = readFileSync(resolve(root, file), 'utf8');
  for (const phrase of phrases) {
    if (!pageHtml.includes(phrase)) fail(`${file}: missing approved local-search phrase: ${phrase}`);
  }
}

const expectedSessionCount = Object.values(locations)
  .flatMap((location) => location.dayGroups)
  .reduce((count, dayGroup) => count + dayGroup.sessions.length, 0);
const schedulePageChecks = [
  { file: 'schedule/index.html', language: 'he', expectedTables: 2 },
  { file: 'en/schedule/index.html', language: 'en', expectedTables: 2 }
];

for (const { file, language, expectedTables } of schedulePageChecks) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
  const schemas = flattenSchemas(jsonLd(html, file));
  const timetable = schemas.find((schema) => schema['@type'] === 'ItemList');
  const visibleTables = mainMarkup.match(/<table\b[^>]*class=["'][^"']*schedule-table[^"']*["'][^>]*>[\s\S]*?<\/table>/gi) || [];
  const updatedLabel = language === 'en' ? scheduleLastUpdated.en : scheduleLastUpdated.he;

  if (visibleTables.length !== expectedTables) fail(`${file}: expected ${expectedTables} server-rendered schedule tables, found ${visibleTables.length}`);
  if (!mainMarkup.includes(`<time datetime="${scheduleLastUpdated.iso}">${updatedLabel}</time>`)) fail(`${file}: stable lastUpdated value is missing`);
  if (!timetable || timetable.itemListElement?.length !== expectedSessionCount) fail(`${file}: ItemList does not match the visible timetable`);
  if (!mainMarkup.includes('data-trial-cta')) fail(`${file}: trial CTA is not instrumented`);
  if (!mainMarkup.includes('id="schedule-neve-ganim"')) fail(`${file}: Neve Ganim schedule anchor is missing`);

  for (const table of visibleTables) {
    if (!/<caption>[^<]+<\/caption>/i.test(table) || !/<thead>[\s\S]*?<th scope="col">/i.test(table) || !/<th scope="row">/i.test(table)) {
      fail(`${file}: schedule table semantics are incomplete`);
    }
  }

  for (const location of Object.values(locations)) {
    const address = language === 'en' ? location.address.en : location.address.he;
    if (!mainMarkup.includes(address)) fail(`${file}: missing address for ${location.key}`);
    for (const dayGroup of location.dayGroups) {
      const dayLabel = language === 'en' ? dayGroup.label.en : dayGroup.label.he;
      if (!mainMarkup.includes(dayLabel)) fail(`${file}: missing schedule day label ${dayLabel}`);
      for (const session of dayGroup.sessions) {
        const training = language === 'en' ? session.training.en : session.training.he;
        const audience = language === 'en' ? session.audience.en : session.audience.he;
        if (!mainMarkup.includes(session.time) || !mainMarkup.includes(training) || (audience && !mainMarkup.includes(audience))) {
          fail(`${file}: missing approved session ${dayLabel} ${session.time} ${training}`);
        }
      }
    }
  }
}

const goshenPageChecks = [
  { file: 'goshen-kiryat-motzkin/index.html', language: 'he', pageUrl: 'https://luckyroll13.com/goshen-kiryat-motzkin/' },
  { file: 'en/goshen-kiryat-motzkin/index.html', language: 'en', pageUrl: 'https://luckyroll13.com/en/goshen-kiryat-motzkin/' }
];

for (const { file, language, pageUrl } of goshenPageChecks) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
  const schemas = flattenSchemas(jsonLd(html, file));
  const place = schemas.find((schema) => schema['@id'] === locations.goshenKiryatMotzkin.schemaId && schema['@type'] === 'Place');
  const faq = schemas.find((schema) => schema['@type'] === 'FAQPage');
  const services = schemas.filter((schema) => schema['@type'] === 'Service' && schema.areaServed?.['@id'] === locations.goshenKiryatMotzkin.schemaId);
  const schemaFaqPairs = faq?.mainEntity?.map((entry) => [entry.name, entry.acceptedAnswer?.text]) || [];
  const expectedStreet = language === 'en' ? locations.goshenKiryatMotzkin.address.streetAddress.en : locations.goshenKiryatMotzkin.address.streetAddress.he;
  const expectedLocality = language === 'en' ? locations.goshenKiryatMotzkin.address.addressLocality.en : locations.goshenKiryatMotzkin.address.addressLocality.he;

  if (!place || place.url !== 'https://luckyroll13.com/goshen-kiryat-motzkin/' || place.telephone !== businessData.schemaPhone) fail(`${file}: stable Goshen Place entity is incomplete`);
  if (place?.address?.streetAddress !== expectedStreet || place?.address?.addressLocality !== expectedLocality || place?.address?.addressCountry !== 'IL') fail(`${file}: Goshen Place address is inconsistent`);
  if (place?.hasMap !== locations.goshenKiryatMotzkin.mapUrl || !place?.containedInPlace?.name || place?.containedInPlace?.url !== locations.goshenKiryatMotzkin.containedInPlace.url) fail(`${file}: Goshen map or authoritative containing community center is missing`);
  if (schemas.some((schema) => schema['@id'] === locations.goshenKiryatMotzkin.schemaId && schema['@type'] === 'SportsActivityLocation')) fail(`${file}: Goshen must remain a Place, not an independent SportsActivityLocation`);
  if (services.length !== 3 || services.some((service) => service.provider?.['@id'] !== businessData.schemaId || service.url !== pageUrl)) fail(`${file}: Goshen services are not linked to the business and place`);
  if (services.some((service) => !/BJJ|Brazilian Jiu-Jitsu|ג׳יו־ג׳יטסו/i.test(`${service.name || ''} ${service.serviceType || ''}`) || /MMA|Boxing|אגרוף/i.test(`${service.name || ''} ${service.serviceType || ''}`))) fail(`${file}: Goshen Service schema must describe BJJ only`);
  if (JSON.stringify(visibleFaqPairs(html)) !== JSON.stringify(schemaFaqPairs)) fail(`${file}: visible FAQ and FAQ schema do not match exactly`);
  if (!mainMarkup.includes('data-trial-cta')) fail(`${file}: trial CTA is not instrumented`);
}

const hebrewGoshenMain = readFileSync(resolve(root, 'goshen-kiryat-motzkin/index.html'), 'utf8').match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
const hebrewGoshenText = plainText(hebrewGoshenMain);
for (const phrase of ['ג׳יו־ג׳יטסו במתנ״ס גושן, קריית מוצקין', 'קק״ל 23א׳', 'שני וחמישי']) {
  if (!hebrewGoshenText.includes(phrase)) fail(`goshen-kiryat-motzkin/index.html: missing approved local phrase: ${phrase}`);
}

const kidsHtml = readFileSync(resolve(root, 'kids/index.html'), 'utf8');
const kidsMain = kidsHtml.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
const kidsFaq = flattenSchemas(jsonLd(kidsHtml, 'kids/index.html')).find((schema) => schema['@type'] === 'FAQPage');
const kidsSchemaFaqPairs = kidsFaq?.mainEntity?.map((entry) => [entry.name, entry.acceptedAnswer?.text]) || [];
for (const approvedKidsFact of ['18:00–18:45', '18:45–19:30', '14:30–15:30', '12:00–13:00', '17:00–17:45', '17:45–18:30']) {
  if (!kidsMain.includes(approvedKidsFact)) fail(`kids/index.html: missing approved kids schedule fact ${approvedKidsFact}`);
}
if (!kidsMain.includes(expectedKiryatAddress.he) || !kidsMain.includes('קק״ל 23א׳')) fail('kids/index.html: both verified Kiryat Motzkin activity locations are not explained');
if (/רק בקריית מוצקין|only in Kiryat Motzkin/i.test(kidsMain)) fail('kids/index.html: page incorrectly says all kids classes are only in Kiryat Motzkin');
if (JSON.stringify(visibleFaqPairs(kidsHtml)) !== JSON.stringify(kidsSchemaFaqPairs)) fail('kids/index.html: visible FAQ and FAQ schema do not match exactly');

for (const file of ['mma/index.html', 'en/mma/index.html']) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
  const pageTitle = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
  const description = meta(html, 'name', 'description') || '';
  const services = flattenSchemas(jsonLd(html, file)).filter((schema) => schema['@type'] === 'Service');
  if (/נשר|Nesher/i.test(`${pageTitle} ${description} ${plainText(mainMarkup)}`)) fail(`${file}: visible MMA page copy associates training with Nesher`);
  if (!plainText(mainMarkup).match(/קריית מוצקין|Kiryat Motzkin/)) fail(`${file}: MMA page does not identify Kiryat Motzkin as its location`);
  if (services.some((service) => /נשר|Nesher/i.test(JSON.stringify(service)))) fail(`${file}: MMA Service schema associates training with Nesher`);
}

const approvedBjjSpellingParagraph = 'באתר Lucky Roll13, המונחים BJJ וג׳יו־ג׳יטסו ברזילאי מתייחסים לאימונים שלנו בקריית מוצקין ובאזור הקריות. בחיפוש נפוצים גם הכתיבים ג\'יו ג\'יטסו וג\'יו-ג\'יטסו.';
const bjjMainText = plainText(readFileSync(resolve(root, 'bjj/index.html'), 'utf8').match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '');
if (countOccurrences(bjjMainText, approvedBjjSpellingParagraph) !== 1) fail('bjj/index.html: approved natural spelling paragraph must appear exactly once');

for (const file of ['women-boxing/index.html', 'en/women-boxing/index.html']) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const timeRanges = [...html.matchAll(/\b\d{2}:\d{2}–\d{2}:\d{2}\b/g)].map((match) => match[0]);
  if (!timeRanges.includes('09:00–10:00') || timeRanges.some((time) => time !== '09:00–10:00')) fail(`${file}: women-only Boxing must show only the approved Friday 09:00–10:00 time`);
  const socialImage = 'https://luckyroll13.com/assets/images/women-boxing-social-20261021.jpg';
  if (meta(html, 'property', 'og:image') !== socialImage || meta(html, 'name', 'twitter:image') !== socialImage) fail(`${file}: optimized women-boxing social image is missing`);
  if (meta(html, 'property', 'og:image:type') !== 'image/jpeg' || meta(html, 'property', 'og:image:width') !== '1200' || meta(html, 'property', 'og:image:height') !== '630') fail(`${file}: women-boxing social image dimensions or type are missing`);
}

const womenBoxingSocialImage = resolve(root, 'assets/images/women-boxing-social-20261021.jpg');
if (!existsSync(womenBoxingSocialImage) || statSync(womenBoxingSocialImage).size > 250_000) fail('women-boxing: optimized social image is missing or larger than 250 KB');

for (const file of ['contact/index.html', 'adults/index.html', 'en/contact/index.html', 'en/adults/index.html']) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const english = file.startsWith('en/');
  if (!html.includes(english ? expectedKiryatAddress.en : expectedKiryatAddress.he)) fail(`${file}: full Kiryat Motzkin address is missing`);
  if (!html.includes(english ? expectedGoshenAddress.en : expectedGoshenAddress.he)) fail(`${file}: full Goshen address is missing`);
}

for (const file of ['contact/index.html', 'en/contact/index.html']) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
  const prefix = file.startsWith('en/') ? '/en' : '';
  for (const servicePath of [`${prefix}/bjj/`, `${prefix}/women-boxing/`]) {
    if (!mainMarkup.includes(`href="${servicePath}"`)) fail(`${file}: contact content is missing high-intent service link ${servicePath}`);
  }
}

for (const file of ['index.html', 'contact/index.html', 'schedule/index.html', 'goshen-kiryat-motzkin/index.html', 'en/index.html', 'en/contact/index.html', 'en/schedule/index.html', 'en/goshen-kiryat-motzkin/index.html']) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const escapedGoshenMapUrl = locations.goshenKiryatMotzkin.mapUrl.replaceAll('&', '&amp;');
  if (!html.includes(locations.goshenKiryatMotzkin.mapUrl) && !html.includes(escapedGoshenMapUrl)) fail(`${file}: direct Google Maps link for the Goshen location is missing`);
  if (!html.includes(locations.goshenKiryatMotzkin.wazeUrl)) fail(`${file}: direct Waze link for the Goshen location is missing`);
}

for (const { file, links } of [
  { file: 'schedule/index.html', links: ['/bjj/', '/boxing/', '/women-boxing/', '/mma/'] },
  { file: 'en/schedule/index.html', links: ['/en/bjj/', '/en/boxing/', '/en/women-boxing/', '/en/mma/'] },
  { file: 'goshen-kiryat-motzkin/index.html', links: ['/bjj/'] },
  { file: 'en/goshen-kiryat-motzkin/index.html', links: ['/en/bjj/'] }
]) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const scheduleRows = [...html.matchAll(/<tbody>([\s\S]*?)<\/tbody>/gi)].map((match) => match[1]).join('');
  for (const href of links) {
    if (!scheduleRows.includes(`href="${href}"`)) fail(`${file}: schedule rows are missing contextual service link ${href}`);
  }
}

for (const file of ['schedule/index.html', 'en/schedule/index.html']) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const womenPath = file.startsWith('en/') ? '/en/women-boxing/' : '/women-boxing/';
  if (!new RegExp(`09:00–10:00[\\s\\S]*?href=["']${womenPath.replaceAll('/', '\\/')}["']`, 'i').test(html)) {
    fail(`${file}: Friday women-only class is not linked to the women-boxing page`);
  }
}

const stalePhoneToken = ['054', '6420206'].join('-');
for (const file of sourceTextFiles(root)) {
  if (readFileSync(file, 'utf8').includes(stalePhoneToken)) fail(`${relative(root, file)}: stale phone format remains`);
}

const guidePages = [
  {
    file: 'guide/index.html',
    canonicalUrl: 'https://luckyroll13.com/guide/',
    language: 'he-IL',
    serviceLinks: ['/boxing/', '/bjj/', '/mma/', '/women-boxing/', '/kids/', '/adults/', '/kiryat-motzkin/', '/contact/']
  },
  {
    file: 'en/guide/index.html',
    canonicalUrl: 'https://luckyroll13.com/en/guide/',
    language: 'en-US',
    serviceLinks: ['/en/boxing/', '/en/bjj/', '/en/mma/', '/en/women-boxing/', '/en/kids/', '/en/adults/', '/en/kiryat-motzkin/', '/en/contact/']
  }
];

for (const { file, canonicalUrl, language, serviceLinks } of guidePages) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const schemas = flattenSchemas(jsonLd(html, file));
  const webpage = schemas.find((schema) => schema['@type'] === 'WebPage');
  const article = schemas.find((schema) => schema['@type'] === 'Article');
  const breadcrumbs = schemas.find((schema) => schema['@type'] === 'BreadcrumbList');
  const mainMarkup = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';

  if (!webpage || webpage.url !== canonicalUrl || webpage.inLanguage !== language) fail(`${file}: missing localized WebPage schema`);
  if (!article || article.inLanguage !== language || article.mainEntityOfPage?.['@id'] !== `${canonicalUrl}#webpage`) fail(`${file}: missing linked Article schema`);
  if (article?.datePublished !== '2026-10-18' || article?.dateModified !== '2026-10-18') fail(`${file}: Article dates are not current`);
  if (article?.author?.['@id'] !== 'https://luckyroll13.com/#business' || article?.publisher?.['@id'] !== 'https://luckyroll13.com/#business') fail(`${file}: Article does not reference the business as author and publisher`);
  if (!breadcrumbs || breadcrumbs.itemListElement?.length !== 2) fail(`${file}: missing two-level BreadcrumbList schema`);
  if (schemas.some((schema) => schema['@type'] === 'FAQPage')) fail(`${file}: deprecated FAQPage schema must not be used`);
  if (visibleFaqPairs(html).length !== 8) fail(`${file}: expected eight visible questions and answers`);
  for (const href of serviceLinks) {
    if (!mainMarkup.includes(`href="${href}"`)) fail(`${file}: guide is missing contextual link ${href}`);
  }
}

const seminarHtml = readFileSync(resolve(root, 'javier-zaruski-seminar/index.html'), 'utf8');
const seminarSchemas = flattenSchemas(jsonLd(seminarHtml, 'javier-zaruski-seminar/index.html'));
const seminarVideo = schemaNodes(seminarSchemas).find((schema) => schema['@type'] === 'VideoObject');
const seminarRecapSchema = seminarSchemas.find((schema) => schema['@id'] === 'https://luckyroll13.com/javier-zaruski-seminar/#webpage');
const payboxLinks = [...seminarHtml.matchAll(/href=["'](https:\/\/links\.payboxapp\.com\/[^"']+)["']/g)].map((match) => match[1]);

if (payboxLinks.length !== 0) fail(`seminar: completed event still exposes ${payboxLinks.length} PayBox CTA(s)`);
if (!seminarRecapSchema || seminarRecapSchema['@type'] !== 'WebPage') fail('seminar: completed event archive must use WebPage recap schema');
if (seminarSchemas.some((schema) => schema['@type'] === 'Event')) fail('seminar: archived recap must not expose active Event schema');
if (!Array.isArray(seminarRecapSchema?.about?.award) || seminarRecapSchema.about.award.length !== 5) fail('seminar: recap schema is missing Javier awards');
if (seminarRecapSchema?.publisher?.['@id'] !== 'https://luckyroll13.com/#business') fail('seminar: recap publisher does not reference business');
if (seminarRecapSchema?.contentLocation?.address?.addressLocality !== 'נשר') fail('seminar: recap location is incomplete');
if (seminarRecapSchema?.primaryImageOfPage?.url !== 'https://luckyroll13.com/assets/images/javier-zaruski-jiu-jitsu-seminar-group-1280.webp') fail('seminar: recap schema has no primary image');
if (seminarHtml.includes('"offers"')) fail('seminar: completed event archive still exposes an Offer');
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
if (seminarVideo?.uploadDate !== '2024-01-08T16:54:49-08:00') fail('seminar: VideoObject uploadDate does not match YouTube metadata');
if (seminarVideo?.embedUrl !== 'https://www.youtube-nocookie.com/embed/JFVUv_njAX8') fail('seminar: VideoObject embedUrl is invalid');
if (Object.hasOwn(seminarVideo || {}, 'contentUrl')) fail('seminar: VideoObject contentUrl must not point to a YouTube watch page');

const tracking = readFileSync(resolve(root, 'assets/tracking.js'), 'utf8');
const events = readFileSync(resolve(root, 'assets/events.js'), 'utf8');

function simulateContactTracking() {
  const gaEvents = [];
  const metaEvents = [];
  const handlers = {};
  const document = {
    head: { appendChild: () => {} },
    getElementById: () => ({}),
    createElement: () => ({}),
    addEventListener: (type, handler) => { handlers[type] = handler; }
  };
  const pageUrl = new URL('https://luckyroll13.com/schedule/');
  const window = {
    location: pageUrl,
    dataLayer: [],
    gtag: (...args) => gaEvents.push(args),
    fbq: (...args) => metaEvents.push(args),
    setTimeout: () => {}
  };

  runInNewContext(tracking, { window, document, URL, URLSearchParams, Date, encodeURIComponent });

  function click(href, { trial = false } = {}) {
    const link = {
      href,
      target: '_blank',
      hasAttribute: (name) => name === 'data-trial-cta' && trial
    };
    handlers.click({
      target: { closest: (selector) => selector === 'a[href]' ? link : null },
      defaultPrevented: false,
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {}
    });
  }

  return { click, gaEvents, metaEvents };
}

function simulateConfirmedFormLead(storage, seedPendingLead = false) {
  const gaEvents = [];
  const metaEvents = [];
  const handlers = {};
  const pendingLeadStorageKey = 'luckyroll13:pending-form-lead';
  const now = Date.now();

  if (seedPendingLead) {
    storage.set(pendingLeadStorageKey, JSON.stringify({
      id: 'kids-lead-qa-confirmed',
      formName: 'kids-lead',
      language: 'he',
      interest: 'BJJ',
      preferredLocation: 'kiryat-motzkin',
      sourcePage: '/kids/',
      createdAt: now
    }));
  }

  const document = {
    documentElement: { lang: 'he' },
    head: { appendChild: () => {} },
    getElementById: () => ({}),
    createElement: () => ({}),
    addEventListener: (type, handler) => { handlers[type] = handler; }
  };
  const window = {
    location: new URL('https://luckyroll13.com/thank-you.html'),
    dataLayer: [],
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key)
    },
    gtag: (...args) => gaEvents.push(args),
    fbq: (...args) => metaEvents.push(args),
    setTimeout: () => {}
  };

  runInNewContext(tracking, { window, document, URL, URLSearchParams, Date, Math, JSON, encodeURIComponent });
  return { gaEvents, metaEvents, storage };
}

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

for (const eventName of ['whatsapp_click', 'phone_click', 'maps_click', 'waze_click', 'trial_booking_click', 'trial_form_submit', 'generate_lead', 'trial_form_success']) {
  if (!tracking.includes(eventName)) fail(`tracking: missing ${eventName}`);
}
if (!tracking.includes('__luckyRoll13TrackingSuppressedForQa') || !tracking.includes("qa_no_tracking") || !tracking.includes("window.location.hostname === 'localhost'")) fail('tracking: local-only QA suppression guard is missing');
const contactRuntime = simulateContactTracking();
contactRuntime.click('https://wa.me/972546420206?text=test');
contactRuntime.click('tel:+972546420206');
contactRuntime.click(businessData.googleMaps);
contactRuntime.click(locations.goshenKiryatMotzkin.mapUrl);
contactRuntime.click(locations.goshenKiryatMotzkin.wazeUrl);
contactRuntime.click('https://wa.me/972546420206?text=trial', { trial: true });
const runtimeGaNames = contactRuntime.gaEvents
  .filter((entry) => entry[0] === 'event')
  .map((entry) => entry[1]);
for (const eventName of ['whatsapp_click', 'whatsapp_lead', 'phone_click', 'maps_click', 'waze_click', 'trial_booking_click']) {
  if (!runtimeGaNames.includes(eventName)) fail(`tracking runtime: missing GA4 ${eventName}`);
}
if (runtimeGaNames.filter((name) => name === 'maps_click').length !== 2) fail('tracking runtime: both verified Google Maps URL patterns must emit maps_click');
if (contactRuntime.metaEvents.filter((entry) => entry[0] === 'track' && entry[1] === 'Contact').length !== 3) fail('tracking runtime: Meta Contact must fire once for each WhatsApp/phone click and not for navigation');

const confirmedLeadStorage = new Map();
const confirmedLeadRuntime = simulateConfirmedFormLead(confirmedLeadStorage, true);
const confirmedGaNames = confirmedLeadRuntime.gaEvents.filter((entry) => entry[0] === 'event').map((entry) => entry[1]);
for (const eventName of ['generate_lead', 'trial_form_success']) {
  if (confirmedGaNames.filter((name) => name === eventName).length !== 1) fail(`tracking runtime: confirmed form must emit GA4 ${eventName} exactly once`);
}
for (const eventName of ['Lead', 'Contact']) {
  if (confirmedLeadRuntime.metaEvents.filter((entry) => entry[0] === 'track' && entry[1] === eventName).length !== 1) fail(`tracking runtime: confirmed form must emit Meta ${eventName} exactly once`);
}
const repeatedLeadRuntime = simulateConfirmedFormLead(confirmedLeadStorage, false);
if (repeatedLeadRuntime.gaEvents.some((entry) => entry[0] === 'event' && ['generate_lead', 'trial_form_success'].includes(entry[1]))) fail('tracking runtime: refreshing the thank-you page duplicates a confirmed GA4 lead');
if (repeatedLeadRuntime.metaEvents.some((entry) => entry[0] === 'track' && ['Lead', 'Contact'].includes(entry[1]))) fail('tracking runtime: refreshing the thank-you page duplicates a confirmed Meta lead');
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
if (!notFoundHtml.includes('<meta name="robots" content="noindex,follow">')) fail('404.html: must remain noindex,follow');
if (/rel=["']canonical["']/i.test(notFoundHtml)) fail('404.html: must not declare a canonical URL');
if (!notFoundHtml.includes("document.documentElement.classList.add('js-enabled')")) fail('404.html: missing progressive-enhancement initializer');
if (!notFoundHtml.includes('/assets/style.css?v=20261024-2') || !notFoundHtml.includes('/assets/site.js?v=20261021-2')) fail('404.html: shared asset versions are stale');
if (!notFoundHtml.includes('/assets/images/luckyroll13-header-logo-1200.webp') || !notFoundHtml.includes('width="1200" height="292"')) fail('404.html: current header logo is missing');
if (notFoundHtml.includes('/assets/images/luckyroll13-header-logo-480.webp')) fail('404.html: previous header logo remains');
if (notFoundHtml.includes('src="/assets/images/luckyroll13-header-logo.webp"')) fail('404.html: oversized 1431px header logo remains');
if (!notFoundHtml.includes('data-open-label="פתיחת תפריט ניווט"') || !notFoundHtml.includes('data-close-label="סגירת תפריט ניווט"')) fail('404.html: accessible menu labels are missing');
if (!notFoundHtml.includes('class="menu-close"')) fail('404.html: explicit menu close control is missing');
if (/>\s*תפריט\s*</.test(notFoundHtml)) fail('404.html: obsolete visible menu text remains');
for (const href of ['/', '/kiryat-motzkin/', '/events/', '/contact/']) {
  if (!notFoundHtml.includes(`href="${href}"`)) fail(`404.html: missing navigation link ${href}`);
}
if (!/href=["']\/events\/["'][^>]*>\s*סמינרים ואירועים\s*<\/a>/i.test(notFoundHtml)) fail('404.html: missing seminars and events navigation tab');
if (!notFoundHtml.includes(googleMapsBusinessUrl)) fail('404.html: Google Maps link does not use the verified business profile');
if (!notFoundHtml.includes('www.waze.com/ul?q=') || !notFoundHtml.includes('navigate=yes')) fail('404.html: Waze link does not use the verified address query');
if (!notFoundHtml.includes(locations.goshenKiryatMotzkin.mapUrl.replaceAll('&', '&amp;')) || !notFoundHtml.includes(locations.goshenKiryatMotzkin.wazeUrl)) fail('404.html: Goshen navigation links are missing');

const localPageHtml = readFileSync(resolve(root, 'kiryat-motzkin/index.html'), 'utf8');
const localPageSchemas = flattenSchemas(jsonLd(localPageHtml, 'kiryat-motzkin/index.html'));
const localFaq = localPageSchemas.find((schema) => schema['@type'] === 'FAQPage');
if (!localFaq || !Array.isArray(localFaq.mainEntity) || localFaq.mainEntity.length !== 4) fail('kiryat-motzkin: missing matching local FAQ schema');
const localSchemaFaqPairs = localFaq?.mainEntity?.map((item) => [item.name, item.acceptedAnswer?.text]) || [];
if (JSON.stringify(visibleFaqPairs(localPageHtml)) !== JSON.stringify(localSchemaFaqPairs)) fail('kiryat-motzkin: visible FAQ and FAQ schema do not match exactly');
for (const phrase of ['אגרוף בקריית מוצקין', 'ג׳יו־ג׳יטסו BJJ בקריית מוצקין', 'אגרוף לנשים בקריית מוצקין', 'MMA לילדים ונוער']) {
  if (!localPageHtml.includes(phrase)) fail(`kiryat-motzkin: missing useful local service content: ${phrase}`);
}
if (!localPageHtml.includes('href="/women-boxing/"')) fail('kiryat-motzkin: missing women boxing service link');
if (!localPageHtml.includes('הגנה עצמית')) fail('kiryat-motzkin: missing factual self-defence guidance');

const englishLocalPageHtml = readFileSync(resolve(root, 'en/kiryat-motzkin/index.html'), 'utf8');
const englishLocalPageSchemas = flattenSchemas(jsonLd(englishLocalPageHtml, 'en/kiryat-motzkin/index.html'));
const englishLocalFaq = englishLocalPageSchemas.find((schema) => schema['@type'] === 'FAQPage');
const englishLocalSchemaFaqPairs = englishLocalFaq?.mainEntity?.map((item) => [item.name, item.acceptedAnswer?.text]) || [];
if (englishLocalSchemaFaqPairs.length !== 4 || JSON.stringify(visibleFaqPairs(englishLocalPageHtml)) !== JSON.stringify(englishLocalSchemaFaqPairs)) {
  fail('en/kiryat-motzkin: visible FAQ and FAQ schema do not match exactly');
}

const bjjHtml = readFileSync(resolve(root, 'bjj/index.html'), 'utf8');
const bjjGallery = bjjHtml.match(/<div class="bjj-gallery">([\s\S]*?)<\/div>/i)?.[1] || '';
if ((bjjGallery.match(/<img\b/gi) || []).length !== 21) fail('bjj: expected 21 gallery images');
for (let number = 13; number <= 21; number += 1) {
  const filename = `bjj-gallery-${number}.webp`;
  if (!bjjGallery.includes(filename)) fail(`bjj: missing new gallery image ${filename}`);
  if (!existsSync(resolve(root, 'assets/images', filename))) fail(`bjj: missing gallery asset ${filename}`);
}
for (const page of ['bjj/index.html', 'en/bjj/index.html']) {
  const html = readFileSync(resolve(root, page), 'utf8');
  for (let number = 1; number <= 21; number += 1) {
    if (number === 15) continue;
    const id = String(number).padStart(2, '0');
    const source = `/assets/images/bjj-gallery-${id}.webp`;
    const image = imageTagsWithSource(html, source)[0];
    const imageAttributes = image ? parseAttributes(image) : {};
    const srcset = imageAttributes.srcset || '';
    if (!image || !srcset.includes(`bjj-gallery-${id}-480.webp 480w`) || !srcset.includes(`bjj-gallery-${id}-720.webp 720w`)) {
      fail(`${page}: ${source} is missing its responsive 480px/720px candidates`);
    }
    if (!imageAttributes.sizes?.includes('(max-width: 800px)')) fail(`${page}: ${source} sizes do not match the 800px single-column breakpoint`);
    if (!existsSync(resolve(root, 'assets/images', `bjj-gallery-${id}-480.webp`))) fail(`${page}: missing BJJ 480px asset ${id}`);
  }
}

const responsiveCollaborationStems = [
  'shabi-ido-pariente-collaboration',
  'collab-fighttlv',
  'collab-japan-poster',
  'collab-blacklotus-bw',
  'collab-blacklotus-dojo',
  'collab-group-certificate',
  'collab-01',
  'collab-03',
  'collab-05',
  'collab-06',
  'collab-07'
];
for (const page of ['collaborations/index.html', 'en/collaborations/index.html']) {
  const html = readFileSync(resolve(root, page), 'utf8');
  for (const stem of responsiveCollaborationStems) {
    if (!html.includes(`/assets/images/${stem}-480.webp 480w`) || !html.includes(`/assets/images/${stem}-720.webp 720w`)) {
      fail(`${page}: ${stem} is missing responsive 480px/720px WebP candidates`);
    }
    if (!existsSync(resolve(root, 'assets/images', `${stem}-480.webp`))) fail(`${page}: missing collaboration 480px asset ${stem}`);
  }
}

for (const page of ['kids/index.html', 'en/kids/index.html']) {
  const html = readFileSync(resolve(root, page), 'utf8');
  for (const filename of ['kids.webp', 'kids2-optimized.webp', 'community.webp']) {
    const images = imageTagsWithSource(html, `/assets/images/${filename}`);
    const variant = `${filename.replace(/\.webp$/, '')}-720.webp 720w`;
    if (!images.length || images.some((image) => !parseAttributes(image).srcset?.includes(variant))) {
      fail(`${page}: ${filename} is missing a responsive 720px candidate`);
    }
  }
}

const responsiveHomepageImages = [
  ['bjj-480.webp', 'bjj-720.webp 720w'],
  ['boxing-optimized-480.webp', 'boxing-optimized-720.webp 720w'],
  ['women-boxing-hero-480.webp', 'women-boxing-hero-720.webp 720w'],
  ['kids-480.webp', 'kids-720.webp 720w'],
  ['mma-hero-480.webp', 'mma-hero-720.webp 720w']
];
for (const page of ['index.html', 'en/index.html']) {
  const html = readFileSync(resolve(root, page), 'utf8');
  if (!html.includes('class="hero hero--responsive-media"') || !html.includes('hero-720.webp 720w') || !html.includes('fetchpriority="high"')) {
    fail(`${page}: responsive priority hero is missing`);
  }
  if (!html.includes('/assets/images/luckyroll13-header-logo-1200.webp')) fail(`${page}: current header logo is missing`);
  if (html.includes('src="/assets/images/mma-hero.jpeg"')) fail(`${page}: oversized MMA JPEG remains on the homepage`);
  for (const [source, candidate] of responsiveHomepageImages) {
    const image = imageTagsWithSource(html, `/assets/images/${source}`)[0];
    if (!image || !parseAttributes(image).srcset?.includes(candidate)) fail(`${page}: ${source} is missing responsive candidates`);
  }
}
for (const filename of [
  'hero-720.webp',
  'hero-960.webp',
  'luckyroll13-header-logo-1200.webp',
  ...responsiveHomepageImages.map(([source]) => source)
]) {
  if (!existsSync(resolve(root, 'assets/images', filename))) fail(`homepage: missing optimized asset ${filename}`);
}

const sharedCss = readFileSync(resolve(root, 'assets/style.css'), 'utf8');
if (!sharedCss.includes('.gallery-item {') || !sharedCss.includes('overflow: hidden;') || !sharedCss.includes('.gallery-item img {') || !sharedCss.includes('object-fit: cover;')) {
  fail('assets/style.css: homepage gallery tiles no longer crop images consistently');
}
if (!sharedCss.includes('.gallery-item--embedded-letterbox img { transform: scale(1.55);')) {
  fail('assets/style.css: embedded letterboxing crop is missing');
}
function checkResponsiveHero(page, stem) {
  const html = readFileSync(resolve(root, page), 'utf8');
  const fallback = `/assets/images/${stem}.webp`;
  const expectedSrcset = `/assets/images/${stem}-480.webp 480w, /assets/images/${stem}-720.webp 720w, ${fallback} 941w`;
  const pictures = picturesWithClass(html, 'hero-media');
  if (pictures.length !== 1) {
    fail(`${page}: expected exactly one responsive hero picture`);
    return;
  }

  const picture = pictures[0];
  const sources = tags(picture.inner, 'source').map(parseAttributes);
  const images = tags(picture.inner, 'img').map(parseAttributes);
  const preloads = tags(html, 'link').map(parseAttributes)
    .filter((attributes) => attributes.rel === 'preload' && attributes.as === 'image' && attributes.href === fallback);
  const source = sources[0] || {};
  const image = images[0] || {};
  const preload = preloads[0] || {};

  if (picture.attributes['aria-hidden'] !== 'true' || sources.length !== 1 || images.length !== 1) {
    fail(`${page}: responsive hero picture semantics or child count is invalid`);
  }
  if (source.type !== 'image/webp' || source.srcset !== expectedSrcset || source.sizes !== '100vw') {
    fail(`${page}: responsive hero source candidates or sizes are invalid`);
  }
  if (image.src !== fallback || image.alt !== '' || image.width !== '941' || image.height !== '2048' || image.fetchpriority !== 'high' || image.loading === 'lazy') {
    fail(`${page}: responsive hero fallback, priority, dimensions or decorative text are invalid`);
  }
  if (preloads.length !== 1 || preload.imagesrcset !== source.srcset || preload.imagesizes !== source.sizes || preload.fetchpriority !== 'high') {
    fail(`${page}: responsive hero preload does not exactly match the picture source`);
  }

  const escapedStem = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`url\\(\\s*['"]?\\/assets\\/images\\/${escapedStem}(?:-[^)'"\\s]+)?`, 'i').test(`${html}\n${sharedCss}`)) {
    fail(`${page}: CSS background duplicates the responsive hero request`);
  }
}

for (const page of ['mma/index.html', 'en/mma/index.html']) checkResponsiveHero(page, 'mma-hero');
for (const page of ['women-boxing/index.html', 'en/women-boxing/index.html']) checkResponsiveHero(page, 'women-boxing-hero');

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

for (const { file, name, language, action } of [
  { file: 'kids/index.html', name: 'kids-lead', language: 'he', action: '/thank-you.html' },
  { file: 'en/kids/index.html', name: 'kids-lead', language: 'en', action: '/en/thank-you/' },
  { file: 'women-boxing/index.html', name: 'women-boxing-lead', language: 'he', action: '/thank-you.html' },
  { file: 'en/women-boxing/index.html', name: 'women-boxing-lead', language: 'en', action: '/en/thank-you/' }
]) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const form = namedForm(html, name);
  if (!form) {
    fail(`${file}: missing ${name} form`);
    continue;
  }
  if (form.attributes.method?.toUpperCase() !== 'POST' || form.attributes.action !== action) fail(`${file}: ${name} form method or success action is invalid`);
  if (form.attributes['data-netlify'] !== 'true' || form.attributes['data-netlify-honeypot'] !== 'bot-field') fail(`${file}: ${name} form is missing Netlify or honeypot configuration`);
  if (!new RegExp(`<input\\b[^>]*name=["']form-name["'][^>]*value=["']${name}["']`, 'i').test(form.inner)) fail(`${file}: ${name} form-name field is missing`);
  if (!new RegExp(`<input\\b[^>]*name=["']language["'][^>]*value=["']${language}["']`, 'i').test(form.inner)) fail(`${file}: ${name} language field is missing`);
  if (!/<input\b[^>]*name=["']bot-field["']/i.test(form.inner)) fail(`${file}: ${name} honeypot field is missing`);
  if (name === 'kids-lead') {
    if (!/<select\b[^>]*name=["']preferred-location["'][^>]*required/i.test(form.inner)) fail(`${file}: kids form needs a required preferred location`);
    if (!/<select\b[^>]*name=["']interest["'][^>]*required/i.test(form.inner)) fail(`${file}: kids form needs a required training interest`);
    if (!/value=["']goshen-kiryat-motzkin["'][^>]*>[\s\S]*?(?:מתנ״ס גושן|Matnas Goshen|Goshen Community Center)/i.test(form.inner)) fail(`${file}: Goshen location option is missing from the kids form`);
    if (!/value=["']BJJ["'][^>]*data-available-locations=["'][^"']*kiryat-motzkin[^"']*goshen-kiryat-motzkin[^"']*["']/i.test(form.inner)) fail(`${file}: BJJ must be available at both Kiryat Motzkin locations in the kids form`);
    if (!/value=["']MMA["'][^>]*data-available-locations=["']kiryat-motzkin["']/i.test(form.inner)) fail(`${file}: MMA must be limited to Kiryat Motzkin in the kids form`);
  }
}

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
const sitemapEntries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod><\/url>/g)];
const sitemapUrls = sitemapEntries.map((entry) => entry[1]);
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jerusalem',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
if (sitemapEntries.length !== allIndexablePages.length) fail(`sitemap: expected ${allIndexablePages.length} complete entries, found ${sitemapEntries.length}`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap: duplicate URLs detected');
for (const [, url, lastmod] of sitemapEntries) {
  if (lastmod > today) fail(`sitemap: ${url} has a future lastmod date ${lastmod}`);
}
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
if (sitemap.includes('/nesher/')) fail('sitemap: retired Nesher location remains indexable');
for (const goshenUrl of ['https://luckyroll13.com/goshen-kiryat-motzkin/', 'https://luckyroll13.com/en/goshen-kiryat-motzkin/']) {
  if (!sitemap.includes(`<loc>${goshenUrl}</loc><lastmod>2026-10-24</lastmod>`)) fail(`sitemap: Goshen lastmod is not 2026-10-24 for ${goshenUrl}`);
}
for (const guideUrl of ['https://luckyroll13.com/guide/', 'https://luckyroll13.com/en/guide/']) {
  if (!sitemap.includes(`<loc>${guideUrl}</loc><lastmod>2026-10-24</lastmod>`)) fail(`sitemap: guide lastmod is not 2026-10-24 for ${guideUrl}`);
}

const siteScript = readFileSync(resolve(root, 'assets/site.js'), 'utf8');
const styles = readFileSync(resolve(root, 'assets/style.css'), 'utf8');
const bilingualBuildScript = readFileSync(resolve(root, 'scripts/build-bilingual-site.mjs'), 'utf8');
const bilingualTranslations = readFileSync(resolve(root, 'scripts/english-translations.mjs'), 'utf8');
if (!/\.schedule-table-wrap\s*\{[^}]*overflow-x:\s*auto/i.test(styles)) fail('schedule styles: timetable wrapper is not horizontally scrollable on narrow screens');
if (!/\.schedule-table-wrap:focus-visible\s*\{[^}]*outline:/i.test(styles)) fail('schedule styles: keyboard focus indicator is missing from timetable wrapper');
if (!/\.schedule-table\s*\{[^}]*min-width:\s*620px/i.test(styles)) fail('schedule styles: timetable minimum width is missing');
if (!/\.schedule-location--goshen\s*\{[^}]*border-top-color:\s*#e34b4b/i.test(styles)) fail('schedule styles: Goshen location accent is missing');
if (!/@media\s*\(max-width:\s*820px\)[\s\S]*?\.location-services\s*\{[^}]*grid-template-columns:\s*1fr/i.test(styles)) fail('schedule styles: location service cards do not collapse to one column on mobile');
if (!siteScript.includes("isEnglish ? '/en/accessibility/' : '/accessibility/'")) fail('site navigation: localized accessibility statement link is not added to public footers');
if (!siteScript.includes('attributionKeys') || !siteScript.includes('utm_')) fail('site navigation: language switching does not preserve campaign attribution');
if (!siteScript.includes('form[data-kids-lead-form]') || !siteScript.includes('data-available-locations')) fail('kids form: incompatible location and training choices are not synchronized');
if (!siteScript.includes("event.key === 'Escape'") || !siteScript.includes('closeButton.addEventListener')) fail('site navigation: keyboard Escape or close control support is missing');
if (!/\.links\s*\{[^}]*display:\s*flex/i.test(styles)) fail('site navigation: no-JavaScript navigation fallback is not visible');
if (!/\.menu-toggle,\s*\.menu-close\s*\{[^}]*display:\s*none/i.test(styles)) fail('site navigation: progressive enhancement controls are visible without JavaScript');
if (!/html\.js-enabled\s+\.links\s*\{[^}]*display:\s*none/i.test(styles)) fail('site navigation: closed enhanced panel is not hidden');
if (!/html\.js-enabled\s+\.links\.is-open\s*\{[^}]*display:\s*flex/i.test(styles)) fail('site navigation: enhanced panel has no open state');
if (!bilingualBuildScript.includes('/assets/images/luckyroll13-header-logo-1200.webp') || bilingualBuildScript.includes('class="logo" src="/assets/images/luckyroll13-header-logo-480.webp"')) {
  fail('bilingual build: current header logo is not preserved');
}
if (!bilingualBuildScript.includes("const styleAssetVersion = '20261024-2'") || !bilingualBuildScript.includes("const scriptAssetVersion = '20261021-2'")) {
  fail('bilingual build: current style and script cache versions are not preserved');
}
if (!bilingualBuildScript.includes('accessibility|guide') || !bilingualTranslations.includes("'למדריך לבחירת אומנות לחימה': 'Read the martial arts selection guide'")) {
  fail('bilingual build: contextual guide links are not preserved in English regeneration');
}

const robots = readFileSync(resolve(root, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://luckyroll13.com/sitemap.xml')) fail('robots.txt: missing sitemap reference');

const redirects = readFileSync(resolve(root, '_redirects'), 'utf8');
for (const line of [
  '/nesher /goshen-kiryat-motzkin/ 301!',
  '/nesher/ /goshen-kiryat-motzkin/ 301!',
  '/nesher/index.html /goshen-kiryat-motzkin/ 301!',
  '/en/nesher /en/goshen-kiryat-motzkin/ 301!',
  '/en/nesher/ /en/goshen-kiryat-motzkin/ 301!',
  '/en/nesher/index.html /en/goshen-kiryat-motzkin/ 301!'
]) {
  if (!redirects.includes(line)) fail(`redirects: missing retired Nesher redirect ${line}`);
}

for (const obsoletePath of [
  'nesher/index.html',
  'en/nesher/index.html',
  'kids_index.html',
  'kids/kids/index.html',
  'luckyroll13-html-patch'
]) {
  if (existsSync(resolve(root, obsoletePath))) fail(`obsolete artifact remains in the publish directory: ${obsoletePath}`);
}

for (const [file] of allIndexablePages) {
  const html = readFileSync(resolve(root, file), 'utf8');
  if (/href=["']\/(?:en\/)?nesher\//i.test(html)) fail(`${file}: links to the retired Nesher location route`);
  if (/דרך בר יהודה 113|113 Derech Bar Yehuda/i.test(html)) fail(`${file}: retired Nesher address remains in an indexable page`);
}

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
const englishSeminarSchemas = flattenSchemas(jsonLd(englishSeminarHtml, 'en/javier-zaruski-seminar/index.html'));
const englishSeminarRecapSchema = englishSeminarSchemas.find((schema) => schema['@id'] === 'https://luckyroll13.com/en/javier-zaruski-seminar/#webpage');
const englishPayboxLinks = [...englishSeminarHtml.matchAll(/href=["'](https:\/\/links\.payboxapp\.com\/[^"']+)["']/g)].map((match) => match[1]);
if (englishPayboxLinks.length !== 0) fail('English seminar: completed event still exposes PayBox');
if (!englishSeminarRecapSchema || englishSeminarRecapSchema['@type'] !== 'WebPage' || englishSeminarRecapSchema.inLanguage !== 'en-US') fail('English seminar: completed event archive must use localized WebPage recap schema');
if (englishSeminarSchemas.some((schema) => schema['@type'] === 'Event')) fail('English seminar: archived recap must not expose active Event schema');
if (englishSeminarHtml.includes('"offers"')) fail('English seminar: stale offer schema remains');
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
