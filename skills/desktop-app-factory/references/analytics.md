# Desktop Utility Analytics

## North star

The user repeatedly completes or delegates the target workflow faster because the app exists.

## Core funnel

A generic funnel:

`first_open -> core_trigger_configured -> first_successful_action -> repeated_successful_action -> trial/paywall -> paid`

Adapt names to the actual product.

## Activation

Activation should represent real value, not setup.

Examples:
- first screenshot automatically organized
- first queued task captured and resurfaced
- first clipboard transform completed
- first project workspace restored
- first batch file operation completed

## Repeat value

Useful metrics:
- successful actions per retained installation
- weekly active automations
- repeated shortcut uses
- watched-folder actions
- time-to-result
- user-confirmed time saved when measurable
- D7/D30 retained installation
- paid retention

For quiet background utilities, DAU and session length may be misleading.

## Reliability metrics

Track non-sensitive operational signals:
- trigger failure rate
- action failure rate
- permission-denied state
- updater failure state
- crash-free sessions/starts
- background process restart/failure count

Do not log sensitive payloads to get these metrics.

## Privacy rules

By default, do not send:
- clipboard contents
- file contents
- filenames or full paths
- screenshots
- terminal commands/output
- prompts/documents
- emails/message contents
- access tokens/credentials

Use coarse event metadata instead.

Example:

```text
file_action_completed
  operation_type=move
  item_count_bucket=6_10
  duration_bucket_ms=100_500
```

not the user's actual filenames.

## Telemetry must never harm the app

- Analytics, crash reporting and update checks must be non-blocking. A user
  action never waits on a telemetry write.
- The offline event queue is bounded and lossy by design. A desktop app can sit
  offline for weeks; an unbounded queue becomes a disk complaint.
- A failed telemetry write is not an error worth showing the user.
- Telemetry that the user disabled must stop at the source, not merely be
  discarded server-side.

## Cost per active user

Any app with hosted AI, sync, or a licence service has a per-user cost that
determines whether one-time pricing or a lifetime tier is survivable — the
decision `monetization.md` flags as risky without numbers.

Record for every real provider attempt, including attempts whose output was
rejected:
- feature, provider and model
- normalized token, byte, or request usage
- estimated cost from a versioned pricing constant
- outcome and typed error class

Never record the content itself. Track cost per active installation and cost per
paying customer alongside conversion; a utility can convert well and still lose
money on its heaviest users.

## Post-launch decision inputs

### Kill
- weak activation
- weak repeat usage
- no payment intent
- acquisition hook does not resonate

### Maintain
- small stable paid base
- low support burden
- modest but consistent utility usage

### Grow
- strong activation and repeated success
- acceptable conversion/economics
- clear acquisition channel

### Graduate
- strong retention
- customers ask for adjacent workflow ownership
- larger product can deepen value without destroying focus
