# da-cli 0.6.6 — Living Infrastructure

An [Adobe Edge Delivery Services](https://www.aem.live/) release site that explains da-cli as a structured operating layer around EDS. Content lives in DA; this repository owns blocks, widgets, styling, media, and verification tooling.

The package remains `0.6.5` until the manual release workflow publishes `0.6.6`. The site keeps durable product guidance separate from dated candidate qualification and from the generated receipt archive.

## Information architecture

- `/` — durable product overview
- `/workflow` — orient, source, preview, prove, publish, reconcile
- `/safety` — authority, planning, mutation, verification, and Riverboat
- `/coverage` — evidence classification and closure method
- `/reference` — current technical-reference entry point
- `/reference/0-6-6/commands` — searchable 138-path command catalog
- `/reference/0-6-6/families/*` — 24 command-family hubs
- `/reference/0-6-6/commands/*` — one canonical page per executable path
- `/release-evidence` — dated 0.6.6 qualification snapshot
- `/receipts` — generated operational archive
- `/review`, `/ledger`, `/evidence`, `/riverboat` — deeper historical records

## Design identity

The visual thesis is **bare operational structure becoming a living, evidence-bearing system**.

- `painterly-hero` uses a static first-paint poster and an optional silent Grok Imagine video enhancement. All product meaning remains in HTML.
- `dual-form` presents the same silhouette in structural and evidence-bearing states, with pointer enhancement plus explicit keyboard/touch controls.
- Wide-screen living gutters echo the paired pillar without occupying content space.
- `/widgets/operation-map` makes the six-gate lifecycle explorable.
- `/widgets/coverage-lens` renders the dated 138-path evidence field from exact HTML data.
- `command-reference` renders dense, locally filterable family and all-command ledgers.
- Reference pages add manila filing rails and keyboard-first global command search without changing the house palette.
- Existing ledger, pipeline, authority, receipt, and terminal blocks remain the proof vocabulary.

See [`DIRECTION.md`](DIRECTION.md) for visual, claim, accessibility, and performance contracts.

## Ownership layers

- **DA:** authored pages, navigation, footer, and shared content.
- **Git:** blocks, widgets, styles, media, pipelines, and versioned evidence.
- **QMD:** local receipt projection for search and recovery; never execution or release authority.

`styles/styles.css` owns tokens, typography, buttons, chips, and section composition. Block CSS is scoped to its block. `scripts/aem.js` is vendored and must not be edited.

The versioned command catalog in `data/command-reference-0.6.6.json` is a generated contract snapshot derived from the CLI's `0.6.6-r3` manifest and installed `--help`. DA remains authoritative for rendered page content; the JSON powers search and makes the 138/138 mapping independently checkable.

## Local development

```sh
npm ci
npx -y @adobe/aem-cli up
```

Always inspect the authored DOM first:

```sh
curl http://localhost:3000/index.plain.html
```

## Checks

```sh
npm run check
npm run check:reference-content # also verify the local .da authoring projection
```

## Certification

```sh
da --org somarc --repo da-cli-0-6-6 --branch main --qmd \
  --riverboat-gambler --commit \
  pipeline run certify.yaml --approve evidence-build
```

The pipeline generates `/receipts` from the local QMD receipt JSON, previews the site, audits the canonical pages, and verifies preview freshness. It does not publish live content.

## Environments

- Preview: `https://main--da-cli-0-6-6--somarc.aem.page/`
- Live: `https://main--da-cli-0-6-6--somarc.aem.live/`
