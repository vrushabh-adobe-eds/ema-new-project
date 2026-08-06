import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Maps a social URL to a network name, used for the accessible label /
 * fallback text-glyph when an author supplies a bare link with no icon.
 */
const NETWORKS = [
  { re: /facebook\.com/i, name: 'Facebook', glyph: 'f' },
  { re: /(twitter\.com|x\.com)/i, name: 'Twitter', glyph: '𝕏' },
  { re: /instagram\.com/i, name: 'Instagram', glyph: '⌾' },
  { re: /youtube\.com|youtu\.be/i, name: 'YouTube', glyph: '▶' },
  { re: /linkedin\.com/i, name: 'LinkedIn', glyph: 'in' },
  { re: /pinterest\.com/i, name: 'Pinterest', glyph: 'P' },
  { re: /tiktok\.com/i, name: 'TikTok', glyph: '♪' },
];

/** Best-effort network match for a given href. */
function matchNetwork(href = '') {
  return NETWORKS.find((n) => n.re.test(href)) || null;
}

/**
 * social-links
 *
 * A reusable row of social-network icon links ("Follow Us"). Mirrors the
 * inline social markup used in the footer so it can be authored anywhere
 * (article footers, sidebars, landing sections).
 *
 * Expected authored structure — flexible:
 *   Optional heading row (single cell of text, e.g. "Follow Us"), followed by
 *   a row containing a <ul> of links (each link may wrap an <img> icon), OR a
 *   set of bare link rows. Icons are optional; a text glyph is used as a
 *   fallback so icon-less links still render.
 *
 *   | Follow Us                              |
 *   | - [icon] https://facebook.com/...      |
 *   |   [icon] https://twitter.com/...       |
 *   |   [icon] https://instagram.com/...     |
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // 1. Pull an optional heading: the first row that has no link is a label.
  let heading = null;
  const rows = [...block.children];
  if (rows.length && !rows[0].querySelector('a')) {
    heading = rows[0].textContent.trim();
    rows[0].remove();
  }

  // 2. Collect every link in remaining rows, preserving author order.
  const links = [...block.querySelectorAll('a')];

  // 3. Rebuild as a clean, accessible list.
  block.textContent = '';

  if (heading) {
    const label = document.createElement('p');
    label.className = 'social-links-label';
    label.textContent = heading;
    block.append(label);
  }

  const ul = document.createElement('ul');
  ul.className = 'social-links-list';

  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const network = matchNetwork(href);
    const labelText = a.getAttribute('title')
      || a.getAttribute('aria-label')
      || (network && network.name)
      || a.textContent.trim()
      || 'Social link';

    const li = document.createElement('li');

    // Strip any authored text so icon boxes stay uniform; keep the label
    // accessible via aria-label.
    const img = a.querySelector('img');
    a.textContent = '';
    a.className = 'social-links-link';
    a.setAttribute('aria-label', labelText);
    if (!a.getAttribute('title')) a.setAttribute('title', labelText);
    // External social links open safely in a new tab.
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }

    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, labelText, false, [{ width: '48' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      a.append(optimizedPic);
    } else {
      // No icon supplied — render a text glyph fallback so the box isn't empty.
      const glyph = document.createElement('span');
      glyph.className = 'social-links-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = (network && network.glyph) || labelText.charAt(0).toUpperCase();
      a.append(glyph);
    }

    li.append(a);
    ul.append(li);
  });

  block.append(ul);
}
