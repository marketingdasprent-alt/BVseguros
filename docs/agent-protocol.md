# AI Agent Operating Protocol

Any agent (human or AI) working in this codebase should follow this
sequence. It exists to prevent the two failure modes that make
AI-assisted codebases unmaintainable: silent scope creep, and
regressions introduced while "helping."

## Before making a change

1. Read `BLUEPRINT.md` for the project's structural decisions.
2. Read the relevant doc in `docs/` for the area you're touching
   (`design-system.md` for tokens/components, `responsive.md` for
   breakpoints, `accessibility.md` for a11y requirements, `anti-ai.md`
   before adding any new visual pattern, `lessons-learned.md` before
   touching deployment config, forms, consent/analytics, or i18n).
3. Inspect the current implementation of anything you're about to
   touch or replace: don't assume from the docs alone; the code is
   the source of truth for current behavior.
4. Identify components that already exist and could be reused or
   extended before writing a new one (`REUSE → EXTEND → CREATE`).
5. Identify the exact tokens involved: don't introduce a new spacing
   or color value if an existing token is a reasonable fit.
6. Check `package.json` before adding a dependency: is this solvable
   with what's already installed, or with a small amount of native
   CSS/JS?
7. Write down (even just to yourself) the exact scope of the request.
   "Update the Services cards" means the Services cards: not the
   Header, not global tokens, not unrelated sections.

## While making the change

8. Reuse before creating.
9. Preserve existing behavior for anything outside the stated scope.
10. Don't touch files or components outside the identified scope, even
    if you notice something else you'd change: flag it instead (see
    `DECISIONS.md`'s Override System for how to document an
    intentional exception).
11. Don't introduce arbitrary values (`padding: 37px`): use a token,
    or add a new token to the scale with a reason if the scale
    genuinely needs one.
12. Don't add a dependency without a stated justification: a comment
    or `DECISIONS.md` entry saying what problem it solves that native
    browser APIs / React / existing code couldn't.

## After making the change

13. Run the app and actually exercise the change (`npm run dev`): a
    diff that looks right is not the same as behavior that is right.
14. Check responsive behavior at least at the mobile and desktop ends
    of the QA breakpoints in `docs/responsive.md`.
15. Check accessibility for anything interactive: keyboard reachable,
    visible focus, labeled.
15a. Verify interactive CSS states (hover, focus-visible, an open/closed
    toggle) by actually triggering them, real pointer movement or
    keyboard focus, then reading the computed style, not by eyeballing
    a single static screenshot. A screenshot taken mid-transition, or of
    the wrong element, reads as correct when the underlying rule is
    wrong; a genuinely triggered state doesn't lie.
16. Check the browser console for errors/warnings introduced.
17. Check for regressions in adjacent, unrelated areas: did a global
    token change ripple somewhere unintended?
18. State exactly what changed, in scope terms matching the original
    request: not a vaguer "improved the page."

## The Rule of Permanence

A local change must never modify global decisions or unrelated
components without explicit authorization or a documented, comprovable
technical need. "While I was in there" is not a reason to touch the
Header, the Footer, global tokens, typography, breakpoints, or other
sections when the request was about one card grid.
