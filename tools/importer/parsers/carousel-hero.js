/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base block: carousel (variant: hero).
 * Source: https://wknd.site/us/en (.cmp-carousel--hero)
 *
 * Library (carousel): 2 columns. Row 1 = block name. Each subsequent row = one slide:
 *   [ image cell (mandatory) , text cell (title heading + description + CTA) ].
 * Each hero slide wraps a teaser with an image plus title/description/CTA.
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll(
    ':scope .cmp-carousel__item, :scope [class*="carousel__item"]',
  ));

  const cells = [];

  slides.forEach((slide) => {
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image__image, img');

    const titleEl = slide.querySelector('.cmp-teaser__title, .cmp-carousel__title, h1, h2, h3');
    const descEl = slide.querySelector('.cmp-teaser__description, [class*="description"]');
    const ctas = Array.from(slide.querySelectorAll(
      '.cmp-teaser__action-link, a.cmp-button, a.button',
    ));

    if (!image && !titleEl && !descEl && ctas.length === 0) return;

    // Build the text cell: title heading + description + CTA links.
    const textCell = [];
    if (titleEl) {
      const heading = document.createElement('h2');
      heading.textContent = titleEl.textContent.trim();
      textCell.push(heading);
    }
    if (descEl && descEl.textContent.trim()) textCell.push(descEl);
    textCell.push(...ctas);

    // 2-column slide row: [image, text]. Pad missing cells to keep column count.
    cells.push([image || '', textCell.length ? textCell : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
