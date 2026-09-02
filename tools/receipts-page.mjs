#!/usr/bin/env node
// Generate the /receipts page for the da-cli 0.6.6 proof site from the local
// QMD vault. This is the site's one riverboat step: it reads receipt JSON
// (never terminal logs, never prose) and renders DA-ready HTML. Receipts are
// evidence, so the page is generated — a hand-written receipts page would be
// exactly the drift this release exists to eliminate.
//
// The page tells the certification story in data, not adjectives:
//   1. The arc — every pipeline.run receipt on a rail, refusals and green
//      runs in original order, with a generated verdict.
//   2. The anatomy — what a green run actually does, rendered from the
//      checked-in certify.yaml, never from prose.
//   3. The full ledger — every receipt, oldest first, scars kept.
//
// Usage: node tools/receipts-page.mjs [--vault <root>] [--site <org/repo>]
//        [--out <file>] [--pipeline <certify.yaml>] [--limit <n>]

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
function argOf(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const vaultRoot = argOf('--vault', join(os.homedir(), 'vaults', 'da-ecosystem'));
const site = argOf('--site', 'somarc/da-cli-0-6-6');
const out = argOf('--out', join(process.cwd(), '.da', 'out', 'receipts.html'));
const pipelineFile = argOf('--pipeline', join(process.cwd(), 'certify.yaml'));
const limit = Number(argOf('--limit', '40'));

function* walkReceipts(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkReceipts(p);
    else if (e.name === 'receipt.json') yield p;
  }
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (iso) => `${String(iso).replace('T', ' ').slice(0, 19)}Z`;

// NOTE: no authored <span class="chip"> anywhere — DA content round-trips
// through markdown, which strips spans. Outcome words are emitted as plain
// leading text ("failed — …"); the pipeline block lifts them into chips.

// ---------------------------------------------------------------------------
// Evidence in: vault receipts for this site, oldest first.
// ---------------------------------------------------------------------------
const siteDir = join(vaultRoot, 'sites', ...site.split('/'), 'receipts');
const receipts = [...walkReceipts(siteDir)]
  .map((p) => JSON.parse(readFileSync(p, 'utf8')))
  .sort((a, b) => String(a.timing.startedAt).localeCompare(String(b.timing.startedAt)));

const counts = { completed: 0, failed: 0, refused: 0, cancelled: 0, partial: 0, indeterminate: 0 };
const modes = { 'read-only': 0, 'dry-run': 0, commit: 0 };
for (const r of receipts) {
  counts[r.outcome.state] = (counts[r.outcome.state] ?? 0) + 1;
  modes[r.command.mode] = (modes[r.command.mode] ?? 0) + 1;
}

// ---------------------------------------------------------------------------
// The certification arc: every pipeline.run receipt, in order.
// ---------------------------------------------------------------------------
const runs = receipts.filter((r) => r.command.operation === 'pipeline.run');
const latestRun = runs.at(-1);
const green = latestRun?.outcome.state === 'completed';
const scars = runs.filter((r) => r.outcome.state !== 'completed').length;

const verdictHeading = runs.length === 0
  ? 'Certification: not yet on record'
  : (green ? 'Certification: green' : `Certification: ${latestRun.outcome.state}`);

let verdictLead;
if (runs.length === 0) {
  verdictLead = 'No pipeline run has journaled a receipt for this site yet.';
} else if (green && scars > 0) {
  verdictLead = `${runs.length} certification runs are on record. The latest <strong>completed</strong> at ${esc(fmt(latestRun.timing.startedAt))} — and the ${scars === 1 ? 'refusal' : `${scars} refusals`} that came before it ${scars === 1 ? 'stays' : 'stay'} on the rail beneath it, in original order. Kept scars, green ending.`;
} else if (green) {
  verdictLead = `${runs.length === 1 ? 'One certification run is' : `${runs.length} certification runs are`} on record; the latest <strong>completed</strong> at ${esc(fmt(latestRun.timing.startedAt))}.`;
} else {
  verdictLead = `The latest certification run <strong>${esc(latestRun.outcome.state)}</strong> at ${esc(fmt(latestRun.timing.startedAt))}. That verdict stands until a green run lands beside it.`;
}

function runRow(r) {
  const o = r.outcome;
  const bits = [
    `exit ${esc(o.exitCode ?? '—')}`,
    `${esc(r.timing.durationMs)} ms`,
    `mode ${esc(r.command.mode)}`,
  ];
  if (o.errorCodes?.length) bits.push(`codes: ${esc(o.errorCodes.join(', '))}`);
  return `        <div>
          <div>${esc(fmt(r.timing.startedAt))}</div>
          <div><p>${esc(o.state)} — ${bits.join(' · ')}</p><p><em>receipt ${esc(r.receiptId)}</em></p></div>
        </div>`;
}

const terseRefusal = runs.some((r) => r.outcome.state !== 'completed'
  && (r.outcome.errorCodes ?? []).includes('command-failed'));

const arcSection = `    <div>
      <div class="section-metadata"><div><div>style</div><div>stub</div></div></div>
      <h2>${esc(verdictHeading)}</h2>
      <p>${verdictLead}</p>
${runs.length ? `      <div class="pipeline">
${runs.map(runRow).join('\n')}
      </div>` : ''}
${terseRefusal ? `      <div class="callout">
        <div>
          <div>WHY SO TERSE?</div>
          <div>The refusal receipt above names only <code>command-failed</code> — no cause, no step id. Fail-closed refusals are correct; refusals that cannot explain themselves are a bug. That evidence gap was filed as <a href="https://github.com/somarc/da-cli/issues/178">da-cli#178</a>, straight from this ledger.</div>
        </div>
      </div>` : ''}
      <div class="callout">
        <div>
          <div>ONE RUN BEHIND</div>
          <div>By construction, this page cannot contain the receipt of the run that rendered it — that receipt reaches the vault only after this HTML exists. The rail above always ends one certification behind the vault. The vault, not this page, is the authority.</div>
        </div>
      </div>
    </div>`;

// ---------------------------------------------------------------------------
// The anatomy: what a green run does, rendered from the checked-in pipeline.
// ---------------------------------------------------------------------------
const DA_GRAMMAR = /^(auth|audit|code|config|content|deploy|index|job|migrate|pipeline|preview|publish|route|site|sitemap|stardust|up|workspace)\b/;

function parsePipeline(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return { name: null, steps: [] }; }
  const name = text.match(/^name:\s*(\S+)/m)?.[1] ?? null;
  const steps = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const id = line.match(/^\s*-\s*id:\s*(\S+)/);
    if (id) { cur = { id: id[1], command: '', deps: [], timeout: null, approval: false }; steps.push(cur); continue; }
    if (!cur) continue;
    const cmd = line.match(/^\s*command:\s*(.+)$/);
    if (cmd) { cur.command = cmd[1].trim(); continue; }
    const deps = line.match(/^\s*depends_on:\s*\[(.*)\]/);
    if (deps) { cur.deps = deps[1].split(',').map((s) => s.trim()).filter(Boolean); continue; }
    const timeout = line.match(/^\s*timeout:\s*(\S+)/);
    if (timeout) { cur.timeout = timeout[1]; continue; }
    if (/^\s*requires_approval:\s*true/.test(line)) cur.approval = true;
  }
  return { name, steps };
}

