/* Decorative wide-screen dual-state pillars for pages using the living theme. */

const MIN_WIDTH = 1180;

function makeGutter(side) {
  const gutter = document.createElement('div');
  gutter.className = `living-gutter living-gutter-${side}`;
  gutter.setAttribute('aria-hidden', 'true');
  gutter.innerHTML = `
    <div class="living-gutter-layer living-gutter-bare"></div>
    <div class="living-gutter-layer living-gutter-grown"></div>
  `;
  return gutter;
}

export default function initLivingGutters() {
  if (document.querySelector('.living-gutter')) return;
  if (!document.body.classList.contains('living')) return;

  const viewport = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let gutters = [];
  let frame = 0;
  let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  const paint = () => {
    frame = 0;
    const x = Math.max(0, Math.min(100, (pointer.x / window.innerWidth) * 100));
    const y = Math.max(0, Math.min(100, (pointer.y / window.innerHeight) * 100));
    gutters.forEach((gutter) => {
      const mirroredX = gutter.classList.contains('living-gutter-right') ? 100 - x : x;
      gutter.style.setProperty('--gutter-x', `${mirroredX.toFixed(2)}%`);
      gutter.style.setProperty('--gutter-y', `${y.toFixed(2)}%`);
    });
  };

  const onPointerMove = (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!frame) frame = window.requestAnimationFrame(paint);
  };

  const remove = () => {
    gutters.forEach((gutter) => gutter.remove());
    gutters = [];
    window.removeEventListener('pointermove', onPointerMove);
  };

  const add = () => {
    if (gutters.length || !viewport.matches) return;
    gutters = [makeGutter('left'), makeGutter('right')];
    document.body.append(...gutters);
    if (!reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    } else {
      gutters.forEach((gutter) => gutter.classList.add('is-static'));
    }
  };

  const reconcile = () => {
    if (viewport.matches) add();
    else remove();
  };

  viewport.addEventListener('change', reconcile);
  reducedMotion.addEventListener('change', () => {
    remove();
    add();
  });
  reconcile();
}
