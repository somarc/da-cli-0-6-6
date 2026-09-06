const SELECTOR = '.operation-map-gates > li';

function selectGate(widget, item, announce = true) {
  const items = [...widget.querySelectorAll(SELECTOR)];
  const stage = widget.querySelector('.operation-map-orbit');
  const status = widget.querySelector('.operation-map-status');
  const index = items.indexOf(item);

  items.forEach((candidate, candidateIndex) => {
    const selected = candidate === item;
    const button = candidate.querySelector('button');
    const detail = candidate.querySelector('.operation-map-detail');
    candidate.classList.toggle('is-selected', selected);
    button.setAttribute('aria-expanded', String(selected));
    button.setAttribute('aria-current', selected ? 'step' : 'false');
    detail.hidden = !selected;
    if (selected) detail.removeAttribute('inert');
    else detail.setAttribute('inert', '');
    button.dataset.index = candidateIndex;
  });

  stage?.style.setProperty('--gate-index', index);
  if (stage) stage.dataset.gate = item.dataset.gate;
  if (announce && status) {
    status.textContent = `${item.querySelector('button').textContent.trim()} selected. ${item.querySelector('strong').textContent}`;
  }
}

export default function decorate(widget) {
  const items = [...widget.querySelectorAll(SELECTOR)];
  if (!items.length) return;

  widget.classList.add('is-enhanced');
  items.forEach((item, index) => {
    const button = item.querySelector('button');
    const detail = item.querySelector('.operation-map-detail');
    const detailId = `operation-map-${item.dataset.gate}-${index}`;
    detail.id = detailId;
    button.setAttribute('aria-controls', detailId);
    button.addEventListener('click', () => selectGate(widget, item));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = items.length - 1;
      const next = items[nextIndex];
      selectGate(widget, next);
      next.querySelector('button').focus();
    });
  });

  const requested = widget.dataset.gate;
  const initial = items.find((item) => item.dataset.gate === requested) || items[0];
  selectGate(widget, initial, false);
}