const pipeline = parsePipeline(pipelineFile);
const shellSteps = pipeline.steps.filter((s) => !DA_GRAMMAR.test(s.command));
const daSteps = pipeline.steps.length - shellSteps.length;
const nPreview = pipeline.steps.filter((s) => /^preview\b/.test(s.command)).length;
const nAudit = pipeline.steps.filter((s) => /^audit\b/.test(s.command)).length;
const nPut = pipeline.steps.filter((s) => /^content put\b/.test(s.command)).length;
const nFresh = pipeline.steps.filter((s) => /^site freshness\b/.test(s.command)).length;

function stepRow(s) {
  const isShell = !DA_GRAMMAR.test(s.command);
  const extras = [];
  if (isShell) {
    extras.push('riverboat: local exec');
    if (s.timeout) extras.push(`finite ${esc(s.timeout)} timeout`);
    if (s.approval) extras.push('explicit pre-granted approval');
  }
  const desc = `<p><code>${esc(isShell ? s.command : `da ${s.command}`)}</code></p>${extras.length ? `<p><em>${extras.join(' · ')}</em></p>` : ''}`;
  return `        <div>
          <div>${esc(s.id)}</div>
          <div>${desc}</div>
          <div>${esc(s.deps.join(', '))}</div>
        </div>`;
}

