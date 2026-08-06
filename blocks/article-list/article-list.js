import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the article-list block.
 *
 * NOTE (Phase 3): article-list is a DYNAMIC listing block. Its final
 * implementation will read the magazine query index (helix-query.yaml) and
 * render one card per magazine article automatically, so the author only
 * places a single empty `article-list` block on the page.
 *
 * This initial implementation mirrors the vanilla cards decoration so that
 * any statically authored rows (used for local testing / fallback) still
 * render as a card grid. The query-index fetch + render is added in Phase 3.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'article-list-card-image';
      else div.className = 'article-list-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
