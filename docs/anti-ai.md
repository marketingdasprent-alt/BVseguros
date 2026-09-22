# Anti-AI Design Rules

This covers visual patterns. For writing and copy, see
`docs/content-style.md`.

The goal here isn't to ban a visual trend. It's to stop decisions from
getting made *automatically*: picked because they're the statistical
average of every AI-generated site, not because they solve this
project's problem. A blue-to-violet gradient hero isn't wrong because
gradients are wrong; it's wrong when it's the reflexive default instead
of a considered choice.

## The design decision test

Before adding any visual element, answer:

1. What problem does it solve?
2. Does it improve hierarchy?
3. Does it improve comprehension?
4. Does it improve navigation?
5. Does it reinforce this project's identity specifically?
6. …or does it exist only because it looks nice in isolation?

If the honest answer is #6, reconsider or cut it.

## Default to avoiding, unless the project genuinely calls for it

- Generic blue/violet gradients as the default brand treatment
- Glow effects and gratuitous glassmorphism/blur
- Border-radius maxed out on every single element
- Wrapping every piece of content in a card "because that's what a
  card grid looks like"
- Icons inside circles as decoration rather than to convey meaning
- Pills and badges with no functional purpose
- Gradient-text headlines with no reason for the gradient
- A Hero centered because nobody considered anything else: consider
  asymmetric composition. (This project's own structural centering
  system, `docs/design-system.md#global-centering`, is the opposite
  case: a centered default that was actually decided on and documented
  in `DECISIONS.md`, not defaulted into.)
- Decorative blobs, particle fields, floating shapes with no relation
  to content
- Three-card grids as the default answer to "we have three things to
  say"
- Decorative `01 / 02 / 03` numbering that isn't actually structural
- A CTA block at the end of every single section
- Animation on every element, all the time, regardless of whether it
  communicates anything
- Reflexive perfect symmetry
- Emoji as a substitute for icons or hierarchy
- Layouts that are structurally identical section after section

None of these are permanently forbidden: see the Override System in
`DECISIONS.md` §30. A glassmorphic panel might be exactly right for a
glass-product landing page. The point is that the choice is *made*, not
defaulted into.

## Copy

Avoid filler copy that could belong to any company in any industry:

> "Transforme o seu negócio." / "Elevate your experience." /
> "The future starts here." / "Discover new possibilities."

If there's no real content yet, use a placeholder that's honest about
being a placeholder (see Content Integrity below) rather than reaching
for inspirational-poster language to fill the space.

## Content integrity

Never invent, on behalf of a project:

- clients, testimonials, or reviews
- awards or certifications
- partners
- statistics ("10,000+ happy customers")
- years of experience or founding dates
- headcount or other company numbers

When the real information isn't available yet, mark the placeholder as
a placeholder: visibly, not disguised as real content a reader could
mistake for fact.

A concrete case worth internalizing: a client site needed to describe
service categories run by third-party platforms the client integrates
with. It would have been easy to list plausible-sounding category names
and requirements from general knowledge. Instead, each category traced to
a real, cited source, unconfirmed or platform-specific numbers were left
out entirely rather than approximated, and the copy said outright that
commercial availability was pending confirmation instead of implying it
was already offered. The same standard applies to anything a project
presents as fact about a third party, a partner integration, or a
service tier it doesn't fully control: cite it, or mark it pending, never
infer it.

## What to prioritize instead

Intention. Personality. Real hierarchy driven by actual content
importance. Contrast that means something. Whitespace used for rhythm,
not left over. Composition that can be asymmetric when the content
benefits from it. Decisions you could defend in a design review.
