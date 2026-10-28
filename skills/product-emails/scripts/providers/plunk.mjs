/**
 * Plunk (useplunk.com, or a self-hosted copy: github.com/useplunk/plunk), for setup.mjs and
 * doctor.mjs. providers/plunk.md says how to set the project up.
 *
 * Every adapter exports the same things (SKILL.md, "Adding a provider"):
 *   name, unsubscribe, keyProblem(key), lint(parsed), connect({ apiUrl, key, fetch }) → {
 *     checkKey(), findTemplate(name), createTemplate(t), updateTemplate(id, t),
 *     findWorkflow(name), createWorkflow({ name, event, steps }), isEnabled(w), enableWorkflow(w),
 *     send({ to, templateId, data })
 *   }
 * A template `t` is { name, subject, body, from, fromName, replyTo, kind: 'marketing' |
 * 'transactional' }; a step is { wait: { amount, unit } | null, templateId, key }. An adapter
 * whose provider can't create workflows through its API returns { manual: '…what to click…' }
 * from createWorkflow, and setup prints that.
 *
 * Plunk's management API takes the project's secret key (sk_…) as a bearer token. Template
 * and workflow names are what setup finds things by, so they must stay unique in the project.
 */

export const name = 'plunk';

/** Plunk fills this in on marketing email; every marketing body must link it. */
export const unsubscribe = '{{unsubscribeUrl}}';

export const keyProblem = (key) =>
  key.startsWith('sk_') ? null : "That isn't a Plunk secret key (sk_…): the project's Settings → API keys";

/** Plunk's own rules, on top of templates.mjs's. */
export function lint({ sequences, transactional }) {
  const problems = [];
  const warnings = [];
  for (const s of sequences) {
    for (const e of s.emails) {
      if (!e.body.includes(unsubscribe)) problems.push(`"${e.key}" is marketing email and has no ${unsubscribe} link`);
    }
  }
  for (const t of transactional) {
    // With SES click tracking on, a tracked link is rewritten through a redirect: a link that
    // carries a secret (a key, a sign-in token) must never be, or the secret passes through it.
    for (const tag of t.body.match(/<a\b[^>]*href="[^"]*\{\{[^"]*"[^>]*>/g) ?? []) {
      if (!/\bses:no-track\b/.test(tag)) warnings.push(`"${t.key}": a link built from a variable has no ses:no-track, so click tracking may rewrite it`);
    }
  }
  return { problems, warnings };
}

/** Plunk's API with the secret key. Errors name the call and status, never the key. */
export function connect({ apiUrl, key, fetch = globalThis.fetch }) {
  const call = async (method, path, body) => {
    const res = await fetch(`${apiUrl}${path}`, {
      method,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
    if (!res.ok) {
      const detail = json?.error?.message ?? json?.error ?? json?.message ?? text.slice(0, 200);
      throw new Error(`Plunk ${method} ${path.split('?')[0]} → ${res.status}${detail ? `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
    }
    return json;
  };

  /** The item with exactly this name, from a list endpoint (whatever it calls its array). */
  const findByName = async (path, wanted) => {
    const page = await call('GET', `${path}?search=${encodeURIComponent(wanted)}&pageSize=100`);
    const items = Array.isArray(page) ? page : page?.data ?? page?.items ?? page?.workflows ?? page?.templates ?? [];
    return items.find((item) => item.name === wanted) ?? null;
  };

  const payload = (t) => ({
    name: t.name,
    subject: t.subject,
    body: t.body,
    from: t.from,
    fromName: t.fromName,
    ...(t.replyTo ? { replyTo: t.replyTo } : {}),
    type: t.kind === 'transactional' ? 'TRANSACTIONAL' : 'MARKETING',
  });

  return {
    async checkKey() {
      await call('GET', '/templates?pageSize=1');
    },
    findTemplate: (wanted) => findByName('/templates', wanted),
    createTemplate: (t) => call('POST', '/templates', payload(t)),
    updateTemplate: (id, t) => call('PATCH', `/templates/${id}`, payload(t)),
    findWorkflow: (wanted) => findByName('/workflows', wanted),

    /** Created switched off, once per person; each step joins on after the last (autoConnect). */
    async createWorkflow({ name: workflowName, event, steps }) {
      const workflow = await call('POST', '/workflows', { name: workflowName, eventName: event, allowReentry: false, enabled: false });
      let y = 0;
      for (const step of steps) {
        if (step.wait) {
          y += 160;
          await call('POST', `/workflows/${workflow.id}/steps`, {
            type: 'DELAY',
            name: `Wait ${step.wait.amount} ${step.wait.unit}`,
            position: { x: 0, y },
            config: { amount: step.wait.amount, unit: step.wait.unit },
            autoConnect: true,
          });
        }
        y += 160;
        await call('POST', `/workflows/${workflow.id}/steps`, {
          type: 'SEND_EMAIL',
          name: `Send ${step.key}`,
          position: { x: 0, y },
          config: { templateId: step.templateId },
          templateId: step.templateId,
          autoConnect: true,
        });
      }
      return workflow;
    },
    isEnabled: (workflow) => Boolean(workflow?.enabled),
    enableWorkflow: (workflow) => call('PATCH', `/workflows/${workflow.id}`, { enabled: true }),

    /** One transactional email (doctor's test send); its values used for it only, not saved on the contact. */
    send: ({ to, templateId, data = {} }) =>
      call('POST', '/v1/send', { to, template: templateId, data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, { value: String(v), persistent: false }])) }),
  };
}
