/*
 * painterly-hero
 *
 * Authored contract: one row with two cells.
 *   cell 1 — eyebrow, one h1, supporting copy, and optional CTA links
 *   cell 2 — a poster-image link followed by optional .webm and .mp4 links
 *
 * The authored copy is always the source of meaning. Media is a decorative,
 * silent enhancement: the poster owns first paint and motion starts only when
 * it is allowed, ready, and onscreen.
 */

const IMAGE_PATTERN = /\.(?:avif|jpe?g|png|webp)(?:$|[?#])/i;
const VIDEO_PATTERN = /\.(?:mp4|webm)(?:$|[?#])/i;

function classifyCopy(copy) {
  const heading = copy.querySelector('h1');
  let headingReached = false;

  [...copy.children].forEach((element) => {
    if (element === heading) headingReached = true;
    if (element.tagName !== 'P') return;

    if (!headingReached && !element.classList.contains('button-wrapper')) {
      element.classList.add('painterly-hero-eyebrow');
    } else if (!element.classList.contains('button-wrapper')) {
      element.classList.add('painterly-hero-lede');
    }
  });

  const buttonRows = [...copy.querySelectorAll(':scope > .button-wrapper')];
  if (buttonRows.length) {
    const actions = document.createElement('div');
    actions.className = 'painterly-hero-actions';
    buttonRows[0].before(actions);
    buttonRows.forEach((row) => actions.append(row));
  }
}

function mediaLinks(cell) {
  const links = cell ? [...cell.querySelectorAll('a[href]')] : [];
  return {
    poster: links.find((link) => IMAGE_PATTERN.test(link.href))?.href || '',
    videos: links.filter((link) => VIDEO_PATTERN.test(link.href)).map((link) => link.href),
  };
}

function buildFallbackArt() {
  const fallback = document.createElement('div');
  fallback.className = 'painterly-hero-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  fallback.innerHTML = `
    <span class="painterly-hero-arch painterly-hero-arch-a"></span>
    <span class="painterly-hero-arch painterly-hero-arch-b"></span>
    <span class="painterly-hero-core"></span>
    <span class="painterly-hero-growth"></span>
    <span class="painterly-hero-receipt painterly-hero-receipt-a"></span>
    <span class="painterly-hero-receipt painterly-hero-receipt-b"></span>
    <span class="painterly-hero-receipt painterly-hero-receipt-c"></span>
  `;
  return fallback;
}

function makeMotionControl(video) {
  const button = document.createElement('button');
  button.className = 'painterly-hero-motion';
  button.type = 'button';
  button.disabled = true;
  button.setAttribute('aria-pressed', 'false');
  button.textContent = 'Pause motion';

  let userPaused = false;
  const update = () => {
    button.setAttribute('aria-pressed', String(userPaused));
    button.textContent = userPaused ? 'Play motion' : 'Pause motion';
  };

  button.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) video.pause();
    else video.play().catch(() => {});
    update();
  });

  return {
    button,
    enable() { button.disabled = false; },
    isPaused() { return userPaused; },
    stop() {
      userPaused = true;
      video.pause();
      update();
    },
  };
}

function buildMedia(poster, videoSources) {
  const stage = document.createElement('div');
  stage.className = 'painterly-hero-stage';

  const wash = document.createElement('div');
  wash.className = 'painterly-hero-wash';
  wash.setAttribute('aria-hidden', 'true');
  stage.append(wash, buildFallbackArt());

  if (poster) {
    const image = document.createElement('img');
    image.className = 'painterly-hero-poster';
    image.src = poster;
    image.alt = '';
    image.loading = 'eager';
    image.fetchPriority = 'high';
    image.addEventListener('load', () => stage.classList.add('has-poster'), { once: true });
    stage.append(image);
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!videoSources.length || reducedMotion.matches) return stage;

  const video = document.createElement('video');
  video.className = 'painterly-hero-video';
  video.setAttribute('aria-hidden', 'true');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  if (poster) video.poster = poster;
  videoSources
    .sort((sourceA, sourceB) => Number(/\.webm(?:$|[?#])/i.test(sourceB))
      - Number(/\.webm(?:$|[?#])/i.test(sourceA)))
    .forEach((videoSrc) => {
      const source = document.createElement('source');
      source.src = videoSrc;
      source.type = videoSrc.match(/\.webm(?:$|[?#])/i) ? 'video/webm' : 'video/mp4';
      video.append(source);
    });

  const motion = makeMotionControl(video);
  stage.append(video, motion.button);

  video.addEventListener('canplay', () => {
    stage.classList.add('has-video');
    motion.enable();
  }, { once: true });

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !motion.isPaused()) video.play().catch(() => {});
    else video.pause();
  }, { threshold: 0.12 });
  observer.observe(stage);

  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    motion.stop();
    video.remove();
    motion.button.remove();
    stage.classList.remove('has-video');
  }, { once: true });

  return stage;
}

export default function decorate(block) {
  const rows = [...block.children];
  const firstRow = rows[0];
  if (!firstRow) return;

  const cells = [...firstRow.children];
  const copyCell = cells[0] || firstRow;
  const mediaCell = cells[1] || rows[1]?.firstElementChild;
  const { poster, videos } = mediaLinks(mediaCell);

  const copy = document.createElement('div');
  copy.className = 'painterly-hero-copy';
  copy.append(...copyCell.childNodes);
  classifyCopy(copy);

  const frame = document.createElement('div');
  frame.className = 'painterly-hero-frame';
  frame.append(buildMedia(poster, videos), copy);

  const index = document.createElement('div');
  index.className = 'painterly-hero-index';
  index.setAttribute('aria-hidden', 'true');
  index.innerHTML = '<span>ORIENT</span><span>SOURCE</span><span>PREVIEW</span><span>PROVE</span><span>PUBLISH</span><span>RECONCILE</span>';

  block.replaceChildren(frame, index);
}
