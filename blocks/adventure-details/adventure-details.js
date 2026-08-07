/*
 * Adventure Details Block
 * A specification sidebar (Activity, Adventure Type, Trip Length, Group Size,
 * Difficulty, Price). Rendered as a vertical label/value list with a left
 * accent border, matching the source adventure detail page.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const dl = document.createElement('dl');
  dl.className = 'adventure-details-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const item = document.createElement('div');
    item.className = 'adventure-details-item';
    moveInstrumentation(row, item);

    const dt = document.createElement('dt');
    dt.textContent = cells[0].textContent.trim();
    const dd = document.createElement('dd');
    dd.textContent = cells[1].textContent.trim();

    item.append(dt, dd);
    dl.append(item);
  });

  block.replaceChildren(dl);
}
