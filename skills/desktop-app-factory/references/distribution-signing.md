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

### Hosting the feed

An update feed is a signed manifest plus artifact URLs. Object storage with a
CDN in front is enough; application compute should not sit in the download path
and pay for the bandwidth.

Keep the manifest and the artifacts on the same versioning discipline, and treat
the endpoint as part of the release contract — changing its shape breaks every
client already in the field, which is the population you cannot update.

### Released artifacts are immutable

A published version is evidence that a specific set of bytes was signed and
distributed. Once a client has seen it, those bytes cannot change.

- Never overwrite an artifact at an existing version key. Re-uploading a
  "fixed" 1.2.0 leaves some users with bytes that no longer match the signature
  or the manifest others received, and the failure appears days later as
  unexplained update errors.
- Ship a new version number instead. Version numbers are cheap; silent
  divergence is not.
- Prefer content-addressed or version-pinned keys so an accidental re-upload
  cannot collide with a released one.
- Keep prior versions available and their manifests intact. Users skipping
  releases, and rollback, both need them.
- Deletion must be version-aware and deliberate. Retain the identifiers the
  storage provider needs for cleanup; a URL alone is not enough.
- Record the digest, size and signature of every published artifact, and verify
  a downloaded update against them before applying it.

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

Harden the pipeline itself, because it holds the signing identity:
- pin the runtime version rather than tracking a moving tag
- install dependencies cleanly from the lockfile
- default workflow permissions to read-only, widening only for the job that
  publishes
- run the full test suite and a build dry-run before any signing step
- never echo secret values, and never let a build log include a signing key path
  with its contents

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
- license check while offline, and past the grace window
- uninstall/reinstall
- settings/data persistence expectations
- downgrade to the previous version against a database written by the new one

## Current-information rule

Signing, notarization, store, and updater requirements change. Verify official Tauri and platform documentation when implementing them.
