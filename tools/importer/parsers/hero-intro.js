/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-intro. Base block: hero (variant: intro).
 * Source: https://wknd.site/us/en/adventures.html (#teaser-e27d55d295 / .cmp-teaser--hero)
 *
 * Library (hero): 1 column, up to 3 rows. Row 1 = block name.
 *   Row 2 (single cell) = background image (optional).
 *   Row 3 (single cell) = title heading + subheading + CTA (optional).
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image__image, img');
  const titleEl = element.querySelector('.cmp-teaser__title, .cmp-title__text, h1, h2, h3');
  const descEl = element.querySelector('.cmp-teaser__description, [class*="description"], p');
  const ctas = Array.from(element.querySelectorAll(
    '.cmp-teaser__action-link, a.cmp-button, a.button',
  ));

  // Empty-block guard.
  if (!image && !titleEl && !descEl && ctas.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (only if present).
  if (image) cells.push([image]);

  // Row 3: title + subheading + CTA in a single cell.
  const contentCell = [];
  if (titleEl) {
    const heading = document.createElement('h1');
    heading.textContent = titleEl.textContent.trim();
    contentCell.push(heading);
  }
  if (descEl && descEl.textContent.trim()) contentCell.push(descEl);
  contentCell.push(...ctas);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (intro)', cells });
  element.replaceWith(block);
}
