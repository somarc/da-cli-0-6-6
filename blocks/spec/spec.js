/*
 * spec
 * Authored contract: key/value rows —
 *   cell 1: field / invariant name
 *   cell 2: description (rich text)
 * Variant `spec (schema)` renders mono keys with an inline type hint.
 * The type hint is parsed from the authored key when it is written as
 * `name: Type` (e.g. "path: string"); a key without a colon still
 * renders correctly, just without a type badge.
 */
export default function decorate(block) {
  const isSchema = block.classList.contains('schema');

  const dl = document.createElement('dl');
  dl.className = 'spec-rows';

  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const keyRaw = keyCell ? keyCell.textContent.trim() : '';
    const hasValue = valueCell && valueCell.textContent.trim();
    if (!keyRaw && !hasValue) return;

    const wrap = document.createElement('div');
    wrap.className = 'spec-row';

    const dt = document.createElement('dt');
    dt.className = 'spec-key';

    if (isSchema) {
      dt.classList.add('spec-key-schema');

      const source = document.createElement('div');
      source.className = 'spec-key-source';
      if (keyCell) source.append(...keyCell.childNodes);
      else source.textContent = '—';
      dt.append(source);

      const match = keyRaw.match(/^(.+?)\s*:\s*(.+)$/);
      if (match) {
        const [, fieldName, fieldType] = match;
        dt.classList.add('spec-key-split');

        const presentation = document.createElement('span');
        presentation.className = 'spec-key-presentation';
        presentation.setAttribute('aria-hidden', 'true');

        const name = document.createElement('code');
        name.className = 'spec-key-name';
        name.textContent = fieldName;

        const type = document.createElement('span');
        type.className = 'spec-key-type';
        type.textContent = fieldType;

        presentation.append(name, type);
        dt.append(presentation);
      }
    } else if (keyCell) {
      dt.append(...keyCell.childNodes);
    } else {
      dt.textContent = '—';
    }

    const dd = document.createElement('dd');
    dd.className = 'spec-value';
    if (valueCell) dd.append(...valueCell.childNodes);

    wrap.append(dt, dd);
    dl.append(wrap);
  });

  block.replaceChildren(dl);
}
