#!/usr/bin/env node
/**
 * Creates a product's emails in its email provider from the emails file (the one place the words
 * live): each sequence's templates and its workflow (wait, send, wait, send…), and the
 * transactional templates the product sends by id.
 *
 *   node setup.mjs --config emails.config.json                    # preview: changes nothing
 *   node setup.mjs --config emails.config.json --apply            # create what's missing (workflows off)
 *   node setup.mjs --config emails.config.json --apply --enable   # and switch every workflow on
 *   node setup.mjs --config emails.config.json --apply --enable-new  # switch on only the ones made now
 *   node setup.mjs --config emails.config.json --apply --update   # also rewrite existing templates' words
 *
 * Progress goes to stderr; stdout gets one JSON line, {"templates": {"<VAR>": "<id>"}}, the
 * transactional templates' ids by the var the product reads them from, so a deploy can pass them
 * on (reference/deploy.md) and no id is ever pasted by hand.
 *
 * Safe to run again: a template or workflow that exists (by name, "<namePrefix>: <key>") is left
 * alone, and a workflow's steps are written only when it's created. Workflows are created off;
 * --enable-new switches on only those it just made, so one switched off on purpose stays off.
 * --update overwrites words edited in the provider's dashboard: a deploy never passes it.
 *
 * The secret key comes from the environment variable the config names (or its secretsFile) and
 * is never printed. Node 18+.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadConfig, loadProvider, secretKey } from './lib/config.mjs';
import { lint, parseSequences, parseTransactional } from './lib/templates.mjs';

/** Creates (with apply) or reports one template; returns it, or null for one a preview would create. */
async function ensureTemplate(api, template, { apply, update, log, note = '' }) {
  let found = await api.findTemplate(template.name);
  if (!found) {
    log(`${apply ? '+ creating' : '+ would create'} template "${template.name}"${note}`);
    if (apply) found = await api.createTemplate(template);
  } else if (update) {
    log(`${apply ? '~ updating' : '~ would update'} template "${template.name}"`);
    if (apply) await api.updateTemplate(found.id, template);
  } else {
    log(`= template "${template.name}" exists`);
  }
  return found;
}

const describe = (step) => `${step.wait ? `wait ${step.wait.amount} ${step.wait.unit}, ` : ''}send "${step.name}"`;

/**
 * Plans and, with apply, does it, one log line per thing. Returns the transactional templates'
 * ids by var (none for one a preview would only create).
 */
export async function setup({ api, sequences, transactional = [], prefix, marketing, apply = false, enable = false, enableNew = false, update = false, log = console.error }) {
  const named = (key) => `${prefix}: ${key}`;
  const manual = [];

  for (const sequence of sequences) {
    if (!marketing?.from || !marketing?.fromName) throw new Error('The config needs marketing.from and marketing.fromName for the sequences');
    const steps = [];
    for (const email of sequence.emails) {
      const template = { name: named(email.key), subject: email.subject, body: email.body, ...marketing, kind: 'marketing' };
      const found = await ensureTemplate(api, template, { apply, update, log });
      steps.push({ wait: email.wait, templateId: found?.id ?? null, key: email.key, name: template.name });
    }

    const workflowName = named(sequence.event);
    let workflow = await api.findWorkflow(workflowName);
    const isNew = !workflow;
    if (!workflow) {
      log(`${apply ? '+ creating' : '+ would create'} workflow "${workflowName}" (event "${sequence.event}", once per person: ${steps.map(describe).join(', then ')})`);
      if (apply) {
        workflow = await api.createWorkflow({ name: workflowName, event: sequence.event, steps });
        if (workflow?.manual) {
          manual.push(`${workflowName}: ${workflow.manual}`);
          workflow = null;
        }
      }
    } else {
      log(`= workflow "${workflowName}" exists, ${api.isEnabled(workflow) ? 'on' : 'off'}`);
    }

    if ((enable || (enableNew && isNew)) && workflow && !api.isEnabled(workflow)) {
      log(`${apply ? '● switching on' : '● would switch on'} workflow "${workflowName}"`);
      if (apply) await api.enableWorkflow(workflow);
    }
  }

  const ids = {};
  for (const t of transactional) {
    const template = { name: named(t.key), subject: t.subject, body: t.body, from: t.from, fromName: t.fromName, replyTo: t.replyTo, kind: 'transactional' };
    const found = await ensureTemplate(api, template, { apply, update, log, note: ' (transactional: the product sends it by id)' });
    if (!found) {
      log(`  ${t.envVar}: run with --apply to create it and get its id`);
      continue;
    }
    ids[t.envVar] = found.id;
    log(`  ${t.envVar}=${found.id}`);
  }

  for (const line of manual) log(`! by hand: ${line}`);
  return ids;
}

/** The file, read and checked: throws on a problem, logs the warnings. */
export function readEmails(config, provider, log = console.error) {
  const md = readFileSync(config.templates, 'utf8');
  const parsed = { sequences: parseSequences(md), transactional: parseTransactional(md, config.transactional) };
  const { problems, warnings } = lint(parsed, provider);
  for (const w of warnings) log(`warning: ${w}`);
  if (problems.length) throw new Error(`The emails file has problems:\n  - ${problems.join('\n  - ')}`);
  return parsed;
}

function args(argv) {
  const value = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
  return {
    config: value('--config') ?? 'emails.config.json',
    apply: argv.includes('--apply'),
    enable: argv.includes('--enable'),
    enableNew: argv.includes('--enable-new'),
    update: argv.includes('--update'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

async function main() {
  const opts = args(process.argv.slice(2));
  if (opts.help) {
    console.error('Usage: node setup.mjs [--config emails.config.json] [--apply] [--enable | --enable-new] [--update]');
    return;
  }
  const config = loadConfig(opts.config);
  const provider = await loadProvider(config.provider);
  const parsed = readEmails(config, provider);
  const key = secretKey(config);
  if (!key) throw new Error(`Set ${config.secretEnv} to the ${config.provider} project's secret key${config.secretsFile ? ` (or put it in ${config.secretsFile})` : ''}`);
  const problem = provider.keyProblem(key);
  if (problem) throw new Error(problem);

  const count = parsed.sequences.reduce((n, s) => n + s.emails.length, 0) + parsed.transactional.length;
  console.error(`${count} emails, ${parsed.sequences.length} workflow(s); ${config.provider} at ${config.apiUrl}${opts.apply ? '' : ' (preview: nothing changes)'}\n`);
  const api = provider.connect({ apiUrl: config.apiUrl, key });
  const ids = await setup({ api, ...parsed, prefix: config.namePrefix, marketing: config.marketing, ...opts });
  console.error(opts.apply ? `\nDone.${config.dashboardUrl ? ` Check them at ${config.dashboardUrl}.` : ''}` : '\nRun again with --apply to do it.');
  console.log(JSON.stringify({ templates: ids }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(`\n${err.message}`);
    process.exit(1);
  });
}
