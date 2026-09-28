---
name: scrinly
description: Use Scrinly's remote MCP server to capture, inspect, compare, crop, resize, or encode stored webpage screenshots and regions, poll jobs, and inspect credits. Use for webpage visual evidence, Visual Style Guides, visual diffs, or deterministic transformations of an existing Scrinly screenshotId. Not for local image editing, arbitrary image uploads, or reconstructing webpages.
---

# Scrinly

Use Scrinly as the visual-evidence service. Preserve its stored results and
credit settlement; do not recreate browser, diff, storage, or billing behavior
locally.

## Start safely

1. Confirm the Scrinly MCP server is connected. Let the MCP client supply its
   bearer credential; never request, echo, or place an API key in tool arguments.
2. Treat `capture_screenshot`, `compare_screenshots`, and `transform_screenshot` as billable. Call them
   only when the user requested the operation or clearly authorized it.
3. Add only the capabilities the user requested. Do not silently enable regions,
   design evidence, a Style Guide, multiple devices, or repeated captures.
4. Set `maxCredits` to the exact maximum implied by the selected features. Do
   not use a needlessly high ceiling.
5. Use `get_usage` before billable work when the user asks about affordability,
   provides a budget, or available credits may affect the workflow.

## Select the tool

| Need | Tool | Charge |
| --- | --- | ---: |
| Capture and store a webpage image | `capture_screenshot` | 1+ credits |
| Compare two stored screenshots | `compare_screenshots` | 1 credit |
| Transform an existing screenshot or region | `transform_screenshot` | 1 per new output |
| Poll an asynchronous capture, diff, or transform | `get_job_status` | Free |
| Read current allowance and usage | `get_usage` | Free |

Use these maximums for `capture_screenshot`:

| Requested evidence | `maxCredits` |
| --- | ---: |
| Screenshot | 1 |
| Screenshot + raw design evidence | 2 |
| Screenshot + regions | 3 |
| Screenshot + regions + raw design evidence | 4 |
| Screenshot + Visual Style Guide | 6 |
| Screenshot + Visual Style Guide + raw design evidence | 7 |

A Style Guide already implies regions. `compare_screenshots` always requires
`maxCredits: 1`. Cache hits may reduce the eventual Style Guide charge, but the
spend guard still requires the maximum generation amount.

Read [reference/tool-contract.md](reference/tool-contract.md) before choosing
less common capture fields or when exact validation limits matter.

## Capture visual evidence

1. Choose one device preset or one complete `width`/`height` pair, never both.
2. Use `fullPage: true` only when the complete document is needed. Use
   `regions: true` when a long page should be returned as ordered, model-sized
   crops.
3. Use `design: true` for deterministic structured design evidence. Use
   `styleGuide: true` only when the user wants the model-generated Visual Style
   Guide. Use `regenerate: true` only with `styleGuide: true` and only when the
   user explicitly wants a fresh AI result.
4. Use `cache: true` only when the user accepts screenshot-cache reuse.
   `regenerate` bypasses the Style Guide cache, not the screenshot cache.
5. Use `async: false` by default. Scrinly submits one durable core job and waits
   for up to 45 seconds. A terminal result keeps the normal capture shape; a
   non-terminal result includes a `jobId` and `pollAfterMs`.
6. If a capture returns a `jobId`, retain it and call `get_job_status`. Never
   repeat `capture_screenshot` for that attempt. Use `async: true` only when the
   caller wants the accepted job returned immediately.
7. Return the direct `resource_link` artifacts and summarize dimensions,
   evidence components, terminal status, and actual `charged`, `refunded`, and
   `net` credits. Do not replace direct storage delivery with a proxy or base64.

Treat a partial add-on failure as a usable result when the primary screenshot
exists. Report the screenshot, any successful regions, the typed component
error, and the refund instead of describing the entire capture as failed.

## Transform existing screenshots

Reuse an account-owned `screenshotId` and its manifest when available. Do not
capture again just to crop, resize, or change encoding. Select actual region/part
IDs from the manifest; never invent IDs or bounds. Missing or expired references
need separately authorized recapture, not automatic retries.

