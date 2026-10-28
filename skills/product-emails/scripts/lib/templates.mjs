/**
 * Reads a product's emails file (reference/emails-file.md): the sequences, each an event and the
 * emails it sends in order, and the transactional templates the product sends by id.
 *
 *   ## Event `purchased`                 a sequence: one workflow per event
 *   ### Email `tips`                     its emails, in order
 *   **Wait:** `2 days`                   before this one (optional: none sends at once)
 *   **Subject:** `…`
 *   ```html … ```
 *
 *   ## Transactional emails
 *   ### Template `licence`
 *   **Var:** `PLUNK_LICENCE_TEMPLATE`    where the product reads the template's id
 *   **Subject:** / **From:** / **From name:** / **Reply-to:**
 *   ```html … ```
 *
 * Plain functions on the file's text: nothing here talks to a provider.
 */

const TRANSACTIONAL = /^## Transactional emails[^\n]*$/m;
const UNITS = { minute: 'minutes', minutes: 'minutes', hour: 'hours', hours: 'hours', day: 'days', days: 'days' };

/** A `**Label:** `value`` line's value, under any of its names. */
function field(text, ...labels) {
  for (const label of labels) {
    const match = new RegExp(`^\\*\\*${label}:\\*\\* \`([^\`]+)\``, 'm').exec(text);
    if (match) return match[1].trim();
  }
  return undefined;
}

/** The first ```html block. */
const htmlBody = (text) => /```html\n([\s\S]*?)\n```/.exec(text)?.[1];

/** "2 days" → { amount: 2, unit: 'days' }; nothing, or 0, → null (send at once). */
export function parseWait(text) {
  if (text === undefined) return null;
  const match = /^(\d+) (minutes?|hours?|days?)$/.exec(text);
  if (!match) throw new Error(`"${text}" isn't a wait; write it like "2 days", "6 hours" or "30 minutes"`);
  const amount = Number(match[1]);
  return amount > 0 ? { amount, unit: UNITS[match[2]] } : null;
}

/** The sequences: [{ event, emails: [{ key, wait, subject, body }] }]. */
export function parseSequences(md) {
  const sections = md.split(TRANSACTIONAL)[0].split(/^## (?:\d+\. )?Event `/m).slice(1);
  return sections.map((section) => {
    const event = section.slice(0, section.indexOf('`'));
    const emails = section.split(/^### Email `/m).slice(1).map((part) => {
      const key = part.slice(0, part.indexOf('`'));
      const subject = field(part, 'Subject');
      const body = htmlBody(part);
      if (!key || !subject || !body) {
        throw new Error(`The email "${key || '?'}" of event "${event || '?'}" needs a **Subject:** and an \`\`\`html body`);
      }
      return { key, wait: parseWait(field(part, 'Wait')), subject, body };
    });
    if (!event || !emails.length) throw new Error(`The event "${event || '?'}" has no emails (### Email \`key\`)`);
    return { event, emails };
  });
}

/**
 * The transactional templates: [{ key, envVar, subject, from, fromName, replyTo, body }].
 * `defaults` fills in the sender fields a template leaves out (the config's `transactional`).
 */
export function parseTransactional(md, defaults = {}) {
  const part = md.split(TRANSACTIONAL)[1];
  if (!part) return [];
  return part.split(/^### Template `/m).slice(1).map((section) => {
    const key = section.slice(0, section.indexOf('`'));
    const t = {
      key,
      envVar: field(section, 'Var', 'Wrangler var', 'Env var'),
      subject: field(section, 'Subject'),
      from: field(section, 'From') ?? defaults.from,
      fromName: field(section, 'From name') ?? defaults.fromName,
      replyTo: field(section, 'Reply-to') ?? defaults.replyTo,
      body: htmlBody(section),
    };
    const missing = Object.entries(t).filter(([name, v]) => !v && name !== 'replyTo').map(([name]) => name);
    if (missing.length) throw new Error(`The transactional template "${key || '?'}" is missing: ${missing.join(', ')}`);
    return t;
  });
}

/** Every `{{name}}` a body uses, in order, once each. */
export const variables = (body) => [...new Set([...body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]))];

/**
 * What would go wrong in the inbox: problems (stop) and warnings (say). `provider.lint` adds the
 * provider's own rules (its unsubscribe variable, its click tracking).
 */
export function lint({ sequences, transactional }, provider) {
  const problems = [];
  const warnings = [];
  const keys = new Set();
  const events = new Set();
  for (const s of sequences) {
    if (events.has(s.event)) problems.push(`Event "${s.event}" appears twice: one workflow per event`);
    events.add(s.event);
    for (const e of s.emails) {
      if (keys.has(e.key)) problems.push(`Email key "${e.key}" is used twice: template names must be unique`);
      keys.add(e.key);
    }
  }
  const vars = new Set();
  for (const t of transactional) {
    if (keys.has(t.key)) problems.push(`Template key "${t.key}" is used twice: template names must be unique`);
    keys.add(t.key);
    if (vars.has(t.envVar)) problems.push(`Var "${t.envVar}" names two templates`);
    vars.add(t.envVar);
    if (!/^[A-Z][A-Z0-9_]*$/.test(t.envVar)) warnings.push(`Var "${t.envVar}" isn't an UPPER_SNAKE name; deploy tools expect one`);
  }
  const extra = provider?.lint?.({ sequences, transactional }) ?? { problems: [], warnings: [] };
  return { problems: [...problems, ...extra.problems], warnings: [...warnings, ...extra.warnings] };
}
