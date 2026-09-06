const DATA_PATH = '/data/command-reference-0.6.6.json';
const MAX_RESULTS = 12;
let dataPromise;
let dialog;
let trigger;
let sequence = 0;

function normalize(value) {
  return String(value || '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function tokens(value) {
  return normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
}

async function loadCatalog() {
  if (!dataPromise) {
    dataPromise = fetch(`${window.hlx?.codeBasePath || ''}${DATA_PATH}`)
      .then((response) => {
        if (!response.ok) throw new Error(`command reference response ${response.status}`);
        return response.json();
      })
      .then((payload) => payload.commands || []);
  }
  return dataPromise;
}

function matches(commands, value) {
  const terms = normalize(value).split(' ').filter(Boolean);
  if (!terms.length) return [];
  return commands
    .map((command) => {
      const path = normalize(command.path);
      const description = normalize(command.description);
      const aliases = normalize(command.aliases?.join(' '));
      const family = normalize(command.family);
      const all = `${path} ${description} ${aliases} ${family}`;
      const allTokens = tokens(all);
      if (!terms.every((term) => allTokens.some((token) => token.startsWith(term)))) return null;
      const phrase = terms.join(' ');
      let score = path === phrase ? 300 : 0;
      if (path.startsWith(phrase)) score += 150;
      if (path.includes(phrase)) score += 90;
      terms.forEach((term) => {
        if (path.includes(term)) score += 30;
        if (aliases.includes(term)) score += 18;
        if (description.includes(term)) score += 8;
        if (family.includes(term)) score += 4;
      });
      return { ...command, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, MAX_RESULTS);
}

function resultItem(command) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = command.referencePath;
  const name = document.createElement('code');
  name.textContent = `da ${command.path}`;
  const description = document.createElement('span');
  description.textContent = command.description;
  const state = document.createElement('small');
  state.textContent = `${command.classification.replaceAll('-', ' ')} · ${command.evidenceStatus.replaceAll('-', ' ')}`;
  link.append(name, description, state);
  item.append(link);
  return item;
}

function buildDialog() {
  const modal = document.createElement('dialog');
  modal.className = 'command-search-dialog';
  modal.setAttribute('aria-labelledby', 'command-search-title');

  const head = document.createElement('div');
  head.className = 'command-search-head';
  const title = document.createElement('h2');
  title.id = 'command-search-title';
  title.textContent = 'Find a da-cli command';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'command-search-close';
  close.setAttribute('aria-label', 'Close command search');
  close.textContent = '×';
  close.addEventListener('click', () => modal.close());
  head.append(title, close);

  const label = document.createElement('label');
  label.htmlFor = 'command-search-input';
  label.textContent = 'Search all 138 command paths';
  const input = document.createElement('input');
  input.id = 'command-search-input';
  input.type = 'search';
  input.placeholder = 'Try “content put” or “preview”';
  input.autocomplete = 'off';
  input.spellcheck = false;

  const status = document.createElement('p');
  status.className = 'command-search-status';
  status.setAttribute('aria-live', 'polite');
  const results = document.createElement('ul');
  results.className = 'command-search-results';

  const render = async () => {
    sequence += 1;
    const current = sequence;
    const value = input.value.trim();
    results.replaceChildren();
    if (value.length < 2) {
      status.textContent = value ? 'Type at least two characters.' : 'Search by command path, family, alias, or capability.';
      return;
    }
    status.textContent = 'Searching the 0.6.6 command surface…';
    try {
      const commands = await loadCatalog();
      if (sequence !== current) return;
      const found = matches(commands, value);
      results.append(...found.map(resultItem));
      status.textContent = found.length
        ? `${found.length} result${found.length === 1 ? '' : 's'} shown.`
        : `No command path matched “${value}”.`;
    } catch {
      if (sequence === current) status.textContent = 'The command catalog is temporarily unavailable.';
    }
  };

  input.addEventListener('input', render);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      const first = results.querySelector('a');
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  results.addEventListener('keydown', (event) => {
    const links = [...results.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && links[index + 1]) {
      event.preventDefault();
      links[index + 1].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      (links[index - 1] || input).focus();
    }
  });
  modal.addEventListener('close', () => trigger?.focus());
  modal.append(head, label, input, status, results);
  document.body.append(modal);
  return { modal, input };
}

function openSearch() {
  const parts = dialog || buildDialog();
  dialog = parts;
  if (!parts.modal.open) parts.modal.showModal();
  parts.input.focus();
}

export default function installCommandSearch(container) {
  if (!container || container.querySelector('.command-search-trigger')) return;
  trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'command-search-trigger';
  trigger.setAttribute('aria-label', 'Search all 138 da-cli commands');
  trigger.innerHTML = '<span aria-hidden="true">⌕</span><span>Commands</span><kbd>/</kbd>';
  trigger.addEventListener('click', openSearch);
  container.prepend(trigger);

  window.addEventListener('keydown', (event) => {
    const { target } = event;
    const editing = target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target?.isContentEditable;
    if (event.key === '/' && !editing) {
      event.preventDefault();
      openSearch();
    }
  });
}