Read [reference/tool-contract.md](reference/tool-contract.md) for transform inputs
and [reference/workflows.md](reference/workflows.md) for examples. The 24 MP / 8 MiB
limit applies to the whole screenshot for original-pixel selectors. If the discovered
schema supports `stored-part`, an eligible saved crop can be used explicitly from an
oversized parent. Explain the encoded-crop tradeoff; never silently substitute it.
If no eligible supported source exists, ask before recapturing. `contain` can add
padding; `cover` can remove content. Neither creates new page detail or responsive
layouts. No semantic focus or natural-language planning is available.

Set `maxCredits` to the output count, including when `cache:true` is enabled.
Verified hits and failed outputs refund their reservations; report actual credits
and preserve successful siblings. Retain asset IDs, provenance, and original expiry.
Poll the same accepted job after the bounded wait; never resubmit after disconnect.
OAuth requires `transforms:write`; ask for reauthorization if absent, never try to
bypass it. If the tool is not deployed/discoverable yet, report that limitation.

## Poll asynchronous work

1. Retain the `jobId` returned by the billable tool, whether it came from an
   explicit asynchronous request or the bounded wait for `async: false`.
2. Call `get_job_status` with that exact ID.
3. For a non-terminal result, wait for the returned `pollAfterMs` value before
   polling again. The current suggested interval is three seconds.
4. Stop on `completed`, `partial`, or `failed`. Do not poll a terminal job.
5. Present the final result and settlement from the status response. Polling is
   free and must never be counted as another capture or diff.

The core queue owns final billing and refunds after it accepts a job. A client
disconnect or interrupted bounded wait is not authorization to resubmit the
billable operation.

Read [reference/workflows.md](reference/workflows.md) for complete synchronous,
asynchronous, Style Guide, and diff sequences.

## Compare screenshots

1. Use the `media` object from each stored Scrinly capture. Pass the matching
   `regions-v1` or `regions-v2` manifest from the same response when both captures have one.
2. Never mix a region manifest with a different screenshot. The screenshot hash
   is an integrity boundary, not a hint.
3. Use `perceptual` for human-facing visual regression work and `pixel` when
   exact encoded-pixel differences are required.
4. Choose one visualization:
   - `overlay` for localized annotations on the newer screenshot;
   - `heatmap` for contextual change intensity;
   - `mask` for machine-readable changed pixels; or
   - `none` for metadata only.
5. Return the requested visualization link when present, plus similarity,
   changed-pixel metrics, bounds, region results, and the one-credit settlement.

If valid manifests are unavailable, allow the service to perform whole-image
comparison and report that region matching was unavailable. Do not invent region
alignment locally.

## Respect the beta boundary

Do not attempt to pass any of the following through the MCP tools:

- page headers, cookies, or authenticated-page credentials;
- click actions;
- OpenAI or other provider keys;
- customer storage credentials or overrides;
- webhook URLs or secrets;
- provider, model, endpoint, or internal-route overrides; or
- API keys in URLs, arguments, cookies, files, logs, or responses.

Targets must be publicly accessible HTTP(S) pages accepted by Scrinly's URL
policy. Diff inputs must be public HTTPS JPEG or PNG assets. Returned direct
storage URLs are evidence-bearing artifacts; disclose them only where the user
asked for the result.

## Handle errors without hidden retries

- For `max_credits_exceeded`, remove an unrequested add-on or ask the user to
  authorize the exact required ceiling. The rejection costs zero credits.
- For a retryable provider or render error, preserve any successful partial
  result and settlement. Do not automatically repeat a billable call.
- For `diff_source_hash_mismatch`, recapture the affected state and keep each
  returned `media` object paired with its own manifest. Never weaken validation.
- For unbounded or incomplete full-page capture, report the typed failure and
  refund. Do not repeatedly retry an infinite or unstable page.
- For an authentication failure, ask the user to configure or replace the key in
  their MCP client—not in the conversation or tool arguments.

Always lead with the delivered result, then state actual net credits and any
typed partial error. Never claim a cache discount before the returned settlement
confirms it.
