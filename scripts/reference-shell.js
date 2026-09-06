const GROUPS = [
  ['Orient', ['status', 'resolve', 'auth', 'config', 'workspace', 'up']],
  ['Source + model', ['content', 'block', 'route', 'site']],
  ['Deliver', ['preview', 'publish', 'deploy', 'code']],
  ['Prove', ['audit', 'design', 'index', 'sitemap']],
  ['Orchestrate', ['job', 'pipeline', 'migrate']],
  ['Extend', ['commerce', 'skills', 'stardust']],
];

const LABELS = {
  status: 'Status',
  resolve: 'Target resolution',
  up: 'Local runtime',
  auth: 'Authentication',
  config: 'Configuration',
  workspace: 'Workspace',
  content: 'Content',
  block: 'Blocks',
  route: 'Routes',
  site: 'Sites',
  preview: 'Preview',
  publish: 'Publish',
  deploy: 'Deploy',
  code: 'Code bus',
  audit: 'Audits',
  design: 'Design',
  index: 'Indexes',
  sitemap: 'Sitemaps',
  job: 'Jobs',
  pipeline: 'Pipelines',
  migrate: 'Migration',
  commerce: 'Commerce',
  skills: 'Skills',
  stardust: 'Stardust',
};

function normalizedPath(path) {
  return path.replace(/\/index(?:\.html)?$/, '').replace(/\.html$/, '') || '/';
}

function familyPath(family) {
  const slug = family === 'index' ? 'indexes' : family;
  return `/reference/0.6.6/families/${slug}`;
}

function familyLink(family) {
  const link = document.createElement('a');
  link.href = familyPath(family);
  link.textContent = LABELS[family] || family;
  const current = normalizedPath(window.location.pathname);
  const commandFamily = current.match(/^\/reference\/0\.6\.6\/commands\/([^/]+)/)?.[1];
  if (normalizedPath(link.pathname) === current || commandFamily === family) {
    link.setAttribute('aria-current', 'page');
  }
  return link;
}

function buildGlobalNav() {
  const aside = document.createElement('aside');
  aside.className = 'reference-shell-nav';
  aside.id = 'reference-shell-nav';
  aside.setAttribute('aria-label', 'Command reference');

  const head = document.createElement('div');
  head.className = 'reference-shell-head';
  const label = document.createElement('span');
  label.textContent = 'Filed reference';
  const title = document.createElement('a');
  title.href = '/reference';
  title.textContent = '138 command paths';
  head.append(label, title);
  aside.append(head);

  const shared = document.createElement('section');
  const sharedHeading = document.createElement('h2');
  sharedHeading.textContent = 'Shared contracts';
  const sharedList = document.createElement('ul');
  [
    ['Global invocation', '/reference/0.6.6/global-options'],
    ['Machine output', '/reference/0.6.6/machine-output'],
    ['Pipeline YAML', '/reference/0.6.6/pipeline-language'],
  ].forEach(([name, href]) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = href;
    link.textContent = name;
    if (normalizedPath(link.pathname) === normalizedPath(window.location.pathname)) {
      link.setAttribute('aria-current', 'page');
    }
    item.append(link);
    sharedList.append(item);
  });
  shared.append(sharedHeading, sharedList);
  aside.append(shared);

  GROUPS.forEach(([name, families]) => {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = name;
    const list = document.createElement('ul');
    families.forEach((family) => {
      const item = document.createElement('li');
      item.append(familyLink(family));
      list.append(item);
    });
    section.append(heading, list);
    aside.append(section);
  });

  const all = document.createElement('a');
  all.className = 'reference-shell-all';
  all.href = '/reference/0.6.6/commands';
  all.textContent = 'Search all commands →';
  if (normalizedPath(all.pathname) === normalizedPath(window.location.pathname)) {
    all.setAttribute('aria-current', 'page');
  }
  aside.append(all);
  return aside;
}

function buildLocalNav() {
  const headings = [...document.querySelectorAll('main h2')]
    .filter((heading) => !heading.closest('.command-reference'));
  if (headings.length < 2) return null;

  const aside = document.createElement('aside');
  aside.className = 'reference-shell-local';
  aside.setAttribute('aria-label', 'On this page');
  const label = document.createElement('strong');
  label.textContent = 'On this page';
  const list = document.createElement('ol');
  headings.slice(0, 18).forEach((heading, index) => {
    if (!heading.id) heading.id = `section-${index + 1}`;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  });
  aside.append(label, list);
  return aside;
}

function setOpen(nav, toggle, open, restoreFocus = false) {
  document.body.classList.toggle('reference-nav-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Close reference' : 'Browse reference';
  nav.setAttribute('aria-hidden', String(!open && window.innerWidth < 1180));
  document.querySelectorAll('body > header, body > main, body > footer').forEach((element) => {
    element.inert = open;
  });
  if (open) (nav.querySelector('[aria-current="page"]') || nav.querySelector('a, button'))?.focus();
  else if (restoreFocus) toggle.focus();
}

export default function initReferenceShell() {
  if (!document.body.classList.contains('reference')) return;
  if (document.querySelector('.reference-shell-nav')) return;

  const nav = buildGlobalNav();
  const local = buildLocalNav();
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'reference-shell-toggle';
  toggle.setAttribute('aria-controls', nav.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = 'Browse reference';
  toggle.addEventListener('click', () => {
    setOpen(nav, toggle, !document.body.classList.contains('reference-nav-open'), true);
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'reference-shell-close';
  close.setAttribute('aria-label', 'Close command reference navigation');
  close.textContent = '×';
  close.addEventListener('click', () => setOpen(nav, toggle, false, true));
  nav.prepend(close);

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'reference-shell-backdrop';
  backdrop.setAttribute('aria-label', 'Close command reference navigation');
  backdrop.addEventListener('click', () => setOpen(nav, toggle, false, true));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('reference-nav-open')) {
      setOpen(nav, toggle, false, true);
    } else if (event.key === 'Tab' && document.body.classList.contains('reference-nav-open')) {
      const focusable = [...nav.querySelectorAll('a[href], button:not([disabled])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  window.matchMedia('(min-width: 1180px)').addEventListener('change', () => {
    setOpen(nav, toggle, false);
  });

  document.body.append(nav, backdrop, toggle);
  if (local) document.body.append(local);
  setOpen(nav, toggle, false);
}
