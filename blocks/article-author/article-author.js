import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * article-author
 *
 * Author credit shown at the end of a magazine article.
 *
 * Expected authored structure (1 row, 2 cells):
 *   | [avatar image] | [author name (heading) + role paragraph + social links] |
 *
 * The social links (e.g. Facebook / Twitter / Instagram) live in the second
 * cell as normal links; they are decorated in place here rather than modeled as
 * a separate block.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];
  const avatarCell = cells[0];
  const infoCell = cells[1];

  if (avatarCell) {
    avatarCell.className = 'article-author-avatar';
    // Optimize the avatar image
    avatarCell.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });
  }

  if (infoCell) {
    infoCell.className = 'article-author-info';

    // Collect any links into a social-links list. Links that carry an icon
    // (span with a modifier class) or that point to a social network are
    // grouped together at the end of the info cell.
    const links = [...infoCell.querySelectorAll('a')];
    if (links.length) {
      const social = document.createElement('ul');
      social.className = 'article-author-social';
      links.forEach((a) => {
        const li = document.createElement('li');
        a.classList.add('article-author-social-link');
        // Preserve the label as accessible text if the visual is icon-only
        if (!a.getAttribute('aria-label') && a.textContent.trim()) {
          a.setAttribute('aria-label', a.textContent.trim());
        }
        li.append(a);
        social.append(li);
      });
      infoCell.append(social);
    }
  }
}
