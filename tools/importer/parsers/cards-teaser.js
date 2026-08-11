/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser. Base block: cards (variant: teaser).
 * Source: https://wknd.site/us/en (.cmp-image-list) — article/adventure teaser cards.
 *
 * Library (cards): 2 columns. Row 1 = block name. Each subsequent row is one card:
 *   [ image cell , text cell (title heading + description + optional CTA) ].
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(
    ':scope .cmp-image-list__item, :scope .cmp-list__item, :scope li',
  ));

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('img');

    // Title text + its link target.
    const titleEl = item.querySelector(
      '.cmp-image-list__item-title, .cmp-list__item-title, [class*="title"]',
    );
    const titleLink = item.querySelector(
      '.cmp-image-list__item-title-link, .cmp-image-list__item-image-link, a[href]',
    );
    const descEl = item.querySelector(
      '.cmp-image-list__item-description, .cmp-list__item-description, [class*="description"]',
    );

    if (!image && !titleEl && !descEl) return;

    // Build text cell: title (as a link heading if a link exists) + description.
    const textCell = [];
    if (titleEl) {
      const titleText = titleEl.textContent.trim();
      const heading = document.createElement('h3');
      const href = titleLink ? titleLink.getAttribute('href') : null;
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        heading.appendChild(a);
      } else {
        heading.textContent = titleText;
      }
      textCell.push(heading);
    }
    if (descEl && descEl.textContent.trim()) textCell.push(descEl);

    // 2-column card row: [image, text]. Pad any missing cell to keep column count.
    cells.push([image || '', textCell.length ? textCell : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards (teaser)', cells });
  element.replaceWith(block);
}
