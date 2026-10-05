# Learning from the maker, and suggesting posts

The maker sets only their voice and their interests. Everything else you learn from
what they actually posted, and from how they changed your drafts. Then you suggest
posts of their own.

**When:** the first run of each day, or after 10 new posted cards (count them in
`learning_material`).

## 1. Read the evidence

`learning_material` returns their posted cards, newest first. Each has the thread, the
`draftsOffered`, the one they `picked`, what they actually `posted`, and whether they
`edited` it.

**Their edits are the best evidence.** Compare `picked.text` with `posted`:
- **Length:** did they cut it? By how much? Which part: the setup, the last clause?
- **Register:** did they lowercase it, drop punctuation, add slang or emoji, or remove them?
- **Stance:** did they soften it or sharpen it? Add a question? Remove a claim?
- **Which angles they pick:** facts, jokes, questions, their own experience.
- **What they never post:** angles they keep skipping.

## 2. Update what you know

Call `update_learned`. Each list replaces the old one, so send the full list, keeping what
still holds and dropping what doesn't:
- **voiceNotes** (up to 30, short and concrete): "cuts drafts by about half", "always
  lowercase on X", "drops the last sentence", "picks questions over jokes", "never uses
  emoji". Not vague ones like "casual".
- **topics** (up to 30): what they keep joining. These widen your searches beyond their stated
  interests.
- **facts** (up to 50): true things from their **own posted text**, quoted or closely
  paraphrased, each with the `sourceItemId` of the posted card. Examples: "17 installs from
  one Medium article", "launched with no free tier". Never from a thread they replied to,
  never from your drafts unless they posted that part. The extension refuses facts without
  a posted source.
- **xHandle:** their handle, if you can tell (from `yourReplies`, or the posted links).

## 3. Suggest posts of their own

Look across the threads they joined for something worth a post of their own:
- a question several threads asked, that they could answer;
- a take they keep making in replies;
- a tip they keep giving;
- a number or story from their facts that fits a topic people keep discussing.

Call `add_ideas` with up to 2 ideas a day. Each has:
- **why:** what it comes from, specifically ("three threads this week asked how to find a
  lost tab; you answered two of them");
- **drafts:** 1–3, in their voice, as different angles (a tip, a story, a question to their
  followers).

Ideas land in Backlog marked "Idea". The maker approves and posts them like replies. No
links, no product pitch, facts only from their own posts.

## What not to do

- Don't change their voice or interests (the extension refuses). Add notes instead.
- Don't learn from cards they closed, or from Todo cards they haven't posted.
- Don't flood the board. Two ideas a day at most; skip a day if nothing stands out.
