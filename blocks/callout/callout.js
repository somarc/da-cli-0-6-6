/*
 * callout
 * Authored contract: single row —
 *   cell 1: stamp label (e.g. INVARIANT, DURABLE DECISION,
 *           MAINTAINER DECISION)
 *   cell 2: rich text
 * Only the first row is used; extra authored rows are ignored rather
 * than rendered incorrectly. A missing label falls back to "NOTE" so
 * the block still renders as a valid annotation.
 */
export default function decorate(block) {
  const row = block.children[0];
  const [labelCell, bodyCell] = row ? [...row.children] : [];
  const labelText = labelCell ? labelCell.textContent.trim() : '';

  const stamp = document.createElement('div');
  stamp.className = 'callout-stamp';
  stamp.setAttribute('aria-hidden', 'true');
  stamp.textContent = labelText || 'NOTE';

  const body = document.createElement('div');
  body.className = 'callout-body';
  body.setAttribute('role', 'note');
  body.setAttribute('aria-label', labelText || 'Note');
  if (bodyCell) body.append(...bodyCell.childNodes);

  block.replaceChildren(stamp, body);
}
