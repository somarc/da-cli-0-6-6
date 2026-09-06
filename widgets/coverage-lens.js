const ORDER = ['observed', 'unobserved', 'blocked', 'excluded'];

function countsFrom(shell) {
  return Object.fromEntries(ORDER.map((state) => [state, Number(shell.dataset[state]) || 0]));
}

function buildField(field, counts) {
  const fragment = document.createDocumentFragment();
  ORDER.forEach((state) => {
    for (let index = 0; index < counts[state]; index += 1) {
      const mark = document.createElement('span');
      mark.className = `coverage-lens-mark coverage-lens-mark-${state}`;
      mark.dataset.state = state;
      fragment.append(mark);
    }
  });
  field.replaceChildren(fragment);
}

function setFilter(widget, state, counts) {
  widget.dataset.filter = state;
  widget.querySelectorAll('.coverage-lens-controls button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === state));
  });

  const marks = [...widget.querySelectorAll('.coverage-lens-mark')];
  marks.forEach((mark) => {
    mark.classList.toggle('is-muted', state !== 'all' && mark.dataset.state !== state);
  });

  const status = widget.querySelector('.coverage-lens-status');
  status.textContent = state === 'all'
    ? `Showing all ${marks.length} classified command paths.`
    : `Highlighting ${counts[state]} ${state} command ${counts[state] === 1 ? 'path' : 'paths'} out of ${marks.length}.`;
}

export default function decorate(widget) {
  const shell = widget.querySelector('.coverage-lens-shell');
  const field = widget.querySelector('.coverage-lens-field');
  if (!shell || !field) return;

  const counts = countsFrom(shell);
  buildField(field, counts);
  widget.classList.add('is-enhanced');

  widget.querySelector('.coverage-lens-controls')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (button) setFilter(widget, button.dataset.filter, counts);
  });
}
