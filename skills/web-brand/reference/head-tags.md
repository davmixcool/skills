# `<head>` tags, headers and structured data

Substitute `{{DOMAIN}}`, `{{NAME}}`, `{{TITLE}}`, `{{DESC}}`, `{{OG_DESC}}`,
`{{ALT}}`, `{{HANDLE}}`, `{{THEME}}` (use the config's `colors.ink`).

## Head block

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESC}}">
<meta name="theme-color" content="{{THEME}}">
<link rel="canonical" href="https://{{DOMAIN}}/">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://{{DOMAIN}}/">
<meta property="og:site_name" content="{{NAME}}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="{{TITLE}}">
<meta property="og:description" content="{{OG_DESC}}">
<meta property="og:image" content="https://{{DOMAIN}}/og.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{{ALT}}">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@{{HANDLE}}">
<meta name="twitter:title" content="{{TITLE}}">
<meta name="twitter:description" content="{{OG_DESC}}">
<meta name="twitter:image" content="https://{{DOMAIN}}/og.png">
<meta name="twitter:image:alt" content="{{ALT}}">

<!-- Icons — Google Search ignores SVG favicons, so raster sizes ship too -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

### Length targets

| Tag | Target | Why |
|---|---|---|
| `<title>` | ≤ 60 | Truncated in results beyond that |
| `meta description` | 110–160 | Under 110 wastes space, over 160 is cut |
| `og:description` | 110–160 | Same, but measured separately — audits flag them independently |

An audit reporting "description too short" *and* "too long" at once is almost
always talking about `og:description` and `meta description` respectively.
Check both before editing either.

### Never invent `twitter:site`

It attributes the page to an X account. A guessed handle credits someone
else's account. Omit the tag and ask for the handle.

## `_headers` (Cloudflare Pages / Workers static assets)

```
# Icons and social art change rarely and are fetched by crawlers often.
/favicon.ico
  Cache-Control: public, max-age=604800
/favicon.svg
  Cache-Control: public, max-age=604800
/favicon-16x16.png
  Cache-Control: public, max-age=604800
/favicon-32x32.png
  Cache-Control: public, max-age=604800
/favicon-48x48.png
  Cache-Control: public, max-age=604800
/apple-touch-icon.png
  Cache-Control: public, max-age=604800
/android-chrome-192x192.png
  Cache-Control: public, max-age=604800
/android-chrome-512x512.png
  Cache-Control: public, max-age=604800
/og.png
  Cache-Control: public, max-age=604800
/site.webmanifest
  Cache-Control: public, max-age=86400
  Content-Type: application/manifest+json
```

## JSON-LD

An `@graph` beats a bare `Organization` — it lets `WebSite` and any `Service`
reference the org by `@id` instead of repeating it.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://{{DOMAIN}}/#organization",
      "name": "{{NAME}}",
      "url": "https://{{DOMAIN}}/",
      "description": "{{DESC}}",
      "email": "hello@{{DOMAIN}}",
      "logo": {
        "@type": "ImageObject",
        "url": "https://{{DOMAIN}}/android-chrome-512x512.png",
        "width": 512,
        "height": 512
      },
      "image": "https://{{DOMAIN}}/og.png",
      "sameAs": ["https://x.com/{{HANDLE}}"]
    },
    {
      "@type": "WebSite",
      "@id": "https://{{DOMAIN}}/#website",
      "url": "https://{{DOMAIN}}/",
      "name": "{{NAME}}",
      "inLanguage": "en",
      "publisher": { "@id": "https://{{DOMAIN}}/#organization" }
    }
  ]
}
</script>
```

`sameAs` is what actually ties the domain to the social account for search
engines. `twitter:site` only affects card attribution on X. Set both.

**`email` is not a freebie.** Delete the line unless that mailbox exists and is
monitored — publishing a dead address in structured data is worse than omitting
it, and the same rule applies as to `twitter:site`: confirm, don't guess.
