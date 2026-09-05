/*
 * evidence-field
 * Authored contract: each row has two or three cells —
 *   1. status label (retained observed | newly observed | not observed |
 *      blocked | conditional | not applicable)
 *   2. integer count
 *   3. optional explanation (rich text)
 *
 * The block renders one semantic definition list plus an aria-hidden visual
 * field with exactly one mark per command path. Authored prose nodes are moved
 * intact so DA Canvas field identity survives decoration.
 */

const STATE_RULES = [
  [/new(?:ly)? observed|new in/i, 'new'],
  [/retained observed|observed before|baseline observed/i, 'retained'],
  [/not observed|unobserved/i, 'not-observed'],
  [/not applicable|n\/a/i, 'not-applicable'],
  [/conditional/i, 'conditional'],
  [/blocked/i, 'blocked'],
];

function classify(label) {
  return STATE_RULES.find(([pattern]) => pattern.test(label))?.[1] || 'other';
}

function numberFrom(cell) {
  const match = cell?.textContent.match(/\d[\d,]*/);
  return match ? Number.parseInt(match[0].replaceAll(',', ''), 10) : 0;
}

function moveContent(cell, owner) {
  if (cell) owner.append(...cell.childNodes);
}

function buildOverview(entries) {
  const retained = entries.find(({ state }) => state === 'retained')?.count || 0;
  const added = entries.find(({ state }) => state === 'new')?.count || 0;
  const observed = retained + added;
  const total = entries.reduce((sum, { count }) => sum + count, 0);
  const percentage = total ? ((observed / total) * 100).toFixed(1) : '0.0';

  const overview = document.createElement('div');
  overview.className = 'evidence-field-overview';
  overview.setAttribute('aria-hidden', 'true');

  const shift = document.createElement('div');
  shift.className = 'evidence-field-shift';
  shift.innerHTML = `
    <span class="evidence-field-kicker">observed command paths</span>
    <span class="evidence-field-before">${retained}</span>
    <span class="evidence-field-arrow">→</span>
    <strong class="evidence-field-after">${observed}</strong>
    <span class="evidence-field-delta">+${added} newly observed in 0.6.6</span>
    <span class="evidence-field-ratio">${percentage}% of ${total}</span>
  `;

  const matrix = document.createElement('div');
  matrix.className = 'evidence-field-matrix';
  entries.forEach(({ count, state }) => {
    for (let i = 0; i < count; i += 1) {
      const mark = document.createElement('span');
      mark.className = `evidence-field-mark evidence-field-mark-${state}`;
      matrix.append(mark);
    }
  });

  overview.append(shift, matrix);
  return overview;
}

export default function decorate(block) {
  const entries = [...block.children].map((row) => {
    const [labelCell, countCell, detailCell] = row.children;
    const label = labelCell?.textContent.trim() || 'unclassified';
    return {
      row,
      labelCell,
      countCell,
      detailCell,
      label,
      count: Math.max(0, Math.min(numberFrom(countCell), 500)),
      state: classify(label),
    };
  }).filter(({ count, labelCell, detailCell }) => (
    count > 0 || labelCell?.textContent.trim() || detailCell?.textContent.trim()
  ));

  const legend = document.createElement('dl');
  legend.className = 'evidence-field-legend';

  entries.forEach(({
    labelCell, countCell, detailCell, state,
  }) => {
    const item = document.createElement('div');
    item.className = `evidence-field-entry evidence-field-entry-${state}`;

    const term = document.createElement('dt');
    term.className = 'evidence-field-label';
    const swatch = document.createElement('span');
    swatch.className = `evidence-field-swatch evidence-field-swatch-${state}`;
    swatch.setAttribute('aria-hidden', 'true');
    const label = document.createElement('div');
    label.className = 'evidence-field-label-copy';
    moveContent(labelCell, label);
    term.append(swatch, label);

    const value = document.createElement('dd');
    value.className = 'evidence-field-value';
    const count = document.createElement('div');
    count.className = 'evidence-field-count';
    moveContent(countCell, count);
    value.append(count);

    if (detailCell?.textContent.trim()) {
      const detail = document.createElement('div');
      detail.className = 'evidence-field-detail';
      moveContent(detailCell, detail);
      value.append(detail);
    }

    item.append(term, value);
    legend.append(item);
  });

  block.replaceChildren(buildOverview(entries), legend);
}
