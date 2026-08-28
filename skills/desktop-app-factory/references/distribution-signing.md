# Desktop Distribution, Signing & Updates

Treat release infrastructure as part of V1.

## Decide distribution route early

Possible routes include:
- direct download from product website
- macOS App Store
- Microsoft Store
- Linux package channels

The chosen route affects sandboxing, signing, entitlements, updater behavior, and checkout/licensing.

## macOS

Plan for:
- Developer signing identity
- notarization for direct distribution where required
- entitlements/sandbox constraints for App Store distribution
- DMG/app bundle packaging
- permission prompts and accessibility/automation entitlements if the product needs them

Do not wait until launch day to discover that a native integration conflicts with sandboxing.

## Windows

Plan for:
- installer type
- code signing
- WebView runtime assumptions/configuration
- Microsoft Store requirements if using the store
- SmartScreen/reputation implications for unsigned/new binaries

## Linux

Choose only the packaging formats needed by the audience. Every additional format increases test/support surface.

## Updates

If using an updater:
- use the current official Tauri updater guidance
- sign/verify update artifacts as required
- keep updater credentials/signing keys out of source control
- define release channel and endpoint
- test update from the previous production version
- handle interrupted/failed update safely

## CI/CD

A release pipeline should eventually automate:
- frontend build
- Rust/Tauri build
- tests/checks
- per-platform packaging
- signing/notarization
- artifact publication
- update metadata generation

Store secrets in CI secret management, not the repository.

## Release test matrix

Before release test:
- clean install
- first run
- permission prompts
- close vs quit
- tray behavior
- autostart enable/disable if present
- second-instance behavior if present
- upgrade from previous version
- offline launch
- license restore/refresh
- uninstall/reinstall
- settings/data persistence expectations

## Current-information rule

Signing, notarization, store, and updater requirements change. Verify official Tauri and platform documentation when implementing them.
