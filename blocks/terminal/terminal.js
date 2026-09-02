/*
 * terminal
 * Authored contract: each row has a single cell of rich text.
 *   - lines starting with `$ ` render as prompt + command
 *   - all other lines render as plain output
 *   - a cell that is only a `<pre><code>` block passes through verbatim
 *   - an optional first row (plain text, no `$ ` prefix, no `<pre>`)
 *     renders as the window title bar
 * Variant `terminal (receipt)` tints the frame with the accent color.
 * Its EDS variant class is literally `receipt`, which collides with the
 * unrelated `receipt` block name — renamed here to `terminal-receipt`
 * immediately so the two blocks' CSS can never bleed into each other.
 */

function linesFromCell(cell) {
  const lines = [];
  const elements = [...cell.children];

  if (elements.length === 0) {
    if (cell.textContent.trim()) lines.push([...cell.childNodes]);
    return lines;
  }

  elements.forEach((el) => {
    if (el.tagName === 'P' || el.tagName === 'DIV') {
      let current = [];
      [...el.childNodes].forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
          lines.push(current);
          current = [];
        } else {
          current.push(node);
        }
      });
      if (current.length) lines.push(current);
    } else {
      lines.push([el]);
    }
  });

  return lines.filter((nodes) => nodes.some((n) => n.textContent && n.textContent.trim()));
}

function isPromptText(text) {
  return /^\$\s?/.test(text.trim());
}

function stripDollar(nodes) {
  const [first, ...rest] = nodes;
  if (first && first.nodeType === Node.TEXT_NODE) {
    return [document.createTextNode(first.textContent.replace(/^\s*\$\s?/, '')), ...rest];
  }
  return nodes;
}

function buildTitlebar(text) {
  const bar = document.createElement('div');
  bar.className = 'terminal-titlebar';

  const dots = document.createElement('span');
  dots.className = 'terminal-dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i += 1) {
    dots.append(document.createElement('span'));
  }
  [...dots.children].forEach((dot) => dot.classList.add('terminal-dot'));

  const label = document.createElement('span');
  label.className = 'terminal-titlebar-label';
  label.textContent = text;

  bar.append(dots, label);
  return bar;
}

function buildLine(nodes) {
  const text = nodes.map((n) => n.textContent).join('');
  const line = document.createElement('div');

  if (isPromptText(text)) {
    line.className = 'terminal-line terminal-line-prompt';
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.setAttribute('aria-hidden', 'true');
    prompt.textContent = '$';
    const cmd = document.createElement('span');
    cmd.className = 'terminal-command';
    cmd.append(...stripDollar(nodes));
    line.append(prompt, cmd);
  } else {
    line.className = 'terminal-line terminal-line-output';
    line.append(...nodes);
  }
  return line;
}

export default function decorate(block) {
  if (block.classList.contains('receipt')) {
    block.classList.remove('receipt');
    block.classList.add('terminal-receipt');
  }

  const rows = [...block.children];
  let titlebarEl = null;

  if (rows.length > 1) {
    const firstCell = rows[0].children[0];
    const text = firstCell ? firstCell.textContent.trim() : '';
    const hasPre = firstCell && firstCell.querySelector('pre');
    if (text && !hasPre && !isPromptText(text)) {
      titlebarEl = buildTitlebar(text);
      rows.shift();
    }
  }

  const body = document.createElement('div');
  body.className = 'terminal-body';

  rows.forEach((row) => {
    const cell = row.children[0];
    if (!cell) return;
    const pre = cell.querySelector('pre');
    if (pre && cell.children.length === 1 && cell.firstElementChild === pre) {
      body.append(pre);
      return;
    }
    linesFromCell(cell).forEach((nodes) => body.append(buildLine(nodes)));
  });

  block.replaceChildren();
  if (titlebarEl) block.append(titlebarEl);
  block.append(body);
}
