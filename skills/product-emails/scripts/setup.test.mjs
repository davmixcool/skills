/**
 * setup.mjs and the Plunk adapter, against the starter emails file and a fake Plunk API.
 *   node --test scripts/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect, lint as plunkLint } from './providers/plunk.mjs';
import * as plunk from './providers/plunk.mjs';
import { lint, parseSequences, parseTransactional, parseWait, variables } from './lib/templates.mjs';
import { loadConfig, readSecret, secretKey } from './lib/config.mjs';
import { setup } from './setup.mjs';

const CONFIG = fileURLToPath(new URL('../assets/emails.config.json', import.meta.url));
const config = loadConfig(CONFIG);
const md = readFileSync(config.templates, 'utf8');
const parsed = () => ({ sequences: parseSequences(md), transactional: parseTransactional(md, config.transactional) });
const quiet = () => {};

/** Plunk's management API in memory, at the HTTP level, with every write it was asked for. */
function fakePlunk() {
  const store = { templates: [], workflows: [], steps: [], writes: [], sent: [] };
  let n = 0;
  const fetch = async (url, init) => {
    assert.equal(init.headers.authorization, 'Bearer sk_test');
    const { pathname, searchParams } = new URL(url);
    const [, kind, id, sub] = pathname.split('/');
    const body = init.body ? JSON.parse(init.body) : undefined;
    const reply = (json, status = 200) => new Response(JSON.stringify(json), { status });
    if (init.method === 'GET') {
      const search = searchParams.get('search') ?? '';
      return reply({ data: store[kind].filter((x) => x.name.includes(search)), total: 0 });
    }
    if (kind === 'v1' && id === 'send') { store.sent.push(body); return reply({ success: true }); }
    store.writes.push(`${init.method} /${kind}${id ? '/:id' : ''}${sub ? `/${sub}` : ''}`);
    if (init.method === 'POST' && !id) { const item = { id: `${kind}-${++n}`, enabled: false, ...body }; store[kind].push(item); return reply(item, 201); }
    if (init.method === 'POST' && sub === 'steps') { store.steps.push({ workflowId: id, ...body }); return reply({ id: `step-${++n}` }, 201); }
    if (init.method === 'PATCH') { Object.assign(store[kind].find((x) => x.id === id), body); return reply({}); }
    return reply({ error: `unexpected ${init.method} ${pathname}` }, 500);
  };
  return { api: connect({ apiUrl: 'https://plunk.test', key: 'sk_test', fetch }), store };
}

const run = (api, opts = {}) => setup({ api, ...parsed(), prefix: config.namePrefix, marketing: config.marketing, log: quiet, ...opts });

test('the starter file reads as one sequence and one transactional email, and passes lint', () => {
  const { sequences, transactional } = parsed();
  assert.deepEqual(sequences.map((s) => s.event), ['purchased']);
  assert.deepEqual(sequences[0].emails.map((e) => [e.key, e.wait]), [['tips', { amount: 2, unit: 'days' }], ['checkin', { amount: 5, unit: 'days' }]]);
  const [licence] = transactional;
  assert.equal(licence.envVar, 'PLUNK_LICENCE_TEMPLATE');
  assert.equal(licence.from, 'hello@updates.pebble.app', 'sender filled in from the config');
  assert.deepEqual(variables(licence.body), ['firstName', 'key', 'unlockUrl']);
  assert.deepEqual(lint({ sequences, transactional }, plunk), { problems: [], warnings: [] });
});

