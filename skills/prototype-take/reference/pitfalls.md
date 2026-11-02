# Pitfalls

Each of these happened on a real take.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Motion stutters, or jumps between frames | The page ran in real time while frames took longer than a frame to capture | The virtual clock (built in): timers, animation frames, CSS/Web animations, videos and images all follow it |
| A video in the page is frozen or out of time | Videos play on their own clock | Built in: each is paused and seeked to the clock every frame, waiting for the seek |
| A click does nothing | The pointer was off-screen (the camera had moved away), so the event landed outside the page | Keep the pointer in frame for every click: pin the camera (`focus`) or move it first |
| The menu bar (or a button near an edge) is off-frame in 16:9 | A frame wider than the stage crops its top and bottom | `extend: true`, and draw the wallpaper and menu bar past the stage's sides in `setup` |
| The pointer clicks the wrong place after the camera moves | The prototype maps clientX/Y to its stage with its own scale and offset | `camera.apply` sets them too, or the prototype uses getBoundingClientRect |
| Typing empties the results while it types | The prototype re-animates its results on every key, faster than they land | Fine at typing speed only if results update in place; otherwise have the take's `setup` hold the results until the last key (`afterFrame`) |
| A caption flashes as the pointer sweeps over things | Hover captions show at once | Hide them in `afterFrame` while `__take.moving`, so they show once the pointer rests |
| ⌘⇧4 or ⌘W in the prototype does nothing, or closes the tab | macOS and the browser take them before the page | Give the prototype its own (⌥⇧4, a close button); show any keycaps in the take |
| `Chrome didn't start` | Another take holds the port | `--port 9341` |
| Chrome hangs on a screenshot | It shared a profile with a running Chrome | The script gives Chrome its own throwaway profile; do the same in any other headless call |
| A take no longer matches its posted video | The prototype changed after the take was filmed | Keep take-only changes in `setup` and `scripts`; before re-posting, render stills at the posted moments and compare |
| The take's settings differ from the prototype's defaults | The browser kept earlier settings | `storage` sets them before the page loads |
| Something that should happen after an animation never does (a paste, a step) | The prototype waits on an animation's `finished` promise; the take pauses every animation and steps it by hand, and a paused animation never finishes | In the prototype, follow an animation with a `setTimeout` of its length instead (the clock runs timers) |
| A held shortcut (hold ⌥, move, let go) can't be scripted with `press` | `press` is a key going down and up at once | `keydown` … `keyup` around the moves; a held modifier rides on every event in between |
| A silent take does poorly on TikTok | TikTok pushes videos with sound | The standalone cut gets the film's track: `--music` |
