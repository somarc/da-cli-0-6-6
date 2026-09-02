/*
 * hero
 * Authored contract:
 *   row 1 (optional): single cell — eyebrow text
 *   row 2: single cell — rich text (h1, paragraph, optional ul of proof
 *          points, optional CTA paragraph of link(s))
 * No photography. The right-hand motif is procedural: a stack of ledger
 * rule rows with mono evidence figures, plus an inline SVG release stamp,
 * both built here rather than authored or loaded as an image.
 */

const LEDGER_FIGURES = ['0x41d2', '128.06', '00041', 'READ', '0x2f9', '44.02', '0x18b', 'DRY-RUN', '00007', '0xa61'];
const LEDGER_WIDTHS = [82, 58, 71, 40, 64, 50, 76, 46];

function buildMotif() {
  const motif = document.createElement('div');
  motif.className = 'hero-motif';
  motif.setAttribute('aria-hidden', 'true');

  const ledger = document.createElement('div');
  ledger.className = 'hero-ledger';
  LEDGER_WIDTHS.forEach((w, i) => {
    const row = document.createElement('div');
    row.className = 'hero-ledger-row';
    const bar = document.createElement('span');
    bar.className = 'hero-ledger-bar';
    bar.style.setProperty('--w', `${w}%`);
    const figure = document.createElement('span');
    figure.className = 'hero-ledger-figure';
    figure.textContent = LEDGER_FIGURES[i % LEDGER_FIGURES.length];
    row.append(bar, figure);
    ledger.append(row);
  });

  const stamp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  stamp.classList.add('hero-stamp');
  stamp.setAttribute('viewBox', '0 0 120 120');
  stamp.innerHTML = [
    '<circle cx="60" cy="60" r="54" />',
    '<circle cx="60" cy="60" r="45" />',
    '<text x="60" y="57" text-anchor="middle" class="hero-stamp-version">0.6.6</text>',
    '<text x="60" y="75" text-anchor="middle" class="hero-stamp-sub">RECEIPT PRINTED</text>',
  ].join('');

  motif.append(ledger, stamp);
  return motif;
}

/**
 * Marks a paragraph as a CTA row only when every child is a link
 * (or whitespace), so ordinary prose links are left alone.
 * @param {HTMLParagraphElement} p paragraph to test
 * @returns {boolean}
 */
function isCtaParagraph(p) {
  const nodes = [...p.childNodes];
  if (!nodes.some((n) => n.nodeType === 1 && n.tagName === 'A')) return false;
  return nodes.every((n) => (n.nodeType === 3 && !n.textContent.trim()) || (n.nodeType === 1 && n.tagName === 'A'));
}

export default function decorate(block) {
  const rows = [...block.children];
  const contentRow = rows.length > 1 ? rows[1] : rows[0];
  const eyebrowRow = rows.length > 1 ? rows[0] : null;

  const content = document.createElement('div');
  content.className = 'hero-content';

  const eyebrowText = eyebrowRow?.children[0]?.textContent.trim();
  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'hero-eyebrow';
    eyebrow.textContent = eyebrowText;
    content.append(eyebrow);
  }

  const contentCell = contentRow?.children[0];
  if (contentCell) {
    while (contentCell.firstChild) content.append(contentCell.firstChild);
  }

  content.querySelectorAll(':scope > ul').forEach((ul) => ul.classList.add('hero-proof'));
  content.querySelectorAll(':scope > p').forEach((p) => {
    if (isCtaParagraph(p)) p.classList.add('hero-ctas');
  });

  block.replaceChildren(content, buildMotif());
}
