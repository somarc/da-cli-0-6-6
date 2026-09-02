/*
 * feature-grid
 * Authored contract: each row is one feature —
 *   cell 1: short title
 *   cell 2: description (rich text)
 * Responsive 1 / 2 / 3 column grid. Rows missing a title, a description,
 * or both authored cells are handled without throwing; a row with no
 * usable content at all is skipped.
 */
export default function decorate(block) {
  const list = document.createElement('div');
  list.className = 'feature-grid-list';

  [...block.children].forEach((row, i) => {
    const [titleCell, descCell] = row.children;
    const hasTitle = titleCell && titleCell.textContent.trim();
    const hasDesc = descCell && descCell.textContent.trim();
    if (!hasTitle && !hasDesc) return;

    const item = document.createElement('div');
    item.className = 'feature-grid-item';

    const index = document.createElement('span');
    index.className = 'feature-grid-index';
    index.textContent = String(i + 1).padStart(2, '0');
    item.append(index);

    if (hasTitle) {
      const title = document.createElement('h3');
      title.className = 'feature-grid-title';
      // titles are short plain text; avoid nesting the auto-wrapped <p>
      // a bare text cell gets from wrapTextNodes inside a heading
      title.textContent = titleCell.textContent.trim();
      item.append(title);
    }

    if (hasDesc) {
      const desc = document.createElement('div');
      desc.className = 'feature-grid-desc';
      desc.append(...descCell.childNodes);
      item.append(desc);
    }

    list.append(item);
  });

  block.replaceChildren(list);
}
