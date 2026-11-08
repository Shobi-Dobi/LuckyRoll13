import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { indexNowConfig } from './indexnow-config.mjs';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const requestedUrls = [];
let submit = false;

function usage() {
  console.log(`Usage:
  node scripts/submit-indexnow.mjs
  node scripts/submit-indexnow.mjs --submit
  node scripts/submit-indexnow.mjs --url https://luckyroll13.com/bjj/ --submit

Without --submit the script only validates and prints the planned request.
Repeat --url to notify IndexNow only about selected production URLs.`);
}

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];

  if (argument === '--submit') {
    submit = true;
    continue;
  }

  if (argument === '--url') {
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error('--url requires an absolute production URL');
    requestedUrls.push(value);
    index += 1;
    continue;
  }

  if (argument === '--help' || argument === '-h') {
    usage();
    process.exit(0);
  }

  throw new Error(`Unknown argument: ${argument}`);
}

function urlsFromSitemap() {
  const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function validateUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== indexNowConfig.host || url.username || url.password || url.port) {
    throw new Error(`Refusing non-production or foreign URL: ${value}`);
  }
  return url.href;
}

const urlList = [...new Set((requestedUrls.length ? requestedUrls : urlsFromSitemap()).map(validateUrl))];
if (!urlList.length) throw new Error('No URLs were found to submit');
if (urlList.length > 10_000) throw new Error('IndexNow accepts at most 10,000 URLs per request');

const payload = {
  host: indexNowConfig.host,
  key: indexNowConfig.key,
  keyLocation: indexNowConfig.keyLocation,
  urlList
};

if (!submit) {
  console.log(`IndexNow dry run: ${urlList.length} production URL(s) validated.`);
  console.log(`Key location: ${indexNowConfig.keyLocation}`);
  urlList.forEach((url) => console.log(`- ${url}`));
  console.log('No request was sent. Run again with --submit only after the production deploy is live.');
  process.exit(0);
}

const keyUrl = new URL(indexNowConfig.keyLocation);
keyUrl.searchParams.set('indexnow-verify', Date.now().toString());
const keyResponse = await fetch(keyUrl, {
  headers: { 'cache-control': 'no-cache' }
});

if (!keyResponse.ok) {
  throw new Error(`IndexNow key is not live yet (${keyResponse.status} ${keyResponse.statusText})`);
}

const liveKey = (await keyResponse.text()).trim();
if (liveKey !== indexNowConfig.key) {
  throw new Error('The production key file does not match the configured IndexNow key');
}

const response = await fetch(indexNowConfig.endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});

if (response.status !== 200 && response.status !== 202) {
  const details = (await response.text()).trim();
  throw new Error(`IndexNow rejected the request (${response.status} ${response.statusText})${details ? `: ${details}` : ''}`);
}

console.log(`IndexNow accepted ${urlList.length} URL(s) with status ${response.status}.`);
