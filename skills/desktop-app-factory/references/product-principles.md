# Desktop App Factory — Product Principles

## The core opportunity

Desktop utilities win when they remove a recurring annoyance that happens while the user is already working on a computer.

The factory pattern is:

`recurring friction -> trigger/context -> action -> result -> repeated time saved`

A good factory app should make the user think:

> “I used to do this manually all the time. Now I do not think about it.”

## Strong desktop-native reasons to exist

A desktop app is justified when it benefits materially from one or more of:
- menu bar/system tray presence
- global keyboard shortcuts
- local filesystem access
- drag/drop and file association
- clipboard access
- native notifications
- window management/always-on-top/overlay behavior
- local database/state
- offline processing
- native menus
- autostart/background presence
- single-instance behavior
- integration with installed apps or local developer tools
- low-latency local AI/model execution

If the experience works equally well as a website and gains little from desktop access, score it down.

## Good pain categories

### 1. Repeated micro-friction
Something costs 10–90 seconds and happens many times per week.

Examples:
- renaming/moving screenshots
- transforming clipboard content
- reopening the same project tools
- finding a recent file
- switching dev environments

### 2. Waiting/follow-up friction
The computer can remember a future action or unresolved dependency.

Examples:
- remind me about this file later
- follow up on a proposal
- surface a saved AI task when I return to a project

### 3. Context-reconstruction friction
The user repeatedly rebuilds context.

Examples:
- reopen project tabs/terminals/apps
- pre-meeting context bundle
- restore a task workspace

### 4. Local organization friction
Information already exists on the computer but is hard to manage.

Examples:
- screenshots
- downloads
- clipboard history
- local notes/snippets

### 5. Local transformation friction
A small transformation is repeated often.

Examples:
- resize/convert media
- clean copied text
- extract structured data
- batch rename files
- format JSON/CSV

## The one-sentence test

The app should be explainable without feature lists.

Strong:
- “Press one shortcut to park what you want AI to do later.”
- “Your Downloads folder organizes itself.”
- “Find any screenshot by what is inside it.”
- “Turn anything you copy into clean Markdown.”

Weak:
- “An AI-powered productivity workspace with automations, notes, and collaboration.”

## Time-to-value

The first session should ideally be:
1. install
2. grant one necessary permission if needed
3. perform the core workflow
4. see a useful result

Avoid long onboarding, account creation, workspace setup, templates, teams, or settings before first value.

## Local-first advantage

Prefer local-first when possible because it improves:
- speed
- privacy
- offline behavior
- operating cost
- trust
- simplicity

A backend is justified for concrete capabilities such as:
- cloud sync
- collaboration
- hosted AI
- remote integrations
- licensing/account entitlements
- shared state across machines

## Earn background presence

A desktop app that runs all day is occupying attention, CPU/memory, startup time, permissions, and trust.

Only stay resident when continuous availability is part of the promise. Otherwise prefer launch-on-demand.

## Automation confidence

The more autonomous the app becomes, the more users need:
- previews
- undo
- history
- clear status
- failure messages
- scoped permissions
- the ability to pause/disable

## Factory discipline

Do not start with “what shared framework can I build?”

Start with App #1. Extract shared code only after it survives a real product.

Likely reusable modules include:
- app shell
- settings
- update checks
- licensing
- analytics wrapper
- native notifications wrapper
- tray/menu primitives
- global shortcut manager
- local persistence abstraction
- permissions/capabilities checklist
- crash/logging infrastructure

Do not assume product-specific workflow logic belongs in the shared layer.
