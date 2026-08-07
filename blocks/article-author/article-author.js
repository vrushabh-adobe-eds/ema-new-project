import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const NETWORKS = ['facebook', 'twitter', 'instagram'];

/**
 * article-author
 *
 * Author credit shown at the end of a magazine article.
 *
 * Expected authored structure (1 row, 2 cells):
 *   | [avatar image] | [author name (heading) + role paragraph + social links] |
 *
 * The source renders the fb/twitter/instagram links as sibling paragraphs right
 * after the block, so this decorate() also adopts trailing social-link
 * paragraphs and renders them as dark icon boxes (matching the source).
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
    avatarCell.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });
  }

  if (infoCell) {
    infoCell.className = 'article-author-info';
  }

  // Adopt any social-link paragraphs that the pipeline rendered as siblings
  // AFTER the block (Facebook / Twitter / Instagram), so they live inside it.
  const collectedLinks = [];
  const isSocial = (a) => {
    const t = `${a.getAttribute('aria-label') || ''} ${a.textContent || ''} ${a.getAttribute('href') || ''}`.toLowerCase();
    return NETWORKS.some((n) => t.includes(n));
  };
  // links already inside the info cell
  (infoCell ? [...infoCell.querySelectorAll('a')] : []).forEach((a) => {
    if (isSocial(a)) collectedLinks.push(a);
  });
  // trailing sibling <p><a> social links
  let sib = block.nextElementSibling;
  while (sib && sib.tagName === 'P' && sib.querySelector('a') && isSocial(sib.querySelector('a'))) {
    collectedLinks.push(sib.querySelector('a'));
    const next = sib.nextElementSibling;
    sib.remove();
    sib = next;
  }

  if (collectedLinks.length && infoCell) {
    const social = document.createElement('ul');
    social.className = 'article-author-social';
    collectedLinks.forEach((a) => {
      const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
      const net = NETWORKS.find((n) => `${label} ${a.getAttribute('href') || ''}`.toLowerCase().includes(n));
      const li = document.createElement('li');
      a.className = `article-author-social-link${net ? ` article-author-social-${net}` : ''}`;
      a.setAttribute('aria-label', label || net || 'social');
      a.textContent = '';
      li.append(a);
      social.append(li);
    });
    infoCell.append(social);
  }
}
