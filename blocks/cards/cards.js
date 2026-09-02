/*
 * cards
 * Release-proof artifact cards — no photography in this design.
 * Two authored contracts are accepted:
 *
 *   3-cell row (legacy):
 *     cell 1: title (short plain text)
 *     cell 2: body (rich text)
 *     cell 3 (optional): link — must contain an authored hyperlink
 *
 *   1-cell row (rich):
 *     a single cell holding a heading (the title), rich body content,
 *     and — optionally — a trailing paragraph made only of one or more
 *     links (separated by plain punctuation such as "·"), which becomes
 *     the card footer.
 *
 * Malformed rows degrade gracefully: a row with no title and no body
 * is dropped; a footer only renders when an authored link exists;
 * authored links inside the body are preserved as-is.
 *
 * Variants:
 *   docket — numbered filing entries for evidence trails (see
 *            cards.css). Numbering is CSS-counter based, so the
 *            decorated markup is identical across variants.
 */

/** A paragraph that contains links and nothing else except separators. */
function isFooterParagraph(el) {
  if (!el || el.tagName !== 'P') return false;
  if (!el.querySelector('a')) return false;
  const clone = el.cloneNode(true);
  clone.querySelectorAll('a').forEach((a) => a.remove());
  return !clone.textContent.replace(/[\s·•|,;/–—-]+/g, '');
}

/** Split a single rich cell into heading, body nodes, and footer links. */
function parseRichCell(cell) {
  const nodes = [...cell.children];
  const headingIndex = nodes.findIndex((n) => /^H[1-6]$/.test(n.tagName));
  const heading = headingIndex >= 0 ? nodes[headingIndex] : null;
  const rest = nodes.filter((_, i) => i !== headingIndex);
  const footer = rest.length && isFooterParagraph(rest[rest.length - 1]) ? rest.pop() : null;
  return {
    heading,
    bodyNodes: rest,
    links: footer ? [...footer.querySelectorAll('a')] : [],
  };
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    let heading = null;
    let titleText = '';
    let bodyNodes = [];
    let links = [];

    if (cells.length === 1) {
      ({ heading, bodyNodes, links } = parseRichCell(cells[0]));
      titleText = heading ? heading.textContent.trim() : '';
    } else {
      const [titleCell, bodyCell, linkCell] = cells;
      titleText = titleCell ? titleCell.textContent.trim() : '';
      if (bodyCell && bodyCell.textContent.trim()) bodyNodes = [...bodyCell.childNodes];
      const link = linkCell ? linkCell.querySelector('a') : null;
      if (link) links = [link];
    }

    const hasBody = bodyNodes.some((n) => n.textContent.trim());
    if (!titleText && !hasBody) return;

    const li = document.createElement('li');
    li.className = 'cards-card';

    if (titleText) {
      const title = document.createElement('h3');
      title.className = 'cards-card-title';
      if (heading) {
        // preserve the authored anchor id and inline markup (<code>, …)
        if (heading.id) title.id = heading.id;
        title.append(...heading.childNodes);
      } else {
        // bare text cells arrive wrapped in a <p>; avoid nesting it
        title.textContent = titleText;
      }
      li.append(title);
    }

    if (hasBody) {
      const body = document.createElement('div');
      body.className = 'cards-card-body';
      body.append(...bodyNodes);
      li.append(body);
    }

    if (links.length) {
      const footer = document.createElement('div');
      footer.className = 'cards-card-links';
      links.forEach((link) => {
        const a = document.createElement('a');
        a.className = 'cards-card-link';
        a.href = link.href;
        a.textContent = link.textContent.trim() || 'View';
        if (link.title) a.title = link.title;
        footer.append(a);
      });
      li.append(footer);
    }

    ul.append(li);
  });

  block.replaceChildren(ul);
}
