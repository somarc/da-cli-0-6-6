/*
 * pipeline
 * Authored contract: rows —
 *   cell 1: step id
 *   cell 2: description / command
 *   cell 3 (optional): dependsOn — a list, or comma/line-separated text
 * Renders as a vertical DAG: ordinals connected by a rail.
 * Variant `pipeline (riverboat)` marks arbitrary-local-execution steps
 * with a distinct badge. The contract does not define a per-row signal
 * for "which steps," so — as the only implementable reading without an
 * extra authored cell — the riverboat variant badges every step in that
 * pipeline instance; see the delivery report for this flagged choice.
 *
 * A description that begins with a known outcome word followed by an
 * em dash ("failed — …", "completed — …") gets that word lifted into a
 * stamped chip from the shared chip-state vocabulary — spans cannot be
 * authored (DA round-trips through markdown), so state must arrive as
 * plain text and become a chip here, exactly as receipt and ledger do.
 */

import { chipClassFor } from '../../scripts/chip-state.js';

function depsFromCell(cell) {
  if (!cell) return [];
  const items = [...cell.querySelectorAll('li')];
  if (items.length) return items.map((li) => li.textContent.trim()).filter(Boolean);
  const text = cell.textContent.trim();
  if (!text) return [];
  return text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

export default function decorate(block) {
  const isRiverboat = block.classList.contains('riverboat');

  const ol = document.createElement('ol');
  ol.className = 'pipeline-steps';

  [...block.children].forEach((row, i) => {
    const [idCell, descCell, depsCell] = row.children;
    const idText = idCell ? idCell.textContent.trim() : '';
    const hasDesc = descCell && descCell.textContent.trim();
    if (!idText && !hasDesc) return;

    const li = document.createElement('li');
    li.className = 'pipeline-step';

    const marker = document.createElement('div');
    marker.className = 'pipeline-marker';
    const ordinal = document.createElement('span');
    ordinal.className = 'pipeline-ordinal';
    ordinal.textContent = String(i + 1).padStart(2, '0');
    marker.append(ordinal);

    const body = document.createElement('div');
    body.className = 'pipeline-body';

    const idRow = document.createElement('div');
    idRow.className = 'pipeline-id-row';
    const idEl = document.createElement('p');
    idEl.className = 'pipeline-id';
    idEl.textContent = idText || `step ${i + 1}`;
    idRow.append(idEl);
    if (isRiverboat) {
      const badge = document.createElement('span');
      badge.className = 'chip chip-amber pipeline-riverboat-badge';
      badge.textContent = 'local exec';
      badge.title = 'Runs arbitrary code on the local machine';
      idRow.append(badge);
    }
    body.append(idRow);

    if (hasDesc) {
      const desc = document.createElement('div');
      desc.className = 'pipeline-desc';
      desc.append(...descCell.childNodes);
      const firstPara = desc.querySelector('p') ?? desc;
      const firstNode = firstPara.firstChild;
      if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
        const match = firstNode.textContent.match(/^\s*([a-z-]+)\s+—\s+/i);
        const chipClass = match && chipClassFor(match[1]);
        if (chipClass) {
          firstNode.textContent = firstNode.textContent.slice(match[0].length);
          const chip = document.createElement('span');
          chip.className = `chip ${chipClass}`;
          chip.textContent = match[1].toLowerCase();
          firstPara.prepend(chip, ' ');
        }
      }
      body.append(desc);
    }

    const deps = depsFromCell(depsCell);
    if (deps.length) {
      const depsWrap = document.createElement('p');
      depsWrap.className = 'pipeline-deps';
      const label = document.createElement('span');
      label.className = 'pipeline-deps-label';
      label.textContent = 'depends on';
      depsWrap.append(label);
      deps.forEach((dep) => {
        const tag = document.createElement('span');
        tag.className = 'pipeline-dep';
        tag.textContent = dep;
        depsWrap.append(tag);
      });
      body.append(depsWrap);
    }

    li.append(marker, body);
    ol.append(li);
  });

  block.replaceChildren(ol);
}
