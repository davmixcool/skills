# Scrinly MCP Tool Contract

Use this reference when exact inputs, defaults, output structure, or constraints
matter. The production beta exposes exactly four tools.

## `capture_screenshot`

Required:

- `url`: public HTTP(S) URL, at most 2,048 characters, without embedded
  credentials.
- `maxCredits`: integer from 1 through 100.

Optional inputs:

| Field | Type and default | Constraints or meaning |
| --- | --- | --- |
| `device` | string | Public preset such as `macbook-pro-14`, `ipad-air`, or `iphone-15`; cannot accompany custom dimensions |
| `width`, `height` | integers | Supply together; width 100–3,840 and height 100–2,160 |
| `fullPage` | boolean, `false` | Capture the verified finite full document |
| `format` | `jpg` or `png`, `jpg` | Stored image format |
| `quality` | integer, `80` | 1–100 |
| `theme` | `light` or `dark`, `light` | Browser color-scheme preference |
| `timeout` | integer, `30` | 10–60 seconds |
| `waitUntil` | enum, `networkidle2` | `load`, `domcontentloaded`, `networkidle0`, or `networkidle2` |
| `blockCookieBanners` | boolean, `true` | Public cleanup option |
| `blockAds` | boolean, `true` | Public cleanup option |
| `blockChatWidgets` | boolean, `true` | Public cleanup option |
| `blockPopups` | boolean, `true` | Public cleanup option |
| `blockAccessibilityWidgets` | boolean, `true` | Public cleanup option |
| `hideSelectors` | string array | At most 50 non-empty selectors; each at most 500 characters |
| `regions` | boolean, `false` | Add ordered model-sized crops; implies full-page storage in the core API |
| `design` | boolean, `false` | Add deterministic raw design evidence |
| `styleGuide` | boolean, `false` | Add the model-generated Visual Style Guide; implies regions |
| `regenerate` | boolean, `false` | Bypass only the Style Guide cache; requires `styleGuide: true` |
| `cache` | boolean, `false` | Opt into screenshot-cache reads and writes |
| `async` | boolean, `false` | `false` waits up to 45 seconds on one durable queued job; `true` returns the accepted job immediately |

The MCP server always forces stored JSON output under its controlled
`mcp/screenshots` prefix and requests direct storage location metadata. It strips
`maxCredits` before calling the core API.

Maximum credit calculation:

```text
screenshot             1
raw design evidence   +1
regions               +2
Visual Style Guide    +3  (and regions are implied)
```

## `compare_screenshots`

Required:

- `before.media.url` and `after.media.url`: public HTTPS JPEG or PNG URLs
  without embedded credentials. Pass the returned Scrinly `media` objects when
  available.
- `maxCredits`: use `1`.

Optional:

- `before.regions`, `after.regions`: the matching `regions-v1` manifests.
- `mode`: `perceptual` by default or `pixel`.
- `visualization`: `overlay` by default, `heatmap`, `mask`, or `none`.
- `async`: `false` by default.

The two screenshots must have equal width; different full-page heights are
supported. The MCP server sanitizes manifests down to geometry and hashes and
stores any visualization under `mcp/diffs` with a direct provider URL.

## `get_job_status`

Input:

- `jobId`: UUID returned by an asynchronous capture or diff.

The tool is free and account-scoped. Cross-account or unknown IDs remain `404`.
Non-terminal results include `pollAfterMs`; terminal states are `completed`,
`partial`, and `failed`.

A default `async: false` capture can also return a non-terminal `jobId` when its
45-second wait expires or status polling is interrupted. Resume that same job
with this tool. Never repeat the original billable call merely because it did
not finish within the MCP request.

## `get_usage`

Input is an empty object. The tool is free and returns the authenticated
account's safe plan, credit totals, remaining allowance, period start, and active
state. It does not return the account email or identifier.

## Result envelope

Successful tool calls return:

- concise text content;
- `resource_link` blocks for direct JPEG or PNG assets; and
- `structuredContent` containing `operation`, `httpStatus`, normalized `status`,
  pricing version, optional maximum credits or polling interval, and the safe
  core `result`.

For capture, a terminal result uses the familiar completed or failed capture
shape. A non-terminal result includes the durable `jobId` and `pollAfterMs`.
Once the core accepts the job, its queue owns final credit settlement regardless
of MCP client connectivity.

The safe result removes account identity, credentials, page request URL, headers,
cookies, storage credentials, and webhook data. Typed direct image URLs remain
because they are required for viewing and comparison.

Failures set `isError: true` and retain a safe typed error code, message,
retryability, validation fields, and settlement when supplied by the core API.
The MCP spend guard uses `max_credits_exceeded` with `requiredCredits` and
`maxCredits` and calls no billable route.
