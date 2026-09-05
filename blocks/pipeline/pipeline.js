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

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgNode(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function depsFromCell(cell) {
  if (!cell) return [];
  const items = [...cell.querySelectorAll('li')];
  if (items.length) return items.map((li) => li.textContent.trim()).filter(Boolean);
  const text = cell.textContent.trim();
  if (!text) return [];
  return text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

function orbitPoint(index, count) {
  const angle = (-90 + ((360 / count) * index)) * (Math.PI / 180);
  return {
    x: 280 + (220 * Math.cos(angle)),
    y: 220 + (135 * Math.sin(angle)),
  };
}

function buildOrbitMap(stepLabels) {
  const figure = document.createElement('figure');
  figure.className = 'pipeline-orbit-figure';
  figure.setAttribute('aria-hidden', 'true');

  const svg = svgNode('svg', {
    class: 'pipeline-orbit-map',
    viewBox: '0 0 560 440',
    focusable: 'false',
  });

  const outerGuide = svgNode('ellipse', {
    class: 'pipeline-orbit-guide',
    cx: '280',
    cy: '220',
    rx: '228',
    ry: '143',
    transform: 'rotate(-8 280 220)',
  });
  const outer = svgNode('ellipse', {
    class: 'pipeline-orbit-track',
    cx: '280',
    cy: '220',
    rx: '220',
    ry: '135',
  });
  const inner = svgNode('ellipse', {
    class: 'pipeline-orbit-inner',
    cx: '280',
    cy: '220',
    rx: '92',
    ry: '66',
  });
  const core = svgNode('circle', {
    class: 'pipeline-orbit-core',
    cx: '280',
    cy: '220',
    r: '48',
  });
  const coreLabel = svgNode('text', {
    class: 'pipeline-orbit-core-label',
    x: '280',
    y: '225',
    'text-anchor': 'middle',
  });
  coreLabel.textContent = 'EDS';
  const innerLabel = svgNode('text', {
    class: 'pipeline-orbit-inner-label',
    x: '280',
    y: '135',
    'text-anchor': 'middle',
  });
  innerLabel.textContent = 'render loop';

  svg.append(outerGuide, outer, inner, core, coreLabel, innerLabel);

  stepLabels.forEach((label, index) => {
    const { x, y } = orbitPoint(index, stepLabels.length);
    let labelX = '0';
    let labelAnchor = 'middle';
    if (x < 280) {
      labelX = '28';
      labelAnchor = 'start';
    } else if (x > 280) {
      labelX = '-28';
      labelAnchor = 'end';
    }
    const node = svgNode('g', {
      class: 'pipeline-orbit-node',
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
    });
    const ticket = svgNode('rect', {
      class: 'pipeline-orbit-ticket',
      x: '-17',
      y: '-12',
      width: '34',
      height: '24',
      rx: '2',
    });
    const number = svgNode('text', {
      class: 'pipeline-orbit-number',
      x: '0',
      y: '4',
      'text-anchor': 'middle',
    });
    number.textContent = String(index + 1).padStart(2, '0');

    const text = svgNode('text', {
      class: 'pipeline-orbit-node-label',
      x: labelX,
      y: y < 220 ? '-19' : '30',
      'text-anchor': labelAnchor,
    });
    text.textContent = label;
    node.append(ticket, number, text);
    svg.append(node);
  });

  const caption = document.createElement('figcaption');
  caption.className = 'pipeline-orbit-caption';
  caption.textContent = `${stepLabels.length} gates · one verified path`;
  figure.append(svg, caption);
  return figure;
}

export default function decorate(block) {
  const isRiverboat = block.classList.contains('riverboat');
  const isOuterLoop = block.classList.contains('outer-loop');

  const ol = document.createElement('ol');
  ol.className = 'pipeline-steps';
  const stepLabels = [];

  [...block.children].forEach((row, i) => {
    const [idCell, descCell, depsCell] = row.children;
    const idText = idCell ? idCell.textContent.trim() : '';
    const hasDesc = descCell && descCell.textContent.trim();
    if (!idText && !hasDesc) return;
    stepLabels.push(idText || `step ${i + 1}`);

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
    const idEl = document.createElement('div');
    idEl.className = 'pipeline-id';
    idEl.setAttribute('role', 'heading');
    idEl.setAttribute('aria-level', '3');
    if (idCell) idEl.append(...idCell.childNodes);
    else idEl.textContent = `step ${i + 1}`;
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
      const depsWrap = document.createElement('div');
      depsWrap.className = 'pipeline-deps';
      const label = document.createElement('span');
      label.className = 'pipeline-deps-label';
      label.textContent = 'depends on';
      depsWrap.append(label);
      const source = document.createElement('div');
      source.className = 'pipeline-deps-source';
      source.append(...depsCell.childNodes);
      depsWrap.append(source);
      body.append(depsWrap);
    }

    li.append(marker, body);
    ol.append(li);
  });

  if (isOuterLoop && stepLabels.length > 1) {
    const layout = document.createElement('div');
    layout.className = 'pipeline-orbit-layout';
    layout.append(buildOrbitMap(stepLabels), ol);
    block.replaceChildren(layout);
  } else {
    block.replaceChildren(ol);
  }
}
