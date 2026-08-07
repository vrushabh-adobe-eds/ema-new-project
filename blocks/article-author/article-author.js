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

  // The pipeline renders the social links as sibling <p><a> AFTER the block —
  // either directly after it, or (because EDS wraps each block) in the next
  // .default-content-wrapper. Adopt whichever we find, removing the now-empty
  // source paragraphs/wrappers.
  const adoptFrom = (container, stopAtBlock) => {
    if (!container) return;
    let node = stopAtBlock ? block.nextElementSibling : container.firstElementChild;
    while (node && node.tagName === 'P' && node.querySelector('a') && isSocial(node.querySelector('a'))) {
      collectedLinks.push(node.querySelector('a'));
      const next = node.nextElementSibling;
      node.remove();
      node = next;
    }
  };
  // (a) directly after the block within the same wrapper
  adoptFrom(block.parentElement, true);
  // (b) the wrapper that immediately follows the block's wrapper
  const wrapper = block.closest('.article-author-wrapper') || block.parentElement;
  const nextWrapper = wrapper ? wrapper.nextElementSibling : null;
  if (collectedLinks.length === 0 && nextWrapper) {
    adoptFrom(nextWrapper, false);
    // remove the wrapper if it's now empty
    if (nextWrapper.children.length === 0) nextWrapper.remove();
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
    // Append to the row (flex parent), not the info column, so the social bar
    // sits as a top-level cell — top-aligned with the name row and pushed far
    // right (matches the source layout).
    row.append(social);
  }
}
