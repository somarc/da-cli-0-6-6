/*
 * command-reference
 *
 * Authored contract: one command per row, four cells.
 *   1. command heading + concise description
 *   2. exact signature / invocation
 *   3. classification, effect, target, contract, and evidence state
 *   4. installed --help output
 *
 * The block remains a readable list without interaction. JavaScript adds
 * local filtering and copy controls; it never executes a command.
 */

let referenceId = 0;

const STATUS_RULES = [
  ['not-applicable', /not-applicable/i],
  ['not-observed', /not-observed/i],
  ['blocked', /blocked/i],
  ['pass', /\bpass\b/i],
];

function normalize(value) {
  return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function statusFrom(text) {
  return STATUS_RULES.find(([, pattern]) => pattern.test(text))?.[0] || 'unclassified';
}

function pathFrom(identity) {
  const code = identity?.querySelector('h2 code, h3 code, code');
  return (code?.textContent || identity?.textContent || '').replace(/^da\s+/, '').trim();
}

function makeChip(text, className) {
  const chip = document.createElement('span');
  chip.className = `command-reference-chip ${className}`;
  chip.textContent = text;
  return chip;
}

function copyButton(command) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'command-reference-copy';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', `Copy ${command}`);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(command);
      button.textContent = 'Copied';
      window.setTimeout(() => { button.textContent = 'Copy'; }, 1600);
    } catch {
      button.textContent = 'Select command';
    }
  });
  return button;
}

function decorateRow(row, index) {
  const [identityCell, signatureCell, contractCell, helpCell] = [...row.children];
  const path = pathFrom(identityCell);
  const root = path.split(/\s+/)[0] || 'root';
  const family = ['status', 'resolve', 'up'].includes(root) ? 'core' : root;
  const contractText = contractCell?.textContent || '';
  const status = statusFrom(contractText);
  const classification = contractText.match(/required-destructive|required-core|external-conditional|lifecycle|not-applicable/i)?.[0]?.toLowerCase() || 'unclassified';
  const mutation = contractText.match(/Effect:\s*([a-z-]+)/i)?.[1]?.toLowerCase() || 'unknown';

  const article = document.createElement('article');
  article.className = 'command-reference-entry';
  article.dataset.family = family;
  article.dataset.status = status;
  article.dataset.classification = classification;
  article.dataset.mutation = mutation;
  article.dataset.search = normalize(`${path} ${identityCell?.textContent || ''} ${contractText}`);

  const number = document.createElement('span');
  number.className = 'command-reference-number';
  number.setAttribute('aria-hidden', 'true');
  number.textContent = String(index + 1).padStart(3, '0');

  const identity = document.createElement('div');
  identity.className = 'command-reference-identity';
  if (identityCell) identity.append(...identityCell.childNodes);
  const heading = identity.querySelector('h2, h3');
  if (heading) {
    heading.id = heading.id || `command-${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
    heading.classList.add('command-reference-title');
  }

  const chips = document.createElement('div');
  chips.className = 'command-reference-chips';
  chips.append(
    makeChip(classification.replaceAll('-', ' '), `is-${classification}`),
    makeChip(mutation.replaceAll('-', ' '), `is-${mutation}`),
    makeChip(status.replaceAll('-', ' '), `is-${status}`),
  );

  const signature = document.createElement('div');
  signature.className = 'command-reference-signature';
  const command = signatureCell?.textContent.trim() || `da ${path}`;
  if (signatureCell) signature.append(...signatureCell.childNodes);
  signature.append(copyButton(command));

  const contract = document.createElement('div');
  contract.className = 'command-reference-contract';
  if (contractCell) contract.append(...contractCell.childNodes);

  const help = document.createElement('details');
  help.className = 'command-reference-help';
  const summary = document.createElement('summary');
  summary.textContent = 'Installed help and options';
  help.append(summary);
  if (helpCell) help.append(...helpCell.childNodes);

  article.append(number, identity, chips, signature, contract, help);
  return article;
}

function option(label, value) {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = label;
  return item;
}

function createFilters(block, entries) {
  referenceId += 1;
  const toolbar = document.createElement('div');
  toolbar.className = 'command-reference-toolbar';

  const searchLabel = document.createElement('label');
  const searchId = `command-reference-search-${referenceId}`;
  searchLabel.htmlFor = searchId;
  searchLabel.textContent = 'Filter commands';
  const search = document.createElement('input');
  search.type = 'search';
  search.id = searchId;
  search.placeholder = 'Command, capability, or option';
  search.autocomplete = 'off';

  const family = document.createElement('select');
  family.setAttribute('aria-label', 'Filter by command family');
  family.append(option('All families', 'all'));
  [...new Set(entries.map((entry) => entry.dataset.family))].sort()
    .forEach((value) => family.append(option(value, value)));

  const status = document.createElement('select');
  status.setAttribute('aria-label', 'Filter by evidence status');
  status.append(
    option('Every evidence state', 'all'),
    option('Observed', 'pass'),
    option('Not observed', 'not-observed'),
    option('Blocked', 'blocked'),
    option('Policy exclusion', 'not-applicable'),
  );

  const result = document.createElement('p');
  result.className = 'command-reference-result';
  result.setAttribute('aria-live', 'polite');

  const apply = () => {
    const query = normalize(search.value);
    const selectedFamily = family.value;
    const selectedStatus = status.value;
    let visible = 0;
    entries.forEach((entry) => {
      const matches = (!query || entry.dataset.search.includes(query))
        && (selectedFamily === 'all' || entry.dataset.family === selectedFamily)
        && (selectedStatus === 'all' || entry.dataset.status === selectedStatus);
      entry.hidden = !matches;
      if (matches) visible += 1;
    });
    result.textContent = `${visible} of ${entries.length} command paths shown.`;
  };

  [search, family, status].forEach((control) => control.addEventListener('input', apply));
  const field = document.createElement('div');
  field.className = 'command-reference-search';
  field.append(searchLabel, search);
  toolbar.append(field);
  if (family.options.length > 2) toolbar.append(family);
  toolbar.append(status, result);
  block.prepend(toolbar);
  apply();
}

export default function decorate(block) {
  const rows = [...block.children];
  const list = document.createElement('div');
  list.className = 'command-reference-list';
  const entries = rows.map(decorateRow);
  list.append(...entries);
  block.replaceChildren(list);
  if (block.classList.contains('index')) {
    list.querySelectorAll('.command-reference-help').forEach((help) => { help.open = true; });
  }
  createFilters(block, entries);
}
