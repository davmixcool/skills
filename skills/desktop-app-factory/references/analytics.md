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
