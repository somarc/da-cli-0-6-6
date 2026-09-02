/*
 * receipt — the signature block
 * Authored contract: key/value rows —
 *   cell 1: key (e.g. operation, mode, state, target, startedAt, counts,
 *           codes, evidence, enablement)
 *   cell 2: value
 * Unknown / unlisted keys still render — the row list above is
 * illustrative, not exhaustive. When a plain-text value matches a known
 * boundary-crossing state, it renders as a stamped chip colored by
 * meaning; rich-text values (e.g. a link under "evidence") are left
 * intact rather than force-fit into a chip.
 */

import { chipClassFor, isPlainCell } from '../../scripts/chip-state.js';

export default function decorate(block) {
  const dl = document.createElement('dl');
  dl.className = 'receipt-rows';

  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const keyText = keyCell ? keyCell.textContent.trim() : '';
    const hasValue = valueCell && valueCell.textContent.trim();
    if (!keyText && !hasValue) return;

    const wrap = document.createElement('div');
    wrap.className = 'receipt-row';

    const dt = document.createElement('dt');
    dt.className = 'receipt-key';
    dt.textContent = keyText || '—';

    const dd = document.createElement('dd');
    dd.className = 'receipt-value';

    if (valueCell) {
      const valueText = valueCell.textContent.trim();
      const chipClass = isPlainCell(valueCell) ? chipClassFor(valueText) : null;
      if (chipClass) {
        const chip = document.createElement('span');
        chip.className = `chip ${chipClass}`;
        chip.textContent = valueText;
        dd.append(chip);
      } else {
        dd.append(...valueCell.childNodes);
      }
    }

    wrap.append(dt, dd);
    dl.append(wrap);
  });

  block.replaceChildren(dl);
}
