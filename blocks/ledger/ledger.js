/*
 * ledger
 * Authored contract: rows of 2–3 cells —
 *   cell 1: command path
 *   cell 2: boundary (read-only | dry-run | commit)
 *   cell 3 (optional): note
 * Renders as a real ruled <table> (genuine tabular data), with the
 * boundary column stamped as a chip. A "Note" column only appears when
 * at least one authored row actually uses a third cell.
 */

import { chipClassFor, isPlainCell } from '../../scripts/chip-state.js';

const COLUMN_LABELS = ['Command', 'Boundary', 'Note'];

export default function decorate(block) {
  const rows = [...block.children].map((row) => [...row.children]);
  const colCount = Math.min(3, Math.max(2, ...rows.map((cells) => cells.length)));
  const headers = COLUMN_LABELS.slice(0, colCount);

  const table = document.createElement('table');
  table.className = 'ledger-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach((label) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);

  const tbody = document.createElement('tbody');
  rows.forEach((cells) => {
    if (cells.every((cell) => !cell.textContent.trim())) return;

    const tr = document.createElement('tr');
    headers.forEach((label, i) => {
      const cell = cells[i];
      const td = document.createElement('td');
      td.dataset.label = label;

      if (i === 0) {
        td.className = 'ledger-command';
        const code = document.createElement('code');
        code.textContent = cell ? cell.textContent.trim() : '';
        td.append(code);
      } else if (i === 1) {
        td.className = 'ledger-boundary';
        const text = cell ? cell.textContent.trim() : '';
        const chipClass = isPlainCell(cell) ? chipClassFor(text) : null;
        if (chipClass) {
          const chip = document.createElement('span');
          chip.className = `chip ${chipClass}`;
          chip.textContent = text;
          td.append(chip);
        } else if (cell) {
          td.append(...cell.childNodes);
        }
      } else {
        td.className = 'ledger-note';
        if (cell) td.append(...cell.childNodes);
      }

      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  block.replaceChildren(table);
}
