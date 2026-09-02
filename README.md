# da-cli 0.6.6 — The Outer Loop

An [Adobe Edge Delivery Services](https://www.aem.live/) site celebrating the
da-cli 0.6.6 release. Content lives in DA; this repository is the code side —
design system, blocks, and local verification fixtures.

## Release identity

0.6.6 is the release that answered an independent, twin-agent, evidence-only
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
release whose unobserved command surface grows. The credential helper is pinned
to an immutable commit, while CodeQL and npm provenance remain explicitly armed
behind repository visibility. The bus-factor finding remains open. This site is
the proof ledger for that honest state. Its certification adds real operational
receipts without pretending those receipts alone close the rubric's retained
field-evidence backlog.

## Design identity

Inherits the 0.6.5 Receipt Ledger system — paper + ink, one accent, one
stamp, hairline rules, monospace evidence, perforation not decoration — and
extends it with the outer-loop motif:

- **Two orbits.** A tight inner ring (the render loop) and a wide deliberate
  outer ring (the operations loop) with gate glyphs at each boundary
  crossing. Drawn with CSS/SVG, not images.
- **Scar stamps.** The shared `.chip` vocabulary gains the ledger states
  HEALED, FENCED, ARMED, OPEN. An `OPEN` scar is set with the same
  typographic dignity as a `HEALED` one — that is the brand.

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
