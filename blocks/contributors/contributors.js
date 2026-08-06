import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * contributors
 *
 * A cards-style grid of person profiles (contributors / travel guides).
 * Based on the vanilla `cards` block.
 *
 * Expected authored structure (one row per person, 2 cells):
 *   | [avatar image] | [name (heading) + role + social links] |
 *
 * The per-person social links (e.g. Facebook / Twitter / Instagram) live in the
 * body cell as normal links; they are grouped into a social list and decorated
 * in place rather than modeled as a separate block.
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
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'contributors-card-image';
      else div.className = 'contributors-card-body';
    });

    // Group any links in the body into a social-links list decorated in place.
    const body = li.querySelector('.contributors-card-body');
    if (body) {
      const links = [...body.querySelectorAll('a')];
      if (links.length) {
        const social = document.createElement('ul');
        social.className = 'contributors-card-social';
        links.forEach((a) => {
          const item = document.createElement('li');
          a.classList.add('contributors-card-social-link');
          // Preserve the label as accessible text if the visual is icon-only.
          if (!a.getAttribute('aria-label') && a.textContent.trim()) {
            a.setAttribute('aria-label', a.textContent.trim());
          }
          item.append(a);
          social.append(item);
        });
        body.append(social);
      }
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
