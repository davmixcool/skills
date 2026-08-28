# Privacy and Security

## Default posture

Collect as little data as possible.

For many factory apps, the strongest privacy message is:

> Your data stays on your device unless you choose to sync it.

## Data classification

### Low sensitivity
- generic reminder title
- category
- non-identifying settings

### Potentially sensitive
- passport/visa details
- medical schedules
- financial subscriptions
- client invoices
- vehicle registration information

Treat potentially sensitive information conservatively even when not legally classified as special-category data.

## Rules

1. Store locally by default.
2. Encrypt secrets/tokens with platform secure storage.
3. Do not log document contents to analytics.
4. Do not send OCR images to third parties without clear disclosure.
5. Give users delete/export controls.
6. Request only necessary OS permissions.
7. Do not request notification permission on first launch without context.
8. Use App Transport Security / HTTPS for all remote calls.
9. Keep third-party SDK count low.
10. Document every external processor used.

## AI/OCR disclosure

If a photo/document is processed remotely, tell the user:
- what is uploaded
- why it is uploaded
- whether it is retained
- which feature depends on processing

Whenever possible, prefer on-device OCR for basic date/text extraction.

## Account strategy

Do not force accounts for local-only apps.

Add accounts only when needed for:
- cross-device sync
- family sharing
- backup
- web access

## Backup

If backup is introduced:
- encrypt in transit
- design deletion
- define retention
- avoid collecting fields that are not essential
