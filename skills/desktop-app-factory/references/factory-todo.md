# Desktop App Factory — Factory TODO

Build the factory by shipping, not by creating an abstract platform.

## Phase 0 — Pick App #1
- [ ] Score 3–5 candidate utilities
- [ ] Pick one with a strong desktop-native advantage
- [ ] Write one-sentence promise
- [ ] Define target OS for first release
- [ ] Define exact V1 trigger -> action -> result

## Phase 1 — Create minimum reusable shell
- [ ] Tauri 2 project
- [ ] Vue 3 + TypeScript + Vite frontend
- [ ] app settings/about shell
- [ ] persistence layer
- [ ] telemetry wrapper
- [ ] entitlement/licensing interface
- [ ] release/version display
- [ ] error/logging foundation

Do not add tray/hotkeys/autostart/clipboard/filesystem plugins until App #1 needs them.

## Phase 2 — Build App #1 workflow
- [ ] product domain model
- [ ] primary trigger
- [ ] primary action
- [ ] success feedback
- [ ] failure/retry
- [ ] persistence/history if needed
- [ ] undo if destructive

## Phase 3 — Native reliability
- [ ] permission flow
- [ ] restart/reboot behavior
- [ ] second-instance behavior
- [ ] resource-use check
- [ ] OS edge cases

## Phase 4 — Monetization
- [ ] free/trial state
- [ ] purchase/license flow
- [ ] offline grace
- [ ] restore flow

## Phase 5 — Distribution
- [ ] signing
- [ ] packaging
- [ ] updater if required
- [ ] CI release pipeline
- [ ] clean-install matrix

## Phase 6 — Launch and learn
- [ ] landing page
- [ ] demo video/GIF
- [ ] launch channel
- [ ] analytics dashboard
- [ ] collect support issues
- [ ] post-launch decision

## Phase 7 — Extract the actual factory
Only after App #1 has real users:
- [ ] identify repeated shell code
- [ ] extract only proven reusable modules
- [ ] create product bootstrap script/template
- [ ] remove App #1 assumptions from shared code
- [ ] ship App #2 using the extracted template

## Phase 8 — Portfolio discipline
For each app:
- [ ] quarterly or milestone review
- [ ] Kill / Maintain / Grow / Graduate
- [ ] do not expand without usage/payment evidence
- [ ] keep support surface proportional to revenue
