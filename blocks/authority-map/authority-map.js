/*
 * authority-map
 * Authored contract: each row has four cells —
 *   1. surface name
 *   2. authority role
 *   3. what the surface owns (rich text)
 *   4. the boundary it must never cross (rich text)
 *
 * Authored semantic nodes are moved intact into stable generated owners so
 * Canvas quick-edit identity is retained.
 */

function moveContent(cell, owner) {
  if (cell) owner.append(...cell.childNodes);
}

export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'authority-map-list';

  [...block.children].forEach((row, index) => {
    const [nameCell, roleCell, ownsCell, refusesCell] = row.children;
    if (![...row.children].some((cell) => cell.textContent.trim())) return;

    const item = document.createElement('li');
    item.className = 'authority-map-lane';

    const number = document.createElement('span');
    number.className = 'authority-map-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');

    const name = document.createElement('div');
    name.className = 'authority-map-name';
    name.setAttribute('role', 'heading');
    name.setAttribute('aria-level', '3');
    moveContent(nameCell, name);

    const role = document.createElement('div');
    role.className = 'authority-map-role';
    moveContent(roleCell, role);

    const owns = document.createElement('div');
    owns.className = 'authority-map-detail authority-map-owns';
    const ownsLabel = document.createElement('span');
    ownsLabel.className = 'authority-map-detail-label';
    ownsLabel.textContent = 'owns';
    const ownsCopy = document.createElement('div');
    ownsCopy.className = 'authority-map-detail-copy';
    moveContent(ownsCell, ownsCopy);
    owns.append(ownsLabel, ownsCopy);

    const refuses = document.createElement('div');
    refuses.className = 'authority-map-detail authority-map-refuses';
    const refusesLabel = document.createElement('span');
    refusesLabel.className = 'authority-map-detail-label';
    refusesLabel.textContent = 'never';
    const refusesCopy = document.createElement('div');
    refusesCopy.className = 'authority-map-detail-copy';
    moveContent(refusesCell, refusesCopy);
    refuses.append(refusesLabel, refusesCopy);

    item.append(number, name, role, owns, refuses);
    list.append(item);
  });

  block.replaceChildren(list);
}
