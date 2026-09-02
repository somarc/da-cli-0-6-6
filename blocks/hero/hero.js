/*
 * hero
 * Authored contract:
 *   row 1 (optional): single cell — eyebrow text
 *   row 2: single cell — rich text (h1, paragraph, optional ul of proof
 *          points, optional CTA paragraph of link(s))
 * No photography. The right-hand motif is a transparent Lottie diagram:
 * EDS as the gravitational mass, the official render loop close in, and
 * da-cli's highly elliptical operations loop crossing explicit receipt gates.
 * A semantic, static SVG fallback is always present; Lottie progressively
 * replaces it after the hero copy has rendered.
 */

const LOTTIE_WEB_SRC = '/scripts/vendor/lottie-light-5.12.2.min.js';
const DEFAULT_LOTTIE_PATH = '/media/outer-loop-hero.lottie.json';
const REDUCED_MOTION_FRAME = 150;

let lottieLoader;

function loadLottieWeb() {
  if (window.lottie) return Promise.resolve(window.lottie);
  if (lottieLoader) return lottieLoader;

  lottieLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${window.hlx?.codeBasePath || ''}${LOTTIE_WEB_SRC}`;
    script.async = true;
    script.onload = () => resolve(window.lottie);
    script.onerror = reject;
    document.head.append(script);
  });

  return lottieLoader;
}

function buildFallback() {
  const fallback = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  fallback.classList.add('hero-loop-fallback');
  fallback.setAttribute('viewBox', '0 0 800 800');
  fallback.setAttribute('aria-hidden', 'true');
  fallback.innerHTML = [
    '<ellipse class="hero-loop-guide" cx="400" cy="400" rx="337" ry="151" transform="rotate(-18 400 400)" />',
    '<ellipse class="hero-loop-outer" cx="400" cy="400" rx="318" ry="132" transform="rotate(-18 400 400)" />',
    '<circle class="hero-loop-inner" cx="400" cy="400" r="106" />',
    '<circle class="hero-loop-field" cx="400" cy="400" r="143" />',
    '<circle class="hero-loop-core" cx="400" cy="400" r="89" />',
    '<circle class="hero-loop-core-ring" cx="400" cy="400" r="66" />',
    '<circle class="hero-loop-core-dot" cx="400" cy="400" r="7" />',
    '<circle class="hero-loop-pilot" cx="496" cy="203" r="13" />',
    '<g class="hero-loop-receipts">',
    '<rect x="677" y="285" width="50" height="34" rx="2" transform="rotate(72 702 302)" />',
    '<rect x="416" y="509" width="50" height="34" rx="2" transform="rotate(162 441 526)" />',
    '<rect x="73" y="481" width="50" height="34" rx="2" transform="rotate(252 98 498)" />',
    '<rect x="334" y="258" width="50" height="34" rx="2" transform="rotate(342 359 275)" />',
    '</g>',
  ].join('');
  return fallback;
}

function buildMotif(path) {
  const motif = document.createElement('div');
  motif.className = 'hero-motif';

  const stage = document.createElement('div');
  stage.className = 'hero-lottie-stage';
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'EDS at the center of a close render loop and a deliberate elliptical operations loop, with receipts at each verified boundary crossing.');
  stage.append(buildFallback());

  const mass = document.createElement('div');
  mass.className = 'hero-mass-label';
  mass.innerHTML = '<strong>EDS</strong><span>system mass</span>';

  const innerLabel = document.createElement('span');
  innerLabel.className = 'hero-loop-label hero-loop-label-inner';
  innerLabel.textContent = 'render loop';

  const outerLabel = document.createElement('span');
  outerLabel.className = 'hero-loop-label hero-loop-label-outer';
  outerLabel.textContent = 'operations loop';

  const receiptLabel = document.createElement('span');
  receiptLabel.className = 'hero-loop-label hero-loop-label-receipt';
  receiptLabel.textContent = 'receipt';

  const motionToggle = document.createElement('button');
  motionToggle.className = 'hero-motion-toggle';
  motionToggle.type = 'button';
  motionToggle.textContent = 'Pause orbit';
  motionToggle.disabled = true;

  motif.append(stage, mass, innerLabel, outerLabel, receiptLabel, motionToggle);

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches) {
    motionToggle.remove();
    return motif;
  }

  loadLottieWeb()
    .then((lottie) => {
      if (!lottie) throw new Error('Lottie player unavailable');
      const animation = lottie.loadAnimation({
        container: stage,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
        },
      });
      animation.addEventListener('DOMLoaded', () => {
        stage.querySelector('.hero-loop-fallback')?.remove();
        motif.classList.add('hero-lottie-ready');
        let userPaused = false;
        let observer;
        motionToggle.disabled = false;
        motionToggle.addEventListener('click', () => {
          userPaused = !userPaused;
          if (userPaused) animation.pause();
          else animation.play();
          motionToggle.textContent = userPaused ? 'Play orbit' : 'Pause orbit';
        });
        const stopForReducedMotion = (event) => {
          if (!event.matches) return;
          userPaused = true;
          observer?.disconnect();
          animation.goToAndStop(REDUCED_MOTION_FRAME, true);
          motionToggle.remove();
          motionPreference.removeEventListener('change', stopForReducedMotion);
        };
        motionPreference.addEventListener('change', stopForReducedMotion);
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !userPaused) animation.play();
            else animation.pause();
          });
        }, { threshold: 0.15 });
        observer.observe(motif);
      });
      animation.addEventListener('data_failed', () => {
        motif.classList.add('hero-lottie-failed');
        motionToggle.remove();
      });
    })
    .catch(() => {
      motif.classList.add('hero-lottie-failed');
      motionToggle.remove();
    });

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
  const lottieLink = block.querySelector('a[href$=".lottie.json"]');
  const lottiePath = lottieLink?.href || DEFAULT_LOTTIE_PATH;
  if (lottieLink) {
    const parent = lottieLink.parentElement;
    if (parent?.textContent.trim() === lottieLink.textContent.trim()) parent.remove();
    else lottieLink.remove();
  }

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

  block.replaceChildren(content, buildMotif(lottiePath));
}
