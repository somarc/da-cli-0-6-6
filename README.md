# da-cli 0.6.6 — The Outer Loop

An [Adobe Edge Delivery Services](https://www.aem.live/) site documenting the
release-ready da-cli 0.6.6 candidate. Content lives in DA; this repository is
the code side — design system, blocks, and local verification fixtures.

The package remains `0.6.5` until the manual release workflow publishes
`0.6.6`. The site therefore distinguishes candidate qualification from npm,
Git tag, GitHub Release, and post-publication verification.

## Release identity

0.6.6 is the candidate that answered an independent, twin-agent, evidence-only
head-to-head review of da-cli 0.6.5 against the official `@adobe/aem-cli`.
The review's central discovery: these CLIs occupy **two different loops
around the same site**. The official CLI owns the inner render loop; da-cli
owns the **outer operations loop** — orient, source, preview, prove, publish,
reconcile. One CLI renders; the other operates.

The review also found mirrored flaws on both sides — "proof nobody got a
pass." 0.6.6's governing invariant is what it did with its own scars:

> **Every scar becomes a gate.**

Each actionable finding became a structural refusal rather than a one-time
patch: the packed tarball installs from extraction under test, shipped-doc
links must resolve inside the tarball, and the field-evidence budget refuses a
release whose unobserved command surface grows. The 2026-09-05 field run then
raised retained observation from 15/138 command paths (10.9%) to 61/138
(44.2%), including required-destructive coverage from 2/31 to 10/31. The
honest aggregate verdict remains `partial`: 71 paths are still unobserved.

Final candidate `b10bfcb9c29499b4ee5464f6a5e0d66e7ed34c03` is bound by the
evidence-only `7815a4463ab96d85f60ed035afbe0e9e25a6610d` main commit. The
qualification suite passed with 1,559 tests, one intentional skip, zero
failures, and zero production audit findings. CodeQL and npm provenance remain
explicitly armed behind repository visibility; bus factor remains open.

## Design identity

Inherits the 0.6.5 Receipt Ledger system — paper + ink, one accent, one
stamp, hairline rules, monospace evidence, perforation not decoration — and
extends it with the outer-loop motif:

- **Two orbits.** A tight inner ring (the render loop) and a wide deliberate
  outer ring (the operations loop) with six gate glyphs at each boundary
  crossing. Drawn with CSS/SVG, not images.
- **Scar stamps.** The shared `.chip` vocabulary gains the ledger states
  HEALED, FENCED, ARMED, OPEN. An `OPEN` scar is set with the same
  typographic dignity as a `HEALED` one — that is the brand.
- **Evidence field.** One visible mark for each of the 138 classified command
  paths makes the 15 → 61 observation gain—and the 71 remaining gaps—legible
  without laundering `partial` into green.
- **Authority lanes.** DA, Git, and QMD are shown as separate surfaces so
  content, implementation, and local evidence never borrow one another's
  authority.

## Ownership layers

See `AGENTS.md`. In brief: `styles/styles.css` owns tokens, base typography,
shared `.button`/`.chip`, and section-level composition; block CSS owns only
its own block's internals scoped to `.blockname`; `scripts/chip-state.js` is
the shared state-word-to-chip utility.

## Local verification

`drafts/preview/*.html` fixtures replicate the authored `plain.html` DOM for
every block inside a real `<main>`, loading the real `scripts/aem.js` +
`scripts/scripts.js` + `styles/styles.css` so decoration actually runs. They
are excluded from the published site via `.hlxignore`.

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

```sh
npx -y @adobe/aem-cli up
```

## Certification

```sh
da --org somarc --repo da-cli-0-6-6 --branch main --qmd \
  --riverboat-gambler --commit \
  pipeline run certify.yaml --approve evidence-build
```

Evidence in, page out: the pipeline renders `/receipts` from the QMD vault's
receipt JSON and previews + audits every page. No hand-written history.

## Environments

- Preview: `https://main--da-cli-0-6-6--somarc.aem.page/`
- Live: `https://main--da-cli-0-6-6--somarc.aem.live/`
