import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  ['javier-zaruski-seminar/index.html', 'https://luckyroll13.com/javier-zaruski-seminar/']
];

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
const googleMapsBusinessUrl = 'https://maps.google.com/?cid=8832126799717426719';

for (const [file, expectedCanonical] of primaryPages) {
  const fullPath = resolve(root, file);
  if (!existsSync(fullPath)) {
    fail(`${file}: missing primary page`);
    continue;
  }

  const html = readFileSync(fullPath, 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const robots = meta(html, 'name', 'robots');

  if (!/<html\b[^>]*lang=["']he["'][^>]*dir=["']rtl["']|<html\b[^>]*dir=["']rtl["'][^>]*lang=["']he["']/i.test(html)) fail(`${file}: missing he/rtl document attributes`);
  if (!title) fail(`${file}: missing title`);
  if (title && titles.has(title)) fail(`${file}: duplicate title with ${titles.get(title)}`);
  if (title) titles.set(title, file);
  if (!meta(html, 'name', 'description')) fail(`${file}: missing meta description`);
  if (canonical(html) !== expectedCanonical) fail(`${file}: canonical mismatch`);
  if (!robots || !robots.includes('index') || robots.includes('noindex')) fail(`${file}: invalid robots directive`);
  if (h1Count !== 1) fail(`${file}: expected one H1, found ${h1Count}`);
  if (!/href=["']\/events\/["'][^>]*>\s*סמינרים ואירועים\s*<\/a>/i.test(html)) fail(`${file}: missing seminars and events navigation tab`);

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
  for (const asset of localAssets) {
    if (!existsSync(resolve(root, asset.slice(1)))) fail(`${file}: missing asset ${asset}`);
  }
}

const homeHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
const homeSchemas = flattenSchemas(jsonLd(homeHtml, 'index.html'));
const business = homeSchemas.find((schema) => schema['@type'] === 'SportsActivityLocation');
const website = homeSchemas.find((schema) => schema['@type'] === 'WebSite');

if (business?.['@id'] !== 'https://luckyroll13.com/#business') fail('index.html: inconsistent business @id');
if (business?.telephone !== '+972546420206') fail('index.html: inconsistent business telephone');
if (business?.address?.streetAddress !== 'מנחם בגין 26') fail('index.html: inconsistent business address');
if (website?.publisher?.['@id'] !== 'https://luckyroll13.com/#business') fail('index.html: WebSite publisher does not reference business');
if (!homeHtml.includes('data-home-event-promo')) fail('index.html: missing temporary seminar promotion');
if (!homeHtml.includes('href="/kiryat-motzkin/"')) fail('index.html: missing Kiryat Motzkin link');

const seminarHtml = readFileSync(resolve(root, 'javier-zaruski-seminar/index.html'), 'utf8');
const seminarSchemas = flattenSchemas(jsonLd(seminarHtml, 'javier-zaruski-seminar/index.html'));
const eventSchema = seminarSchemas.find((schema) => schema['@type'] === 'Event');
const payboxUrl = 'https://links.payboxapp.com/uCxBVtnBs6b';
const payboxLinks = [...seminarHtml.matchAll(/href=["'](https:\/\/links\.payboxapp\.com\/[^"']+)["']/g)].map((match) => match[1]);

if (payboxLinks.length !== 5) fail(`seminar: expected 5 PayBox CTAs, found ${payboxLinks.length}`);
if (payboxLinks.some((href) => href !== payboxUrl)) fail('seminar: PayBox URL altered or contains parameters');
if (eventSchema?.['@id'] !== 'https://luckyroll13.com/javier-zaruski-seminar/#event') fail('seminar: invalid Event @id');
if (!Array.isArray(eventSchema?.performer?.award) || eventSchema.performer.award.length !== 5) fail('seminar: Event performer is missing Javier awards');
if (eventSchema?.startDate !== '2026-09-25T12:00:00+03:00') fail('seminar: invalid startDate');
if (eventSchema?.endDate !== '2026-09-25T15:00:00+03:00') fail('seminar: invalid endDate');
if (eventSchema?.organizer?.['@id'] !== 'https://luckyroll13.com/#business') fail('seminar: organizer does not reference business');
if (eventSchema?.offers?.price !== '250' || eventSchema?.offers?.priceValidUntil !== '2026-09-21') fail('seminar: invalid current offer');
if (!Array.isArray(eventSchema?.image) || eventSchema.image.length !== 4) fail('seminar: expected four Event schema images');
if (!seminarHtml.includes('עד 21.9 כולל') || !seminarHtml.includes('החל מ־22.9')) fail('seminar: invalid visible pricing dates');
if (!seminarHtml.includes('<section class="section" data-event-history hidden>')) fail('seminar: historical state must be hidden by default');
if (!seminarHtml.includes('/assets/events.js?v=20260918-1')) fail('seminar: current event-state script version is not loaded');
if (!seminarHtml.includes('target="_blank" rel="noopener noreferrer" data-seminar-track="seminar_paybox_click"')) fail('seminar: unsafe PayBox link attributes');
if (!seminarHtml.includes('<li><a href="/events/">סמינרים ואירועים</a></li>')) fail('seminar: missing events breadcrumb');
if (meta(seminarHtml, 'property', 'og:image') !== 'https://luckyroll13.com/assets/images/javier-zaruski-seminar-poster-v3.jpg') fail('seminar: official poster is not the social image');
const eventGallery = seminarHtml.match(/<div class="event-gallery"[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/i)?.[0] || '';
if ((eventGallery.match(/<figure\b/gi) || []).length !== 4) fail('seminar: expected four-image Javier gallery');
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
for (const eventName of ['whatsapp_click', 'phone_click', 'maps_click', 'waze_click', 'trial_form_submit']) {
  if (!tracking.includes(eventName)) fail(`tracking: missing ${eventName}`);
}
for (const eventName of ['seminar_page_view', 'seminar_paybox_click', 'seminar_whatsapp_click', 'seminar_maps_click', 'seminar_video_click']) {
  if (!events.includes(eventName)) fail(`events tracking: missing ${eventName}`);
}
for (const metaEventName of ['ViewContent', 'InitiateCheckout', 'Lead']) {
  if (!events.includes(metaEventName)) fail(`events tracking: missing Meta ${metaEventName}`);
}
if (events.includes("'Purchase'") || events.includes('"Purchase"')) fail('events tracking: Purchase must not fire without confirmed payment data');
if (!events.includes("2026-09-22T00:00:00+03:00")) fail('events: missing Israel-time price cutoff');
if (!events.includes("2026-09-25T15:00:00+03:00")) fail('events: missing automatic promotion cutoff');
const eventEnd = Date.parse('2026-09-25T15:00:00+03:00');
if (Date.parse('2026-09-25T14:59:59.999+03:00') >= eventEnd) fail('events: historical state starts before the approved cutoff');
if (Date.parse('2026-09-25T15:00:00+03:00') < eventEnd) fail('events: historical state does not start at the approved cutoff');
if (!events.includes("[data-event-card][data-event-end]")) fail('events: missing reusable event archive automation');
if (!events.includes("[data-seminar-promo]")) fail('events: missing long-term seminar promo archive mode');

const eventsHubHtml = readFileSync(resolve(root, 'events/index.html'), 'utf8');
if (!eventsHubHtml.includes('data-upcoming-list') || !eventsHubHtml.includes('data-past-list')) fail('events hub: missing upcoming/past collections');
if (!eventsHubHtml.includes('data-event-end="2026-09-25T15:00:00+03:00"')) fail('events hub: Javier card has no archive cutoff');
if (!eventsHubHtml.includes('מבחני דרגה')) fail('events hub: missing future grade-test scope');

const notFoundHtml = readFileSync(resolve(root, '404.html'), 'utf8');
if (!/href=["']\/events\/["'][^>]*>\s*סמינרים ואירועים\s*<\/a>/i.test(notFoundHtml)) fail('404.html: missing seminars and events navigation tab');

const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
for (const [, url] of primaryPages) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail(`sitemap: missing ${url}`);
}
if ((sitemap.match(/<lastmod>2026-09-16<\/lastmod>/g) || []).length !== primaryPages.length) fail('sitemap: primary URLs do not have accurate lastmod dates');
if (sitemap.includes('/events/javier-zaruski/')) fail('sitemap: contains redirected seminar URL');

const robots = readFileSync(resolve(root, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://luckyroll13.com/sitemap.xml')) fail('robots.txt: missing sitemap reference');

const campaign = readFileSync(resolve(root, 'marketing/javier-zaruski-campaign.md'), 'utf8');
const campaignBase = 'https://luckyroll13.com/javier-zaruski-seminar/?utm_source=instagram&utm_medium=paid_social&utm_campaign=javier_zaruski_north_2026&utm_content=';
for (const creative of ['poster', 'reel', 'story']) {
  if (!campaign.includes(`${campaignBase}${creative}`)) fail(`campaign: missing ${creative} attribution URL`);
}
if ((campaign.match(/utm_campaign=javier_zaruski_north_2026/g) || []).length !== 3) fail('campaign: expected exactly three North campaign URLs');
if (!campaign.includes('All paid ads land on the seminar page, never directly on PayBox.')) fail('campaign: missing landing-page routing rule');
if (!campaign.includes('On 22.9.2026 update the PayBox group amount manually from ₪250 to ₪299.')) fail('campaign: missing PayBox admin reminder');

for (const page of ['bjj/index.html', 'collaborations/index.html']) {
  const pageHtml = readFileSync(resolve(root, page), 'utf8');
  if (!pageHtml.includes('Javier Zaruski – Israel Seminar 🇮🇱')) fail(`${page}: missing approved seminar heading`);
  if (!pageHtml.includes('25.9 | 12:00–15:00 | UFC Gym Nesher')) fail(`${page}: missing approved seminar summary`);
  if (!pageHtml.includes('href="/javier-zaruski-seminar/"')) fail(`${page}: missing seminar link`);
  if (!pageHtml.includes('data-preserve-utm') || !pageHtml.includes('data-seminar-promo')) fail(`${page}: seminar promotion does not preserve attribution or archive cleanly`);
  if (!pageHtml.includes('/assets/events.js?v=20260918-1')) fail(`${page}: current event-state script version is not loaded`);
}

if (failures.length) {
  console.error(`QA failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`QA passed: ${primaryPages.length} primary pages, metadata, JSON-LD, links, PayBox, analytics, sitemap and robots.txt.`);
