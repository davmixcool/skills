# Desktop Utility Privacy & Security

Desktop apps can touch unusually sensitive local data. Treat permissions as product design.

## General defaults

- local-first processing
- minimum permissions
- explicit disclosure
- no sensitive payload analytics
- secure storage for secrets
- user-controlled disable/delete
- least-privilege Tauri capabilities

## Clipboard

If reading clipboard continuously:
- tell the user clearly
- explain what is stored and where
- allow pause/disable
- provide clear history controls
- avoid transmitting contents remotely by default

## Filesystem

- prefer user-selected paths
- avoid whole-disk access
- validate canonical paths
- avoid path traversal bugs
- preview destructive operations
- use recoverable deletion when possible
- preserve a history of automated changes when useful

## Shell/process execution

Treat all frontend/user input as untrusted.

Prefer structured commands:

```text
program: git
args: ["status", "--short"]
```

Avoid:

```text
shell("git " + userInput)
```

Restrict executable allowlists where possible.

## Secrets

Store tokens/API keys in platform-appropriate secure storage when possible. Do not keep production secrets in plain config, frontend bundles, analytics, or logs.

## Browser/app integrations

OAuth tokens and imported data should be scoped narrowly. Ask only for permissions required by the current feature.

## Remote AI

If local content is sent to an AI/API provider:
- disclose that processing is remote
- specify which feature causes transmission
- send only necessary context
- avoid hidden background uploads
- make local-only behavior clear where offered

## Local AI

Local processing improves privacy but still requires:
- model provenance/update strategy
- disk-space disclosure
- resource-use expectations
- safe model/cache deletion

## Tauri capability design

For each window/webview/plugin:
1. list required commands
2. scope files/URLs/actions
3. remove unused permissions
4. validate inputs again in privileged Rust/native code

A capability file is not a substitute for input validation.

## Logs

Use structured, redacted logs.

Never log credentials, clipboard bodies, full document text, or sensitive path contents just because debug logging is enabled.
