/*
 * scar-ledger
 * Authored contract: each row has four cells —
 *   1. scar / review finding (short rich text)
 *   2. 0.6.6 response (rich text)
 *   3. state (healed | fenced | armed | open)
 *   4. evidence / boundary (optional rich text)
 *
 * The state is lifted into the shared stamped-chip vocabulary. Missing or
 * unknown states remain visibly unclassified/neutral. Extra authored cells
 * and image-only evidence are preserved in the evidence rail.
 */

import { chipClassFor } from '../../scripts/chip-state.js';

function moveContent(from, to) {
  if (!from) return;
  to.append(...from.childNodes);
}

function hasMeaningfulContent(cell) {
  return Boolean(cell && (cell.textContent.trim()
    || cell.querySelector('img, picture, svg, video, audio, iframe, object')));
}

export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'scar-ledger-list';
  let renderedIndex = 0;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [scarCell, responseCell, stateCell] = cells;
    const hasContent = cells.some(hasMeaningfulContent);
    if (!hasContent) return;
    renderedIndex += 1;

    const item = document.createElement('li');
    item.className = 'scar-ledger-entry';

    const head = document.createElement('div');
    head.className = 'scar-ledger-head';

    const number = document.createElement('span');
    number.className = 'scar-ledger-number';
    number.textContent = String(renderedIndex).padStart(2, '0');

    const title = document.createElement('div');
    title.className = 'scar-ledger-title';
    moveContent(scarCell, title);

    const stateText = stateCell?.textContent.trim() || 'unclassified';
    const state = document.createElement('span');
    state.className = `chip ${chipClassFor(stateText) || 'chip-neutral'} scar-ledger-state`;
    state.textContent = stateText;

    head.append(number, title, state);

    const response = document.createElement('div');
    response.className = 'scar-ledger-response';
    moveContent(responseCell, response);

    item.append(head, response);

    const evidenceCells = cells.slice(3).filter(hasMeaningfulContent);
    if (stateCell && !stateCell.textContent.trim() && hasMeaningfulContent(stateCell)) {
      evidenceCells.unshift(stateCell);
    }
    if (evidenceCells.length) {
      const evidence = document.createElement('div');
      evidence.className = 'scar-ledger-evidence';
      const label = document.createElement('span');
      label.className = 'scar-ledger-evidence-label';
      label.textContent = 'proof';
      evidence.append(label);
      evidenceCells.forEach((cell) => {
        const fragment = document.createElement('div');
        fragment.className = 'scar-ledger-evidence-fragment';
        moveContent(cell, fragment);
        evidence.append(fragment);
      });
      item.append(evidence);
    }

    list.append(item);
  });

  block.replaceChildren(list);
}
