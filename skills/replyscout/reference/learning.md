# Learning from the maker, and suggesting posts

The maker sets only their voice and their interests. Everything else you learn from
what they actually wrote:
- their own posts and replies on X, which you read with `x_study_me`;
- what they posted from the board, and how they changed your drafts.

Then you suggest posts of their own.

## Studying their X (first, then weekly)

**When:** `get_profile` shows `learned.studiedAt` empty or more than 7 days old, or the
helper asks for a study-only run.

`x_study_me` reads their profile: up to 150 of their recent posts and replies, each with
`kind`, `text`, counts, and for a reply the post it answered (`inReplyTo`). It saves them,
so `learning_material` returns them later as `studied`, without reading X again.

Read them all before writing anything, then look for patterns across many posts, not one:
- **Shape:** typical length, one line or several, how they open, whether they end on a
  question.
- **Register:** case, punctuation, emoji, slang, swearing, how formal.
- **Stance:** how they agree, how they disagree, whether they joke, ask, or tell.
- **What they reply to:** which kinds of posts and people; that's where they're comfortable.
- **What landed:** likes and views compared with their usual. Which topics and angles do
  better? That steers your drafts and ideas.
- **Facts:** numbers, launches, things they built or did, in their own words.

Then `update_learned`, merging with what's there. Notes that came from their edits on the
board stay the strongest evidence, so keep them unless the posts clearly contradict them.
- **voiceNotes:** concrete patterns ("replies are one line, under 100 characters", "never
  capitalises", "opens with 'honestly'").
- **examples:** 8–12 of their own replies (and a post or two), **copied exactly**, with the
  `url`. Choose for range: agreeing, disagreeing, a joke, a tip, a question. Prefer the ones
  that did well. The extension refuses an example whose text doesn't match what they wrote.
- **topics:** what they keep posting about.
- **facts:** each with `sourceUrl`, the url of the post it came from.
- **xHandle:** `x_study_me` saves it for you.

Never learn from the posts they replied to (`inReplyTo`): that's someone else's writing,
there for context.

## Learning from the board

**When:** the first run of each day, or after 10 new posted cards (count them in
`learning_material`'s `posted`).

### 1. Read the evidence

`learning_material` returns their posted cards (`posted`), newest first. Each has the thread, the
`draftsOffered`, the one they `picked`, what they actually `posted`, and whether they
`edited` it.

**Their edits are the best evidence.** Compare `picked.text` with `posted`:
- **Length:** did they cut it? By how much? Which part: the setup, the last clause?
- **Register:** did they lowercase it, drop punctuation, add slang or emoji, or remove them?
- **Stance:** did they soften it or sharpen it? Add a question? Remove a claim?
- **Which angles they pick:** facts, jokes, questions, their own experience.
- **What they never post:** angles they keep skipping.

### 2. Update what you know

Call `update_learned`. Each list replaces the old one, so send the full list, keeping what
still holds and dropping what doesn't:
- **voiceNotes** (up to 30, short and concrete): "cuts drafts by about half", "always
  lowercase on X", "drops the last sentence", "picks questions over jokes", "never uses
  emoji". Not vague ones like "casual".
- **topics** (up to 30): what they keep joining. These widen your searches beyond their stated
  interests.
- **examples** (up to 12): keep the best from studying their X; a reply they posted from the
  board can join, with its `postedUrl`, copied exactly.
- **facts** (up to 50): true things from their **own posted text**, quoted or closely
  paraphrased. Each has the `sourceItemId` of the posted card, or the `sourceUrl` of one of
  their posts from `x_study_me`. Examples: "17 installs from one Medium article", "launched
  with no free tier". Never from a thread they replied to, never from your drafts unless
  they posted that part. The extension refuses facts without a source of their own.
- **xHandle:** their handle, if you can tell (from `yourReplies`, or the posted links).

### 3. Suggest posts of their own

Look across the threads they joined, and what they post on X (`studied`), for something
worth a post of their own:
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
- Don't suggest a post they've already made: check `studied`.
- Don't flood the board. Two ideas a day at most; skip a day if nothing stands out.
