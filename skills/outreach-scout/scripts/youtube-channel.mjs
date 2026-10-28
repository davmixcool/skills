#!/usr/bin/env node
// What a YouTube channel's public pages say about it: name, handle, subscribers, videos, country,
// the links it lists, and any email shown openly on its About page.
//
//   node scripts/youtube-channel.mjs <@handle | channel URL | video URL> [more…]
//
// Public pages only, no login, one request per channel (two for a video link). YouTube's pages
// change; anything not found comes back null rather than guessed. Status to stderr, JSON to stdout.
const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/youtube-channel.mjs <@handle | channel URL | video URL> [more…]');
  process.exit(2);
}

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  // YouTube's consent screen, already answered (no tracking choice is made by this).
  cookie: 'SOCS=CAI; CONSENT=YES+cb',
};

async function get(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.text();
}

// A video link: its channel, from the public oEmbed endpoint.
async function channelFor(arg) {
  if (/^@[\w.-]+$/.test(arg)) return `https://www.youtube.com/${arg}`;
  if (/youtube\.com\/(@|channel\/|c\/|user\/)/.test(arg)) return arg.replace(/\/(about|videos|featured|shorts)\/?$/, '').replace(/\?.*$/, '');
  if (/youtu\.be\/|youtube\.com\/(watch|shorts\/)/.test(arg)) {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(arg)}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`oEmbed: ${res.status}`);
    const o = await res.json();
    return { channel: o.author_url, video: { title: o.title, url: arg } };
  }
  throw new Error('not a YouTube handle, channel or video link');
}

const pick = (text, re) => {
  const m = text.match(re);
  if (!m) return null;
  try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
};

async function describe(arg) {
  const found = await channelFor(arg);
  const channel = typeof found === 'string' ? found : found.channel;
  const page = await get(`${channel}/about`);
  // The channel's own About data (other channels' counts appear earlier on the page as
  // objects; the channel's own are plain strings in its About section).
  const about = page.slice(Math.max(0, page.indexOf('aboutChannelViewModel')));
  const links = [...about.matchAll(/channelExternalLinkViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*)"\},"link":\{"content":"((?:[^"\\]|\\.)*)"/g)]
    .map((m) => ({ title: JSON.parse(`"${m[1]}"`), url: JSON.parse(`"${m[2]}"`) }));
  const emails = [...new Set((about.slice(0, 60000).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])
    .filter((e) => !/(youtube|google|gstatic|ggpht|example)\./i.test(e)))];
  return {
    input: arg,
    channel,
    name: pick(page, /<meta property="og:title" content="([^"]+)"/) ?? pick(page, /"channelMetadataRenderer":\{"title":"((?:[^"\\]|\\.)*)"/),
    handle: pick(page, /"canonicalBaseUrl":"\/(@[^"]+)"/),
    subscribers: pick(about, /"subscriberCountText":"((?:[^"\\]|\\.)*)"/),
    videos: pick(about, /"videoCountText":"((?:[^"\\]|\\.)*)"/),
    country: pick(about, /"country":"((?:[^"\\]|\\.)*)"/),
    links,
    emails,
    businessEmailBehindSignIn: /signInForBusinessEmail|View email address/.test(about),
    video: typeof found === 'string' ? null : found.video,
  };
}

const results = [];
for (const arg of args) {
  try {
    console.error(`Reading ${arg}…`);
    results.push(await describe(arg));
  } catch (e) {
    console.error(`  ${arg}: ${e.message}`);
    results.push({ input: arg, error: e.message });
  }
}
console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
