/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base block: columns (variant: featured).
 * Source: https://wknd.site/us/en (.cmp-teaser--featured / #featured-teaser-home)
 *
 * Library (columns): first row = block name; content rows have as many cells as
 * there are visual columns. This featured article teaser is laid out as two columns:
 *   [ text cell (pretitle + title + description + CTA) , image cell ].
 */
export default function parse(element, { document }) {
  const pretitle = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"]');
  const titleEl = element.querySelector('.cmp-teaser__title, [class*="title"] h2, h1, h2, h3');
  const descEl = element.querySelector('.cmp-teaser__description, [class*="description"]');
  const ctas = Array.from(element.querySelectorAll(
    '.cmp-teaser__action-link, a.cmp-button, a.button',
  ));
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image__image, img');

  // Empty-block guard.
  if (!titleEl && !descEl && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Text column: pretitle + title heading + description + CTA links.
  const textCell = [];
  if (pretitle && pretitle.textContent.trim()) textCell.push(pretitle);
  if (titleEl) {
    const heading = document.createElement('h2');
    heading.textContent = titleEl.textContent.trim();
    textCell.push(heading);
  }
  if (descEl && descEl.textContent.trim()) textCell.push(descEl);
  textCell.push(...ctas);

  // Single content row, two columns: [text, image].
  const cells = [[
    textCell.length ? textCell : '',
    image || '',
  ]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns (featured)', cells });
  element.replaceWith(block);
}
