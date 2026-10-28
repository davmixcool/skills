/**
 * Sending through Plunk, from the product (reference/sending.md). Runs anywhere with fetch:
 * Cloudflare Workers, Node 18+, Deno, Bun. Copy it into the product (e.g. src/providers/plunk.ts)
 * and replace `log` with the product's logger.
 *
 *   POST {apiUrl}/v1/send   { to, template, data }   Bearer sk_…  one transactional email
 *   POST {apiUrl}/v1/track  { event, email, data }   Bearer pk_…  starts the event's workflow
 *
 * Never logs a recipient, a key, a link or a body: only the outcome and Plunk's status.
 */

export interface PlunkConfig {
  /** Plunk's API: https://next-api.useplunk.com, or a self-hosted copy's. */
  apiUrl: string;
  /** The project's secret key (sk_…): sends. */
  secretKey?: string;
  /** The project's public key (pk_…): tracks events. */
  publicKey?: string;
}

const TIMEOUT_MS = 10_000;
const log = (event: string, fields: Record<string, unknown>) => console.error(JSON.stringify({ level: 'error', event, ...fields }));
const base = (c: PlunkConfig) => String(c.apiUrl ?? '').replace(/\/$/, '');

export interface PlunkEvent {
  event: string;
  email: string;
  /** Saved on the contact, and the workflow's templates' variables. Nothing secret. */
  data?: Record<string, string | number | boolean | null>;
  /** true for someone who agreed to these emails (a buyer, a signup); omit to leave it as it is. */
  subscribed?: boolean;
  /** Plunk refuses a key it has seen (409), so a retry never starts the workflow twice. */
  idempotencyKey: string;
}

/** True when Plunk has the event: accepted now, or already (409). */
export async function trackEvent(evt: PlunkEvent, c: PlunkConfig): Promise<boolean> {
  if (!base(c) || !c.publicKey) {
    log('plunk.unconfigured', { track: true });
    return false;
  }
  let response: Response;
  try {
    response = await fetch(`${base(c)}/v1/track`, {
      method: 'POST',
      headers: { authorization: `Bearer ${c.publicKey}`, 'content-type': 'application/json', 'idempotency-key': evt.idempotencyKey },
      body: JSON.stringify({
        event: evt.event,
        email: evt.email,
        ...(evt.subscribed === undefined ? {} : { subscribed: evt.subscribed }),
        ...(evt.data ? { data: evt.data } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    log('plunk.track_failed', { status: 0, plunkEvent: evt.event });
    return false;
  }
  await response.body?.cancel();
  if (response.ok || response.status === 409) return true;
  log('plunk.track_failed', { status: response.status, plunkEvent: evt.event });
  return false;
}

/** A variable used for this one email, never saved on the contact (a key, a sign-in link). */
export interface OneShot {
  value: string;
  persistent: false;
}
export const oneShot = (value: string): OneShot => ({ value, persistent: false });

export type PlunkEmail =
  | { to: string; template: string; data?: Record<string, string | OneShot> }
  | { to: string; subject: string; html: string; from: { name: string; email: string }; reply?: string };

/**
 * sent:     Plunk accepted it.
 * rejected: Plunk answered 4xx (a missing template, a bad address): worth trying another way
 *           (the inline words), never worth repeating.
 * failed:   unreachable, slow, rate limited (429), 5xx, or not set up: worth retrying later.
 */
export type SendResult = 'sent' | 'rejected' | 'failed';

/** One transactional email. */
export async function sendEmail(mail: PlunkEmail, c: PlunkConfig): Promise<SendResult> {
  if (!base(c) || !c.secretKey) {
    log('plunk.unconfigured', { send: true });
    return 'failed';
  }
  const body =
    'template' in mail
      ? { to: mail.to, template: mail.template, ...(mail.data ? { data: mail.data } : {}) }
      : { to: mail.to, subject: mail.subject, body: mail.html, from: mail.from, ...(mail.reply ? { reply: mail.reply } : {}) };
  let response: Response;
  try {
    response = await fetch(`${base(c)}/v1/send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${c.secretKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    log('plunk.send_failed', { status: 0 });
    return 'failed';
  }
  await response.body?.cancel();
  if (response.ok) return 'sent';
  log('plunk.send_failed', { status: response.status });
  return response.status >= 400 && response.status < 500 && response.status !== 429 ? 'rejected' : 'failed';
}
