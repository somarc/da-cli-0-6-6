/*
 * dual-form
 *
 * Authored contract: one row with three cells.
 *   cell 1 — eyebrow, h2/h3, and explanatory copy
 *   cell 2 — link to the stable/bare image
 *   cell 3 — link to the living/evidence-bearing image
 *
 * The paired images are decorative representations of one stable silhouette.
 * Buttons make both states available without pointer precision or motion.
 */

const IMAGE_PATTERN = /\.(?:avif|jpe?g|png|webp)(?:$|[?#])/i;

function imageLink(cell) {
  return [...(cell?.querySelectorAll('a[href]') || [])]
    .find((link) => IMAGE_PATTERN.test(link.href));
}

function classifyCopy(copy) {
  const heading = copy.querySelector('h2, h3');
  let reachedHeading = false;
  [...copy.children].forEach((element) => {
    if (element === heading) reachedHeading = true;
    if (element.tagName !== 'P' || element.classList.contains('button-wrapper')) return;
    element.classList.add(reachedHeading ? 'dual-form-body' : 'dual-form-eyebrow');
  });
}

function buildGeneratedLayer(className) {
  const layer = document.createElement('div');
  layer.className = `dual-form-layer ${className} dual-form-generated`;
  layer.innerHTML = `
    <span class="dual-form-capital"></span>
    <span class="dual-form-shaft"></span>
    <span class="dual-form-base"></span>
    <span class="dual-form-vine"></span>
  `;
  return layer;
}

function buildImageLayer(link, className) {
  if (!link) return buildGeneratedLayer(className);
  const layer = document.createElement('div');
  layer.className = `dual-form-layer ${className}`;
  const image = document.createElement('img');
  image.src = link.href;
  image.alt = '';
  image.loading = 'lazy';
  layer.append(image);
  return layer;
}

function stateButton(label, state, selected) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'dual-form-state-button';
  button.dataset.state = state;
  button.setAttribute('aria-pressed', String(selected));
  button.textContent = label;
  return button;
}

function setState(stage, controls, status, state) {
  stage.dataset.view = state;
  controls.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.state === state));
  });
  const messages = {
    bare: 'Showing the stable operational structure.',
    mixed: 'Showing the same structure with evidence-bearing growth revealed.',
    living: 'Showing the full living, evidence-bearing state.',
  };
  status.textContent = messages[state] || messages.mixed;
}

function armPointerReveal(stage, controls, status) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let frame = 0;
  let nextPosition = null;
  const flush = () => {
    frame = 0;
    if (!nextPosition) return;
    const rect = stage.getBoundingClientRect();
    const x = ((nextPosition.x - rect.left) / rect.width) * 100;
    const y = ((nextPosition.y - rect.top) / rect.height) * 100;
    stage.style.setProperty('--dual-x', `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
    stage.style.setProperty('--dual-y', `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
    setState(stage, controls, status, 'mixed');
    nextPosition = null;
  };

  stage.addEventListener('pointermove', (event) => {
    nextPosition = { x: event.clientX, y: event.clientY };
    if (!frame) frame = window.requestAnimationFrame(flush);
  }, { passive: true });
}

export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const [copyCell, bareCell, livingCell] = [...row.children];

  const copy = document.createElement('div');
  copy.className = 'dual-form-copy';
  if (copyCell) copy.append(...copyCell.childNodes);
  classifyCopy(copy);

  const title = copy.querySelector('h2, h3')?.textContent.trim() || 'Operational structure';
  const bareLink = imageLink(bareCell);
  const livingLink = imageLink(livingCell);

  const stage = document.createElement('div');
  stage.className = 'dual-form-stage';
  stage.dataset.view = 'mixed';
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', `${title}: the same stable form shown bare and as a living evidence-bearing system.`);
  stage.append(
    buildImageLayer(bareLink, 'dual-form-bare'),
    buildImageLayer(livingLink, 'dual-form-living'),
  );

  const annotation = document.createElement('div');
  annotation.className = 'dual-form-annotation';
  annotation.setAttribute('aria-hidden', 'true');
  annotation.innerHTML = '<span>structure</span><span>evidence</span>';
  stage.append(annotation);

  const controls = document.createElement('div');
  controls.className = 'dual-form-controls';
  controls.setAttribute('aria-label', `${title} visual state`);
  const bareButton = stateButton('Structure', 'bare', false);
  const mixedButton = stateButton('Both states', 'mixed', true);
  const livingButton = stateButton('Living proof', 'living', false);
  controls.append(bareButton, mixedButton, livingButton);

  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Showing the same structure with evidence-bearing growth revealed.';

  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-state]');
    if (button) setState(stage, controls, status, button.dataset.state);
  });

  const art = document.createElement('div');
  art.className = 'dual-form-art';
  art.append(stage, controls, status);

  const frame = document.createElement('div');
  frame.className = 'dual-form-frame';
  frame.append(copy, art);
  block.replaceChildren(frame);

  armPointerReveal(stage, controls, status);
}