const anatomySection = pipeline.steps.length ? `    <div>
      <h2>What a green run does</h2>
      <p>Certification is not a checklist in someone's head — it is the checked-in <code>certify.yaml</code>, ${pipeline.steps.length} steps run as one full riverboat: <code>da --org somarc --repo da-cli-0-6-6 --branch main --qmd --riverboat-gambler --commit pipeline run certify.yaml --approve evidence-build</code>. Exactly ${shellSteps.length === 1 ? 'one step runs' : `${shellSteps.length} steps run`} local code — verifying the generated motion artifact and rendering this page from the vault's receipt JSON under a finite timeout and an explicitly pre-granted approval. The other ${daSteps} steps are reviewed da-cli surface: ${nPut} uploads, ${nPreview} previews, ${nAudit} audits, and ${nFresh} freshness verification. The explicit <code>--qmd</code> journals exactly one receipt for the pipeline; its steps never inherit journaling.</p>
      <div class="pipeline">
${pipeline.steps.map(stepRow).join('\n')}
      </div>
      <div class="callout">
        <div>
          <div>SELF-CERTIFYING</div>
          <div>The green run regenerates this page, uploads it, previews every page on the site, audits the critical ones, and verifies freshness — then its own receipt lands in the vault as the newest entry of the ledger it just published. The site certifies itself, and the certification leaves a receipt.</div>
        </div>
      </div>
    </div>` : '';

// ---------------------------------------------------------------------------
// The full ledger.
// ---------------------------------------------------------------------------
function receiptBlock(r) {
  const rows = [
    ['operation', r.command.operation],
    ['mode', r.command.mode],
    ['state', r.outcome.state],
    ['enablement', r.command.enablement],
    ['target', `${r.target.org}/${r.target.repo} @ ${r.target.branch} (${r.target.env})`],
    ['started', `${fmt(r.timing.startedAt)} · ${r.timing.durationMs} ms`],
    ['remoteEffect', `${r.outcome.remoteEffect} · mutationAttempted ${r.outcome.mutationAttempted}`],
    ['receiptId', r.receiptId],
  ];
  if (r.outcome.errorCodes?.length) rows.push(['errorCodes', r.outcome.errorCodes.join(', ')]);
  const ev = r.evidence?.[0];
  if (ev) rows.push(['evidence', `${ev.kind} — ${String(ev.sha256).slice(0, 22)}…`]);
  return `      <div class="receipt">
${rows.map(([k, v]) => `        <div><div>${esc(k)}</div><div>${esc(v)}</div></div>`).join('\n')}
      </div>`;
}

const shown = receipts.slice(-limit);
const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

const html = `<body>
  <header></header>
  <main>
    <div>
      <p><em>The evidence</em></p>
      <h1>This site's own receipts</h1>
      <p>Every remote operation that built and certified this site ran through da-cli with the QMD journal on. This page was generated directly from the vault's receipt JSON by the pipeline's one riverboat step — nothing here was written by hand, including the failures. And including the verdict.</p>
      <p><em>Generated ${esc(generatedAt)}Z from ${receipts.length} receipts for ${esc(site)}.</em></p>
    </div>
${arcSection}
${anatomySection}
    <div>
      <div class="section-metadata"><div><div>style</div><div>stub</div></div></div>
      <h2>The ledger at a glance</h2>
      <div class="spec">
        <div><div>outcomes</div><div>${esc(Object.entries(counts).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(' · '))}</div></div>
        <div><div>modes</div><div>${esc(Object.entries(modes).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(' · '))}</div></div>
${latestRun ? `        <div><div>latest certification</div><div>${esc(latestRun.outcome.state)} · ${esc(fmt(latestRun.timing.startedAt))}</div></div>` : ''}
        <div><div>vault projection</div><div>${esc(site)} only · ${receipts.length} receipts · no cross-site inventory exposed</div></div>
      </div>
      <div class="callout">
        <div>
          <div>KEPT SCARS</div>
          <div>Refusals and failures never leave this ledger. They sit in original order, next to the green runs that answered them — a ledger that only shows successes is marketing.</div>
        </div>
      </div>
    </div>
    <div>
      <div class="section-metadata"><div><div>style</div><div>ruled</div></div></div>
      <h2>Receipts, oldest first</h2>
${shown.map(receiptBlock).join('\n')}
    </div>
    <div>
      <div class="metadata">
        <div><div>title</div><div>Receipts — the build ledger of this site</div></div>
        <div><div>description</div><div>Every da-cli operation that built this proof site, rendered directly from the QMD vault's receipt JSON by the certification pipeline — the certification arc, the anatomy of a green run, and the full ledger, failures included.</div></div>
      </div>
    </div>
  </main>
  <footer></footer>
</body>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`receipts-page: rendered ${shown.length}/${receipts.length} receipts (${runs.length} pipeline runs, ${pipeline.steps.length} pipeline steps) for ${site} -> ${out}`);
