#!/usr/bin/env node
/**
 * Read an X post and its replies from a pasted link, when nothing was scouted.
 *
 *   node x-thread.mjs <x.com post URL or id> [--json]
 *
 * Prints the thread in the same shape ReplyScout's get_item gives (post, the
 * posts above it, replies, timing), as readable text or, with --json, as JSON.
 *
 * UNOFFICIAL AND BEST-EFFORT. It asks a public mirror (api.fxtwitter.com), not
 * X: X's own pages block scripts, and its API is paid. The mirror can change or
 * disappear without notice, and returns only the replies it chooses to. Prefer
 * the ReplyScout extension's "Scout this post", which reads the page the maker
 * has open. This script never posts, likes or follows anything. Node 18+, no
 * packages.
 */

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const input = args.find((a) => !a.startsWith('--'));

function fail(message) {
  console.error(`x-thread: ${message}`);
  process.exit(1);
}

if (!input) fail('give an X post URL (x.com/<handle>/status/<id>) or its id.');
const id = /^\d+$/.test(input) ? input : (/\/status(?:es)?\/(\d+)/.exec(input) || [])[1];
if (!id) fail(`not an X post: ${input}`);

const res = await fetch(`https://api.fxtwitter.com/2/conversation/${id}`, { headers: { 'user-agent': 'replyscout-skill/1.0' } })
  .catch((err) => fail(`couldn't reach the mirror (${err.message}). Ask the maker to scout the post in the extension instead.`));
if (!res.ok) fail(`the mirror answered ${res.status}. Ask the maker to scout the post in the extension instead.`);
const data = await res.json().catch(() => fail('the mirror sent something that is not JSON.'));
if (!data?.status) fail('the mirror has no post with that id (deleted, protected, or not loaded).');

const iso = (s) => (s?.created_timestamp ? new Date(s.created_timestamp * 1000).toISOString() : null);
const author = (s) => ({ handle: s?.author?.screen_name ?? '', name: s?.author?.name ?? '' });
const op = author(data.status).handle.toLowerCase();
const brief = (s) => ({
  url: s.url ?? '',
  author: author(s),
  text: s.text ?? '',
  postedAt: iso(s),
  likes: s.likes ?? null,
  isOP: author(s).handle.toLowerCase() === op,
});

const post = {
  url: data.status.url,
  author: { ...author(data.status), followers: data.status.author?.followers ?? null },
  text: data.status.text ?? '',
  postedAt: iso(data.status),
  metrics: { replies: data.status.replies ?? null, reposts: data.status.reposts ?? null, likes: data.status.likes ?? null, views: data.status.views ?? null },
};
const ancestors = (data.thread ?? []).filter((s) => s.id !== data.status.id).map(brief);
const replies = (data.replies ?? []).slice(0, 30).map(brief);

// The same rule as ReplyScout's timing (app/src/core/thread.ts).
const ageMinutes = post.postedAt ? Math.max(0, Math.round((Date.now() - Date.parse(post.postedAt)) / 60_000)) : null;
const replyCount = post.metrics.replies ?? replies.length;
const opActive = replies.some((r) => r.isOP);
let label = null;
if (ageMinutes !== null) {
  const hours = ageMinutes / 60;
  label = hours > 24 || replyCount > 200 ? 'late' : (hours <= 3 && replyCount <= 60) || (opActive && hours <= 12) ? 'hot' : 'warm';
}
const timing = label ? { label, ageMinutes, replyCount, opActive } : null;

const out = { source: 'api.fxtwitter.com (unofficial)', post, ancestors, replies, timing };

if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  const age = (m) => (m < 60 ? `${m}m` : m < 2880 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`);
  const line = (r) => `  [${r.likes ?? 0}♥] @${r.author.handle}${r.isOP ? ' (author)' : ''}: ${r.text.replace(/\s+/g, ' ').slice(0, 280)}`;
  console.log(`@${post.author.handle}${post.author.followers ? ` (${post.author.followers} followers)` : ''}: ${post.text}`);
  console.log(`${post.metrics.views ?? '?'} views · ${post.metrics.likes ?? '?'} likes · ${replyCount} replies${timing ? ` · ${timing.label}, ${age(ageMinutes)} old${opActive ? ', author is replying' : ''}` : ''}`);
  console.log(`${post.url}\n`);
  if (ancestors.length) console.log(`Above it in the thread:\n${ancestors.map(line).join('\n')}\n`);
  console.log(replies.length ? `Replies (${replies.length} shown):\n${replies.map(line).join('\n')}` : 'No replies returned.');
  console.log('\nSource: api.fxtwitter.com, an unofficial mirror. Prefer a scouted capture when there is one.');
}
