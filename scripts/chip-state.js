/*
 * Shared "stamped state" vocabulary for boundary-crossing values
 * (read-only / dry-run / commit / completed / failed / refused / ...).
 * Used by more than one block (receipt, ledger), so it lives in
 * /scripts/ rather than being duplicated or cross-imported block to
 * block — see AGENTS.md: fragment.js is the only sanctioned cross-block
 * import.
 */

const STATE_CHIP_CLASS = {
  completed: 'chip-completed',
  'dry-run': 'chip-neutral',
  'dry run': 'chip-neutral',
  commit: 'chip-commit',
  confirmed: 'chip-commit',
  failed: 'chip-failed',
  refused: 'chip-refused',
  'read-only': 'chip-neutral',
  'read only': 'chip-neutral',
};

/**
 * Maps a plain-text boundary/state value to a chip modifier class.
 * @param {string} value authored cell text
 * @returns {string|undefined} chip class, or undefined when unrecognized
 */
export function chipClassFor(value) {
  return STATE_CHIP_CLASS[value.trim().toLowerCase()];
}

/**
 * True when a cell holds nothing but plain text — either no child
 * elements at all, or exactly one auto-inserted wrapper `<p>` (the
 * shape `wrapTextNodes` in aem.js produces for a bare text cell) with
 * no further nested elements. Rich content (links, lists, multiple
 * paragraphs) returns false so callers preserve it instead of
 * collapsing it into a chip or plain-text field.
 * @param {Element|null|undefined} cell
 * @returns {boolean}
 */
export function isPlainCell(cell) {
  if (!cell) return true;
  if (cell.children.length === 0) return true;
  if (cell.children.length === 1) {
    const only = cell.children[0];
    return only.tagName === 'P' && only.children.length === 0;
  }
  return false;
}
