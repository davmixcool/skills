#!/usr/bin/env node
// Builds the outreach page from outreach.json, and checks it on the way.
//
//   node scripts/build-tracker.mjs outreach.json [outreach.html]
//
// Errors (the page isn't written): a missing product name or site, a contact without an id,
// a name, a group that exists, a source or a message, duplicate ids.
// Warnings (the page is written): a first message with a key, a code or a tracked link, very long
// DMs or subjects, placeholders left to fill in.
// Status goes to stderr; a JSON summary to stdout.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [input, output = 'outreach.html'] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/build-tracker.mjs outreach.json [outreach.html]');
  process.exit(2);
}

let data;
try {
  data = JSON.parse(readFileSync(input, 'utf8'));
} catch (e) {
  console.error(`Can't read ${input}: ${e.message}`);
  process.exit(1);
}

const errors = [];
const warnings = [];
const placeholders = {};
const PLACEHOLDER = /\[[A-Z][A-Z0-9 /'’-]+\]/g;

if (!data.product?.name) errors.push('product.name is missing');
if (!data.product?.site) errors.push('product.site is missing');
const groups = new Set((data.groups || []).map((g) => g.id));
if (!groups.size) errors.push('groups is empty: add at least one group');

const seen = new Set();
for (const [i, c] of (data.contacts || []).entries()) {
  const at = c.id ? `contact "${c.id}"` : `contact #${i + 1}`;
  if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) errors.push(`${at}: id must be lower-case letters, digits and dashes`);
  else if (seen.has(c.id)) errors.push(`${at}: the id is used twice`);
  seen.add(c.id);
  if (!c.name) errors.push(`${at}: name is missing`);
  if (!groups.has(c.group)) errors.push(`${at}: group "${c.group}" isn't one of the groups`);
  if (!c.sources?.length || c.sources.some((s) => !/^https?:\/\//.test(s.url || ''))) {
    errors.push(`${at}: needs at least one source with a link (the work the message is about)`);
  }
  if (!c.messages?.length || c.messages.some((m) => !m.body?.trim())) errors.push(`${at}: needs at least one message with a body`);
  if (!c.how) warnings.push(`${at}: no "how" (where to send it)`);

  for (const [j, m] of (c.messages || []).entries()) {
    const text = `${m.subject || ''}\n${m.body || ''}`;
    // The first-message rules are for messages to a person: not long shots, directories, public posts or forms.
    const toPerson = c.group !== 'long' && c.group !== 'directories' && !/\b(post|form|submission|listing)\b/i.test(`${c.channel || ''} ${m.label || ''}`);
    const first = j === 0 && toPerson;
    if (first && /utm_[a-z]+=/.test(text)) warnings.push(`${at}: the first message has a tracked link; save it for the reply after a yes`);
    if (first && /\b(licen[cs]e key|promo code|discount code|free (pro )?key)\b|\[(FREE|THEIR) (LICEN[CS]E |KEY|CODE)/i.test(text)) {
      warnings.push(`${at}: the first message carries a key or code; offer one if they reply instead (or move them to long shots)`);
    }
    if (m.subject && m.subject.length > 90) warnings.push(`${at}: the subject is ${m.subject.length} characters; keep it under 90`);
    const dm = /\bdm\b|direct message|instagram|x \/ twitter|\bx\b/i.test(`${m.label || ''} ${c.channel || ''}`);
    if (dm && (m.body || '').length > 700) warnings.push(`${at}: "${m.label}" is ${m.body.length} characters, long for a DM`);
    for (const p of text.match(PLACEHOLDER) || []) (placeholders[c.id] ||= new Set()).add(p);
  }
}
for (const id of data.start || []) if (!seen.has(id)) warnings.push(`start: "${id}" isn't a contact`);

const summary = {
  contacts: data.contacts?.length || 0,
  byGroup: Object.fromEntries((data.groups || []).map((g) => [g.id, (data.contacts || []).filter((c) => c.group === g.id).length])),
  replies: data.replies?.length || 0,
  toFill: Object.fromEntries(Object.entries(placeholders).map(([id, s]) => [id, [...s]])),
  errors,
  warnings,
  output: null,
};

for (const w of warnings) console.error(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s): the page wasn't written.`);
  console.log(JSON.stringify(summary, null, 2));
  process.exit(1);
}

// The data goes into a <script type="application/json">, so nothing in it may close that tag.
const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, '..', 'assets', 'outreach-template.html'), 'utf8');
const json = JSON.stringify(data).replace(/</g, '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
writeFileSync(output, template.replace('/*OUTREACH_DATA*/', () => json));
summary.output = resolve(output);

const filled = Object.keys(placeholders).length;
console.error(`Wrote ${output}: ${summary.contacts} contacts, ${summary.replies} replies` +
  `${warnings.length ? `, ${warnings.length} warning(s)` : ''}${filled ? `; ${filled} contact(s) have parts to fill in` : ''}.`);
console.log(JSON.stringify(summary, null, 2));
