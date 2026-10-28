#!/usr/bin/env node
/**
 * Checks a product's emails end to end, changing nothing: the config, the emails file (and its
 * lint), that the secret key works, and that every template and workflow the file describes
 * exists in the provider (and whether each workflow is on). With --send, sends one transactional
 * template to an address you own, its variables filled with sample values: the one check that
 * proves the sending domain is verified and the template renders.
 *
 *   node doctor.mjs --config emails.config.json
 *   node doctor.mjs --config emails.config.json --send licence --to you@example.com
 *
 * Progress goes to stderr; stdout gets one JSON line: { ok, problems, warnings, templates,
 * workflows, sent }. The key is never printed. Exits 1 when anything is wrong.
 */
import { loadConfig, loadProvider, secretKey } from './lib/config.mjs';
import { variables } from './lib/templates.mjs';
import { readEmails } from './setup.mjs';

const argv = process.argv.slice(2);
const value = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };

async function main() {
  const report = { ok: false, problems: [], warnings: [], templates: {}, workflows: {}, sent: null };
  const say = (line) => console.error(line);
  const finish = () => {
    report.ok = report.problems.length === 0;
    say(report.ok ? '\nAll good.' : `\n${report.problems.length} problem(s):\n  - ${report.problems.join('\n  - ')}`);
    console.log(JSON.stringify(report));
    process.exit(report.ok ? 0 : 1);
  };

  let config, provider, parsed;
  try {
    config = loadConfig(value('--config') ?? 'emails.config.json');
    provider = await loadProvider(config.provider);
    parsed = readEmails(config, provider, (w) => report.warnings.push(w.replace(/^warning: /, '')));
  } catch (err) {
    report.problems.push(err.message);
    return finish();
  }
  say(`✓ config and emails file (${config.provider}, "${config.namePrefix}: …")`);
  for (const w of report.warnings) say(`  warning: ${w}`);

  const key = secretKey(config);
  const keyProblem = !key ? `${config.secretEnv} isn't set` : provider.keyProblem(key);
  if (keyProblem) {
    report.problems.push(keyProblem);
    return finish();
  }
  const api = provider.connect({ apiUrl: config.apiUrl, key });
  try {
    await api.checkKey();
    say(`✓ the key works at ${config.apiUrl}`);
  } catch (err) {
    report.problems.push(`The key doesn't work: ${err.message}`);
    return finish();
  }

  const named = (k) => `${config.namePrefix}: ${k}`;
  for (const s of parsed.sequences) {
    for (const e of s.emails) {
      const found = await api.findTemplate(named(e.key));
      report.templates[named(e.key)] = found?.id ?? null;
      if (!found) report.problems.push(`Template "${named(e.key)}" doesn't exist yet (run setup.mjs --apply)`);
    }
    const workflow = await api.findWorkflow(named(s.event));
    const on = workflow ? api.isEnabled(workflow) : false;
    report.workflows[named(s.event)] = workflow ? (on ? 'on' : 'off') : 'missing';
    if (!workflow) report.problems.push(`Workflow "${named(s.event)}" doesn't exist yet (run setup.mjs --apply)`);
    else if (!on) report.warnings.push(`Workflow "${named(s.event)}" is off: its event starts nothing`);
    say(`${workflow ? (on ? '✓' : '·') : '✗'} workflow "${named(s.event)}" ${report.workflows[named(s.event)]}`);
  }
  for (const t of parsed.transactional) {
    const found = await api.findTemplate(named(t.key));
    report.templates[named(t.key)] = found?.id ?? null;
    if (!found) report.problems.push(`Template "${named(t.key)}" doesn't exist yet (run setup.mjs --apply)`);
    say(`${found ? '✓' : '✗'} transactional "${named(t.key)}"${found ? ` → ${t.envVar}=${found.id}` : ''}`);
  }

  const which = value('--send');
  if (which) {
    const to = value('--to') ?? '';
    const t = parsed.transactional.find((x) => x.key === which || x.envVar === which);
    const id = t && report.templates[named(t.key)];
    if (!t) report.problems.push(`No transactional template "${which}" in the emails file`);
    else if (!to.includes('@')) report.problems.push('--send needs --to <an address you own>');
    else if (!id) report.problems.push(`"${named(t.key)}" must exist before it can be sent`);
    else {
      // Sample values, marked as tests (the adapter keeps them off the contact).
      const data = Object.fromEntries(variables(t.body).map((v) => [v, `TEST-${v}`]));
      try {
        await api.send({ to, templateId: id, data });
        report.sent = { template: named(t.key) };
        say(`✓ sent "${named(t.key)}": check that inbox (and its spam folder), and the sender shown`);
      } catch (err) {
        report.problems.push(`The test send failed: ${err.message}`);
      }
    }
  }
  finish();
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
