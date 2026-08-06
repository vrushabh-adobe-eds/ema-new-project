/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-list — DYNAMIC, reusable listing block with graceful fallback.
 * Sources:
 *   - Recent Articles (homepage) / Magazine landing → magazine query index
 *   - "Where do you want to go?" (homepage) / Adventures landing → adventures query index
 *
 * article-list is a dynamic block: at render time it reads the query index and
 * builds the cards itself. The parser emits a minimal config table:
 *   row 1: the limit (number of cards to show; 4 on the homepage)
 *   row 2: the query-index path for the collection to list
 * followed by the source cards as STATIC FALLBACK rows ([image, title+desc]).
 *
 * When the query index is available the block ignores the fallback rows and
 * renders from the index; if the index is briefly unavailable (e.g. a newly
 * added index still propagating) it degrades to the authored cards instead of
 * rendering an empty section. Config rows carry no image, so the block's
 * fallback (which only builds cards from image-bearing rows) never mistakes
 * them for cards.
 *
 * The collection is detected from the first card's link (…/magazine/… vs
 * …/adventures/…) so the same parser drives both homepage grids.
 */
export default function parse(element, { document }) {
  const firstLink = element.querySelector('a[href]');
  const href = firstLink ? firstLink.getAttribute('href') : '';

  let indexPath = '/us/en/magazine/query-index.json';
  if (/\/adventures\//.test(href)) indexPath = '/us/en/adventures/query-index.json';

  // Homepage grids show 4 cards.
  const cells = [['4'], [indexPath]];

  // Static fallback cards (only used if the index is unavailable at render time).
  const items = Array.from(element.querySelectorAll(
    ':scope .cmp-image-list__item, :scope .cmp-list__item, :scope li',
  ));
  items.forEach((item) => {
    const image = item.querySelector('img');
    const titleEl = item.querySelector(
      '.cmp-image-list__item-title, .cmp-list__item-title, [class*="title"]',
    );
    const titleLink = item.querySelector(
      '.cmp-image-list__item-title-link, .cmp-image-list__item-image-link, a[href]',
    );
    const descEl = item.querySelector(
      '.cmp-image-list__item-description, .cmp-list__item-description, [class*="description"]',
    );
    if (!image) return;

    const textCell = [];
    if (titleEl) {
      const heading = document.createElement('h3');
      const linkHref = titleLink ? titleLink.getAttribute('href') : null;
      if (linkHref) {
        const a = document.createElement('a');
        a.setAttribute('href', linkHref);
        a.textContent = titleEl.textContent.trim();
        heading.appendChild(a);
      } else {
        heading.textContent = titleEl.textContent.trim();
      }
      textCell.push(heading);
    }
    if (descEl && descEl.textContent.trim()) textCell.push(descEl);

    cells.push([image, textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}
