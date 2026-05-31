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

const DIR = __dirname;
const INDEX = path.join(DIR, 'index.html');
const START = '<!-- WRITTEN:START';
const END = '<!-- WRITTEN:END -->';

// Files that are NOT blog posts even if they look like one.
const IGNORE = new Set(['index.html']);

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

function main() {
  const local = discoverLocalPosts();
  const cards = [...local.map(localCard), ...EXTERNAL_POSTS.map(externalCard)].join('\n');

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
  console.log(`Wrote ${local.length} local + ${EXTERNAL_POSTS.length} external post(s) to the Written section.`);
  local.forEach((p) => console.log(`  • ${p.href} — ${p.title}`));
}

main();
