import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * Cards — base block with two variants:
 *   Cards            → generic image + text card grid (boilerplate).
 *   Cards (teaser)   → WKND article/adventure teaser grid (uppercase clamped
 *                      titles, borderless). Was cards-teaser.
 *   Cards (related)  → compact "up next" list (linked title + date, no image).
 *                      Was cards-related.
 *
 * NOTE: the dynamic query-index listings (article-list, contributors) are NOT
 * part of this block — they remain their own query-index-driven blocks.
 *
 * Each variant path swaps the block to its legacy identity (`cards-teaser` /
 * `cards-related`), removing the base `cards`/variant classes so the base
 * `.cards` rules don't apply, and uses the legacy sub-element class names — so
 * all existing styling matches byte-for-byte.
 */

function buildCards(block, prefix) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = `${prefix}-card-image`;
      else div.className = `${prefix}-card-body`;
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}

export default function decorate(block) {
  let prefix = 'cards';
  const teaser = block.classList.contains('teaser');
  const related = block.classList.contains('related');

  if (teaser || related) {
    const legacy = teaser ? 'cards-teaser' : 'cards-related';
    const variantClass = teaser ? 'teaser' : 'related';
    // Swap to legacy variant identity so base `.cards` rules don't apply.
    block.classList.add(legacy);
    block.classList.remove('cards', variantClass);
    if (block.parentElement) block.parentElement.classList.add(`${legacy}-wrapper`);
    const section = block.closest('.section');
    if (section) section.classList.add(`${legacy}-container`);
    prefix = legacy;
  }

  buildCards(block, prefix);
}
