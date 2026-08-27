# Scrinly MCP Workflows

Use these sequences as tool-call patterns. Replace example values with the
user's requested target and options; never add credentials to arguments.

## Plain synchronous screenshot

Call:

```text
capture_screenshot({
  url: "https://example.com/",
  maxCredits: 1
})
```

With the default `async: false`, Scrinly submits one durable core job and waits
up to 45 seconds. If it finishes during that window, return the screenshot
`resource_link`, dimensions and hash when present, and the actual credit
settlement.

If the bounded wait ends first or status polling is interrupted, the result
includes a durable `jobId` and `pollAfterMs`. Continue with `get_job_status`; do
not submit another capture. The queue continues processing and owns the final
billing or refund even if the MCP client disconnects.

## Full-page regions

Call:

```text
capture_screenshot({
  url: "https://example.com/",
  fullPage: true,
  regions: true,
  maxCredits: 3
})
```

Return the complete screenshot plus region crop links, ordered region metadata,
coverage, and actual credits. Do not enable a Style Guide unless requested.

## Visual Style Guide

Call:

```text
capture_screenshot({
  url: "https://example.com/",
  styleGuide: true,
  maxCredits: 6
})
```

The service implies regions, full-page capture, and storage. If the user asks to
bypass prior AI output, add `regenerate: true`; leave `cache` independent. A
successful cache hit can refund part of the precharge, so report returned net
credits rather than predicting the discount.

## Asynchronous capture

1. Submit:

   ```text
   capture_screenshot({
     url: "https://example.com/",
     async: true,
     maxCredits: 1
   })
   ```

2. Retain the returned `jobId`.
3. Call `get_job_status({ jobId })`.
4. If non-terminal, wait `pollAfterMs` and repeat.
5. Stop at `completed`, `partial`, or `failed` and present the final result and
   settlement. Polling does not consume credits.

Do not confuse the MCP protocol request ID with the Scrinly `jobId`.
Explicit `async: true` returns the accepted job immediately instead of waiting
up to 45 seconds for a terminal result.

## Visual comparison

Capture the before and after states separately. Preserve each response's
`media` object and its matching `regions` manifest.

Call:

```text
compare_screenshots({
  before: {
    media: BEFORE_MEDIA,
    regions: BEFORE_REGIONS
  },
  after: {
    media: AFTER_MEDIA,
    regions: AFTER_REGIONS
  },
  mode: "perceptual",
  visualization: "overlay",
  maxCredits: 1
})
```

Use `heatmap` for contextual intensity, `mask` for binary changed pixels, or
`none` for metadata without an image. Region fields added by a Style Guide may
remain in the input; the MCP boundary ignores them and forwards only validated
geometry and hashes.

If only one valid manifest exists, omit both manifests and allow whole-image
comparison. Never pair a screenshot with regions from another capture.

## Budget-aware execution

When the user provides a budget:

1. Call `get_usage` if current allowance matters.
2. Compute the exact maximum from requested features.
3. If the maximum exceeds the user's limit, explain which add-on causes it and
   do not call the billable tool.
4. If Scrinly returns `max_credits_exceeded`, do not retry with a larger value
   without authorization.

Examples:

- Budget 1: plain screenshot or one diff.
- Budget 3: screenshot plus regions.
- Budget 6: screenshot plus Visual Style Guide.
- Budget 7: Style Guide plus separate raw design evidence.

## Partial and failed results

- Screenshot success with region failure: return the screenshot, region error,
  and the two-credit add-on refund.
- Screenshot and regions with Style Guide failure: return successful visual
  evidence, Style Guide error, and AI increment refund.
- Complete render or upload failure: return the typed error and complete refund.
- Failed asynchronous job: use the status result's settlement; do not infer it
  from the initial submission.
- Retryable error: explain retryability but wait for user authorization before
  another billable request.
