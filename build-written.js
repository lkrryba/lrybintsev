#!/usr/bin/env node
/*
 * build-written.js
 * -----------------
 * Regenerates the "Things I've Written" cards in index.html.
 *
 * Local blog posts are auto-discovered: any *.html file in this folder that
 * links blog.css and has a <article> post is treated as a blog post. Its card
 * title comes from the page's <meta property="og:title">. Newest file first
 * (by modification time).
 *
 * External articles (Medium, freeCodeCamp, etc.) aren't files here, so they
 * live in EXTERNAL_POSTS below. They render after the local posts.
 *
 * Usage:  node build-written.js
 * Run it after adding a new post .html file (or editing EXTERNAL_POSTS).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = __dirname;
const INDEX = path.join(DIR, 'index.html');
const START = '<!-- WRITTEN:START';
const END = '<!-- WRITTEN:END -->';

// Files that are NOT blog posts even if they look like one.
const IGNORE = new Set(['index.html', 'cv-reviews.html']);

// Substack feed baked in at build time. Node reads it directly (no CORS, no
// third-party relay), so these cards are the reliable baseline; main.js may
// still refresh them live in the browser. Bump the limit to taste.
const SUBSTACK_FEED = 'https://leanne14.substack.com/feed';
const SUBSTACK_LIMIT = 9;

// External articles, in display order (shown after local posts).
const EXTERNAL_POSTS = [
  {
    type: 'Medium',
    title: 'How to Not Make Your Website Look Like It Was Built in 1997',
    href: 'https://medium.com/datadriveninvestor/seven-ui-design-fundamentals-to-make-your-website-look-like-it-was-built-in-2020-and-not-1997-971b26d52e1',
  },
  {
    type: 'Medium',
    title: 'freeCodeCamp to Job Offer in 310 Days: What Worked and What Sucked',
    href: 'https://medium.com/datadriveninvestor/freecodecamp-to-job-offer-in-310-days-what-worked-and-what-sucked-6878f287ed3d',
  },
  {
    type: 'freeCodeCamp',
    title: 'Learn Svelte in 5 Minutes',
    href: 'https://www.freecodecamp.org/news/learn-svelte-in-5-minutes/',
  },
];

// Decode the handful of HTML entities that show up in og:title attributes,
// then re-escape the minimal set needed for safe text content.
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getOgTitle(html) {
  const m = html.match(/<meta\s+property=["']og:title["']\s+content=(["'])([\s\S]*?)\1/i);
  return m ? escapeText(decodeEntities(m[2].trim())) : null;
}

function isBlogPost(html) {
  return html.includes('blog.css') && /<article[\s>]/.test(html);
}

function discoverLocalPosts() {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.html') && !IGNORE.has(f))
    .map((f) => {
      const full = path.join(DIR, f);
      const html = fs.readFileSync(full, 'utf8');
      if (!isBlogPost(html)) return null;
      const title = getOgTitle(html);
      if (!title) {
        console.warn(`  ! ${f}: no og:title found, skipping`);
        return null;
      }
      return { type: 'Blog', title, href: f, mtime: fs.statSync(full).mtimeMs };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime); // newest first
}

// Fetch a URL over https, following redirects, returning the body as a string.
// Resolves to null on any network error / non-200 so the build never blocks on
// the feed being reachable.
function fetchText(url, redirectsLeft = 3) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          // Substack serves the feed to normal clients but blocks some bots.
          'User-Agent': 'Mozilla/5.0 (compatible; lrybintsev-site build script)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        timeout: 15000,
      },
      (res) => {
        const { statusCode, headers } = res;
        if (statusCode >= 300 && statusCode < 400 && headers.location && redirectsLeft > 0) {
          res.resume(); // drain
          const next = new URL(headers.location, url).toString();
          resolve(fetchText(next, redirectsLeft - 1));
          return;
        }
        if (statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      }
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}

// Pull the text of the first <tag>…</tag> out of an RSS <item> block, unwrapping
// a CDATA section if present.
function tagText(itemXml, tag) {
  const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!m) return null;
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) v = cdata[1].trim();
  return v;
}

// Parse the Substack RSS feed into {title, href} entries (newest first, as the
// feed already orders them).
function parseFeedItems(xml) {
  if (!xml) return [];
  const items = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml))) {
    const block = match[0];
    const title = tagText(block, 'title');
    const link = tagText(block, 'link');
    if (title && link) items.push({ title: decodeEntities(title), href: link });
  }
  return items;
}

async function discoverSubstackPosts() {
  const xml = await fetchText(SUBSTACK_FEED);
  if (!xml) {
    console.warn('  ! Substack feed unreachable — skipping Substack cards this build');
    return [];
  }
  const items = parseFeedItems(xml).slice(0, SUBSTACK_LIMIT);
  return items.map((it) => ({ type: 'Substack', title: it.title, href: it.href }));
}

function localCard(p) {
  return [
    '        <article class="wr-card">',
    `          <div class="wr-card-type">${p.type}</div>`,
    `          <div class="wr-card-title">${p.title}</div>`,
    `          <a href="${p.href}" class="wr-card-link">Read ↗</a>`,
    '        </article>',
  ].join('\n');
}

function externalCard(p) {
  return [
    '        <article class="wr-card">',
    `          <div class="wr-card-type">${escapeText(p.type)}</div>`,
    `          <div class="wr-card-title">${escapeText(p.title)}</div>`,
    `          <a href="${p.href}" target="_blank" rel="noopener noreferrer" class="wr-card-link">Open ↗</a>`,
    '        </article>',
  ].join('\n');
}

async function main() {
  const substack = await discoverSubstackPosts();
  const local = discoverLocalPosts();
  const cards = [
    ...substack.map(externalCard),
    ...local.map(localCard),
    ...EXTERNAL_POSTS.map(externalCard),
  ].join('\n');

  let html = fs.readFileSync(INDEX, 'utf8');
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    console.error(`Could not find ${START} ... ${END} markers in index.html`);
    process.exit(1);
  }

  const startLineEnd = html.indexOf('\n', startIdx) + 1;
  const before = html.slice(0, startLineEnd);
  const after = html.slice(endIdx);
  html = `${before}${cards}\n        ${after}`;

  fs.writeFileSync(INDEX, html);
  console.log(
    `Wrote ${substack.length} Substack + ${local.length} local + ${EXTERNAL_POSTS.length} external post(s) to the Written section.`
  );
  substack.forEach((p) => console.log(`  • [Substack] ${p.title}`));
  local.forEach((p) => console.log(`  • ${p.href} — ${p.title}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
