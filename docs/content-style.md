# Content Style: Avoiding AI Writing Tells

This is the dedicated rule set for how text gets written in this
project: code comments, documentation, and (most importantly) any copy
that ends up visible on an actual page. It complements
`docs/anti-ai.md`, which covers visual patterns. This covers language.

The goal isn't to hide that AI helped write something. It's that
certain patterns are now so strongly associated with AI-generated text
that a reader notices the tell before they read the content, and on a
client-facing site, that reads as generic or unpolished regardless of
how good the underlying work is.

## Banned outright

**The em-dash (—) used as a clause separator.** This is the single
most recognizable AI writing tell in English. Use one of these
instead, picked by what the sentence actually needs:

| Instead of | Use |
|---|---|
| `X — which does Y` | `X, which does Y` |
| `X — Y follows from it` | `X. Y follows from it` (two sentences) |
| `X — specifically Y` | `X: Y` (colon, when Y explains X) |
| `X — an aside — Y` | `X (an aside) Y` (parentheses) |

A colon is the right call more often than it feels like it should be:
if the second half explains or specifies the first half, use `:`. If
the two halves are both complete thoughts, just end the sentence and
start a new one. If it's a genuine aside, parentheses read cleaner than
dashes.

**The "not X. It's Y" / "not just X, it's Y" construction.** ("This
isn't a template. It's a foundation.") Instantly recognizable, and it
almost always adds a sentence without adding information. Say what the
thing is directly, or contrast without the template: "Treat this as a
foundation, not a finished design."

**Rhetorical triplets used as filler.** Three short sentence fragments
in a row for rhythm ("Consistency. Clarity. Confidence.") without each
one carrying distinct information. A triplet is fine when all three
words are actually doing separate work; it's a tell when they're
near-synonyms stacked for cadence.

**Generic inspirational copy with no real referent**, covered in
`docs/anti-ai.md`'s Copy section: "Transform your business," "Elevate
your experience," and anything from that same drawer.

## Watch for, don't ban outright

These aren't wrong in isolation, but a page that stacks several of
them reads as AI-generated even if no single sentence does:

- Buzzwords: *seamless, leverage, elevate, unlock, empower, robust,
  cutting-edge, game-changing, synergy, holistic*. Each one is fine
  once, used precisely. A page with four of them is a tell.
- "Whether you're X or Y" as a default way to open a sentence.
- A summary paragraph that restates what was just said, especially at
  the end of a section ("In short, ..." / "Ultimately, ...").
- Excessive bold on lead-in phrases within body prose, turning
  paragraphs into a fake bullet list.

## How to check

```bash
grep -rn "—" --include="*.md" --include="*.tsx" --include="*.js" src docs *.md
```

Run this before considering any content change (copy, docs, comments)
finished. Zero results is the bar. New content should not reintroduce
what this doc removed; this isn't a one-time cleanup, it's a standing
rule enforced the same way any other Level 1 rule is (see
`docs/agent-protocol.md`).


## Line composition and isolated last words
Paragraphs use `text-wrap: pretty`; headings and display text use `text-wrap: balance`. Unsupported browsers retain normal wrapping. Preserve intentional heading breaks. For a short final phrase that must stay together, use a non-breaking space between its final two words, or `.text-nowrap` on a short span. Do not apply nowrap to whole paragraphs or long phrases; verify 320px layouts and zoom. CSS widows/orphans control fragmentation, not isolated words on screen.
