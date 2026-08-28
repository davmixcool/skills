# New Desktop App Checklist

## Problem
- [ ] One specific target user
- [ ] One recurring computer annoyance
- [ ] Current workaround documented
- [ ] Frequency/consequence understood
- [ ] Desktop-native advantage explicit
- [ ] 5–10 second demo hook exists

## V1
- [ ] One primary trigger
- [ ] One primary action/result
- [ ] First value with minimal setup
- [ ] No unnecessary account/backend
- [ ] “Later” list written
- [ ] “Not now” list written

## Native integrations
- [ ] Only necessary plugins/integrations included
- [ ] Permissions scoped narrowly
- [ ] Permission-denied states handled
- [ ] Shortcut conflicts handled if applicable
- [ ] Autostart is opt-in if applicable
- [ ] Tray close/quit behavior defined if applicable
- [ ] File operations are recoverable if destructive
- [ ] Clipboard monitoring disclosed if applicable
- [ ] Watcher restart/failure behavior defined if applicable
- [ ] Single-instance behavior defined if applicable

## Reliability
- [ ] Restart/crash recovery tested
- [ ] Offline behavior tested
- [ ] Failure states visible
- [ ] Undo/retry where appropriate
- [ ] Resource use is reasonable

## Monetization
- [ ] Trial/free experience demonstrates value
- [ ] Purchase model matches ongoing cost
- [ ] Offline licensing behavior defined
- [ ] Restore/reinstall behavior tested

## Analytics/privacy
- [ ] Activation event represents real success
- [ ] Repeat-value event exists
- [ ] No sensitive payloads in analytics
- [ ] Logs are redacted
- [ ] Privacy disclosures match behavior

## Distribution
- [ ] Target OSes selected
- [ ] App identifier/versioning set
- [ ] Icons/metadata ready
- [ ] Signing configured
- [ ] macOS notarization/store path tested if relevant
- [ ] Windows signing/installer path tested if relevant
- [ ] Updater tested from previous release if used
- [ ] Clean install tested
- [ ] Uninstall/reinstall tested
- [ ] No published version key has ever been overwritten with new bytes
- [ ] Licence check tested offline, and past the grace window
- [ ] Repeating an interrupted automation does not duplicate its effect
- [ ] No provider key present in the shipped binary or its config

## Review questions

Answer concretely before shipping. A question without an answer is unfinished
work, not a detail.

- [ ] What happens when each remote dependency fails independently?
- [ ] Can every mutation be retried safely?
- [ ] Can a late webhook revoke access granted by a newer event?
- [ ] What is authoritative for entitlement, and for how long offline?
- [ ] Can a user downgrade without corrupting the database the new version wrote?
- [ ] Does this version change the meaning of data written by the previous one?

## Launch
- [ ] Landing page
- [ ] Short visual demo
- [ ] One primary acquisition channel
- [ ] Pricing clear
- [ ] Support/contact path
- [ ] Kill / Maintain / Grow / Graduate review date set