test('waits: optional, singular or plural, and nothing else', () => {
  assert.equal(parseWait(undefined), null);
  assert.equal(parseWait('0 days'), null);
  assert.deepEqual(parseWait('1 hour'), { amount: 1, unit: 'hours' });
  assert.throws(() => parseWait('a week'), /isn't a wait/);
});

test('lint stops marketing email without an unsubscribe link, and warns on a tracked secret link', () => {
  const bad = {
    sequences: [{ event: 'signed_up', emails: [{ key: 'hi', body: '<p>Hi</p>' }] }],
    transactional: [{ key: 'sign-in', envVar: 'SIGN_IN', body: '<a href="{{link}}">Sign in</a>' }],
  };
  const { problems, warnings } = plunkLint(bad);
  assert.match(problems[0], /no \{\{unsubscribeUrl\}\} link/);
  assert.match(warnings[0], /ses:no-track/);
  const dupes = lint({ sequences: [...bad.sequences, ...bad.sequences], transactional: [] });
  assert.ok(dupes.problems.some((p) => /appears twice/.test(p)));
});

test('a preview changes nothing and returns no ids', async () => {
  const { api, store } = fakePlunk();
  assert.deepEqual(await run(api), {});
  assert.deepEqual(store.writes, []);
});

test('apply creates the templates and the workflow (wait, send, wait, send), and returns the transactional id', async () => {
  const { api, store } = fakePlunk();
  const ids = await run(api, { apply: true, enableNew: true });
  assert.deepEqual(store.templates.map((t) => [t.name, t.type, t.from]), [
    ['Pebble: tips', 'MARKETING', 'sam@updates.pebble.app'],
    ['Pebble: checkin', 'MARKETING', 'sam@updates.pebble.app'],
    ['Pebble: licence', 'TRANSACTIONAL', 'hello@updates.pebble.app'],
  ]);
  const [workflow] = store.workflows;
  assert.equal(workflow.name, 'Pebble: purchased');
  assert.equal(workflow.eventName, 'purchased');
  assert.equal(workflow.allowReentry, false);
  assert.equal(workflow.enabled, true, '--enable-new switches on the workflow it just made');
  assert.deepEqual(store.steps.map((s) => [s.type, s.config.amount ?? s.config.templateId]),
    [['DELAY', 2], ['SEND_EMAIL', store.templates[0].id], ['DELAY', 5], ['SEND_EMAIL', store.templates[1].id]]);
  assert.ok(store.steps.every((s) => s.autoConnect));
  assert.deepEqual(ids, { PLUNK_LICENCE_TEMPLATE: store.templates[2].id });
});

test('running it again changes nothing, and a workflow switched off on purpose stays off', async () => {
  const { api, store } = fakePlunk();
  const first = await run(api, { apply: true, enableNew: true });
  store.workflows[0].enabled = false;
  store.writes.length = 0;
  assert.deepEqual(await run(api, { apply: true, enableNew: true }), first);
  assert.deepEqual(store.writes, []);
  assert.equal(store.workflows[0].enabled, false);
});

test('--update rewrites existing templates, and --enable switches every workflow on', async () => {
  const { api, store } = fakePlunk();
  await run(api, { apply: true });
  store.writes.length = 0;
  await run(api, { apply: true, update: true, enable: true });
  assert.deepEqual(store.writes, ['PATCH /templates/:id', 'PATCH /templates/:id', 'PATCH /workflows/:id', 'PATCH /templates/:id']);
  assert.equal(store.workflows[0].enabled, true);
});

test('an email with no wait is sent straight away (no delay step)', async () => {
  const { api, store } = fakePlunk();
  const sequences = parseSequences('## Event `signed_up`\n\n### Email `welcome`\n\n**Subject:** `Welcome`\n\n```html\n<p>Hi</p><a href="{{unsubscribeUrl}}">x</a>\n```\n');
  await setup({ api, sequences, prefix: 'Pebble', marketing: config.marketing, apply: true, log: quiet });
  assert.deepEqual(store.steps.map((s) => s.type), ['SEND_EMAIL']);
});

test('a test send keeps its values off the contact', async () => {
  const { api, store } = fakePlunk();
  await api.send({ to: 'me@example.com', templateId: 'tpl_1', data: { key: 'TEST-key' } });
  assert.deepEqual(store.sent, [{ to: 'me@example.com', template: 'tpl_1', data: { key: { value: 'TEST-key', persistent: false } } }]);
});

test('the key comes from the environment first, and nothing else is accepted as Plunk’s', () => {
  assert.equal(secretKey(config, { PLUNK_SECRET_KEY: ' sk_env ' }), 'sk_env');
  assert.equal(config.secretsFile, join(dirname(CONFIG), '.env'), 'relative to the config');
  assert.equal(plunk.keyProblem('sk_x'), null);
  assert.match(plunk.keyProblem('pk_x'), /secret key/);
});

test('the secrets file: .env, .env.local or .dev.vars, as each writes it', () => {
  const read = (text) => readSecret(text, 'PLUNK_SECRET_KEY');
  assert.equal(read('PLUNK_SECRET_KEY=sk_plain'), 'sk_plain');
  assert.equal(read('export PLUNK_SECRET_KEY="sk_double"'), 'sk_double');
  assert.equal(read("PLUNK_SECRET_KEY = 'sk_single'"), 'sk_single');
  assert.equal(read('PLUNK_SECRET_KEY=sk_commented # the Halo project'), 'sk_commented');
  assert.equal(read('PLUNK_SECRET_KEY="sk_#hash"'), 'sk_#hash', 'a # inside quotes is the value');
  assert.equal(read('A=1\r\nPLUNK_SECRET_KEY=sk_crlf\r\nB=2\r\n'), 'sk_crlf');
  assert.equal(read('PLUNK_SECRET_KEY=sk_old\nPLUNK_SECRET_KEY=sk_new'), 'sk_new', 'the last one wins');
  assert.equal(read('MY_PLUNK_SECRET_KEY=sk_other\n# PLUNK_SECRET_KEY=sk_off'), '', 'another name, a commented-out line');
  assert.equal(read('PLUNK_SECRET_KEY='), '');
});

test('a config with secretsFile, or devVars (its first name), reads the key from that file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'product-emails-'));
  try {
    writeFileSync(join(dir, 'emails.md'), '');
    writeFileSync(join(dir, '.dev.vars'), 'export PLUNK_SECRET_KEY="sk_from_file"\n');
    for (const field of ['secretsFile', 'devVars']) {
      const file = join(dir, `${field}.json`);
      writeFileSync(file, JSON.stringify({ provider: 'plunk', apiUrl: 'https://plunk.test', namePrefix: 'X', templates: 'emails.md', secretEnv: 'PLUNK_SECRET_KEY', [field]: '.dev.vars' }));
      const c = loadConfig(file);
      assert.equal(c.secretsFile, join(dir, '.dev.vars'), field);
      assert.equal('devVars' in c, false);
      assert.equal(secretKey(c, {}), 'sk_from_file', field);
    }
    const bad = join(dir, 'bad.json');
    writeFileSync(bad, JSON.stringify({ provider: 'plunk', apiUrl: 'https://plunk.test', namePrefix: 'X', templates: 'emails.md', secretEnv: 'PLUNK-KEY' }));
    assert.throws(() => loadConfig(bad), /isn't an environment variable name/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
